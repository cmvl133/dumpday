# Dopaminder v0.0.3 - Notatki

Data: 2026-01-14

## Zakres zmian

Wersja v0.0.3 skupia się na ulepszeniach harmonogramu, lepszym przetwarzaniu AI i wyświetlaniu zaplanowanych zadań.

### 1. Harmonogram i wydarzenia

**Nakładające się wydarzenia:**
- Wydarzenia nakładające się czasowo wyświetlają się teraz w kolumnach obok siebie
- Algorytm automatycznie oblicza liczbę kolumn i pozycję każdego wydarzenia

**UI wydarzeń:**
- Bloki wydarzeń pokazują tylko tytuł (czas widoczny poprzez pozycję + tooltip)
- Tytuły wieloliniowe z `line-clamp` zamiast obcinania
- Przyciski akcji pojawiają się na hover z tłem

**Zmienione pliki:**
- `frontend/src/components/schedule/DaySchedule.tsx` - algorytm layoutu kolumnowego
- `frontend/src/components/schedule/EventBlock.tsx` - nowy design UI

### 2. Ulepszenia promptu AI

**Lepsza obsługa dat i czasu:**
- Poprawne parsowanie względnych dat ("jutro", "w przyszły czwartek")
- Obsługa przybliżonych godzin ("ok 11:00", "około 14")
- Poprawne parsowanie zakresów czasowych

**Naprawione problemy:**
- Zadania nie są już nadmiernie dzielone (złożone zadania pozostają całością)
- Kontekst daty nie "przecieka" między paragrafami
- Dodano wykrywanie duplikatów dla zadań/wydarzeń/notatek/dziennika

**Zmienione pliki:**
- `backend/templates/prompts/brain_dump_analysis.twig` - ulepszony prompt
- `backend/src/Facade/BrainDumpFacade.php` - deduplikacja

### 3. Zaplanowane zadania na właściwy dzień

**Problem:**
Zadania z kategorii "scheduled" (zaplanowane na konkretny dzień) nie pojawiały się w sekcji "Na dziś" gdy nadszedł ich dzień.

**Rozwiązanie:**
- Zadania scheduled pojawiają się teraz w sekcji "Na dziś" gdy `dueDate` = aktualny dzień
- Zadania są widoczne nawet bez DailyNote dla danego dnia

**Zmienione pliki:**
- `backend/src/Repository/TaskRepository.php` - nowa metoda pobierania zadań na dzień
- `frontend/src/store/dailyNoteSlice.ts` - integracja z frontendem

### 4. Layout i infrastruktura

**Naprawki layoutu:**
- Stała wysokość kolumn (750px dla wszystkich trzech)
- Naprawiono problemy z timezone w date switcherze

**Zmiana portów (unikanie konfliktów):**
- nginx: 8080 → 8180
- frontend dev: 3000 → 3100
- vite HMR: 5173 → 5273
- postgres: 5432 → 5532

**Zmienione pliki:**
- `docker-compose.yml` - nowe porty
- `docker/nginx/default.conf` - naprawiono DNS resolution
- `frontend/src/components/layout/DaySwitcher.tsx` - timezone fix

## Testowanie

1. Dodaj dwa nakładające się wydarzenia - powinny wyświetlić się obok siebie
2. Najedź na wydarzenie - przyciski akcji powinny pojawić się z tłem
3. Wpisz "spotkanie jutro o 11" - AI powinno poprawnie ustawić datę na jutro
4. Sprawdź czy zadanie scheduled pojawia się w "Na dziś" gdy nadejdzie jego dzień
