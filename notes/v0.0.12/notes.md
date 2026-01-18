# v0.0.12 - Events, Navigation, Overdue, Email

## Zakres zmian

Cztery nowe funkcjonalności:
1. Ręczne tworzenie eventów (nie tylko z brain dump)
2. Nawigacja do dowolnego dnia + date picker
3. Overdue tasks w sekcji "Later" z wizualnym wyróżnieniem
4. Branded email template dla kodów logowania

## Backend

### Nowe pliki

- `templates/emails/login_code.html.twig` - stylowany HTML email
- `templates/emails/login_code.txt.twig` - plain text fallback

### Zmodyfikowane pliki

- `src/Controller/EventController.php` - nowy endpoint POST /api/event
- `src/Facade/BrainDumpFacade.php` - dodanie overdue tasks do response (tylko dla dzisiejszej daty)
- `src/Service/AuthMailerService.php` - refactor na Twig + obsługa języka użytkownika
- `config/services.yaml` - konfiguracja Twig dla AuthMailerService

### Nowe endpointy API

| Metoda | Endpoint | Opis |
|--------|----------|------|
| POST | `/api/event` | Utwórz event ręcznie |

### Response tasks z overdue

```json
{
  "tasks": {
    "today": [...],
    "scheduled": [...],
    "someday": [...],
    "overdue": [...]  // tylko gdy viewing today
  }
}
```

## Frontend

### Nowe pliki

- `src/components/schedule/AddEventForm.tsx` - formularz dodawania eventów

### Zmodyfikowane pliki

- `src/App.tsx` - empty day handling, overdue w default data
- `src/components/layout/DaySwitcher.tsx` - klikalna data otwiera native date picker
- `src/components/schedule/DaySchedule.tsx` - przycisk "+ Add event" na dole
- `src/components/analysis/AnalysisResults.tsx` - overdue tasks w Later section, auto-expand
- `src/components/analysis/TaskList.tsx` - prop isOverdue
- `src/components/analysis/TaskItem.tsx` - czerwone wyróżnienie dla overdue
- `src/components/auth/LoginPage.tsx` - zmiana tekstów magic link → login code
- `src/store/dailyNoteSlice.ts` - createEvent thunk
- `src/lib/api.ts` - event.create method
- `src/types/index.ts` - overdue w TasksGroup
- `src/i18n/locales/en.json` - events.*, tasks.overdue, auth.sendCode/codeSent
- `src/i18n/locales/pl.json` - events.*, tasks.overdue, auth.sendCode/codeSent

## Kluczowe funkcje

1. **Ręczne eventy:** Przycisk "+ Add event" na dole schedule, formularz inline
2. **Date picker:** Kliknięcie na datę (np. "Today") otwiera natywny date picker
3. **Empty day:** Nawigacja na pusty dzień pokazuje puste sekcje z działającymi przyciskami add
4. **Overdue tasks:** Pokazują się tylko na dzisiejszym dniu, z czerwonym wyróżnieniem, sekcja Later auto-expanduje
5. **Email branding:** Ciemny motyw, losowy tagline, obsługa EN/PL

## Testowanie

1. **Events:** Kliknij "+ Add event", wpisz tytuł i godziny, sprawdź czy pojawia się w schedule
2. **Date picker:** Kliknij na "Today" → powinien otworzyć się kalendarz
3. **Empty day:** Przejdź na przyszłą datę bez danych → powinny być widoczne puste sekcje z przyciskami
4. **Overdue:** Utwórz task z dueDate w przeszłości, sprawdź czy pokazuje się w Later z czerwonym
5. **Email:** Wyloguj się, poproś o kod → sprawdź Mailpit, powinien być stylowany email
