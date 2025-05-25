require('dotenv').config();
const express = require('express');
const app = express();
const connectDB = require('./config/db');
const userRoutes = require('./routes/userRoutes');
const authRoutes = require('./routes/authRoutes');
const chatRoutes = require('./routes/chatRoutes');
const messageRoutes = require('./routes/messageRoutes');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors'); // Import cors

// Connect to MongoDB
connectDB();

// CORS Configuration (Crucial for frontend-backend communication)
const corsOptions = {
    origin: 'http://localhost:5173', // Replace with your frontend URL
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true, // Allow cookies and authentication headers
    optionsSuccessStatus: 204,
};
app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // Handle preflight requests

app.use(express.json()); // To accept JSON data in the body

const server = http.createServer(app);
const io = new Server(server, {
    pingTimeout: 60000, // Disconnects after 60 seconds of inactivity
    cors: {
        origin: process.env.FRONTEND_URL,
        methods: ["GET", "POST"]
    }
});

app.get('/', (req, res) => {
    res.send('API is running....');
});

// console.log("FRONTEND_URL:", process.env.FRONTEND_URL);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/messages', messageRoutes);

app._router.stack.forEach(function(middleware){
  if(middleware.route){ // routes registered directly on the app
    console.log(middleware.route.path);
  } else if(middleware.name === 'router'){ // router middleware 
    middleware.handle.stack.forEach(function(handler){
      if(handler.route){
        console.log(handler.route.path);
      }
    });
  }
});

// Error Handling Middlewares
app.use(notFound);
app.use(errorHandler);



const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

// Socket.IO Integration
io.on("connection", (socket) => {
    console.log("Connected to Socket.IO");

    socket.on("setup", async (userData) => {
        socket.join(userData._id);
        socket.userId = userData._id; // store user ID on socket object

        // Mark user as online
        await User.findByIdAndUpdate(userData._id, {
            onlineStatus: "online",
        });

        socket.emit("connected");
    });

    socket.on("join chat", (chatId) => {
        socket.join(chatId);
        console.log("User joined chat: " + chatId);
    });

    socket.on("typing", (chatId) => socket.in(chatId).emit("typing"));
    socket.on("stop typing", (chatId) => socket.in(chatId).emit("stop typing"));

    socket.on("new message", (newMessageReceived) => {
        var chat = newMessageReceived.chat;
        if (!chat.users) return console.log("Chat.users not defined");

        chat.users.forEach((user) => {
            if (user._id === newMessageReceived.sender._id) return;
            socket.in(user._id).emit("message received", newMessageReceived);
        });
    });

    // Handle user disconnecting
    socket.on("disconnect", async () => {
        if (socket.userId) {
            await User.findByIdAndUpdate(socket.userId, {
                onlineStatus: "offline",
                lastSeen: new Date(),
            });
        }
        console.log("USER DISCONNECTED");
    });
});