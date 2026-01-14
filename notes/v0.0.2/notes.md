# DumpDay v0.0.2 - Notatki

## Zakres zmian

Wersja v0.0.2 skupia się na dwóch głównych obszarach:

### 1. Zmiana zachowania Brain Dump

**Problem:**
Po zapisaniu danych z analizy, pole Brain Dump nadal wyświetlało poprzednią zawartość. Również po odświeżeniu strony, rawContent był przywracany z bazy danych.

**Rozwiązanie:**
- Brain Dump textarea jest teraz czyszczone po zapisaniu (`saveDailyNote.fulfilled`)
- Po załadowaniu danych dla dnia (`fetchDailyNote.fulfilled`), rawContent jest ustawiany na pusty string
- Dane rawContent są nadal przechowywane w bazie danych, ale nie są wyświetlane użytkownikowi

**Zmienione pliki:**
- `frontend/src/store/dailyNoteSlice.ts` - modyfikacje w reducerach

### 2. Edycja i usuwanie zapisanych danych

**Problem:**
Użytkownik nie mógł edytować ani usuwać zapisanych:
- Wydarzeń (events)
- Wpisów dziennika (journal entries)
- Notatek (notes)
- Zadań (tylko toggle i delete działały)

**Rozwiązanie:**

#### Backend - Nowe kontrolery:
- `EventController.php` - PATCH/DELETE dla `/api/event/{id}`
- `JournalEntryController.php` - PATCH/DELETE dla `/api/journal/{id}`
- `NoteController.php` - PATCH/DELETE dla `/api/note/{id}`

#### Frontend - API Client:
- Rozszerzony `lib/api.ts` o metody `update` i `delete` dla event, journal, note

#### Frontend - Redux:
- Nowe thunki w `dailyNoteSlice.ts`:
  - `updateTask` - edycja tytułu zadania
  - `updateEvent` / `deleteEvent` - edycja/usuwanie wydarzeń
  - `updateJournalEntry` / `deleteJournalEntry` - edycja/usuwanie dziennika
  - `updateNote` / `deleteNote` - edycja/usuwanie notatek

#### Frontend - Komponenty UI:
- `TaskItem.tsx` - dodano inline editing z ikonami Pencil/Check/X
- `NotesList.tsx` - dodano przyciski edit/delete z inline textarea
- `JournalSection.tsx` - dodano przyciski edit/delete z inline textarea
- `EventBlock.tsx` - dodano przyciski edit/delete z formularzem (title, startTime, endTime)
- `DaySchedule.tsx` - przekazywanie handlerów do EventBlock
- `TaskList.tsx` - przekazywanie handlera onUpdate
- `AnalysisResults.tsx` - przekazywanie wszystkich handlerów

#### Frontend - Nowy komponent:
- `components/ui/input.tsx` - komponent Input dla formularzy

## Endpointy API (nowe)

| Metoda | Endpoint | Opis |
|--------|----------|------|
| PATCH | /api/event/{id} | Edycja wydarzenia (title, startTime, endTime) |
| DELETE | /api/event/{id} | Usunięcie wydarzenia |
| PATCH | /api/journal/{id} | Edycja wpisu dziennika (content) |
| DELETE | /api/journal/{id} | Usunięcie wpisu dziennika |
| PATCH | /api/note/{id} | Edycja notatki (content) |
| DELETE | /api/note/{id} | Usunięcie notatki |

## UX

Wszystkie elementy listy mają teraz przyciski edycji i usuwania, które pojawiają się przy najechaniu myszką (hover). Edycja odbywa się inline:
- Dla zadań: input text z przyciskami OK/Anuluj
- Dla notatek/dziennika: textarea z przyciskami Zapisz/Anuluj
- Dla wydarzeń: formularz z polami title i time inputs

## Testowanie

1. Zapisz brain dump i sprawdź czy textarea się czyści
2. Odśwież stronę - textarea powinna być pusta
3. Najedź na zapisane zadanie - powinny pojawić się ikony edycji i usuwania
4. Kliknij ikonę edycji - powinien pojawić się input
5. Zmień tekst i zapisz - powinno zaktualizować się w liście
6. Analogicznie dla notatek, dziennika i wydarzeń
