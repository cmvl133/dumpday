# Dopaminder v0.0.6 - Notatki

Data: 2026-01-16

## Zakres zmian

Wersja v0.0.6 dodaje system przypomnień o zadaniach z wyborem tonu wiadomości.

### 1. Przypomnienia o zadaniach

**Funkcjonalność:**
- Ustawianie konkretnej godziny przypomnienia dla zadania
- Ikona dzwonka przy każdym zadaniu (hover)
- Time picker do wyboru godziny
- Notyfikacje przeglądarki w wybranym czasie

**UI:**
- Inline time picker pojawiający się przy zadaniu
- Badge z godziną przypomnienia
- Możliwość usunięcia przypomnienia

**Hook:**
- `useReminders.ts` - sprawdza przypomnienia co minutę
- Wysyła notyfikacje przez Service Worker
- Wymaga zgody na notyfikacje (prompt w Settings)

### 2. Biblioteka tonów wiadomości

**5 dostępnych stylów:**

1. **Gentle (Łagodny)**
   - Delikatne, wspierające wiadomości
   - "You're doing great! Keep it up!"

2. **Normal (Normalny)**
   - Standardowe, neutralne komunikaty
   - "Task completed. Nice work."

3. **Aggressive (Agresywny)**
   - Motywujące przez presję
   - "GET IT DONE! NO EXCUSES!"

4. **Vulgar (Wulgarny)**
   - Przekleństwa jako motywacja
   - "Holy sh*t, you actually did it!"

5. **Big Poppa Pump (Scott Steiner)**
   - Cytaty wrestlera Scotta Steinera
   - "HE'S FAT! 🚨"

**Integracja:**
- Ton używany w combo counter podczas check-in
- Ton używany w notyfikacjach przypomnieniowych

**Plik:**
- `frontend/src/lib/toneMessages.ts` - wszystkie wiadomości

### 3. Backend

**Nowe pole w Task:**
- `reminderTime` - godzina przypomnienia (TIME, nullable)

**Nowe pole w User:**
- `reminderTone` - wybrany ton wiadomości

### 4. Service Worker

**Nowy plik:**
- `frontend/public/sw.js` - obsługa notyfikacji

**Funkcje:**
- Nasłuchuje na `push` events
- Wyświetla notyfikacje z ikoną i tytułem
- Obsługuje kliknięcie w notyfikację (focus na aplikację)

### 5. Settings - notyfikacje

**Nowe elementy w Settings:**
- Wybór tonu wiadomości (dropdown)
- Przycisk do włączenia notyfikacji przeglądarki
- Informacja o statusie uprawnień

## Zmienione pliki

**Backend:**
- `backend/src/Entity/Task.php` - pole reminderTime
- `backend/src/Entity/User.php` - pole reminderTone
- `backend/src/Controller/TaskController.php` - obsługa reminderTime
- `backend/src/Controller/SettingsController.php` - obsługa tone

**Frontend:**
- `frontend/src/components/analysis/TaskItem.tsx` - time picker UI
- `frontend/src/components/settings/SettingsModal.tsx` - tone selector, notyfikacje
- `frontend/src/components/check-in/ComboCounter.tsx` - integracja z tonami
- `frontend/src/hooks/useReminders.ts` - logika przypomnień
- `frontend/src/lib/toneMessages.ts` - biblioteka wiadomości

## Testowanie

1. Najedź na zadanie i kliknij ikonę dzwonka
2. Ustaw godzinę przypomnienia na za minutę
3. Poczekaj - powinna pojawić się notyfikacja
4. Zmień ton w Settings na "Aggressive"
5. Zrób check-in i obserwuj komunikaty combo
