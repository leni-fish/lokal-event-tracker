'use client';

import React, { useState, useEffect } from 'react';
import { Share, PlusSquare, X } from 'lucide-react';

export default function InstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Only show on client
    if (typeof window === 'undefined') return;

    // Check if running in standalone mode (already installed)
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;

    // Check if on iOS Safari
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIos = /iphone|ipad|ipod/.test(userAgent);
    const isSafari = isIos && !/crios|fxios|opios|mercury/i.test(userAgent);

    const hasDismissed = localStorage.getItem('ios_install_dismissed');

    if (isIos && isSafari && !isStandalone && !hasDismissed) {
      // Delay prompt slightly for smoother UX
      const timer = setTimeout(() => setShowPrompt(true), 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('ios_install_dismissed', 'true');
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed top-4 inset-x-4 z-50 animate-in fade-in slide-in-from-top-4 duration-300">
      <div className="glass rounded-2xl p-4 shadow-2xl border border-indigo-500/30 bg-slate-900/95 text-slate-100">
        <div className="flex items-start justify-between gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-indigo-500/30">
            <span className="text-xl font-bold">✨</span>
          </div>

          <div className="flex-1 text-xs">
            <h4 className="font-semibold text-sm text-white mb-1">
              Als App auf den Home-Bildschirm?
            </h4>
            <p className="text-slate-300 leading-relaxed mb-2">
              Für Vollbildmodus & Schnallstart: Tippe unten auf{' '}
              <Share className="inline w-3.5 h-3.5 mx-1 text-indigo-400 align-text-bottom" />{' '}
              <strong>Teilen</strong> und dann auf{' '}
              <PlusSquare className="inline w-3.5 h-3.5 mx-1 text-indigo-400 align-text-bottom" />{' '}
              <strong>"Zum Home-Bildschirm"</strong>.
            </p>
          </div>

          <button
            onClick={handleDismiss}
            className="text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-800 transition"
            aria-label="Schließen"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
