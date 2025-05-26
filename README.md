# 💬 Flipr Chat App

A **real-time chat application** built using the **MERN stack** and **Socket.io**, offering seamless communication with a modern and responsive UI.

---

## 🚀 Project Overview

The **Flipr Chat App** enables users to connect and chat in real-time. It supports **one-on-one messaging**, **group chats**, and **persistent chat history**. Live updates are powered by **WebSockets**, ensuring instant communication.

---
## 🌐 Live Demo

You can try out the live version of the Flipr Chat App deployed on **Render**:

🔗 [https://flipr-chat-app-fe.onrender.com/](https://flipr-chat-app-fe.onrender.com/)

[![Render Deploy](https://img.shields.io/badge/Hosted%20on-Render-3e4e88?logo=render&logoColor=white)](https://flipr-chat-app-fe.onrender.com/)


---
## 🔥 Features

- 💬 Real-time **one-on-one** and **group messaging**
- ⚡ Live updates using **Socket.io**
- 🔐 **User authentication** (Sign up / Login)
- 🗃️ **Chat history** stored in **MongoDB**
- 📱 **Responsive interface** with **Tailwind CSS**

---

## 🛠️ Tech Stack

### 🔹 Frontend

- **React.js**
- **Tailwind CSS**
- **Axios** (API requests)
- **Socket.io-client**

### 🔸 Backend

- **Node.js**
- **Express.js**
- **MongoDB + Mongoose**
- **Socket.io**

---

## 🧰 Getting Started

### ✅ Prerequisites

- Node.js and npm
- MongoDB (local or cloud-based like MongoDB Atlas)

---

### 📦 Installation

1. **Clone the repository**

    ```bash
    git clone https://github.com/yourusername/flipr-chat-app.git
    cd flipr-chat-app
    ```

2. **Install dependencies**

    ```bash
    # Backend setup
    cd backend
    npm install

    # Frontend setup
    cd ../frontend
    npm install
    ```

3. **Set up environment variables**

    - Create a `.env` file in `backend/` and add:

        ```env
        MONGO_URI=your_mongodb_uri
        JWT_SECRET=your_jwt_secret
        PORT=5000
        ```

    - (Optional) Create a `.env` file in `frontend/` and add:

        ```env
        REACT_APP_API_URL=http://localhost:5000
        ```

---

## 🏃 Run the App

1. **Start the backend**

    ```bash
    cd backend
    npm run dev
    ```

2. **Start the frontend**

    ```bash
    cd frontend
    npm start
    ```

3. **Open your browser** at:

    ```text
    http://localhost:3000
    ```

---

## 💡 Future Improvements

- 😊 Emoji and image support in desktops
- ✅ Read receipts
- 📞 Video and voice calls
-  🤖💬 AI Chat Assistant


---

## 🧑‍💻 Author

**Riya Chitnis** – Developer  
[GitHub](https://github.com/ry1729)  
[LinkedIn](https://www.linkedin.com/in/riya-chitnis-756313287/)

**Pranathi Balabathuni** – Developer  
[GitHub](https://github.com/pranathibalabathuni)  
[LinkedIn](https://www.linkedin.com/in/pranathi-balabathuni-47659a305/)

---

## 📚 Sources & References

- [Socket.io Documentation](https://socket.io/docs/)
- [MERN Stack Guide](https://www.mongodb.com/mern-stack)
- [Tailwind CSS](https://tailwindcss.com/)
- [React.js](https://reactjs.org/)

---

```yaml
