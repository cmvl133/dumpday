# Dopaminder — Time Blocks Milestone

## What This Is

Dopaminder to aplikacja do planowania dnia dla osób z ADHD. Pozwala na "brain dump" — swobodne wpisywanie myśli, które są analizowane przez AI i organizowane w zadania, wydarzenia, notatki i wpisy dziennika. Ten milestone dodaje **bloki czasowe** — trzeci typ bytu na schedule obok eventów i tasków.

## Core Value

**Bloki czasowe pozwalają użytkownikowi organizować dzień w konteksty** (praca, relax, rodzina) i automatycznie dopasowywać zadania do odpowiednich przedziałów czasowych, zapobiegając mieszaniu się różnych sfer życia.

## Requirements

### Validated

Istniejące funkcjonalności (z codebase map):

- ✓ Brain dump z analizą AI (GPT-4o-mini) — existing
- ✓ Zadania z kategoriami (today/scheduled/someday) — existing
- ✓ Eventy z czasem start/end — existing
- ✓ Notatki z rich text (Tiptap) — existing
- ✓ Wpisy dziennika — existing
- ✓ System tagów dla tasków — existing
- ✓ Recurring tasks z harmonogramem — existing
- ✓ Wizualizacja schedule'a z drag & drop — existing
- ✓ Planning mode z AI optimization — existing
- ✓ Check-in flow — existing
- ✓ Passwordless email auth — existing
- ✓ i18n (en/pl) — existing

### Active

Nowe wymagania dla tego milestone'u:

- [ ] Bloki czasowe jako nowy typ bytu (entity)
- [ ] Konfiguracja bloków w Settings (harmonogram: dni tygodnia, godziny)
- [ ] Powiązanie bloków z tagami (dopasowywanie tasków)
- [ ] Wizualizacja bloków na schedule (wąskie paski po lewej, skośne wzory)
- [ ] Edycja wyjątków bloków inline na schedule (zmiana godzin na konkretny dzień)
- [ ] AI sugeruje bloki przy brain dump (user potwierdza)
- [ ] Planowanie uwzględnia bloki (task trafia do pierwszego wolnego bloku z listy)
- [ ] Task może nie mieć przypisanego bloku (elastyczny czasowo)
- [ ] Hover na bloku pokazuje nazwę + opcję edycji

### Out of Scope

- Nakładające się bloki czasowe — użytkownik ma max 1 blok w danym momencie
- Automatyczne tworzenie bloków z eventów — bloki są oddzielnym bytem
- Bloki jako hard constraints — AI sugeruje, ale user może override

## Context

**Istniejąca architektura:**
- Backend: Symfony 7.4 + Doctrine ORM + PostgreSQL
- Frontend: React 19 + Redux Toolkit + Tailwind CSS + shadcn/ui
- AI: OpenAI GPT-4o-mini (brain dump analysis, schedule optimization)
- DailyNote jako aggregate root dla tasków, eventów, notatek

**Istniejący system tagów:**
- Entity `Tag` z relacją ManyToMany do `Task`
- Zarządzanie tagami w UI
- Bloki będą powiązane z tagami dla automatycznego dopasowania

**Schedule UI:**
- Już istnieje wizualizacja eventów i tasków
- Drag & drop przez @dnd-kit
- Expanded modal do szczegółowej edycji

## Constraints

- **Tech stack**: Symfony + React + PostgreSQL (bez zmian)
- **AI model**: GPT-4o-mini (koszt i latency)
- **Backward compatibility**: Istniejące dane (taski, eventy) muszą działać bez bloków

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Task ↔ Block przez tagi | Wykorzystuje istniejący system tagów, prostsze niż nowa relacja | — Pending |
| Bloki wizualnie po lewej schedule'a | Nie przysłania eventów/tasków, czytelna separacja | — Pending |
| AI sugeruje bloki przy brain dump | Balans między automatyzacją a kontrolą usera | — Pending |
| Task może nie mieć bloku | Elastyczność dla zadań bez kontekstu czasowego | — Pending |
| Pierwszy wolny blok przy planowaniu | Proste i automatyczne, bez dodatkowych pytań | — Pending |
| Edycja wyjątków inline | UX: szybka zmiana bez wchodzenia w Settings | — Pending |

---
*Last updated: 2026-01-20 after initialization*
