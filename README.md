Secure Group Chat is a real-time messaging application designed for secure communication among multiple users. The project implements robust authentication, group management, and encrypted messaging using modern web technologies and industry-standard security practices.

## Project Summary

Secure Group Chat offers a platform that enables users to register, log in, create or join chat groups, and exchange messages securely. The backend APIs handle user authentication, group management, and message processing, while real-time communication is supported via WebSockets. This project aims to provide an intuitive, responsive, and secure environment for group messaging.

## Getting Started

First, run the socket server:

```aiignore
cd socket-server && npm run dev
```
Open [http://localhost:4000](http://localhost:3000) with your browser to see is socket server is running.

Second, open new terminal on root level and run:

```bash
1. npm install

2. npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Features
1. User Login
2. User Registration
3. Group Creation
4. Group Joining
5. Group Messaging
6. Real-time Communication
7. Message Encryption
8. User Authentication
9. Smart replies

## Technologies Used
- Node.js
- Express.js
- Socket.IO
- MongoDB
- Next.js
- AWS S3

## Roadmap
The project is currently in the development phase. Future enhancements may include:
- PWA support
- Image smart replies
- Playwright testing
- Docker support
- CI/CD integration

## Demo

General steps

[general.mov](demo/general.mov)

Chat

[chat.mov](demo/chat.mov)