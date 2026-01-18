# v0.0.11 - Recurring Tasks

## Zakres zmian

Dodano funkcjonalność zadań rekurencyjnych - możliwość oznaczania zadań jako powtarzających się z różnymi harmonogramami (daily, weekly, weekdays, monthly, custom). Zadania są automatycznie generowane via cron (produkcja) lub endpoint API (dev).

## Backend

### Nowe pliki

- `src/Enum/RecurrenceType.php` - enum z typami rekurencji
- `src/Entity/RecurringTask.php` - encja z ustawieniami rekurencji
- `src/Repository/RecurringTaskRepository.php` - repozytorium
- `src/Service/RecurringSyncService.php` - serwis generujący zadania
- `src/Controller/RecurringController.php` - CRUD + sync endpoint
- `src/Command/RecurringSyncCommand.php` - komenda dla crona
- `migrations/Version20260117183933.php` - migracja DB

### Zmodyfikowane pliki

- `src/Entity/Task.php` - dodano relację `recurringTask`
- `src/Controller/TaskController.php` - generowanie następnego wystąpienia przy ukończeniu zadania
- `src/Repository/TaskRepository.php` - metoda `findByRecurringTaskAndDate` (duplicate check)
- `src/Facade/BrainDumpFacade.php` - zwracanie `recurringTaskId` w danych zadania
- `config/services.yaml` - konfiguracja `appEnv` dla RecurringController

### Nowe endpointy API

| Metoda | Endpoint | Opis |
|--------|----------|------|
| GET | `/api/recurring` | Lista recurring tasks użytkownika |
| POST | `/api/recurring` | Utwórz recurring task (+ linkTaskId) |
| PATCH | `/api/recurring/{id}` | Aktualizuj recurring task |
| DELETE | `/api/recurring/{id}` | Soft delete (deaktywacja) |
| DELETE | `/api/recurring/{id}/all` | Hard delete + usuń wszystkie przyszłe zadania |
| POST | `/api/recurring/sync` | Trigger sync (tylko dev) |

### Komenda cron

```bash
php bin/console app:recurring:sync [--date=YYYY-MM-DD] [--user=ID]
```

## Frontend

### Nowe pliki

- `src/components/tasks/RecurringSettings.tsx` - dialog ustawień rekurencji
- `src/components/tasks/DeleteRecurringConfirm.tsx` - modal potwierdzenia usunięcia
- `src/store/recurringSlice.ts` - Redux slice

### Zmodyfikowane pliki

- `src/types/index.ts` - typy `RecurrenceType`, `RecurringTask`, `recurringTaskId` w Task
- `src/lib/api.ts` - metody API dla recurring
- `src/store/index.ts` - dodanie recurringReducer
- `src/store/dailyNoteSlice.ts` - auto-sync w dev, reducery dla recurringTaskId
- `src/components/analysis/TaskItem.tsx` - ikona recurring, obsługa dialogów
- `src/components/analysis/TaskList.tsx` - przekazywanie props
- `src/i18n/locales/en.json` - tłumaczenia EN
- `src/i18n/locales/pl.json` - tłumaczenia PL

## Kluczowe funkcje

1. **Typy rekurencji:** daily, weekly, weekdays (pon-pt), monthly, custom (wybór dni)
2. **Auto-generacja:** przy ukończeniu zadania natychmiast tworzy następne wystąpienie
3. **Duplicate prevention:** sprawdzanie czy zadanie już istnieje przed utworzeniem
4. **Dev sync:** frontend automatycznie woła sync endpoint w trybie dev
5. **Soft/hard delete:** opcja usunięcia tylko tego zadania vs wszystkich przyszłych

## Testowanie

1. Utwórz zadanie i kliknij ikonę powtarzania
2. Wybierz typ rekurencji i zapisz
3. Ukończ zadanie - sprawdź czy nowe pojawia się na kolejny dzień
4. Usuń z opcją "all future" - sprawdź czy znika z listy

## Migracja DB

```bash
docker compose exec php php bin/console doctrine:migrations:migrate
```
