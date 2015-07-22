/**
* @jsx React.DOM

*/

import React from 'react';
import RCSS from 'rcss';
import _ from 'lodash';

//console.log('RCSS:', RCSS);

var colors = {
    grayLight: '#aaa',
    basicBorderColor: '#ccc',
    white: '#fff'
};

var infoTip = {
    display: 'inline-block',
    marginLeft: '0px',
    position: 'relative',
    border: '0px dotted black',
    height: '25px',
    width: '25px'
    //display:'inline-flex',
    //alignItems: 'center'
};

var infoTipI = {
    cursor: 'pointer'
};

var infoTipContainer = {
    position: 'absolute',
    top: '30px',
    left: '0px',
    transform: 'translateX(-50%)',
    WebkitTransform: 'translateX(-50%)',
    zIndex: '1000',
    //pointerEvents: 'none',
    fontSize: '10pt'
};

var triangleBeforeAfter = {
    borderLeft: '9px solid transparent',
    borderRight: '9px solid transparent',
    content: ' ',
    height: '0',
    position: 'absolute',
    top: '0',
    width: '0'
};

var infoTipTriangle = {
    position: 'absolute',
    height: '0',
    width: '10px',
    //left: '120px',
    left: '50%',
    top: '0',
    zIndex: '1',

    ':before': _.extend({}, triangleBeforeAfter, {
        borderBottom: '9px solid #bbb',
        top: '-9px',
    }),

    ':after': _.extend({}, triangleBeforeAfter, {
        borderBottom: `9px solid ${colors.white}`,
        top: '-8px'
    })

};

var basicBorder = {
    border: `1px solid ${colors.basicBorderColor}`
};


var boxShadow = str => { return { boxShadow: str }; };



var verticalShadow = RCSS.cascade(
    basicBorder,
    boxShadow(`0 1px 3px ${colors.basicBorderColor}`),
    { borderBottom: `1px solid ${colors.grayLight}` }
);



var infoTipContentContainer = RCSS.cascade(verticalShadow, {
    background: colors.white,
    padding: '5px 10px',
    width: '240px'
});


var R_infoTip = RCSS.registerClass(infoTip);
var R_infoTipI = RCSS.registerClass(infoTipI);
var R_infoTipTriangle = RCSS.registerClass(infoTipTriangle);
var R_verticalShadow = RCSS.registerClass(verticalShadow);
var R_infoTipContainer = RCSS.registerClass(infoTipContainer);
var R_infoTipContentContainer = RCSS.registerClass(infoTipContentContainer);


RCSS.injectAll();

//var questionMark = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAA3NpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuNS1jMDIxIDc5LjE1NDkxMSwgMjAxMy8xMC8yOS0xMTo0NzoxNiAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wTU09Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9tbS8iIHhtbG5zOnN0UmVmPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvc1R5cGUvUmVzb3VyY2VSZWYjIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtcE1NOk9yaWdpbmFsRG9jdW1lbnRJRD0ieG1wLmRpZDo2N2M3NTAxYS04YmVlLTQ0M2MtYmRiNS04OGM2N2IxN2NhYzEiIHhtcE1NOkRvY3VtZW50SUQ9InhtcC5kaWQ6OUJCRTk4Qjc4NjAwMTFFMzg3QUJDNEI4Mzk2QTRGQkQiIHhtcE1NOkluc3RhbmNlSUQ9InhtcC5paWQ6OUJCRTk4QjY4NjAwMTFFMzg3QUJDNEI4Mzk2QTRGQkQiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENDIChNYWNpbnRvc2gpIj4gPHhtcE1NOkRlcml2ZWRGcm9tIHN0UmVmOmluc3RhbmNlSUQ9InhtcC5paWQ6NGE5ZDI0OTMtODk1NC00OGFkLTlhMTgtZDAwM2MwYWNjNDJlIiBzdFJlZjpkb2N1bWVudElEPSJ4bXAuZGlkOjY3Yzc1MDFhLThiZWUtNDQzYy1iZGI1LTg4YzY3YjE3Y2FjMSIvPiA8L3JkZjpEZXNjcmlwdGlvbj4gPC9yZGY6UkRGPiA8L3g6eG1wbWV0YT4gPD94cGFja2V0IGVuZD0iciI/Pqm89uYAAADMSURBVHjaXJA9DoJAEIUH1M4TUHIFsCMGen9OwCGw1YRGW2ntKel0exsojHIBC0ouQAyUviFDstmXfNmZeS+zm7XSNCXRFiRgJf0bXIHixpbhGdxBBJYC1w/xaA424MhNEATkui71fU9KqfEU78UbD9PdbJRlOdae55GmhIP+1NV1TcMwkOM41DSNHvRtMhTHMRVFQW3b6mOLgx99kue5GRp/gIOZuZGvNpTNwjD8oliANU+qqqKu6/TQBdymN57AHjzBT+B6Jx79BRgAvc49kQA4yxgAAAAASUVORK5CYII='; // @NoLint



var InfoTip = React.createClass({
    getInitialState: function() {
        return {
            hover: false,
            secondTouch: false
        };
    },

    getDefaultProps: function() {
        return {
            iconSize: "fa-lg"
        }
    },

    render: function() {
        var fa_classes = "fa fa-info-circle " + this.props.iconSize;
        return (
            <div className={R_infoTip.className}
                onMouseEnter={this.handleMouseEnter}
                onMouseLeave={this.handleMouseLeave} >
                <div className="dummy"></div>
                <div className="img-container" onTouchStart={this.handleTouchStart}>
                    <span>
                        <i className={fa_classes}></i>
                    </span>
                </div>

                <div className={R_infoTipContainer.className}
                     style={{WebkitTouchCallout: "default", display: this.state.hover ? 'block' : 'none'}}>
                    <div className={R_infoTipTriangle.className} />
                    {/* keep the classes here - used for selectors on KA */}
                    <div className={R_infoTipContentContainer.className} style={{width: this.props.width}}>
                        {this.props.children}
                    </div>
                </div>
            </div>
        );
    },

    handleTouchStart: function() {
      //this.setState({hover: !this.state.hover});
      this.setState({hover:true});
    },

    handleMouseEnter: function() {
        this.setState({hover: true});
    },

    handleMouseLeave: function() {
        this.setState({hover: false});
    }
});


export { InfoTip };
