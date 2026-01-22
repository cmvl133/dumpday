# Dopaminder

## What This Is

Dopaminder to aplikacja do planowania dnia dla osob z ADHD. Pozwala na "brain dump" — swobodne wpisywanie mysli, ktore sa analizowane przez AI i organizowane w zadania, wydarzenia, notatki i wpisy dziennika. Aplikacja zawiera **bloki czasowe** — trzeci typ bytu na schedule obok eventow i taskow, pozwalajacy organizowac dzien w konteksty.

## Core Value

**Struktura z elastycznoscia** — bloki czasowe pozwalaja uzytkownikowi organizowac dzien w konteksty (praca, relax, rodzina) z automatycznym dopasowywaniem zadan, ale bez sztywnych ograniczen. AI sugeruje, uzytkownik decyduje.

## Requirements

### Validated

- Brain dump z analiza AI (GPT-4o-mini) — v1
- Zadania z kategoriami (today/scheduled/someday) — v1
- Eventy z czasem start/end — v1
- Notatki z rich text (Tiptap) — v1
- Wpisy dziennika — v1
- System tagow dla taskow — v1
- Recurring tasks z harmonogramem — v1
- Wizualizacja schedule'a z drag & drop — v1
- Planning mode z AI optimization — v1
- Check-in flow — v1
- Passwordless email auth — v1
- i18n (en/pl) — v1
- TimeBlock entity z recurrence i tag associations — v1
- Wizualizacja blokow na schedule (diagonal stripes, hover tooltips) — v1
- Settings UI dla TimeBlock CRUD — v1
- Exception handling (skip/modify/restore per day) — v1
- Task-Block matching via tags z "first available block" — v1
- AI awareness blokow przy brain dump — v1
- Notes panel fixes (6 bugs: add button, close button, WYSIWYG, HTML preview, empty content, dual UX) — v1.1
- Check-in modal respects manual close until next interval — v1.1
- AI planning fixes (event overlap, overdue tasks in planning) — v1.1
- UI state updates without refresh (cross-slice Redux pattern) — v1.1

### Active

(None - planning next milestone)

### Out of Scope

- Nakladajace sie bloki czasowe — max 1 blok w danym momencie
- Automatyczne tworzenie blokow z eventow — bloki sa oddzielnym bytem
- Bloki jako hard constraints — AI sugeruje, ale user moze override
- Shared/team blocks — personal app
- Block notifications/alarms — istniejace notyfikacje wystarczajace
- Minute-level precision — 15-30 minute increments only

## Context

**Current State (v1.1 shipped):**
- Backend: Symfony 7.4 + Doctrine ORM + PostgreSQL
- Frontend: React 19 + Redux Toolkit + Tailwind CSS + shadcn/ui
- AI: OpenAI GPT-4o-mini (brain dump analysis, schedule optimization)
- ~12,750 LOC (v1: 9,750 + v1.1: 3,005)
- 8 phases, 20 plans total

**Tech Stack:**
- DailyNote jako aggregate root dla taskow, eventow, notatek
- TimeBlock jako template (recurrence-based, not instance)
- TimeBlockException dla per-day overrides
- Tag-based task-block matching
- Cross-slice Redux pattern for state sync (v1.1)
- Event allowOverlap for AI scheduling constraints (v1.1)

**User Feedback (v1.1):**
- Settings modal getting crowded -> consider tabs in v2

## Constraints

- **Tech stack**: Symfony + React + PostgreSQL (bez zmian)
- **AI model**: GPT-4o-mini (koszt i latency)
- **Backward compatibility**: Istniejace dane musza dzialac

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Task <-> Block przez tagi | Wykorzystuje istniejacy system tagow | Good |
| Bloki wizualnie po lewej schedule'a | Nie przyslania eventow/taskow | Good |
| AI sugeruje bloki przy brain dump | Balans miedzy automatyzacja a kontrola | Good |
| Task moze nie miec bloku | Elastycznosc dla zadan bez kontekstu | Good |
| Pierwszy wolny blok przy planowaniu | Proste i automatyczne | Good |
| Edycja wyjatkow inline | UX: szybka zmiana bez Settings | Good |
| Soft delete dla TimeBlock | isActive=false zamiast hard delete | Good |
| Skipped blocks excluded from response | Prostsze API, mniej logiki na froncie | Good |
| EventBlock leftOffset 84px | Unikniecie overlap z TimeBlockStrip | Good |
| hideCloseButton prop dla DialogContent | Custom close buttons bez duplikatow | Good |
| Cross-slice extraReducer pattern | Unika circular imports w Redux | Good |
| Event allowOverlap default false | Konserwatywne — eventy blokuja taski | Good |
| dueDate <= today dla planning | Overdue tasks wchodza do planowania | Good |

---

*Last updated: 2026-01-22 after v1.1 Bugfixes milestone complete*
