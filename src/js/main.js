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
  var idxRead = 1;
  var idxWrite = 0;
  function get() {
    var idx = idxRead;
    idxRead = (idxRead + 1) % size;
    return elems[idxRead];
  }
  function put(el) {
    var idx = idxWrite;
    idxWrite = (idxWrite + 1) % size;
    elems[idxWrite] = el;
  }
  return {
    size,
    "get": get,
    put
  };
};

function initVideo() {

  var videoLeft = document.querySelector('#left-video');
  var videoRight = document.querySelector('#right-video');

  function getCanvasAndContext(id) {
    var canvas = document.getElementById(id);
    var conn = canvas.getContext('2d');
    return [canvas, conn];
  }

  var [leftCanvasHidden, leftCanvasHiddenCon] = getCanvasAndContext('left-hidden');
  var [leftCanvasShown, leftCanvasShownCon] = getCanvasAndContext('left-shown');
  var [rightCanvasHidden, rightCanvasHiddenCon] = getCanvasAndContext('right-hidden');
  var [rightCanvasShown, rightCanvasShownCon] = getCanvasAndContext('right-shown');
  var w = 600;
  var h = 420;

  var initialized = false;
  videoLeft.addEventListener('canplay', e => {
    if (!initialized) {
      // videoWidth isn't always set correctly in all browsers
      if (videoLeft.videoWidth > 0) {
        h = videoLeft.videoHeight / (videoLeft.videoWidth / w);
      }
      leftCanvasHidden.setAttribute('width', w);
      leftCanvasHidden.setAttribute('height', h);
      leftCanvasShown.setAttribute('width', w);
      leftCanvasShown.setAttribute('height', h);
      rightCanvasHidden.setAttribute('width', w);
      rightCanvasHidden.setAttribute('height', h);
      rightCanvasShown.setAttribute('width', w);
      rightCanvasShown.setAttribute('height', h);
      // Reverse the canvas image
      leftCanvasHiddenCon.translate(w, 0);
      leftCanvasHiddenCon.scale(-1, 1);
      leftCanvasShownCon.translate(w, 0);
      leftCanvasShownCon.scale(-1, 1);
      rightCanvasHiddenCon.translate(w, 0);
      rightCanvasHiddenCon.scale(-1, 1);
      rightCanvasShownCon.translate(w, 0);
      rightCanvasShownCon.scale(-1, 1);
      initialized = true;
    }
  }, false);

  var leftBuffer = Buffer({size: 30});
  var rightBuffer = Buffer({size: 30});

  // Every 33 milliseconds copy the video image to the canvas
  videoLeft.addEventListener('play', function() {
    setInterval(function() {
      if (videoLeft.paused || videoLeft.ended) return;
      leftCanvasHiddenCon.fillRect(0, 0, w, h);
      leftCanvasHiddenCon.drawImage(videoLeft, 0, 0, w, h);
      leftCanvasShownCon.fillRect(0, 0, w, h);
      leftBuffer.put(leftCanvasHiddenCon.getImageData(0, 0, w, h));
      var el = leftBuffer.get();
      if (el !== undefined) {
        leftCanvasShownCon.putImageData(el, 0, 0);
      }
    }, 33);
  }, false);
  videoRight.addEventListener('play', function() {
    setInterval(function() {
      if (videoRight.paused || videoRight.ended) return;
      rightCanvasHiddenCon.fillRect(0, 0, w, h);
      rightCanvasHiddenCon.drawImage(videoRight, 0, 0, w, h);
      rightCanvasShownCon.fillRect(0, 0, w, h);
      rightBuffer.put(rightCanvasHiddenCon.getImageData(0, 0, w, h));
      var el = rightBuffer.get();
      if (el !== undefined) {
        rightCanvasShownCon.putImageData(el, 0, 0);
      }
    }, 33);
  }, false);

  if (navigator.getUserMedia === undefined) {
    console.error("getUserMedia() not found");
    return;
  }
  navigator.getUserMedia({video: true, audio: true}, localMediaStream => {
    videoLeft.src = window.URL.createObjectURL(localMediaStream);
    videoLeft.onloadedmetadata = function(e) {};
    // navigator.getUserMedia({video: true}, localMediaStream => {
      videoRight.src = window.URL.createObjectURL(localMediaStream);
      // videoRight.onloadedmetadata = function(e) {};
    // }, e => console.error('Error during video acquisition:', e));
  }, e => console.error('Error during video acquisition:', e));
}
initVideo();
