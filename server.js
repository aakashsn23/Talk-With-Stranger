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

// Handle socket connection
io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    // Broadcast a message when a user disconnects
    socket.on('disconnect', () => {
        console.log('A user disconnected:', socket.id);
        socket.broadcast.emit('user-disconnected', socket.id);
    });

    // Relay offer and answer between peers
    socket.on('offer', (data) => {
        socket.broadcast.emit('offer', data);
    });

    socket.on('answer', (data) => {
        socket.broadcast.emit('answer', data);
    });

    // Relay ICE candidates between peers
    socket.on('ice-candidate', (data) => {
        socket.broadcast.emit('ice-candidate', data);
    });
});

server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
