define(function(){ return '\
.duiToolBarButtonHasArrow-styles {\
  width: 27px;\
  height: 27px;\
  border-radius: 20px;\
  border: 2px solid #ffffff;\
  padding: 0px;\
  margin: 0px;\
  margin-top: 8px;\
  margin-bottom: 8px;\
  background-image: url("images/dark/back.png");\
  background-position: 50% 50%;\
  background-size: 27px 27px;\
  background-repeat: no-repeat;\
}\
html.mobile,\
.mobile body {\
  width: 100%;\
  margin: 0;\
  padding: 0;\
}\
.mobile body {\
  overflow-x: hidden;\
  -webkit-text-size-adjust: none;\
  background-color: #000000;\
  font-family: "Segoe WP", "Segoe UI", "HelveticaNeue", "Helvetica-Neue", "Helvetica", "BBAlpha Sans", "sans-serif";\
  font-size: 9pt;\
  color: #ffffff;\
  padding: 8px 0 8px 0;\
}\
.duiBackground {\
  background-color: #000000;\
}\
/* Button Colors */\
.duiColorBlue {\
  color: #ffffff;\
  background-color: #2362dd;\
  background-image: -webkit-gradient(linear, left top, left bottom, from(#7a9de9), to(#2362dd));\
  background-image: linear-gradient(to bottom, #7a9de9 0%, #2362dd 100%);\
}\
.duiColorBlue45 {\
  background-image: -webkit-gradient(linear, left top, right bottom, from(#7a9de9), to(#2362dd));\
  background-image: linear-gradient(to right bottom, #7a9de9 0%, #2362dd 100%);\
}\
/* Default Button Colors */\
.duiColorDefault {\
  color: #ffffff;\
  background-color: transparent;\
  background-image: none;\
}\
.duiColorDefault45 {\
  background-image: -webkit-gradient(linear, left top, right bottom, from(#e2e2e2), to(#a4a4a4));\
  background-image: linear-gradient(to right bottom, #e2e2e2 0%, #a4a4a4 100%);\
}\
.duiColorDefaultSel {\
  color: #ffffff;\
  background-color: Highlight;\
}\
.duiColorDefaultSel45 {\
  background-image: -webkit-gradient(linear, left top, right bottom, from(#bbbbbb), to(#666666));\
  background-image: linear-gradient(to right bottom, #bbbbbb 0%, #666666 100%);\
}\
.duiSpriteIcon {\
  position: absolute;\
}\
.duiSpriteIconParent {\
  position: relative;\
  font-size: 1px;\
}\
.duiImageIcon {\
  vertical-align: top;\
}\
'; } );
