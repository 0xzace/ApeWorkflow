/**
 * Instructions Command
 *
 * Generates enriched instructions for creating artifacts or applying tasks.
 * Includes both artifact instructions and apply instructions.
 */

import ora from 'ora';
import path from 'path';
import * as fs from 'fs';
import {
  loadChangeContext,
  generateInstructions,
  resolveSchema,
  resolveArtifactOutputs,
  type ArtifactInstructions,
} from '../../core/artifact-graph/index.js';
import {
  parseChecklistItems,
  resolvePlanFiles,
  resolvePlanningTrackingFiles,
} from '../../core/planning-files.js';
import { getChangeDir, resolveCurrentPlanningHomeSync } from '../../core/planning-home.js';
import {
  validateChangeExists,
  validateSchemaExists,
  type TaskItem,
  type ApplyInstructions,
  type VerifyInstructions,
  type ArchiveInstructions,
  type VerifyInstructionsOptions,
  type ArchiveInstructionsOptions,
  type TaskTypeRouting,
} from './shared.js';

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export interface InstructionsOptions {
  change?: string;
  schema?: string;
  json?: boolean;
}

export interface ApplyInstructionsOptions {
  change?: string;
  schema?: string;
  json?: boolean;
}

// -----------------------------------------------------------------------------
// Artifact Instructions Command
// -----------------------------------------------------------------------------

export async function instructionsCommand(
  artifactId: string | undefined,
  options: InstructionsOptions
): Promise<void> {
  const spinner = options.json ? undefined : ora('Generating instructions...').start();

  try {
    const planningHome = resolveCurrentPlanningHomeSync();
    const projectRoot = planningHome.root;
    const changeName = await validateChangeExists(
      options.change,
      projectRoot,
      planningHome.changesDir
    );

    // Validate schema if explicitly provided
    if (options.schema) {
      validateSchemaExists(options.schema, projectRoot);
    }

    // loadChangeContext will auto-detect schema from metadata if not provided
    const context = loadChangeContext(projectRoot, changeName, options.schema, {
      changeDir: getChangeDir(planningHome, changeName),
      planningHome,
    });

    if (!artifactId) {
      spinner?.stop();
      const validIds = context.graph.getAllArtifacts().map((a) => a.id);
      throw new Error(
        `Missing required argument <artifact>. Valid artifacts:\n  ${validIds.join('\n  ')}`
      );
    }

    const artifact = context.graph.getArtifact(artifactId);

    if (!artifact) {
      spinner?.stop();
      const validIds = context.graph.getAllArtifacts().map((a) => a.id);
      throw new Error(
        `Artifact '${artifactId}' not found in schema '${context.schemaName}'. Valid artifacts:\n  ${validIds.join('\n  ')}`
      );
    }

    const instructions = generateInstructions(context, artifactId, projectRoot);
    const isBlocked = instructions.dependencies.some((d) => !d.done);

    spinner?.stop();

    if (options.json) {
      console.log(JSON.stringify(instructions, null, 2));
      return;
    }

    printInstructionsText(instructions, isBlocked);
  } catch (error) {
    spinner?.stop();
    throw error;
  }
}

export function printInstructionsText(instructions: ArtifactInstructions, isBlocked: boolean): void {
  const {
    artifactId,
    changeName,
    schemaName,
    changeDir,
    initiative,
    resolvedOutputPath,
    description,
    instruction,
    context,
    rules,
    template,
    dependencies,
    unlocks,
  } = instructions;

  // Opening tag
  console.log(`<artifact id="${artifactId}" change="${changeName}" schema="${schemaName}">`);
  console.log();

  if (initiative) {
    console.log(`<initiative store="${initiative.store}" id="${initiative.id}" />`);
    console.log();
  }

  // Warning for blocked artifacts
  if (isBlocked) {
    const missing = dependencies.filter((d) => !d.done).map((d) => d.id);
    console.log('<warning>');
    console.log('This artifact has unmet dependencies. Complete them first or proceed with caution.');
    console.log(`Missing: ${missing.join(', ')}`);
    console.log('</warning>');
    console.log();
  }

  // Task directive
  console.log('<task>');
  console.log(`Create the ${artifactId} artifact for change "${changeName}".`);
  console.log(description);
  console.log('</task>');
  console.log();

  // Project context (AI constraint - do not include in output)
  if (context) {
    console.log('<project_context>');
    console.log('<!-- This is background information for you. Do NOT include this in your output. -->');
    console.log(context);
    console.log('</project_context>');
    console.log();
  }

  // Rules (AI constraint - do not include in output)
  if (rules && rules.length > 0) {
    console.log('<rules>');
    console.log('<!-- These are constraints for you to follow. Do NOT include this in your output. -->');
    for (const rule of rules) {
      console.log(`- ${rule}`);
    }
    console.log('</rules>');
    console.log();
  }

  // Dependencies (files to read for context)
  if (dependencies.length > 0) {
    console.log('<dependencies>');
    console.log('Read these files for context before creating this artifact:');
    console.log();
    for (const dep of dependencies) {
      const status = dep.done ? 'done' : 'missing';
      const fullPath = path.join(changeDir, dep.path);
      console.log(`<dependency id="${dep.id}" status="${status}">`);
      console.log(`  <path>${fullPath}</path>`);
      console.log(`  <description>${dep.description}</description>`);
      console.log('</dependency>');
    }
    console.log('</dependencies>');
    console.log();
  }

  // Output location
  console.log('<output>');
  console.log(`Write to: ${resolvedOutputPath}`);
  console.log('</output>');
  console.log();

  // Instruction (guidance)
  if (instruction) {
    console.log('<instruction>');
    console.log(instruction.trim());
    console.log('</instruction>');
    console.log();
  }

  // Template
  console.log('<template>');
  console.log('<!-- Use this as the structure for your output file. Fill in the sections. -->');
  console.log(template.trim());
  console.log('</template>');
  console.log();

  // Success criteria placeholder
  console.log('<success_criteria>');
  console.log('<!-- To be defined in schema validation rules -->');
  console.log('</success_criteria>');
  console.log();

  // Unlocks
  if (unlocks.length > 0) {
    console.log('<unlocks>');
    console.log(`Completing this artifact enables: ${unlocks.join(', ')}`);
    console.log('</unlocks>');
    console.log();
  }

  // Closing tag
  console.log('</artifact>');
}

// -----------------------------------------------------------------------------
// Apply Instructions Command
// -----------------------------------------------------------------------------

/**
 * Generates apply instructions for implementing tasks from a change.
 * Schema-aware: reads apply phase configuration from schema to determine
 * required artifacts, tracking file, and instruction.
 */
export async function generateApplyInstructions(
  projectRoot: string,
  changeName: string,
  schemaName?: string,
  planningHome = resolveCurrentPlanningHomeSync({ startPath: projectRoot })
): Promise<ApplyInstructions> {
  // loadChangeContext will auto-detect schema from metadata if not provided
  const context = loadChangeContext(projectRoot, changeName, schemaName, {
    changeDir: getChangeDir(planningHome, changeName),
    planningHome,
  });
  const changeDir = context.changeDir;

  // Get the full schema to access the apply phase configuration
  const schema = resolveSchema(context.schemaName, projectRoot);

  // Prefer phases.apply (new) over top-level apply (legacy)
  const applyConfig = schema.phases?.apply ?? schema.apply;

  // Determine required artifacts and tracking file from schema
  // Fallback: if no apply block, require all artifacts
  const requiredArtifactIds = applyConfig?.requires ?? schema.artifacts.map((a) => a.id);
  const tracksFile = applyConfig?.tracks ?? null;
  const schemaInstruction = applyConfig?.instruction ?? null;

  // Extract taskTypeRouting from phases.apply or top-level apply
  const routingSource = schema.phases?.apply ?? schema.apply;
  let taskTypeRouting: ApplyInstructions['taskTypeRouting'] | undefined;
  if (routingSource?.taskTypeRouting) {
    const rt = routingSource.taskTypeRouting;
    taskTypeRouting = {
      default: rt.default,
      taskTypes: rt.taskTypes ?? {},
    };
  }

  // Check which required artifacts are missing
  const missingArtifacts: string[] = [];
  for (const artifactId of requiredArtifactIds) {
    const artifact = schema.artifacts.find((a) => a.id === artifactId);
    if (artifact && resolveArtifactOutputs(changeDir, artifact.generates).length === 0) {
      missingArtifacts.push(artifactId);
    }
  }

  // Build context files from all existing artifacts in schema
  const contextFiles: Record<string, string[]> = {};
  for (const artifact of schema.artifacts) {
    if (artifact.id === 'tasks') {
      continue;
    }
    const outputs = resolveArtifactOutputs(changeDir, artifact.generates);
    if (outputs.length > 0) {
      contextFiles[artifact.id] = outputs;
    }
  }

  // 中文注释：优先把 plans/ 里的计划文件暴露给 apply，让下游直接读主计划。
  const planningFiles = resolvePlanFiles(changeDir);
  if (planningFiles.length > 0) {
    contextFiles.plans = planningFiles;
  }

  // 中文注释：apply 只暴露实现所需的核心上下文，不再把 tasks.md 当作执行输入。
  let tasks: TaskItem[] = [];
  let tracksFileExists = false;
  if (tracksFile) {
    const trackingFiles = resolvePlanningTrackingFiles(changeDir, tracksFile);
    tracksFileExists = trackingFiles.length > 0;
    if (tracksFileExists) {
      for (const trackingFile of trackingFiles) {
        const tasksContent = await fs.promises.readFile(trackingFile, 'utf-8');
        const parsed = parseChecklistItems(tasksContent);
        for (const item of parsed) {
          tasks.push({
            id: `${tasks.length + 1}`,
            description: item.description,
            done: item.done,
          });
        }
      }
    }
  }

  const tracksLabel = tracksFile
    ? (tracksFile.includes('*') ? tracksFile : path.basename(tracksFile))
    : '';

  // Calculate progress
  const total = tasks.length;
  const complete = tasks.filter((t) => t.done).length;
  const remaining = total - complete;

  // Determine state and instruction
  let state: ApplyInstructions['state'];
  let instruction: string;

  if (missingArtifacts.length > 0) {
    state = 'blocked';
    instruction = `Cannot apply this change yet. Missing artifacts: ${missingArtifacts.join(', ')}.\nUse the apeworkflow-continue-change skill to create the missing artifacts first.`;
  } else if (tracksFile && !tracksFileExists) {
    // Tracking file configured but doesn't exist yet
    state = 'blocked';
    instruction = `The ${tracksLabel} file is missing and must be created.\nUse apeworkflow-continue-change to generate the tracking file.`;
  } else if (tracksFile && tracksFileExists && total === 0) {
    // Tracking file exists but contains no tasks
    state = 'blocked';
    instruction = `The ${tracksLabel} file exists but contains no tasks.\nAdd tasks to ${tracksLabel} or regenerate it with apeworkflow-continue-change.`;
  } else if (tracksFile && remaining === 0 && total > 0) {
    state = 'all_done';
    instruction = 'All tasks are complete! This change is ready to be archived.\nConsider running tests and reviewing the changes before archiving.';
  } else if (!tracksFile) {
    // No tracking file configured in schema - ready to apply
    state = 'ready';
    instruction = schemaInstruction?.trim() ?? 'All required artifacts complete. Proceed with implementation.';
  } else {
    state = 'ready';
    instruction = schemaInstruction?.trim() ?? 'Read the plan files, work through pending tasks, mark complete as you go.\nPause if you hit blockers or need clarification.';
  }

  return {
    changeName,
    changeDir,
    schemaName: context.schemaName,
    ...(context.initiative ? { initiative: context.initiative } : {}),
    contextFiles,
    progress: { total, complete, remaining },
    tasks,
    state,
    missingArtifacts: missingArtifacts.length > 0 ? missingArtifacts : undefined,
    instruction,
    taskTypeRouting,
  };
}

export async function applyInstructionsCommand(options: ApplyInstructionsOptions): Promise<void> {
  const spinner = options.json ? undefined : ora('Generating apply instructions...').start();

  try {
    const planningHome = resolveCurrentPlanningHomeSync();
    const projectRoot = planningHome.root;
    const changeName = await validateChangeExists(
      options.change,
      projectRoot,
      planningHome.changesDir
    );

    // Validate schema if explicitly provided
    if (options.schema) {
      validateSchemaExists(options.schema, projectRoot);
    }

    // generateApplyInstructions uses loadChangeContext which auto-detects schema
    const instructions = await generateApplyInstructions(
      projectRoot,
      changeName,
      options.schema,
      planningHome
    );

    spinner?.stop();

    if (options.json) {
      console.log(JSON.stringify(instructions, null, 2));
      return;
    }

    printApplyInstructionsText(instructions);
  } catch (error) {
    spinner?.stop();
    throw error;
  }
}

export function printApplyInstructionsText(instructions: ApplyInstructions): void {
  const { changeName, schemaName, initiative, contextFiles, progress, tasks, state, missingArtifacts, instruction } = instructions;

  console.log(`## Apply: ${changeName}`);
  console.log(`Schema: ${schemaName}`);
  if (initiative) {
    console.log(`Initiative: ${initiative.store}/${initiative.id}`);
  }
  console.log();

  // Warning for blocked state
  if (state === 'blocked' && missingArtifacts) {
    console.log('### ⚠️ Blocked');
    console.log();
    console.log(`Missing artifacts: ${missingArtifacts.join(', ')}`);
    console.log('Use the apeworkflow-continue-change skill to create these first.');
    console.log();
  }

  // Context files (dynamically from schema)
  const contextFileEntries = Object.entries(contextFiles);
  if (contextFileEntries.length > 0) {
    console.log('### Context Files');
    for (const [artifactId, filePaths] of contextFileEntries) {
      for (const filePath of filePaths) {
        console.log(`- ${artifactId}: ${filePath}`);
      }
    }
    console.log();
  }

  // Progress (only show if we have tracking)
  if (progress.total > 0 || tasks.length > 0) {
    console.log('### Progress');
    if (state === 'all_done') {
      console.log(`${progress.complete}/${progress.total} complete ✓`);
    } else {
      console.log(`${progress.complete}/${progress.total} complete`);
    }
    console.log();
  }

  // Tasks
  if (tasks.length > 0) {
    console.log('### Tasks');
    for (const task of tasks) {
      const checkbox = task.done ? '[x]' : '[ ]';
      console.log(`- ${checkbox} ${task.description}`);
    }
    console.log();
  }

  // Instruction
  console.log('### Instruction');
  console.log(instruction);

  // Task type routing (if present)
  if (instructions.taskTypeRouting) {
    console.log();
    console.log('### Task Type Routing');
    console.log(JSON.stringify(instructions.taskTypeRouting, null, 2));
  }
}

// -----------------------------------------------------------------------------
// Verify Instructions Command
// -----------------------------------------------------------------------------

/**
 * Generates verify instructions for a change.
 */
export async function generateVerifyInstructions(
  projectRoot: string,
  changeName: string,
  schemaName?: string,
  planningHome = resolveCurrentPlanningHomeSync({ startPath: projectRoot })
): Promise<VerifyInstructions> {
  const context = loadChangeContext(projectRoot, changeName, schemaName, {
    changeDir: getChangeDir(planningHome, changeName),
    planningHome,
  });
  const changeDir = context.changeDir;

  const schema = resolveSchema(context.schemaName, projectRoot);
  const verifyPhase = schema.phases?.verify;

  // Check required artifacts (same pattern as apply)
  const requiredArtifactIds = verifyPhase?.requires ?? schema.artifacts.map((a) => a.id);
  const missingArtifacts: string[] = [];
  for (const artifactId of requiredArtifactIds) {
    const artifact = schema.artifacts.find((a) => a.id === artifactId);
    if (artifact && resolveArtifactOutputs(changeDir, artifact.generates).length === 0) {
      missingArtifacts.push(artifactId);
    }
  }

  // Build context files from existing artifacts
  const contextFiles: Record<string, string[]> = {};
  for (const artifact of schema.artifacts) {
    if (artifact.id === 'tasks') continue;
    const outputs = resolveArtifactOutputs(changeDir, artifact.generates);
    if (outputs.length > 0) {
      contextFiles[artifact.id] = outputs;
    }
  }

  // Check plans for incomplete tasks
  const planningFiles = resolvePlanFiles(changeDir);
  let hasIncompleteTasks = false;
  for (const pf of planningFiles) {
    const content = await fs.promises.readFile(pf, 'utf-8');
    const items = parseChecklistItems(content);
    if (items.some(i => !i.done)) {
      hasIncompleteTasks = true;
      break;
    }
  }

  // Extract taskTypeRouting
  let taskTypeRouting: VerifyInstructions['taskTypeRouting'] | undefined;
  if (verifyPhase?.taskTypeRouting) {
    const rt = verifyPhase.taskTypeRouting;
    taskTypeRouting = { default: rt.default, taskTypes: rt.taskTypes ?? {} };
  }

  const state: VerifyInstructions['state'] = missingArtifacts.length > 0 ? 'blocked' : 'ready';

  return {
    changeName,
    changeDir,
    schemaName: context.schemaName,
    ...(context.initiative ? { initiative: context.initiative } : {}),
    contextFiles,
    taskTypeRouting,
    state,
    missingArtifacts: missingArtifacts.length > 0 ? missingArtifacts : undefined,
    hasIncompleteTasks,
    instruction: verifyPhase?.instruction ?? 'Verify the implementation.',
  };
}

/**
 * Print verify instructions in text format.
 */
export function printVerifyInstructionsText(instructions: VerifyInstructions): void {
  const { changeName, schemaName, initiative, contextFiles, state, missingArtifacts, hasIncompleteTasks, instruction, taskTypeRouting } = instructions;

  console.log(`## Verify: ${changeName}`);
  console.log(`Schema: ${schemaName}`);
  if (initiative) {
    console.log(`Initiative: ${initiative.store}/${initiative.id}`);
  }
  console.log();

  if (state === 'blocked' && missingArtifacts) {
    console.log('### Blocked');
    console.log(`Missing artifacts: ${missingArtifacts.join(', ')}`);
    console.log();
  }

  if (hasIncompleteTasks) {
    console.log('### Warning');
    console.log('Change has incomplete tasks.');
    console.log();
  }

  const contextFileEntries = Object.entries(contextFiles);
  if (contextFileEntries.length > 0) {
    console.log('### Context Files');
    for (const [artifactId, filePaths] of contextFileEntries) {
      for (const filePath of filePaths) {
        console.log(`- ${artifactId}: ${filePath}`);
      }
    }
    console.log();
  }

  console.log('### Instruction');
  console.log(instruction);

  if (taskTypeRouting) {
    console.log();
    console.log('### Task Type Routing');
    console.log(JSON.stringify(taskTypeRouting, null, 2));
  }
}

// -----------------------------------------------------------------------------
// Archive Instructions Command
// -----------------------------------------------------------------------------

/**
 * Generates archive instructions for a change.
 */
export async function generateArchiveInstructions(
  projectRoot: string,
  changeName: string,
  schemaName?: string,
  planningHome = resolveCurrentPlanningHomeSync({ startPath: projectRoot })
): Promise<ArchiveInstructions> {
  const context = loadChangeContext(projectRoot, changeName, schemaName, {
    changeDir: getChangeDir(planningHome, changeName),
    planningHome,
  });
  const changeDir = context.changeDir;

  const schema = resolveSchema(context.schemaName, projectRoot);
  const archivePhase = schema.phases?.archive;

  // Check artifact completion status
  const artifacts: Array<{ id: string; status: string }> = [];
  let hasIncompleteArtifacts = false;
  for (const artifact of schema.artifacts) {
    const outputs = resolveArtifactOutputs(changeDir, artifact.generates);
    const status = outputs.length > 0 ? 'done' : 'pending';
    artifacts.push({ id: artifact.id, status });
    if (status !== 'done') {
      hasIncompleteArtifacts = true;
    }
  }

  // Check plans for incomplete tasks
  const planningFiles = resolvePlanFiles(changeDir);
  let hasIncompleteTasks = false;
  for (const pf of planningFiles) {
    const content = await fs.promises.readFile(pf, 'utf-8');
    const items = parseChecklistItems(content);
    if (items.some(i => !i.done)) {
      hasIncompleteTasks = true;
      break;
    }
  }

  // Check for delta specs
  const specsOutputs = resolveArtifactOutputs(changeDir, 'specs/**/*.md');
  const hasDeltaSpecs = specsOutputs.length > 0;

  // Extract taskTypeRouting
  let taskTypeRouting: ArchiveInstructions['taskTypeRouting'] | undefined;
  if (archivePhase?.taskTypeRouting) {
    const rt = archivePhase.taskTypeRouting;
    taskTypeRouting = { default: rt.default, taskTypes: rt.taskTypes ?? {} };
  }

  return {
    changeName,
    changeDir,
    schemaName: context.schemaName,
    ...(context.initiative ? { initiative: context.initiative } : {}),
    taskTypeRouting,
    instruction: archivePhase?.instruction ?? 'Archive the completed change.',
    hasDeltaSpecs,
    hasIncompleteTasks,
    hasIncompleteArtifacts,
    artifacts,
  };
}

/**
 * Print archive instructions in text format.
 */
export function printArchiveInstructionsText(instructions: ArchiveInstructions): void {
  const { changeName, schemaName, initiative, taskTypeRouting, instruction, hasDeltaSpecs, hasIncompleteTasks, hasIncompleteArtifacts, artifacts } = instructions;

  console.log(`## Archive: ${changeName}`);
  console.log(`Schema: ${schemaName}`);
  if (initiative) {
    console.log(`Initiative: ${initiative.store}/${initiative.id}`);
  }
  console.log();

  // Warnings
  if (hasIncompleteArtifacts) {
    const incomplete = artifacts.filter(a => a.status !== 'done').map(a => a.id);
    console.log(`### Warning: Incomplete artifacts: ${incomplete.join(', ')}`);
    console.log();
  }
  if (hasIncompleteTasks) {
    console.log('### Warning: Incomplete tasks');
    console.log();
  }

  // Artifact status summary
  console.log('### Artifact Status');
  for (const a of artifacts) {
    const mark = a.status === 'done' ? '[x]' : '[ ]';
    console.log(`- ${mark} ${a.id} (${a.status})`);
  }
  console.log();

  console.log('### Instruction');
  console.log(instruction);

  if (taskTypeRouting) {
    console.log();
    console.log('### Task Type Routing');
    console.log(JSON.stringify(taskTypeRouting, null, 2));
  }
}

// CLI handler for verify instructions
export async function verifyInstructionsCommand(options: VerifyInstructionsOptions): Promise<void> {
  const spinner = options.json ? undefined : ora('Generating verify instructions...').start();

  try {
    const planningHome = resolveCurrentPlanningHomeSync();
    const projectRoot = planningHome.root;
    const changeName = await validateChangeExists(
      options.change,
      projectRoot,
      planningHome.changesDir
    );

    if (options.schema) {
      validateSchemaExists(options.schema, projectRoot);
    }

    const instructions = await generateVerifyInstructions(
      projectRoot,
      changeName,
      options.schema,
      planningHome
    );

    spinner?.stop();

    if (options.json) {
      console.log(JSON.stringify(instructions, null, 2));
      return;
    }

    printVerifyInstructionsText(instructions);
  } catch (error) {
    spinner?.stop();
    throw error;
  }
}

// CLI handler for archive instructions
export async function archiveInstructionsCommand(options: ArchiveInstructionsOptions): Promise<void> {
  const spinner = options.json ? undefined : ora('Generating archive instructions...').start();

  try {
    const planningHome = resolveCurrentPlanningHomeSync();
    const projectRoot = planningHome.root;
    const changeName = await validateChangeExists(
      options.change,
      projectRoot,
      planningHome.changesDir
    );

    if (options.schema) {
      validateSchemaExists(options.schema, projectRoot);
    }

    const instructions = await generateArchiveInstructions(
      projectRoot,
      changeName,
      options.schema,
      planningHome
    );

    spinner?.stop();

    if (options.json) {
      console.log(JSON.stringify(instructions, null, 2));
      return;
    }

    printArchiveInstructionsText(instructions);
  } catch (error) {
    spinner?.stop();
    throw error;
  }
}
