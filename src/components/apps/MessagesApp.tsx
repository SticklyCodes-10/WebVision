import React, { useState } from 'react';
import { Send, Smile, Sparkles } from 'lucide-react';
import { INITIAL_CONVERSATIONS } from '../../data/initialData';
import { Conversation } from '../../types/vision';

const QUICK_REACTIONS = ['❤️', '👍', '✨', '🔥'];

export const MessagesApp: React.FC = () => {
  const [conversations, setConversations] = useState<Conversation[]>(INITIAL_CONVERSATIONS);
  const [activeId, setActiveId] = useState<string>(INITIAL_CONVERSATIONS[0].id);
  const [draft, setDraft] = useState<string>('');

  const activeConv = conversations.find((c) => c.id === activeId) || conversations[0];

  const handleSelectConversation = (id: string) => {
    setActiveId(id);
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, unread: 0 } : c))
    );
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text || !activeConv) return;

    const userMsgId = `msg-${Date.now()}`;
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    setConversations((prev) =>
      prev.map((c) =>
        c.id === activeConv.id
          ? {
              ...c,
              messages: [
                ...c.messages,
                { id: userMsgId, sender: 'me', text, timestamp: timeStr },
              ],
            }
          : c
      )
    );
    setDraft('');

    // Contextual simulated spatial persona reply
    setTimeout(() => {
      const replyOptions = [
        'That looks incredible in spatial glass! Try adjusting the Digital Crown immersion slider too.',
        'Awesome! Pinch the bottom grabber bar below any window to move it across your room.',
        'Received in Spatial Persona view ✨ Let me know how the MediaPipe hand tracking feels!',
      ];
      const replyText = replyOptions[Math.floor(Math.random() * replyOptions.length)];
      setConversations((prev) =>
        prev.map((c) =>
          c.id === activeConv.id
            ? {
                ...c,
                messages: [
                  ...c.messages,
                  {
                    id: `reply-${Date.now()}`,
                    sender: 'them',
                    text: replyText,
                    timestamp: new Date().toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    }),
                  },
                ],
              }
            : c
        )
      );
    }, 900);
  };

  const toggleReaction = (msgId: string, emoji: string) => {
    setConversations((prev) =>
      prev.map((c) =>
        c.id === activeConv.id
          ? {
              ...c,
              messages: c.messages.map((m) =>
                m.id === msgId
                  ? { ...m, reaction: m.reaction === emoji ? undefined : emoji }
                  : m
              ),
            }
          : c
      )
    );
  };

  return (
    <div className="flex flex-col sm:flex-row h-full w-full text-white overflow-hidden">
      {/* Left Conversation List */}
      <div className="sm:w-48 border-b sm:border-b-0 sm:border-r border-white/12 bg-white/[0.03] p-2.5 flex sm:flex-col gap-1.5 overflow-x-auto no-scrollbar shrink-0">
        {conversations.map((conv) => {
          const isSelected = conv.id === activeConv.id;
          return (
            <button
              key={conv.id}
              type="button"
              onClick={() => handleSelectConversation(conv.id)}
              className={`flex items-center gap-2.5 p-2 rounded-2xl text-left transition-all shrink-0 ${
                isSelected
                  ? 'bg-white/22 border border-white/35 shadow-md'
                  : 'bg-white/[0.04] hover:bg-white/12 border border-transparent'
              }`}
            >
              <div className="relative shrink-0">
                <div
                  className={`w-9 h-9 rounded-full bg-gradient-to-br ${conv.avatarGradient} flex items-center justify-center text-xs font-bold text-white border border-white/30`}
                >
                  {conv.initials}
                </div>
                {conv.online && (
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-slate-900" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-xs font-semibold text-white truncate">{conv.name}</span>
                  {conv.unread > 0 && (
                    <span className="w-2 h-2 rounded-full bg-sky-400 shrink-0" />
                  )}
                </div>
                <div className="text-[10px] text-white/60 truncate hidden sm:block">
                  {conv.messages[conv.messages.length - 1]?.text}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Right Active Thread */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {/* Thread Header */}
        <div className="px-4 py-2 border-b border-white/10 flex items-center justify-between bg-white/[0.02] shrink-0">
          <div>
            <div className="text-xs font-semibold text-white">{activeConv.name}</div>
            <div className="text-[10px] text-emerald-300 flex items-center gap-1">
              <Sparkles size={10} />
              <span>{activeConv.role}</span>
            </div>
          </div>
        </div>

        {/* Messages Feed */}
        <div className="flex-1 spatial-scroll p-3.5 space-y-3">
          {activeConv.messages.map((msg) => {
            const isMe = msg.sender === 'me';
            return (
              <div
                key={msg.id}
                className={`group flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
              >
                <div className="relative max-w-[82%]">
                  <div
                    className={`px-3.5 py-2 rounded-2xl text-xs leading-relaxed shadow ${
                      isMe
                        ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white rounded-br-sm'
                        : 'bg-white/14 border border-white/20 text-white/95 rounded-bl-sm'
                    }`}
                  >
                    {msg.text}
                  </div>

                  {msg.reaction && (
                    <span className="absolute -top-2 -right-2 px-1.5 py-0.5 rounded-full bg-slate-900 border border-white/30 text-[11px] shadow">
                      {msg.reaction}
                    </span>
                  )}
                </div>

                {/* Hover Tapback Reactions */}
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="text-[9px] text-white/45">{msg.timestamp}</span>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                    {QUICK_REACTIONS.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => toggleReaction(msg.id, emoji)}
                        className="text-[10px] hover:scale-125 transition-transform"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Message Input Bar */}
        <form
          onSubmit={handleSend}
          className="p-2.5 border-t border-white/12 bg-white/[0.03] flex items-center gap-2 shrink-0"
        >
          <button
            type="button"
            onClick={() => setDraft((d) => d + ' ✨')}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/80 shrink-0"
            title="Insert Sparkles"
          >
            <Smile size={15} />
          </button>
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={`iMessage ${activeConv.name}...`}
            className="flex-1 px-3.5 py-1.5 rounded-full text-xs vision-input text-white placeholder-white/45"
          />
          <button
            type="submit"
            className="w-8 h-8 rounded-full bg-sky-500 hover:bg-sky-400 flex items-center justify-center text-white shadow shrink-0 transition-all"
            title="Send Spatial Message"
          >
            <Send size={13} />
          </button>
        </form>
      </div>
    </div>
  );
};
