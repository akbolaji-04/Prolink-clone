// src/app/jobs/[id]/chat/page.jsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import io from 'socket.io-client';

const socket = io('http://localhost:5000'); // Connect to your backend

export default function ChatPage() {
  const { id: jobId } = useParams();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [currentUser, setCurrentUser] = useState(null); // We need to know who is sending

  // Fetch current user's info when component mounts
  useEffect(() => {
    // TODO: Use your api.get('/profiles/me') to fetch the user's ID
    // For now, let's pretend we have it. Replace '1' with the actual logged-in user ID.
    setCurrentUser({ id: 1 });
  }, []);

  useEffect(() => {
    // Join the chat room for this specific job
    if (jobId) {
      socket.emit('joinRoom', jobId);
    }

    // Listen for new messages from the server
    const handleNewMessage = (message) => {
      setMessages((prevMessages) => [...prevMessages, message]);
    };
    socket.on('newMessage', handleNewMessage);

    // Clean up the listener when the component unmounts
    return () => {
      socket.off('newMessage', handleNewMessage);
    };
  }, [jobId]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (newMessage.trim() === '') return;

    const messageData = {
      jobId,
      senderId: currentUser.id,
      content: newMessage,
      messageType: 'text', // For now, we only handle text
    };

    socket.emit('sendMessage', messageData);
    setNewMessage('');
  };
  
  // How image sending would work:
  // 1. User clicks an 'upload' button.
  // 2. File is sent to Cloudinary/S3, which returns a URL.
  // 3. You call socket.emit with messageType: 'image' and content: 'the_image_url'.

  return (
    <div className="flex flex-col h-screen max-w-2xl mx-auto">
      <div className="flex-1 p-4 overflow-y-auto">
        {messages.map((msg, index) => (
          <div key={index} className={`mb-4 ${msg.senderId === currentUser?.id ? 'text-right' : 'text-left'}`}>
            <div className={`inline-block p-2 rounded-lg ${msg.senderId === currentUser?.id ? 'bg-indigo-500 text-white' : 'bg-gray-200 text-black'}`}>
              {/* Conditional rendering for different message types */}
              {msg.messageType === 'image' ? (
                <img src={msg.content} alt="shared content" className="max-w-xs rounded" />
              ) : (
                <p>{msg.content}</p>
              )}
            </div>
          </div>
        ))}
      </div>
      <form onSubmit={handleSendMessage} className="p-4 bg-white border-t">
        <div className="flex">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            className="flex-1 p-2 border rounded-l-lg"
            placeholder="Type your message..."
          />
          <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-r-lg">Send</button>
        </div>
      </form>
    </div>
  );
}