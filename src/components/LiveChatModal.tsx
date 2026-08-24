import React, { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { X, Send, MessageSquare } from 'lucide-react';

interface ChatMessage {
  senderId: string;
  senderName: string;
  text: string;
  createdAt: string;
}

interface LiveChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookingId: string;
  currentUserId: string;
  currentUserName: string;
  roomTitle: string;
  subTitle?: string;
}

const SOCKET_URL = 'http://localhost:5000';

export const LiveChatModal: React.FC<LiveChatModalProps> = ({
  isOpen,
  onClose,
  bookingId,
  currentUserId,
  currentUserName,
  roomTitle,
  subTitle
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [typedMessage, setTypedMessage] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  
  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (!isOpen) return;

    // Establish WebSocket Connection
    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 2000
    });
    
    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      socket.emit('join-room', { bookingId });
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('chat-history', (history: ChatMessage[]) => {
      setMessages(history);
      setTimeout(scrollToBottom, 100);
    });

    socket.on('new-message', (msg: ChatMessage) => {
      setMessages((prev) => [...prev, msg]);
      setTimeout(scrollToBottom, 100);
    });

    socket.on('connect_error', () => {
      setIsConnected(false);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [isOpen, bookingId]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!typedMessage.trim() || !socketRef.current) return;

    socketRef.current.emit('send-message', {
      bookingId,
      text: typedMessage.trim(),
      senderId: currentUserId,
      senderName: currentUserName
    });

    setTypedMessage('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border border-slate-100 shadow-premium w-full max-w-lg h-[600px] flex flex-col justify-between overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-slate-50 border-b border-slate-100 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary-deep/5 flex items-center justify-center border border-primary-deep/10 text-primary-deep">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-heading text-sm font-extrabold text-primary-deep leading-snug line-clamp-1">
                {roomTitle}
              </h3>
              <span className="text-[10px] text-slate-400 font-semibold flex items-center gap-1.5 mt-0.5">
                <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-400'}`} />
                {isConnected ? 'Online' : 'Connecting...'}
                {subTitle && ` • ${subTitle}`}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
          {messages.length > 0 ? (
            messages.map((msg, index) => {
              const isMe = msg.senderId === currentUserId;
              const sentAt = new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

              return (
                <div key={index} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} space-y-1`}>
                  {/* Sender Name */}
                  {!isMe && (
                    <span className="text-[9px] text-slate-400 font-bold px-1">{msg.senderName}</span>
                  )}
                  {/* Message Bubble */}
                  <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-xs font-semibold leading-relaxed shadow-sm ${
                    isMe 
                      ? 'bg-primary-deep text-white rounded-tr-none' 
                      : 'bg-white border border-slate-100 text-slate-700 rounded-tl-none'
                  }`}>
                    {msg.text}
                  </div>
                  {/* Timestamp */}
                  <span className="text-[8px] text-slate-400 font-medium px-1">{sentAt}</span>
                </div>
              );
            })
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-2 text-slate-400">
              <MessageSquare className="w-8 h-8 text-slate-300" />
              <h4 className="font-heading text-xs font-bold text-slate-500">No Messages Yet</h4>
              <p className="text-[10px] font-semibold max-w-[240px] leading-normal">
                Start a live conversation with the host. Ask about food, itinerary details, or check-in timings.
              </p>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Footer Input Form */}
        <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-100 bg-white flex items-center gap-3">
          <input
            type="text"
            value={typedMessage}
            onChange={(e) => setTypedMessage(e.target.value)}
            disabled={!isConnected}
            placeholder={isConnected ? "Type your message here..." : "Connecting to chat room..."}
            className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-xs font-semibold text-slate-800 focus:outline-none focus:border-slate-300 disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={!typedMessage.trim() || !isConnected}
            className="w-10 h-10 rounded-2xl bg-primary-deep hover:bg-primary-light text-white flex items-center justify-center shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <Send className="w-4.5 h-4.5" />
          </button>
        </form>

      </div>
    </div>
  );
};
