// src/app/chat/[threadId]/page.jsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import io from 'socket.io-client';
import api from '../../../lib/api';

let socket;

export default function ChatPage() {
  const { threadId } = useParams();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const messagesEndRef = useRef(null); // Ref to help us scroll to the bottom

  // Function to scroll to the latest message
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Scroll to bottom whenever messages array is updated
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    socket = io('http://localhost:5000');

    const fetchData = async () => {
      try {
        const userRes = await api.get('/profiles/me');
        setCurrentUser(userRes.data);
        if (threadId) {
          const messagesRes = await api.get(`/chats/${threadId}/messages`);
          setMessages(messagesRes.data);
        }
      } catch (error) { console.error("Error fetching data", error); }
    };
    fetchData();

    if (threadId) socket.emit('joinRoom', threadId);

    const handleNewMessage = (message) => setMessages((prev) => [...prev, message]);
    socket.on('newMessage', handleNewMessage);

    return () => {
      if (socket) {
        socket.off('newMessage', handleNewMessage);
        socket.disconnect();
      }
    };
  }, [threadId]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (newMessage.trim() === '' || !currentUser || !threadId) return;

    // This is the message object we'll add to our UI immediately
    const optimisticMessage = {
      id: Date.now(), // Use a temporary key for React
      thread_id: parseInt(threadId),
      sender_id: currentUser.id,
      content: newMessage,
      message_type: 'text',
      sent_at: new Date().toISOString()
    };
    
    // ==> THE FIX: Optimistically update the UI before sending to server
    setMessages(prevMessages => [...prevMessages, optimisticMessage]);

    // Now, send the actual message to the server
    socket.emit('sendMessage', {
      threadId,
      senderId: currentUser.id,
      content: newMessage,
      messageType: 'text',
    });
    setNewMessage(''); // Clear the input box
  };

  return (
    <div className="flex flex-col h-screen max-w-2xl mx-auto">
      <div className="flex-1 p-4 overflow-y-auto">
        {messages.map((msg) => (
          <div key={msg.id} className={`mb-4 flex ${msg.sender_id === currentUser?.id ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-xs lg:max-w-md p-3 rounded-lg ${msg.sender_id === currentUser?.id ? 'bg-indigo-500 text-white' : 'bg-gray-200 text-black'}`}>
              <p>{msg.content}</p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleSendMessage} className="p-4 bg-white border-t">
        <div className="flex">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            className="flex-1 p-2 border rounded-l-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Type your message..."
          />
          <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-r-lg hover:bg-indigo-700">Send</button>
        </div>
      </form>
    </div>
  );
}
