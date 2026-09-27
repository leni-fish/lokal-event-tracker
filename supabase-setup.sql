-- ==============================================================================
-- Supabase Schema & RLS Setup für Lokal Event Tracker
-- ==============================================================================

-- 1. Tabelle 'events' erstellen
CREATE TABLE IF NOT EXISTS public.events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ,
    location TEXT,
    category TEXT DEFAULT 'Allgemein',
    is_free BOOLEAN DEFAULT false,
    price_note TEXT,
    source_url TEXT,
    recurrence TEXT DEFAULT 'none', -- 'none', 'weekly', 'biweekly', 'monthly'
    is_favorite BOOLEAN DEFAULT false,
    is_archived BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Indizes für schnelle Abfragen
CREATE INDEX IF NOT EXISTS idx_events_start_time ON public.events (start_time ASC);
CREATE INDEX IF NOT EXISTS idx_events_is_archived ON public.events (is_archived);
CREATE INDEX IF NOT EXISTS idx_events_is_favorite ON public.events (is_favorite);

-- 2. Row Level Security (RLS) aktivieren
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies für anonymen Lese- und Schreibzugriff (V1 ohne Auth)
-- Lesen
DROP POLICY IF EXISTS "Allow anon read events" ON public.events;
CREATE POLICY "Allow anon read events"
    ON public.events
    FOR SELECT
    TO anon, authenticated
    USING (true);

-- Erstellen
DROP POLICY IF EXISTS "Allow anon insert events" ON public.events;
CREATE POLICY "Allow anon insert events"
    ON public.events
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

-- Aktualisieren
DROP POLICY IF EXISTS "Allow anon update events" ON public.events;
CREATE POLICY "Allow anon update events"
    ON public.events
    FOR UPDATE
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

-- Löschen
DROP POLICY IF EXISTS "Allow anon delete events" ON public.events;
CREATE POLICY "Allow anon delete events"
    ON public.events
    FOR DELETE
    TO anon, authenticated
    USING (true);

-- 4. Beispieldaten einfügen (optional zum direkten Testen)
INSERT INTO public.events (title, description, start_time, end_time, location, category, is_free, price_note, source_url, recurrence, is_favorite, is_archived)
VALUES
(
    'Wochenmarkt & Straßenmusik',
    'Frische regionale Produkte, Foodtrucks und gemütliche Live-Akustikmusik auf dem Marktplatz.',
    now() + INTERVAL '2 hours',
    now() + INTERVAL '5 hours',
    'Marktplatz / Altstadt',
    'Markt',
    true,
    'Eintritt frei',
    'https://instagram.com',
    'weekly',
    true,
    false
),
(
    'Open-Air Kino im Stadtpark',
    'Filmvorführung unter freiem Himmel. Bringt eure eigenen Picknickdecken mit!',
    now() + INTERVAL '1 day' + INTERVAL '3 hours',
    now() + INTERVAL '1 day' + INTERVAL '6 hours',
    'Stadtpark Wiese Süd',
    'Kultur',
    false,
    '8,50 € / ermäßigt 6 €',
    'https://instagram.com',
    'none',
    false,
    false
),
(
    'Kneipenquiz & Craft Beer',
    'Teams von 2-6 Personen. Spannende Fragen zu Allgemeinwissen, Musik und Popkultur.',
    now() + INTERVAL '2 days' + INTERVAL '4 hours',
    now() + INTERVAL '2 days' + INTERVAL '7 hours',
    'Hopfen & Malz Pub',
    'Nightlife',
    true,
    'Eintritt frei (Spende erwünscht)',
    'https://instagram.com',
    'weekly',
    true,
    false
),
(
    'Flohmarkt am Kanal',
    'Großer Vintage- und Trödelmarkt entlang der Uferpromenade mit Kaffee & Waffeln.',
    now() + INTERVAL '3 days' + INTERVAL '1 hour',
    now() + INTERVAL '3 days' + INTERVAL '6 hours',
    'Kanalpromenade',
    'Markt',
    true,
    'Freier Eintritt',
    'https://instagram.com',
    'monthly',
    false,
    false
);
