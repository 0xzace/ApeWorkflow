import { z } from 'zod';

// Artifact definition schema
export const ArtifactSchema = z.object({
  id: z.string().min(1, { error: 'Artifact ID is required' }),
  generates: z.string().min(1, { error: 'generates field is required' }),
  description: z.string(),
  template: z.string().min(1, { error: 'template field is required' }),
  instruction: z.string().optional(),
  requires: z.array(z.string()).default([]),
});

// Task type routing: maps task types to skill chains for a phase
export const TaskTypeRoutingSchema = z.object({
  // Default skill chain when task type is not recognized
  default: z
    .array(z.string().min(1))
    .min(1, { error: 'At least one default skill chain is required' }),
  // Map from task type name to skill chain (optional)
  taskTypes: z.record(z.string(), z.array(z.string().min(1)).min(1)).optional(),
});

export type TaskTypeRouting = z.infer<typeof TaskTypeRoutingSchema>;

// Phase configuration (generic: applies to apply, verify, archive, or future phases)
export const PhaseConfigSchema = z.object({
  // Artifact IDs that must exist before the phase is available (optional for non-apply phases)
  requires: z.array(z.string()).min(1, { error: 'At least one required artifact' }).optional(),
  // Path to file with checkboxes for progress (relative to change dir), or null if no tracking
  tracks: z.string().nullable().optional(),
  // Custom guidance for the phase
  instruction: z.string().optional(),
  // Task type → skill chain routing for this phase
  taskTypeRouting: TaskTypeRoutingSchema.optional(),
});

// Full schema YAML structure
export const SchemaYamlSchema = z.object({
  name: z.string().min(1, { error: 'Schema name is required' }),
  version: z.number().int().positive({ error: 'Version must be a positive integer' }),
  description: z.string().optional(),
  artifacts: z.array(ArtifactSchema).min(1, { error: 'At least one artifact required' }),
  // Legacy apply phase configuration (kept for backward compatibility)
  apply: PhaseConfigSchema.optional(),
  // Named phases (apply, verify, archive, etc.) — supersedes top-level apply
  phases: z.record(z.string(), PhaseConfigSchema).optional(),
});

// Derived TypeScript types
export type Artifact = z.infer<typeof ArtifactSchema>;
export type PhaseConfig = z.infer<typeof PhaseConfigSchema>;

// Backward-compatible alias
export const ApplyPhaseSchema = PhaseConfigSchema;
export type ApplyPhase = PhaseConfig;

export type SchemaYaml = z.infer<typeof SchemaYamlSchema>;

// Runtime state types (not Zod - internal only)

// Slice 1: Simple completion tracking via filesystem
export type CompletedSet = Set<string>;

// Return type for blocked query
export interface BlockedArtifacts {
  [artifactId: string]: string[];
}
