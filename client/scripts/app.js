"use strict";
var main = function () {
    var fileList = {},
    canvasContext = null,
    canvasWidth = 512,
    canvasHeight = 120,
    audioContext, audioBuffer, source, canvas, analyser, selfFile, trackArtist, trackTitle;

    var createCanvas = function ( w, h ) { // создает поле для визаулизации
        var newCanvas = document.createElement('canvas');
        newCanvas.width  = w;     
        newCanvas.height = h;
        return newCanvas;
    }
    var handleFiles = function () { // обрабатывает файл, загруженный с помощью input
    	fileList = this.files;
    	selfFile = fileList[0];
    }
    var readFileToArrayBuffer = function (file, successCallback) { // преобразует входящий файл в arrayBuffer
        var reader = new FileReader();
        reader.onload = function () {
            var buffer = reader.result,
            dv = new jDataView(reader.result);
 
            // "TAG" starts at byte -128 from EOF.
            if (dv.getString(3, dv.byteLength - 128) == 'TAG') {
                trackTitle = dv.getString(30, dv.tell()),
                trackArtist = dv.getString(30, dv.tell());
            } else {
                trackTitle = 'Unknown';
                trackArtist = 'Unknown';
            }
            $('header .name_and_author').empty();

            var $p = $("<p>").text(trackArtist + " - " + trackTitle);

            $('header .name_and_author').append($p);
            successCallback(buffer) // в случае успеха вызываем функцию декодирования
        }
        reader.onerror = function (evt) {
            if (evt.target.error.code == evt.target.error.NOT_READABLE_ERR) {
                alert("Failed to read file: " + file.name);
            }
        }
        reader.readAsArrayBuffer(file);
    }
    var visualize = function () { // рисует визуализацию
        var WIDTH = canvas.width,
        HEIGHT = canvas.height,
        drawVisual,
        bufferLength = analyser.frequencyBinCount,
        dataArray = new Uint8Array(bufferLength);

        analyser.fftSize = 2048;
        canvasContext.clearRect(0, 0, WIDTH, HEIGHT); // очищаем поле
        function draw() {
            drawVisual = requestAnimationFrame(draw);
            analyser.getByteTimeDomainData(dataArray);
            canvasContext.fillStyle = 'rgb(255, 255, 255)'; // задаем цвет фона
            canvasContext.fillRect(0, 0, WIDTH, HEIGHT);
            canvasContext.lineWidth = 2;
            canvasContext.strokeStyle = 'rgb(47, 79, 79)';
            canvasContext.beginPath();

            var sliceWidth = WIDTH * 1.0 / bufferLength,
            x = 0;

            for (var i = 0; i < bufferLength; i++) {
                var v = dataArray[i] / 128.0,
                y = v * HEIGHT/2;
                if (i === 0) {
                    canvasContext.moveTo(x, y);
                } else {
                    canvasContext.lineTo(x, y);
                }
                x += sliceWidth;
            }
            canvasContext.lineTo(canvas.width, canvas.height/2);
            canvasContext.stroke();
        }
        draw();
    }
    var decodeData = function (arrayBuffer) { // декодирует загруженный файл
	    audioContext.decodeAudioData(arrayBuffer, function(buffer) {
            audioBuffer = buffer;
            source = audioContext.createBufferSource();
            analyser = audioContext.createAnalyser(); // создаем анализатор
            source.buffer = audioBuffer;
            source.loop = false;
            source.connect(analyser);
            analyser.connect(audioContext.destination);
            visualize();
            playSound();
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
            canvas = createCanvas (canvasWidth, canvasHeight);
            $("#visualField").append(canvas);
            canvasContext = canvas.getContext('2d');
        }
        catch(e) {
            alert('Opps.. Your browser do not support audio API');
        }
    }, false);

    var inputElement = document.getElementById("download");

    inputElement.addEventListener("change", handleFiles, false);
    $("#play").click(function () {
        readFileToArrayBuffer(selfFile, decodeData);
    });
    $("#stop").click(function () {
    	stopPlayingSound();
    });
}
$(document).ready(main);