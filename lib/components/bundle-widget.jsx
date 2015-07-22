/** @jsx React.DOM */

import React from 'react';
import immstruct from 'immstruct';
import component from 'omniscient';
import Immutable from 'immutable';
import TangleText from './tangle-text.jsx!';
import _ from 'lodash';
import rd3 from 'react-d3';

import PayoffLineChart from './deps/payoff-linechart.js!jsx';

import { InfoTip } from './info-tip.jsx!'

import CheckboxGroup from './react-checkbox-group.jsx!';

import { ChartContainer } from './grouped-stacked-barchart.jsx!';
var GroupStackedBarChart = ChartContainer;




var structure = immstruct({
  market: {
    longLeverage: 2,
    shortLeverage: 0,
    optionStrikePrice: 7,
    premiumPrice: 1.5,

    showBundles: ['buy_put', 'write_put']
  }
});




var inputMixin = {

  onInputLongLeverage: function (val) {
  	this.props.cursor.update('longLeverage', (old_val) => val.target.value);
  },

  onInputShortLeverage: function (val) {
  	this.props.cursor.update('shortLeverage', (old_val) => val.target.value);
  },

  onStrikePriceChange: function (val) {
    this.props.cursor.update('optionStrikePrice', (old_val) => val.target.value);
  },

  onPremiumChange: function (val) {
    this.props.cursor.update('premiumPrice', (old_val) => val.target.value);
  },


  handleBundlesChange: function () {
    var selectedBundles = this.refs.bundlesGroup.getCheckedValues();
    this.props.cursor.update('showBundles', (oldVec) => Immutable.fromJS(selectedBundles) );
  },




};


// when passing a mixedin, need to use function() {} as fat arrows () => () bind and lose `this`
var StateView = component(inputMixin, function (cursor) {
  //console.log('stateview component cursor:', cursor);
  var curs = cursor.cursor;

  var option_premium = curs.get('premiumPrice');

  var show_bundles = curs.get('showBundles').deref().toArray();


  var discrete_log_returns = _.range(7, -8, -1).map((i) => Math.exp(Math.log(1.1)*i)); // log chart has constant slope of Math.log(1.1)

  //var discrete_linear_returns = _.range(2, 0.5, -0.1); // [2, 1.9, 1.8, ..., 0.5]


  var stable_dollars_amount = 1000;

  var stable_test = discrete_log_returns.map((e) => e*stable_dollars_amount);

  var test_labels = stable_test.map((q, i) => `q${i}`);
  var usd_labels = discrete_log_returns.map((e) => "$" + (e*10).toFixed(2) ).reverse();



	var short_leverage = curs.get('shortLeverage');


  var initial_price = 10; // $10 USD starting price

  var log_returns = discrete_log_returns;
  var outcome_prices = log_returns.map((log_return) => log_return*initial_price);


  var short_percent_change = log_returns.map((log_return) => (log_return - 1)*short_leverage);
  var short_dollar_payouts = short_percent_change.map((pc) => (1+pc)*initial_price);
  var short_coin_payouts = short_dollar_payouts.map((usd_payout, i) => usd_payout/outcome_prices[i]);


  var short_coin_payouts_truncated = short_coin_payouts.map((coin_payout) => coin_payout > 2 ? 2 : coin_payout);
  short_coin_payouts_truncated = short_coin_payouts_truncated.map((coin_payout) => coin_payout < 0 ? 0 : coin_payout);



  var short_bet_amount = 100; // 100 coins at $10 per coin = $1000 bet
  var short_test = log_returns.map((e) => e*short_bet_amount);
  var short_bundle = short_coin_payouts_truncated.map((coin_payout) => coin_payout*short_bet_amount);
  var short_bundle_usd_payout = short_bundle.map((coin_payout, i) => coin_payout*outcome_prices[i]);
  var short_max_payout_coins = _.max(short_bundle);

	var long_leverage = curs.get('longLeverage');
  var long_percent_change = log_returns.map((log_return) => (log_return - 1)*long_leverage);
  var long_dollar_payouts = long_percent_change.map((pc) => (1+pc)*initial_price);
  var long_coin_payouts = long_dollar_payouts.map((usd_payout, i) => usd_payout/outcome_prices[i]);

  var long_coin_payouts_truncated = long_coin_payouts.map((coin_payout) => coin_payout > 2 ? 2 : coin_payout);
  long_coin_payouts_truncated = long_coin_payouts_truncated.map((coin_payout) => coin_payout < 0 ? 0 : coin_payout);


  var long_bet_amount = 100; // 100 coins at $10 per coin = $1000 bet
  var long_bundle = long_coin_payouts_truncated.map((coin_payout) => coin_payout*long_bet_amount);
  var long_bundle_usd_payout = long_bundle.map((coin_payout, i) => coin_payout*outcome_prices[i]);

  var initial_investment = long_bet_amount*initial_price;

  var long_max_payout_coins = _.max(long_bundle);


  var limit_order_short = {
    inv_vector: short_bundle.reverse() // stable_bundle
  };


  var limit_order_long = {
    inv_vector: long_bundle.reverse() // stable_bundle
  };








  var option_strike_price = curs.get('optionStrikePrice');
  var strike_price_slider_val = curs.get('optionStrikePrice');



  //var usd_labels = discrete_log_returns.map((e) => "$" + (e*10).toFixed(2) ).reverse();
  var usd_prices = discrete_log_returns.map((e) =>  parseFloat((e*10).toFixed(2)) ).reverse();
  // usd_prices: [5.13,5.64,6.21,6.83,7.51,8.26,9.09,10,11,12.1,13.31,14.64,16.11,17.72,19.49]

  var short_payoff_series =
    short_bundle_usd_payout.reverse().map((usd_pay, i) => {
      return {
        x: usd_prices[i],
        y: usd_pay - initial_investment
      }
    });



  var long_payoff_series =
    long_bundle_usd_payout.reverse().map((usd_pay, i) => {
      return {
        x: usd_prices[i],
        y: usd_pay - initial_investment
      };
    });


  /*
  var long_payoff_coin_series =
    long_bundle.map((coin_pay, i) => {
      return {
        x: usd_prices[i],
        y: coin_pay - long_bet_amount
      };
    });
  */

  //console.log('long_payoff_series:', payoff_series);


  var payoffData = [

    {
      name: 'short payoff in USD',
      values: short_payoff_series
    },

    {
      name: 'long payoff in USD',
      values: long_payoff_series
    }
    /*
    {
      name: 'long payoff in COIN',
      values: long_payoff_coin_series
    }
    */

  ];





  var outcome_strike_prices = outcome_prices.slice().reverse();
  var usd_strike_price = outcome_strike_prices[option_strike_price];
  var option_bet_amount = 100;

  var outcome_prices_usd = outcome_prices.slice().reverse();
  var strike_price_usd = outcome_prices_usd[option_strike_price];
  var strike_price_index = strike_price_slider_val;

  var lower_strike_price = d3.min(outcome_prices_usd);
  var upper_strike_price = d3.max(outcome_prices_usd);
  var strike_price = outcome_prices_usd[strike_price_index];
  var put_payoff_max = ((strike_price - lower_strike_price)/lower_strike_price)*option_bet_amount;
  var call_payoff_max = ((upper_strike_price - strike_price)/upper_strike_price)*option_bet_amount;

  var option_unit_ratio = put_payoff_max/call_payoff_max;


  //var buy_call_amount = option_bet_amount;
  // scale such that the call max payoff in coins is equal to the put max payoff
  var buy_call_amount = option_bet_amount*option_unit_ratio;


  var buy_call_usd_returns = outcome_prices.map((qi, i) => {
    if (i > strike_price_index) {
      var price_diff = outcome_prices_usd[i] - outcome_prices_usd[strike_price_index];
      return Math.abs(price_diff);
    } else {
      return 0;
    }
  });

  var buy_call_usd_payoffs = buy_call_usd_returns.map((usd_return) => usd_return*buy_call_amount);

  var buy_call_coin_payoffs = buy_call_usd_payoffs.map((usd_payoff,i) => usd_payoff/outcome_prices_usd[i]);

  var call_max_payoff = _.max(buy_call_coin_payoffs);

  var write_call_coin_payoffs = buy_call_coin_payoffs.map((call) => call_max_payoff - call);




  var buy_put_amount = option_bet_amount; // multiply by the premium. eg. 100 options for $3 premium, buy_put for $300 at $10 = 30 COIN.

  var buy_put_usd_returns = outcome_prices.map((qi, i) => {
    if (i < strike_price_index) {
      var price_diff = outcome_prices_usd[i] - outcome_prices_usd[strike_price_index];
      return Math.abs(price_diff);
    } else {
      return 0;
    }
  });


  var buy_put_usd_payoffs = buy_put_usd_returns.map((usd_return) => usd_return*buy_put_amount);

  var buy_put_coin_payoffs = buy_put_usd_payoffs.map((usd_payoff,i) => usd_payoff/outcome_prices_usd[i]);

  var put_max_payoff = _.max(buy_put_coin_payoffs);

  var write_put_coin_payoffs = buy_put_coin_payoffs.map((put) => put_max_payoff - put);



  // straddle = buy_call + buy_put
  var straddle_bundle = vectorSum(buy_call_coin_payoffs, buy_put_coin_payoffs);


  // butterfly = write_call + write_put, but only sum on outcomes above (below) the strike price.
  var butterfly_bundle =
    write_call_coin_payoffs.map((wc,i) => {
      if (i < strike_price_index) {
        return write_put_coin_payoffs[i];
      }
      if (i > strike_price_index) {
        return write_call_coin_payoffs[i];
      }
      if (i == strike_price_index) {
        return write_call_coin_payoffs[i];
      }
    });






  var current_price = initial_price;

  var put_option_premium_price = option_premium; // e.g. $2 * 100 = 200
  //var put_option_premium_coins = put_option_premium_price*buy_put_amount/current_price; // 20 COIN premium if charge $2.00 for a bundle of 100
  var put_option_premium_coins = put_option_premium_price*option_bet_amount/current_price; // 20 COIN premium if charge $2.00 for a bundle of 100
  var buy_put_bundle_cost_coins = put_option_premium_coins;
  var write_put_bundle_cost_coins = put_max_payoff - put_option_premium_coins;

  var call_option_premium_price = option_premium;
  //var call_option_premium_coins = call_option_premium_price*buy_call_amount/current_price;
  var call_option_premium_coins = call_option_premium_price*option_bet_amount/current_price;

  var buy_call_bundle_cost_coins = call_option_premium_coins;
  var write_call_bundle_cost_coins = call_max_payoff - call_option_premium_coins;

  var straddle_bundle_cost_coins = buy_put_bundle_cost_coins + buy_call_bundle_cost_coins;
  var straddle_bundle_max_payoff = _.max([call_max_payoff, put_max_payoff]);

  var butterfly_bundle_cost_coins = straddle_bundle_max_payoff - straddle_bundle_cost_coins;
  var butterfly_bundle_max_payoff = _.max(butterfly_bundle);



  function riskToWinText(bundle_type) {
    var riskText;
    var winText;
    var styleClass;
    if (bundle_type === 'write_put') {
      styleClass = "write";
      riskText = `risks: ${(put_max_payoff - buy_put_bundle_cost_coins).toFixed(2)} BTC`;
      winText = `to win ${buy_put_bundle_cost_coins.toFixed(2)} BTC`;
    }
    if (bundle_type === 'buy_put') {
      styleClass= "buy";
      riskText = `risks: ${buy_put_bundle_cost_coins.toFixed(2)} BTC`;
      winText = `to win: ${(put_max_payoff - buy_put_bundle_cost_coins).toFixed(2)} BTC`;
    }

    if (bundle_type === 'write_call') {
      styleClass = "write";
      riskText = `risks: ${(call_max_payoff - buy_call_bundle_cost_coins).toFixed(2)} BTC`;
      winText = `to win ${buy_call_bundle_cost_coins.toFixed(2)} BTC`;
    }
    if (bundle_type === 'buy_call') {
      styleClass= "buy";
      riskText = `risks: ${buy_call_bundle_cost_coins.toFixed(2)} BTC`;
      winText = `to win: ${(call_max_payoff - buy_call_bundle_cost_coins).toFixed(2)} BTC`;
    }


    if (bundle_type === 'straddle') {
      styleClass = "buy";
      riskText = `risks: ${straddle_bundle_cost_coins.toFixed(2)} BTC`;
      winText = `to win: ${(straddle_bundle_max_payoff - straddle_bundle_cost_coins).toFixed(2)} BTC`;
    }

    if (bundle_type === 'butterfly') {
      styleClass = "write";
      riskText = `risks: ${(straddle_bundle_max_payoff - straddle_bundle_cost_coins).toFixed(2)} BTC`;
      winText = `to win ${straddle_bundle_cost_coins.toFixed(2)} BTC`;
    }

    if (bundle_type === 'short') {
      styleClass= "buy";
      riskText = `risks: ${short_bet_amount.toFixed(2)} BTC`;
      winText = `to win: ${(short_max_payout_coins - short_bet_amount).toFixed(2)} BTC`;
    }

    if (bundle_type === 'long') {
      styleClass= "write";
      riskText = `risks: ${long_bet_amount.toFixed(2)} BTC`;
      winText = `to win: ${(long_max_payout_coins - long_bet_amount).toFixed(2)} BTC`;
    }

    return {'risk':riskText, 'win':winText};
  }


  var OptionLabels = {
    'buy_call':"Buy a Call",
    'write_call':"Write a Call",
    'buy_put':"Buy a Put",
    'write_put':"Write a Put",
    'straddle':"Straddle",
    'butterfly':"Butterfly",
    'short':"Short Bundle",
    'long':"Long Bundle"
  };


  var BUNDLE_COLOR_DEFS = {
    'short':"#882255",
    'long':"#117733",
    'buy_call':"#999933",
    'write_call':"#DDCC77",
    'buy_put':"#CC6677",
    'write_put':"#88CCEE",
    'straddle':"#332288",
    'butterfly':"#44AA99"
  };



var OPTION_TOOLTIPS = {
  'straddle': (<div style={{display:'inline-block', marginTop:"-10px"}}>
                <InfoTip iconSize="">
                  <span>A <a href="http://en.wikipedia.org/wiki/Straddle">straddle</a> is a bet <i>on</i> volatility. The bettor wins if the price changes, whether up or down; max payoff at either end of the range ($5.13 or $19.49).</span>
                </InfoTip>
              </div>),
  'butterfly': (<div style={{display:'inline-block', marginTop:"-10px"}}>
                  <InfoTip iconSize="">
                    <span>A <a href="https://en.wikipedia.org/wiki/Butterfly_(options)">butterfly</a> is a bet <i>against</i> volatility. The bettor wins if the price goes sideways; max payoff if BTC price is at $10.00 when the option expires.</span>
                  </InfoTip>
                </div>)
};






  function bundleCheckbox(bundle_type) {
    var risk_to_win = {'risk':'', 'win':''};
    if (_.contains(show_bundles, bundle_type)) {
      risk_to_win = riskToWinText(bundle_type);
    }

    var bundle_class = bundle_type.replace("_","-");

    var bundle_color = BUNDLE_COLOR_DEFS[bundle_type];

    return (
      <div>
        <div className="flex-row-start-center" style={{marginTop:"-5px", marginLeft:"10px"}}>

          <div>
            <label className={"option-group " + bundle_class}>
              <input type="checkbox"
                className="option-group"
                name="bundle"
                value={bundle_type}
              />
              <div className={"option-checkbox " + bundle_class}></div>
            </label>
          </div>

          <div style={{display:'inline-block'}}>
            {OptionLabels[bundle_type]}
          </div>
          { _.has(OPTION_TOOLTIPS, bundle_type) ? OPTION_TOOLTIPS[bundle_type] : '' }
        </div>

        <div id="riskToWin" className="">
          <span>{risk_to_win.risk}</span>
          <br/>
          <span>{risk_to_win.win}</span>
        </div>

      </div>
    );

  }













  var limit_order_buy_call = {
    inv_vector: buy_call_coin_payoffs,
    type: 'buy_call'
  };

  var limit_order_write_call = {
    inv_vector: write_call_coin_payoffs,
    type: 'write_call'
  };


  var limit_order_buy_put = {
    usd_labels: usd_labels,
    inv_vector: buy_put_coin_payoffs,
    type: 'buy_put'
  };

  var limit_order_write_put = {
    inv_vector: write_put_coin_payoffs,
    type: 'write_put'
  };



  var butterfly_portfolio = {
    inv_vector: butterfly_bundle,
    type: 'butterfly'
  };

  var straddle_portfolio = {
    inv_vector: straddle_bundle,
    type: 'straddle'
  };







  var bundleTypeCollection = {
    'short': limit_order_short,
    'long': limit_order_long,
    'buy_put': limit_order_buy_put,
    'write_put': limit_order_write_put,
    'buy_call': limit_order_buy_call,
    'write_call': limit_order_write_call,
    'straddle': straddle_portfolio,
    'butterfly': butterfly_portfolio
  };


  var limit_order_bundles = show_bundles.map((bundle_type) => bundleTypeCollection[bundle_type]);





  // payoff series is for the payoff diagram line chart

  var buy_call_payoff_series =
  buy_call_coin_payoffs.map((coin_payoff, i) => {
    return {
      x: usd_prices[i],
      y: coin_payoff - buy_call_bundle_cost_coins
    };
  });

  var write_call_payoff_series =
  write_call_coin_payoffs.map((coin_payoff, i) => {
    return {
      x: usd_prices[i],
      y: coin_payoff - write_call_bundle_cost_coins
    };
  });



  var buy_put_payoff_series =
  buy_put_coin_payoffs.map((coin_payoff, i) => {
    return {
      x: usd_prices[i],
      y: coin_payoff - buy_put_bundle_cost_coins
    };
  });

  var write_put_payoff_series =
  write_put_coin_payoffs.map((coin_payoff, i) => {
    return {
      x: usd_prices[i],
      y: coin_payoff - write_put_bundle_cost_coins
    };
  });



  var straddle_payoff_series =
  straddle_bundle.map((coin_payoff, i) => {
    return {
      x: usd_prices[i],
      y: coin_payoff - straddle_bundle_cost_coins
    };
  });

  var butterfly_payoff_series =
  butterfly_bundle.map((coin_payoff, i) => {
    return {
      x: usd_prices[i],
      y: coin_payoff - butterfly_bundle_cost_coins
    };
  });





  var payoffSeriesTypes = {
    'buy_call': buy_call_payoff_series,
    'write_call': write_call_payoff_series,
    'buy_put': buy_put_payoff_series,
    'write_put': write_put_payoff_series,
    'straddle': straddle_payoff_series,
    'butterfly': butterfly_payoff_series
  };

  var optionPayoffDiagramData =
    show_bundles.filter((bt) => !(bt == "short" || bt == "long"))
      .map((bundle_type) => {
      return {
        name:bundle_type,
        values: payoffSeriesTypes[bundle_type],
        color: BUNDLE_COLOR_DEFS[bundle_type]
      };
    });



  var bundle_colors = show_bundles.map((bundle_type) => BUNDLE_COLOR_DEFS[bundle_type]);




  return (
  <div>


  	<div className="flex-row-space">


      <div style={{border:"0px dotted gray", overflow:"visible", width:"470px"}}>

        <div style={{border:"0px solid black", width:"470px"}}>

          <div style={{'textAlign':'center', paddingBottom:"10px"}}>
            <b>Visualizing the Payoffs of Binary Option Portfolios</b>
          </div>


          <GroupStackedBarChart
            dataBidBundles={limit_order_bundles}
            outcomePrices={outcome_prices.reverse()}
            outcomeLabels={usd_labels}
            colors={bundle_colors}
            width={400}
            height={400}
          />


          <div style={{marginTop:"15px"}}>
            Number of outcomes: {outcome_prices.length}
            <InfoTip width="300px" iconSize="">
              <span>
                The discrete set of prices [$5.13, $5.64, ..., $17.72, $19.49] is the <b>outcome space</b>. Each outcome or state represents an item or atomic security (i.e. a binary option) that is traded in the combinatorial market. On the expiration date, one outcome will be realized, and the binary options for that outcome will be worth 1 unit of the numeraire (BTC); the binary options for all other outcomes will be worth 0 units of the numeraire.
              </span>
            </InfoTip>
          </div>

          <div style={{marginTop:"15px"}}>
            Market numeraire: BTC
            <InfoTip width="300px" iconSize="">
              <span>
                The <b>numeraire</b> is the currency used in the market. More specifically, the numeraire specifies a unit amount of some currency, and all binary options in the market will payoff either one unit of the numeraire, or zero. Since this example is an on-chain market where the only currency available is BTC, we must use BTC as the numeraire.
              </span>
            </InfoTip>
          </div>

        </div>



      </div>





      <div className="flex-column-start" style={{width:"380px", border:"red solid 0px"}}>


        <div>

  				<CheckboxGroup
  					name="bundles"
  					value={show_bundles}
  					ref="bundlesGroup"
  					onChange={this.handleBundlesChange}>

  					<div>

              <div>
                <b>CFD BETS</b><InfoTip iconSize=""><span>We use bundles of binary options to replicate the payoffs of <a href="https://en.wikipedia.org/wiki/Contract_for_difference">Contract for Difference</a> (CFD) bets at a desired leverage or "gearing ratio".</span></InfoTip>
              </div>
              <div style={{'border':"1px black dotted", borderRadius:"5px", "padding":"5px", marginBottom:"15px", paddingLeft:"10px", paddingRight:"10px"}}>

                <div className="flex-row-space">

                  <div className="flex-column-start">
                    <div>Short Leverage: {short_leverage}x</div>
                    <div style={{marginBottom:"5px"}}>
                      <input id="shortLeverage" key="shortLeverage" name="leverage"  type="range" min="-5" max="0" value={short_leverage} onChange={this.onInputShortLeverage} />
                    </div>

                    {bundleCheckbox("short")}

                  </div>



                  <div>
                    <br/>
                    <br/>
                    <i className="fa fa-arrows-h"></i>
                  </div>


                  <div className="flex-column-start">
                    <div>Long Leverage: {long_leverage}x</div>
                    <div style={{marginBottom:"5px"}}>
                      <input id="longLeverage" key="longLeverage" name="leverage" type="range" min="1" max="7" value={long_leverage} onChange={this.onInputLongLeverage} />
                    </div>

                    {bundleCheckbox("long")}

                  </div>

                </div>

              </div>


              <div style={{'textAlign':'center'}}>
                <b>OPTION BETS</b><InfoTip iconSize=""><span>We use bundles of binary options to construct synthetic positions that replicate the payoffs of conventional options.</span></InfoTip>
              </div>
              <div style={{'border':"black dotted 1px", borderRadius:"5px", "padding":"5px"}}>

                <div className="flex-row-space">

                  <div style={{textAlign:'center', marginTop:'0', marginLeft:"5px", marginBottom:'10px', 'display':'inline-block'}}>
                      Strike price: ${usd_strike_price.toFixed(2)}
                      <br/>
                      <input id="strikePrice" key="strikePrice" name="strikePrice" type="range" min="0" max={discrete_log_returns.length}
                        value={strike_price_slider_val}
                        onChange={this.onStrikePriceChange} />
                  </div>

                  <div style={{textAlign:'center', marginTop:'0', marginRight:"5px", marginBottom:'10px', 'display':'inline-block'}}>
                      Premium
                      {/*<sup>†</sup> */}
                      <div style={{display:'inline-block', marginTop:"-10px", marginLeft:"-5px"}}>
                        <InfoTip iconSize="">
                          <span>The <a href="http://www.investopedia.com/terms/o/option-premium.asp">premium</a> price is quoted in USD but paid in BTC (we assume the current BTC/USD price is $10.00). Since options are quoted in <a href="http://www.investopedia.com/terms/c/contractunit.asp">contract units</a> of 100 shares, a premium price of $1.50 means that the option buyer pays ($1.50/$10.00 = 0.15 BTC * 100) = 15 BTC to the option writer.</span>
                        </InfoTip>
                      </div>

                      : ${parseFloat(option_premium).toFixed(2)}
                      <br/>
                      <input id="premiumPrice" key="premiumPrice" name="premiumPrice" type="range" min="0" max="5" step="0.1"
                        value={option_premium}
                        onChange={this.onPremiumChange} />
                  </div>
                </div>



                <div className="optionFlexTable">

                  <div className="optionHeader"></div>

                  <div className="optionColTable">

                    <div className="optionColumn left">

                      {bundleCheckbox("buy_call")}

                      {bundleCheckbox("buy_put")}

                      {bundleCheckbox("straddle")}

                    </div>


                    <div className="optionColumn center" style={{"alignItems":"center", fontSize:"18px", borderBottom:"1px solid black"}}>
                      <div><i className="fa fa-arrows-h"></i></div>
                      <div><i className="fa fa-arrows-h"></i></div>
                      <div><i className="fa fa-arrows-h"></i></div>
                    </div>


                    <div className="optionColumn right">

                      {bundleCheckbox("write_call")}

                      {bundleCheckbox("write_put")}

                      {bundleCheckbox("butterfly")}

                    </div>


                  </div> {/* close optionColTable */}


                </div> {/* close optionFlexTable */}


  						</div>

  					</div>
  				</CheckboxGroup>


        </div>



        <div style={{width:"380px", height:"220px", border:"0px solid green", marginTop:"20px"}}>

          <div style={{height:"20px"}}>
            <b>Option Payoff Diagram</b>
            <InfoTip iconSize="">
              <span><a href="http://www.google.com/images?q=option+payoff+diagram">Payoff diagrams</a> are used to plot the Profit & Loss (PnL) curves of option strategies. Here we plot the PnL curves for the selected synthetic positions.</span>
            </InfoTip>
          </div>


          <div className="flex-row-start-center" style={{marginTop:"-20px", marginLeft:"-25px"}}>

            <div style={{'transform':'rotate(-90deg)', 'WebkitTransform':'rotate(-90deg)', border:"0px solid green", marginRight:"-30px"}}>
              PnL (BTC)
            </div>

            <div style={{border:"0px dotted red"}}>
              <PayoffLineChart
                legend={false}
                data={optionPayoffDiagramData}
                width={350}
                height={200}
              />
            </div>

          </div>


        </div>

      </div>

   	</div>


  </div>
)}).jsx;





function vectorSum(vec_a, vec_b) {
  return vec_a.map((a,i) => a + vec_b[i]);
}






class BundleWidget {
  constructor() {

  }

  init(el) {

    render(el);
    structure.on('swap', render);

    function render () {
      React.render( <StateView cursor={structure.cursor('market')} />, el);
    }

  }
}


export default new BundleWidget()
