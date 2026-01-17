# Dopaminder v0.0.5 - Notatki

Data: 2026-01-16

## Zakres zmian

Wersja v0.0.5 wprowadza Check-in Mode - gamifikowany system przeglądu zadań w stylu Tinder.

### 1. Check-in Mode

**Koncepcja:**
- Codzienny przegląd zadań w formie kart do "swipe'owania"
- Trzy akcje: "Dziś" (zachowaj), "Jutro" (odłóż), "Zrobione" (ukończ)
- System combo za kolejne ukończone zadania
- Efekty confetti przy ukończeniu

**Combo system:**
- Combo rośnie przy każdym "Zrobione"
- Reset combo przy "Dziś" lub "Jutro"
- Komentarze motywacyjne przy milestone'ach (x3, x5, x7, x10, x15)
- Emoji ognia proporcjonalnie do wielkości combo

**Confetti:**
- Podstawowe przy każdym "Zrobione" (różowe)
- Side cannons przy combo >= 3 (niebieskie)
- Eksplozja przy combo >= 5 (wszystkie kolory)
- Gwiazdki przy combo >= 7 (żółto-zielone)

**Komponenty:**
- `CheckInModal.tsx` - główny modal z logiką przeglądu
- `TaskCard.tsx` - karta zadania z animacjami swipe
- `ComboCounter.tsx` - wyświetlanie combo z efektami
- `SummaryScreen.tsx` - podsumowanie po zakończeniu

### 2. Auto Check-in

**Automatyczne wyzwalanie:**
- Opcjonalny auto check-in po określonym czasie
- Interwały: wyłączony, 2h, 4h, 8h
- Sprawdzanie co 60 sekund czy minął interwał
- Wyzwalanie tylko gdy są zadania do przeglądu

**Hook:**
- `useAutoCheckIn.ts` - logika automatycznego wyzwalania

### 3. Settings Modal

**Nowe ustawienia:**
- Auto check-in interval (dropdown)
- Zen mode (toggle) - ukrywa combo counter i efekty
- Sounds (toggle) - włącza/wyłącza dźwięki (przygotowane na przyszłość)

**Komponent:**
- `SettingsModal.tsx` - modal z formularzem ustawień

### 4. Backend

**Nowa encja CheckIn:**
- Przechowuje sesje check-in
- Statystyki: done, tomorrow, today, dropped, bestCombo
- Relacja do User

**Nowe pola w Task:**
- `isDropped` - czy zadanie zostało porzucone
- `completedAt` - data ukończenia

**Nowe pola w User:**
- `checkInInterval` - interwał auto check-in (null = wyłączony)
- `zenMode` - tryb zen
- `soundEnabled` - dźwięki

**Nowe kontrolery:**
- `CheckInController` - `/api/check-in/tasks`, `/api/check-in/task/{id}/action`, `/api/check-in/complete`
- `SettingsController` - `GET/PATCH /api/settings`

## Nowe endpointy API

| Metoda | Endpoint | Opis |
|--------|----------|------|
| GET | /api/check-in/tasks | Pobierz zadania do przeglądu (overdue + today) |
| POST | /api/check-in/task/{id}/action | Wykonaj akcję na zadaniu (done/tomorrow/today) |
| POST | /api/check-in/complete | Zakończ sesję check-in i zapisz statystyki |
| GET | /api/settings | Pobierz ustawienia użytkownika |
| PATCH | /api/settings | Zaktualizuj ustawienia |

## Nowe zależności

- `canvas-confetti` - efekty confetti
- `@radix-ui/react-dialog` - komponent dialog

## Testowanie

1. Kliknij przycisk check-in w headerze
2. Przejdź przez kilka zadań klikając "Zrobione" - obserwuj combo
3. Przy combo >= 3 powinny pojawić się dodatkowe efekty confetti
4. Zakończ przegląd - zobacz podsumowanie ze statystykami
5. Włącz Zen Mode w ustawieniach - combo counter powinien zniknąć
