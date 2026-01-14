# Oryginalny prompt - DumpDay MVP

Poniżej znajduje się oryginalny prompt z wymaganiami dla MVP DumpDay.

---

Mam już działający boilerplate Symfony 7 + React 19 + TypeScript + Redux + shadcn/ui + Docker.

Zbuduj MVP aplikacji "DumpDay" - narzędzie do planowania dnia dla osób z ADHD.

## Branding

Nazwa: DumpDay
Prosty branding:
- Logo: nazwa "DumpDay" tekstowo, nowoczesna czcionka sans-serif
- Kolory: stonowane, przyjazne dla oczu (np. odcienie szarości + jeden akcent)
- Tagline: "Dump your thoughts. Own your day."

## Główna funkcjonalność

Jeden ekran z następującymi sekcjami:

### 1. Switcher dni (góra ekranu)
- Nawigacja między dniami (poprzedni/następny)
- Wyświetlanie aktualnej daty
- Domyślnie pokazuje dzisiaj

### 2. Brain dump (lewa strona)
- Duży textarea na swobodne wpisywanie myśli
- Analiza przez AI po 2-3 sekundach od przestania pisania (debounce)
- Przycisk "Analizuj" jako alternatywa

### 3. Wyniki analizy (środek)

AI parsuje brain dump i wyciąga:

TODO na dzisiaj:
- Lista tasków z checkboxami

TODO na konkretny dzień:
- Lista z datą przy każdym tasku

TODO someday:
- Lista rzeczy bez konkretnego terminu

Notatki:
- Wyciągnięte informacje typu adresy, kwoty, detale

Journal:
- Wpisy dotyczące emocji, samopoczucia

Każdy wynik można edytować/usunąć przed zapisaniem.

### 4. Harmonogram dnia (prawa strona)
- Pionowy timeline, bloki godzinowe, minimalistyczny styl jak Google Calendar
- Pokazuje eventy wyciągnięte z brain dumpa
- Automatyczne układanie:
  - Jeśli czas nie podany - zakłada sensowne defaulty (praca 8h, spotkanie 1h)
  - 15 min przerwy między eventami
  - Nakładające się eventy są rozbijane

## Przykład działania

Input (brain dump):

Dzisiaj niezbyt się wyspałem. Mam do zrobienia dzisiaj w pracy sporo rzeczy, muszę dokończyć zadanie IK-123 i IK-15. IK-18 jest do zrobienia w przyszły czwartek. Na 12:00 mam dzisiaj fryzjera, muszę się więc urwać z pracy. Muszę pamiętać żeby oddać fryzjerowi 10zł. Fryzjer jest na ulicy Królewieckiej 20. Koniecznie po drodze muszę wynieść śmieci. A wracając kupić coś sobie na obiad. Trochę mi smutno z tego powodu, że nie mogę sobie dzisiaj pograć, ale nie mam czasu, może uda się jednak to zrobić w przyszłym tygodniu. Fajnie byłoby niedługo pojechać na jakąś wycieczkę.

Output:
- TODO dziś: dokończyć IK-15, dokończyć IK-123, oddać fryzjerowi 10zł, wynieść śmieci, kupić obiad
- TODO przyszły czwartek: IK-18
- TODO someday: zaplanować wycieczkę
- Notatki: adres fryzjera - Królewiecka 20
- Journal: Trochę mi smutno, że nie mogę sobie pograć...
- Harmonogram: praca 8:00-12:00, fryzjer 12:00-13:00, praca 13:15-17:15

## Architektura backend

Controller -> Facade -> Services

Struktura:
- BrainDumpController - endpoint API
- BrainDumpFacade - orkiestracja
- BrainDumpAnalyzer - wywołanie AI
- TaskExtractor, EventExtractor, JournalExtractor - serwisy domenowe
- ScheduleBuilder - budowanie harmonogramu z eventów

Prompty AI:
- Trzymane w plikach Twig w /templates/prompts/
- Renderowane z parametrami przed wysłaniem do API

Model AI:
- OpenAI gpt-4o-mini
- Klucz API przez zmienną środowiskową OPENAI_API_KEY

## Persystencja

Encje Doctrine:
- DailyNote (id, date, raw_content, created_at, updated_at)
- Task (id, daily_note_id, title, is_completed, due_date, category: today/scheduled/someday)
- Event (id, daily_note_id, title, start_time, end_time, date)
- JournalEntry (id, daily_note_id, content)
- Note (id, daily_note_id, content)

## Frontend

- Redux do stanu aplikacji
- Komponenty shadcn/ui
- Minimalistyczny, czysty design
- Responsywny layout (ale priorytet desktop)
- Header z logo DumpDay

## Endpointy API

- POST /api/brain-dump/analyze - analiza tekstu, zwraca strukturę
- POST /api/daily-note - zapisz daily note z taskami/eventami
- GET /api/daily-note/{date} - pobierz dane dla dnia
- PATCH /api/task/{id} - update tasku (np. checkbox)
- DELETE /api/task/{id} - usuń task
