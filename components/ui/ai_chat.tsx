
"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation"; 
import { ArrowLeft } from "lucide-react"; 
import ReactMarkdown from "react-markdown";

const initialMessages = [
  { id: 1, sender: "ai", content: "Hello! How can I assist you today?" },
];

export default function AIChat() {
  const router = useRouter(); 
  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState("");
  const [displayedText, setDisplayedText] = useState("");
  const [isTypingComplete, setIsTypingComplete] = useState(false);
  const [isLoading, setIsLoading] = useState(false); 
  const fullText = "Get the Best AI Suggestions";
  // const [isTyping, setIsTyping] = useState(false);
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
  // Typing effect logic
  useEffect(() => {
    let index = 0;
    const timer = setInterval(() => {
      setDisplayedText(fullText.substring(0, index));
      index++;
      if (index > fullText.length) {
        clearInterval(timer); 
        setIsTypingComplete(true); 
      }
    }, 100); 

    return () => clearInterval(timer); 
  }, []);

  
  const handleSendMessage = async () => {
    if (input.trim()) {
      const userMessage = input;
      setInput(""); 

      
      setMessages((prevMessages) => [
        ...prevMessages,
        { id: prevMessages.length + 1, sender: "user", content: userMessage },
      ]);

      
      if (!isLoading) {
        setIsLoading(true);
        setMessages((prevMessages) => [
          ...prevMessages,
          { id: prevMessages.length + 1, sender: "ai", content: "..." },
        ]);
      }

      try {
        
        const response = await fetch(
          `${backendUrl}/auth/send_to_gemini`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            credentials: "include",
            body: JSON.stringify({ query: userMessage }),
          },
        );

        const data = await response.json();

        if (response.ok) {
          
          setIsLoading(false);
          setMessages((prevMessages) => [
            ...prevMessages.slice(0, -1), 
            { id: prevMessages.length, sender: "ai", content: data.response },
          ]);
        } else {
          console.error("Error from Gemini API:", data);
          setIsLoading(false);
          setMessages((prevMessages) => [
            ...prevMessages.slice(0, -1), 
            {
              id: prevMessages.length,
              sender: "ai",
              content: "Sorry, I could not process that.",
            },
          ]);
        }
      } catch (error) {
        console.error("Error contacting the backend:", error);
        setIsLoading(false);
        setMessages((prevMessages) => [
          ...prevMessages.slice(0, -1), 
          {
            id: prevMessages.length,
            sender: "ai",
            content: "There was an issue reaching the API.",
          },
        ]);
      }
    }
  };

  
  const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      handleSendMessage(); 
    }
  };

  const handleResetConversation = async () => {
    try {
      await fetch(`${backendUrl}/auth/reset_conversation`, {
        method: "POST",
        credentials: "include",
      });
      
      setMessages([
        { id: 1, sender: "ai", content: "Hello! How can I assist you today?" },
      ]);
    } catch (error) {
      console.error("Error resetting conversation:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 p-6 flex flex-col">
      {/* Back button to go to the main page */}
      <button
        onClick={() => router.push("")} 
        className="text-white mb-4 flex items-center"
      >
        <ArrowLeft className="mr-2" /> {/* Back Arrow Icon */}
        Back to Transactions
      </button>
      <Button
        onClick={handleResetConversation}
        className="bg-red-500 text-white max-w-xs float-right"
      >
        Start Over
      </Button>
      {/* Header with typing effect */}
      <header className="text-white text-center mb-4">
        <h1 className="text-4xl font-bold">
          {displayedText}
          {!isTypingComplete && <span className="animate-blink">|</span>}{" "}
          {/* Show cursor only while typing */}
        </h1>
      </header>

      {/* Chat container */}
      <div className="flex-grow overflow-y-auto p-4 bg-gray-300/90 backdrop-blur-sm rounded-lg shadow-xl w-full">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`p-3 mb-3 rounded-lg ${
              message.sender === "user"
                ? "bg-gray-100 text-blue-500 self-end ml-auto max-w-[50%]" 
                : "bg-gradient-to-r from-purple-400 to-blue-600 text-white self-start max-w-[50%]" 
            }`}
          >
            {/* If the message is from AI, render it using ReactMarkdown to handle markdown */}
            {message.sender === "ai" ? (
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
          onKeyPress={handleKeyPress} 
          placeholder="Type your message..."
          className="flex-grow p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:outline-none w-full text-blue-500"
        />
        <Button
          onClick={handleSendMessage}
          className="bg-purple-600 hover:bg-green-700 text-white p-3 rounded-lg"
        >
          Send
        </Button>
      </div>
    </div>
  );
}
