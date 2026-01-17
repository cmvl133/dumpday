# Dopaminder v0.0.4 - Notatki

Data: 2026-01-15

## Zakres zmian

Wersja v0.0.4 wprowadza system autentykacji Magic Code oraz edycję dat zadań.

### 1. Autentykacja Magic Code

**Opis systemu:**
- Logowanie bez hasła - tylko email
- 6-cyfrowy kod wysyłany na email (ważny 10 minut)
- Rate limiting: max 3 kody na godzinę per email
- Blokada: 15 minut po 3 nieudanych próbach
- Sesja: httpOnly cookies, ważność 7 dni

**Whitelist użytkowników:**
- Tylko dozwolone emaile mogą się logować
- Konfiguracja przez `ALLOWED_USERS` w `.env`

**Nowe encje:**
- `User` - email, createdAt, lastLoginAt, settings
- `LoginCode` - code, email, expiresAt, usedAt, attempts

**Nowe kontrolery i serwisy:**
- `AuthController` - `/api/auth/request-code`, `/api/auth/verify`, `/api/auth/logout`, `/api/auth/me`
- `AuthFacade` - orkiestracja procesu logowania
- `AuthCodeService` - generowanie i weryfikacja kodów
- `AuthMailerService` - wysyłanie emaili z kodem
- `UserService` - zarządzanie użytkownikami
- `SessionAuthenticator` - Symfony security authenticator

**Zmienione pliki:**
- `backend/config/packages/security.yaml` - konfiguracja firewall
- `frontend/src/components/auth/LoginPage.tsx` - UI logowania
- `frontend/src/store/authSlice.ts` - stan autentykacji

### 2. Edycja dat zadań

**Funkcjonalność:**
- Calendar picker do ustawiania/zmiany daty zadania
- Ikona kalendarza przy każdym zadaniu (hover)
- Badge z datą przy zadaniach z ustawioną datą
- Zadania w sekcji "dziś" pokazują kontekstową datę

**Automatyczna kategoryzacja:**
- Zmiana daty automatycznie przenosi zadanie między sekcjami
- Dziś → scheduled (gdy data w przyszłości)
- Scheduled → dziś (gdy data = dziś)

**Zmienione pliki:**
- `frontend/src/components/analysis/TaskItem.tsx` - calendar picker UI
- `frontend/src/store/dailyNoteSlice.ts` - thunk `updateTaskDueDate`
- `backend/src/Controller/TaskController.php` - obsługa `dueDate`

### 3. Infrastruktura

**Mailpit (lokalne testowanie emaili):**
- Dostępny na porcie 8125
- Przechwytuje wszystkie emaile w środowisku dev
- UI do przeglądania wysłanych wiadomości

**Nowe zależności:**
- `symfony/mailer` - wysyłanie emaili

### 4. Scope danych

**Wszystkie dane są teraz przypisane do użytkownika:**
- DailyNote ma relację ManyToOne do User
- Wszystkie zapytania filtrują po zalogowanym użytkowniku
- Brak dostępu do danych innych użytkowników

## Nowe endpointy API

| Metoda | Endpoint | Opis |
|--------|----------|------|
| POST | /api/auth/request-code | Żądanie kodu logowania |
| POST | /api/auth/verify | Weryfikacja kodu |
| POST | /api/auth/logout | Wylogowanie |
| GET | /api/auth/me | Dane zalogowanego użytkownika |

## Testowanie

1. Otwórz aplikację - powinna pokazać stronę logowania
2. Wpisz email z whitelist - sprawdź Mailpit (port 8125)
3. Wpisz kod - powinieneś zostać zalogowany
4. Kliknij ikonę kalendarza przy zadaniu - ustaw datę
5. Sprawdź czy zadanie przeniosło się do odpowiedniej sekcji
