## ADDED Requirements

### Requirement: config.yaml defaults must match code defaults

The `config.yaml` file SHALL have default values that exactly match the code defaults in `src/cli/config.ts`. Any mismatch between documented defaults (in comments) and actual code defaults is a bug.

#### Scenario: config.yaml default for key matches code default
- **WHEN** any configuration key is read from config.yaml
- **THEN** its default value matches the default used in the code initialization

#### Scenario: config.yaml comments reflect actual defaults
- **WHEN** a developer reads the config.yaml comments
- **THEN** the commented default values match the actual code defaults

### Requirement: selectionPolicy recommended value must align with code default

The `selectionPolicy` configuration in config.yaml SHALL use a recommended value that matches the code default. The current recommended value conflicts with the actual code default.

#### Scenario: selectionPolicy default is consistent
- **WHEN** no explicit selectionPolicy is set in config.yaml
- **THEN** the code uses the same default value that is documented as the recommended value in config.yaml

#### Scenario: selectionPolicy recommended value is documented correctly
- **WHEN** the config.yaml is reviewed
- **THEN** the recommended value comment matches the actual default used by the code
