# Dopaminder v0.0.8 - Notatki

Data: 2026-01-16

## Zakres zmian

Wersja v0.0.8 wprowadza pełne wsparcie dla dwóch języków: angielskiego i polskiego.

### 1. Frontend i18n

**Technologia:**
- react-i18next z wykrywaniem języka przeglądarki
- Pliki JSON z tłumaczeniami
- Hook `useTranslation()` w komponentach

**Struktura tłumaczeń:**
```
frontend/src/i18n/
├── index.ts          # Konfiguracja i18n
└── locales/
    ├── en.json       # Angielskie tłumaczenia
    └── pl.json       # Polskie tłumaczenia
```

**Kategorie tłumaczeń:**
- `common` - ogólne (save, cancel, delete, etc.)
- `auth` - logowanie
- `header` - taglines
- `brainDump` - sekcja brain dump
- `tasks` - zarządzanie zadaniami
- `checkIn` - tryb check-in
- `summary` - podsumowanie
- `settings` - ustawienia
- `schedule` - harmonogram
- `dates` - nazwy dni (dziś, jutro, etc.)
- `combo` - komunikaty combo

### 2. Backend - prompty AI per język

**Nowe pliki:**
- `templates/prompts/brain_dump_analysis_en.twig` - angielski prompt
- `templates/prompts/brain_dump_analysis_pl.twig` - polski prompt (rename)

**Logika wyboru:**
- `BrainDumpAnalyzer` pobiera język użytkownika
- Renderuje odpowiedni template Twig
- AI odpowiada w języku użytkownika

### 3. User Entity - język

**Nowe pole:**
- `language` - preferowany język (en/pl, domyślnie 'en')

**Migracja:**
- `Version20260116111000.php` - dodaje kolumnę language

**Settings API:**
- GET zwraca language
- PATCH przyjmuje language

### 4. Settings Modal - wybór języka

**Nowy element:**
- Dropdown z wyborem języka
- Opcje: English, Polski
- Zmiana natychmiast aktualizuje UI

**Synchronizacja:**
- Po zmianie języka w Settings: API call + i18n.changeLanguage()
- Po załadowaniu Settings: sync i18n z wartością z API

### 5. Zaktualizowane komponenty

**Użycie `useTranslation()`:**
- `LoginPage.tsx`
- `Header.tsx`
- `BrainDumpInput.tsx`
- `CheckInModal.tsx`
- `TaskCard.tsx`
- `SummaryScreen.tsx`
- `SettingsModal.tsx`

### 6. Dodatkowe poprawki

**Scrollbary:**
- Stylowane na różowo (punk theme)
- Subtelne, nie dominują UI

**Textarea focus:**
- Naprawiono problem z border przy focus

## Testowanie

1. Otwórz Settings i zmień język na Polski
2. Cały UI powinien się przetłumaczyć
3. Wpisz brain dump po polsku - AI odpowie po polsku
4. Zmień język na English
5. Wpisz brain dump po angielsku - AI odpowie po angielsku
6. Odśwież stronę - język powinien być zachowany
