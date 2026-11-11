import React, { useState } from 'react';
import { Calendar as CalendarIcon, Clock, MapPin, Plus, Trash2, Users } from 'lucide-react';
import { INITIAL_EVENTS } from '../../data/initialData';
import { CalendarEvent } from '../../types/vision';

export const CalendarApp: React.FC = () => {
  const [events, setEvents] = useState<CalendarEvent[]>(INITIAL_EVENTS);
  const [selectedDayOffset, setSelectedDayOffset] = useState<number>(0);
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [newTitle, setNewTitle] = useState<string>('');
  const [newTime, setNewTime] = useState<string>('02:30 PM');
  const [newLocation, setNewLocation] = useState<string>('Spatial Studio Room A');

  const today = new Date();
  const days = [0, 1, 2, 3, 4].map((offset) => {
    const d = new Date(today);
    d.setDate(today.getDate() + offset);
    return {
      offset,
      dayName: offset === 0 ? 'Today' : offset === 1 ? 'Tomorrow' : d.toLocaleDateString([], { weekday: 'short' }),
      dateNum: d.getDate(),
      monthShort: d.toLocaleDateString([], { month: 'short' }),
    };
  });

  const dayEvents = events.filter((ev) => ev.dayOffset === selectedDayOffset);

  const handleAddEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    const ev: CalendarEvent = {
      id: `ev-${Date.now()}`,
      title: newTitle.trim(),
      time: newTime,
      duration: '45m',
      location: newLocation.trim() || 'Shared Spatial Room',
      category: 'spatial',
      dayOffset: selectedDayOffset,
      attendees: ['ME', 'AC'],
    };
    setEvents((prev) => [...prev, ev]);
    setNewTitle('');
    setShowAddForm(false);
  };

  const handleDeleteEvent = (id: string) => {
    setEvents((prev) => prev.filter((e) => e.id !== id));
  };

  const categoryStyles: Record<CalendarEvent['category'], string> = {
    keynote: 'from-rose-500/35 to-orange-500/20 border-rose-400/50',
    spatial: 'from-sky-500/35 to-indigo-500/20 border-sky-400/50',
    design: 'from-emerald-500/35 to-teal-500/20 border-emerald-400/50',
    personal: 'from-amber-500/35 to-yellow-500/20 border-amber-400/50',
  };

  return (
    <div className="flex flex-col h-full w-full text-white p-3.5 sm:p-4 overflow-hidden">
      {/* Top Date Strip + Add Event Button */}
      <div className="flex items-center justify-between gap-2 pb-3 border-b border-white/12 shrink-0">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {days.map((d) => {
            const active = d.offset === selectedDayOffset;
            return (
              <button
                key={d.offset}
                type="button"
                onClick={() => setSelectedDayOffset(d.offset)}
                className={`px-3 py-1.5 rounded-2xl text-left transition-all border shrink-0 ${
                  active
                    ? 'bg-rose-500 text-white border-rose-300 shadow-lg'
                    : 'bg-white/[0.06] hover:bg-white/14 border-white/10 text-white/80'
                }`}
              >
                <div className="text-[10px] uppercase tracking-wider opacity-80">{d.dayName}</div>
                <div className="text-xs sm:text-sm font-bold">
                  {d.monthShort} {d.dateNum}
                </div>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => setShowAddForm((v) => !v)}
          className="px-3 py-1.5 rounded-full bg-white text-slate-950 hover:bg-white/90 text-xs font-semibold flex items-center gap-1 shadow shrink-0"
        >
          <Plus size={13} />
          <span>New Event</span>
        </button>
      </div>

      {/* Add Spatial Event Form */}
      {showAddForm && (
        <form
          onSubmit={handleAddEvent}
          className="mt-3 p-3 rounded-2xl vision-card space-y-2 shrink-0"
        >
          <div className="text-xs font-semibold text-rose-300">Schedule Spatial Session</div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Event title..."
              className="px-3 py-1.5 rounded-xl text-xs vision-input text-white placeholder-white/45"
              required
            />
            <input
              type="text"
              value={newTime}
              onChange={(e) => setNewTime(e.target.value)}
              placeholder="Time (e.g. 03:00 PM)"
              className="px-3 py-1.5 rounded-xl text-xs vision-input text-white placeholder-white/45"
            />
            <input
              type="text"
              value={newLocation}
              onChange={(e) => setNewLocation(e.target.value)}
              placeholder="Location / Spatial Room"
              className="px-3 py-1.5 rounded-xl text-xs vision-input text-white placeholder-white/45"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-3 py-1 rounded-full bg-white/10 text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-3.5 py-1 rounded-full bg-rose-500 text-white text-xs font-semibold"
            >
              Save Event
            </button>
          </div>
        </form>
      )}

      {/* Timeline Event Cards */}
      <div className="flex-1 spatial-scroll pt-3 space-y-2.5">
        {dayEvents.length === 0 ? (
          <div className="h-44 flex flex-col items-center justify-center text-center text-white/60">
            <CalendarIcon size={28} className="mb-2 text-rose-400/70" />
            <p className="text-xs font-medium">No spatial sessions scheduled for this day.</p>
            <button
              type="button"
              onClick={() => setShowAddForm(true)}
              className="mt-2 text-xs text-rose-300 underline"
            >
              Schedule a session
            </button>
          </div>
        ) : (
          dayEvents.map((ev) => (
            <div
              key={ev.id}
              className={`rounded-2xl p-3.5 bg-gradient-to-r ${categoryStyles[ev.category]} border flex items-center justify-between gap-3 shadow-md`}
            >
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 text-[11px] font-mono text-white/90 bg-black/25 px-2 py-0.5 rounded-full">
                    <Clock size={11} />
                    {ev.time} ({ev.duration})
                  </span>
                  <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/15 font-semibold">
                    {ev.category}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-white truncate">{ev.title}</h4>
                <div className="flex items-center gap-1 text-xs text-white/75 truncate">
                  <MapPin size={12} className="text-rose-200 shrink-0" />
                  <span className="truncate">{ev.location}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <div className="hidden sm:flex items-center gap-1 text-[10px] bg-black/25 px-2 py-1 rounded-full">
                  <Users size={11} />
                  <span>{ev.attendees.join(', ')}</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleDeleteEvent(ev.id)}
                  className="w-7 h-7 rounded-full bg-black/25 hover:bg-rose-500/80 flex items-center justify-center text-white/75 hover:text-white transition-colors"
                  title="Remove Event"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
