'use client'

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { useRouter } from 'next/navigation'; // Import useRouter for navigation
import { ArrowLeft } from 'lucide-react'; // Import an icon for the back arrow
import ReactMarkdown from 'react-markdown';

const initialMessages = [
  { id: 1, sender: 'ai', content: 'Hello! How can I assist you today?' },
];

export default function AIChat() {
  const router = useRouter(); // Use router for navigation
  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState('');
  const [displayedText, setDisplayedText] = useState('');
  const [isTypingComplete, setIsTypingComplete] = useState(false);
  const [isLoading, setIsLoading] = useState(false);  // Track if AI is responding
  const fullText = "Get the Best AI Suggestions";
  const [isTyping, setIsTyping] = useState(false);

  // Typing effect logic
  useEffect(() => {
    let index = 0;
    const timer = setInterval(() => {
      setDisplayedText(fullText.substring(0, index));
      index++;
      if (index > fullText.length) {
        clearInterval(timer);  // Clear interval once text is fully typed
        setIsTypingComplete(true);  // Set typing complete to true
      }
    }, 100); // Adjust typing speed here

    return () => clearInterval(timer);  // Cleanup on unmount
  }, []);

  // Handle sending the message
  const handleSendMessage = async () => {
    if (input.trim()) {
      const userMessage = input;
      setInput(''); // Clear input field

      // Add user's message to the chat
      setMessages(prevMessages => [
        ...prevMessages,
        { id: prevMessages.length + 1, sender: 'user', content: userMessage }
      ]);

      // Show the loading "..." animation
      if (!isLoading) {
        setIsLoading(true);
        setMessages(prevMessages => [
          ...prevMessages,
          { id: prevMessages.length + 1, sender: 'ai', content: '...' }
        ]);
      }

      try {
        // Send the message to your backend (Flask), which will forward it to Gemini
        const response = await fetch('http://localhost:5000/auth/send_to_gemini', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({ query: userMessage }),
        });

        const data = await response.json();

        if (response.ok) {
          // Remove the loading animation and add the AI's response to the chat
          setIsLoading(false);
          setMessages(prevMessages => [
            ...prevMessages.slice(0, -1),  // Remove the '...' message
            { id: prevMessages.length, sender: 'ai', content: data.response }
          ]);
        } else {
          console.error('Error from Gemini API:', data);
          setIsLoading(false);
          setMessages(prevMessages => [
            ...prevMessages.slice(0, -1),  // Remove the '...' message
            { id: prevMessages.length, sender: 'ai', content: 'Sorry, I could not process that.' }
          ]);
        }
      } catch (error) {
        console.error('Error contacting the backend:', error);
        setIsLoading(false);
        setMessages(prevMessages => [
          ...prevMessages.slice(0, -1),  // Remove the '...' message
          { id: prevMessages.length, sender: 'ai', content: 'There was an issue reaching the API.' }
        ]);
      }
    }
  };

  // Handle keypress for Enter key
  const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      handleSendMessage();  // Trigger send message when Enter is pressed
    }
  };

  const handleResetConversation = async () => {
    try {
      await fetch('http://localhost:5000/auth/reset_conversation', {
        method: 'POST',
        credentials: 'include',
      });
      // Reset the local chat messages after resetting the conversation on the backend
      setMessages([{ id: 1, sender: 'ai', content: 'Hello! How can I assist you today?' }]);
    } catch (error) {
      console.error('Error resetting conversation:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 p-6 flex flex-col">
      {/* Back button to go to the main page */}
      <button
        onClick={() => router.push('/main')}  // Navigate back to the main page (adjust the route as needed)
        className="text-white mb-4 flex items-center"
      >
        <ArrowLeft className="mr-2" /> {/* Back Arrow Icon */}
        Back to Transactions
      </button>
      <Button onClick={handleResetConversation} className="bg-red-500 text-white max-w-xs float-right">
        Start Over
      </Button >
      {/* Header with typing effect */}
      <header className="text-white text-center mb-4">
        <h1 className="text-4xl font-bold">
          {displayedText}
          {!isTypingComplete && <span className="animate-blink">|</span>} {/* Show cursor only while typing */}
        </h1>
      </header>

      {/* Chat container */}
      <div className="flex-grow overflow-y-auto p-4 bg-gray-300/90 backdrop-blur-sm rounded-lg shadow-xl w-full">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`p-3 mb-3 rounded-lg ${
              message.sender === 'user'
                ? 'bg-gray-100 text-blue-500 self-end ml-auto max-w-[50%]'  // User message on the right, max-width 50%
                : 'bg-gradient-to-r from-purple-400 to-blue-600 text-white self-start max-w-[50%]'  // AI message on the left, max-width 50%
            }`}
          >
            {/* If the message is from AI, render it using ReactMarkdown to handle markdown */}
            {message.sender === 'ai' ? (
              <ReactMarkdown>{message.content}</ReactMarkdown>
            ) : (
              <span>{message.content}</span>
            )}
          </div>
        ))}

        {/* Show loading dots if AI is responding */}
        {isLoading && (
          <div className="p-3 mb-3 rounded-lg bg-gradient-to-r from-purple-400 to-blue-600 text-white self-start max-w-[50%]">
            <div className="animate-pulse">...</div>
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="mt-4 flex items-center space-x-4 w-full">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}  // Listen for Enter key press
          placeholder="Type your message..."
          className="flex-grow p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:outline-none w-full text-blue-500"
        />
        <Button onClick={handleSendMessage} className="bg-purple-600 hover:bg-green-700 text-white p-3 rounded-lg">
          Send
        </Button>
      </div>
    </div>
  );
}
