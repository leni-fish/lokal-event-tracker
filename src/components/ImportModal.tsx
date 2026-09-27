'use client';

import React, { useState, useEffect } from 'react';
import { EventItem, EVENT_CATEGORIES } from '@/types';
import {
  X,
  Globe,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  MapPin,
  Clock,
  Loader2,
  Tag,
  ArrowRight,
  Key,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingEvents: EventItem[];
  onImportEvents: (newEvents: EventItem[]) => Promise<void>;
}

interface DetectedItem extends EventItem {
  selected: boolean;
  isDuplicate: boolean;
  duplicateReason?: string;
}

// Normalize strings for comparison (remove special chars, lowercase, collapse spaces)
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Check for duplicate against existing events
function checkDuplicate(
  candidate: EventItem,
  existingEvents: EventItem[]
): { isDuplicate: boolean; reason?: string } {
  const candTitleNorm = normalizeText(candidate.title);
  const candDateStr = new Date(candidate.start_time).toISOString().split('T')[0];

  for (const existing of existingEvents) {
    const existTitleNorm = normalizeText(existing.title);
    const existDateStr = new Date(existing.start_time).toISOString().split('T')[0];

    // Check 1: Identical source URL
    if (
      candidate.source_url &&
      existing.source_url &&
      candidate.source_url === existing.source_url
    ) {
      return {
        isDuplicate: true,
        reason: 'Identischer Quell-Link bereits gespeichert',
      };
    }

    // Check 2: Same or very similar title on the same calendar day
    const titlesMatch =
      candTitleNorm === existTitleNorm ||
      (candTitleNorm.length > 5 && existTitleNorm.includes(candTitleNorm)) ||
      (existTitleNorm.length > 5 && candTitleNorm.includes(existTitleNorm));

    if (titlesMatch && candDateStr === existDateStr) {
      const formattedDate = new Intl.DateTimeFormat('de-DE', {
        day: 'numeric',
        month: 'short',
      }).format(new Date(existing.start_time));
      return {
        isDuplicate: true,
        reason: `Bereits am ${formattedDate} vorhanden`,
      };
    }
  }

  return { isDuplicate: false };
}

export default function ImportModal({
  isOpen,
  onClose,
  existingEvents,
  onImportEvents,
}: ImportModalProps) {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [detectedEvents, setDetectedEvents] = useState<DetectedItem[]>([]);
  const [step, setStep] = useState<'input' | 'preview'>('input');
  const [importing, setImporting] = useState(false);
  const [scanMethod, setScanMethod] = useState<'ai' | 'schema'>('schema');

  // Gemini API Key state
  const [geminiKey, setGeminiKey] = useState('');
  const [showKeyConfig, setShowKeyConfig] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedKey = localStorage.getItem('gemini_api_key');
      if (savedKey) {
        setGeminiKey(savedKey);
      }
    }
  }, []);

  const handleSaveKey = (val: string) => {
    setGeminiKey(val);
    if (typeof window !== 'undefined') {
      if (val.trim()) {
        localStorage.setItem('gemini_api_key', val.trim());
      } else {
        localStorage.removeItem('gemini_api_key');
      }
    }
  };

  if (!isOpen) return null;

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) {
      setErrorMsg('Bitte gib eine Webseiten-URL ein.');
      return;
    }

    let validUrl = url.trim();
    if (!validUrl.startsWith('http://') && !validUrl.startsWith('https://')) {
      validUrl = 'https://' + validUrl;
    }

    try {
      setLoading(true);
      setErrorMsg(null);

      const res = await fetch('/api/import-events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: validUrl,
          apiKey: geminiKey.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Fehler beim Abrufen der Webseite');
      }

      setScanMethod(data.method || 'schema');

      if (!data.events || data.events.length === 0) {
        if (!geminiKey) {
          setShowKeyConfig(true);
          throw new Error(
            'Auf dieser Seite wurden keine standardisierten Schema.org-Daten gefunden. Tipp: Aktiviere unten den kostenlosen KI-Modus (Gemini API), um jeden beliebigen Freitext-Kalender auszulesen!'
          );
        } else {
          throw new Error(
            'Auch die KI konnte auf dieser Seite keine konkreten Termine erkennen. Bitte prüfe die URL oder ob die Events hinter einem Login liegen.'
          );
        }
      }

      // Check duplicates for each detected event
      const processed: DetectedItem[] = data.events.map((e: EventItem) => {
        const dupCheck = checkDuplicate(e, existingEvents);
        return {
          ...e,
          isDuplicate: dupCheck.isDuplicate,
          duplicateReason: dupCheck.reason,
          // Pre-select only non-duplicates by default
          selected: !dupCheck.isDuplicate,
        };
      });

      setDetectedEvents(processed);
      setStep('preview');
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Unerwarteter Fehler');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSelect = (index: number) => {
    setDetectedEvents((prev) =>
      prev.map((item, i) => (i === index ? { ...item, selected: !item.selected } : item))
    );
  };

  const handleSelectAll = (select: boolean) => {
    setDetectedEvents((prev) => prev.map((item) => ({ ...item, selected: select })));
  };

  const handleUpdateItem = (index: number, key: keyof EventItem, val: string | boolean) => {
    setDetectedEvents((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [key]: val } : item))
    );
  };

  const handleExecuteImport = async () => {
    const toImport = detectedEvents.filter((e) => e.selected);
    if (toImport.length === 0) {
      setErrorMsg('Bitte wähle mindestens ein Event zum Importieren aus.');
      return;
    }

    try {
      setImporting(true);
      setErrorMsg(null);

      // Clean items (remove UI helper flags)
      const cleanItems: EventItem[] = toImport.map((item) => {
        const { selected: _, isDuplicate: _d, duplicateReason: _r, ...pureEvent } = item;
        return pureEvent as EventItem;
      });

      await onImportEvents(cleanItems);

      try {
        confetti({
          particleCount: 70,
          spread: 70,
          origin: { y: 0.8 },
        });
      } catch {
        // ignore
      }

      handleClose();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Fehler beim Speichern der Events');
    } finally {
      setImporting(false);
    }
  };

  const handleClose = () => {
    onClose();
    // Reset state after animation
    setTimeout(() => {
      setStep('input');
      setUrl('');
      setErrorMsg(null);
      setDetectedEvents([]);
    }, 200);
  };

  const selectedCount = detectedEvents.filter((e) => e.selected).length;
  const duplicateCount = detectedEvents.filter((e) => e.isDuplicate).length;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full sm:max-w-2xl bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-3xl max-h-[92vh] flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-300 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 text-white flex items-center justify-center shadow-md">
              <Sparkles className="w-4 h-4 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">
                  {step === 'input' ? 'Events von Webseite importieren' : 'Erkannte Events prüfen'}
                </h2>
                {step === 'preview' && scanMethod === 'ai' && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    ✨ Mit KI extrahiert
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400">
                {step === 'input'
                  ? 'Trage einen Kalender- oder Veranstaltungs-Link ein'
                  : `${detectedEvents.length} Events gefunden`}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition"
            aria-label="Schließen"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="overflow-y-auto p-5 space-y-4 text-sm flex-1">
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs leading-relaxed">
              {errorMsg}
            </div>
          )}

          {step === 'input' ? (
            <form onSubmit={handleScan} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-indigo-400" />
                  Webseiten-Adresse (URL)
                </label>
                <div className="relative">
                  <input
                    type="url"
                    required
                    placeholder="https://eventseite.de/programm oder stadt.de/kalender..."
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-slate-800/80 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-sm"
                  />
                </div>
              </div>

              {/* Gemini AI Key Banner & Configuration */}
              <div className="p-3.5 rounded-2xl bg-gradient-to-br from-indigo-950/40 to-slate-900 border border-indigo-500/20 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-base">✨</span>
                    <div>
                      <span className="font-semibold text-white block">
                        KI-Event-Erkennung (Google Gemini Flash)
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {geminiKey
                          ? 'Aktiviert: Liest jede Website, auch reinen Text'
                          : 'Liest auch Freitext, Flyer & Webseiten ohne Schema'}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowKeyConfig(!showKeyConfig)}
                    className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold px-2 py-1 rounded-lg hover:bg-indigo-950/50 transition flex items-center gap-1"
                  >
                    <span>{geminiKey ? 'Key ändern' : 'Kostenlos aktivieren'}</span>
                    {showKeyConfig ? (
                      <ChevronUp className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>

                {/* Collapsible Key Input & Instructions */}
                {showKeyConfig && (
                  <div className="mt-3 pt-3 border-t border-slate-800 space-y-2.5 animate-in fade-in duration-200">
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      Google bietet die Gemini API <strong>dauerhaft kostenlos</strong> (1.500 Anfragen pro Tag gratis).
                    </p>

                    <div className="flex items-center gap-2">
                      <a
                        href="https://aistudio.google.com/app/apikey"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-300 hover:text-amber-200 underline"
                      >
                        <span>1. Hier mit Google einloggen & "Create API Key" klicken</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>

                    <div className="relative">
                      <Key className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                      <input
                        type="password"
                        placeholder="2. Gemini API-Key hier einfügen (AIzaSy...)"
                        value={geminiKey}
                        onChange={(e) => handleSaveKey(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    {geminiKey && (
                      <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Key auf diesem Gerät gespeichert! KI-Scanner ist bereit.</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Submit button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold shadow-lg shadow-indigo-600/30 active:scale-98 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>
                      {geminiKey ? 'KI analysiert Webseite...' : 'Scanne Webseite nach Events...'}
                    </span>
                  </>
                ) : (
                  <>
                    <span>Events analysieren & anzeigen</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          ) : (
            // ================= PREVIEW STEP =================
            <div className="space-y-4">
              {/* Duplicate Notice Banner if duplicates found */}
              {duplicateCount > 0 && (
                <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  <span>
                    <strong>{duplicateCount} potenzielles Duplikat</strong> bereits in deinem Kalender gefunden (standardmäßig abgewählt).
                  </span>
                </div>
              )}

              {/* Selection Bar */}
              <div className="flex items-center justify-between text-xs pb-1 border-b border-slate-800">
                <span className="text-slate-400">
                  <strong className="text-white">{selectedCount}</strong> von {detectedEvents.length} Events ausgewählt
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleSelectAll(true)}
                    className="text-indigo-400 hover:underline text-[11px]"
                  >
                    Alle auswählen
                  </button>
                  <span className="text-slate-600">•</span>
                  <button
                    onClick={() => handleSelectAll(false)}
                    className="text-slate-400 hover:underline text-[11px]"
                  >
                    Keine
                  </button>
                </div>
              </div>

              {/* List of detected events */}
              <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
                {detectedEvents.map((item, index) => {
                  const startDateFormatted = new Intl.DateTimeFormat('de-DE', {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  }).format(new Date(item.start_time));

                  return (
                    <div
                      key={item.id || index}
                      className={`p-3.5 rounded-2xl border transition-all ${
                        item.selected
                          ? 'bg-slate-800/90 border-indigo-500/40 shadow-sm'
                          : 'bg-slate-800/30 border-slate-800 opacity-75'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {/* Checkbox */}
                        <input
                          type="checkbox"
                          checked={item.selected}
                          onChange={() => handleToggleSelect(index)}
                          className="w-5 h-5 mt-0.5 rounded border-slate-700 bg-slate-800 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        />

                        {/* Content */}
                        <div className="flex-1 space-y-1.5 min-w-0">
                          {/* Duplicate badge */}
                          {item.isDuplicate && (
                            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 text-[10px] font-semibold border border-amber-500/30">
                              <AlertTriangle className="w-3 h-3" />
                              <span>{item.duplicateReason || 'Bereits im Kalender'}</span>
                            </div>
                          )}

                          {/* Editable Title */}
                          <input
                            type="text"
                            value={item.title}
                            onChange={(e) => handleUpdateItem(index, 'title', e.target.value)}
                            className="w-full bg-transparent font-bold text-white text-sm focus:outline-none focus:bg-slate-700/50 px-1 py-0.5 rounded"
                          />

                          {/* Meta: Date, Location, Category */}
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400">
                            <span className="flex items-center gap-1 text-indigo-300 font-medium">
                              <Clock className="w-3 h-3 text-indigo-400" />
                              {startDateFormatted} Uhr
                            </span>

                            {item.location && (
                              <span className="flex items-center gap-1 text-slate-300 line-clamp-1">
                                <MapPin className="w-3 h-3 text-rose-400 flex-shrink-0" />
                                {item.location}
                              </span>
                            )}
                          </div>

                          {/* Description if present */}
                          {item.description && (
                            <p className="text-[11px] text-slate-400 line-clamp-2">
                              {item.description}
                            </p>
                          )}

                          {/* Category pill & Free indicator */}
                          <div className="flex items-center gap-2 pt-1">
                            <select
                              value={item.category}
                              onChange={(e) => handleUpdateItem(index, 'category', e.target.value)}
                              className="text-[11px] bg-slate-700 text-slate-200 px-2 py-0.5 rounded-md border border-slate-600 focus:outline-none"
                            >
                              {EVENT_CATEGORIES.map((cat) => (
                                <option key={cat} value={cat}>
                                  {cat}
                                </option>
                              ))}
                            </select>

                            {item.is_free ? (
                              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-semibold">
                                Kostenlos
                              </span>
                            ) : item.price_note ? (
                              <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                {item.price_note}
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStep('input')}
                  className="px-4 py-3 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 transition"
                >
                  Zurück
                </button>

                <button
                  type="button"
                  onClick={handleExecuteImport}
                  disabled={selectedCount === 0 || importing}
                  className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 active:scale-98 transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {importing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Importiere Events...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{selectedCount} Events in Kalender übernehmen</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
