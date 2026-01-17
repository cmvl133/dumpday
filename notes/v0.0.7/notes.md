# Dopaminder v0.0.7 - Notatki

Data: 2026-01-16

## Zakres zmian

Wersja v0.0.7 to kompletny rebrand z DumpDay na Dopaminder z nowym punkowym motywem wizualnym.

### 1. Rebrand: DumpDay → Dopaminder

**Zmiany nazewnictwa:**
- Wszystkie wystąpienia "DumpDay" zamienione na "Dopaminder"
- Aktualizacja meta tagów HTML
- Aktualizacja Open Graph tags
- Aktualizacja Service Worker
- Aktualizacja szablonów email
- Zmiana nazwy sieci Docker

**Rotujące taglines w headerze:**
- "Where chaos meets done."
- "Stop planning. Start doing."
- "For people who hate todo apps."
- "The anti-productivity productivity app."
- "Productivity that hits different."
- "Dopamine-driven productivity."
- "Your daily dopamine dealer."

### 2. Punk Rock Theme

**Paleta kolorów:**
- Background: bardzo ciemny (#0a0a0a)
- Primary: neonowy róż (#ff2d7a)
- Accent: elektryczny niebieski (#00d4ff)
- Success: neonowa zieleń (#00ff88)
- Warning: jaskrawy żółty (#ffee00)

**Typografia:**
- Font: Space Grotesk (Google Fonts)
- Nowoczesny, geometryczny, czytelny

**Efekty wizualne:**
- Glow effects na buttonach i kartach
- Box-shadow z kolorem primary/accent
- Ostre, szybkie przejścia (150ms)

### 3. UI Enhancements

**Stylowane date/time pickers:**
- Dopasowane do ciemnego motywu
- Używają kolorów z palety punk

**Zaktualizowane konfetti:**
- Kolory dopasowane do nowej palety
- Różowy, niebieski, zielony, żółty

**Nowe animacje CSS:**
- `shake-heavy` - intensywne trzęsienie
- `pulse-glow` - pulsujące świecenie

### 4. Zmiany w komponentach UI

**Button:**
- Glow effect na hover
- Szybsze przejścia

**Card:**
- Subtelny glow na hover
- Border z primary color

**Checkbox:**
- Neonowy accent color

**Input:**
- Focus ring z primary color

## Zmienione pliki

- `frontend/index.html` - meta tagi, tytuł
- `frontend/src/index.css` - kompletna przebudowa stylów
- `frontend/tailwind.config.js` - nowe animacje
- `frontend/src/components/ui/*.tsx` - zaktualizowane style
- `frontend/src/components/layout/Header.tsx` - nowa nazwa, taglines
- `frontend/src/components/check-in/*.tsx` - kolory konfetti
- `backend/src/Service/AuthMailerService.php` - nazwa w emailach
- `docker-compose.yml` - nazwa sieci

## Porównanie wizualne

**Przed (DumpDay):**
- Stonowane kolory teal
- Spokojny, minimalistyczny design
- Brak efektów glow

**Po (Dopaminder):**
- Neonowe, punkowe kolory
- Agresywny, energetyczny design
- Świecące efekty i szybkie animacje
