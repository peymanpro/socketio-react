# React + Socket.IO Chat Client

A React 19 frontend for a public real-time chatroom, built with Socket.IO Client. The project focuses on a clear connection state, live presence and typing updates, defensive rendering, and reconnect behavior.

## Features

- Live messages, participant presence, join/leave notices, and typing indicators.
- Reconnection handling that re-announces the participant after Socket.IO assigns a new connection.
- Display-name and message validation at the UI boundary, complementing server-side validation.
- Unique message IDs separated from the sender's socket ID.
- Connection errors and server validation errors are shown to the user.
- Socket event listeners and typing timers are cleaned up.
- Persian-localized system-message time display; backend timestamps are preserved for chat messages.

## Requirements

- Node.js 18 or later
- npm
- A Socket.IO backend implementing the event contract below (for example, the companion Express or NestJS backend)

## Run locally

```bash
npm ci
npm start
```

The client opens at `http://localhost:3000` and connects to `http://localhost:5000` by default.

### Configuration

Create `.env.local` or `.env` in the project root:

```bash
REACT_APP_SOCKET_SERVER_URL=http://localhost:5000
```

Restart the development server after changing the variable. The client must use the same origin allowed by the backend CORS configuration.

## Socket.IO event contract

| Direction | Event | Payload |
| --- | --- | --- |
| Client → server | `user-join` | `string username` |
| Client → server | `send-message` | `{ message: string }` |
| Client → server | `typing-start` | no payload |
| Client → server | `typing-stop` | no payload |
| Server → client | `welcome` | `{ message, users: string[] }` |
| Server → client | `user-joined` | `{ username, message, time }` |
| Server → client | `user-left` | `{ username, message, time }` |
| Server → client | `new-message` | `{ username, message, time, id, senderId }` |
| Server → client | `online-users` | `string[]` |
| Server → client | `user-typing` | `{ username, isTyping }` |
| Server → client | `chat-error` | `{ code, message }` |

Names are trimmed and limited to 32 characters. Messages are trimmed and limited to 2,000 characters. Multiline message text is allowed; invalid control characters and blank messages are rejected. The server remains authoritative and must validate every event independently.

## Checks

```bash
npm test -- --watchAll=false
npm run build
```

The test suite covers the client-side protocol validation boundary. The production build runs the Create React App compilation and its configured ESLint checks. GitHub Actions runs tests and the production build on pushes and pull requests.

## Limitations

This repository is only the browser client. It does not provide a backend, authentication, authorization, message history, persistence, or rate limiting. Do not treat client-side validation as a security boundary.
