import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  waitForEvent,
  waitForEventCount,
  waitForEventMatch,
  type LaceEvent,
  type ThreadManager,
} from '../../../../../src/core/templates/workflows/apeworkflow-systematic-debugging/condition-based-waiting-example.js';

class FakeThreadManager implements ThreadManager {
  constructor(private readonly eventsByThreadId: Record<string, LaceEvent[]>) {}

  getEvents(threadId: string): LaceEvent[] {
    return this.eventsByThreadId[threadId] ?? [];
  }
}

afterEach(() => {
  // 这里统一恢复真实定时器，避免 fake timer 泄漏到其他测试。
  vi.useRealTimers();
});

describe('condition-based waiting example', () => {
  it('waitForEvent resolves the first matching event', async () => {
    const manager = new FakeThreadManager({
      thread_1: [
        { type: 'INFO', data: { id: 'ignore' } },
        { type: 'TOOL_RESULT', data: { id: 'call_123' } },
      ],
    });

    await expect(waitForEvent(manager, 'thread_1', 'TOOL_RESULT')).resolves.toEqual({
      type: 'TOOL_RESULT',
      data: { id: 'call_123' },
    });
  });

  it('waitForEventCount resolves once enough matching events exist', async () => {
    const manager = new FakeThreadManager({
      thread_1: [
        { type: 'TOOL_CALL', data: { id: '1' } },
        { type: 'TOOL_CALL', data: { id: '2' } },
        { type: 'TOOL_RESULT', data: { id: '1' } },
      ],
    });

    await expect(waitForEventCount(manager, 'thread_1', 'TOOL_CALL', 2)).resolves.toEqual([
      { type: 'TOOL_CALL', data: { id: '1' } },
      { type: 'TOOL_CALL', data: { id: '2' } },
    ]);
  });

  it('waitForEventMatch resolves the first event matching the predicate', async () => {
    const manager = new FakeThreadManager({
      thread_1: [
        { type: 'INFO', data: { id: 'ignore' } },
        { type: 'TOOL_RESULT', data: { id: 'call_999' } },
      ],
    });

    await expect(
      waitForEventMatch(
        manager,
        'thread_1',
        (event) => event.type === 'TOOL_RESULT' && event.data.id === 'call_999',
        'TOOL_RESULT with id=call_999'
      )
    ).resolves.toEqual({
      type: 'TOOL_RESULT',
      data: { id: 'call_999' },
    });
  });

  it('waitForEvent rejects when the event never appears', async () => {
    vi.useFakeTimers();
    const manager = new FakeThreadManager({ thread_1: [] });

    const promise = waitForEvent(manager, 'thread_1', 'DONE', 0);
    const assertion = expect(promise).rejects.toThrow('Timeout waiting for DONE event after 0ms');
    await vi.advanceTimersByTimeAsync(20);
    await assertion;
  });

  it('waitForEventCount rejects when the required number of events never appears', async () => {
    vi.useFakeTimers();
    const manager = new FakeThreadManager({
      thread_1: [{ type: 'TOOL_CALL', data: { id: '1' } }],
    });

    const promise = waitForEventCount(manager, 'thread_1', 'TOOL_CALL', 2, 0);
    const assertion = expect(promise).rejects.toThrow('Timeout waiting for 2 TOOL_CALL events after 0ms (got 1)');
    await vi.advanceTimersByTimeAsync(20);
    await assertion;
  });

  it('waitForEventMatch rejects when the predicate never matches', async () => {
    vi.useFakeTimers();
    const manager = new FakeThreadManager({
      thread_1: [{ type: 'INFO', data: { id: 'ignore' } }],
    });

    const promise = waitForEventMatch(
      manager,
      'thread_1',
      (event) => event.type === 'TOOL_RESULT' && event.data.id === 'call_404',
      'TOOL_RESULT with id=call_404',
      0
    );
    const assertion = expect(promise).rejects.toThrow('Timeout waiting for TOOL_RESULT with id=call_404 after 0ms');
    await vi.advanceTimersByTimeAsync(20);
    await assertion;
  });
});
