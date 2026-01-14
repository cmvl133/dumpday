# DumpDay - Notatki projektowe

Ten plik zawiera informacje dla Claude Code dotyczące projektu DumpDay.

## O projekcie

DumpDay to aplikacja do planowania dnia dla osób z ADHD. Pozwala na "brain dump" - swobodne wpisywanie myśli, które są następnie analizowane przez AI i organizowane w strukturę: zadania, wydarzenia, notatki i wpisy dziennika.

## Stack technologiczny

- **Backend:** Symfony 7.4, PHP 8.3, Doctrine ORM, PostgreSQL
- **Frontend:** React 19, TypeScript, Redux Toolkit, Tailwind CSS, shadcn/ui
- **AI:** OpenAI GPT-4o-mini
- **Infrastruktura:** Docker (nginx, php, node, postgres)

## Struktura notatek

Notatki dotyczące kolejnych wersji aplikacji znajdują się w katalogu `notes/`:

```
notes/
├── v0.0.1/
│   ├── notes.md          # Podsumowanie wersji
│   └── original-prompt.md # Oryginalny prompt z wymaganiami
├── v0.0.2/
│   └── ...
```

Każdy podkatalog wersji zawiera:
- `notes.md` - główna notatka z podsumowaniem zmian
- Opcjonalne dodatkowe pliki: prompty, skrypty, diagramy

## Uruchomienie

```bash
make dev                    # Start środowiska dev
# Frontend: http://localhost:3000
# API: http://localhost:8080/api
```

## Klucz API

Ustaw w `backend/.env`:
```
OPENAI_API_KEY=sk-twoj-klucz
```

## Wersje

- **v0.0.1** - MVP z podstawową funkcjonalnością brain dump i analizy AI
