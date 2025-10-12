// server.js
const express = require('express');
const cors = require('cors');
require('dotenv').config();
const http = require('http');
const { Server } = require("socket.io");
const Filter = require('bad-words');
const db = require('./db');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});
const filter = new Filter();

// --- MIDDLEWARE ---
app.use(cors());
app.use(express.json());

// --- API ROUTES ---
app.use('/api/auth', require('./routes/auth'));
app.use('/api/profiles', require('./routes/profiles'));
app.use('/api/jobs', require('./routes/jobs'));
app.use('/api/chats', require('./routes/chats'));

// --- SOCKET.IO REAL-TIME LOGIC ---
io.on('connection', (socket) => {
  console.log(`User Connected: ${socket.id}`);

  socket.on('joinRoom', (threadId) => {
    socket.join(threadId);
    console.log(`User ${socket.id} joined room ${threadId}`);
  });

  socket.on('sendMessage', async (data) => {
    const { threadId, senderId, content, messageType } = data;
    const cleanContent = filter.clean(content);

    try {
      const savedMessage = await db.query(
        'INSERT INTO messages (thread_id, sender_id, content, message_type) VALUES ($1, $2, $3, $4) RETURNING *',
        [threadId, senderId, cleanContent, messageType]
      );

      // THE FIX IS HERE:
      // Instead of io.to(), we use socket.to(). This sends the message to everyone
      // in the room EXCEPT for the socket that sent the message.
      socket.to(threadId).emit('newMessage', savedMessage.rows[0]);

    } catch (error) {
      console.error("Error saving message:", error);
    }
  });

  socket.on('disconnect', () => {
    console.log('User Disconnected', socket.id);
  });
});


// --- START THE SERVER ---
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server (including Chat) running on port ${PORT}`));

