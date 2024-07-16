const socket = io();

// HTML elements
const weVideo = document.getElementById('weVideo');
const strangerVideo = document.getElementById('strangerVideo');
const stopButton = document.getElementById('button');

let peer;

navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then(stream => {
    weVideo.srcObject = stream;

    socket.on('peer', (data) => {
        if (data.peerId) {
            peer = new SimplePeer({
                initiator: true,
                trickle: false,
                stream: stream
            });

            peer.on('signal', signal => {
                socket.emit('signal', { signal: signal, to: data.peerId });
            });

            peer.on('stream', peerStream => {
                strangerVideo.srcObject = peerStream;
            });

            socket.on('signal', signalData => {
                peer.signal(signalData.signal);
            });
        }
    });

    socket.on('peer', (data) => {
        if (data.peerId) {
            peer = new SimplePeer({
                initiator: false,
                trickle: false,
                stream: stream
            });

            peer.on('signal', signal => {
                socket.emit('signal', { signal: signal, to: data.peerId });
            });

            peer.on('stream', peerStream => {
                strangerVideo.srcObject = peerStream;
            });

            socket.on('signal', signalData => {
                peer.signal(signalData.signal);
            });
        }
    });
}).catch(error => {
    console.error('Error accessing media devices.', error);
});

stopButton.addEventListener('click', () => {
    if (peer) {
        peer.destroy();
    }
    socket.disconnect();
});
