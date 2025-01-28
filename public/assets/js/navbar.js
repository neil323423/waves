document.getElementById('refreshIcon').addEventListener('click', function() {
    var iframe = document.getElementById('proxy-iframe');
    if (iframe && iframe.tagName === 'IFRAME') {
        iframe.contentWindow.location.reload(true);
    }
});

document.getElementById('fullscreenIcon').addEventListener('click', function() {
    var iframe = document.getElementById('proxy-iframe');
    if (iframe && iframe.tagName === 'IFRAME') {
        iframe.requestFullscreen();
    }
});

document.getElementById('backIcon').addEventListener('click', function() {
    var iframe = document.getElementById('proxy-iframe');
    if (iframe && iframe.tagName === 'IFRAME') {
        iframe.contentWindow.history.back();
    }
});

document.getElementById('forwardIcon').addEventListener('click', function() {
    var iframe = document.getElementById('proxy-iframe');
    if (iframe && iframe.tagName === 'IFRAME') {
        iframe.contentWindow.history.forward();
    }
});