/** @jsx React.DOM */

import React from 'react';
import immstruct from 'immstruct';
import component from 'omniscient';
import Immutable from 'immutable';

import { InfoTip } from './info-tip.jsx!'
import TangleText from './react-tangle-nodiv.jsx!'

//import TeX from '../../react-components/js/tex.jsx!'
import d3 from 'd3';
import _ from 'lodash';

import rd3 from 'react-d3';
var LineChart = rd3.LineChart;


import BarChartDep from './deps/barchart.js!jsx'
var BarChart = BarChartDep.BarChart;

import StackedBarChartDep from './deps/stackedbarchart.js!jsx'
var StackedBarChart = StackedBarChartDep.StackedBarChart;

/*
var lmsrCostFormula = `b\\log\\left(e^{q_1/b}+e^{q_2/b}\\right)`;
var lmsrCostFormulaNums = `C(\\mathbf{q}) = ` + lmsrCostFormula.replace(/b/g, "250");
React.render(<TeX>{lmsrCostFormulaNums}</TeX>, document.querySelector('#gifs'));
*/



function roundToTwo(decimal_num) {
  return Math.round(100*decimal_num)/100;
}




import MSR from './msr-functions.jsx!'

var costLMSR = MSR.costLMSR;
var priceLMSR = MSR.priceLMSR;
var depthLMSR = MSR.depthLMSR;
var depthShortLMSR = MSR.depthShortLMSR;
var getSharesAmountFromCost = MSR.getSharesAmountFromCost;





var initial_array = [50,50,50];


var structure = immstruct({
  market: {
    Bparam: 250,
    inventoryVector: initial_array,
    bidPrice:0.5
  },
});




var inputMixin = {
  onInputBval: function (val) {
    this.props.cursor.update('Bparam', (b_val) => val);
  },

  onInputInv: function (qi, val) {
    var inv_vec = this.props.cursor.get('inventoryVector').deref().toArray();
    var new_vec = inv_vec;
    new_vec[qi] = val;
    this.props.cursor.update('inventoryVector', (oldVec) => Immutable.fromJS(new_vec));
  }
};


// when passing a mixedin, need to use function() {} as fat arrows () => () bind and lose `this`
var StateView = component(inputMixin, function (cursor) {
  var curs = cursor.cursor;


  var bid_price = curs.get('bidPrice');

  var b_param = curs.get('Bparam');
  var inv_vec = curs.get('inventoryVector').deref().toArray();
  var lmsr_bounded_loss = b_param * Math.log(inv_vec.length);
  var msr_prices = priceLMSR(b_param, inv_vec);
  var outcome_prices = msr_prices.map((p) => p.toFixed(3));


  /*
  var lmsrCostFormula = "b\\cdot\\log\\left(e^{q_1/b}+e^{q_2/b}\\right)";

  var lmsrCostFormulaNums = lmsrCostFormula.replace(/b/g, b_param);
  var lmsrCostFormulaNums2 = lmsrCostFormulaNums.replace(/q_1/g, inv_vec[0]);
  var lmsrCostFormulaNums3 = lmsrCostFormulaNums2.replace(/q_2/g, inv_vec[1]);

  var lmsrCostFormulaNums4 = "C(\\mathbf{q}) = " + lmsrCostFormulaNums3;

  //var lmsrPriceFormula = "p_i = \\displaystyle\\frac{e^{q_i/b}}{\\sum_{j=1}^n e^{q_j/b}}";
  var lmsrPriceFormula = "\\displaystyle p_i = \\frac{e^{q_i/b}}{\\sum_j e^{q_j/b}}";
  */

  function costOfBet(q_index, bet_size_shares) {
    var bet_bundle_i = Array.from(inv_vec);
    bet_bundle_i[q_index] += bet_size_shares;
    var cost_of_bet_two = costLMSR(b_param, bet_bundle_i) - costLMSR(b_param, inv_vec);

    var bet_move_price = priceLMSR(b_param, bet_bundle_i)[q_index];
    return {'cost':cost_of_bet_two, 'price':bet_move_price};
  }









  function getDepthCurveForOutcome(q_index) {


    //var price_ticks = [0.52, 0.54, 0.56, 0.58, 0.60, 0.62, 0.64, 0.66, 0.68, 0.70];
    var first_price = msr_prices[q_index]; // use current price to start plot
    var step_count = 12;
    var step_size = Math.floor(100*(0.99 - first_price)/step_count)/100;
    var buy_price_ticks = d3.range(first_price, 0.98, step_size);
    buy_price_ticks.push(0.985);

    var buy_depth_curve = buy_price_ticks.map((p) => {
      var depth = depthLMSR(b_param, inv_vec, p);
      return {'price': p, 'amount': depth[q_index]};
    });

    //console.log('best bid:', buy_depth_curve[0]);

    var buy_depth_series = buy_depth_curve.map((d_point) => {
      return {'x':d_point.price, 'y':d_point.amount};
    });


    buy_depth_series.push({'x':first_price, 'y':0, 'infinitessimal_price':false, 'highlight':false});

    buy_depth_series.sort(function(a, b) { return b.x - a.x; });
    //console.log('buy_depth_series:', buy_depth_series);


    var max_bid_price = msr_prices[q_index];
    // max_bid_price = d3.max(bid_shares_price,  msr_prices[q_index]);

    //var sell_price_ticks = [0.48, 0.46, 0.44, 0.42, 0.40, 0.38, 0.36, 0.34, 0.32, 0.30];
    var sell_price_ticks = d3.range(0.02, max_bid_price, 0.03);
    //console.log('sell_price_ticks:', sell_price_ticks);


    var test_sell_price_ticks = d3.range(max_bid_price, 0.02 , 0.03);
    var test_short_depth = depthShortLMSR(b_param, inv_vec, test_sell_price_ticks, q_index);

    test_short_depth.sort(function(a, b) { return a.price - b.price; });


    if (q_index == 0) {

      var bid_index = _.findIndex(test_short_depth, function(bid_point) {
        return bid_price > bid_point.price;
      });

      var bid_indices = test_short_depth.filter((bid_point) => bid_price > bid_point.price);



      test_short_depth.sort(function(a, b) {
        if (a.price === b.price) {
          return a.cost - b.cost; // secondary sort by volume, so the bid_base_point comes before the top (for proper drawing of depth curve)
        }
        return b.price - a.price;
      });

      var max_price = _.first(test_short_depth);

      //if (bid_cost_offset === 0) {
        var zero_point = {'price':max_price.price, 'cost':0};
        test_short_depth.splice(0, 0, zero_point);
      //}

    }


    var sell_depth_series = test_short_depth.map((d_point) => {
      if (d_point.highlight) {
        return {'x': d_point.price, 'y': d_point.cost, 'highlight': false};
      }
      return {'x': d_point.price, 'y': d_point.cost};
    });


    var depth_line_data = [
      { name: 'bid depth', values: sell_depth_series },
      { name: 'ask depth', values: buy_depth_series }
    ];


    return depth_line_data;
  }




  var polyXscales = msr_prices.map((p) => {
    return d3.scale.linear().domain([0.001, p, 0.99]);
  });

  var regularPscale = d3.scale.linear().domain([0, 1]);




  var bar_data_prices = msr_prices.map((p, i) => { return {label: `q${i}`, value: p}; });

  var bar_data_inventory = inv_vec.map((q, i) => { return {label: i, value: q}; });

  var inventory_labels = inv_vec.map((q, i) => `q${i}`);

  var bar_data_stacked = {
    colors: ['cornflowerblue', 'green'],
    labels: inventory_labels,
    series1: inv_vec,
    series2: [0,0,0]
  };


  var margins={
        'top': 10,
        'right': 80,
        'bottom': 50,
        'left': 80
      };



  var qi_textboxes =
    inv_vec.map((q,i) => {
      return (
        <div style={{'display':'inline-block', marginLeft:'5px'}}>
          <TangleText value={inv_vec[i]} min={0} max={10000} step={1} size={3} onChange={this.onInputInv.bind(this, i)} onInput={this.onInputInv.bind(this, i)} />
        </div>
      );
    });






  // xScale={regularPscale}
  // polyxScale={polyXscales[i]}  to put the middle of x at the MSR price

  var priceCharts =
    inv_vec.map((q,i) => {

      return (
        <div key={"msr_depth_chart_"+i} style={{'border':'1px solid gray', 'borderTop':'0px', 'width':'450px', 'height':'130px'}}>
          <div style={{marginTop:'-20px'}}>
            <LineChart
              legend={false}
              data={getDepthCurveForOutcome(i)}
              hoverAnimation={false}
              width={450}
              height={150}
              pointRadius={2}
              bidHlIndex={0}
              colors={d3.scale.ordinal().range(["green", "orange", "orange", "green"])}
              margins={margins}
              xScale={regularPscale}
              yOrient="left"
              yAxisTickCount={5}
              yAxisLabel={"bid size r"+i+" (shares)"}
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
        <strong>Logarthmic Market Scoring Rule (LMSR) as an Automated Market Maker (AMM)</strong><br/>
        <span>Visualizing LMSR as bid depth on a combinatorial order book</span>
      </div>
    </div>

    <br/>

    <div className="flex-row-spacearound">

      <div>

        <div style={{border:"0px dotted green", width:"450px"}}>
          {/* Number of outcomes: {inv_vec.length} */}
          Number of atomic securities: {inv_vec.length}
          <InfoTip iconSize="" width="280px">
            <span>Since this is a combinatorial market, the atomic securities are traded together in bundles at prices and quantities specified in traders' orders. These trader bundles are represented as <b>r</b> vectors. In this example, r has three components, i.e. <b>r</b> = [r<sub>0</sub>, r<sub>1</sub>, r<sub>2</sub>]. The AMM's inventory is represented with a <b>Q</b> vector, or inventory vector. The cost to move the AMM's inventory vector is given by a <i>cost function</i> <b>C</b>. For example, the cost charged to a trader purchasing a bundle <b>r</b> is <b>C</b>(<b>Q</b> + <b>r</b>) - <b>C</b>(<b>Q</b>).</span>
          </InfoTip>

          <br/><br/>

          B parameter: <TangleText value={b_param} min={2} max={10000} step={1} size={4} onChange={this.onInputBval} onInput={this.onInputBval} />

          <br/><br/>

          Cost to subsidize LMSR market:<br/>
          B*log(N) = {b_param}*log({inv_vec.length}) = ${lmsr_bounded_loss.toFixed(2)}
        </div>

        <br/>

        <div className="flex-column-start depthChartContainer" style={{'width':'450px', 'height':'400px', 'borderTop':'1px solid gray'}}>
          {priceCharts}
        </div>

      </div>



      <div className="flex-column-start-center" style={{border:"0px solid red"}}>

        <div>

          <div style={{'textAlign':'center'}}>
            Inventory Vector:
              <InfoTip iconSize="" width="280px">
                <span>The inventory vector or <b>Q</b> vector represents the amount of inventory purchased by traders from the AMM. Each element of the Q vector is the number of shares, or binary options, purchased by traders on that particular outcome or state. For example, if Q = [150, 25, 50], then traders have purchased 150 shares on on the outcome q0, 25 shares on the  outcome q1, and 50 shares on the outcome q2.</span>
              </InfoTip>
          </div>

          <StackedBarChart data={bar_data_stacked} width={300} height={170} title='Inventory' />

          <div className="flex-row-spacebetween" style={{marginLeft:"60px", width:"210px"}}>
            {qi_textboxes}
          </div>

        </div>


        <div>
          <br/><br/>
          <div style={{'textAlign':'center'}}>
            Outcome Prices:<br/>
            [{outcome_prices.join(", ")}]
          </div>
          <BarChart data={bar_data_prices} yAxis={[0, 1]} width={250} height={200} fill={'cornflowerblue'} title='Prices' />
        </div>

      </div>



    </div>



  </div>
)}).jsx;









class Market {
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


export default new Market()
