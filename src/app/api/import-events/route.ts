import { NextRequest, NextResponse } from 'next/server';
import { EventItem, RecurrenceType, EVENT_CATEGORIES } from '@/types';

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

// Convert HTML to clean readable text
function htmlToCleanText(html: string): string {
  let text = html;

  // Remove scripts, styles, SVGs, navs, footers, headers
  text = text.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ');
  text = text.replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ');
  text = text.replace(/<svg\b[^>]*>[\s\S]*?<\/svg>/gi, ' ');
  text = text.replace(/<noscript\b[^>]*>[\s\S]*?<\/noscript>/gi, ' ');
  text = text.replace(/<nav\b[^>]*>[\s\S]*?<\/nav>/gi, ' ');
  text = text.replace(/<footer\b[^>]*>[\s\S]*?<\/footer>/gi, ' ');

  // Replace block elements with newlines
  text = text.replace(/<\/(p|div|h[1-6]|li|tr|article|section)>/gi, '\n');
  text = text.replace(/<br\s*[\/]?>/gi, '\n');

  // Strip all other HTML tags
  text = text.replace(/<[^>]+>/g, ' ');

  // Decode common HTML entities
  text = text
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&euro;/gi, '€');

  // Collapse multiple spaces and blank lines
  text = text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .join('\n');

  return text.slice(0, 35000); // 35k chars is plenty for Gemini Flash
}

// Extract using Google Gemini 1.5 Flash
async function extractWithGemini(
  text: string,
  apiKey: string,
  sourceUrl: string
): Promise<ExtractedEvent[]> {
  const now = new Date();
  const currentDateStr = now.toISOString();

  const prompt = `Du bist ein intelligenter Event- und Kalender-Parser.
Hier ist der bereinigte Textinhalt einer Webseite mit Veranstaltungen / Kalender:
==================================================
${text}
==================================================

HEUTIGES DATUM ALS REFERENZ: ${currentDateStr} (Mitteleuropäische Zeit).

AUFGABE:
Extrahiere ALLE anstehenden Events, Konzerte, Partys, Märkte, Workshops, Lesungen, Aufführungen oder Aktivitäten aus dem Text.
Ignoriere allgemeine Webseiten-Texte wie Impressum, Cookie-Banner, Ticket-Shop-Navigation oder Allgemeine Geschäftsbedingungen.

Gib das Ergebnis STRENG als valides JSON-Array zurück (ohne Markdown, ohne \`\`\`json Backticks, nur das rohe JSON Array):
[
  {
    "title": "Prägnanter Name der Veranstaltung",
    "description": "Kurze Zusammenfassung (1-2 Sätze) oder null",
    "start_time": "Gültiger ISO 8601 Datums- & Zeit-String (z.B. 2026-10-04T20:00:00+02:00)",
    "end_time": "Gültiger ISO 8601 Datums- & Zeit-String oder null falls unbekannt",
    "location": "Veranstaltungsort (z.B. Clubname, Straße oder Stadt) oder null",
    "category": "Eines von: Musik & Konzerte, Kultur & Theater, Nightlife & Party, Food & Drinks, Markt & Flohmarkt, Sport & Fitness, Familie & Kinder, Workshop & Bildung, Allgemein",
    "is_free": true oder false,
    "price_note": "Preisangabe (z.B. '15 €' oder 'Kostenlos') oder null"
  }
]

Falls im Text keine konkreten Events oder Termine gefunden werden, gib ein leeres Array [] zurück.`;

  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.1,
        responseMimeType: 'application/json',
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Gemini API Error:', response.status, errorText);
    throw new Error(
      `Gemini API Fehler (${response.status}): Bitte prüfe, ob dein Gemini API-Key korrekt ist.`
    );
  }

  const result = await response.json();
  const rawJson = result?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!rawJson) return [];

  // Parse JSON
  let parsedArray: any[] = [];
  try {
    parsedArray = JSON.parse(rawJson);
  } catch (err) {
    // Attempt to extract array from string if wrapped
    const arrayMatch = rawJson.match(/\[\s*\{[\s\S]*\}\s*\]/);
    if (arrayMatch) {
      parsedArray = JSON.parse(arrayMatch[0]);
    } else {
      throw new Error('Die KI konnte die Events nicht in gültiges JSON formatieren.');
    }
  }

  if (!Array.isArray(parsedArray)) return [];

  return parsedArray
    .filter((item) => item && item.title && item.start_time)
    .map((item) => {
      // Validate start_time
      let start_time = item.start_time;
      try {
        start_time = new Date(item.start_time).toISOString();
      } catch {
        start_time = new Date().toISOString();
      }

      let end_time: string | null = null;
      if (item.end_time) {
        try {
          end_time = new Date(item.end_time).toISOString();
        } catch {
          end_time = null;
        }
      }

      const validCategory = EVENT_CATEGORIES.includes(item.category)
        ? item.category
        : 'Allgemein';

      return {
        id: crypto.randomUUID(),
        title: String(item.title).trim(),
        description: item.description ? String(item.description).trim() : null,
        start_time,
        end_time,
        location: item.location ? String(item.location).trim() : null,
        category: validCategory,
        is_free: Boolean(item.is_free),
        price_note: item.price_note ? String(item.price_note).trim() : null,
        source_url: sourceUrl,
        recurrence: 'none',
        is_favorite: false,
        is_archived: false,
        created_at: new Date().toISOString(),
      };
    });
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

        // Check if it's a real event, avoiding generic items
        const rawTitle = String(item.name || item.headline || '').trim();
        const isGenericTitle = /^(home|startseite|ticketshop|tickets|shop|kontakt|events)$/i.test(
          rawTitle
        );

        if (isEvent && rawTitle && !isGenericTitle && item.startDate) {
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
              // ignore
            }
          }

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

          const category = guessCategory(rawTitle + ' ' + (description || ''));

          events.push({
            id: crypto.randomUUID(),
            title: rawTitle,
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
      // ignore JSON parse errors
    }
  }

  return events;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { url, apiKey } = body;

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

    // Determine Gemini API Key (either from user request body or environment variable)
    const geminiKey = apiKey || process.env.GEMINI_API_KEY;

    // Fetch the HTML content
    const response = await fetch(parsedUrl.toString(), {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
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

    // 1. If Gemini API key is provided, use Gemini AI extraction (highest quality & reads ANY website)
    if (geminiKey && geminiKey.trim().length > 10) {
      try {
        const cleanText = htmlToCleanText(html);
        const aiEvents = await extractWithGemini(cleanText, geminiKey.trim(), url);

        return NextResponse.json({
          success: true,
          method: 'ai',
          count: aiEvents.length,
          events: aiEvents,
          sourceUrl: url,
        });
      } catch (geminiError: unknown) {
        console.warn('Gemini extraction failed, falling back to JSON-LD:', geminiError);
        // Fall back to JSON-LD if Gemini fails
      }
    }

    // 2. Fallback to native Schema.org / JSON-LD extraction
    const events = extractFromJsonLd(html, url);

    return NextResponse.json({
      success: true,
      method: 'schema',
      count: events.length,
      events,
      sourceUrl: url,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unerwarteter Fehler beim Scannen';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
