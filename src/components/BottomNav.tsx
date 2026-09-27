'use client';

import React from 'react';
import { Compass, Plus, Heart, Archive } from 'lucide-react';

export type TabType = 'discover' | 'favorites' | 'archive';

interface BottomNavProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  onOpenCreate: () => void;
  favoritesCount: number;
  archiveCount: number;
}

export default function BottomNav({
  activeTab,
  onTabChange,
  onOpenCreate,
  favoritesCount,
  archiveCount,
}: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 glass-nav pb-[env(safe-area-inset-bottom)] px-3 pt-2">
      <div className="flex items-center justify-around max-w-lg mx-auto h-16 relative">
        {/* Entdecken */}
        <button
          onClick={() => onTabChange('discover')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-all active:scale-95 ${
            activeTab === 'discover'
              ? 'text-indigo-400 font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <div className="relative">
            <Compass className={`w-5 h-5 ${activeTab === 'discover' ? 'stroke-[2.5]' : ''}`} />
            {activeTab === 'discover' && (
              <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-indigo-500" />
            )}
          </div>
          <span className="text-[11px] mt-1">Entdecken</span>
        </button>

        {/* Plus / Event erstellen (Prominent button) */}
        <div className="flex-1 flex justify-center -translate-y-2">
          <button
            onClick={onOpenCreate}
            className="w-13 h-13 p-3.5 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 text-white shadow-lg shadow-indigo-600/40 hover:shadow-indigo-600/60 active:scale-90 transition-all duration-200 flex items-center justify-center border border-white/20"
            aria-label="Event erstellen"
          >
            <Plus className="w-6 h-6 stroke-[2.7]" />
          </button>
        </div>

        {/* Favoriten */}
        <button
          onClick={() => onTabChange('favorites')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-all active:scale-95 ${
            activeTab === 'favorites'
              ? 'text-rose-400 font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <div className="relative">
            <Heart
              className={`w-5 h-5 ${
                activeTab === 'favorites' ? 'fill-rose-500 text-rose-500 stroke-[2.5]' : ''
              }`}
            />
            {favoritesCount > 0 && (
              <span className="absolute -top-1 -right-2 min-w-4 h-4 px-1 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center leading-none">
                {favoritesCount > 99 ? '99+' : favoritesCount}
              </span>
            )}
            {activeTab === 'favorites' && (
              <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-rose-500" />
            )}
          </div>
          <span className="text-[11px] mt-1">Favoriten</span>
        </button>

        {/* Archiv */}
        <button
          onClick={() => onTabChange('archive')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-all active:scale-95 ${
            activeTab === 'archive'
              ? 'text-amber-400 font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <div className="relative">
            <Archive className={`w-5 h-5 ${activeTab === 'archive' ? 'stroke-[2.5]' : ''}`} />
            {archiveCount > 0 && (
              <span className="absolute -top-1 -right-2 min-w-4 h-4 px-1 rounded-full bg-slate-700 text-slate-300 text-[9px] font-bold flex items-center justify-center leading-none">
                {archiveCount}
              </span>
            )}
            {activeTab === 'archive' && (
              <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-amber-400" />
            )}
          </div>
          <span className="text-[11px] mt-1">Archiv</span>
        </button>
      </div>
    </nav>
  );
}
