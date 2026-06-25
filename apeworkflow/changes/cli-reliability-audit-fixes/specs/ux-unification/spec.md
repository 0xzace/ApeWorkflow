## ADDED Requirements

### Requirement: English files must not contain mixed Chinese characters

All source files written in English SHALL use only English for user-facing strings (error messages, help text, prompts, comments intended for developers). Chinese characters mixed into English files SHALL be translated or removed.

#### Scenario: Error messages are in English
- **WHEN** a user encounters an error in the CLI
- **THEN** the error message is displayed entirely in English

#### Scenario: Help text is in English
- **WHEN** a user requests help for any command
- **THEN** all help text is displayed entirely in English

### Requirement: Error message language must be unified

All error messages across the CLI SHALL follow a consistent language pattern. No error message shall mix languages or use inconsistent phrasing for equivalent errors.

#### Scenario: Equivalent errors have consistent phrasing
- **WHEN** the same type of error occurs in different parts of the CLI
- **THEN** the error messages use consistent wording and structure

#### Scenario: User-facing messages have no language mixing
- **WHEN** any user-facing string is displayed
- **THEN** it contains no unintended characters from other languages
