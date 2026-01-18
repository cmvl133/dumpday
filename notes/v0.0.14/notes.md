# v0.0.14 - Schedule Improvements

## Zakres zmian

Wizualne i funkcjonalne ulepszenia harmonogramu:
1. Task blocks - zadania jako kolorowe paski zamiast kropek
2. Poprawione pozycjonowanie czasowe (dokładne procenty zamiast zaokrągleń)
3. Obsługa nakładających się zadań (horizontal stacking)
4. Linie półgodzinne i wskaźnik aktualnego czasu
5. Rozszerzony modal harmonogramu z drag & drop
6. Sidebar z niezaplanowanymi zadaniami

## Frontend

### Nowe pliki

- `src/components/schedule/TaskBlock.tsx` - kolorowy blok zadania z tooltipem
- `src/components/schedule/ScheduleExpandedModal.tsx` - pełnoekranowy modal z DnD

### Zmodyfikowane pliki

- `src/App.tsx` - state dla expanded modal, obliczanie unscheduledTasks
- `src/components/schedule/DaySchedule.tsx` - TaskBlock zamiast TaskDot, calculateTaskLayout, 30min lines, current time indicator, expand button
- `src/components/schedule/EventBlock.tsx` - zwiększony right margin (70px) dla miejsca na task bars
- `src/i18n/locales/en.json` - schedule.unscheduledTasks, schedule.allTasksScheduled
- `src/i18n/locales/pl.json` - schedule.unscheduledTasks, schedule.allTasksScheduled

### Nowe zależności

- `@dnd-kit/core` - drag & drop
- `@dnd-kit/sortable` - sortowanie
- `@dnd-kit/utilities` - helpery CSS

## Kluczowe funkcje

### TaskBlock
- Kolorowy pasek 24px szerokości po prawej stronie schedule
- Wysokość proporcjonalna do czasu trwania (estimatedMinutes)
- Kolor z pierwszego tagu lub domyślny fioletowy
- Tooltip na hover z pełną nazwą, czasem, tagami i checkboxem
- Rotowany tekst nazwy dla zadań 2h+ (writing-mode: vertical-rl)
- Opacity 50% dla wykonanych zadań (tylko blok, nie tooltip)
- Dynamic z-index (30 normalnie, 100 na hover) dla poprawnego layeringu

### Overlap handling
- Nakładające się zadania stackują się poziomo (offsetIndex)
- Events mają 70px right margin aby nie nachodzić na task bars

### Timeline
- Linie półgodzinne (dashed, opacity 20%)
- Czerwony wskaźnik aktualnego czasu (linia + kropka)
- Aktualizacja co minutę

### Expanded Modal
- Pełnoekranowy modal z DndContext
- Lewy sidebar: lista niezaplanowanych zadań (draggable)
- Główny obszar: pełny schedule z task bars (draggable)
- Drag z sidebar na schedule → ustawia fixedTime
- Drag task na schedule → zmienia fixedTime

## Testowanie

1. **Task blocks:** Zadania z fixedTime powinny wyświetlać się jako kolorowe paski po prawej
2. **Overlap:** Dwa zadania w tym samym czasie → dwa paski obok siebie
3. **Tooltip:** Hover na task block → popup z nazwą, checkboxem, tagami
4. **Completed:** Wykonane zadanie ma opacity 50%, ale tooltip normalny
5. **30min lines:** Widoczne przerywane linie między godzinami
6. **Current time:** Czerwona linia w aktualnym czasie (tylko 6:00-22:00)
7. **Expand:** Przycisk rozszerzenia → modal z sidebar i pełnym schedule
8. **DnD sidebar:** Przeciągnij task z sidebar na schedule → dostaje fixedTime
9. **DnD schedule:** Przeciągnij task block w górę/dół → zmienia fixedTime
