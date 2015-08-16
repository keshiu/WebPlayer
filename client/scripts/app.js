"use strict";
var main = function () {
    var fileList = {},
    audioContext, audioBuffer, source, selfFile;
    
    var handleFiles = function () { //обрабатывает файл, загруженный с помощью input
    	fileList = this.files;
    	selfFile = fileList[0];
        readFileToArrayBuffer(selfFile, decodeData);
    }
    var readFileToArrayBuffer = function (file, successCallback) { //преобразует входящий файл в arrayBuffer
        var reader = new FileReader();
        reader.onload = function () {
            var buffer = reader.result;
            successCallback(buffer); // в случае удачи вызовет функцию декодирования
        }
        reader.onerror = function (evt) {
            if (evt.target.error.code == evt.target.error.NOT_READABLE_ERR) {
                alert("Failed to read file: " + file.name);
            }
        }
        reader.readAsArrayBuffer(file);
    }
    var decodeData = function (arrayBuffer) { // декодирует загруженный файл
	    audioContext.decodeAudioData(arrayBuffer, function(buffer) {
            audioBuffer = buffer;
            source = audioContext.createBufferSource();
            source.buffer = audioBuffer;
            source.loop = false;
            source.connect(audioContext.destination);
        }, function(e) {
            console.log('Error decoding file ' + e); 
        });
    }
    var playSound = function () { // проигрывает аудио при нажатии кнопки play
        source.start(0); 
    }
    var stopPlayingSound = function(){ // останавливает проигрывание при нажатии кнопки stop
        source.stop(0);
    }

    window.addEventListener('load', function(){
        try {
            window.AudioContext = window.AudioContext||window.webkitAudioContext;
            audioContext = new AudioContext();
        }
        catch(e) {
            alert('Opps.. Your browser do not support audio API');
        }
    }, false);

    var inputElement = document.getElementById("download");
    
    inputElement.addEventListener("change", handleFiles, false);
    $("#play").click(function () {
        playSound();
    });
    $("#stop").click(function () {
    	stopPlayingSound();
    });
}
$(document).ready(main);