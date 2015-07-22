/** @jsx React.DOM */

import React from 'react';
import immstruct from 'immstruct';
import component from 'omniscient';
import Immutable from 'immutable';

import TangleText from './tangle-text.jsx!'
import d3 from 'd3';
import _ from 'lodash';

import rd3 from 'react-d3';
var LineChart = rd3.LineChart;

import { InfoTip } from './info-tip.jsx!'

import Auctioneer from './bid-lp-solver.jsx!'


function roundToTwo(decimal_num) {
  return Math.round(100*decimal_num)/100;
}





import MSR from './msr-functions.jsx!'

var costLMSR = MSR.costLMSR;
var priceLMSR = MSR.priceLMSR;
var depthLMSR = MSR.depthLMSR;
var depthShortLMSR = MSR.depthShortLMSR;
var getSharesAmountFromCost = MSR.getSharesAmountFromCost;





var initial_array = [0,0,0,0];


var structure = immstruct({
  market: {
    Bparam: 250,
    inventoryVector: initial_array,

    orderbook: {
      bid_table: [[1,0,0,0],[0.4,0.3,0.2,0.1],[0.1,0.2,0.3,0.4]],
      bid_prices: [0,0,0],
      bid_quantities: [50,50,50]
    },
    bids_lp_result: {},
    bidMouseover: 0,
  },
});






var ob_ref = structure.reference(['market', 'orderbook']);
var bid_table_ref = structure.reference(['market', 'orderbook', 'bid_table']);

var lp_result_ref = structure.reference(['market', 'bids_lp_result']);
var market_lp_result = structure.reference(['market']);

lp_result_ref.observe(function (val, val2) {
  var test_val = lp_result_ref.cursor().deref().toJS();
});




Auctioneer.init(ob_ref, bid_table_ref, market_lp_result);








var inputMixin = {

  onChangeLimitBid: function (indx, val) {
    var bid_table = this.props.cursor.cursor('orderbook').get('bid_table').deref().toJS();
    bid_table[indx.i][indx.j] = val;
    this.props.cursor.cursor('orderbook').update('bid_table', (old) => Immutable.fromJS(bid_table));
  },


  onInputLimitPrice: function (row_i, val) {
    var limit_prices = this.props.cursor.cursor('orderbook').get('bid_prices').deref().toJS();
    limit_prices[row_i] = val;
    this.props.cursor.cursor('orderbook').update('bid_prices', () => Immutable.fromJS(limit_prices));
  },

  onInputLimitQuantity: function (row_i, val) {
    var limit_quantities = this.props.cursor.cursor('orderbook').get('bid_quantities').deref().toJS();
    limit_quantities[row_i] = val;
    this.props.cursor.cursor('orderbook').update('bid_quantities', () => Immutable.fromJS(limit_quantities));
  },

  handleAddNewBid: function (val) {
    var ob_obj = this.props.cursor.get('orderbook').deref().toJS();
    ob_obj.bid_table = ob_obj.bid_table.concat([new Array(ob_obj.bid_table[0].length).fill(0)]);
    ob_obj.bid_prices.push(0);
    ob_obj.bid_quantities.push(0);
    this.props.cursor.update('orderbook', (oldVec) => Immutable.fromJS(ob_obj));
  },

  onBidMouseover: function (row_i, val) {
    this.props.cursor.update('bidMouseover', () => row_i);
  },

  onBidMouseout: function (val) {
    this.props.cursor.update('bidMouseover', () => 0);
  },

};


// when passing a mixedin, need to use function() {} as fat arrows () => () bind and lose `this`
var StateView = component(inputMixin, function (cursor) {
  var curs = cursor.cursor;

  var lp_auction_result = curs.get('bids_lp_result').deref().toJS();

  var thisComponent = this;

  var b_param = curs.get('Bparam');
  var inv_vec = curs.get('inventoryVector').deref().toArray();

  var msr_prices = priceLMSR(b_param, inv_vec);





  var MMBidsCount;
  var MMBidsTable;
  var MMBidsObject;


  function getSimpleDepthForAllOutcomes(num_outcomes) {
    var bid_vec = new Array(num_outcomes);
    var mm_bids = Auctioneer.generateMMbids(bid_vec);

    MMBidsObject = mm_bids;
    MMBidsTable = mm_bids.bid_matrix;
    MMBidsCount = mm_bids.bid_matrix.length;

    var mm_bids_chart_series = Auctioneer.transformBidLinesToDataSeries(mm_bids);
    //console.log('mm_bids_chart_series:', mm_bids_chart_series);

    return mm_bids_chart_series;

  }




  var MMBidsDataSeries = getSimpleDepthForAllOutcomes(msr_prices.length);



  var polyXscales = msr_prices.map((p) => {
    return d3.scale.linear().domain([0.001, p, 0.99]);
  });

  var regularPscale = d3.scale.linear().domain([0, 1]);




  var orderbookProps = this.props.cursor.get('orderbook').deref().toJS();
  var bidMatrix = orderbookProps.bid_table;

  var bidPrices = orderbookProps.bid_prices;
  var bidQuantities = orderbookProps.bid_quantities;



  var num_of_prices = bidMatrix[0].length;

  var lp_offset = MMBidsCount;
  //console.log('MMBidsCount:', MMBidsCount);


  var bidMouseIndex = this.props.cursor.get('bidMouseover');
  //console.log('bidMouseIndex:', bidMouseIndex);




  var ClearingResultsFills =
    bidMatrix.map((bid, row_i) => {
      var key_fill = `x${lp_offset+row_i+1}`;
      //console.log('key_fill:', key_fill);
      return lp_auction_result[key_fill];
    });

  ClearingResultsFills = ClearingResultsFills.map((q) => (q !== undefined) ? q.toFixed(1) : 0)
  //console.log('ClearingResultsFills:', ClearingResultsFills);







  var BidComponentInputs =
    bidMatrix.map( (bid_bundle, row_i) => {


      var bid_i = MMBidsCount + row_i + 1;


      var class_name = "";
      if (bidMouseIndex === bid_i) {
        class_name="mouse-hl";
      }

      // only onChange events. onInput causes too many calls to the LP worker.
      // onInput={thisComponent.onInputLimitBid.bind(thisComponent, {'i':row_i,'j':j})}

      var bid_component_inputs = bid_bundle.map((q,j) => {
          return (
            <div key={"q_"+j} style={{'display':'inline-block', 'marginLeft':'2px'}}>
              <TangleText value={bidMatrix[row_i][j]} min={0} max={1} step={0.01} size={2}
                onChange={thisComponent.onChangeLimitBid.bind(this, {'i':row_i,'j':j})}
                 />
            </div>
          );
        });


      return (
          <tr key={"bid_tr_"+row_i}
            onTouchStart={thisComponent.onBidMouseover.bind(thisComponent, bid_i)}
            onMouseEnter={thisComponent.onBidMouseover.bind(thisComponent, bid_i)}
            >
            <td className={class_name} style={{paddingRight:'10px'}}>
              {bid_component_inputs}
            </td>
            <td className={class_name}>
              <TangleText value={bidPrices[row_i]} min={0} max={1} step={0.01} size={2} onChange={this.onInputLimitPrice.bind(this, row_i)} />
            </td>
            <td className={class_name}>
              <TangleText value={bidQuantities[row_i]} min={0} max={1000} step={1} size={2} onChange={this.onInputLimitQuantity.bind(this, row_i)} />
            </td>
            <td className={class_name}>
              <span style={{fontSize:"12px"}}>{ClearingResultsFills[row_i]}</span>
            </td>
          </tr>
      );

    });




  var MMComponentTable =
    MMBidsTable.map((bid_vec, bid_i) => {
      var fill_key = "x"+(bid_i+1);

      var class_name = "";
      if (bidMouseIndex === bid_i+1) {
        class_name="mouse-hl";
      }
      return (
        <tr key={"bid_"+bid_i}
          onClick={thisComponent.onBidMouseover.bind(thisComponent, bid_i+1)}
          onTouchStart={thisComponent.onBidMouseover.bind(thisComponent, bid_i+1)}
          onMouseEnter={thisComponent.onBidMouseover.bind(thisComponent, bid_i+1)} >
          <td className={class_name}>#{bid_i}</td>
          <td className={class_name}>{bid_vec.join(" ")}</td>
          <td className={class_name} style={{paddingLeft:'15px'}}>{MMBidsObject.bid_prices[bid_i]}</td>
          <td className={class_name} style={{paddingLeft:'15px'}}>{MMBidsObject.bid_quantities[bid_i]}</td>
          <td className={class_name}>{lp_auction_result[fill_key]}</td>
        </tr>
      );

    });




  var ClearResultsPrices =
    bidMatrix[0].map((state, col_j) => {
      var key_price = `x${col_j+1}_dual`;
      var clearing_price = lp_auction_result[key_price];

      return Math.round(1000*clearing_price)/1000;
    });


  var LPClearingPrices = ClearResultsPrices.map((p) => (p !== undefined) ? p.toFixed(2) : 0).join(", ");



  // ** sort the bidMatrix (user-entered bids) by fill amount. quick hack to get the phantom ask order correct
  // ** bids that have a full fill should come first.

  var UserBids = bidMatrix.map((user_bid_bundle, row_i) => {
    var user_bid_i = MMBidsCount+row_i;
    var fill_key = "x"+(user_bid_i+1);
    var user_bid_fill = lp_auction_result[fill_key];
    var bundle_with_fill = {};
    bundle_with_fill.bundle = user_bid_bundle;
    bundle_with_fill.quantity = bidQuantities[row_i];
    bundle_with_fill.price = bidPrices[row_i];
    bundle_with_fill.fill = user_bid_fill;
    bundle_with_fill.bid_i = user_bid_i;

    return bundle_with_fill;
  });


  var UserBidsSorted = _.sortBy(UserBids, (user_bid) => {
    if (user_bid.fill === user_bid.quantity) {
      return 0;
    }
    if (user_bid.fill < user_bid.quantity) {
      return 1;
    }
    if (user_bid.fill === 0) {
      return 2;
    }
  });


  UserBidsSorted.forEach( (user_bid, row_i) => {
    var bid_bundle = user_bid.bundle;
    var new_bid_index = user_bid.bid_i;

    var shares_amount;
    var new_bid_point;

    if (bid_bundle.indexOf(1) !== -1 && user_bid.price > 0) { // is an atomic bundle
      //console.log('creating phantom asks from an atomic bid');
      var state_i = bid_bundle.indexOf(1);

      var atomic_bid_price = user_bid.price;

      shares_amount = user_bid.quantity;

      new_bid_point = {'x':atomic_bid_price, 'y':shares_amount, 'bid_i':new_bid_index};

      MMBidsDataSeries[state_i][0].values = insertBid(new_bid_point, MMBidsDataSeries[state_i][0].values);

      var uniform_bid_price = 1/(bid_bundle.length);
      uniform_bid_price = Math.round(1000*uniform_bid_price)/1000;

      var uniform_ask_price;
      var uniform_ask_quantity;

      if (atomic_bid_price > uniform_bid_price) {
        // this bid will be filled (as long as smaller than MM orders)
        uniform_ask_price = ((1-atomic_bid_price)/(bid_bundle.length-1));
        //uniform_ask_quantity = 0;
        uniform_ask_quantity = shares_amount;
      } else
      if (atomic_bid_price <= uniform_bid_price) {
        var diff_from_uni = Math.abs(uniform_bid_price - atomic_bid_price);
        //console.log('diff_from_uni:', diff_from_uni);
        uniform_ask_price = diff_from_uni*(bid_bundle.length-1) + uniform_bid_price;
        uniform_ask_quantity = shares_amount;
      }

      //console.log('uniform_ask_price:', uniform_ask_price);
      //console.log('uniform_ask_quantity:', uniform_ask_quantity);

      var user_bid_fill = user_bid.fill;
      //console.log('user_bid_fill:', user_bid_fill);

      //var plot_amount = shares_amount - user_bid_fill;
      var plot_amount = shares_amount;

      //console.log('shares_amount:', shares_amount);
      //console.log('state_i:', state_i);
      //console.log('bid_bundle:', bid_bundle);


      // *** add an ask for every other state !== col_j

      bid_bundle.forEach((component_j, col_j) => {
        //if (col_j !== state_i && user_bid_fill !== shares_amount) { // only plot phantom asks for partial fills or no fills
        if (col_j !== state_i) {

          console.log('plotting phantom ask for col_j:', col_j);

          var lp_clearing_price = ClearResultsPrices[col_j];
          //console.log('lp_clearing_price:', lp_clearing_price);
          lp_clearing_price = Math.round(1000*lp_clearing_price)/1000;

          var new_ask_point = {'x':lp_clearing_price, 'y':plot_amount, 'bid_i':new_bid_index};
          console.log('adding new phantom ask for an atomic bid. new_ask_point:', new_ask_point);

          // phantom asks should not overlap or accumulate
          if ( MMBidsDataSeries[col_j][1].values.findIndex((ask) => (ask.x == new_ask_point.x && ask.y == new_ask_point.y) ) == -1)
          {

            MMBidsDataSeries[col_j][1].values = insertAsk(new_ask_point, MMBidsDataSeries[col_j][1].values);
          }
        }
      });


    } else if (user_bid.price > 0) { // non-atomic bundles i.e. mixed bundles


      var mixed_bundle_price = user_bid.price;

      var state_clearing_price;
      var bid_state_price;

      var mixed_bid_fill = user_bid.fill;


      var bid_bundle_copy = bid_bundle.map((qi) => qi);

      bid_bundle.forEach((qi_shares, state_i) => {
        if (qi_shares > 0) {
          shares_amount = qi_shares*user_bid.quantity;
          state_clearing_price = ClearResultsPrices[state_i];
          if (mixed_bid_fill > 0) {
            if (mixed_bundle_price > state_clearing_price) {
              bid_state_price = mixed_bundle_price;
            } else {
              bid_state_price = state_clearing_price;
            }
          } else {
            // no fill on this bid.
            bid_state_price = mixed_bundle_price;
          }

          var new_mixed_bid_point = {'x':bid_state_price, 'y':shares_amount, 'bid_i':new_bid_index};
          //console.log('inserting mixed bid point. new_mixed_bid_point:', new_mixed_bid_point);
          MMBidsDataSeries[state_i][0].values = insertBid(new_mixed_bid_point, MMBidsDataSeries[state_i][0].values);


          // * add phantom asks

          if (state_i === 0) { // only for the first state for now
          //if (state_i === 0 || state_i === 1) {
            //
            // *** currently plotting two phantom asks on s_i 2 * 3 (i.e. != 0 or 1). merge these two orange points into one orange point

            var phantom_ask_amount = qi_shares*user_bid.quantity;

            bid_bundle_copy.forEach((el, s_i) => {
              //console.log('bid_bundle_copy forEach s_i:'+s_i);
              if (s_i !== state_i) {

                var phantom_ask_price = ClearResultsPrices[s_i];
                var phantom_ask = {'x':phantom_ask_price, 'y':phantom_ask_amount, 'bid_i':new_bid_index};

                var find_existing_phantom =
                  MMBidsDataSeries[s_i][1].values.findIndex((ask) => {
                    return ask.bid_i == phantom_ask.bid_i;
                  });

                //console.log('find_existing_phantom:', find_existing_phantom);
                //if (find_existing_phantom == -1) {
                  MMBidsDataSeries[s_i][1].values = insertAsk(phantom_ask, MMBidsDataSeries[s_i][1].values, s_i);
                //}

                //console.log('big_bundle_copy foreach s_i: ' + s_i);
                //console.log('MMBidsDataSeries[s_i][1].values:', JSON.parse(JSON.stringify(MMBidsDataSeries[s_i][1].values)));
              }
            });

          }

        }
      }); // close foreach q_i

    } // close case of mixed bundles


  }); // close foreach bid_bundle









  var margins={
        'top': 10,
        'right': 80,
        'bottom': 50,
        'left': 80
      };


  // xScale={regularPscale}
  // polyxScale={polyXscales[i]}  to put the middle of x at the MSR price



  // todo: a new component which takes as props, MMBidsDataSeries and bidMouseIndex.
  // * creates a price chart for each element of MMBidsDataSeries
  // * the point is to refactor the render functions.
  //
  // * move the user-bundle inputs into another react component



  //console.log('MMBidsDataSeries:', MMBidsDataSeries);


var i_sub_str = ['₀','₁','₂','₃','₄'];

  var priceCharts =
    inv_vec.map((q,i) => {
      return (
        <div key={"chart_"+i} style={{'border':'1px solid gray', 'borderTop':'0px', 'width':'450px', 'height':'130px'}}>
          <div style={{'marginTop':'-15px'}}>
            <LineChart
              legend={false}
              data={MMBidsDataSeries[i]}
              hoverAnimation={false}
              width={450}
              height={150}
              pointRadius={2}
              interpolationType="step-after"
              bidHlIndex={bidMouseIndex-1}
              colors={d3.scale.ordinal().range(["green", "orange", "orange", "green"])}
              margins={margins}
              polyxScale={polyXscales[i]}
              yOrient="left"
              yAxisTickCount={5}
              yAxisLabel={"bid amount r"+i+"\n (shares)"}
              yAxisLabelOffset={55}
              dualYscale={true}
           />
         </div>
      </div>
      );
    });




  return (
  <div>


    <div className="flex-row-spacearound">

      <div>
        <strong>Batch Combinatorial Auction</strong><br/>
        <span>Using Linear Programming (LP) to match bundle bids with uniform-price clearing</span>
        <br/><br/>
        Number of atomic securities: {inv_vec.length}
        <InfoTip iconSize="" width="280px">
          <span>In this example, we use a combinatorial auction to trade bundles of binary options, or in other words, portfolios of atomic securities. Since there are four atomic securities, each bundle or portfolio is a vector <b>r</b> with four components (i.e. <b>r</b> = [r<sub>0</sub>, r<sub>1</sub>, r<sub>2</sub>, r<sub>3</sub>]). {/* Each bundle or <i>portfolio</i> is a vector whose components specify quantities of each atomic security. Since there are four atomic securities, each vector has four components and the payoff space has four dimensions. Thus, there are four atomic bundles: [1,0,0,0], [0,1,0,0], [0,0,1,0], and [0,0,0,1]. Mixed bundles contain more than one atomic security, specified in various quantities. For example, [0.4, 0.3, 0.2, 0.1] and [0.1, 0.2, 0.3, 0.4] are mixed bundles. */}</span>
        </InfoTip>
      </div>
    </div>

    <br/>



    <div className="flex-row-spacebetween" style={{'height':'600px'}}>


      <div style={{'marginTop':'15px'}}>
        <span style={{fontSize:"1.1em"}}>Combinatorial Order Book:</span>
        <InfoTip iconSize="" width="280px">
          <span>A combinatorial order book enables the trading of multiple related items through a single auction mechanism (a combinatorial auction). In our case, the items are atomic securities (i.e. binary options which span an outcome space). Since there are four atomic securities, we display four order books, one for each security: [r0, r1, r2, r3]. Note that the x-axes use a polylinear scale to center the plots on the initial state clearing prices.</span>
        </InfoTip>
        <div className="flex-column-start depthChartContainer" style={{'width':'450px', 'height':'600px', 'borderTop':'1px solid gray'}}>
          {priceCharts}
        </div>
      </div>



      <div style={{"textAlign":"center", 'width':'40%', 'padding':'15px'}}>

        <span style={{fontSize:"1.1em"}}>Market Maker bids:</span>
        <InfoTip iconSize="" width="280px">
          <span>In order to calculate a unique solution for the state clearing prices, the LP auctioneer needs to be given a sufficient set of linearly independent bids. So at a minimum, we need a set of four bids, one for each atomic security (i.e. [1,0,0,0], [0,1,0,0], ..). We create multiple sets to fill in the order book with a staircase formation of bids at a ladder of seven price levels, starting from 0.25 and decreasing (0.25, 0.22, 0.19, ...). All bids have an arbitrary quantity of 20 units.</span>
        </InfoTip>


        <div style={{height:'200px', 'overflowY':'scroll', border:"1px solid gray", display:"inline-block"}}
          onMouseLeave={this.onBidMouseout} onTouchEnd={this.onBidMouseout}>

          <table className="bidsTable">
            <tr style={{fontSize:"12px"}}>
              <td>i</td>
              <td colSpan="1">bundle</td>
              <td>&nbsp;&nbsp; price</td>
              <td>quantity</td>
              <td>fill</td>
            </tr>

            {MMComponentTable}
          </table>

        </div>


        <br/><br/>


        <div style={{"textAlign":"center"}}>

          <div style={{"textAlign":"center", display:"inline-block"}}>
            <span style={{fontSize:"1.1em"}}>Trader-entered bids:</span>

            <table onMouseLeave={this.onBidMouseout} onTouchEnd={this.onBidMouseout}>
              <tr style={{fontSize:"12px"}}><td>bundle</td><td>price</td><td>quantity</td><td>fill</td></tr>
              {BidComponentInputs}
            </table>

            <button type="button" onClick={this.handleAddNewBid}>Add New Bid</button>
          </div>

          <br/><br/>

          <span style={{fontSize:"1.1em"}}>LP<sup>*</sup> calculated state clearing prices:</span>
          <br/>
          <span style={{fontSize:"1em"}}>{LPClearingPrices}</span>
          <br/><br/>

          <span><sup>*</sup> The LP algorithm also determines the bid fills.</span>
        </div>


      </div>

    </div>


  </div>
)}).jsx;








function insertBid(bid_point, data_series) {
  //console.log('insertBid data_series:', data_series);
  // add to cumulative depth.. re-calculate the y position for all points after bid_point

  //series_plus.splice(0, 0, {'x':x_max,'y':0});

  //console.log('insertBid data_series:', JSON.parse(JSON.stringify(data_series)));
  //console.log('insertBid bid_point:', bid_point);

  if (data_series[0].y === 0) {
    data_series.splice(0, 1); // remove the base bid point
  }


  //var new_bid_i = data_series.findIndex((bp) => (bp.x <= bid_point.x));
  var new_bid_i = data_series.findIndex((bp) => (bid_point.x > bp.x));

  //console.log('insertBid new_bid_i:', new_bid_i);


  /*
  var cum_depth =
    data_series.slice(0,new_bid_i).reduce((memo, bp) => {
      return bp.y + memo;
    }, 0);
  */

  var cum_depth = 0;
  if (new_bid_i == 0) {
    //when there are no bids with better prices.
    cum_depth = 0;
  } else {
    cum_depth = data_series[new_bid_i-1].y;
  }



  //console.log('bid_point cum_depth:', cum_depth);

  // causes a problem with stable-bundle bid. removes the MM bid at 0.22
  //data_series.splice(new_bid_i-1, 1); // remove the base bid point


  var bid_point_plus_y = bid_point.y;

  var new_bid_point = {};
  new_bid_point.x = bid_point.x;
  new_bid_point.y = bid_point.y + cum_depth;
  new_bid_point.bid_i = bid_point.bid_i;

  data_series.splice(new_bid_i, 0, new_bid_point);



  var new_series =
    data_series.map((bid, point_i) => {
      if (point_i > new_bid_i) {
          var new_bid = {};
          new_bid.y = bid.y + bid_point_plus_y;
          new_bid.x = bid.x;
          if (!_.isUndefined(bid.bid_i)) {
            new_bid.bid_i = bid.bid_i;
          }
          if (!_.isUndefined(bid.endpoint)) {
            new_bid.endpoint = bid.endpoint;
          }
          //return point_i.y + cum_depth;
          return new_bid;
      }
      return bid;
    });


  var x_max = d3.max(new_series, (d) => d.x);
  var y_max = d3.max(new_series, (d) => d.y);
  if (new_series[0].endpoint !== true) {
    new_series.splice(0, 0, {'x':x_max,'y':0, 'endpoint':true}); // add base point of bid where y==0
  }

  if (new_series[new_series.length-1].endpoint !== true) {
    new_series = new_series.concat({'x':0,'y':y_max, 'endpoint':true}); // add top point of bid where x==0
  }

  //new_series.splice(0, 0, {'x':x_max,'y':0});

  //console.log('new_series:', new_series);

  return new_series;
}






function insertAsk(ask_point, data_series, q_i) {
  //console.log('insertAsk q_i='+q_i+'  ask_point:', ask_point);

  //console.log('insertAsk data_series:', JSON.parse(JSON.stringify(data_series)));
  // add to cumulative depth.. re-calculate the y position for all points after bid_point

  //series_plus.splice(0, 0, {'x':x_max,'y':0});
  //console.log('for q_i='+q_i+'  inserting ask:', ask_point);

  if (!(ask_point.x > 0 && ask_point.y > 0)) { // only add points that add to the depth
    return data_series;
  }


  //console.log('data_series before removing base point:', JSON.parse(JSON.stringify(data_series)));

  if (data_series[0].y === 0) {
    data_series.splice(0, 1); // remove the base ask point
  }

  //console.log('data_series after removing base point:', JSON.parse(JSON.stringify(data_series)));



  var new_ask_i = data_series.findIndex((ap) => (ask_point.x < ap.x));
  //console.log('new_ask_i:', new_ask_i);


  var cum_depth =
    data_series.slice(0,new_ask_i).reduce((memo, ap) => {
      return ap.y + memo;
    }, 0);

  //console.log('cum_depth to add to ask_point:', cum_depth);

  var cum_depth_test = 0;
  if (new_ask_i > 0) {
    cum_depth_test = data_series[new_ask_i-1].y;
  }



  var new_depth_add = ask_point.y;

  //console.log('new_depth_add:', new_depth_add);

  //ask_point.y = ask_point.y + cum_depth;

  var adjusted_ask_point = {};
  adjusted_ask_point.x = ask_point.x;
  //adjusted_ask_point.y = ask_point.y + cum_depth;
  adjusted_ask_point.y = ask_point.y + cum_depth_test;
  adjusted_ask_point.bid_i = ask_point.bid_i;
  //console.log('new ask point after adjustment:', adjusted_ask_point);


  data_series.splice(new_ask_i, 0, adjusted_ask_point); // add ask point

  //console.log('data_series after insert:', JSON.parse(JSON.stringify(data_series)));

  var new_series =
    data_series.map((ask, point_i) => {
      //console.log('data_series.map point_i:', point_i);
      if (point_i > new_ask_i) {
          //console.log('data_series.map point_i > new_ask_i='+new_ask_i);
          //console.log('adding new_depth_add:'+new_depth_add+'  to ask.y:'+ask.y);
          var new_ask = {};
          new_ask.y = ask.y + new_depth_add;
          new_ask.x = ask.x;
          if (!_.isUndefined(ask.bid_i)) {
            new_ask.bid_i = ask.bid_i;
          }
          if (!_.isUndefined(ask.endpoint)) {
            new_ask.endpoint = ask.endpoint;
          }
          //console.log('new_ask:', new_ask);
          //return point_i.y + cum_depth;
          return new_ask;
      }
      return ask;
    });


  //console.log('new_series:', JSON.parse(JSON.stringify(new_series)));

  var x_min = d3.min(new_series, (d) => d.x);

  new_series.splice(0, 0, {'x':x_min,'y':0, 'endpoint':true}); // add base point of ask where y==0

  //console.log('insertAsk new_series:', JSON.parse(JSON.stringify(new_series)));
  return new_series;
}









class LPBundleWidget {
  constructor() {

  }

  init(el) {

    render(el);
    structure.on('swap', render);

    function render () {
      React.render( <StateView cursor={structure.cursor('market')}  />, el);
    }

  }
}


export default new LPBundleWidget()
