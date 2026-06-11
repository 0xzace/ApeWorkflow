/**
 * Static template strings for Bash completion scripts.
 * These are Bash-specific helper functions that never change.
 */

export const BASH_DYNAMIC_HELPERS = `# Dynamic completion helpers

_apeworkflow_complete_changes() {
  local changes
  changes=$(apeworkflow __complete changes 2>/dev/null | cut -f1)
  COMPREPLY=($(compgen -W "$changes" -- "$cur"))
}

_apeworkflow_complete_specs() {
  local specs
  specs=$(apeworkflow __complete specs 2>/dev/null | cut -f1)
  COMPREPLY=($(compgen -W "$specs" -- "$cur"))
}

_apeworkflow_complete_items() {
  local items
  items=$(apeworkflow __complete changes 2>/dev/null | cut -f1; apeworkflow __complete specs 2>/dev/null | cut -f1)
  COMPREPLY=($(compgen -W "$items" -- "$cur"))
}

_apeworkflow_complete_schemas() {
  local schemas
  schemas=$(apeworkflow __complete schemas 2>/dev/null | cut -f1)
  COMPREPLY=($(compgen -W "$schemas" -- "$cur"))
}`;
