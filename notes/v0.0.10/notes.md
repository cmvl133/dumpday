# Dopaminder v0.0.10 - Notatki

Data: 2026-01-17

## Zakres zmian

Wersja v0.0.10 dodaje ręczne tworzenie elementów i naprawia kilka bugów.

### 1. Ręczne dodawanie zadań, notatek i wpisów dziennika

**Funkcjonalność:**
- Inline formularze do dodawania elementów (nie modalne)
- Przycisk "+" w nagłówku każdej sekcji
- Enter zapisuje, Escape anuluje
- Shift+Enter dla nowej linii w textarea (notatki/dziennik)

**Zadania:**
- Input tekstowy na tytuł
- Sekcja "Today": dueDate = aktualna data
- Sekcja "Scheduled": kalendarz do wyboru daty (domyślnie jutro)
- Sekcja "Someday": dueDate = null

**Notatki i dziennik:**
- Textarea z placeholder
- Auto-resize textarea

**Backend - nowe endpointy:**
- `POST /api/task` - tworzenie zadania
- `POST /api/note` - tworzenie notatki
- `POST /api/journal` - tworzenie wpisu dziennika

**Frontend - nowe thunki Redux:**
- `createTask` - z obsługą kategorii i dueDate
- `createNote` - z datą
- `createJournalEntry` - z datą

### 2. Naprawione tłumaczenia i18n

**Problem:**
Wersja angielska zawierała hardcoded polskie słowa:
- "Jutro" zamiast "Tomorrow"
- "dzisiaj" zamiast "today"
- "Harmonogram" zamiast "Schedule"
- "Brak zadań" zamiast "No tasks"
- "Brak zaplanowanych wydarzeń" zamiast "No scheduled events"

**Rozwiązanie:**
- Dodano brakujące klucze tłumaczeń
- Zaktualizowano komponenty używające hardcoded tekstu
- `DaySwitcher.tsx` - locale-aware formatowanie dat
- `DaySchedule.tsx` - przetłumaczony tytuł i empty state
- `App.tsx` - przetłumaczone stany ładowania

### 3. Naprawione kolory hover buttonów

**Problem:**
- Hover na buttonach pokazywał niebieskie tło (accent color)
- Powinno być różowe (primary color)

**Rozwiązanie:**
- `button.tsx`: zmiana `hover:bg-accent/10` na `hover:bg-primary/10`
- Dotyczy wariantów: outline, ghost

### 4. Fix check-in modal - ciągłe wyskakiwanie

**Problem:**
- Modal check-in wyskakiwał co chwilę po zamknięciu
- `lastCheckInAt` było aktualizowane tylko przy ukończeniu check-in
- Zamknięcie bez ukończenia nie resetowało timera

**Rozwiązanie:**
- `checkInSlice.ts`: ustawienie `lastCheckInAt` w `openCheckIn` reducer
- Zamknięcie modala (bez ukończenia) teraz też resetuje timer

### 5. Fix check-in modal - horizontal scrollbar

**Problem:**
- Przy przechodzeniu przez taski pojawiał się horizontal scrollbar
- Spowodowane animacją swipe (`translate-x-[100%]`)

**Rozwiązanie:**
- `CheckInModal.tsx`: dodanie `overflow-x-hidden` do DialogContent

## Nowe endpointy API

| Metoda | Endpoint | Opis |
|--------|----------|------|
| POST | /api/task | Tworzenie zadania (title, date, dueDate?, category?) |
| POST | /api/note | Tworzenie notatki (content, date) |
| POST | /api/journal | Tworzenie wpisu dziennika (content, date) |

## Nowe klucze i18n

```json
{
  "tasks": {
    "addNote": "Add note",
    "addEntry": "Add entry",
    "notePlaceholder": "Note something...",
    "journalPlaceholder": "How are you feeling?",
    "noNotes": "No notes yet",
    "noEntries": "No entries yet",
    "newLine": "new line"
  },
  "schedule": {
    "title": "Schedule",
    "noEvents": "No scheduled events"
  },
  "app": {
    "noData": "No data for this day",
    "startTyping": "Start typing in the Brain Dump section..."
  }
}
```

## Testowanie

1. Kliknij "+" w sekcji Today - dodaj zadanie, sprawdź czy ma datę dzisiejszą
2. Kliknij "+" w sekcji Scheduled - wybierz datę, sprawdź kategoryzację
3. Kliknij "+" w Notes - dodaj notatkę, Shift+Enter dla nowej linii
4. Zmień język na English - sprawdź czy nie ma polskich słów
5. Najedź na button "Today" w date switcherze - hover powinien być różowy
6. Otwórz i zamknij check-in - nie powinien wyskakiwać od razu ponownie
7. Przejdź przez check-in - nie powinno być horizontal scrollbar
