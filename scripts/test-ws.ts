const io = require('socket.io-client');

const socket = io('http://localhost:3000');

socket.on('connect', () => {
    console.log('Connected to WebSocket server');
});

socket.on('price-update', (data) => {
    console.log('Received price update:', data ? data.length : 0, 'tokens');
    socket.disconnect();
});

socket.on('disconnect', () => {
    console.log('Disconnected');
});
