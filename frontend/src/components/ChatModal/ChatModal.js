import React, { useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { urlConfig } from '../../config';
import './ChatModal.css';
// קומפוננטת מודאל צ'אט
const ChatModal = ({ chatId, itemName, sellerLevelLabel, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const socketRef = useRef(null);
  const containerRef = useRef(null);

  const authHeaders = () => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${sessionStorage.getItem('auth-token')}`,
  });
// פונקציה לטעינת הודעות הצ'אט מהשרת
  const loadMessages = useCallback(async () => {
    try {
      const response = await fetch(`${urlConfig.backendUrl}/api/chats/${chatId}/messages`, {
        headers: authHeaders(),
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || 'Unable to load chat messages');
      }
      const data = await response.json();
      setMessages(data);
      setError('');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [chatId]);

  useEffect(() => {
    setLoading(true);
    loadMessages();
  }, [loadMessages]);

  useEffect(() => {
    const interval = setInterval(loadMessages, 5000);
    return () => clearInterval(interval);
  }, [loadMessages]);

  useEffect(() => {
    const token = sessionStorage.getItem('auth-token');
    if (!token) {
      setError('You must be logged in to use the chat');
      return;
    }

    const socket = io(urlConfig.backendUrl, {
      auth: { token },
    });
    socketRef.current = socket;

    socket.on('connect_error', (err) => {
      setError(err.message || 'Unable to connect to chat');
    });

    socket.on('error', (err) => {
      setError(err.message || 'Chat error');
    });

    socket.emit('join_chat', { chatId });

    socket.on('new_message', (message) => {
      if (message.chatId === chatId) {
        setMessages((prev) => [...prev, message]);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [chatId]);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [messages]);
// פונקציה לטיפול בשליחת הודעה חדשה
  const handleSend = () => {
    if (!inputValue.trim()) return;
    const socket = socketRef.current;
    if (!socket) {
      setError('Socket not connected');
      return;
    }
    // הודעה אופטימית לפני אישור השרת
    const optimisticMessage = {
      id: `tmp-${Date.now()}`,
      chatId,
      senderId: 'me',
      content: inputValue.trim(),
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticMessage]);
    socket.emit('send_message', { chatId, content: inputValue.trim() });
    setInputValue('');
  };

  return (
    <div className="chat-modal-backdrop">
      <div className="chat-modal">
        <div className="chat-modal-header">
          <div>
            <h5>Chat · {itemName}</h5>
            {sellerLevelLabel && (
              <small className="text-muted d-block">{sellerLevelLabel}</small>
            )}
          </div>
          <button onClick={onClose} aria-label="Close chat">×</button>
        </div>
        {error && <div className="alert alert-danger mb-2">{error}</div>}
        {loading ? (
          <div className="alert alert-info">Loading messages...</div>
        ) : (
          <div className="chat-messages" ref={containerRef}>
            {messages.length === 0 && (
              <p className="text-muted text-center mt-3">No messages yet. Start the conversation!</p>
            )}
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`chat-message ${msg.senderId === sessionStorage.getItem('user-id') || msg.senderId === 'me' ? 'mine' : ''}`}
              >
                <div className="chat-bubble">
                  <p>{msg.content}</p>
                  <small>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</small>
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="chat-input">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Type a message..."
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSend();
              }
            }}
          />
          <button onClick={handleSend} disabled={!inputValue.trim()}>
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatModal;

