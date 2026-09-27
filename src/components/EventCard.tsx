'use client';

import React from 'react';
import { EventItem } from '@/types';
import {
  formatEventDateTime,
  getRelativeBadge,
  isPastEvent,
} from '@/lib/dateUtils';
import {
  MapPin,
  Clock,
  Heart,
  ExternalLink,
  Repeat,
  Archive,
  RotateCcw,
  Trash2,
  Edit2,
  Tag,
  Instagram,
  CheckCircle2,
} from 'lucide-react';

interface EventCardProps {
  event: EventItem;
  onToggleFavorite: (id: string, current: boolean) => void;
  onToggleArchive: (id: string, current: boolean) => void;
  onEdit: (event: EventItem) => void;
  onDelete: (id: string) => void;
}

export default function EventCard({
  event,
  onToggleFavorite,
  onToggleArchive,
  onEdit,
  onDelete,
}: EventCardProps) {
  const isPast = isPastEvent(event);
  const relativeBadge = getRelativeBadge(event.start_time);

  const isInstagram =
    event.source_url &&
    (event.source_url.toLowerCase().includes('instagram.com') ||
      event.source_url.toLowerCase().includes('instagr.am'));

  // Maps URL helper
  const mapsUrl = event.location
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        event.location
      )}`
    : null;

  const recurrenceLabel = {
    weekly: 'Wöchentlich',
    biweekly: 'Alle 2 Wochen',
    monthly: 'Monatlich',
    none: null,
  }[event.recurrence || 'none'];

  return (
    <article
      className={`group relative rounded-2xl border transition-all duration-200 overflow-hidden shadow-sm hover:shadow-md ${
        event.is_archived
          ? 'bg-slate-900/60 border-slate-800 opacity-80'
          : isPast
          ? 'bg-slate-900/75 border-slate-800/90'
          : 'bg-slate-900/95 border-slate-800 hover:border-slate-700'
      }`}
    >
      {/* Top Banner Accent Line */}
      <div
        className={`h-1 w-full ${
          event.is_favorite
            ? 'bg-gradient-to-r from-rose-500 via-pink-500 to-indigo-500'
            : isPast
            ? 'bg-slate-700'
            : 'bg-gradient-to-r from-indigo-500 via-violet-500 to-emerald-400'
        }`}
      />

      <div className="p-4">
        {/* Badges Bar: Time badge + Category + Free */}
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center flex-wrap gap-1.5">
            {/* Relative badge */}
            <span
              className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${relativeBadge.color}`}
            >
              {relativeBadge.label}
            </span>

            {/* Category badge */}
            <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
              {event.category || 'Allgemein'}
            </span>

            {/* Recurrence badge */}
            {recurrenceLabel && (
              <span className="flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-violet-950/70 text-violet-300 border border-violet-800/60">
                <Repeat className="w-2.5 h-2.5" />
                {recurrenceLabel}
              </span>
            )}
          </div>

          {/* Favorite button */}
          <button
            onClick={() => onToggleFavorite(event.id, event.is_favorite)}
            className={`p-2 -mr-1.5 -mt-1.5 rounded-full transition-transform active:scale-75 ${
              event.is_favorite
                ? 'text-rose-500 hover:text-rose-400'
                : 'text-slate-500 hover:text-slate-300'
            }`}
            aria-label={event.is_favorite ? 'Favorit entfernen' : 'Zu Favoriten hinzufügen'}
          >
            <Heart
              className={`w-5 h-5 transition-colors ${
                event.is_favorite ? 'fill-rose-500 stroke-rose-500' : ''
              }`}
            />
          </button>
        </div>

        {/* Title */}
        <h3 className="text-base font-bold text-white tracking-tight leading-snug mb-1.5">
          {event.title}
        </h3>

        {/* Date & Time info */}
        <div className="flex items-center gap-1.5 text-xs text-indigo-300 font-medium mb-2">
          <Clock className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
          <span>{formatEventDateTime(event.start_time, event.end_time)}</span>
        </div>

        {/* Location with Google Maps link */}
        {event.location && (
          <div className="flex items-start gap-1.5 text-xs text-slate-300 mb-2">
            <MapPin className="w-3.5 h-3.5 text-rose-400 flex-shrink-0 mt-0.5" />
            {mapsUrl ? (
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-indigo-300 underline decoration-slate-600 underline-offset-2 transition line-clamp-1"
                title="In Google Maps öffnen"
              >
                {event.location}
              </a>
            ) : (
              <span className="line-clamp-1">{event.location}</span>
            )}
          </div>
        )}

        {/* Price / Free Badge */}
        <div className="flex items-center gap-2 mb-3">
          {event.is_free ? (
            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              <CheckCircle2 className="w-3 h-3" />
              Kostenlos
            </span>
          ) : event.price_note ? (
            <span className="inline-flex items-center gap-1 text-xs text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
              <Tag className="w-3 h-3" />
              {event.price_note}
            </span>
          ) : null}
        </div>

        {/* Description / Notes if present */}
        {event.description && (
          <p className="text-xs text-slate-300/90 leading-relaxed mb-3 line-clamp-3">
            {event.description}
          </p>
        )}

        {/* Bottom Actions Row: Source Links + Management Actions */}
        <div className="pt-2.5 border-t border-slate-800/80 flex items-center justify-between gap-2">
          {/* Clickable Source Button (Instagram / Web) */}
          <div>
            {event.source_url ? (
              isInstagram ? (
                <a
                  href={event.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl bg-gradient-to-r from-pink-600 via-purple-600 to-amber-600 text-white shadow-sm hover:brightness-110 active:scale-95 transition"
                >
                  <Instagram className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Instagram</span>
                </a>
              ) : (
                <a
                  href={event.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-slate-700 active:scale-95 transition"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Web-Link</span>
                </a>
              )
            ) : (
              <span />
            )}
          </div>

          {/* Quick Controls: Edit, Archive/Unarchive, Delete */}
          <div className="flex items-center gap-1 text-slate-400">
            <button
              onClick={() => onEdit(event)}
              className="p-1.5 rounded-lg hover:bg-slate-800 hover:text-slate-200 transition"
              title="Bearbeiten"
              aria-label="Bearbeiten"
            >
              <Edit2 className="w-4 h-4" />
            </button>

            <button
              onClick={() => onToggleArchive(event.id, event.is_archived)}
              className={`p-1.5 rounded-lg hover:bg-slate-800 transition ${
                event.is_archived
                  ? 'text-amber-400 hover:text-amber-300'
                  : 'hover:text-slate-200'
              }`}
              title={event.is_archived ? 'Wiederherstellen' : 'Archivieren'}
              aria-label={event.is_archived ? 'Wiederherstellen' : 'Archivieren'}
            >
              {event.is_archived ? (
                <RotateCcw className="w-4 h-4" />
              ) : (
                <Archive className="w-4 h-4" />
              )}
            </button>

            <button
              onClick={() => onDelete(event.id)}
              className="p-1.5 rounded-lg hover:bg-rose-950/40 text-slate-500 hover:text-rose-400 transition"
              title="Löschen"
              aria-label="Löschen"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
