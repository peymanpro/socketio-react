import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import './App.css';

function App() {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [username, setUsername] = useState('');
  const [hasJoined, setHasJoined] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  
  useEffect(() => {
    const newSocket = io('http://localhost:5000');
    setSocket(newSocket);

    newSocket.on('connect', () => {
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
    });

    return () => {
      newSocket.close();
    };
  }, []);

  useEffect(() => {
    if (!socket) return;

    socket.on('welcome', (data) => {
      setMessages(prev => [...prev, {
        type: 'system',
        text: data.message,
        time: new Date().toLocaleTimeString('fa-IR')
      }]);
      setOnlineUsers(data.users);
    });

    socket.on('new-message', (data) => {
      setMessages(prev => [...prev, {
        type: 'message',
        username: data.username,
        text: data.message,
        time: data.time,
        id: data.id
      }]);
    });

    socket.on('user-joined', (data) => {
      setMessages(prev => [...prev, {
        type: 'system',
        text: data.message,
        time: data.time
      }]);
    });


    socket.on('user-left', (data) => {
      setMessages(prev => [...prev, {
        type: 'system',
        text: data.message,
        time: data.time
      }]);
    });


    socket.on('online-users', (users) => {
      setOnlineUsers(users);
    });


    socket.on('user-typing', (data) => {
      if (data.isTyping) {
        setTypingUsers(prev => {
          if (!prev.includes(data.username)) {
            return [...prev, data.username];
          }
          return prev;
        });
      } else {
        setTypingUsers(prev => prev.filter(name => name !== data.username));
      }
    });


    return () => {
      socket.off('welcome');
      socket.off('new-message');
      socket.off('user-joined');
      socket.off('user-left');
      socket.off('online-users');
      socket.off('user-typing');
    };
  }, [socket]);

 
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  
  const handleJoin = (e) => {
    e.preventDefault();
    if (username.trim() && socket) {
      socket.emit('user-join', username.trim());
      setHasJoined(true);
    }
  };


  const sendMessage = (e) => {
    e.preventDefault();
    if (inputMessage.trim() && socket) {
      socket.emit('send-message', { message: inputMessage.trim() });
      setInputMessage('');
      
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      socket.emit('typing-stop');
    }
  };

  const handleTyping = () => {
    if (!socket) return;
    
    socket.emit('typing-start');
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('typing-stop');
    }, 1000);
  };

  if (!hasJoined) {
    return (
      <div className="login-container">
        <div className="login-box">
          <h1>public chatroom</h1>
          <form onSubmit={handleJoin}>
            <input
              type="text"
              placeholder="please enter your name"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              maxLength={20}
              required
            />
            <button type="submit" disabled={!isConnected}>
              {isConnected ? 'Join Chat' : 'Connecting...'}
            </button>
          </form>
          {!isConnected && (
            <p className="error">Connecting to server...</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="chat-container">
      <aside className="sidebar">
        <div className="sidebar-header">
          <h3>online({onlineUsers.length})</h3>
        </div>
        <div className="online-users">
          {onlineUsers.map((user, index) => (
            <div key={index} className="user-item">
              <span className="online-dot"></span>
              {user}
          {user === username && <span className="you-badge"> (You)</span>}
            </div>
          ))}
        </div>
      </aside>

      <main className="chat-main">
        <div className="chat-header">
         <h2>Public Chat</h2>
          <div className="connection-status">
            {isConnected ? 'Online' : 'Offline'}
          </div>
        </div>

        <div className="messages-area">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`message ${msg.type === 'system' ? 'system-message' : 'user-message'} ${
                msg.id === socket?.id ? 'my-message' : ''
              }`}
            >
              {msg.type === 'message' ? (
                <>
                  <div className="message-header">
                    <strong className="username">{msg.username}</strong>
                    <span className="time">{msg.time}</span>
                  </div>
                  <div className="message-text">{msg.text}</div>
                </>
              ) : (
                <div className="system-text">
                  <em>{msg.text}</em>
                  <span className="time">{msg.time}</span>
                </div>
              )}
            </div>
          ))}
          
          {typingUsers.length > 0 && (
            <div className="typing-indicator">
             {typingUsers.join(', ')} is typing...
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        <form className="input-area" onSubmit={sendMessage}>
          <input
            type="text"
            placeholder="پیام خود را بنویسید..."
            value={inputMessage}
            onChange={(e) => {
              setInputMessage(e.target.value);
              handleTyping();
            }}
            maxLength={500}
          />
          <button type="submit">Send</button>
        </form>
      </main>
    </div>
  );
}

export default App;