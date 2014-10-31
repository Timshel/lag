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

var refreshValue = 33;

navigator.getUserMedia({video: true, audio: true}, localMediaStream => {
  videoLeft.src = window.URL.createObjectURL(localMediaStream);
  videoLeft.onloadedmetadata = function(e) {};
  // navigator.getUserMedia({video: true}, localMediaStream => {
    videoRight.src = window.URL.createObjectURL(localMediaStream);
    // videoRight.onloadedmetadata = function(e) {};
  // }, e => console.error('Error during video acquisition:', e));

  initVideo();
}, e => console.error('Error during video acquisition:', e));

function initVideo() {
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

  function onPlay(video, canvasAndContextHidden, canvasAndContextShow, buffer){
    var [canvasHidden, canvasHiddenCon] = canvasAndContextHidden;
    var [canvasShown, canvasShownCon]   = canvasAndContextShow;

    setTimeout(() => {
      var w = video.offsetWidth;
      var h = video.offsetHeight;

      setDimensions(canvasHidden, video);
      setDimensions(canvasShown, video);

      reverseCanvas([canvasHidden, canvasHiddenCon])
      reverseCanvas([canvasShown, canvasShownCon])

      setInterval(function() {
        if (video.paused || video.ended) return;
        canvasHiddenCon.fillRect(0, 0, w, h);
        canvasHiddenCon.drawImage(video, 0, 0, w, h);
        canvasShownCon.fillRect(0, 0, w, h);
        var el = buffer.put(canvasHiddenCon.getImageData(0, 0, w, h));
        if (el !== undefined) {
          canvasShownCon.putImageData(el, 0, 0);
        }
      }, 33);
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

  function setLag() {
    lagValue = lagSlider.value;
    lagShown.innerHTML = lagValue;
    leftBuffer.updateSize(computeBufferSize());
    rightBuffer.updateSize(computeBufferSize());
  }
  lagSlider.addEventListener("change", setLag);

  // Every 33 milliseconds copy the video image to the canvas
  videoLeft.addEventListener('play', function() {
    onPlay(
      videoLeft,
      getCanvasAndContext('left-hidden'),
      getCanvasAndContext('left-shown'),
      leftBuffer
    );
  }, false);

  videoRight.addEventListener('play', function() {
    onPlay(
      videoRight,
      getCanvasAndContext('right-hidden'),
      getCanvasAndContext('right-shown'),
      rightBuffer
    )
  }, false);

  if (navigator.getUserMedia === undefined) {
    console.error("getUserMedia() not found");
    return;
  }
}
