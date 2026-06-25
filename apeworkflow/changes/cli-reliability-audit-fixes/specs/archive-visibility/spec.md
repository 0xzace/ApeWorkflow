## ADDED Requirements

### Requirement: Archived changes must be visible in listing commands

Archived changes SHALL be visible in the CLI listing and management commands. Currently, archived changes (those moved to the archive directory) are invisible forever after archiving.

#### Scenario: Archived changes appear in list output
- **WHEN** a user lists all changes (including archived)
- **THEN** archived changes are included in the output with an `archived` indicator

#### Scenario: Archived change details are accessible
- **WHEN** a user requests details for a specific archived change by name
- **THEN** the system retrieves and displays the archived change's artifacts

#### Scenario: Archived changes retain full artifact history
- **WHEN** an archived change is viewed
- **THEN** all artifacts (proposal, specs, design, tasks, plans) are accessible and displayed

### Requirement: Archive visibility must not affect non-archived changes

The archive visibility feature SHALL not change the behavior of non-archived changes. Unarchived changes SHALL continue to appear and behave exactly as before.

#### Scenario: Non-archived listing is unchanged
- **WHEN** a user lists only non-archived changes
- **THEN** the output is identical to the pre-fix behavior (no archived changes shown unless explicitly requested)

#### Scenario: Archive filtering is opt-in
- **WHEN** no explicit flag is provided for listing changes
- **THEN** only non-archived changes are shown by default (preserving current behavior for most users)
