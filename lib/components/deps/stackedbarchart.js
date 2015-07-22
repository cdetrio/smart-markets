/** @jsx React.DOM */
var React = require('react');
var d3 = require('d3');
var Chart = require('./common.js!jsx').Chart;
var _ = require('lodash');


// mashup of http://bl.ocks.org/slashdotdash/8342273 and https://github.com/esbullington/react-d3/blob/master/src/barchart.js


var Bar = React.createClass({

  propTypes: {
    fill: React.PropTypes.string,  
    width: React.PropTypes.number,  
    height: React.PropTypes.number,  
    offset: React.PropTypes.number
  },

  getDefaultProps: function() {
    return {
      offset: 0
    }
  },

  render: function() {
    return (
      <rect 
        fill={this.props.fill}
        width={this.props.width}
        height={this.props.height} 
        x={this.props.x}
        y={this.props.y} 
      />
    );
  }
});

var XAxis = React.createClass({

  styleAxis: function() {

    var props = this.props;

    var xAxis = d3.svg.axis()
      .scale(props.xScale)
      .orient("bottom");

    var node = d3.select(this.refs.barxaxis.getDOMNode());

    node
      .attr("class", "barx axis")
      .call(xAxis);


    // Style each of the tick lines
    node
      .selectAll('line')
      .attr("shape-rendering", "crispEdges")
      .attr("stroke", "#000");

    // Style the main axis line
    node
      .select('path')
      .attr("shape-rendering", "crispEdges")
      .attr("fill", "none")
      .attr("stroke", "none")



  },

  componentDidMount: function() {
    this.styleAxis();
  },

  componentDidUpdate: function() {
    this.styleAxis();
  },


  /*
  componentWillReceiveProps: function(props) {

  */

  render: function() {
    var t = "translate(0," + this.props.height + ")"
    return (
      <g
        ref='barxaxis'
        className="barx axis"
        transform={t}
      >
      </g>
    );
  }

});


var YAxis = React.createClass({

  styleAxis: function() {

    var props = this.props;

    var yAxis = d3.svg.axis()
      .ticks(props.yAxisTickCount)
      .scale(props.yScale)
      .orient("left"); 

    var node = this.refs.baryaxis.getDOMNode();

    d3.select(node)
      .attr("class", "bary axis")
      .call(yAxis);

    // Style each of the tick lines
    d3.selectAll('.bary.axis')
      .selectAll('line')
      .attr("shape-rendering", "crispEdges")
      .attr("stroke", "#000");

    // Style the main axis line
    d3.selectAll('.bary.axis')
      .select('path')
      .attr("shape-rendering", "crispEdges")
      .attr("fill", "none")
      .attr("stroke", "#000");

  },

  componentDidMount: function() {
    this.styleAxis();
  },

  componentDidUpdate: function() {
    this.styleAxis();
  },

/*
  componentWillReceiveProps: function(props) {

  },
*/

  render: function() {

    return (
      <g
        ref='baryaxis'
        className="bary axis"
      >
      </g>
    );
  }

});

var DataSeries = React.createClass({

  propTypes: {
    fill: React.PropTypes.string,  
    title: React.PropTypes.string,  
    padding: React.PropTypes.number,  
    width: React.PropTypes.number,  
    height: React.PropTypes.number,  
    offset: React.PropTypes.number
  },

  getDefaultProps: function() {
    return {
      padding: 0.1,
      data: []
    }
  },

  render: function() {
    var props = this.props;
    var self = this;
    var refs = this._owner.refs;

    //console.log('self:', self);

    var xScale = d3.scale.ordinal()
      .domain(d3.range(props.data.length))
      .rangeRoundBands([0, this.props.width], this.props.padding);

    var yScale = props.yScale;

    //var otherSeries = null;

    // this only works on the first render.
    // the first series should be working with an empty otherSeries, should have zero yOffset.
    // the 2nd series needs another series, to have a yOffset.
    // on the second render, the second DataSeries has a ref, and so the first series has a non-zero yOffset
    /*
    otherSeries = _.chain(refs)
      .values()
      .reject(function(component) { return component === self; })
      .value();
    */

   

    var seriesIndex = parseInt(self._currentElement.key.slice(-1));

    var otherSeries = _.chain(refs)
      .values()
      .reject(function(component, i) {
        var otherIndex = parseInt(component._currentElement.key.slice(-1));
        //return (component._mountIndex < self._mountIndex) || (component === self);
        //return (seriesIndex < otherIndex) || (component === self);
        return (seriesIndex <= otherIndex);
      })
      .value();


    //console.log('DataSeries otherSeries:', otherSeries);



    /*
    // use this with ES6. must export StackedBarChart as ES6 module
    var otherSeries = refs
      .filter((component, i) => {
        return (component._mountIndex >= self._mountIndex) || (component !== self);
      });
    */




    var memo = null;
    var yOffset = null;

    var bars = null;

    //console.log('props.data:', props.data);

    bars =
      _.map(props.data, function(point, i) {

        var yOffset = _.reduce(otherSeries, function(memo, series) {
          return memo + series.props.data[i];
        }, 0);

        //<Bar height={yScale(point)} width={xScale.rangeBand()} offset={xScale(i)} availableHeight={props.height - yScale(yOffset) - yScale(point)} fill={props.fill} key={i} />
        return (
          <Bar height={yScale(point)} y={props.height - yScale(yOffset) - yScale(point)} width={xScale.rangeBand()} x={xScale(i)} fill={props.fill} key={self._rootNodeID+i} />
        )
      });

    /*
    var bars = props.values.map(function(point, i) {
      return (
        <Bar height={props.yScale(0) - props.yScale(point)} width={xScale.rangeBand()} offset={xScale(i)} availableHeight={props.height} fill={props.fill} key={i} />
      )
    });
    */

    return (
      <g>{bars}</g>
    );
  }
});

var StackedBarChart = React.createClass({

  getDefaultProps: function() {
    return {
      data: [],
      yAxisTickCount: 4,
      width: 500,
      height: 200,
      margins: {top: 20, right: 30, bottom: 30, left: 50},
      fill: "cornflowerblue"
    }
  },

  render: function() {

    //var values = _.pluck(this.props.data, 'series1');
    var datavalues = this.props.data.series1;
    //console.log('stackedBarChart datavalues:', datavalues);

    //var labels = _.pluck(this.props.data, 'labels');
    var labels = this.props.data.labels;
    //console.log('stackedBarChart labels:', labels);

    var colors = this.props.data.colors;

    var margins = this.props.margins;

    var sideMargins = margins.left + margins.right;
    var topBottomMargins = margins.top + margins.bottom;

    var zipped = _.zip(this.props.data.series1, this.props.data.series2);

    var totals = _.map(zipped, function(values) {
      return _.reduce(values, function(memo, value) { return memo + value; }, 0);
    });

    var y_domain = [0, d3.max(totals)];
    if (this.props.yAxis) {
      y_domain = [this.props.yAxis[0], this.props.yAxis[1]];
    }

    // scale for the axis
    var yScale = d3.scale.linear()
      .domain(y_domain)
      .range([this.props.height - topBottomMargins, 0]);

    // reversed y scale for easy stacking
    var yScaleStacked = d3.scale.linear()
      .domain(y_domain)
      .range([0, this.props.height - topBottomMargins]);

    var xScale = d3.scale.ordinal()
        .domain(labels)
        .rangeRoundBands([0, this.props.width - sideMargins], 0.1);

    var trans = "translate(" + margins.left + "," + margins.top + ")";

    return (
      <Chart width={this.props.width} height={this.props.height}>
        <g transform={trans} >
          <DataSeries
            ref="series1"
            key="series1"
            yScale={yScaleStacked}
            xScale={xScale}
            margins={margins}
            data={this.props.data.series1}
            width={this.props.width - sideMargins}
            height={this.props.height - topBottomMargins}
            fill={colors[0]}
            color={colors[0]}
          />

          <DataSeries
            ref="series2"
            key="series2"
            yScale={yScaleStacked}
            xScale={xScale}
            margins={margins}
            data={this.props.data.series2}
            width={this.props.width - sideMargins}
            height={this.props.height - topBottomMargins}
            fill={colors[1]}
            color={colors[1]}
          />


          <YAxis 
            yScale={yScale}
            margins={margins}
            yAxisTickCount={this.props.yAxisTickCount}
            width={this.props.width - sideMargins}
            height={this.props.height - topBottomMargins}
          />
          <XAxis 
            xScale={xScale}
            margins={margins}
            width={this.props.width - sideMargins}
            height={this.props.height - topBottomMargins}
          />
        </g>
      </Chart>
    );
  }

});

exports.StackedBarChart = StackedBarChart;
