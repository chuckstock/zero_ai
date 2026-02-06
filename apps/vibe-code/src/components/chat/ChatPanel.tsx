import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';
import Message from './Message';
import ChatInput from './ChatInput';

interface ChatPanelProps {
  gameId: Id<"games">;
}

export default function ChatPanel({ gameId }: ChatPanelProps) {
  const messages = useQuery(api.messages.list, { gameId });
  const sendMessage = useMutation(api.messages.send);
  const [inputValue, setInputValue] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!inputValue.trim() || isSending) return;

    setIsSending(true);
    try {
      await sendMessage({ gameId, content: inputValue });
      setInputValue('');
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <h2 className="text-lg font-semibold text-white">AI Chat</h2>
        <p className="text-sm text-gray-400 mt-1">
          Describe what you want to build
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages?.length === 0 ? (
          <div className="text-center text-gray-500 mt-8">
            <p className="text-lg mb-2">👋 Welcome!</p>
            <p className="text-sm">Start by describing the game you want to create.</p>
            <div className="mt-4 space-y-2 text-xs text-left bg-gray-700/50 p-3 rounded">
              <p className="text-gray-300 font-medium">Try saying:</p>
              <p className="text-gray-400">• "Create a space shooter game"</p>
              <p className="text-gray-400">• "Add a futuristic background"</p>
              <p className="text-gray-400">• "Make the player move with arrow keys"</p>
            </div>
          </div>
        ) : (
          messages?.map((message) => (
            <Message key={message._id} message={message} />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <ChatInput
        value={inputValue}
        onChange={setInputValue}
        onSend={handleSend}
        disabled={isSending}
      />
    </div>
  );
}
