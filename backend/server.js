require('dotenv').config();
const express = require('express');
const app = express();
const connectDB = require('./config/db');
const userRoutes = require('./routes/userRoutes');
const authRoutes = require('./routes/authRoutes');
const chatRoutes = require('./routes/chatRoutes');
const User = require('./models/User'); 
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
    origin: process.env.FRONTEND_URL, // Replace with your frontend URL
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true, // Allow cookies and authentication headers
    optionsSuccessStatus: 204,
};
app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // Handle preflight requests

app.use(express.json()); // To accept JSON data in the body

// --- ADD THIS GLOBAL LOGGER ---
app.use((req, res, next) => {
    console.log(`Incoming Request: ${req.method} ${req.originalUrl}`);
    console.log('Request Body:', req.body); // Useful for POST requests
    next(); // Pass control to the next middleware/route handler
});

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

app.use((err, req, res, next) => {
    console.error('SERVER ERROR:', err.stack); // Log the full stack trace
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    res.status(statusCode).json({
        message: err.message,
        stack: process.env.NODE_ENV === 'production' ? null : err.stack, // Show stack in dev, hide in prod
    });
});


const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

// Socket.IO Integration - Enhanced with Online Status & Better Typing

io.on("connection", (socket) => {
    console.log("Connected to Socket.IO");

    // Enhanced setup with online status
    socket.on("setup", async (userData) => {
        socket.join(userData._id);
        
        // Store user info in socket for later reference
        socket.userId = userData._id;
        socket.username = userData.username;
        
        // Update user online status
        try {
            await User.findByIdAndUpdate(userData._id, {
                onlineStatus: 'online',
                lastSeen: new Date()
            });
            
            console.log(`User ${userData.username} is now online`);
            
            // Notify all other users that this user is online
            socket.broadcast.emit('user online', {
                userId: userData._id,
                username: userData.username,
                onlineStatus: 'online'
            });
        } catch (error) {
            console.error('Error updating user online status:', error);
        }
        
        socket.emit("connected");
    });

    // Join chat room
    socket.on("join chat", (chatId) => {
        socket.join(chatId);
        console.log("User joined chat: " + chatId);
    });

    // Enhanced typing indicators with user info
    socket.on("typing", (chatId) => {
        socket.in(chatId).emit("typing", {
            userId: socket.userId,
            username: socket.username
        });
    });
    
    socket.on("stop typing", (chatId) => {
        socket.in(chatId).emit("stop typing");
    });

    // Handle new messages
    socket.on("new message", (newMessageReceived) => {
        var chat = newMessageReceived.chat;

        if (!chat.users) return console.log("Chat.users not defined");

        chat.users.forEach((user) => {
            if (user._id == newMessageReceived.sender._id) return;

            socket.in(user._id).emit("message received", newMessageReceived);
        });
    });

    // Handle message reactions
    socket.on("message reaction", (reactionData) => {
        const { chat, messageId, updatedMessage } = reactionData;

        if (!chat.users) return console.log("Chat.users not defined");

        // Broadcast reaction update to all users in the chat
        chat.users.forEach((user) => {
            socket.in(user._id).emit("reaction received", {
                messageId: messageId,
                updatedMessage: updatedMessage
            });
        });
    });
    // Enhanced disconnect handling - mark user as offline
    socket.on("disconnect", async () => {
        console.log("USER DISCONNECTED");
        
        try {
            // Use stored user info from socket
            if (socket.userId) {
                const user = await User.findByIdAndUpdate(socket.userId, {
                    onlineStatus: 'offline',
                    lastSeen: new Date()
                }, { new: true });

                if (user) {
                    console.log(`User ${user.username} is now offline`);
                    
                    // Notify all users that this user is offline
                    socket.broadcast.emit('user offline', {
                        userId: user._id,
                        username: user.username,
                        onlineStatus: 'offline',
                        lastSeen: user.lastSeen
                    });
                }
            }
        } catch (error) {
            console.error('Error updating user offline status:', error);
        }
    });
});