const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const PORT = process.env.PORT || 3000;

app.use(express.static('public'));

// Serve the index.html file
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

let waitingSocket = null;

// Handle socket connection
io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    if (waitingSocket) {
        // If there is a socket waiting, pair them
        const partnerSocket = waitingSocket;
        waitingSocket = null;

        // Notify both users that they are connected
        socket.emit('partner-found', { partnerId: partnerSocket.id });
        partnerSocket.emit('partner-found', { partnerId: socket.id });

        // Set up event listeners for signaling data
        socket.on('offer', (data) => partnerSocket.emit('offer', data));
        socket.on('answer', (data) => partnerSocket.emit('answer', data));
        socket.on('ice-candidate', (data) => partnerSocket.emit('ice-candidate', data));

        partnerSocket.on('offer', (data) => socket.emit('offer', data));
        partnerSocket.on('answer', (data) => socket.emit('answer', data));
        partnerSocket.on('ice-candidate', (data) => socket.emit('ice-candidate', data));

    } else {
        // If no one is waiting, set this socket as waiting
        waitingSocket = socket;
        socket.emit('waiting');
    }

    // Handle disconnection
    socket.on('disconnect', () => {
        console.log('A user disconnected:', socket.id);
        if (waitingSocket === socket) {
            waitingSocket = null;
        }
    });
});

server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
