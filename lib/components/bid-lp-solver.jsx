/** @jsx React.DOM */


import d3 from 'd3';

import _ from 'lodash';

import Immutable from 'immutable';




function transpose(a) {
  return a[0].map(function (_, c) { return a.map(function (r) { return r[c]; }); });
}


function roundToTwo(decimal_num) {
	return Math.round(100*decimal_num)/100;
}



function genIDMatrix(states) {
	var id_matrix = states.map((q,i) => {
		return states.map((l,j) => (i==j) ? 1 : 0);
	});
	return id_matrix;
}




function generateBidLine(states, quantity, price_offset) {

	// uniform initial prices for default atomic bids
	var uniform_price = 1/states.length;
	var bid_prices = states.map((q) => roundToTwo(uniform_price - price_offset) );

	// uniform default quantities
	var bid_quantities = bid_prices.map((p,i) => quantity);

	return {'prices':bid_prices, 'quantities':bid_quantities};
}





function generateMMbids(bid_vector) {
	var states = new Array(bid_vector.length).fill(0);
	var bid_matrix = genIDMatrix(states); // default atomic bids


	// generates 5 lines. this means bids at 5 different price levels (0 to 10%)
	// from 0 to 20 works best when bid_vector.length == 5
	//var line_price_offsets = d3.range(0, 20, 4).map((p) => p/100 );

	// d3.range(0, 20, 3) = [0, 3, 6, 9, 12, 15, 18];  7 price levels.
	// each offset is subtracted from the uniform price to get the price level
	var line_price_offsets = d3.range(0, 20, 3).map((p) => p/100 );

	var bid_quantity = 20;
	var line_count = line_price_offsets.length;

	// increase the bid size at each price level
	//var line_quantities = line_price_offsets.map((p,i) => roundToTwo((i+1)/line_count)*bid_quantity);
	//var bid_lines = line_price_offsets.map((price_offset, i) =>  generateBidLine(states, line_quantities[i], price_offset) )

	// constant bid size
	var bid_lines = line_price_offsets.map((price_offset, i) =>  generateBidLine(states, bid_quantity, price_offset) )

	var mm_bid_matrix = bid_lines.reduce((memo, bl, i) => {
		var id_matrix = genIDMatrix(states);
		return memo.concat(id_matrix); // concat individual rows, not entire table concat([id_matrix])
	}, []);

	var mm_bid_prices = bid_lines.reduce((memo, bid_line, i) => {
		return memo.concat(bid_line.prices);
	}, []);

	var mm_bid_quantities = bid_lines.reduce((memo, bid_line, i) => {
		return memo.concat(bid_line.quantities);
	}, []);



	return {'bid_matrix':mm_bid_matrix, 'bid_prices':mm_bid_prices, 'bid_quantities':mm_bid_quantities};
}



function transformBidLinesToDataSeries(mm_bid_obj) {
	//mm_bid_obj.bid_matrix
	//mm_bid_obj.bid_prices
	//mm_bid_obj.bid_quantities

	// ** first loop over each bid (row), transforming each component into a price and size vector.

	var num_of_states = mm_bid_obj.bid_matrix[0].length;

	var data_series_by_state = d3.range(0, num_of_states, 1).map((i) => []);

	var ask_series_by_state = d3.range(0, num_of_states, 1).map((i) => []);

	mm_bid_obj.bid_matrix.forEach((bid_vector, row_i) => {

		var bundle_price = mm_bid_obj.bid_prices[row_i];
		var bundle_quantity = mm_bid_obj.bid_quantities[row_i];


		bid_vector.forEach((col_val, state_j) => {
			//console.log('bid_vector.forEach')
			var bid_data_point = {};
			var shares_amount = col_val;
			bid_data_point.price = shares_amount*bundle_price; // shares_amount == 1 or 0, for atomic securities
			bid_data_point.quantity = bundle_quantity;
			if (bid_data_point.price > 0 && bid_data_point.quantity > 0) {
				//console.log('adding bid data point to series.');
				data_series_by_state[state_j].push({'x':bid_data_point.price, 'y':bid_data_point.quantity, 'bid_i':row_i});
				var atomic_bid_price = bid_data_point.price;

	      var uniform_bid_price = 1/(bid_vector.length);
	      uniform_bid_price = Math.round(1000*uniform_bid_price)/1000;
	      var diff_from_uni = Math.abs(uniform_bid_price - atomic_bid_price);


	      var uniform_ask_price = diff_from_uni*(bid_vector.length-1) + uniform_bid_price;
	      //console.log('uniform_ask_price:', uniform_ask_price);

	      //var uniform_ask_quantity = roundToTwo(bid_data_point.quantity/(bid_vector.length-1));
	      var uniform_ask_quantity = bid_data_point.quantity;

     		// *** now add an ask for every other state !== col_j
				bid_vector.forEach((b,i) => { // add an ask for each other outcome
					if (i !== state_j) {
						var new_ask = {'x':uniform_ask_price, 'y':uniform_ask_quantity, 'bid_i':row_i};
						//console.log('ask_series_by_state[i].indexOf(new_ask):', ask_series_by_state[i].indexOf(new_ask));
						if (ask_series_by_state[i].findIndex((ask) => (ask.x == new_ask.x && ask.y == new_ask.y) ) == -1) {
						//if (ask_series_by_state[i].indexOf(new_ask) == -1) {
							ask_series_by_state[i].push(new_ask);
						}
					}
				});
			}
		});


	});

	//console.log('data_series_by_state:', data_series_by_state);
	//console.log('ask_series_by_state:', ask_series_by_state);



	// convert bids to cumulative depth
	var data_cum_depth =
		data_series_by_state.map((state_series) => {
			var new_series =
				state_series.map((bid, point_i) => {
					var cum_depth =
						state_series.slice(0,point_i).reduce((memo, bp) => {
							return bp.y + memo;
						}, 0);
					var new_bid = {};
					new_bid.y = bid.y + cum_depth;
					new_bid.x = bid.x;
					new_bid.bid_i = bid.bid_i;
					//return point_i.y + cum_depth;
					return new_bid;
				});
			return new_series;
		});

	//console.log('data_cum_depth:', data_cum_depth);


	// convert asks to cumulative depth
	var ask_cum_depth =
		ask_series_by_state.map((ask_series) => {
			var new_series =
				ask_series.map((ask, point_i) => {
					var cum_depth =
						ask_series.slice(0,point_i).reduce((memo, ap) => {
							return ap.y + memo;
						}, 0);
					var new_ask = {};
					new_ask.y = ask.y + cum_depth;
					new_ask.x = ask.x;
					new_ask.bid_i = ask.bid_i;
					return new_ask;
				});
			return new_series;
		});

	//console.log('ask_cum_depth:', ask_cum_depth);




	// ** add end points at x=0 and y=0 (line from lowest bid to the y-axis)
	var depth_line_data =
		data_cum_depth.map((series, i) => {
			var y_max = d3.max(series, (d) => d.y);
			var x_max = d3.max(series, (d) => d.x);
			var series_plus = series.concat({'x':0,'y':y_max, 'endpoint':true}); // add end point to bids at x=0
			series_plus.splice(0, 0, {'x':x_max,'y':0, 'endpoint':true}); // add end point at y=0


			var x_min = d3.min(ask_cum_depth[i], (d) => d.x);
			var y_max = d3.max(ask_cum_depth[i], (d) => d.y);
			ask_cum_depth[i].splice(0, 0, {'x':x_min, 'y':0, 'endpoint':true}); // add end point to asks at y=0
			ask_cum_depth[i] = ask_cum_depth[i].concat({'x':1, 'y':y_max, 'endpoint':true}); // add end point to asks at x=1
			//var series_plus = series.concat();
			return [{name:'bid depth', values:series_plus}, {name:'ask depth', values:ask_cum_depth[i]}];
		});





	return depth_line_data;
}






	// *** now plot the user bids and clearing prices on the bid chart.
	// ** use a normalized price on the bid entry form. price is between 0 and 1, and the portfolio components are between zero and one.
  // TODO: constrain the portfolio amounts to force them to be normalized



function toCplexDefinition(bid_table) {
	var bid_vec = bid_table[0].bid_portfolio;

	var mm_bids = generateMMbids(bid_vec);


	var mm_bids_chart_series = transformBidLinesToDataSeries(mm_bids);


	// append user-provided bid prices
	var bid_prices = mm_bids.bid_prices.concat(bid_table.map((bid) => bid.bid_price))

	var bid_quantities = mm_bids.bid_quantities.concat(bid_table.map((b) => b.bid_quantity));

	// join user-provided bid_portfolio to mm-generated bid_matrix
	var bid_matrix = transpose(mm_bids.bid_matrix.concat(bid_table.map((b) => b.bid_portfolio)))



	var Objective =  `obj:` + bid_prices.map((p,i) => ` + ${p}x${i+1}`).join("") + ` - 1y1`;


	var Bounds = bid_quantities.map((q,i) => `0 <= x${i+1} <= ${q}` ).join("\n");
	Bounds = Bounds + "\n" + "0 <= y1";


	var Constraints = bid_matrix.map((row,i) => {
		var line = `lim_${i+1}: ` + row.map((col,j) => ` + ${bid_matrix[i][j]}x${j+1}`).join("");
		line = line + ` - 1y1 <= 0`;
		return line;
	}).join("\n");


	var Generals = bid_prices.map((q,i) => `x${i+1}`).join("\n") + "\n" + "y1";


	var cplexDef =
	"Maximize\n" + Objective + "\n\n" +
	"Subject To\n" + Constraints + "\n\n" +
	"Bounds\n" + Bounds + "\n\n" +
	"Generals\n" + Generals + "\n\n" + "End" + "\n";

	console.log('CPLEX LP Problem Definition:');
	console.log(cplexDef);


	return cplexDef;
}







var LPResultRef;

var OrderBookRef;

function generateAndRunCplex(ob_ref) {
	OrderBookRef = ob_ref;

	var bid_table_obj = ob_ref.cursor().deref().toJS();
	var bid_matrix = bid_table_obj.bid_table;
	var bid_prices = bid_table_obj.bid_prices;
	var bid_quantities = bid_table_obj.bid_quantities;

	var cplex_input = bid_matrix.map((bundle, row_i) => {
		return {'bid_portfolio':bundle, 'bid_price':bid_prices[row_i], 'bid_quantity':bid_quantities[row_i]};
	});


	var bid_matching_cplex = toCplexDefinition(cplex_input);

	run(bid_matching_cplex);
}





var job;


var logText = '';


function log(value){
    console.log(value);
    logText = logText + value + "\n";
}




function run(cplex_def){
    job = new Worker("lib/components/deps/glpk-main.js");
    job.onmessage = function (e) {
        var obj = e.data;
        switch (obj.action){
            case 'log':
                log(obj.message);
                break;
            case 'done':
                stop();
                log(JSON.stringify(obj.result));
                console.log('glpk worker job done. result:', obj.result);
                LPResultRef.cursor().update('bids_lp_result', (oldVec) => Immutable.fromJS(obj.result));
                break;
        }
    };

    logText = '';
    console.log('running glpk worker.');
    job.postMessage({action: 'load', data: cplex_def, mip: false});
}




function stop(){
	if (job != null) {
		job.terminate();
		job = null;
	}
}





class Auctioneer {
  constructor() {
    this.generateMMbids = generateMMbids;
    this.transformBidLinesToDataSeries = transformBidLinesToDataSeries;
  }

  init(orderbook_ref, bid_table_ref, lp_result_ref) {

	  orderbook_ref.observe(function (test_val) {
			generateAndRunCplex(orderbook_ref);
		});

	  LPResultRef = lp_result_ref;

  	generateAndRunCplex(orderbook_ref);
  }
}


export default new Auctioneer()
