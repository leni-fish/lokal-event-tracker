'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { EventItem, FilterTimeScope } from '@/types';
import Header from '@/components/Header';
import BottomNav, { TabType } from '@/components/BottomNav';
import EventCard from '@/components/EventCard';
import EventModal from '@/components/EventModal';
import InstallPrompt from '@/components/InstallPrompt';
import {
  groupEvents,
  isPastEvent,
  filterEventsByScope,
} from '@/lib/dateUtils';
import {
  CalendarDays,
  CalendarX,
  Sparkles,
  ArchiveRestore,
  RefreshCw,
  Plus,
  AlertCircle,
  Database,
} from 'lucide-react';

// Fallback initial events if Supabase table has not been initialized yet
const INITIAL_DEMO_EVENTS: EventItem[] = [
  {
    id: 'demo-1',
    title: 'Wochenmarkt & Straßenmusik',
    description: 'Frische regionale Spezialitäten, Streetfood und Live-Akustikgitarre.',
    start_time: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
    end_time: new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString(),
    location: 'Marktplatz / Altstadt',
    category: 'Markt & Flohmarkt',
    is_free: true,
    price_note: 'Eintritt frei',
    source_url: 'https://instagram.com',
    recurrence: 'weekly',
    is_favorite: true,
    is_archived: false,
    created_at: new Date().toISOString(),
  },
  {
    id: 'demo-2',
    title: 'Open-Air Kino: Summer Classics',
    description: 'Sommerkino auf Großleinwand. Bitte Decken und Snacks mitbringen!',
    start_time: new Date(Date.now() + 26 * 60 * 60 * 1000).toISOString(),
    end_time: new Date(Date.now() + 29 * 60 * 60 * 1000).toISOString(),
    location: 'Stadtpark Wiese Süd',
    category: 'Kultur & Theater',
    is_free: false,
    price_note: '8,50 € / ermäßigt 6 €',
    source_url: 'https://instagram.com',
    recurrence: 'none',
    is_favorite: false,
    is_archived: false,
    created_at: new Date().toISOString(),
  },
  {
    id: 'demo-3',
    title: 'Kneipenquiz & Craft Beer Tasting',
    description: 'Team-Quiz mit 6 Runden voller kniffliger Fragen & tollen Bierpreisen.',
    start_time: new Date(Date.now() + 50 * 60 * 60 * 1000).toISOString(),
    end_time: new Date(Date.now() + 53 * 60 * 60 * 1000).toISOString(),
    location: 'Hopfen & Malz Pub',
    category: 'Nightlife & Party',
    is_free: true,
    price_note: 'Eintritt frei',
    source_url: 'https://instagram.com',
    recurrence: 'weekly',
    is_favorite: true,
    is_archived: false,
    created_at: new Date().toISOString(),
  },
];

export default function HomePage() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [supabaseConnected, setSupabaseConnected] = useState<boolean | null>(null);

  // Filter and Tab state
  const [activeTab, setActiveTab] = useState<TabType>('discover');
  const [timeScope, setTimeScope] = useState<FilterTimeScope>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('Alle');
  const [onlyFree, setOnlyFree] = useState(false);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EventItem | null>(null);

  // Load events from Supabase or localStorage / fallback
  const fetchEvents = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('start_time', { ascending: true });

      if (error) {
        throw error;
      }

      if (data) {
        setEvents(data as EventItem[]);
        setSupabaseConnected(true);
      }
    } catch (err: unknown) {
      console.warn('Supabase fetch notice (using cached/demo data if table not ready):', err);
      setSupabaseConnected(false);

      // Try local storage fallback
      const cached = localStorage.getItem('local_events_backup');
      if (cached) {
        try {
          setEvents(JSON.parse(cached));
        } catch {
          setEvents(INITIAL_DEMO_EVENTS);
        }
      } else {
        setEvents(INITIAL_DEMO_EVENTS);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Sync to local backup whenever events change
  useEffect(() => {
    if (events.length > 0) {
      localStorage.setItem('local_events_backup', JSON.stringify(events));
    }
  }, [events]);

  // Save (create or update) event
  const handleSaveEvent = async (eventData: Partial<EventItem>) => {
    if (editingEvent) {
      // Update
      const updatedItem: EventItem = {
        ...editingEvent,
        ...eventData,
      } as EventItem;

      // Optimistic update
      setEvents((prev) => prev.map((e) => (e.id === editingEvent.id ? updatedItem : e)));

      if (supabaseConnected) {
        try {
          await supabase.from('events').update(eventData).eq('id', editingEvent.id);
        } catch (e) {
          console.error('Failed to update in Supabase:', e);
        }
      }
    } else {
      // Create new
      const newId = crypto.randomUUID();
      const newItem: EventItem = {
        id: newId,
        title: eventData.title || '',
        description: eventData.description || null,
        start_time: eventData.start_time || new Date().toISOString(),
        end_time: eventData.end_time || null,
        location: eventData.location || null,
        category: eventData.category || 'Allgemein',
        is_free: Boolean(eventData.is_free),
        price_note: eventData.price_note || null,
        source_url: eventData.source_url || null,
        recurrence: eventData.recurrence || 'none',
        is_favorite: false,
        is_archived: false,
        created_at: new Date().toISOString(),
      };

      // Optimistic update
      setEvents((prev) => [...prev, newItem]);

      if (supabaseConnected) {
        try {
          const { id: _, ...insertPayload } = newItem;
          const { data } = await supabase.from('events').insert([insertPayload]).select();
          if (data && data[0]) {
            setEvents((prev) => prev.map((e) => (e.id === newId ? (data[0] as EventItem) : e)));
          }
        } catch (e) {
          console.error('Failed to insert in Supabase:', e);
        }
      }
    }
  };

  // Toggle favorite
  const handleToggleFavorite = async (id: string, current: boolean) => {
    const nextVal = !current;
    setEvents((prev) => prev.map((e) => (e.id === id ? { ...e, is_favorite: nextVal } : e)));

    if (supabaseConnected) {
      try {
        await supabase.from('events').update({ is_favorite: nextVal }).eq('id', id);
      } catch (e) {
        console.error('Failed to update favorite status:', e);
      }
    }
  };

  // Toggle archive
  const handleToggleArchive = async (id: string, current: boolean) => {
    const nextVal = !current;
    setEvents((prev) => prev.map((e) => (e.id === id ? { ...e, is_archived: nextVal } : e)));

    if (supabaseConnected) {
      try {
        await supabase.from('events').update({ is_archived: nextVal }).eq('id', id);
      } catch (e) {
        console.error('Failed to update archive status:', e);
      }
    }
  };

  // Delete event
  const handleDeleteEvent = async (id: string) => {
    if (!confirm('Möchtest du dieses Event wirklich löschen?')) return;

    setEvents((prev) => prev.filter((e) => e.id !== id));

    if (supabaseConnected) {
      try {
        await supabase.from('events').delete().eq('id', id);
      } catch (e) {
        console.error('Failed to delete event:', e);
      }
    }
  };

  // Move all past events to archive with 1 click
  const handleArchiveAllPast = async () => {
    const pastIds = events
      .filter((e) => !e.is_archived && isPastEvent(e))
      .map((e) => e.id);

    if (pastIds.length === 0) return;

    setEvents((prev) =>
      prev.map((e) => (pastIds.includes(e.id) ? { ...e, is_archived: true } : e))
    );

    if (supabaseConnected) {
      try {
        await supabase.from('events').update({ is_archived: true }).in('id', pastIds);
      } catch (e) {
        console.error('Failed to archive past events:', e);
      }
    }
  };

  // Edit action
  const handleOpenEdit = (event: EventItem) => {
    setEditingEvent(event);
    setIsModalOpen(true);
  };

  const handleOpenCreate = () => {
    setEditingEvent(null);
    setIsModalOpen(true);
  };

  // Partition events into Active and Archived
  const activeEvents = useMemo(
    () => events.filter((e) => !e.is_archived),
    [events]
  );

  const archivedEvents = useMemo(
    () => events.filter((e) => e.is_archived),
    [events]
  );

  const favoriteEvents = useMemo(
    () => activeEvents.filter((e) => e.is_favorite),
    [activeEvents]
  );

  // Past events among active ones
  const pastActiveCount = useMemo(
    () => activeEvents.filter((e) => isPastEvent(e)).length,
    [activeEvents]
  );

  // Filter active events according to header controls
  const displayedActiveEvents = useMemo(() => {
    let list = activeEvents;

    // Time scope filter
    list = filterEventsByScope(list, timeScope);

    // Free filter
    if (onlyFree) {
      list = list.filter((e) => e.is_free);
    }

    // Category filter
    if (selectedCategory !== 'Alle') {
      list = list.filter((e) => e.category === selectedCategory);
    }

    return list;
  }, [activeEvents, timeScope, onlyFree, selectedCategory]);

  // Group events for the Discover view
  const grouped = useMemo(() => groupEvents(displayedActiveEvents), [displayedActiveEvents]);

  return (
    <div className="flex-1 flex flex-col max-w-lg mx-auto w-full min-h-screen bg-[#090d16] text-slate-100 pb-28">
      {/* iOS Install Guide Banner */}
      <InstallPrompt />

      {/* Header with Quick Filters */}
      <Header
        currentScope={timeScope}
        onScopeChange={setTimeScope}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        onlyFree={onlyFree}
        onToggleOnlyFree={() => setOnlyFree((prev) => !prev)}
        totalActiveCount={activeEvents.length}
      />

      {/* Supabase Notice Banner if not yet configured in DB */}
      {supabaseConnected === false && (
        <div className="mx-4 mt-3 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-200 text-xs flex items-start gap-2.5">
          <Database className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-semibold block text-amber-300">
              Supabase-Tabelle noch nicht initialisiert
            </span>
            <span className="text-[11px] text-amber-200/80">
              Führe das Skript <code className="bg-amber-950/60 px-1 py-0.5 rounded">supabase-setup.sql</code> in deinem Supabase SQL Editor aus. Bis dahin läuft die App lokal mit Speicher.
            </span>
          </div>
        </div>
      )}

      {/* Past Events Auto-Archive Notice Banner */}
      {pastActiveCount > 0 && activeTab === 'discover' && (
        <div className="mx-4 mt-3 p-3 rounded-2xl bg-slate-800/80 border border-slate-700/80 text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-slate-300">
            <ArchiveRestore className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <span>
              {pastActiveCount} {pastActiveCount === 1 ? 'vergangenes Event' : 'vergangene Events'} gefunden
            </span>
          </div>
          <button
            onClick={handleArchiveAllPast}
            className="px-2.5 py-1 rounded-lg bg-slate-700 hover:bg-slate-600 text-amber-300 text-[11px] font-semibold transition active:scale-95 whitespace-nowrap"
          >
            Ins Archiv verschieben
          </button>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 px-4 pt-4 space-y-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
            <RefreshCw className="w-8 h-8 animate-spin text-indigo-500" />
            <p className="text-sm">Lade deine Events...</p>
          </div>
        ) : activeTab === 'discover' ? (
          // ==================== DISCOVER TAB ====================
          <>
            {displayedActiveEvents.length === 0 ? (
              <div className="text-center py-16 px-4">
                <div className="w-16 h-16 mx-auto mb-4 rounded-3xl bg-slate-800/60 border border-slate-700 flex items-center justify-center text-slate-400">
                  <CalendarX className="w-8 h-8 text-slate-500" />
                </div>
                <h3 className="text-base font-bold text-white mb-1">
                  Keine Events gefunden
                </h3>
                <p className="text-xs text-slate-400 max-w-xs mx-auto mb-5 leading-relaxed">
                  Für den gewählten Filterzeitraum gibt es momentan keine Einträge. Erstelle einfach dein erstes Event!
                </p>
                <button
                  onClick={handleOpenCreate}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 active:scale-95 transition"
                >
                  <Plus className="w-4 h-4" />
                  <span>Jetzt Event eintragen</span>
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Heute */}
                {grouped.today.length > 0 && (
                  <section className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                        Heute
                      </h2>
                      <span className="text-xs text-slate-400 font-medium">
                        ({grouped.today.length})
                      </span>
                    </div>
                    <div className="space-y-3">
                      {grouped.today.map((event) => (
                        <EventCard
                          key={event.id}
                          event={event}
                          onToggleFavorite={handleToggleFavorite}
                          onToggleArchive={handleToggleArchive}
                          onEdit={handleOpenEdit}
                          onDelete={handleDeleteEvent}
                        />
                      ))}
                    </div>
                  </section>
                )}

                {/* Morgen */}
                {grouped.tomorrow.length > 0 && (
                  <section className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-blue-400" />
                      <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                        Morgen
                      </h2>
                      <span className="text-xs text-slate-400 font-medium">
                        ({grouped.tomorrow.length})
                      </span>
                    </div>
                    <div className="space-y-3">
                      {grouped.tomorrow.map((event) => (
                        <EventCard
                          key={event.id}
                          event={event}
                          onToggleFavorite={handleToggleFavorite}
                          onToggleArchive={handleToggleArchive}
                          onEdit={handleOpenEdit}
                          onDelete={handleDeleteEvent}
                        />
                      ))}
                    </div>
                  </section>
                )}

                {/* Dieses Wochenende */}
                {grouped.thisWeekend.length > 0 && (
                  <section className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-purple-400" />
                      <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                        Dieses Wochenende
                      </h2>
                      <span className="text-xs text-slate-400 font-medium">
                        ({grouped.thisWeekend.length})
                      </span>
                    </div>
                    <div className="space-y-3">
                      {grouped.thisWeekend.map((event) => (
                        <EventCard
                          key={event.id}
                          event={event}
                          onToggleFavorite={handleToggleFavorite}
                          onToggleArchive={handleToggleArchive}
                          onEdit={handleOpenEdit}
                          onDelete={handleDeleteEvent}
                        />
                      ))}
                    </div>
                  </section>
                )}

                {/* Demnächst / Später */}
                {grouped.later.length > 0 && (
                  <section className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-indigo-400" />
                      <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                        Demnächst
                      </h2>
                      <span className="text-xs text-slate-400 font-medium">
                        ({grouped.later.length})
                      </span>
                    </div>
                    <div className="space-y-3">
                      {grouped.later.map((event) => (
                        <EventCard
                          key={event.id}
                          event={event}
                          onToggleFavorite={handleToggleFavorite}
                          onToggleArchive={handleToggleArchive}
                          onEdit={handleOpenEdit}
                          onDelete={handleDeleteEvent}
                        />
                      ))}
                    </div>
                  </section>
                )}
              </div>
            )}
          </>
        ) : activeTab === 'favorites' ? (
          // ==================== FAVORITES TAB ====================
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-1 border-b border-slate-800">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <span>❤️</span> Gespeicherte Favoriten ({favoriteEvents.length})
              </h2>
            </div>

            {favoriteEvents.length === 0 ? (
              <div className="text-center py-16 px-4">
                <div className="w-16 h-16 mx-auto mb-4 rounded-3xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                  <span className="text-2xl">❤️</span>
                </div>
                <h3 className="text-base font-bold text-white mb-1">
                  Noch keine Favoriten
                </h3>
                <p className="text-xs text-slate-400 max-w-xs mx-auto mb-4">
                  Tippe auf das Herz-Symbol auf einer beliebigen Event-Karte, um sie dir für später zu merken.
                </p>
                <button
                  onClick={() => setActiveTab('discover')}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-200 text-xs font-medium border border-slate-700"
                >
                  Zu den Events
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {favoriteEvents.map((event) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    onToggleFavorite={handleToggleFavorite}
                    onToggleArchive={handleToggleArchive}
                    onEdit={handleOpenEdit}
                    onDelete={handleDeleteEvent}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          // ==================== ARCHIVE TAB ====================
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-1 border-b border-slate-800">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <span>📦</span> Archivierte Events ({archivedEvents.length})
              </h2>
              {archivedEvents.length > 0 && (
                <span className="text-[11px] text-slate-400">
                  Wiederherstellbar
                </span>
              )}
            </div>

            {archivedEvents.length === 0 ? (
              <div className="text-center py-16 px-4">
                <div className="w-16 h-16 mx-auto mb-4 rounded-3xl bg-slate-800/60 border border-slate-700 flex items-center justify-center text-slate-400">
                  <span className="text-2xl">📦</span>
                </div>
                <h3 className="text-base font-bold text-white mb-1">
                  Archiv ist leer
                </h3>
                <p className="text-xs text-slate-400 max-w-xs mx-auto">
                  Vergangene oder erledigte Events können archiviert werden und bleiben hier aufbewahrt.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {archivedEvents.map((event) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    onToggleFavorite={handleToggleFavorite}
                    onToggleArchive={handleToggleArchive}
                    onEdit={handleOpenEdit}
                    onDelete={handleDeleteEvent}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Modal for Creating / Editing Events */}
      <EventModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingEvent(null);
        }}
        onSave={handleSaveEvent}
        editEvent={editingEvent}
      />

      {/* Bottom Navigation Bar */}
      <BottomNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onOpenCreate={handleOpenCreate}
        favoritesCount={favoriteEvents.length}
        archiveCount={archivedEvents.length}
      />
    </div>
  );
}
