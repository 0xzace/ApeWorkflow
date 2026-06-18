#!/usr/bin/env node

import { execFileSync } from 'child_process';
import { existsSync, rmSync, readdirSync, copyFileSync, mkdirSync, statSync } from 'fs';
import { createRequire } from 'module';
import path from 'path';

const require = createRequire(import.meta.url);

const runTsc = (args = []) => {
  const tscPath = require.resolve('typescript/bin/tsc');
  execFileSync(process.execPath, [tscPath, ...args], { stdio: 'inherit' });
};

function copyDirRecursive(src, dst) {
  mkdirSync(dst, { recursive: true });
  for (const entry of readdirSync(src)) {
    const srcPath = path.join(src, entry);
    const dstPath = path.join(dst, entry);
    const s = statSync(srcPath);
    if (s.isDirectory()) {
      copyDirRecursive(srcPath, dstPath);
    } else {
      copyFileSync(srcPath, dstPath);
    }
  }
}

console.log('🔨 Building ApeWorkflow...\n');

// Clean dist directory
if (existsSync('dist')) {
  console.log('Cleaning dist directory...');
  rmSync('dist', { recursive: true, force: true });
}

// Run TypeScript compiler (use local version explicitly)
console.log('Compiling TypeScript...');
try {
  runTsc(['--version']);
  runTsc();
} catch (error) {
  console.error('\n❌ Build failed!');
  process.exit(1);
}

// Copy static template files (.md, etc.) to dist
// These are used at runtime by update.ts and other modules.
console.log('Copying static template files...');
const srcTemplates = path.join('src', 'core', 'templates');
const dstTemplates = path.join('dist', 'core', 'templates');
if (existsSync(srcTemplates)) {
  try {
    copyDirRecursive(srcTemplates, dstTemplates);
    console.log('  Copied templates to dist/core/templates/');
  } catch (e) {
    console.warn('  Warning: Failed to copy templates:', e.message);
  }
}

console.log('\n✅ Build completed successfully!');
