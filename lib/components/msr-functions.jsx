
import d3 from 'd3';

import _ from 'lodash';





 function costLMSR(b, state_vector) {
	  var lmsr_sum = state_vector.reduce((memo, q) => memo + Math.exp(q/b), 0);
	  var cost = b * Math.log(lmsr_sum);
	  return cost;
	}



 function priceLMSR(b, state_vector, q_i) {
	  var lmsr_sum = state_vector.reduce((memo, q) => memo + Math.exp(q/b), 0);
	  var prices;
	  if (q_i === undefined) { // get all prices
	    prices = state_vector.map(q => Math.exp(q/b)/lmsr_sum);
	  } else { // only get price of q_i
	    prices = Math.exp(state_vector[q_i]/b)/lmsr_sum;
	  }
	 
	  return prices;
	}




	// input: desired price/probability
	// output: amount of shares to buy
	// q1 = b * ln( (e^q2/b + e^q3/b) * p/1-p )
function depthLMSR(b, state_vector, p) {
	// depth to price p
	// add argument to specify which outcome/q_i to query?

	  var prices = priceLMSR(b, state_vector);

	  // share amount to purchase to move price to p for each outcome
	  var depths =
	    state_vector.map((q_state, q_i) => {
	      var lmsr_sum = state_vector.reduce((memo, q, i) => (i == q_i) ? memo + 0 : memo + Math.exp(q/b), 0);
	      //var lmsr_sum = state_vector.reduce((memo, q, i) => memo + Math.exp(q/b), 0);
	      var depth_q_i = b * Math.log(lmsr_sum * p/(1-p));
	      var additional_shares_needed = depth_q_i - q_state;
	      return additional_shares_needed;
	    });

	  // cost to purchase share amount q_i_shares
	  var costs = depths.map((q_i_shares, i) => {
	    var q_bundle = Array.from(state_vector);
	    q_bundle[i] += q_i_shares;
	    var cost = costLMSR(b, q_bundle) - costLMSR(b, state_vector);
	    return cost;
	  });

	  return costs;
	}







function depthShortLMSR(b, state_vector, p, q_i) {
	  // p is a series [...0.2, 0.1, 0.01]  [x, ..., 0] 
	  // q_i is the outcome (state_vector) index 
	  // to move the price lower, have to buy one unit of each of the other outcomes

	  // ** cannot query sell depth by price (getting lsmr depth at prices below a current price, is a curve that hits the B subsidy cost when price=0.0)
	  // ** besides selling, the other way to push the price lower is to "buy" the other outcomes. 
	  // ** to query that other "sell" depth, we map each inventory vec (of buying the other outcomes) to a cost and price ((y,x) on depth chart)

	  // rule of thumb: to move the price of a single component q_i to below 1%,
	  //  move the state_vector to where all the other outcomes are 4*b higher than q_i
	  //  i.e. the lowest outcome (other than q_i) is 4*b higher than q_i

	  //map from 0% to 100% of 4*b.  [0 .. 4*b]
	  var q_range = d3.range(0, 4, 0.25).map((i) => i*b);

	  var costs_and_prices =
	    q_range.map((q_add) => {
	      var q_bundle = state_vector.map((q, i) => (i == q_i) ? q : q+q_add); // add q_add to all components except q_i
	      var cost = costLMSR(b, q_bundle) - costLMSR(b, state_vector);
	      var qi_price = priceLMSR(b, q_bundle, q_i);
	      return {'cost':cost, 'price':qi_price};
	   });
	  
	  // return a series of costs, reaching a maximum at the point where p is 0.01. (will reach a price slightly lower than 0.01)
	  return costs_and_prices;
	}






	// input: cost ($ to spend)
	// output: amount of shares to purchase
	// x_i: amount of shares of q_i
	// two-outcome formula:  x_i = q1 - b*ln( (e^C/b * (e^q1/b + e^q2/b)) - e^q2/b )

function getSharesAmountFromCost (cost_to_spend, q_i, b, state_vector) {
	  var lmsr_sum_all = state_vector.reduce((memo, q) => memo + Math.exp(q/b), 0);
	  var lmsr_sum_qj = state_vector.reduce((memo, q, i) => (i == q_i) ? memo + 0 : memo + Math.exp(q/b), 0);

	  var shares_amount = state_vector[q_i] - b*Math.log((Math.exp(cost_to_spend/b)*lmsr_sum_all) - lmsr_sum_qj);
	  return Math.abs(shares_amount);
	}








class MSR {
  constructor() {
    //this.varname = 'asdf'
    //this.parent_cursor_ref = ;

    this.costLMSR = costLMSR;
    this.priceLMSR = priceLMSR;
    this.depthLMSR = depthLMSR;
    this.getSharesAmountFromCost = getSharesAmountFromCost;
    this.depthShortLMSR = depthShortLMSR;
  }
  
  init(orderbook_ref, bid_table_ref, lp_result_ref) {

  }





}


export default new MSR()