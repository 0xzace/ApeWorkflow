import { describe, expect, it } from 'vitest';
import { ContextStoreError, makeContextStoreDiagnostic } from '../../../src/core/context-store/errors.js';

describe('context-store/errors', () => {
  it('会把 ContextStoreError 转成带诊断信息的错误对象', () => {
    const error = new ContextStoreError('Pass a context store name.', 'context_store_setup_id_required', {
      target: 'context_store.id',
      fix: 'apeworkflow context-store setup <id> --path /path/to/context-store --json',
    });

    // 中文注释：这里直接断言错误类的诊断结构，避免绕到上层命令才看到问题。
    expect(error.name).toBe('ContextStoreError');
    expect(error.message).toBe('Pass a context store name.');
    expect(error.diagnostic).toEqual({
      severity: 'error',
      code: 'context_store_setup_id_required',
      message: 'Pass a context store name.',
      target: 'context_store.id',
      fix: 'apeworkflow context-store setup <id> --path /path/to/context-store --json',
    });
  });

  it('会创建指定级别的上下文存储诊断', () => {
    const diagnostic = makeContextStoreDiagnostic('warning', 'context_store_warning', 'Be careful', {
      target: 'context_store.root',
      fix: 'Check the configured root path.',
    });

    expect(diagnostic).toEqual({
      severity: 'warning',
      code: 'context_store_warning',
      message: 'Be careful',
      target: 'context_store.root',
      fix: 'Check the configured root path.',
    });
  });
});
