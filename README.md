# 📱 Lokal Event Tracker (PWA)

Eine moderne, mobil-optimierte Progressive Web App (PWA) für lokale Events und Aktivitäten mit **Next.js 15 (App Router)**, **Tailwind CSS**, **Lucide Icons** und **Supabase** als Backend.

Speziell für **iOS Safari** ("Zum Home-Bildschirm hinzufügen") konzipiert mit Safe-Area Insets, App-Manifest und nativer App-Experience.

---

## ✨ Features

- **Mobile-First Bottom Navigation**:
  - 🧭 **Entdecken**: Übersicht aller anstehenden Events (gegliedert nach *Heute*, *Morgen*, *Dieses Wochenende*, *Demnächst*).
  - ➕ **Event erstellen**: Schnelleingabe-Modal mit Validierung und Konfetti-Effekt.
  - ❤️ **Favoriten**: Schneller Zugriff auf gemerkte Veranstaltungen.
  - 📦 **Archiv**: Vergangene oder erledigte Events mit 1-Klick-Wiederherstellung oder endgültigem Löschen.
- **Quick-Filter Leiste**:
  - Filter nach Zeitraum: *Alle*, *Heute*, *Morgen*, *Wochenende*.
  - Schnellfilter für *Kostenlose Veranstaltungen*.
  - Sparten- und Kategoriefilter (*Musik*, *Kultur*, *Nightlife*, *Food & Drinks*, *Markt* etc.).
- **Clickable Source Links**:
  - Automatische Erkennung von Instagram-Links mit individuellem Instagram-Button.
  - Branded Web-Link Button für externe Websites / Vorverkauf.
  - Google Maps Direktverlinkung bei Klick auf den Veranstaltungsort.
- **Wiederholungs-Unterstützung**:
  - Wöchentliche, zweiwöchentliche und monatliche Wiederholungs-Tags.
- **Automatisches Past-Event Handling**:
  - Erkennt abgelaufene Events und bietet ein 1-Klick-Verschieben ins Archiv an.
- **PWA & iOS Safari Optimierung**:
  - `viewport-fit=cover`, Standalone-Modus, Apple-Touch-Icons.
  - Automatisches Info-Banner für iOS Safari mit Anleitung zum Hinzufügen auf den Home-Bildschirm.

---

## 🚀 Supabase Datenbank-Setup

1. Öffne dein Projekt im [Supabase Dashboard](https://supabase.com/dashboard).
2. Gehe in den **SQL Editor**.
3. Kopiere den Inhalt der Datei [`supabase-setup.sql`](./supabase-setup.sql) hinein und klicke auf **Run**.
4. Fertig! Die Tabelle `events` sowie alle Row Level Security (RLS) Policies für anonymen Lese- und Schreibzugriff sind nun aktiv.

---

## 🛠️ Lokale Entwicklung

```bash
# Abhängigkeiten installieren
npm install

# Entwicklungsserver starten
npm run dev
```

Die App ist nun unter [http://localhost:3000](http://localhost:3000) erreichbar.

---

## 📲 Auf iOS zu Home-Bildschirm hinzufügen

1. Öffne die Web-App in **Safari** auf deinem iPhone.
2. Tippe in der unteren Leiste auf den **Teilen-Button** (Viereck mit Pfeil nach oben).
3. Scrolle etwas nach unten und wähle **"Zum Home-Bildschirm"**.
4. Bestätige mit **Hinzufügen**.
5. Die App startet nun ohne Browser-Leiste im Vollbild-Modus!
