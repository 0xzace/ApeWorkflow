/**
 * Verify command — artifact consistency checks with scorecard output
 *
 * Validates that a change has all required artifacts with proper content,
 * and outputs a scorecard with CRITICAL / WARNING / SUGGESTION priorities.
 */

import { promises as fs } from 'fs';
import path from 'path';
import { validateChangeExists } from './workflow/shared.js';
import { resolvePlanFiles } from '../core/planning-files.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type VerifyPriority = 'CRITICAL' | 'WARNING' | 'SUGGESTION';

export interface VerifyIssue {
  priority: VerifyPriority;
  artifact: string;
  message: string;
  suggestion?: string;
}

export interface VerifyScorecard {
  changeName: string;
  overallScore: number;  // 0-100
  issues: VerifyIssue[];
  checks: Array<{
    name: string;
    status: 'pass' | 'fail' | 'skip';
    detail?: string;
  }>;
}

const REQUIRED_ARTIFACTS = ['proposal', 'specs', 'design', 'tasks', 'plans'];

// ---------------------------------------------------------------------------
// Command
// ---------------------------------------------------------------------------

export class VerifyCommand {
  private issues: VerifyIssue[] = [];
  private checks: VerifyScorecard['checks'] = [];

  /**
   * Execute verification for the given change name.
   */
  async execute(changeName: string, options?: { json?: boolean }): Promise<VerifyScorecard> {
    this.issues = [];
    this.checks = [];

    // Validate change exists
    await validateChangeExists(changeName, process.cwd());

    const changeDir = path.join(process.cwd(), 'apeworkflow', 'changes', changeName);

    // Check each artifact
    for (const artifact of REQUIRED_ARTIFACTS) {
      await this.checkArtifact(changeDir, artifact);
    }

    // Check plan file structure
    await this.checkPlanStructure(changeDir);

    // Calculate score
    const passed = this.checks.filter(c => c.status === 'pass').length;
    const total = this.checks.length;
    const overallScore = total > 0 ? Math.round((passed / total) * 100) : 0;

    const scorecard: VerifyScorecard = {
      changeName,
      overallScore,
      issues: this.issues,
      checks: this.checks,
    };

    if (options?.json) {
      console.log(JSON.stringify(scorecard, null, 2));
    } else {
      this.printScorecard(scorecard);
    }

    return scorecard;
  }

  // ---------------------------------------------------------------------------
  // Private checks
  // ---------------------------------------------------------------------------

  private async checkArtifact(changeDir: string, artifact: string): Promise<void> {
    if (artifact === 'plans') {
      // Plans is a directory with *.md files
      const plansFiles = resolvePlanFiles(changeDir);
      if (plansFiles.length > 0) {
        this.checks.push({ name: artifact, status: 'pass' });
      } else {
        this.issues.push({
          priority: 'CRITICAL',
          artifact,
          message: 'No plan files found under plans/',
          suggestion: 'Generate plans using /ape:propose or the writing-plans skill',
        });
        this.checks.push({ name: artifact, status: 'fail' });
      }
      return;
    }

    // Other artifacts are single files
    const filePath = path.join(changeDir, `${artifact}.md`);
    try {
      await fs.access(filePath);
      const content = await fs.readFile(filePath, 'utf-8');

      if (content.trim().length === 0) {
        this.issues.push({
          priority: 'CRITICAL',
          artifact,
          message: `${artifact}.md exists but is empty`,
          suggestion: `Fill in ${artifact}.md with the required content`,
        });
        this.checks.push({ name: artifact, status: 'fail' });
        return;
      }

      // Check for YAML frontmatter — look for closing --- on its own line
      if (content.startsWith('---')) {
        const standaloneDashes = [...content.matchAll(/^\---\s*$/gm)].map(m => m.index);
        // Remove the opening --- (first match at index 0)
        standaloneDashes.shift();
        if (standaloneDashes.length === 0) {
          this.issues.push({
            priority: 'WARNING',
            artifact,
            message: `${artifact}.md has incomplete YAML frontmatter (missing closing ---)`,
            suggestion: 'Add closing --- after the frontmatter block',
          });
          this.checks.push({ name: artifact, status: 'pass' });
          return;
        }
      }

      // Check for duplicate frontmatter (two --- blocks at start)
      if (this.hasDuplicateFrontmatter(content)) {
        this.issues.push({
          priority: 'WARNING',
          artifact,
          message: `${artifact}.md appears to have duplicate YAML frontmatter blocks`,
          suggestion: 'Remove the duplicate frontmatter block',
        });
        this.checks.push({ name: artifact, status: 'pass' });
        return;
      }

      this.checks.push({ name: artifact, status: 'pass' });
    } catch {
      this.issues.push({
        priority: 'CRITICAL',
        artifact,
        message: `${artifact}.md not found`,
        suggestion: `Create ${artifact}.md or use the appropriate ApeWorkflow command`,
      });
      this.checks.push({ name: artifact, status: 'fail' });
    }
  }

  private async checkPlanStructure(changeDir: string): Promise<void> {
    const plansFiles = resolvePlanFiles(changeDir);
    if (plansFiles.length === 0) {
      return; // Already reported as CRITICAL in checkArtifact
    }

    for (const planFile of plansFiles) {
      try {
        const content = await fs.readFile(planFile, 'utf-8');
        const checkboxCount = (content.match(/^- \[[ xX]\]/g) || []).length;
        if (checkboxCount === 0) {
          this.issues.push({
            priority: 'WARNING',
            artifact: 'plans',
            message: `${path.basename(planFile)} has no checkbox items`,
            suggestion: 'Plan files should contain checkboxed task steps',
          });
        }
        this.checks.push({ name: `plans:${path.basename(planFile)}`, status: 'pass' });
      } catch {
        this.checks.push({ name: `plans:${path.basename(planFile)}`, status: 'fail' });
      }
    }
  }

  private hasDuplicateFrontmatter(content: string): boolean {
    const dashes = content.match(/^---\s*$/gm);
    return dashes ? dashes.length >= 4 : false;
  }

  private printScorecard(scorecard: VerifyScorecard): void {
    console.log(`\nVerify Scorecard: ${scorecard.changeName}`);
    console.log(`Overall Score: ${scorecard.overallScore}/100`);
    console.log();

    for (const check of scorecard.checks) {
      const symbol = check.status === 'pass' ? '✓' : check.status === 'fail' ? '✗' : '~';
      console.log(`  ${symbol} ${check.name}${check.detail ? ` — ${check.detail}` : ''}`);
    }

    if (scorecard.issues.length > 0) {
      console.log();
      console.log('Issues:');
      for (const issue of scorecard.issues) {
        const prefix = issue.priority === 'CRITICAL' ? '🔴' : issue.priority === 'WARNING' ? '🟡' : '🔵';
        console.log(`  ${prefix} [${issue.priority}] ${issue.artifact}: ${issue.message}`);
        if (issue.suggestion) {
          console.log(`      Suggestion: ${issue.suggestion}`);
        }
      }
    }
  }
}
