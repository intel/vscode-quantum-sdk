/* 
MIT License

Copyright (c) 2023 Andrei Kashcha

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE. 

https://github.com/anvaka/panzoom
*/

(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.panzoom=f()}})(function(){var define,module,exports;return function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r}()({1:[function(require,module,exports){"use strict";var wheel=require("wheel");var animate=require("amator");var eventify=require("ngraph.events");var kinetic=require("./lib/kinetic.js");var createTextSelectionInterceptor=require("./lib/createTextSelectionInterceptor.js");var domTextSelectionInterceptor=createTextSelectionInterceptor();var fakeTextSelectorInterceptor=createTextSelectionInterceptor(true);var Transform=require("./lib/transform.js");var makeSvgController=require("./lib/svgController.js");var makeDomController=require("./lib/domController.js");var defaultZoomSpeed=1;var defaultDoubleTapZoomSpeed=1.75;var doubleTapSpeedInMS=300;module.exports=createPanZoom;function createPanZoom(domElement,options){options=options||{};var panController=options.controller;if(!panController){if(domElement instanceof SVGElement){panController=makeSvgController(domElement,options)}if(domElement instanceof HTMLElement){panController=makeDomController(domElement,options)}}if(!panController){throw new Error("Cannot create panzoom for the current type of dom element")}var owner=panController.getOwner();var storedCTMResult={x:0,y:0};var isDirty=false;var transform=new Transform;if(panController.initTransform){panController.initTransform(transform)}var filterKey=typeof options.filterKey==="function"?options.filterKey:noop;var pinchSpeed=typeof options.pinchSpeed==="number"?options.pinchSpeed:1;var bounds=options.bounds;var maxZoom=typeof options.maxZoom==="number"?options.maxZoom:Number.POSITIVE_INFINITY;var minZoom=typeof options.minZoom==="number"?options.minZoom:0;var boundsPadding=typeof options.boundsPadding==="number"?options.boundsPadding:.05;var zoomDoubleClickSpeed=typeof options.zoomDoubleClickSpeed==="number"?options.zoomDoubleClickSpeed:defaultDoubleTapZoomSpeed;var beforeWheel=options.beforeWheel||noop;var beforeMouseDown=options.beforeMouseDown||noop;var speed=typeof options.zoomSpeed==="number"?options.zoomSpeed:defaultZoomSpeed;var transformOrigin=parseTransformOrigin(options.transformOrigin);var textSelection=options.enableTextSelection?fakeTextSelectorInterceptor:domTextSelectionInterceptor;validateBounds(bounds);if(options.autocenter){autocenter()}var frameAnimation;var lastTouchEndTime=0;var lastSingleFingerOffset;var touchInProgress=false;var panstartFired=false;var mouseX;var mouseY;var pinchZoomLength;var smoothScroll;if("smoothScroll"in options&&!options.smoothScroll){smoothScroll=rigidScroll()}else{smoothScroll=kinetic(getPoint,scroll,options.smoothScroll)}var moveByAnimation;var zoomToAnimation;var multiTouch;var paused=false;listenForEvents();var api={dispose:dispose,moveBy:internalMoveBy,moveTo:moveTo,centerOn:centerOn,zoomTo:publicZoomTo,zoomAbs:zoomAbs,smoothZoom:smoothZoom,smoothZoomAbs:smoothZoomAbs,showRectangle:showRectangle,pause:pause,resume:resume,isPaused:isPaused,getTransform:getTransformModel,getMinZoom:getMinZoom,setMinZoom:setMinZoom,getMaxZoom:getMaxZoom,setMaxZoom:setMaxZoom,getTransformOrigin:getTransformOrigin,setTransformOrigin:setTransformOrigin,getZoomSpeed:getZoomSpeed,setZoomSpeed:setZoomSpeed};eventify(api);return api;function pause(){releaseEvents();paused=true}function resume(){if(paused){listenForEvents();paused=false}}function isPaused(){return paused}function showRectangle(rect){var clientRect=owner.getBoundingClientRect();var size=transformToScreen(clientRect.width,clientRect.height);var rectWidth=rect.right-rect.left;var rectHeight=rect.bottom-rect.top;if(!Number.isFinite(rectWidth)||!Number.isFinite(rectHeight)){throw new Error("Invalid rectangle")}var dw=size.x/rectWidth;var dh=size.y/rectHeight;var scale=Math.min(dw,dh);transform.x=-(rect.left+rectWidth/2)*scale+size.x/2;transform.y=-(rect.top+rectHeight/2)*scale+size.y/2;transform.scale=scale}function transformToScreen(x,y){if(panController.getScreenCTM){var parentCTM=panController.getScreenCTM();var parentScaleX=parentCTM.a;var parentScaleY=parentCTM.d;var parentOffsetX=parentCTM.e;var parentOffsetY=parentCTM.f;storedCTMResult.x=x*parentScaleX-parentOffsetX;storedCTMResult.y=y*parentScaleY-parentOffsetY}else{storedCTMResult.x=x;storedCTMResult.y=y}return storedCTMResult}function autocenter(){var w;var h;var left=0;var top=0;var sceneBoundingBox=getBoundingBox();if(sceneBoundingBox){left=sceneBoundingBox.left;top=sceneBoundingBox.top;w=sceneBoundingBox.right-sceneBoundingBox.left;h=sceneBoundingBox.bottom-sceneBoundingBox.top}else{var ownerRect=owner.getBoundingClientRect();w=ownerRect.width;h=ownerRect.height}var bbox=panController.getBBox();if(bbox.width===0||bbox.height===0){return}var dh=h/bbox.height;var dw=w/bbox.width;var scale=Math.min(dw,dh);transform.x=-(bbox.left+bbox.width/2)*scale+w/2+left;transform.y=-(bbox.top+bbox.height/2)*scale+h/2+top;transform.scale=scale}function getTransformModel(){return transform}function getMinZoom(){return minZoom}function setMinZoom(newMinZoom){minZoom=newMinZoom}function getMaxZoom(){return maxZoom}function setMaxZoom(newMaxZoom){maxZoom=newMaxZoom}function getTransformOrigin(){return transformOrigin}function setTransformOrigin(newTransformOrigin){transformOrigin=parseTransformOrigin(newTransformOrigin)}function getZoomSpeed(){return speed}function setZoomSpeed(newSpeed){if(!Number.isFinite(newSpeed)){throw new Error("Zoom speed should be a number")}speed=newSpeed}function getPoint(){return{x:transform.x,y:transform.y}}function moveTo(x,y){transform.x=x;transform.y=y;keepTransformInsideBounds();triggerEvent("pan");makeDirty()}function moveBy(dx,dy){moveTo(transform.x+dx,transform.y+dy)}function keepTransformInsideBounds(){var boundingBox=getBoundingBox();if(!boundingBox)return;var adjusted=false;var clientRect=getClientRect();var diff=boundingBox.left-clientRect.right;if(diff>0){transform.x+=diff;adjusted=true}diff=boundingBox.right-clientRect.left;if(diff<0){transform.x+=diff;adjusted=true}diff=boundingBox.top-clientRect.bottom;if(diff>0){transform.y+=diff;adjusted=true}diff=boundingBox.bottom-clientRect.top;if(diff<0){transform.y+=diff;adjusted=true}return adjusted}function getBoundingBox(){if(!bounds)return;if(typeof bounds==="boolean"){var ownerRect=owner.getBoundingClientRect();var sceneWidth=ownerRect.width;var sceneHeight=ownerRect.height;return{left:sceneWidth*boundsPadding,top:sceneHeight*boundsPadding,right:sceneWidth*(1-boundsPadding),bottom:sceneHeight*(1-boundsPadding)}}return bounds}function getClientRect(){var bbox=panController.getBBox();var leftTop=client(bbox.left,bbox.top);return{left:leftTop.x,top:leftTop.y,right:bbox.width*transform.scale+leftTop.x,bottom:bbox.height*transform.scale+leftTop.y}}function client(x,y){return{x:x*transform.scale+transform.x,y:y*transform.scale+transform.y}}function makeDirty(){isDirty=true;frameAnimation=window.requestAnimationFrame(frame)}function zoomByRatio(clientX,clientY,ratio){if(isNaN(clientX)||isNaN(clientY)||isNaN(ratio)){throw new Error("zoom requires valid numbers")}var newScale=transform.scale*ratio;if(newScale<minZoom){if(transform.scale===minZoom)return;ratio=minZoom/transform.scale}if(newScale>maxZoom){if(transform.scale===maxZoom)return;ratio=maxZoom/transform.scale}var size=transformToScreen(clientX,clientY);transform.x=size.x-ratio*(size.x-transform.x);transform.y=size.y-ratio*(size.y-transform.y);if(bounds&&boundsPadding===1&&minZoom===1){transform.scale*=ratio;keepTransformInsideBounds()}else{var transformAdjusted=keepTransformInsideBounds();if(!transformAdjusted)transform.scale*=ratio}triggerEvent("zoom");makeDirty()}function zoomAbs(clientX,clientY,zoomLevel){var ratio=zoomLevel/transform.scale;zoomByRatio(clientX,clientY,ratio)}function centerOn(ui){var parent=ui.ownerSVGElement;if(!parent)throw new Error("ui element is required to be within the scene");var clientRect=ui.getBoundingClientRect();var cx=clientRect.left+clientRect.width/2;var cy=clientRect.top+clientRect.height/2;var container=parent.getBoundingClientRect();var dx=container.width/2-cx;var dy=container.height/2-cy;internalMoveBy(dx,dy,true)}function internalMoveBy(dx,dy,smooth){if(!smooth){return moveBy(dx,dy)}if(moveByAnimation)moveByAnimation.cancel();var from={x:0,y:0};var to={x:dx,y:dy};var lastX=0;var lastY=0;moveByAnimation=animate(from,to,{step:function(v){moveBy(v.x-lastX,v.y-lastY);lastX=v.x;lastY=v.y}})}function scroll(x,y){cancelZoomAnimation();moveTo(x,y)}function dispose(){releaseEvents()}function listenForEvents(){owner.addEventListener("mousedown",onMouseDown,{passive:false});owner.addEventListener("dblclick",onDoubleClick,{passive:false});owner.addEventListener("touchstart",onTouch,{passive:false});owner.addEventListener("keydown",onKeyDown,{passive:false});wheel.addWheelListener(owner,onMouseWheel,{passive:false});makeDirty()}function releaseEvents(){wheel.removeWheelListener(owner,onMouseWheel);owner.removeEventListener("mousedown",onMouseDown);owner.removeEventListener("keydown",onKeyDown);owner.removeEventListener("dblclick",onDoubleClick);owner.removeEventListener("touchstart",onTouch);if(frameAnimation){window.cancelAnimationFrame(frameAnimation);frameAnimation=0}smoothScroll.cancel();releaseDocumentMouse();releaseTouches();textSelection.release();triggerPanEnd()}function frame(){if(isDirty)applyTransform()}function applyTransform(){isDirty=false;panController.applyTransform(transform);triggerEvent("transform");frameAnimation=0}function onKeyDown(e){var x=0,y=0,z=0;if(e.keyCode===38){y=1}else if(e.keyCode===40){y=-1}else if(e.keyCode===37){x=1}else if(e.keyCode===39){x=-1}else if(e.keyCode===189||e.keyCode===109){z=1}else if(e.keyCode===187||e.keyCode===107){z=-1}if(filterKey(e,x,y,z)){return}if(x||y){e.preventDefault();e.stopPropagation();var clientRect=owner.getBoundingClientRect();var offset=Math.min(clientRect.width,clientRect.height);var moveSpeedRatio=.05;var dx=offset*moveSpeedRatio*x;var dy=offset*moveSpeedRatio*y;internalMoveBy(dx,dy)}if(z){var scaleMultiplier=getScaleMultiplier(z*100);var offset=transformOrigin?getTransformOriginOffset():midPoint();publicZoomTo(offset.x,offset.y,scaleMultiplier)}}function midPoint(){var ownerRect=owner.getBoundingClientRect();return{x:ownerRect.width/2,y:ownerRect.height/2}}function onTouch(e){beforeTouch(e);if(e.touches.length===1){return handleSingleFingerTouch(e,e.touches[0])}else if(e.touches.length===2){pinchZoomLength=getPinchZoomLength(e.touches[0],e.touches[1]);multiTouch=true;startTouchListenerIfNeeded()}}function beforeTouch(e){if(options.onTouch&&!options.onTouch(e)){return}e.stopPropagation();e.preventDefault()}function beforeDoubleClick(e){if(options.onDoubleClick&&!options.onDoubleClick(e)){return}e.preventDefault();e.stopPropagation()}function handleSingleFingerTouch(e){var touch=e.touches[0];var offset=getOffsetXY(touch);lastSingleFingerOffset=offset;var point=transformToScreen(offset.x,offset.y);mouseX=point.x;mouseY=point.y;smoothScroll.cancel();startTouchListenerIfNeeded()}function startTouchListenerIfNeeded(){if(touchInProgress){return}touchInProgress=true;document.addEventListener("touchmove",handleTouchMove);document.addEventListener("touchend",handleTouchEnd);document.addEventListener("touchcancel",handleTouchEnd)}function handleTouchMove(e){if(e.touches.length===1){e.stopPropagation();var touch=e.touches[0];var offset=getOffsetXY(touch);var point=transformToScreen(offset.x,offset.y);var dx=point.x-mouseX;var dy=point.y-mouseY;if(dx!==0&&dy!==0){triggerPanStart()}mouseX=point.x;mouseY=point.y;internalMoveBy(dx,dy)}else if(e.touches.length===2){multiTouch=true;var t1=e.touches[0];var t2=e.touches[1];var currentPinchLength=getPinchZoomLength(t1,t2);var scaleMultiplier=1+(currentPinchLength/pinchZoomLength-1)*pinchSpeed;var firstTouchPoint=getOffsetXY(t1);var secondTouchPoint=getOffsetXY(t2);mouseX=(firstTouchPoint.x+secondTouchPoint.x)/2;mouseY=(firstTouchPoint.y+secondTouchPoint.y)/2;if(transformOrigin){var offset=getTransformOriginOffset();mouseX=offset.x;mouseY=offset.y}publicZoomTo(mouseX,mouseY,scaleMultiplier);pinchZoomLength=currentPinchLength;e.stopPropagation();e.preventDefault()}}function handleTouchEnd(e){if(e.touches.length>0){var offset=getOffsetXY(e.touches[0]);var point=transformToScreen(offset.x,offset.y);mouseX=point.x;mouseY=point.y}else{var now=new Date;if(now-lastTouchEndTime<doubleTapSpeedInMS){if(transformOrigin){var offset=getTransformOriginOffset();smoothZoom(offset.x,offset.y,zoomDoubleClickSpeed)}else{smoothZoom(lastSingleFingerOffset.x,lastSingleFingerOffset.y,zoomDoubleClickSpeed)}}lastTouchEndTime=now;touchInProgress=false;triggerPanEnd();releaseTouches()}}function getPinchZoomLength(finger1,finger2){var dx=finger1.clientX-finger2.clientX;var dy=finger1.clientY-finger2.clientY;return Math.sqrt(dx*dx+dy*dy)}function onDoubleClick(e){beforeDoubleClick(e);var offset=getOffsetXY(e);if(transformOrigin){offset=getTransformOriginOffset()}smoothZoom(offset.x,offset.y,zoomDoubleClickSpeed)}function onMouseDown(e){if(beforeMouseDown(e))return;if(touchInProgress){e.stopPropagation();return false}var isLeftButton=e.button===1&&window.event!==null||e.button===0;if(!isLeftButton)return;smoothScroll.cancel();var offset=getOffsetXY(e);var point=transformToScreen(offset.x,offset.y);mouseX=point.x;mouseY=point.y;document.addEventListener("mousemove",onMouseMove);document.addEventListener("mouseup",onMouseUp);textSelection.capture(e.target||e.srcElement);return false}function onMouseMove(e){if(touchInProgress)return;triggerPanStart();var offset=getOffsetXY(e);var point=transformToScreen(offset.x,offset.y);var dx=point.x-mouseX;var dy=point.y-mouseY;mouseX=point.x;mouseY=point.y;internalMoveBy(dx,dy)}function onMouseUp(){textSelection.release();triggerPanEnd();releaseDocumentMouse()}function releaseDocumentMouse(){document.removeEventListener("mousemove",onMouseMove);document.removeEventListener("mouseup",onMouseUp);panstartFired=false}function releaseTouches(){document.removeEventListener("touchmove",handleTouchMove);document.removeEventListener("touchend",handleTouchEnd);document.removeEventListener("touchcancel",handleTouchEnd);panstartFired=false;multiTouch=false}function onMouseWheel(e){if(beforeWheel(e))return;smoothScroll.cancel();var delta=e.deltaY;if(e.deltaMode>0)delta*=100;var scaleMultiplier=getScaleMultiplier(delta);if(scaleMultiplier!==1){var offset=transformOrigin?getTransformOriginOffset():getOffsetXY(e);publicZoomTo(offset.x,offset.y,scaleMultiplier);e.preventDefault()}}function getOffsetXY(e){var offsetX,offsetY;var ownerRect=owner.getBoundingClientRect();offsetX=e.clientX-ownerRect.left;offsetY=e.clientY-ownerRect.top;return{x:offsetX,y:offsetY}}function smoothZoom(clientX,clientY,scaleMultiplier){var fromValue=transform.scale;var from={scale:fromValue};var to={scale:scaleMultiplier*fromValue};smoothScroll.cancel();cancelZoomAnimation();zoomToAnimation=animate(from,to,{step:function(v){zoomAbs(clientX,clientY,v.scale)},done:triggerZoomEnd})}function smoothZoomAbs(clientX,clientY,toScaleValue){var fromValue=transform.scale;var from={scale:fromValue};var to={scale:toScaleValue};smoothScroll.cancel();cancelZoomAnimation();zoomToAnimation=animate(from,to,{step:function(v){zoomAbs(clientX,clientY,v.scale)}})}function getTransformOriginOffset(){var ownerRect=owner.getBoundingClientRect();return{x:ownerRect.width*transformOrigin.x,y:ownerRect.height*transformOrigin.y}}function publicZoomTo(clientX,clientY,scaleMultiplier){smoothScroll.cancel();cancelZoomAnimation();return zoomByRatio(clientX,clientY,scaleMultiplier)}function cancelZoomAnimation(){if(zoomToAnimation){zoomToAnimation.cancel();zoomToAnimation=null}}function getScaleMultiplier(delta){var sign=Math.sign(delta);var deltaAdjustedSpeed=Math.min(.25,Math.abs(speed*delta/128));return 1-sign*deltaAdjustedSpeed}function triggerPanStart(){if(!panstartFired){triggerEvent("panstart");panstartFired=true;smoothScroll.start()}}function triggerPanEnd(){if(panstartFired){if(!multiTouch)smoothScroll.stop();triggerEvent("panend")}}function triggerZoomEnd(){triggerEvent("zoomend")}function triggerEvent(name){api.fire(name,api)}}function parseTransformOrigin(options){if(!options)return;if(typeof options==="object"){if(!isNumber(options.x)||!isNumber(options.y))failTransformOrigin(options);return options}failTransformOrigin()}function failTransformOrigin(options){console.error(options);throw new Error(["Cannot parse transform origin.","Some good examples:",'  "center center" can be achieved with {x: 0.5, y: 0.5}','  "top center" can be achieved with {x: 0.5, y: 0}','  "bottom right" can be achieved with {x: 1, y: 1}'].join("\n"))}function noop(){}function validateBounds(bounds){var boundsType=typeof bounds;if(boundsType==="undefined"||boundsType==="boolean")return;var validBounds=isNumber(bounds.left)&&isNumber(bounds.top)&&isNumber(bounds.bottom)&&isNumber(bounds.right);if(!validBounds)throw new Error("Bounds object is not valid. It can be: "+"undefined, boolean (true|false) or an object {left, top, right, bottom}")}function isNumber(x){return Number.isFinite(x)}function isNaN(value){if(Number.isNaN){return Number.isNaN(value)}return value!==value}function rigidScroll(){return{start:noop,stop:noop,cancel:noop}}function autoRun(){if(typeof document==="undefined")return;var scripts=document.getElementsByTagName("script");if(!scripts)return;var panzoomScript;for(var i=0;i<scripts.length;++i){var x=scripts[i];if(x.src&&x.src.match(/\bpanzoom(\.min)?\.js/)){panzoomScript=x;break}}if(!panzoomScript)return;var query=panzoomScript.getAttribute("query");if(!query)return;var globalName=panzoomScript.getAttribute("name")||"pz";var started=Date.now();tryAttach();function tryAttach(){var el=document.querySelector(query);if(!el){var now=Date.now();var elapsed=now-started;if(elapsed<2e3){setTimeout(tryAttach,100);return}console.error("Cannot find the panzoom element",globalName);return}var options=collectOptions(panzoomScript);console.log(options);window[globalName]=createPanZoom(el,options)}function collectOptions(script){var attrs=script.attributes;var options={};for(var i=0;i<attrs.length;++i){var attr=attrs[i];var nameValue=getPanzoomAttributeNameValue(attr);if(nameValue){options[nameValue.name]=nameValue.value}}return options}function getPanzoomAttributeNameValue(attr){if(!attr.name)return;var isPanZoomAttribute=attr.name[0]==="p"&&attr.name[1]==="z"&&attr.name[2]==="-";if(!isPanZoomAttribute)return;var name=attr.name.substr(3);var value=JSON.parse(attr.value);return{name:name,value:value}}}autoRun()},{"./lib/createTextSelectionInterceptor.js":2,"./lib/domController.js":3,"./lib/kinetic.js":4,"./lib/svgController.js":5,"./lib/transform.js":6,amator:7,"ngraph.events":9,wheel:10}],2:[function(require,module,exports){module.exports=createTextSelectionInterceptor;function createTextSelectionInterceptor(useFake){if(useFake){return{capture:noop,release:noop}}var dragObject;var prevSelectStart;var prevDragStart;var wasCaptured=false;return{capture:capture,release:release};function capture(domObject){wasCaptured=true;prevSelectStart=window.document.onselectstart;prevDragStart=window.document.ondragstart;window.document.onselectstart=disabled;dragObject=domObject;dragObject.ondragstart=disabled}function release(){if(!wasCaptured)return;wasCaptured=false;window.document.onselectstart=prevSelectStart;if(dragObject)dragObject.ondragstart=prevDragStart}}function disabled(e){e.stopPropagation();return false}function noop(){}},{}],3:[function(require,module,exports){module.exports=makeDomController;function makeDomController(domElement,options){var elementValid=domElement instanceof HTMLElement;if(!elementValid){throw new Error("svg element is required for svg.panzoom to work")}var owner=domElement.parentElement;if(!owner){throw new Error("Do not apply panzoom to the detached DOM element. ")}domElement.scrollTop=0;if(!options.disableKeyboardInteraction){owner.setAttribute("tabindex",0)}var api={getBBox:getBBox,getOwner:getOwner,applyTransform:applyTransform};return api;function getOwner(){return owner}function getBBox(){return{left:0,top:0,width:domElement.clientWidth,height:domElement.clientHeight}}function applyTransform(transform){domElement.style.transformOrigin="0 0 0";domElement.style.transform="matrix("+transform.scale+", 0, 0, "+transform.scale+", "+transform.x+", "+transform.y+")"}}},{}],4:[function(require,module,exports){(function(global){module.exports=kinetic;function kinetic(getPoint,scroll,settings){if(typeof settings!=="object"){settings={}}var minVelocity=typeof settings.minVelocity==="number"?settings.minVelocity:5;var amplitude=typeof settings.amplitude==="number"?settings.amplitude:.25;var cancelAnimationFrame=typeof settings.cancelAnimationFrame==="function"?settings.cancelAnimationFrame:getCancelAnimationFrame();var requestAnimationFrame=typeof settings.requestAnimationFrame==="function"?settings.requestAnimationFrame:getRequestAnimationFrame();var lastPoint;var timestamp;var timeConstant=342;var ticker;var vx,targetX,ax;var vy,targetY,ay;var raf;return{start:start,stop:stop,cancel:dispose};function dispose(){cancelAnimationFrame(ticker);cancelAnimationFrame(raf)}function start(){lastPoint=getPoint();ax=ay=vx=vy=0;timestamp=new Date;cancelAnimationFrame(ticker);cancelAnimationFrame(raf);ticker=requestAnimationFrame(track)}function track(){var now=Date.now();var elapsed=now-timestamp;timestamp=now;var currentPoint=getPoint();var dx=currentPoint.x-lastPoint.x;var dy=currentPoint.y-lastPoint.y;lastPoint=currentPoint;var dt=1e3/(1+elapsed);vx=.8*dx*dt+.2*vx;vy=.8*dy*dt+.2*vy;ticker=requestAnimationFrame(track)}function stop(){cancelAnimationFrame(ticker);cancelAnimationFrame(raf);var currentPoint=getPoint();targetX=currentPoint.x;targetY=currentPoint.y;timestamp=Date.now();if(vx<-minVelocity||vx>minVelocity){ax=amplitude*vx;targetX+=ax}if(vy<-minVelocity||vy>minVelocity){ay=amplitude*vy;targetY+=ay}raf=requestAnimationFrame(autoScroll)}function autoScroll(){var elapsed=Date.now()-timestamp;var moving=false;var dx=0;var dy=0;if(ax){dx=-ax*Math.exp(-elapsed/timeConstant);if(dx>.5||dx<-.5)moving=true;else dx=ax=0}if(ay){dy=-ay*Math.exp(-elapsed/timeConstant);if(dy>.5||dy<-.5)moving=true;else dy=ay=0}if(moving){scroll(targetX+dx,targetY+dy);raf=requestAnimationFrame(autoScroll)}}}function getCancelAnimationFrame(){if(typeof global.cancelAnimationFrame==="function")return global.cancelAnimationFrame;return clearTimeout}function getRequestAnimationFrame(){if(typeof global.requestAnimationFrame==="function")return global.requestAnimationFrame;return function(handler){return setTimeout(handler,16)}}}).call(this,typeof global!=="undefined"?global:typeof self!=="undefined"?self:typeof window!=="undefined"?window:{})},{}],5:[function(require,module,exports){module.exports=makeSvgController;function makeSvgController(svgElement,options){var elementValid=svgElement instanceof SVGElement;if(!elementValid){throw new Error("svg element is required for svg.panzoom to work")}var owner=svgElement.ownerSVGElement;if(!owner){throw new Error("Do not apply panzoom to the root <svg> element. "+"Use its child instead (e.g. <g></g>). "+"As of March 2016 only FireFox supported transform on the root element")}if(!options.disableKeyboardInteraction){owner.setAttribute("tabindex",0)}var api={getBBox:getBBox,getScreenCTM:getScreenCTM,getOwner:getOwner,applyTransform:applyTransform,initTransform:initTransform};return api;function getOwner(){return owner}function getBBox(){var bbox=svgElement.getBBox();return{left:bbox.x,top:bbox.y,width:bbox.width,height:bbox.height}}function getScreenCTM(){var ctm=owner.getCTM();if(!ctm){return owner.getScreenCTM()}return ctm}function initTransform(transform){var screenCTM=svgElement.getCTM();transform.x=screenCTM.e;transform.y=screenCTM.f;transform.scale=screenCTM.a;owner.removeAttributeNS(null,"viewBox")}function applyTransform(transform){svgElement.setAttribute("transform","matrix("+transform.scale+" 0 0 "+transform.scale+" "+transform.x+" "+transform.y+")")}}},{}],6:[function(require,module,exports){module.exports=Transform;function Transform(){this.x=0;this.y=0;this.scale=1}},{}],7:[function(require,module,exports){var BezierEasing=require("bezier-easing");var animations={ease:BezierEasing(.25,.1,.25,1),easeIn:BezierEasing(.42,0,1,1),easeOut:BezierEasing(0,0,.58,1),easeInOut:BezierEasing(.42,0,.58,1),linear:BezierEasing(0,0,1,1)};module.exports=animate;module.exports.makeAggregateRaf=makeAggregateRaf;module.exports.sharedScheduler=makeAggregateRaf();function animate(source,target,options){var start=Object.create(null);var diff=Object.create(null);options=options||{};var easing=typeof options.easing==="function"?options.easing:animations[options.easing];if(!easing){if(options.easing){console.warn("Unknown easing function in amator: "+options.easing)}easing=animations.ease}var step=typeof options.step==="function"?options.step:noop;var done=typeof options.done==="function"?options.done:noop;var scheduler=getScheduler(options.scheduler);var keys=Object.keys(target);keys.forEach(function(key){start[key]=source[key];diff[key]=target[key]-source[key]});var durationInMs=typeof options.duration==="number"?options.duration:400;var durationInFrames=Math.max(1,durationInMs*.06);var previousAnimationId;var frame=0;previousAnimationId=scheduler.next(loop);return{cancel:cancel};function cancel(){scheduler.cancel(previousAnimationId);previousAnimationId=0}function loop(){var t=easing(frame/durationInFrames);frame+=1;setValues(t);if(frame<=durationInFrames){previousAnimationId=scheduler.next(loop);step(source)}else{previousAnimationId=0;setTimeout(function(){done(source)},0)}}function setValues(t){keys.forEach(function(key){source[key]=diff[key]*t+start[key]})}}function noop(){}function getScheduler(scheduler){if(!scheduler){var canRaf=typeof window!=="undefined"&&window.requestAnimationFrame;return canRaf?rafScheduler():timeoutScheduler()}if(typeof scheduler.next!=="function")throw new Error("Scheduler is supposed to have next(cb) function");if(typeof scheduler.cancel!=="function")throw new Error("Scheduler is supposed to have cancel(handle) function");return scheduler}function rafScheduler(){return{next:window.requestAnimationFrame.bind(window),cancel:window.cancelAnimationFrame.bind(window)}}function timeoutScheduler(){return{next:function(cb){return setTimeout(cb,1e3/60)},cancel:function(id){return clearTimeout(id)}}}function makeAggregateRaf(){var frontBuffer=new Set;var backBuffer=new Set;var frameToken=0;return{next:next,cancel:next,clearAll:clearAll};function clearAll(){frontBuffer.clear();backBuffer.clear();cancelAnimationFrame(frameToken);frameToken=0}function next(callback){backBuffer.add(callback);renderNextFrame()}function renderNextFrame(){if(!frameToken)frameToken=requestAnimationFrame(renderFrame)}function renderFrame(){frameToken=0;var t=backBuffer;backBuffer=frontBuffer;frontBuffer=t;frontBuffer.forEach(function(callback){callback()});frontBuffer.clear()}function cancel(callback){backBuffer.delete(callback)}}},{"bezier-easing":8}],8:[function(require,module,exports){var NEWTON_ITERATIONS=4;var NEWTON_MIN_SLOPE=.001;var SUBDIVISION_PRECISION=1e-7;var SUBDIVISION_MAX_ITERATIONS=10;var kSplineTableSize=11;var kSampleStepSize=1/(kSplineTableSize-1);var float32ArraySupported=typeof Float32Array==="function";function A(aA1,aA2){return 1-3*aA2+3*aA1}function B(aA1,aA2){return 3*aA2-6*aA1}function C(aA1){return 3*aA1}function calcBezier(aT,aA1,aA2){return((A(aA1,aA2)*aT+B(aA1,aA2))*aT+C(aA1))*aT}function getSlope(aT,aA1,aA2){return 3*A(aA1,aA2)*aT*aT+2*B(aA1,aA2)*aT+C(aA1)}function binarySubdivide(aX,aA,aB,mX1,mX2){var currentX,currentT,i=0;do{currentT=aA+(aB-aA)/2;currentX=calcBezier(currentT,mX1,mX2)-aX;if(currentX>0){aB=currentT}else{aA=currentT}}while(Math.abs(currentX)>SUBDIVISION_PRECISION&&++i<SUBDIVISION_MAX_ITERATIONS);return currentT}function newtonRaphsonIterate(aX,aGuessT,mX1,mX2){for(var i=0;i<NEWTON_ITERATIONS;++i){var currentSlope=getSlope(aGuessT,mX1,mX2);if(currentSlope===0){return aGuessT}var currentX=calcBezier(aGuessT,mX1,mX2)-aX;aGuessT-=currentX/currentSlope}return aGuessT}function LinearEasing(x){return x}module.exports=function bezier(mX1,mY1,mX2,mY2){if(!(0<=mX1&&mX1<=1&&0<=mX2&&mX2<=1)){throw new Error("bezier x values must be in [0, 1] range")}if(mX1===mY1&&mX2===mY2){return LinearEasing}var sampleValues=float32ArraySupported?new Float32Array(kSplineTableSize):new Array(kSplineTableSize);for(var i=0;i<kSplineTableSize;++i){sampleValues[i]=calcBezier(i*kSampleStepSize,mX1,mX2)}function getTForX(aX){var intervalStart=0;var currentSample=1;var lastSample=kSplineTableSize-1;for(;currentSample!==lastSample&&sampleValues[currentSample]<=aX;++currentSample){intervalStart+=kSampleStepSize}--currentSample;var dist=(aX-sampleValues[currentSample])/(sampleValues[currentSample+1]-sampleValues[currentSample]);var guessForT=intervalStart+dist*kSampleStepSize;var initialSlope=getSlope(guessForT,mX1,mX2);if(initialSlope>=NEWTON_MIN_SLOPE){return newtonRaphsonIterate(aX,guessForT,mX1,mX2)}else if(initialSlope===0){return guessForT}else{return binarySubdivide(aX,intervalStart,intervalStart+kSampleStepSize,mX1,mX2)}}return function BezierEasing(x){if(x===0){return 0}if(x===1){return 1}return calcBezier(getTForX(x),mY1,mY2)}}},{}],9:[function(require,module,exports){module.exports=function(subject){validateSubject(subject);var eventsStorage=createEventsStorage(subject);subject.on=eventsStorage.on;subject.off=eventsStorage.off;subject.fire=eventsStorage.fire;return subject};function createEventsStorage(subject){var registeredEvents=Object.create(null);return{on:function(eventName,callback,ctx){if(typeof callback!=="function"){throw new Error("callback is expected to be a function")}var handlers=registeredEvents[eventName];if(!handlers){handlers=registeredEvents[eventName]=[]}handlers.push({callback:callback,ctx:ctx});return subject},off:function(eventName,callback){var wantToRemoveAll=typeof eventName==="undefined";if(wantToRemoveAll){registeredEvents=Object.create(null);return subject}if(registeredEvents[eventName]){var deleteAllCallbacksForEvent=typeof callback!=="function";if(deleteAllCallbacksForEvent){delete registeredEvents[eventName]}else{var callbacks=registeredEvents[eventName];for(var i=0;i<callbacks.length;++i){if(callbacks[i].callback===callback){callbacks.splice(i,1)}}}}return subject},fire:function(eventName){var callbacks=registeredEvents[eventName];if(!callbacks){return subject}var fireArguments;if(arguments.length>1){fireArguments=Array.prototype.splice.call(arguments,1)}for(var i=0;i<callbacks.length;++i){var callbackInfo=callbacks[i];callbackInfo.callback.apply(callbackInfo.ctx,fireArguments)}return subject}}}function validateSubject(subject){if(!subject){throw new Error("Eventify cannot use falsy object as events subject")}var reservedWords=["on","fire","off"];for(var i=0;i<reservedWords.length;++i){if(subject.hasOwnProperty(reservedWords[i])){throw new Error("Subject cannot be eventified, since it already has property '"+reservedWords[i]+"'")}}}},{}],10:[function(require,module,exports){module.exports=addWheelListener;module.exports.addWheelListener=addWheelListener;module.exports.removeWheelListener=removeWheelListener;function addWheelListener(element,listener,useCapture){element.addEventListener("wheel",listener,useCapture)}function removeWheelListener(element,listener,useCapture){element.removeEventListener("wheel",listener,useCapture)}},{}]},{},[1])(1)});