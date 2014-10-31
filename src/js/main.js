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

function initVideo() {

  var videoLeft = document.querySelector('#left');
  // var videoRight = document.querySelector('#right');

  var leftCanvasHidden = document.getElementById('left-hidden');
  var leftCanvasShown = document.getElementById('left-shown');
  var leftCanvasHiddenCon = leftCanvasHidden.getContext('2d');
  var leftCanvasShownCon = leftCanvasShown.getContext('2d');
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
      // Reverse the canvas image
      leftCanvasHiddenCon.translate(w, 0);
      leftCanvasHiddenCon.scale(-1, 1);
      leftCanvasShownCon.translate(w, 0);
      leftCanvasShownCon.scale(-1, 1);
      initialized = true;
    }
  }, false);
  // Every 33 milliseconds copy the video image to the canvas
  videoLeft.addEventListener('play', function() {
    setInterval(function() {
      if (videoLeft.paused || videoLeft.ended) return;
      leftCanvasHiddenCon.fillRect(0, 0, w, h);
      leftCanvasHiddenCon.drawImage(videoLeft, 0, 0, w, h);
      leftCanvasShownCon.fillRect(0, 0, w, h);
      // leftCanvasShownCon.drawImage(videoLeft, 0, 0, w, h);
      leftCanvasShownCon.putImageData(leftCanvasHiddenCon.getImageData(), 0, 0, w, h);
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
    //   videoRight.src = window.URL.createObjectURL(localMediaStream);
    //   videoRight.onloadedmetadata = function(e) {};
    // }, e => console.error('Error during video acquisition:', e));
  }, e => console.error('Error during video acquisition:', e));
}
initVideo();
