"use strict";var main=function(){var n,e,o,a,t={},i=function(){t=this.files,a=t[0]},r=function(n,e){var o=new FileReader;o.onload=function(){var n=o.result;e(n)},o.onerror=function(e){e.target.error.code==e.target.error.NOT_READABLE_ERR&&alert("Failed to read file: "+n.name)},o.readAsArrayBuffer(n)},c=function(a){n.decodeAudioData(a,function(a){e=a,o=n.createBufferSource(),o.buffer=e,o.loop=!1,o.connect(n.destination),u()},function(n){console.log("Error decoding file "+n)})},u=function(){o.start(0)},l=function(){o.stop(0)};window.addEventListener("load",function(){try{window.AudioContext=window.AudioContext||window.webkitAudioContext,n=new AudioContext}catch(e){alert("Opps.. Your browser do not support audio API")}},!1);var f=document.getElementById("download");f.addEventListener("change",i,!1),$("#play").click(function(){r(a,c)}),$("#stop").click(function(){l()})};$(document).ready(main);
