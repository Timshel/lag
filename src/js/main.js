/* jshint esnext:true */

// Find the right method, call on correct element
function launchIntoFullscreen(element) {
  if(element.requestFullscreen) {
    element.requestFullscreen();
  } else if(element.mozRequestFullScreen) {
    element.mozRequestFullScreen();
  } else if(element.webkitRequestFullscreen) {
    element.webkitRequestFullscreen();
  } else if(element.msRequestFullscreen) {
    element.msRequestFullscreen();
  }
}

function isFullScreen(){
   return ( "mozFullScreen" in document &&  document.mozFullScreen )
      || ( "webkitIsFullScreen" in document && document.webkitIsFullScreen );
}

// Whack fullscreen
function exitFullscreen() {
  if(document.exitFullscreen) {
    document.exitFullscreen();
  } else if(document.mozCancelFullScreen) {
    document.mozCancelFullScreen();
  } else if(document.webkitExitFullscreen) {
    document.webkitExitFullscreen();
  }
}

document.getElementById("fullscreen").addEventListener("click", function(){
  var dive = document.getElementById("dive");
  launchIntoFullscreen(dive);
}, false);

if (navigator.getUserMedia === undefined) {
  navigator.getUserMedia = (
    navigator.webkitGetUserMedia ||
    navigator.mozGetUserMedia ||
    navigator.msGetUserMedia
  );
}

var Buffer = function (tpl) {
  var size = tpl.size;
  var elems = new Array(size);
  var idx = 0;
  function put(el) {
    elems[idx] = el;
    idx = (idx + 1) % size;
    return elems[idx];
  }
  function updateSize(newSize) {
    var newElems = new Array(newSize);
    var m = Math.min(size, newSize);
    for (var i = m; i >= 0; i--) {
      newElems[m - i] = elems[(idx - i) % size];
    }
    elems = newElems;
    size = newSize;
    idx = m;
  }
  return {
    size,
    put,
    updateSize,
  };
};

var videoLeft  = document.querySelector('#left-video');
var videoRight = document.querySelector('#right-video');

var lagSlider = document.getElementById("lag-slider");
var lagValue = lagSlider.value;
var lagShown = document.getElementById("lag-shown");
lagShown.innerHTML = lagValue;

var audioCtx = new (window.AudioContext || window.webkitAudioContext)();

var refreshValue = 100;

navigator.getUserMedia({video: true, audio: true}, localMediaStream => {
  videoLeft.src = window.URL.createObjectURL(localMediaStream);
  videoLeft.onloadedmetadata = function(e) {};

  videoLeft.muted = 'true';
  videoLeft.volume = 0.0;

  var source = audioCtx.createMediaStreamSource(localMediaStream);
  var delay  = audioCtx.createDelay(lagSlider.value / 1000);

  source.connect(delay);
  delay.connect(audioCtx.destination);

  initVideo(delay);

}, e => console.error('Error during video acquisition:', e));

function initVideo(delay) {
  function getCanvasAndContext(id) {
    var canvas = document.getElementById(id);
    var conn = canvas.getContext('2d');
    return [canvas, conn];
  }

  function setDimensions(elt, source) {
    elt.setAttribute('width', source.offsetWidth);
    elt.setAttribute('height', source.offsetHeight);
  }

  function reverseCanvas(canvasAndContext) {
    var[canvas, context] = canvasAndContext
    context.translate(canvas.offsetWidth, 0);
    context.scale(-1, 1);
  };

  function onPlay(video, canvasAndContextHidden, canvasAndContextShow1, canvasAndContextShow2, buffer){
    var [canvasHidden, canvasHiddenCon] = canvasAndContextHidden;
    var [canvasShown1, canvasShown1Con] = canvasAndContextShow1;
    var [canvasShown2, canvasShown2Con] = canvasAndContextShow2;

    setTimeout(() => {
      var w = video.offsetWidth;
      var h = video.offsetHeight;

      setDimensions(canvasHidden, video);
      setDimensions(canvasShown1, video);
      setDimensions(canvasShown2, video);

      setInterval(function() {
        if (video.paused || video.ended) return;
        canvasHiddenCon.fillRect(0, 0, w, h);
        canvasHiddenCon.drawImage(video, 0, 0, w, h);

        canvasShown1Con.fillRect(0, 0, w, h);
        canvasShown2Con.fillRect(0, 0, w, h);


        var el = buffer.put(canvasHiddenCon.getImageData(0, 0, w, h));
        if (el !== undefined) {
          canvasShown1Con.putImageData(el, 0, 0);
          canvasShown2Con.putImageData(el, 0, 0);
        }
      }, refreshValue);
    }, 1000);
  }

  function computeBufferSize() {
    if (lagValue === 0) {
      return 1;
    } else {
      return parseInt(lagValue/refreshValue);
    }
  }

  var leftBuffer = Buffer({size: computeBufferSize()});
  var rightBuffer = Buffer({size: computeBufferSize()});

  lagSlider.oninput = function() {
    lagValue = lagSlider.value;
    lagShown.innerHTML = lagValue;
  }
  function setLag() {
    lagValue = lagSlider.value;
    leftBuffer.updateSize(computeBufferSize());
    rightBuffer.updateSize(computeBufferSize());
    delay.delayTime.value = lagValue / 1000;
    console.log(delay.delayTime.value);
  }
  lagSlider.addEventListener("change", setLag);

  // Every 33 milliseconds copy the video image to the canvas
  videoLeft.addEventListener('play', function() {
    onPlay(
      videoLeft,
      getCanvasAndContext('left-hidden'),
      getCanvasAndContext('left-shown'),
      getCanvasAndContext('right-shown'),
      leftBuffer
    );
  }, false);

  if (navigator.getUserMedia === undefined) {
    console.error("getUserMedia() not found");
    return;
  }
}
