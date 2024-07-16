const socket = io();

const weVideo = document.getElementById('weVideo');
const strangerVideo = document.getElementById('strangerVideo');
const stopButton = document.getElementById('button');

let localStream;
let peerConnection;
const config = {
    iceServers: [
        {
            urls: 'stun:stun.l.google.com:19302'
        }
    ]
};

async function startVideoChat() {
    try {
        localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        weVideo.srcObject = localStream;

        socket.emit('new-user');

        socket.on('user-disconnected', () => {
            strangerVideo.srcObject = null;
            if (peerConnection) peerConnection.close();
        });

        socket.on('offer', async (data) => {
            peerConnection = new RTCPeerConnection(config);
            localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));
            peerConnection.ontrack = event => {
                strangerVideo.srcObject = event.streams[0];
            };
            peerConnection.onicecandidate = event => {
                if (event.candidate) {
                    socket.emit('ice-candidate', { candidate: event.candidate });
                }
            };
            await peerConnection.setRemoteDescription(new RTCSessionDescription(data.offer));
            const answer = await peerConnection.createAnswer();
            await peerConnection.setLocalDescription(answer);
            socket.emit('answer', { answer });
        });

        socket.on('answer', async (data) => {
            await peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer));
        });

        socket.on('ice-candidate', async (data) => {
            if (data.candidate) {
                await peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
            }
        });

        socket.emit('ready');

        socket.on('ready', async () => {
            peerConnection = new RTCPeerConnection(config);
            localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));
            peerConnection.ontrack = event => {
                strangerVideo.srcObject = event.streams[0];
            };
            peerConnection.onicecandidate = event => {
                if (event.candidate) {
                    socket.emit('ice-candidate', { candidate: event.candidate });
                }
            };
            const offer = await peerConnection.createOffer();
            await peerConnection.setLocalDescription(offer);
            socket.emit('offer', { offer });
        });
    } catch (err) {
        console.error('Error accessing media devices.', err);
    }
}

stopButton.addEventListener('click', () => {
    if (peerConnection) peerConnection.close();
    socket.disconnect();
});

startVideoChat();
