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

        socket.on('waiting', () => {
            console.log('Waiting for a partner...');
        });

        socket.on('partner-found', async ({ partnerId }) => {
            console.log('Partner found:', partnerId);

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

            // Create an offer if this user is initiating the connection
            if (socket.id < partnerId) {
                const offer = await peerConnection.createOffer();
                await peerConnection.setLocalDescription(offer);
                socket.emit('offer', { offer });
            }
        });

        socket.on('offer', async ({ offer }) => {
            await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
            const answer = await peerConnection.createAnswer();
            await peerConnection.setLocalDescription(answer);
            socket.emit('answer', { answer });
        });

        socket.on('answer', async ({ answer }) => {
            await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
        });

        socket.on('ice-candidate', async ({ candidate }) => {
            if (candidate) {
                await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
            }
        });

    } catch (error) {
        console.error('Error accessing media devices.', error);
    }
}

startVideoChat();
