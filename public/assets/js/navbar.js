document.getElementById('refreshIcon').addEventListener('click', function() {
    var iframe = document.querySelector('.iframe');
    iframe.contentWindow.location.reload(true);
});

document.getElementById('fullscreenIcon').addEventListener('click', function() {
    var iframe = document.querySelector('.iframe');
    iframe.requestFullscreen();
});

document.getElementById('backIcon').addEventListener('click', function() {
    var iframe = document.querySelector('.iframe');
    iframe.contentWindow.history.back();
});

document.getElementById('forwardIcon').addEventListener('click', function() {
    var iframe = document.querySelector('.iframe');
    iframe.contentWindow.history.forward();
});
