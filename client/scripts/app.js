"use strict";
var main = function() {
    var fileList = {},
    justLoaded = true,
    isPlaying = false,
    canvasContext = null,
    CANVASWIDTH = 512,
    CANVASHEIGHT = 120,
    userChoice = "normal",
    FREQUENCIES = [ 60, 170, 310, 600, 1000, 3000, 6000, 12000, 14000, 16000 ],
    POPMODE = [
        { "frequency": 60, "gain": -2 },
        { "frequency": 170, "gain": 4 },
        { "frequency": 310, "gain": -7 },
        { "frequency": 600, "gain": 8 },
        { "frequency": 1000, "gain": 5 },
        { "frequency": 3000, "gain": 0 },
        { "frequency": 6000, "gain": -3 },
        { "frequency": 12000, "gain": -3 },
        { "frequency": 14000, "gain": -2 },
        { "frequency": 16000, "gain": -2 }
    ],
    ROCKMODE = [
        { "frequency": 60, "gain": 7 },
        { "frequency": 170, "gain": 5 },
        { "frequency": 310, "gain": -5 },
        { "frequency": 600, "gain": -8 },
        { "frequency": 1000, "gain": -4 },
        { "frequency": 3000, "gain": 4 },
        { "frequency": 6000, "gain": 9 },
        { "frequency": 12000, "gain": 11 },
        { "frequency": 14000, "gain": 11 },
        { "frequency": 16000, "gain": 11 }
    ],
    JAZZMODE = [
        { "frequency": 60, "gain": 5 },
        { "frequency": 170, "gain": 1 },
        { "frequency": 310, "gain": 0 },
        { "frequency": 600, "gain": -2 },
        { "frequency": 1000, "gain": 0 },
        { "frequency": 3000, "gain": 4 },
        { "frequency": 6000, "gain": 7 },
        { "frequency": 12000, "gain": 9 },
        { "frequency": 14000, "gain": 11 },
        { "frequency": 16000, "gain": 12 }
    ],
    CLASSICMODE = [
        { "frequency": 60, "gain": 0 },
        { "frequency": 170, "gain": 0 },
        { "frequency": 310, "gain": 0 },
        { "frequency": 600, "gain": 0 },
        { "frequency": 1000, "gain": 0 },
        { "frequency": 3000, "gain": 0 },
        { "frequency": 6000, "gain": -7 },
        { "frequency": 12000, "gain": -7 },
        { "frequency": 14000, "gain": -7 },
        { "frequency": 16000, "gain": -9 }
    ],
    audioContext, audioBuffer, canvas, source, analyser, selfFile, defaultFilters, trackArtist, trackTitle;

    var createCanvas = function( width, height ) { // создает поле для визаулизации
        var newCanvas = document.createElement( "canvas" );
        newCanvas.width  = width;
        newCanvas.height = height;
        return newCanvas;
    },
    proccessFile = function( fileList ) { // загружает имя файла на страницу и отдает данные на преобразование
        justLoaded = true;
        selfFile = fileList[ 0 ];
        var $fileName = $( "<p>" ).text( selfFile.name );
        $( "main .drop_zone" ).empty();
        $( "main .drop_zone" ).append( $fileName );

        userChoice = "normal";
        document.getElementById( "normal" ).click();
    },
    handleFiles = function() { // обрабатывает файл, загруженный с помощью input
        var fileList = this.files;
        proccessFile( fileList );
    },
    handleFileSelect = function( evt ) {
        evt.stopPropagation();
        evt.preventDefault();
        var fileList = evt.dataTransfer.files; // FileList object.
        proccessFile( fileList );
    },
    createFilter = function( frequency ) {
        var filter = audioContext.createBiquadFilter();

        filter.type = "peaking"; // тип фильтра
        filter.frequency.value = frequency; // частота
        filter.Q.value = 1; // Q-factor
        filter.gain.value = 0;
        return filter;
    },
    createFilters = function() {
        var filters;

        // создаем фильтры
        filters = FREQUENCIES.map( createFilter );

        // Цепляем их последовательно.
        filters.reduce( function( prev, curr ) {
            prev.connect( curr );
            return curr;
        } );
        return filters;
    },
    handleDragOver = function( evt ) {
        evt.stopPropagation();
        evt.preventDefault();
        evt.dataTransfer.dropEffect = "copy";
    },
    readFileToArrayBuffer = function( mode, file, successCallback ) { // преобразует входящий файл в arrayBuffer
        var reader = new FileReader();
        reader.onload = function() {
            var buffer = reader.result,
            dv = new jDataView( reader.result );

            // "TAG" starts at byte -128 from EOF.
            if ( dv.getString( 3, dv.byteLength - 128 ) === "TAG" ) {
                trackTitle = dv.getString( 30, dv.tell() ),
                trackArtist = dv.getString( 30, dv.tell() );
            } else {
                trackTitle = "Unknown";
                trackArtist = "Unknown";
            }
            $( "header .name_and_author" ).empty();

            var $metaData = $( "<p>" ).text( trackArtist + " - " + trackTitle );

            $( "header .name_and_author" ).append( $metaData );
            successCallback( mode, buffer ) // в случае успеха вызываем функцию декодирования
        }
        reader.onerror = function( evt ) {
            if ( evt.target.error.code == evt.target.error.NOT_READABLE_ERR ) {
                alert( "Failed to read file: " + file.name );
            }
        }
        reader.readAsArrayBuffer( file );
    },
    buildFilter = function( modeArray, defaultFilter ) {
        var builtFilter = defaultFilter;

        builtFilter.forEach( function( filter ) {
            modeArray.forEach( function( item ) {
                if ( filter.frequency.value === item.frequency ) {
                    filter.gain.value = item.gain;
                }
            } );
        } );
        return builtFilter;
    },
    setUserOption = function( mode ) {
        var filter;
        if ( mode === "pop" ) {
            filter = buildFilter( POPMODE, defaultFilters );
        } else if ( mode === "rock" ) {
            filter = buildFilter( ROCKMODE, defaultFilters );
        } else if ( mode === "jazz" ) {
            filter = buildFilter( JAZZMODE, defaultFilters );
        } else if ( mode === "classic" ) {
            filter = buildFilter( CLASSICMODE, defaultFilters );
        } else {
            filter = defaultFilters;
        }
        return filter;
    },
    visualize = function() { // рисует визуализацию
        var WIDTH = canvas.width,
        HEIGHT = canvas.height,
        drawVisual,
        bufferLength = analyser.frequencyBinCount,
        dataArray = new Uint8Array( bufferLength );

        analyser.fftSize = 2048; // задаем размер преобразования
        canvasContext.clearRect( 0, 0, WIDTH, HEIGHT ); // очищаем поле
        var draw = function() {
            drawVisual = requestAnimationFrame( draw );
            analyser.getByteTimeDomainData( dataArray );
            canvasContext.fillStyle = "rgb(255, 255, 255)"; // задаем цвет фона
            canvasContext.fillRect( 0, 0, WIDTH, HEIGHT );
            canvasContext.lineWidth = 2;
            canvasContext.strokeStyle = "rgb(47, 79, 79)";
            canvasContext.beginPath();

            var sliceWidth = WIDTH * 1.0 / bufferLength,
            xPosition = 0,
            count = 0;

            for ( var i = 0; i < bufferLength; i++ ) {
                var force = dataArray[ i ] / 128.0,
                yPosition = force * HEIGHT / 2;
                if ( i === 0 ) {
                    canvasContext.moveTo( xPosition, yPosition );
                } else {
                    canvasContext.lineTo( xPosition, yPosition );
                }
                xPosition += sliceWidth;
            }
            canvasContext.lineTo( canvas.width, canvas.height / 2 );
            canvasContext.stroke();
        };
        draw();
    },
    decodeData = function( mode, arrayBuffer ) { // декодирует загруженный файл
        audioContext.decodeAudioData( arrayBuffer, function( buffer ) {
            audioBuffer = buffer;
            source = audioContext.createBufferSource();
            analyser = audioContext.createAnalyser(); // создаем анализатор
            defaultFilters = createFilters();
            source.buffer = audioBuffer;
            source.loop = false;
            var filters = setUserOption( mode );
            source.connect( analyser );
            analyser.connect( filters[ 0 ] );
            filters[ filters.length - 1 ].connect( audioContext.destination );
            visualize();
            if ( justLoaded === false ) { // отключаем autoplay
                playSound();
            } else {
                justLoaded = false;
            }

        }, function( e ) {
            console.log( "Error decoding file " + e );
        } );
    },
    handleError = function() {
        if ( typeof( selfFile ) === "undefined" ) {
            alert( "Choose audio file first" );
        } else if ( userChoice === "" ) {
            alert( "Choose equalizer mode" );
        }
    },
    playSound = function() { // проигрывает аудио при нажатии кнопки play
        if ( ( typeof( source ) !== "undefined" )  && ( isPlaying === false ) ) {
           source.start( 0 );
           isPlaying = true;
        } else {
            handleError();
        }
    },
    stopPlayingSound = function() { // останавливает проигрывание при нажатии кнопки stop
        if ( typeof( source ) !== "undefined" ) {
            source.stop( 0 );
            isPlaying = false;
        } else {
            handleError;
        }
    }
    window.addEventListener( "load", function() {
        try {
            window.AudioContext = window.AudioContext || window.webkitAudioContext;
            audioContext = new AudioContext();
            canvas = createCanvas ( CANVASWIDTH, CANVASHEIGHT );
            $( "#visualField" ).append( canvas );
            canvasContext = canvas.getContext( "2d" );
        }
        catch ( e ) {
            alert( "Opps.. Your browser does not support audio API" );
        }
    }, false );

    var inputElement = document.getElementById( "download" );

    inputElement.addEventListener( "change", handleFiles, false );
    $( "#play" ).click( function() {
        if ( isPlaying === false ) {
            readFileToArrayBuffer( userChoice, selfFile, decodeData );
        }
    } );
    $( "#stop" ).click( function() {
        if ( isPlaying === true ) {
            stopPlayingSound();
        }
    } );

    var dropZone = document.getElementById( "drop_zone_id" );

    dropZone.addEventListener( "dragover", handleDragOver, false );
    dropZone.addEventListener( "drop", handleFileSelect, false );

    var processRadioClick = function( mode, boxType ) {
        if ( typeof( selfFile ) !== "undefined" ) {
            if ( isPlaying === true ) {
                stopPlayingSound();
            };
            readFileToArrayBuffer( mode, selfFile, decodeData ); // вызываем функцию преобразования загруженного файла в arrayBuffer
        } else {
            alert( "Choose audio file first" );
            boxType.checked = "";
        }
    },
    popBox = document.querySelector( "#pop" ),
    rockBox = document.querySelector( "#rock" ),
    jazzBox = document.querySelector( "#jazz" ),
    classicBox = document.querySelector( "#classic" ),
    normalBox = document.querySelector( "#normal" ),
    box;

    popBox.onclick = function() {
        userChoice = "pop";
        box = popBox;
        processRadioClick( userChoice, box );
    };
    rockBox.onclick = function() {
        userChoice = "rock";
        box = rockBox;
        processRadioClick( userChoice, box );
    };
    jazzBox.onclick = function() {
        userChoice = "jazz";
        box = rockBox;
        processRadioClick( userChoice, box );
    };
    classicBox.onclick = function() {
        userChoice = "classic";
        box = rockBox;
        processRadioClick( userChoice, box );
    };
    normalBox.onclick = function() {
        userChoice = "normal";
        box = rockBox;
        processRadioClick( userChoice, box );
    };
}
$( document ).ready( main );
