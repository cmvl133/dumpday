# DumpDay v0.0.1 - MVP

Data: 2026-01-13

## Cel wersji

Stworzenie MVP aplikacji DumpDay - narzędzia do planowania dnia dla osób z ADHD. Główna idea to "brain dump" - swobodne wpisywanie myśli, które są następnie analizowane przez AI i organizowane w użyteczną strukturę.

## Co zostało zaimplementowane

### Backend (Symfony 7.4)

**Encje Doctrine:**
- `DailyNote` - główna encja przechowująca dane dnia (date, rawContent, timestamps)
- `Task` - zadania z kategoryzacją (today/scheduled/someday), statusem ukończenia i opcjonalną datą
- `Event` - wydarzenia z czasem rozpoczęcia/zakończenia
- `JournalEntry` - wpisy dziennika (emocje, refleksje)
- `Note` - notatki (adresy, kwoty, informacje faktyczne)

**Architektura Controller → Facade → Services:**
- `BrainDumpController` - endpoint analizy AI
- `DailyNoteController` - CRUD dla notatek dziennych
- `TaskController` - zarządzanie zadaniami (toggle, delete)
- `BrainDumpFacade` - orkiestracja całego procesu
- Serwisy ekstrakcji: `TaskExtractor`, `EventExtractor`, `JournalExtractor`, `NoteExtractor`
- `ScheduleBuilder` - budowanie harmonogramu z eventów
- `BrainDumpAnalyzer` - integracja z OpenAI API

**Endpointy API:**
- `POST /api/brain-dump/analyze` - analiza tekstu przez AI
- `GET /api/daily-note/{date}` - pobranie danych dla dnia
- `POST /api/daily-note` - zapis notatki z analizą
- `PATCH /api/task/{id}` - aktualizacja zadania
- `DELETE /api/task/{id}` - usunięcie zadania

**Prompt AI:**
- Trzymany w Twig template (`templates/prompts/brain_dump_analysis.twig`)
- Instrukcje po polsku, dopasowane do kontekstu ADHD
- Zwraca strukturyzowany JSON

### Frontend (React 19 + TypeScript)

**Layout 3-kolumnowy:**
1. **Lewa strona** - Brain Dump textarea z debounce 2.5s
2. **Środek** - Wyniki analizy (TODO today/scheduled/someday, notatki, dziennik)
3. **Prawa strona** - Harmonogram dnia (timeline jak Google Calendar)

**Komponenty:**
- Layout: `Header`, `DaySwitcher`
- Brain Dump: `BrainDumpInput`
- Analiza: `AnalysisResults`, `TaskList`, `TaskItem`, `NotesList`, `JournalSection`
- Harmonogram: `DaySchedule`, `TimeSlot`, `EventBlock`
- UI: `Button`, `Card`, `Checkbox`, `Textarea`, `Badge`, `ScrollArea`, `Separator`

**Stan aplikacji (Redux Toolkit):**
- `dailyNoteSlice` - zarządzanie stanem dnia, analizy, zadań
- Async thunks dla operacji API
- Debounce na automatyczną analizę

**Styling:**
- Tailwind CSS z CSS variables
- Stonowane kolory przyjazne dla ADHD (teal accent)
- shadcn/ui komponenty

### Infrastruktura

- Docker Compose z 4 serwisami: nginx, php, node, postgres
- Hot reload dla frontend i backend
- PostgreSQL 16 jako baza danych

## Przykład działania

**Input (brain dump):**
```
Dzisiaj niezbyt się wyspałem. Mam do zrobienia dzisiaj w pracy sporo rzeczy,
muszę dokończyć zadanie IK-123 i IK-15. IK-18 jest do zrobienia w przyszły
czwartek. Na 12:00 mam dzisiaj fryzjera, muszę się więc urwać z pracy.
Muszę pamiętać żeby oddać fryzjerowi 10zł. Fryzjer jest na ulicy Królewieckiej 20.
```

**Output:**
- TODO dziś: dokończyć IK-15, dokończyć IK-123, oddać fryzjerowi 10zł
- TODO przyszły czwartek: IK-18
- Notatki: adres fryzjera - Królewiecka 20
- Journal: Dzisiaj niezbyt się wyspałem...
- Harmonogram: fryzjer 12:00-13:00

## Znane ograniczenia

1. Brak autentykacji - aplikacja jednoosobowa
2. Brak dark mode toggle (style zdefiniowane, brak UI do przełączania)
3. Brak edycji zadań inline (tylko toggle i delete)
4. Brak drag & drop w harmonogramie

## Wymagania do uruchomienia

1. Docker i Docker Compose
2. Klucz API OpenAI (ustawić w `backend/.env` jako `OPENAI_API_KEY`)
3. Port 8080 wolny (nginx) i 3000/5173 (frontend)

## Uruchomienie

```bash
make dev
# Frontend: http://localhost:3000
# API: http://localhost:8080/api
```
