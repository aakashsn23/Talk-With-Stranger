// server.js

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const port = process.env.PORT || 3000;

// Serve static files from the public directory
app.use(express.static('public'));

let waitingPeer = null;

io.on('connection', (socket) => {
    console.log('New user connected:', socket.id);

    if (waitingPeer) {
        // Pair the new user with the waiting peer
        io.to(socket.id).emit('peer', { peerId: waitingPeer });
        io.to(waitingPeer).emit('peer', { peerId: socket.id });
        waitingPeer = null;
    } else {
        // Set the new user as the waiting peer
        waitingPeer = socket.id;
    }

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        if (waitingPeer === socket.id) {
            waitingPeer = null;
        }
    });
});

server.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
