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

function initVideo() {
  if (navigator.getUserMedia === undefined) {
    navigator.getUserMedia = (
      navigator.webkitGetUserMedia ||
      navigator.mozGetUserMedia ||
      navigator.msGetUserMedia
    );
  }
  if (navigator.getUserMedia === undefined) {
    console.error("getUserMedia() not found");
    return;
  }
  navigator.getUserMedia({video: true, audio: true}, localMediaStream => {
    var videoLeft = document.querySelector('#left');
    videoLeft.src = window.URL.createObjectURL(localMediaStream);
    videoLeft.onloadedmetadata = function(e) {};
  }, e => console.error('Error during video acquisition:', e));
  navigator.getUserMedia({video: true}, localMediaStream => {
    var videoRight = document.querySelector('#right');
    videoRight.src = window.URL.createObjectURL(localMediaStream);
    videoRight.onloadedmetadata = function(e) {};
  }, e => console.error('Error during video acquisition:', e));
}
initVideo();
