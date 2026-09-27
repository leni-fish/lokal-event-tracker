'use client';

import React from 'react';
import { FilterTimeScope, EVENT_CATEGORIES } from '@/types';
import { Calendar, Sparkles, Filter, Check } from 'lucide-react';

interface HeaderProps {
  currentScope: FilterTimeScope;
  onScopeChange: (scope: FilterTimeScope) => void;
  selectedCategory: string;
  onCategoryChange: (cat: string) => void;
  onlyFree: boolean;
  onToggleOnlyFree: () => void;
  totalActiveCount: number;
}

export default function Header({
  currentScope,
  onScopeChange,
  selectedCategory,
  onCategoryChange,
  onlyFree,
  onToggleOnlyFree,
  totalActiveCount,
}: HeaderProps) {
  // Current date formatted in German
  const todayFormatted = new Intl.DateTimeFormat('de-DE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date());

  const scopes: { id: FilterTimeScope; label: string }[] = [
    { id: 'all', label: 'Alle' },
    { id: 'today', label: 'Heute' },
    { id: 'tomorrow', label: 'Morgen' },
    { id: 'weekend', label: 'Wochenende' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-[#090d16]/90 backdrop-blur-md border-b border-slate-800/80 px-4 pt-3 pb-3">
      {/* Top row: Branding & Date */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-md shadow-indigo-500/20 text-white">
              <Sparkles className="w-4 h-4 text-amber-300" />
            </div>
            <h1 className="text-lg font-bold text-white tracking-tight">
              Event Tracker
            </h1>
          </div>
          <p className="text-xs text-slate-400 capitalize mt-0.5">
            {todayFormatted}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-indigo-950/70 border border-indigo-500/30 text-indigo-300">
            {totalActiveCount} {totalActiveCount === 1 ? 'Event' : 'Events'}
          </span>
        </div>
      </div>

      {/* Quick Filter Bar (Horizontally scrollable pills) */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 -mx-1 px-1">
        {/* Time scopes */}
        {scopes.map((s) => {
          const isActive = currentScope === s.id;
          return (
            <button
              key={s.id}
              onClick={() => onScopeChange(s.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200 active:scale-95 ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'bg-slate-800/90 text-slate-300 hover:bg-slate-800 border border-slate-700/60'
              }`}
            >
              {s.label}
            </button>
          );
        })}

        {/* Separator */}
        <div className="w-px h-5 bg-slate-800 flex-shrink-0 mx-0.5" />

        {/* Free-only quick toggle */}
        <button
          onClick={onToggleOnlyFree}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200 active:scale-95 ${
            onlyFree
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
              : 'bg-slate-800/90 text-slate-300 hover:bg-slate-800 border border-slate-700/60'
          }`}
        >
          {onlyFree && <Check className="w-3 h-3 stroke-[3]" />}
          <span>Kostenlos</span>
        </button>

        {/* Category Filter dropdown pill or pill list */}
        {selectedCategory !== 'Alle' && (
          <button
            onClick={() => onCategoryChange('Alle')}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap bg-purple-600 text-white active:scale-95 shadow-md shadow-purple-600/30"
          >
            <span>{selectedCategory}</span>
            <span className="text-purple-200 ml-1">✕</span>
          </button>
        )}
      </div>

      {/* Optional Category chips if user wants category selection */}
      <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pt-2 text-[11px] -mx-1 px-1">
        <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider mr-1 flex items-center gap-1 flex-shrink-0">
          <Filter className="w-3 h-3" />
        </span>
        <button
          onClick={() => onCategoryChange('Alle')}
          className={`px-2.5 py-1 rounded-md whitespace-nowrap transition ${
            selectedCategory === 'Alle'
              ? 'text-indigo-400 font-bold bg-indigo-500/10 border border-indigo-500/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Alle Sparten
        </button>
        {EVENT_CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => onCategoryChange(cat)}
            className={`px-2.5 py-1 rounded-md whitespace-nowrap transition ${
              selectedCategory === cat
                ? 'text-indigo-400 font-bold bg-indigo-500/10 border border-indigo-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>
    </header>
  );
}
