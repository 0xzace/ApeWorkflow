## 1. Fix verify-change.ts template

- [ ] 1.1 Remove `taskRoutingBlock` constant from `src/core/templates/workflows/verify-change.ts`
- [ ] 1.2 Add CLI routing directive in place of `taskRoutingBlock` (reference `apeworkflow instructions verify --json`)

## 2. Fix archive-change.ts template

- [ ] 2.1 Remove `taskRoutingBlock` constant from `src/core/templates/workflows/archive-change.ts`
- [ ] 2.2 Add CLI routing directive in place of `taskRoutingBlock` (reference `apeworkflow instructions archive --json`)

## 3. Fix verify.md command file

- [ ] 3.1 Remove Chinese routing table section (lines ~153-178) from `.claude/commands/ape/verify.md`
- [ ] 3.2 Replace with brief CLI routing directive

## 4. Fix archive.md command file

- [ ] 4.1 Remove Chinese routing table section (lines ~93-118) from `.claude/commands/ape/archive.md`
- [ ] 4.2 Replace with brief CLI routing directive

## 5. Build and verify

- [ ] 5.1 Run `npm run build` and confirm no errors
- [ ] 5.2 Verify dist files do not contain Chinese routing keys
- [ ] 5.3 Run `apeworkflow instructions verify --json` and confirm `taskTypeRouting` is returned
- [ ] 5.4 Run `apeworkflow instructions archive --json` and confirm `taskTypeRouting` is returned

## 6. Validate

- [ ] 6.1 Run `openspec validate fix-routing-tri-split` to confirm all spec requirements are met
