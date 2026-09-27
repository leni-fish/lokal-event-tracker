'use client';

import React, { useState, useEffect } from 'react';
import { EventItem, RecurrenceType, EVENT_CATEGORIES } from '@/types';
import {
  X,
  Calendar,
  Clock,
  MapPin,
  Link as LinkIcon,
  Tag,
  Repeat,
  Sparkles,
  AlignLeft,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (eventData: Partial<EventItem>) => Promise<void>;
  editEvent?: EventItem | null;
}

export default function EventModal({
  isOpen,
  onClose,
  onSave,
  editEvent,
}: EventModalProps) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<string>('Allgemein');
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [hasEndTime, setHasEndTime] = useState(false);
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('');
  const [location, setLocation] = useState('');
  const [isFree, setIsFree] = useState(false);
  const [priceNote, setPriceNote] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [recurrence, setRecurrence] = useState<RecurrenceType>('none');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Initialize or reset form values
  useEffect(() => {
    if (editEvent) {
      setTitle(editEvent.title || '');
      setCategory(editEvent.category || 'Allgemein');

      const start = new Date(editEvent.start_time);
      setStartDate(start.toISOString().split('T')[0]);
      setStartTime(start.toTimeString().slice(0, 5));

      if (editEvent.end_time) {
        setHasEndTime(true);
        const end = new Date(editEvent.end_time);
        setEndDate(end.toISOString().split('T')[0]);
        setEndTime(end.toTimeString().slice(0, 5));
      } else {
        setHasEndTime(false);
        setEndDate('');
        setEndTime('');
      }

      setLocation(editEvent.location || '');
      setIsFree(Boolean(editEvent.is_free));
      setPriceNote(editEvent.price_note || '');
      setSourceUrl(editEvent.source_url || '');
      setRecurrence(editEvent.recurrence || 'none');
      setDescription(editEvent.description || '');
    } else {
      // Default to today + current rounded hour
      const now = new Date();
      now.setMinutes(0, 0, 0);
      now.setHours(now.getHours() + 1);

      setTitle('');
      setCategory('Allgemein');
      setStartDate(now.toISOString().split('T')[0]);
      setStartTime(now.toTimeString().slice(0, 5));
      setHasEndTime(false);
      setEndDate(now.toISOString().split('T')[0]);
      setEndTime('');
      setLocation('');
      setIsFree(false);
      setPriceNote('');
      setSourceUrl('');
      setRecurrence('none');
      setDescription('');
    }
    setErrorMsg(null);
  }, [editEvent, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg('Bitte gib einen Titel für das Event ein.');
      return;
    }
    if (!startDate || !startTime) {
      setErrorMsg('Bitte gib Startdatum und Startuhrzeit an.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg(null);

      const startDateTime = new Date(`${startDate}T${startTime}:00`).toISOString();
      let endDateTime: string | null = null;

      if (hasEndTime && endTime) {
        const finalEndDate = endDate || startDate;
        endDateTime = new Date(`${finalEndDate}T${endTime}:00`).toISOString();
      }

      await onSave({
        title: title.trim(),
        category,
        start_time: startDateTime,
        end_time: endDateTime,
        location: location.trim() || null,
        is_free: isFree,
        price_note: isFree ? 'Kostenlos' : priceNote.trim() || null,
        source_url: sourceUrl.trim() || null,
        recurrence,
        description: description.trim() || null,
      });

      if (!editEvent) {
        // Trigger celebratory confetti for new event
        try {
          confetti({
            particleCount: 50,
            spread: 60,
            origin: { y: 0.8 },
          });
        } catch {
          // ignore
        }
      }

      onClose();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Fehler beim Speichern');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full sm:max-w-lg bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-3xl max-h-[92vh] flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-300 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-600/30 text-indigo-400 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold text-white">
              {editEvent ? 'Event bearbeiten' : 'Neues Event erstellen'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition"
            aria-label="Schließen"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-5 space-y-4 text-sm">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
              {errorMsg}
            </div>
          )}

          {/* Event Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Titel *
            </label>
            <input
              type="text"
              required
              placeholder="z.B. DJ-Set am Flussufer, Flohmarkt..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-indigo-400" />
              Kategorie
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
            >
              {EVENT_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Date & Time (Start) */}
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                Startdatum *
              </label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-indigo-400" />
                Uhrzeit *
              </label>
              <input
                type="time"
                required
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Optional End Time Toggle */}
          <div className="pt-0.5">
            <label className="inline-flex items-center gap-2 cursor-pointer text-xs text-slate-300">
              <input
                type="checkbox"
                checked={hasEndTime}
                onChange={(e) => setHasEndTime(e.target.checked)}
                className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-indigo-600 focus:ring-indigo-500"
              />
              <span>Enduhrzeit angeben</span>
            </label>

            {hasEndTime && (
              <div className="grid grid-cols-2 gap-2.5 mt-2.5 pl-6 border-l-2 border-indigo-500/30">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">
                    Enddatum (optional)
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-white text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">
                    Endzeit
                  </label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-white text-xs"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Location */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-rose-400" />
              Ort / Location
            </label>
            <input
              type="text"
              placeholder="z.B. Café Central, Stadtpark Pavillon..."
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Free vs Price */}
          <div className="bg-slate-800/40 p-3 rounded-2xl border border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300">
                Kostenlose Veranstaltung?
              </span>
              <button
                type="button"
                onClick={() => setIsFree(!isFree)}
                className={`w-11 h-6 rounded-full transition-colors relative ${
                  isFree ? 'bg-emerald-600' : 'bg-slate-700'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white transition-transform duration-200 transform ${
                    isFree ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {!isFree && (
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">
                  Eintrittspreis / Hinweis (optional)
                </label>
                <input
                  type="text"
                  placeholder="z.B. 10 € / Vorverkauf 8 € / Spendenbasis"
                  value={priceNote}
                  onChange={(e) => setPriceNote(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>
            )}
          </div>

          {/* Recurrence Dropdown */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Repeat className="w-3.5 h-3.5 text-violet-400" />
              Wiederholung
            </label>
            <select
              value={recurrence}
              onChange={(e) => setRecurrence(e.target.value as RecurrenceType)}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="none">Einmaliges Event</option>
              <option value="weekly">Wöchentlich (jeden gleichen Wochentag)</option>
              <option value="biweekly">Alle 2 Wochen</option>
              <option value="monthly">Monatlich</option>
            </select>
          </div>

          {/* Source Link (Instagram / Web) */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <LinkIcon className="w-3.5 h-3.5 text-indigo-400" />
              Link zur Quelle (Instagram / Website / Tickets)
            </label>
            <input
              type="url"
              placeholder="https://instagram.com/p/... oder https://..."
              value={sourceUrl}
              onChange={(e) => setSourceUrl(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <AlignLeft className="w-3.5 h-3.5 text-slate-400" />
              Beschreibung / Notizen (optional)
            </label>
            <textarea
              rows={3}
              placeholder="Weitere Infos, Dresscode, Treffpunkt..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none text-xs"
            />
          </div>

          {/* Submit Button */}
          <div className="pt-2 pb-1">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold shadow-lg shadow-indigo-600/30 active:scale-98 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <span>Wird gespeichert...</span>
              ) : (
                <span>{editEvent ? 'Änderungen speichern' : 'Event hinzufügen'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
