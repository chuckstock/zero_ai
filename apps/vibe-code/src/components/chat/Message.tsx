import { Doc } from '../../../convex/_generated/dataModel';

interface MessageProps {
  message: Doc<"messages">;
}

export default function Message({ message }: MessageProps) {
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[85%] rounded-lg p-3 ${
          isUser
            ? 'bg-blue-600 text-white'
            : isSystem
            ? 'bg-red-600/20 text-red-300 border border-red-600/30'
            : 'bg-gray-700 text-gray-100'
        }`}
      >
        <div className="text-sm whitespace-pre-wrap break-words">
          {message.content}
        </div>

        {/* Tool Calls Display */}
        {message.toolCalls && message.toolCalls.length > 0 && (
          <div className="mt-2 pt-2 border-t border-gray-600 space-y-1">
            {message.toolCalls.map((call, idx) => (
              <div key={idx} className="text-xs text-gray-400">
                <span className="font-mono">🔧 {call.name}</span>
              </div>
            ))}
          </div>
        )}

        <div className="text-xs text-gray-400 mt-1">
          {new Date(message.createdAt).toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
}
