/**
 * Command Reference Utilities
 *
 * Utilities for transforming command references to tool-specific formats.
 */

/**
 * Transforms colon-based command references to hyphen-based format.
 * Converts `/ape:` patterns to `/ape-` for tools that use hyphen syntax.
 *
 * @param text - The text containing command references
 * @returns Text with command references transformed to hyphen format
 *
 * @example
 * transformToHyphenCommands('/ape:new') // returns '/ape-new'
 * transformToHyphenCommands('Use /ape:apply to implement') // returns 'Use /ape-apply to implement'
 */
export function transformToHyphenCommands(text: string): string {
  return text.replace(/\/ape:/g, '/ape-');
}
