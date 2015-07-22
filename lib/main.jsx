import React from 'react';


import BundleWidget from './components/bundle-widget.jsx!'
BundleWidget.init(document.querySelector('#bundleWidget'))


import LPBundleWidget from './components/lp-bundle-matching.jsx!'
LPBundleWidget.init(document.querySelector('#LPWidget'))


import BidAskDepthWidget from './components/msr-depth-curve.jsx!'
BidAskDepthWidget.init(document.querySelector('#MSRDepthWidget'))


export default {}