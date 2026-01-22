# Requirements: Dopaminder v1.1 Bugfixes

**Defined:** 2026-01-22
**Core Value:** Struktura z elastycznoscia — AI sugeruje, uzytkownik decyduje

## v1.1 Requirements

Bugfixes and polish for v1 Time Blocks release.

### Notes Panel

- [x] **NOTE-01**: "Add new note" button creates a new note when clicked
- [x] **NOTE-02**: Notes panel has single close button (remove duplicate X)
- [x] **NOTE-03**: WYSIWYG editor displays content correctly in edit mode
- [x] **NOTE-04**: Note preview renders formatted content (not raw HTML)

### Check-in Modal

- [ ] **CHKN-01**: Check-in modal stays closed until next scheduled interval after manual dismiss

### AI Planning

- [ ] **PLAN-01**: AI does not schedule tasks during events without overlap permission
- [ ] **PLAN-02**: AI task splitting behavior works as expected (investigate and fix)
- [ ] **PLAN-03**: Scheduled tasks (with date, no time) appear in daily planning

### UI State

- [ ] **UIST-01**: Marking task as Later/overdue updates list immediately (no refresh needed)

## Out of Scope

| Feature | Reason |
|---------|--------|
| New features | This is a bugfix milestone |
| Settings tabs reorganization | Defer to v1.2 or v2 |
| Weekly schedule preview | Defer to v1.2 or v2 |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| NOTE-01 | 6 | Complete |
| NOTE-02 | 6 | Complete |
| NOTE-03 | 6 | Complete |
| NOTE-04 | 6 | Complete |
| CHKN-01 | 7 | Pending |
| UIST-01 | 7 | Pending |
| PLAN-01 | 8 | Pending |
| PLAN-02 | 8 | Pending |
| PLAN-03 | 8 | Pending |

**Coverage:**
- v1.1 requirements: 9 total
- Mapped to phases: 9
- Unmapped: 0 ✓

---
*Requirements defined: 2026-01-22*
*Last updated: 2026-01-22 after Phase 6 completion*
