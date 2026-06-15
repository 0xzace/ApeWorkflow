import { createRequire } from 'module';
import os from 'os';
import {
  createGitHubIssue,
  isGitHubCliAuthenticated,
  isGitHubCliAvailable,
} from '../core/error-reporting/github.js';

const require = createRequire(import.meta.url);

/**
 * Get ApeWorkflow version from package.json
 */
function getVersion(): string {
  try {
    const { version } = require('../../package.json');
    return version;
  } catch {
    return 'unknown';
  }
}

/**
 * Get platform name
 */
function getPlatform(): string {
  return os.platform();
}

/**
 * Get current timestamp in ISO format
 */
function getTimestamp(): string {
  return new Date().toISOString();
}

/**
 * Generate metadata footer for feedback
 */
function generateMetadata(): string {
  const version = getVersion();
  const platform = getPlatform();
  const timestamp = getTimestamp();

  return `---
Submitted via ApeWorkflow CLI
- Version: ${version}
- Platform: ${platform}
- Timestamp: ${timestamp}`;
}

/**
 * Format the feedback title
 */
function formatTitle(message: string): string {
  return `Feedback: ${message}`;
}

/**
 * Format the full feedback body
 */
function formatBody(bodyText?: string): string {
  const parts: string[] = [];

  if (bodyText) {
    parts.push(bodyText);
    parts.push(''); // Empty line before metadata
  }

  parts.push(generateMetadata());

  return parts.join('\n');
}

/**
 * Generate a pre-filled GitHub issue URL for manual submission
 */
function generateManualSubmissionUrl(title: string, body: string): string {
  const repo = '0xzace/ApeWorkflow';
  const encodedTitle = encodeURIComponent(title);
  const encodedBody = encodeURIComponent(body);
  const encodedLabels = encodeURIComponent('feedback');

  return `https://github.com/${repo}/issues/new?title=${encodedTitle}&body=${encodedBody}&labels=${encodedLabels}`;
}

/**
 * Display formatted feedback content for manual submission
 */
function displayFormattedFeedback(title: string, body: string): void {
  console.log('\n--- FORMATTED FEEDBACK ---');
  console.log(`Title: ${title}`);
  console.log(`Labels: feedback`);
  console.log('\nBody:');
  console.log(body);
  console.log('--- END FEEDBACK ---\n');
}

/**
 * 通过共享 GitHub 客户端提交反馈
 */
async function submitViaGhCli(title: string, body: string): Promise<void> {
  try {
    const { issueUrl } = await createGitHubIssue({
      repository: '0xzace/ApeWorkflow',
      title,
      body,
      labels: ['feedback'],
    });

    console.log(`\n✓ Feedback submitted successfully!`);
    console.log(`Issue URL: ${issueUrl}\n`);
  } catch (error: any) {
    // Display the error output from gh CLI
    if (error.stderr) {
      console.error(error.stderr.toString());
    } else if (error.message) {
      console.error(error.message);
    }

    // Exit with the same code as gh CLI
    process.exit(error.status ?? 1);
  }
}

/**
 * Handle fallback when gh CLI is not available or not authenticated
 */
function handleFallback(title: string, body: string, reason: 'missing' | 'unauthenticated'): void {
  if (reason === 'missing') {
    console.log('⚠️  GitHub CLI not found. Manual submission required.');
  } else {
    console.log('⚠️  GitHub authentication required. Manual submission required.');
  }

  displayFormattedFeedback(title, body);

  const manualUrl = generateManualSubmissionUrl(title, body);
  console.log('Please submit your feedback manually:');
  console.log(manualUrl);

  if (reason === 'unauthenticated') {
    console.log('\nTo auto-submit in the future: gh auth login');
  }

  // Exit with success code (fallback is successful)
  process.exit(0);
}

/**
 * Feedback command implementation
 */
export class FeedbackCommand {
  async execute(message: string, options?: { body?: string }): Promise<void> {
    // Format title and body once for all code paths
    const title = formatTitle(message);
    const body = formatBody(options?.body);

    // Check if gh CLI is installed
    if (!isGitHubCliAvailable()) {
      handleFallback(title, body, 'missing');
      return;
    }

    // Check if gh CLI is authenticated
    if (!isGitHubCliAuthenticated()) {
      handleFallback(title, body, 'unauthenticated');
      return;
    }

    // Submit via gh CLI
    await submitViaGhCli(title, body);
  }
}
