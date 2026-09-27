'use client';

import React from 'react';
import { FilterTimeScope, EVENT_CATEGORIES } from '@/types';
import { TabType } from '@/components/BottomNav';
import {
  Sparkles,
  Filter,
  Check,
  Compass,
  Heart,
  Archive,
  Plus,
} from 'lucide-react';

interface HeaderProps {
  currentScope: FilterTimeScope;
  onScopeChange: (scope: FilterTimeScope) => void;
  selectedCategory: string;
  onCategoryChange: (cat: string) => void;
  onlyFree: boolean;
  onToggleOnlyFree: () => void;
  totalActiveCount: number;
  // Desktop navigation props
  activeTab?: TabType;
  onTabChange?: (tab: TabType) => void;
  onOpenCreate?: () => void;
  favoritesCount?: number;
  archiveCount?: number;
}

export default function Header({
  currentScope,
  onScopeChange,
  selectedCategory,
  onCategoryChange,
  onlyFree,
  onToggleOnlyFree,
  totalActiveCount,
  activeTab = 'discover',
  onTabChange,
  onOpenCreate,
  favoritesCount = 0,
  archiveCount = 0,
}: HeaderProps) {
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
    <header className="sticky top-0 z-40 bg-[#090d16]/95 backdrop-blur-md border-b border-slate-800/80 px-4 sm:px-6 lg:px-8 pt-3 pb-3 transition-all">
      <div className="max-w-7xl mx-auto">
        {/* Top row: Branding, Desktop Nav & Actions */}
        <div className="flex items-center justify-between gap-4 mb-3">
          {/* Logo & Subtitle */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-md shadow-indigo-500/20 text-white flex-shrink-0">
              <Sparkles className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                  Event Tracker
                </h1>
                <span className="hidden sm:inline-block text-xs font-medium px-2 py-0.5 rounded-full bg-indigo-950/70 border border-indigo-500/30 text-indigo-300">
                  {totalActiveCount} Events
                </span>
              </div>
              <p className="text-xs text-slate-400 capitalize -mt-0.5">
                {todayFormatted}
              </p>
            </div>
          </div>

          {/* Desktop Navigation Tabs (Visible on tablets & laptops: md and up) */}
          {onTabChange && (
            <div className="hidden md:flex items-center gap-1.5 p-1 rounded-2xl bg-slate-900 border border-slate-800">
              <button
                onClick={() => onTabChange('discover')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${
                  activeTab === 'discover'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <Compass className="w-4 h-4" />
                <span>Entdecken</span>
              </button>

              <button
                onClick={() => onTabChange('favorites')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${
                  activeTab === 'favorites'
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <Heart className="w-4 h-4" />
                <span>Favoriten</span>
                {favoritesCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-white/20 text-[10px]">
                    {favoritesCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => onTabChange('archive')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${
                  activeTab === 'archive'
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <Archive className="w-4 h-4" />
                <span>Archiv</span>
                {archiveCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-white/20 text-[10px]">
                    {archiveCount}
                  </span>
                )}
              </button>
            </div>
          )}

          {/* Right side: Desktop Create Button & Mobile Counter */}
          <div className="flex items-center gap-2">
            {onOpenCreate && (
              <button
                onClick={onOpenCreate}
                className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-bold shadow-md shadow-indigo-600/30 active:scale-95 transition"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>Event hinzufügen</span>
              </button>
            )}

            <span className="sm:hidden text-xs font-medium px-2.5 py-1 rounded-full bg-indigo-950/70 border border-indigo-500/30 text-indigo-300">
              {totalActiveCount}
            </span>
          </div>
        </div>

        {/* Quick Filter Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 -mx-1 px-1">
          {scopes.map((s) => {
            const isActive = currentScope === s.id;
            return (
              <button
                key={s.id}
                onClick={() => onScopeChange(s.id)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200 active:scale-95 ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'bg-slate-800/90 text-slate-300 hover:bg-slate-800 border border-slate-700/60'
                }`}
              >
                {s.label}
              </button>
            );
          })}

          <div className="w-px h-5 bg-slate-800 flex-shrink-0 mx-0.5" />

          {/* Free toggle */}
          <button
            onClick={onToggleOnlyFree}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200 active:scale-95 ${
              onlyFree
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : 'bg-slate-800/90 text-slate-300 hover:bg-slate-800 border border-slate-700/60'
            }`}
          >
            {onlyFree && <Check className="w-3.5 h-3.5 stroke-[3]" />}
            <span>Kostenlos</span>
          </button>

          {/* Active category pill */}
          {selectedCategory !== 'Alle' && (
            <button
              onClick={() => onCategoryChange('Alle')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap bg-purple-600 text-white active:scale-95 shadow-md shadow-purple-600/30"
            >
              <span>{selectedCategory}</span>
              <span className="text-purple-200 ml-1">✕</span>
            </button>
          )}
        </div>

        {/* Category chips row */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-2 text-[11px] -mx-1 px-1">
          <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider mr-1 flex items-center gap-1 flex-shrink-0">
            <Filter className="w-3 h-3" />
          </span>
          <button
            onClick={() => onCategoryChange('Alle')}
            className={`px-3 py-1 rounded-lg whitespace-nowrap transition ${
              selectedCategory === 'Alle'
                ? 'text-indigo-400 font-bold bg-indigo-500/10 border border-indigo-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            Alle Sparten
          </button>
          {EVENT_CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => onCategoryChange(cat)}
              className={`px-3 py-1 rounded-lg whitespace-nowrap transition ${
                selectedCategory === cat
                  ? 'text-indigo-400 font-bold bg-indigo-500/10 border border-indigo-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
}
