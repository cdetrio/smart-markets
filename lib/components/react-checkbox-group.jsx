/**
* @jsx React.DOM
*/
var React = require('react');
var _ = require('lodash');




var CheckboxGroup = module.exports = React.createClass({
  getInitialState: function() {
    return {defaultValue: this.props.defaultValue || [],
            checkedBoxes: []};
  },

  componentDidMount: function() {
    this.setCheckboxNames();
    this.setCheckedBoxes();
  },

  componentDidUpdate: function() {
    this.setCheckboxNames();
    this.setCheckedBoxes();
  },

  render: function() {
    return this.transferPropsTo(
      <div onChange={this.props.onChange}>
        {this.props.children}
      </div>
    );
  },

  setCheckboxNames: function() {
    // stay DRY and don't put the same `name` on all checkboxes manually. Put it on
    // the tag and it'll be done here
    var $checkboxes = this.getCheckboxes();
    for (var i = 0, length = $checkboxes.length; i < length; i++) {
      $checkboxes[i].setAttribute('name', this.props.name);
    }
  },

  getCheckboxes: function() {
    return this.getDOMNode().querySelectorAll('input[type="checkbox"]');
  },

  setCheckedBoxes: function() {
    var $checkboxes = this.getCheckboxes();
    // if `value` is passed from parent, always use that value. This is similar
    // to React's controlled component. If `defaultValue` is used instead,
    // subsequent updates to defaultValue are ignored. Note: when `defaultValue`
    // and `value` are both passed, the latter takes precedence, just like in
    // a controlled component
    var destinationValue = this.props.value != null
      ? this.props.value
      : this.state.defaultValue;

    //var checked = this.state.checkedBoxes;
    var oldstate = this.state.checkedBoxes;
    var checkedunsorted = [];

    for (var i = 0, length = $checkboxes.length; i < length; i++) {
      var $checkbox = $checkboxes[i];

      // intentionally use implicit conversion for those who accidentally used,
      // say, `valueToChange` of 1 (integer) to compare it with `value` of "1"
      // (auto conversion to valid html value from React)
      if (destinationValue.indexOf($checkbox.value) >= 0) {
        $checkbox.checked = true;
        checkedunsorted.push($checkbox.value);
      }
    }

    var newchecked = _.difference(checkedunsorted, oldstate);

    var unchecked = _.difference(oldstate, checkedunsorted);

    var newstate = oldstate.concat(newchecked);

    var stateintersect = _.intersection(oldstate, checkedunsorted);
    if (unchecked.length > 0) {
      newstate = stateintersect;
    }
   

    var is_same = (newstate.length == oldstate.length) && newstate.every(function(element, index) {
      return element === oldstate[index]; 
    });
    if (!is_same) {
      this.setState({'checkedBoxes':newstate});
    }
    
  },

  getCheckedValues: function() {
    var $checkboxes = this.getCheckboxes();

    var checkedunsorted = [];
    for (var i = 0, length = $checkboxes.length; i < length; i++) {
      if ($checkboxes[i].checked) {
        checkedunsorted.push($checkboxes[i].value);
      }
    }

    var oldstate = this.state.checkedBoxes;
    if (checkedunsorted.length < oldstate.length) {
      var stateintersect = _.intersection(oldstate, checkedunsorted);
      return stateintersect;
    }
    if (checkedunsorted.length > oldstate.length) {
      var newchecked = _.difference(checkedunsorted, oldstate);
      return oldstate.concat(newchecked);
    }

    //return checked;
    return oldstate;
  }
});