require('dotenv').config(); // Load environment variables from .env file
const express = require('express');
const app = express();
const connectDB = require('./config/db'); // Database connection utility
const userRoutes = require('./routes/userRoutes');
const authRoutes = require('./routes/authRoutes');
const chatRoutes = require('./routes/chatRoutes');
const messageRoutes = require('./routes/messageRoutes');
const { notFound, errorHandler } = require('./middleware/errorMiddleware'); // Custom error handling middleware
const path = require('path'); // Core Node.js module for path manipulation (currently unused, but kept)
const http = require('http'); // Node.js HTTP module
const { Server } = require('socket.io'); // Socket.IO server
const cors = require('cors'); // CORS middleware

// Connect to MongoDB
connectDB();

// --- Express Middleware Setup ---

// CORS Configuration (Crucial for frontend-backend communication)
// It's good practice to allow your specific frontend URL
const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000'; // Fallback for development
const corsOptions = {
    origin: frontendUrl, // Replace with your actual frontend URL (from .env)
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true, // Allow cookies and authentication headers to be sent
    optionsSuccessStatus: 204, // For successful preflight requests
};
app.use(cors(corsOptions)); // Apply CORS to all incoming HTTP requests
app.options('*', cors(corsOptions)); // Handle preflight requests for all routes

app.use(express.json()); // Middleware to parse JSON data from request body

// --- Global Request Logger (useful for debugging) ---
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] Incoming Request: ${req.method} ${req.originalUrl}`);
    // Only log body for non-GET requests to avoid clutter
    if (req.method !== 'GET') {
        console.log('Request Body:', req.body);
    }
    next(); // Pass control to the next middleware or route handler
});

// --- HTTP Server and Socket.IO Setup ---
const server = http.createServer(app); // Create an HTTP server using the Express app

// Socket.IO server configuration
const io = new Server(server, {
    pingTimeout: 60000, // Disconnects after 60 seconds of inactivity
    cors: {
        origin: frontendUrl, // Allow Socket.IO connections from your frontend URL
        methods: ["GET", "POST"] // Allowed methods for Socket.IO handshake
    }
});

// --- Basic Route for API Status ---
app.get('/', (req, res) => {
    res.send('API is running....');
});

// console.log for debugging FRONTEND_URL (can be removed in production)
console.log("FRONTEND_URL configured for CORS:", frontendUrl);


// --- API Routes ---
app.use('/api/auth', authRoutes); // Authentication routes (e.g., login, register)
app.use('/api/users', userRoutes); // User-related routes (e.g., search users)
app.use('/api/chats', chatRoutes); // Chat-related routes (e.g., create chat, fetch chats)
app.use('/api/messages', messageRoutes); // Message-related routes (e.g., send message, fetch messages)

// --- Route Logging (for debugging, can be removed in production) ---
// This part iterates over Express router stack to log all registered routes.
// Useful to confirm if all routes are loaded correctly.
// app._router.stack.forEach(function(middleware){
//     if(middleware.route){ // Routes registered directly on the app (e.g., app.get('/', ...))
//         console.log('App Route:', middleware.route.path);
//     } else if(middleware.name === 'router'){ // Router middleware (e.g., app.use('/api/users', userRoutes))
//         middleware.handle.stack.forEach(function(handler){
//             if(handler.route){
//                 console.log('Router Route:', middleware.regexp, handler.route.path);
//             }
//         });
//     }
// });


// --- Error Handling Middlewares ---
// These should be placed AFTER all your routes
app.use(notFound); // Handles 404 Not Found errors for unmatched routes
app.use(errorHandler); // General error handler for other server errors

// --- Server Listener ---
const PORT = process.env.PORT || 5000; // Use PORT from .env or default to 5000

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});


// --- Socket.IO Integration ---
io.on("connection", (socket) => {
    console.log("A user connected via Socket.IO:", socket.id);

    // Setup: User joins their own room for notifications
    socket.on("setup", (userData) => {
        if (!userData || !userData._id) {
            console.error("Setup received without valid userData._id");
            return;
        }
        socket.join(userData._id); // Each user has a dedicated room based on their ID
        console.log(`User ${userData._id} joined personal socket room.`);
        socket.emit("connected"); // Confirm connection to the client
    });

    // Join Chat: User joins a specific chat room
    socket.on("join chat", (chatId) => {
        if (!chatId) {
            console.error("Join chat received without valid chatId");
            return;
        }
        socket.join(chatId);
        console.log(`Socket ${socket.id} joined chat room: ${chatId}`);
    });

    // Typing Indicator
    socket.on("typing", (chatId) => {
        if (!chatId) return;
        socket.in(chatId).emit("typing"); // Emits to all sockets in the chat room EXCEPT the sender
    });
    socket.on("stop typing", (chatId) => {
        if (!chatId) return;
        socket.in(chatId).emit("stop typing"); // Emits to all sockets in the chat room EXCEPT the sender
    });

    // New Message Handling
    socket.on("new message", (newMessageReceived) => {
        const chat = newMessageReceived.chat;

        if (!chat || !chat.users || chat.users.length === 0) {
            console.error("New message received for a chat without users:", newMessageReceived);
            return;
        }

        // Emit message to all users in the chat, except the sender
        chat.users.forEach((user) => {
            if (user._id === newMessageReceived.sender._id) {
                // Don't send the message back to the sender via this broadcast,
                // as the sender's UI usually updates immediately upon sending.
                return;
            }
            // `socket.in(user._id)` targets the specific user's personal room
            socket.in(user._id).emit("message received", newMessageReceived);
            console.log(`Message sent to user ${user._id} in chat ${chat._id}`);
        });
    });

    // Disconnect Handler
    // This is the correct way to handle disconnects in Socket.IO
    socket.on("disconnect", () => {
        console.log("A user disconnected from Socket.IO:", socket.id);
        // Clean up any specific rooms if necessary (e.g., remove user from active chats)
        // For 'setup' room, it's fine; socket.leave() is not needed here as the socket itself is gone.
    });

    // Removed the problematic socket.off("setup", ...) from your original code.
    // The "disconnect" event is the proper place to handle a user leaving.
});