import { NextRequest, NextResponse } from 'next/server';
import { EventItem, RecurrenceType } from '@/types';

export interface ExtractedEvent {
  id: string;
  title: string;
  description?: string | null;
  start_time: string;
  end_time?: string | null;
  location?: string | null;
  category: string;
  is_free: boolean;
  price_note?: string | null;
  source_url: string;
  recurrence: RecurrenceType;
  is_favorite: boolean;
  is_archived: boolean;
  created_at: string;
}

// Category matcher helper based on keywords
function guessCategory(text: string): string {
  const lower = text.toLowerCase();
  if (/konzert|musik|band|live|acoustic|dj|party|club|rave|techno|tanz/i.test(lower)) {
    if (/party|club|rave|techno|nightlife/i.test(lower)) return 'Nightlife & Party';
    return 'Musik & Konzerte';
  }
  if (/theater|kino|film|lesung|kabarett|kunst|ausstellung|museum|vernissage/i.test(lower)) {
    return 'Kultur & Theater';
  }
  if (/markt|flohmarkt|trödel|bazar|streetfood|food.*truck|wochenmarkt/i.test(lower)) {
    return 'Markt & Flohmarkt';
  }
  if (/bier|wein|tasting|dinner|brunch|cocktail|essen|drinks|kulinarik/i.test(lower)) {
    return 'Food & Drinks';
  }
  if (/sport|lauf|marathon|yoga|turnier|fitness|wander/i.test(lower)) {
    return 'Sport & Fitness';
  }
  if (/kinder|familie|basteln|puppen/i.test(lower)) {
    return 'Familie & Kinder';
  }
  if (/workshop|kurs|seminar|vortrag|coding|lernen/i.test(lower)) {
    return 'Workshop & Bildung';
  }
  return 'Allgemein';
}

// Extract events from Schema.org / JSON-LD
function extractFromJsonLd(html: string, fallbackUrl: string): ExtractedEvent[] {
  const events: ExtractedEvent[] = [];
  const scriptRegex = /<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match;

  while ((match = scriptRegex.exec(html)) !== null) {
    try {
      const rawContent = match[1].trim();
      if (!rawContent) continue;
      const parsed = JSON.parse(rawContent);

      const items = Array.isArray(parsed)
        ? parsed
        : parsed['@graph'] && Array.isArray(parsed['@graph'])
        ? parsed['@graph']
        : [parsed];

      for (const item of items) {
        if (!item) continue;
        const typeStr = String(item['@type'] || '');
        const isEvent =
          typeStr.toLowerCase().includes('event') ||
          typeStr === 'Festival' ||
          typeStr === 'ScreeningEvent';

        if (isEvent && (item.name || item.headline) && item.startDate) {
          const title = String(item.name || item.headline).trim();
          let startTime = '';
          try {
            startTime = new Date(item.startDate).toISOString();
          } catch {
            continue;
          }

          let endTime: string | null = null;
          if (item.endDate) {
            try {
              endTime = new Date(item.endDate).toISOString();
            } catch {
              // ignore invalid end date
            }
          }

          // Location extraction
          let location: string | null = null;
          if (typeof item.location === 'string') {
            location = item.location;
          } else if (item.location && typeof item.location === 'object') {
            const locName = item.location.name || '';
            const locAddr = item.location.address
              ? typeof item.location.address === 'string'
                ? item.location.address
                : [
                    item.location.address.streetAddress,
                    item.location.address.addressLocality,
                  ]
                    .filter(Boolean)
                    .join(', ')
              : '';
            location = [locName, locAddr].filter(Boolean).join(' • ') || null;
          }

          // Price / Offers
          let isFree = false;
          let priceNote: string | null = null;
          if (item.isAccessibleForFree === true || item.isAccessibleForFree === 'true') {
            isFree = true;
          }

          if (item.offers) {
            const offer = Array.isArray(item.offers) ? item.offers[0] : item.offers;
            if (offer) {
              if (offer.price === 0 || offer.price === '0') {
                isFree = true;
              } else if (offer.price) {
                priceNote = `${offer.price} ${offer.priceCurrency || '€'}`;
              }
            }
          }

          const description =
            typeof item.description === 'string'
              ? item.description.replace(/<[^>]+>/g, '').trim()
              : null;

          const category = guessCategory(title + ' ' + (description || ''));

          events.push({
            id: crypto.randomUUID(),
            title,
            description: description ? description.slice(0, 500) : null,
            start_time: startTime,
            end_time: endTime,
            location,
            category,
            is_free: isFree,
            price_note: isFree ? 'Kostenlos' : priceNote,
            source_url: item.url || fallbackUrl,
            recurrence: 'none',
            is_favorite: false,
            is_archived: false,
            created_at: new Date().toISOString(),
          });
        }
      }
    } catch {
      // JSON-LD block was invalid JSON, continue looking
    }
  }

  return events;
}

// Fallback: OpenGraph and standard Meta Tags
function extractFromMeta(html: string, fallbackUrl: string): ExtractedEvent | null {
  const getMeta = (prop: string) => {
    const match =
      html.match(new RegExp(`<meta\\s+property=["']${prop}["']\\s+content=["'](.*?)["']`, 'i')) ||
      html.match(new RegExp(`<meta\\s+content=["'](.*?)["']\\s+property=["']${prop}["']`, 'i')) ||
      html.match(new RegExp(`<meta\\s+name=["']${prop}["']\\s+content=["'](.*?)["']`, 'i')) ||
      html.match(new RegExp(`<meta\\s+content=["'](.*?)["']\\s+name=["']${prop}["']`, 'i'));
    return match ? match[1] : null;
  };

  const title = getMeta('og:title') || getMeta('twitter:title');
  const description = getMeta('og:description') || getMeta('description');

  if (!title) return null;

  // Check if title or page contains time/date hints
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(19, 0, 0, 0);

  return {
    id: crypto.randomUUID(),
    title: title.trim(),
    description: description ? description.slice(0, 400) : null,
    start_time: tomorrow.toISOString(),
    end_time: null,
    location: null,
    category: guessCategory(title + ' ' + (description || '')),
    is_free: false,
    price_note: null,
    source_url: fallbackUrl,
    recurrence: 'none',
    is_favorite: false,
    is_archived: false,
    created_at: new Date().toISOString(),
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { url } = body;

    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        { error: 'Bitte gib eine gültige Webseiten-URL an.' },
        { status: 400 }
      );
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
    } catch {
      return NextResponse.json(
        { error: 'Die angegebene URL ist ungültig (z.B. https://example.com/events).' },
        { status: 400 }
      );
    }

    // Fetch the HTML content
    const response = await fetch(parsedUrl.toString(), {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 (EventTracker Bot)',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'de-DE,de;q=0.9,en-US;q=0.8,en;q=0.7',
      },
      next: { revalidate: 0 },
    });

    if (!response.ok) {
      return NextResponse.json(
        {
          error: `Website konnte nicht abgerufen werden (HTTP-Status: ${response.status}). Bitte prüfe den Link.`,
        },
        { status: 400 }
      );
    }

    const html = await response.text();

    // 1. Try JSON-LD extraction
    let events = extractFromJsonLd(html, url);

    // 2. If nothing found in JSON-LD, try OpenGraph fallback
    if (events.length === 0) {
      const metaEvent = extractFromMeta(html, url);
      if (metaEvent) {
        events = [metaEvent];
      }
    }

    return NextResponse.json({
      success: true,
      count: events.length,
      events,
      sourceUrl: url,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unerwarteter Fehler beim Scannen';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
