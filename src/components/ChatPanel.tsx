import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader } from 'lucide-react';
import ChatMessage from './ChatMessage';
import { ChatMessage as ChatMessageType } from '../types';
import { supabase } from '../services/supabase';

interface ChatPanelProps {
  onSubmit: (message: string) => void;
  isLoading: boolean;
  travelPlan: any;
  onRequestAuth: () => void;
}

const ChatPanel: React.FC<ChatPanelProps> = ({ onSubmit, isLoading, travelPlan, onRequestAuth }) => {
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatMessageType[]>([
    {
      id: '1',
      content: "Hi! I'm your AI fashion stylist. I can help you with outfits for travel or special events. Just let me know what you need!",
      type: 'assistant',
      timestamp: new Date()
    }
  ]);

  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setIsAuthenticated(!!user);
    };
    
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session?.user);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const fetchChatHistory = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: messages, error } = await supabase
        .from('chat_messages')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching chat history:', error);
        return;
      }

      if (messages) {
        setChatHistory(messages.map(msg => ({
          id: msg.id,
          content: msg.content,
          type: msg.type as 'user' | 'assistant',
          timestamp: new Date(msg.created_at)
        })));
      }
    };

    if (isAuthenticated) {
      fetchChatHistory();

      const subscription = supabase
        .channel('chat_messages')
        .on('postgres_changes', { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'chat_messages' 
        }, payload => {
          const newMessage = payload.new;
          setChatHistory(prev => [...prev, {
            id: newMessage.id,
            content: newMessage.content,
            type: newMessage.type as 'user' | 'assistant',
            timestamp: new Date(newMessage.created_at)
          }]);
        })
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (travelPlan) {
      let newMessage = '';

      if (travelPlan.status === 'success') {
        if (travelPlan.type === 'travel') {
          newMessage = `Here are your outfit suggestions for ${travelPlan.destination} on ${new Date(travelPlan.date).toLocaleDateString()}. I've checked the weather and found some great options for you!`;
        } else if (travelPlan.type === 'event') {
          newMessage = `Here are your outfit suggestions for the ${travelPlan.event}. I've curated some perfect looks for the occasion!`;
        }
      } else if (travelPlan.status === 'warning') {
        newMessage = `I found outfit suggestions for ${travelPlan.destination}, but please note: ${travelPlan.warning}`;
      } else if (travelPlan.status === 'error') {
        newMessage = `Sorry, I encountered an error: ${travelPlan.error}. Please try again with a different request.`;
      }

      if (newMessage && isAuthenticated) {
        const saveMessage = async () => {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return;

          const { error } = await supabase
            .from('chat_messages')
            .insert({
              user_id: user.id,
              content: newMessage,
              type: 'assistant'
            });

          if (error) {
            console.error('Error saving message:', error);
          }
        };

        saveMessage();
      }
    }
  }, [travelPlan, isAuthenticated]);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || isLoading) return;

    if (!isAuthenticated) {
      onRequestAuth();
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      onRequestAuth();
      return;
    }

    const { error } = await supabase
      .from('chat_messages')
      .insert({
        user_id: user.id,
        content: message,
        type: 'user'
      });

    if (error) {
      console.error('Error saving message:', error);
      return;
    }

    onSubmit(message);
    setMessage('');
  };

  return (
    <div className="w-full max-w-lg mx-auto flex flex-col h-full max-h-[90vh] bg-white rounded-xl border border-gray-100 overflow-hidden shadow-md">
      <div className="p-4 border-b border-gray-100 bg-gray-50">
        <h2 className="text-lg font-light text-black">How can I help you today?</h2>
        <p className="text-gray-600 text-sm font-light">
          Ask about outfits or event wear
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3" ref={chatContainerRef}>
        <div className="space-y-4">
          {chatHistory.map((msg) => (
            <ChatMessage
              key={msg.id}
              content={msg.content}
              type={msg.type}
              timestamp={msg.timestamp}
            />
          ))}
        </div>
      </div>

      <div className="p-4 border-t border-gray-100 bg-gray-50">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Ask about travel or event outfits..."
            className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-purple-500 bg-white text-sm font-light"
            disabled={isLoading}
          />
          <button
            type="submit"
            className={`p-3 rounded-xl ${
              isLoading || !message.trim()
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700'
            } transition-colors duration-200`}
            disabled={isLoading || !message.trim()}
          >
            {isLoading ? (
              <Loader className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatPanel;