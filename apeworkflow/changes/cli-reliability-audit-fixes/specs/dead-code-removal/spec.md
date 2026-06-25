## ADDED Requirements

### Requirement: generateArchiveName must not crash on collision

The `generateArchiveName` function in `archive-change.ts` SHALL eliminate the dead code branch that causes crashes when an archive name collision occurs. The current implementation contains an unreachable or incorrect collision-handling branch that leads to runtime errors.

#### Scenario: Archive generation succeeds for unique names
- **WHEN** a workflow triggers archive change with a name that does not exist in the archive directory
- **THEN** `generateArchiveName` returns the expected archive name without error

#### Scenario: Archive generation handles real collisions safely
- **WHEN** a workflow triggers archive change and an archive with the same base name already exists
- **THEN** `generateArchiveName` appends a numeric suffix (e.g., `-1`, `-2`) and returns a valid unique name without throwing

#### Scenario: Dead collision branch is removed
- **WHEN** the code is inspected after the fix
- **THEN** the dead code branch that previously caused crashes is removed and no unreachable paths remain

### Requirement: resolveEditRoots must resolve actual workspace roots

The `resolveEditRoots` function in `workspace-planning` SHALL replace dead code with actual workspace root resolution logic. Currently, the function either returns a hardcoded value or fails, trapping users in workspace planning mode.

#### Scenario: resolveEditRoots returns workspace root
- **WHEN** workspace planning mode is invoked
- **THEN** `resolveEditRoots` returns the actual workspace root path from the project configuration

#### Scenario: resolveEditRoots handles missing configuration gracefully
- **WHEN** the workspace configuration is missing or invalid
- **THEN** `resolveEditRoots` returns a sensible default or throws a clear error message rather than crashing

#### Scenario: Workspace planning is no longer trapped
- **WHEN** a user runs workspace planning after the fix
- **THEN** the workspace planning flow completes normally without being stuck in an infinite or broken loop
