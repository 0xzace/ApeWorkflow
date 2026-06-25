## ADDED Requirements

### Requirement: verify command must perform actual verification

The `verify` command SHALL implement full verification logic instead of the current skeleton. It must validate that workflow artifacts (proposal, specs, design, tasks, plans) are consistent, complete, and meet the schema requirements.

#### Scenario: verify runs on a complete change
- **WHEN** a change with all completed artifacts is verified
- **THEN** the command reports success with a summary of validated artifacts

#### Scenario: verify detects missing artifacts
- **WHEN** a change is missing one or more required artifacts (proposal, specs, design, tasks, or plans)
- **THEN** the command reports which artifacts are missing with clear error messages

#### Scenario: verify detects structural issues
- **WHEN** an artifact has structural problems (e.g., missing sections, invalid format)
- **THEN** the command reports specific issues with file paths and line references

### Requirement: taskTypeRouting must support the type field

The task type routing configuration SHALL include a `type` field that determines how tasks are routed. Currently the configuration exists but the `type` field is not used, making the routing non-functional.

#### Scenario: Task routing uses type field
- **WHEN** a task has a `type` field set in its configuration
- **THEN** the task is routed to the correct handler based on its type value

#### Scenario: Task routing has a default handler
- **WHEN** a task does not have a `type` field or has an unrecognized type
- **THEN** the task falls back to the default routing handler

#### Scenario: Configuration validation catches missing type
- **WHEN** the task type routing configuration is missing required fields
- **THEN** the system reports a clear error about the missing configuration
