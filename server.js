require('dotenv').config();
const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const { Server } = require('socket.io');
const path = require('path');

const songRoutes = require('./routes/songs');
const playlistRoutes = require('./routes/playlists');
const messageRoutes = require('./routes/messages');
const Message = require('./models/Message');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api/songs', songRoutes);
app.use('/api/playlists', playlistRoutes);
app.use('/api/messages', messageRoutes);

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const onlineUsers = new Map();

io.on('connection', (socket) => {
  console.log('Nouvelle connexion:', socket.id);

  socket.on('user:join', (username) => {
    onlineUsers.set(socket.id, username);
    io.emit('users:online', Array.from(onlineUsers.values()));
    io.emit('chat:notification', {
      text: `${username} a rejoint le chat`,
      type: 'join'
    });
  });

  socket.on('chat:message', async (data) => {
    try {
      const message = new Message({
        username: data.username,
        text: data.text
      });
      const saved = await message.save();
      io.emit('chat:message', saved);
    } catch (err) {
      socket.emit('chat:error', 'Erreur lors de l\'envoi du message');
    }
  });

  socket.on('chat:typing', (username) => {
    socket.broadcast.emit('chat:typing', username);
  });

  socket.on('chat:stop-typing', (username) => {
    socket.broadcast.emit('chat:stop-typing', username);
  });

  socket.on('disconnect', () => {
    const username = onlineUsers.get(socket.id);
    onlineUsers.delete(socket.id);
    io.emit('users:online', Array.from(onlineUsers.values()));
    if (username) {
      io.emit('chat:notification', {
        text: `${username} a quitté le chat`,
        type: 'leave'
      });
    }
    console.log('Deconnexion:', socket.id);
  });
});

const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/an2lou';

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('Connecte a MongoDB');
    server.listen(PORT, () => {
      console.log('Serveur demarre sur http://localhost:' + PORT);
    });
  })
  .catch((err) => {
    console.error('Erreur MongoDB :', err.message);
    process.exit(1);
  });
