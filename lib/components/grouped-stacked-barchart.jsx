/**
* @jsx React.DOM

// this code is a mashup of http://codepen.io/chris-creditdesign/pen/xEnbv and http://bl.ocks.org/herrstucki/b226253275b248c04a61
*/

import React from 'react';
import d3 from 'd3';
import _ from 'lodash';

import classNames from 'classnames';

import { InfoTip } from './info-tip.jsx!'




var ChartMixin = {
  propTypes: {
    xScale: React.PropTypes.func.isRequired,
    yScale: React.PropTypes.func.isRequired,
    data: React.PropTypes.array.isRequired,
    transitionDuration: React.PropTypes.number.isRequired
  },

  componentDidMount: function() {
    d3.select(this.getDOMNode())
      .call(this.renderData);
  },

  componentDidUpdate: function(prevProps, prevState) {
    this.xScale0 = prevProps.xScale;
    this.yScale0 = prevProps.yScale;

    this.prevPayoutMode = prevProps.payoutUSD;
    this.prevLayoutStacked = prevProps.stackedLayout;

    // attributes set on the node passed to renderData (this.getDOMNode()) will transition
    d3.select(this.getDOMNode()).transition().duration(this.props.transitionDuration)
      .call(this.renderData);
  },

  render: function() {
    return (
      this.transferPropsTo(<g />)
    );
  }
};



var XAxisLabeled = React.createClass({

  styleAxis: function() {

    var props = this.props;

    var offset = Math.round(props.xScale.rangeBand()/2);
    // place the x axis ticks in between the bars, rather than at the middle of the bars
    var offsetIntervalRange = _.map(props.xScale.range(), function(val) {
      //return val + offset;
      return val - 2;
    });

    var last_val = offsetIntervalRange[offsetIntervalRange.length-1];
    // add an extra tick for the right side of the last bar
    offsetIntervalRange.push(last_val + props.xScale.rangeBand() + 2);


    var xScaleIntervals = d3.scale.ordinal()
      .domain(d3.range(props.xScale.domain().length+1))
      .range(offsetIntervalRange);


    var xAxisIntervals = d3.svg.axis()
      .scale(xScaleIntervals)
      //.ticks(props.xScaleIntervals.domain()[1])
      .orient("bottom");


    var xAxisLabels = d3.svg.axis()
      .scale(props.xScale)
      .orient("bottom");


    var nodeAxisTicks = d3.select(this.refs.barxaxisticks.getDOMNode());

    var nodeAxisLabels = d3.select(this.refs.barxaxislabels.getDOMNode());

    nodeAxisTicks.call(xAxisIntervals);

    nodeAxisLabels.call(xAxisLabels);

    // Style each of the tick lines
    nodeAxisTicks
      .selectAll('line')
      .attr("shape-rendering", "crispEdges")
      .attr("stroke", "#000");

    // Style the main axis line
    nodeAxisTicks
      .select('path')
      .attr("shape-rendering", "crispEdges")
      .attr("fill", "none")
      .attr("stroke", "#000");

    nodeAxisTicks.selectAll("text").remove(); // remove labels

    nodeAxisLabels.selectAll('line').remove(); // remove ticks
    nodeAxisLabels.select('path').remove(); // remove main line

    nodeAxisLabels.selectAll("text")
      .style("text-anchor", "middle")
      .attr("font-family", "Verdana")
      .attr("font-size", "14px")
      .attr("font-weight", "bold")
      .attr("dx", "-2.0em")
      .attr("dy", "0em")
      .attr("transform", function(d) {
        return "rotate(-60)"
      });


  },

  componentDidMount: function() {
    this.styleAxis();
  },

  componentDidUpdate: function() {
    //this.styleAxis();
  },


  render: function() {

    var t = "translate(" + this.props.xOffset + "," + this.props.height + ")"
    return (
      <g transform={t}>
        <g ref='barxaxisticks' className="barx axis log"></g>
        <g ref='barxaxislabels' className="barx axis log"></g>
      </g>

    );
  }

});







var Axis = React.createClass({
  propTypes: {
    scale: React.PropTypes.func.isRequired,
    orient: React.PropTypes.string.isRequired,
    transitionDuration: React.PropTypes.number.isRequired
  },

  componentDidMount: function() {
    this.axis = d3.svg.axis()
      .scale(this.props.scale)
      .orient(this.props.orient);
    d3.select(this.getDOMNode()).call(this.axis);
  },

  componentDidUpdate: function(prevProps, prevState) {
    this.axis
      .scale(this.props.scale)
      .orient(this.props.orient);

    d3.select(this.getDOMNode()).transition().duration(this.props.transitionDuration)
      .call(this.axis);
  },

  render: function() {
    return this.transferPropsTo(<g />);
  }
});




var Bars = React.createClass({
  mixins: [ChartMixin],

  renderData: function(g) {
    var x = this.props.xScale;
    var y = this.props.yScale;
    var x0 = this.xScale0 || x;
    var y0 = this.yScale0 || y;
    var data = this.props.data;


    var height = this.props.height;
    var colors = this.props.colors;

    var yMargin = this.props.yMargin;
    //var xOffset = this.props.xOffset;
    var stackedLayout = this.props.stackedLayout;
    var payoutUSD = this.props.payoutUSD;

    //var payoutModeChange = this.props.payoutModeChange;
    var transitionDuration = this.props.transitionDuration;


    var tooltipHandler = this.props.onTooltip;


    var prevPayoutMode = this.prevPayoutMode;
    var prevLayoutStacked = this.prevLayoutStacked;

    var payoutModeChanged = false;
    var layoutStackedChanged = false;


    if (prevPayoutMode !== undefined) {
      if (prevPayoutMode !== payoutUSD) {
        payoutModeChanged = true;
      }

      if (prevLayoutStacked !== stackedLayout) {
        layoutStackedChanged = true;
      }

    }


    var x_max = x.range()[1];
    var num_of_bars;
    if (data[0] !== undefined) {
      num_of_bars = data[0].length;
    } else {
      num_of_bars = 1;
    }

    var num_of_groups = data.length;

    var bar_width_stacked = Math.floor(x_max/(num_of_bars+1))-5;
    var bar_width_grouped = Math.floor(x_max/((num_of_bars+1)*num_of_groups))-1;


    var yGrouped = function(d) { return y(d.y); };
    var yStacked = function(d) { return y(d.y) + y(d.y0) - (height-yMargin); };

    var yFunction = stackedLayout ? yStacked : yGrouped;

    var xStacked = function(d) { return x(d.x); };
    var xGrouped = function(d,i,j) { return x(d.x) + (bar_width_grouped+1)*j; };
    var xFunc = stackedLayout ? xStacked : xGrouped;

    var widthStacked = function(d) { return bar_width_stacked; };
    var widthGrouped = function(d) { return bar_width_grouped; };
    var widthFunc = stackedLayout ? widthStacked : widthGrouped;

    var heightFunc = function(d) { return (height-yMargin) - y(d.y); };


    var tooltipProps = {};


    // the ChartMixin componentDidUpdate calls this with a transition.
    // g.each applies that transition to only one group - g.bars
    g.each(function() {


      // each element in the data array is a series. create a group for each series
      var groups = d3.select(this).selectAll("g")
        .data(data)
        .enter()
        .append("g")
        .classed("series", true)
        .style("fill", function(d, i) { return colors[i]; });


      // create a bar for each datapoint within each series
      var bars = groups.selectAll('rect')
        .data(function(d) { return d; });




      // append the bars. if bars already exist, this enter selection is empty
      bars.enter().append('rect')
        .attr('x', xFunc)
        .attr('y', yFunction)
        .attr('width', widthFunc)
        .attr('height', heightFunc)
        // bind tooltip handlers on append
        .on("mouseover", function(d,i,j) {
          //console.log('bar mouseover. i: '+i+'  j:'+j);

          /* Get this bar's x/y values, then augment for the tooltip */
          var xPosition,
          yPosition = parseInt(d3.select(this).attr("y") );

          //console.log('bar yPosition:', yPosition);
          //console.log('bar d.y:', d.y);

          if (d3.select(this).attr("x") < 350) {

            if (!stackedLayout) {
                //console.log("We be grouped!");
                xPosition = parseFloat(d3.select(this).attr("x")) + 14;
              } else  {
                xPosition = parseFloat(d3.select(this).attr("x")) + 27;
              }

            tooltipProps.classedLeft = false;
            tooltipProps.classedRight = true;
          } else {
            xPosition = parseFloat(d3.select(this).attr("x")) - 143;

            tooltipProps.classedLeft = true;
            tooltipProps.classedRight = false;
          }

          //console.log('bar xPosition:', xPosition);

          /* Update the tooltip position and value */

          tooltipProps.posLeft = Math.round(xPosition) + "px";
          tooltipProps.posTop = Math.round(yPosition) + "px";
          tooltipProps.text = d.y.toFixed(2);
          tooltipProps.usd_val = d.usdVal;
          tooltipProps.coin_val = d.coinVal;
          tooltipProps.bar_i = i;
          tooltipProps.bar_j = j;
          tooltipProps.bar_val = d.y;
          tooltipProps.classedHidden = false;

          tooltipHandler(tooltipProps);
        })
        .on("mouseout", function() {
          /* Hide the tooltip */

          tooltipProps.classedHidden = true;
          tooltipHandler(tooltipProps);
        });


      // reselect appended bars to get update selection for transition
      var update_groups = d3.select(this).selectAll("g").data(data);
      update_groups.exit().remove();

      update_groups.style("fill", function(d, i) { return colors[i]; });


      var update_bars = update_groups.selectAll('rect');


      // update data to reset d.y between BTC or USD
      update_bars.data(function(d) { return d; })


      if (payoutModeChanged || !layoutStackedChanged) {
        // transition if payout mode changes or if bundle changes (!layoutStackedChanged)
        // transition y and height in sync with y-axis
        update_bars
          .transition()
          .duration(transitionDuration)
          .attr('height', heightFunc)
          .attr('y', yFunction)
          .attr('width', widthFunc)
          .attr('x', xFunc)
      }


      if (layoutStackedChanged) {
        if (stackedLayout) {
        // transition to stacked
        update_bars
          .transition()
          .duration(transitionDuration)
          .delay(function(d, i) { return i / data[0].length * transitionDuration; })
          .attr('y', yFunction)
          .attr('height', heightFunc)
          .transition()
          .duration(transitionDuration)
          .attr('x', xFunc)
          .transition()
          .attr('width', widthFunc)

        } else {
          // transition to grouped
          update_bars
            .transition()
            .duration(transitionDuration)
            .delay(function(d, i) { return i / data[0].length * transitionDuration; })
            .attr('width', widthFunc)
            .transition()
            .duration(transitionDuration)
            .attr('x', xFunc)
            .transition()
            .attr('y', yFunction)
            .attr('height', heightFunc)
        }
      }



    });

  }

});



var GuideLine = React.createClass({


  mixins: [ChartMixin],

  renderData: function(g) {
    var xScale = this.props.xScale;
    var yScale = this.props.yScale;

    var payoutUSD = this.props.payoutUSD;
    var layoutStacked = this.props.layoutStacked;


    var neutral_series = [];

    if (layoutStacked) { // only render neutral guideline in stacked layout
      neutral_series = [this.props.completeBundle];
    }


    var valueline = d3.svg.line()
      .x(function(d) { return xScale(d.x); })
      .y(function(d) { return yScale(d.y); });


    g.each(function() {

      var linePath = d3.select(this).selectAll("path");

      // append the line. if it already exists, this enter selection is empty
      linePath.data(neutral_series)
        .enter()
          .append("path")
          .attr("class", "guideline")
          .style("stroke-dasharray", ("3, 3"))
          .attr("d", valueline);


      //console.log('appended line. now updating');
      // reselect appended line to get update selection
      var update_line = d3.select(this).selectAll("path")
        .data(neutral_series);
        //.attr("d", valueline);

      update_line
        .attr("d", valueline);
        //.style("stroke", "purple");

      update_line.exit().remove();



    });

  }


});






var Tooltip = React.createClass({


  render: function() {

    var tooltipProps = this.props.tooltipProps;
    var outcomePrices = this.props.outcomePrices;
    var payoutUSD = this.props.payoutUSD;

    var tooltipClassStr = classNames({'tooltip':true, 'hidden':tooltipProps.classedHidden, 'tooltip-left':tooltipProps.classedLeft, 'tooltip-right':tooltipProps.classedRight});
    var tooltipStyles = {'left':tooltipProps.posLeft, 'top':tooltipProps.posTop};

    // bar_i, bar_j, bar_val
    var bar_outcome_price = '$' + (outcomePrices[tooltipProps.bar_i]).toFixed(2);
    var bar_outcome_payout = tooltipProps.bar_val.toFixed(2);
    var bar_usd_payout = tooltipProps.usd_val.toFixed(2);
    var bar_coin_payout = tooltipProps.coin_val.toFixed(2);
    var usd_payout_str = `$${bar_usd_payout} USD`;
    var coin_payout_str = `${bar_coin_payout} BTC`;
    var payout_str = payoutUSD ? usd_payout_str : coin_payout_str;
    var converted_payout_str = payoutUSD ? coin_payout_str : usd_payout_str;
    var tooltip_text = `payoff of ${payout_str} (${converted_payout_str}) for outcome price ${bar_outcome_price} BTC/USD`;


    return (
      <div className={tooltipClassStr} style={tooltipStyles}>
        <p><span>{tooltip_text}</span></p>
      </div>
    );



  }

});




var Legend = React.createClass({


  componentDidMount: function() {

    var legendLine = d3.svg.line()
      .x(function(d) { return d.x; })
      .y(function(d) { return d.y; });

    var legendData = [{x:0, y:10}, {x:20, y:10}, {x:30, y:10}];

    var legend_g = d3.select(this.getDOMNode()).select("g.legend");

    legend_g.selectAll("path").data([legendData]).enter()
      .append("path")
        .attr("class", "legendline")
        .style("stroke-dasharray", ("3, 3"))
        .attr("d", legendLine);


    legend_g.append("text")
       .attr("x", 35)
       .attr("y", 15)
       .text("Complete Bundle")
       .style("font-size", "14px");

  },


  render: function() {

    return (
      <svg width={160} height={25}>
        <g className="legend"></g>
      </svg>
    )

  }


});







var GroupStackedBarChart = React.createClass({

  getInitialState: function() {
    return {
      tooltipProps: {
        classedHidden:true,
        bar_i:0,
        bar_j:0,
        bar_val:0,
        usd_val:0,
        coin_val:0
      },
    };
  },


  onTooltip: function(tooltipProps) {
    //console.log('onTooltip tooltipProps:', tooltipProps);
    this.setState({tooltipProps: tooltipProps});
  },

  render: function() {

    var xScale = this.props.xScale;
    var yScale = this.props.yScale;
    var xTranslate = this.props.height - this.props.yMargin;
    var xAxisTransform = `translate(0, ${xTranslate})`;


    // x scale: .range([60, this.props.width - 30]).nice();

    //console.log('GroupStackedBarChart render this.props.outcomeLabels:', this.props.outcomeLabels);


    var xLabelsScale =
      d3.scale.ordinal()
        .domain(this.props.outcomeLabels)
        .rangeRoundBands([0, this.props.width - 60], 0.1);



    /* <XAxis
            xScale={xScale}
            margins={margins}
            USDLabels={usd_labels}
            width={this.props.width - sideMargins}
            height={this.props.height - topBottomMargins}
          />

        <Axis className='x axis' scale={xScale} orient='bottom' transform={xAxisTransform}  transitionDuration={500} />

        <XAxisLabeled

    */


    return (
      <div className="tooltip-container">
        <Tooltip tooltipProps={this.state.tooltipProps} outcomePrices={this.props.outcomePrices} payoutUSD={this.props.payoutUSD} />
        <svg width={this.props.width} height={this.props.height}>

          <XAxisLabeled
            xScale={xLabelsScale}
            USDLabels={this.props.outcomeLabels}
            xOffset={55}
            height={this.props.height - this.props.yMargin}
          />

          <Axis className='y axis' scale={yScale} orient='left' transform='translate(59, 0)'  transitionDuration={500} />
          <Bars className='bars' xScale={xScale} yScale={yScale} yMargin={this.props.yMargin} data={this.props.data} height={this.props.height} colors={this.props.colors} transitionDuration={500} stackedLayout={this.props.stackedLayout} payoutUSD={this.props.payoutUSD} onTooltip={this.onTooltip} />
          <GuideLine className='guideline' xScale={xScale} yScale={yScale} data={this.props.data} payoutUSD={this.props.payoutUSD} layoutStacked={this.props.stackedLayout}  completeBundle={this.props.completeBundle} transitionDuration={500} />
        </svg>
      </div>
    );
  }


});




var ChartContainer = React.createClass({
  getInitialState: function() {
    return {
      stacked: true,
      payoutUSD: false,
    };
  },

  onLayoutOption: function(val) {
    if (val.target.value !== 'stacked') {
      this.setState({ stacked: false });
    } else {
      this.setState({ stacked: true });
    }
  },

  onUSDOption: function(val) {
    if (val.target.value !== 'usd' && this.state.payoutUSD === true) {
      this.setState({ payoutUSD: false });
    }
    if (val.target.value === 'usd' && this.state.payoutUSD === false) {
      this.setState({ payoutUSD: true });
    }
  },



  render: function() {

    var outcomePrices = this.props.outcomePrices;

    var data_bid_bundles = this.props.dataBidBundles;

    var data_series_bundles = _.pluck(data_bid_bundles, 'inv_vector')

    var data_series = data_series_bundles.map((series) => {
      return series.map((qival, i) => {
        var coinVal = qival;
        var usdVal = parseFloat((qival*outcomePrices[i]).toFixed(2));
        return {
          x:i,
          coinVal: coinVal,
          usdVal: usdVal,
          y: this.state.payoutUSD ? usdVal : coinVal
        };
      });
    });


    var series_length = 0;
    if (_.first(data_series)) {
      series_length = _.first(data_series).length;
    }
    var zero_arr = new Array(series_length).fill(0);

    var coin_sums = data_series.reduce((memo, series) => {
      var coin_vals = _.pluck(series, 'coinVal');
      return coin_vals.map((val, i) => val + memo[i]);
    }, zero_arr);


    var max_coin = d3.max(coin_sums);
    var complete_bundle;

    if (this.state.payoutUSD) {
      complete_bundle = outcomePrices.map((price, i) => {
        return {x: i, y: max_coin*price};
      });
      //var last_price = _.last(outcomePrices) +
      //complete_bundle.push({x:outcomePrices.length, y:max_coin*last_price});
    } else {
      complete_bundle = zero_arr.map((z, i) => {
        return {x: i, y: max_coin};
      });
      //complete_bundle.push({x:outcomePrices.length, y:max_coin});
    }


    var stack = d3.layout.stack();
    stack(data_series);

    var data_series_stacked_merged = _.flatten(data_series);


    var xScale = d3.scale.linear()
      .domain(d3.extent(data_series_stacked_merged, function(d) { return d.x; }))
      .range([60, this.props.width - 30])
      .nice();


    var yMargin = 50;


    var max_y = d3.max(_.pluck(complete_bundle, 'y'));


    var yScale = d3.scale.linear()
      .domain([0, Math.round(max_y)])
      .range([this.props.height - yMargin, 30])
      .nice();




    return (
      <div className="flex-row-column">

        <div className="flex-row-start-center">

          <div style={{display:"inline-block", marginLeft:"80px"}}>
            <form>
              <div className="flex-column-start-start" style={{"fontSize":"14px"}}>
                <label><input type="radio" onChange={this.onLayoutOption} name="layoutmode" id="stacked" value="stacked" checked={this.state.stacked} /> Stacked</label>
                <label><input type="radio" onChange={this.onLayoutOption} name="layoutmode" id="grouped" value="grouped" checked={!this.state.stacked} /> Grouped</label>
              </div>
            </form>
          </div>

          &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;

          <div style={{display:"inline-block"}}>

            <div style={{width:"155px", height:"25px", border:"0px dotted pink", display:"inline-block"}}>
              <Legend />
            </div>

            <div style={{display:"inline-block", position:"relative", top:"-8px", left:"-5px"}}>
              <InfoTip iconSize="" width="280px">
                <span>A complete bundle, or riskless security, has the same payoff for all outcomes. Complementary bundles combine to form a complete bundle. If the selected bundles combine to form a complete bundle, the "Stacked" mode bar chart will appear flat across the top.</span>
              </InfoTip>
            </div>

          </div>

        </div>


        <div className="flex-row-start">

          <div className="flex-column-start-center" style={{border:'0px solid green', maxWidth:'25px'}}>

            <div style={{height:'180px'}}> </div>

            <div style={{'transform':'rotate(-90deg)', 'WebkitTransform':'rotate(-90deg)', 'width':'350px'}}>
              Payoff Amount
              &nbsp;&nbsp;
              <label><input type="radio" onChange={this.onUSDOption} name="payoutmode" id="coin" value="coin" checked={!this.state.payoutUSD} />BTC</label>
              &nbsp;&nbsp;&nbsp;
              <label><input type="radio" onChange={this.onUSDOption} name="payoutmode" id="usd" value="usd" checked={this.state.payoutUSD} />USD</label>
            </div>

            <div style={{height:'50px'}}> </div>

          </div>


          <div className="flex-column-center-center" style={{border:'0px solid purple'}}>
            <div>
              <GroupStackedBarChart
                width={this.props.width}
                height={this.props.height}
                xScale={xScale}
                yScale={yScale}
                yMargin={yMargin}
                stackedLayout={this.state.stacked}
                payoutUSD={this.state.payoutUSD}
                outcomePrices={this.props.outcomePrices}
                outcomeLabels={this.props.outcomeLabels}
                data={data_series}
                completeBundle={complete_bundle}
                colors={this.props.colors}
              />
            </div>

            <div style={{marginLeft:"45px"}}>
              BTC Price at Expiration Date (USD)
              <div style={{display:'inline-block', marginTop:"-10px", marginLeft:"-5px"}}>
                <InfoTip iconSize="">
                  <span>We assume that the current BTC/USD spot price is $10.00, and some arbitrary future expiration date (e.g. one week, one month, three months). The BTC/USD spot price on the expiration date is used to resolve the market outcome.</span>
                </InfoTip>
              </div>
            </div>

          </div>

        </div>

      </div>
    );
  }
});



export { ChartContainer };
