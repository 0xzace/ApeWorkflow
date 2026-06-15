/**
 * 欢迎界面。
 * 保留左右分栏布局，但把文案和配色统一成 ApeWorkflow 的品牌风格。
 */

import chalk from 'chalk';
import { WELCOME_ANIMATION } from './ascii-patterns.js';
import { getVisibleCommandEntries } from '../core/templates/visible-command-surface.js';

// Minimum terminal width for side-by-side layout
const MIN_WIDTH = 60;

// Width of the ASCII art column (with padding)
const ART_COLUMN_WIDTH = 24;

// 品牌强调色：和 README 里的视觉资源保持一致
const BRAND_GOLD = chalk.hex('#C8A96A');
const BRAND_TEXT = chalk.hex('#E2E8F0');
const BRAND_MUTED = chalk.hex('#94A3B8');
const BRAND_CYAN = chalk.hex('#5EEAD4');

const visibleCommandEntries = getVisibleCommandEntries();

function renderVisibleCommandLine(commandId: string, description: string): string {
  return `  ${BRAND_GOLD(`/ape:${commandId}`)} ${BRAND_MUTED(description)}`;
}

/**
 * Welcome text content (right column)
 */
export function getWelcomeText(): string[] {
  return [
    BRAND_GOLD.bold('ApeWorkflow'),
    BRAND_MUTED('Spec-driven workflow for AI coding assistants'),
    '',
    BRAND_TEXT('This setup will configure:'),
    // 启动页只展示当前可见的工作流能力，不再出现旧的隐藏命令。
    BRAND_MUTED('  • Agent Skills for AI tools'),
    BRAND_MUTED('  • Workflow-driven methodology and the visible command surface'),
    BRAND_MUTED('  • Project-local workflow files'),
    '',
    BRAND_TEXT('Quick start after setup:'),
    ...visibleCommandEntries.map((command) => renderVisibleCommandLine(command.id, command.description)),
    '',
    BRAND_CYAN('Press Enter to select tools...'),
  ];
}

/**
 * Renders a single frame with side-by-side layout
 */
function renderFrame(artLines: string[], textLines: string[]): string {
  const maxLines = Math.max(artLines.length, textLines.length);
  const lines: string[] = [];

  for (let i = 0; i < maxLines; i++) {
    const artLine = artLines[i] || '';
    const textLine = textLines[i] || '';

    // Pad the art column to fixed width
    const paddedArt = artLine.padEnd(ART_COLUMN_WIDTH);

    // 使用品牌金色渲染左侧徽记，让启动页和资源视觉保持一致
    const coloredArt = BRAND_GOLD(paddedArt);

    // Clear line before writing to prevent residual characters
    lines.push(`\x1b[2K${coloredArt}${textLine}`);
  }

  return lines.join('\n');
}

/**
 * Checks if the terminal supports animation
 */
function canAnimate(): boolean {
  // Must be TTY
  if (!process.stdout.isTTY) return false;

  // Respect NO_COLOR
  if (process.env.NO_COLOR) return false;

  // Check terminal width
  const columns = process.stdout.columns || 80;
  if (columns < MIN_WIDTH) return false;

  return true;
}

/**
 * Wait for Enter key press
 */
function waitForEnter(): Promise<void> {
  return new Promise((resolve) => {
    const { stdin } = process;

    // Handle non-TTY gracefully
    if (!stdin.isTTY) {
      resolve();
      return;
    }

    const wasRaw = stdin.isRaw;
    stdin.setRawMode(true);
    stdin.resume();

    const onData = (data: Buffer): void => {
      const char = data.toString();

      // Enter key or Ctrl+C
      if (char === '\r' || char === '\n' || char === '\u0003') {
        stdin.removeListener('data', onData);
        stdin.setRawMode(wasRaw);
        stdin.pause();

        // Handle Ctrl+C
        if (char === '\u0003') {
          process.stdout.write('\n');
          process.exit(0);
        }

        resolve();
      }
    };

    stdin.on('data', onData);
  });
}

/**
 * Shows the animated welcome screen.
 * Returns when user presses Enter.
 */
export async function showWelcomeScreen(): Promise<void> {
  const textLines = getWelcomeText();

  if (!canAnimate()) {
    // Fallback: show static welcome
    const frame = WELCOME_ANIMATION.frames[3]; // 静态兜底帧
    process.stdout.write('\n' + renderFrame(frame, textLines) + '\n\n');
    return;
  }

  let frameIndex = 0;
  let running = true;
  let isFirstRender = true;

  // Content height for cursor movement between frames
  const numContentLines = Math.max(WELCOME_ANIMATION.frames[0].length, textLines.length);
  const frameHeight = numContentLines + 1; // internal newlines (11) + trailing newlines (2) = 13

  // Total height including initial newline (for cleanup)
  const totalHeight = frameHeight + 1; // 14

  // Initial render
  process.stdout.write('\n');

  // Animation loop
  const interval = setInterval(() => {
    if (!running) return;

    const frame = WELCOME_ANIMATION.frames[frameIndex];

    // Move cursor up to overwrite previous frame (always after first render)
    if (!isFirstRender) {
      process.stdout.write(`\x1b[${frameHeight}A`);
    }
    isFirstRender = false;

    // Render current frame
    process.stdout.write(renderFrame(frame, textLines) + '\n\n');

    // Advance to next frame
    frameIndex = (frameIndex + 1) % WELCOME_ANIMATION.frames.length;
  }, WELCOME_ANIMATION.interval);

  // Wait for Enter
  await waitForEnter();

  // Stop animation
  running = false;
  clearInterval(interval);

  // Clear the welcome screen and move on
  process.stdout.write(`\x1b[${totalHeight}A`);
  for (let i = 0; i < totalHeight; i++) {
    process.stdout.write('\x1b[2K\n'); // Clear line
  }
  process.stdout.write(`\x1b[${totalHeight}A`); // Move back up
}
