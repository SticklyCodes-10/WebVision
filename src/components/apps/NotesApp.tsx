import React, { useEffect, useState } from 'react';
import {
  CheckSquare,
  Folder,
  Pin,
  Plus,
  Search,
  Square,
  Trash2,
} from 'lucide-react';
import { INITIAL_NOTES } from '../../data/initialData';
import { NoteItem } from '../../types/vision';

const STORAGE_KEY = 'visionos_spatial_notes_v1';

export const NotesApp: React.FC = () => {
  const [notes, setNotes] = useState<NoteItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : INITIAL_NOTES;
    } catch {
      return INITIAL_NOTES;
    }
  });

  const [selectedId, setSelectedId] = useState<string>(notes[0]?.id || 'n1');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [newTaskText, setNewTaskText] = useState<string>('');

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
    } catch {}
  }, [notes]);

  const filteredNotes = notes.filter(
    (n) =>
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeNote = notes.find((n) => n.id === selectedId) || filteredNotes[0] || notes[0];

  const handleCreateNote = () => {
    const newNote: NoteItem = {
      id: `note-${Date.now()}`,
      title: 'Untitled Spatial Note',
      folder: 'Spatial Ideas',
      updatedAt: 'Just now',
      content: 'Capture your spatial design thoughts here...',
      checklist: [{ id: `ck-${Date.now()}`, text: 'New spatial action item', done: false }],
      pinned: false,
    };
    setNotes((prev) => [newNote, ...prev]);
    setSelectedId(newNote.id);
  };

  const handleDeleteNote = (id: string) => {
    if (notes.length <= 1) return;
    const remaining = notes.filter((n) => n.id !== id);
    setNotes(remaining);
    if (selectedId === id) {
      setSelectedId(remaining[0].id);
    }
  };

  const updateActiveNote = (partial: Partial<NoteItem>) => {
    if (!activeNote) return;
    setNotes((prev) =>
      prev.map((n) =>
        n.id === activeNote.id ? { ...n, ...partial, updatedAt: 'Edited just now' } : n
      )
    );
  };

  const toggleChecklistItem = (itemId: string) => {
    if (!activeNote) return;
    const updatedList = activeNote.checklist.map((item) =>
      item.id === itemId ? { ...item, done: !item.done } : item
    );
    updateActiveNote({ checklist: updatedList });
  };

  const handleAddChecklistItem = (e: React.FormEvent) => {
    e.preventDefault();
    const txt = newTaskText.trim();
    if (!txt || !activeNote) return;
    updateActiveNote({
      checklist: [...activeNote.checklist, { id: `ck-${Date.now()}`, text: txt, done: false }],
    });
    setNewTaskText('');
  };

  return (
    <div className="flex flex-col sm:flex-row h-full w-full text-white overflow-hidden">
      {/* Left Sidebar: Search + Notes List */}
      <div className="sm:w-52 border-b sm:border-b-0 sm:border-r border-white/12 bg-white/[0.03] p-2.5 flex flex-col gap-2 shrink-0">
        <div className="flex items-center gap-1.5">
          <div className="relative flex-1">
            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/45" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search notes..."
              className="w-full pl-7 pr-2 py-1 rounded-full text-xs vision-input text-white placeholder-white/45"
            />
          </div>
          <button
            type="button"
            onClick={handleCreateNote}
            className="w-7 h-7 rounded-full bg-amber-400 hover:bg-amber-300 text-slate-950 flex items-center justify-center shadow shrink-0"
            title="New Spatial Note"
          >
            <Plus size={14} />
          </button>
        </div>

        <div className="flex sm:flex-col gap-1.5 overflow-x-auto sm:overflow-y-auto no-scrollbar max-h-24 sm:max-h-none">
          {filteredNotes.map((note) => {
            const isSelected = note.id === activeNote?.id;
            return (
              <button
                key={note.id}
                type="button"
                onClick={() => setSelectedId(note.id)}
                className={`p-2.5 rounded-2xl text-left transition-all shrink-0 w-44 sm:w-full border ${
                  isSelected
                    ? 'bg-amber-400/25 border-amber-300/50 text-white shadow'
                    : 'bg-white/[0.04] hover:bg-white/10 border-transparent text-white/80'
                }`}
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="text-xs font-semibold truncate">{note.title}</span>
                  {note.pinned && <Pin size={11} className="text-amber-300 shrink-0" />}
                </div>
                <div className="text-[10px] text-white/55 truncate mt-0.5">{note.updatedAt}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Right Note Editor & Checklist */}
      {activeNote && (
        <div className="flex-1 flex flex-col min-h-0 p-3.5 sm:p-4 spatial-scroll space-y-3">
          <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-2">
            <div className="flex items-center gap-1.5 text-[11px] text-amber-300 font-medium">
              <Folder size={12} />
              <span>{activeNote.folder}</span>
              <span className="text-white/40">·</span>
              <span className="text-white/60">{activeNote.updatedAt}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => updateActiveNote({ pinned: !activeNote.pinned })}
                className={`p-1.5 rounded-full transition-colors ${
                  activeNote.pinned ? 'bg-amber-400 text-slate-950' : 'bg-white/10 text-white/75'
                }`}
                title="Pin Note"
              >
                <Pin size={12} />
              </button>
              {notes.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleDeleteNote(activeNote.id)}
                  className="p-1.5 rounded-full bg-white/10 hover:bg-rose-500/80 text-white/75 hover:text-white transition-colors"
                  title="Delete Note"
                >
                  <Trash2 size={12} />
                </button>
              )}
            </div>
          </div>

          <input
            type="text"
            value={activeNote.title}
            onChange={(e) => updateActiveNote({ title: e.target.value })}
            className="w-full bg-transparent text-base sm:text-lg font-bold text-white focus:outline-none border-b border-transparent focus:border-amber-400/50 pb-1"
          />

          <textarea
            rows={3}
            value={activeNote.content}
            onChange={(e) => updateActiveNote({ content: e.target.value })}
            className="w-full rounded-2xl p-3 text-xs leading-relaxed vision-input text-white/90 resize-none"
          />

          {/* Interactive Spatial Checklist */}
          <div className="vision-card rounded-2xl p-3 space-y-2">
            <div className="text-xs font-semibold text-amber-300">Spatial Action Checklist</div>
            <div className="space-y-1.5">
              {activeNote.checklist.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => toggleChecklistItem(item.id)}
                  className="w-full flex items-center gap-2 text-left text-xs py-1 px-2 rounded-xl hover:bg-white/10 transition-colors"
                >
                  {item.done ? (
                    <CheckSquare size={14} className="text-amber-300 shrink-0" />
                  ) : (
                    <Square size={14} className="text-white/50 shrink-0" />
                  )}
                  <span className={item.done ? 'line-through text-white/45' : 'text-white/90'}>
                    {item.text}
                  </span>
                </button>
              ))}
            </div>

            <form onSubmit={handleAddChecklistItem} className="flex items-center gap-1.5 pt-1">
              <input
                type="text"
                value={newTaskText}
                onChange={(e) => setNewTaskText(e.target.value)}
                placeholder="Add checklist item..."
                className="flex-1 px-3 py-1 rounded-full text-xs vision-input text-white placeholder-white/45"
              />
              <button
                type="submit"
                className="px-3 py-1 rounded-full bg-amber-400 text-slate-950 font-semibold text-xs hover:bg-amber-300 transition-colors"
              >
                Add
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
