import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('brainstorm helper script', () => {
  const originalWindow = globalThis.window;
  const originalDocument = globalThis.document;
  const originalWebSocket = globalThis.WebSocket;
  const originalSetTimeout = globalThis.setTimeout;
  let clickHandler: ((event: any) => void) | undefined;
  const sendCalls: string[] = [];
  const indicator = { textContent: '', innerHTML: '' };
  let selectedCard: any;
  let container: any;

  class MockWebSocket {
    static OPEN = 1;
    readyState = MockWebSocket.OPEN;
    onopen: (() => void) | null = null;
    onmessage: ((msg: { data: string }) => void) | null = null;
    onclose: (() => void) | null = null;

    constructor(public url: string) {}

    send(payload: string): void {
      sendCalls.push(payload);
    }
  }

  beforeEach(async () => {
    // 中文注释：用最小 DOM 伪对象驱动脚本初始化，覆盖连接和交互分支。
    sendCalls.length = 0;
    indicator.textContent = '';
    indicator.innerHTML = '';
    clickHandler = undefined;
    container = {
      dataset: { multiselect: undefined },
      querySelectorAll: vi.fn().mockReturnValue([]),
      closest: vi.fn().mockReturnValue(null),
    };
    // 中文注释：补齐脚本会调用的 classList，避免在单选清理分支里报错。
    selectedCard = {
      dataset: { choice: 'choice-a' },
      textContent: 'Choice A',
      querySelector: vi.fn().mockReturnValue({ textContent: 'Choice A' }),
      classList: {
        add: vi.fn(),
        remove: vi.fn(),
        toggle: vi.fn(),
      },
      closest: vi.fn().mockReturnValue(container),
    };
    container.querySelectorAll = vi.fn().mockReturnValue([selectedCard]);

    globalThis.window = {
      location: { host: 'localhost:1234' },
    } as any;
    globalThis.document = {
      addEventListener: (_type: string, handler: (event: any) => void) => {
        clickHandler = handler;
      },
      getElementById: (id: string) => (id === 'indicator-text' ? indicator : null),
    } as any;
    globalThis.WebSocket = MockWebSocket as any;
    globalThis.setTimeout = ((fn: (...args: any[]) => void) => {
      fn();
      return 0 as any;
    }) as any;

    await import(
      '../../../../../../src/core/templates/workflows/apeworkflow-brainstorming/scripts/helper.js'
    );
  });

  afterEach(() => {
    globalThis.window = originalWindow;
    globalThis.document = originalDocument;
    globalThis.WebSocket = originalWebSocket;
    globalThis.setTimeout = originalSetTimeout;
    vi.resetModules();
  });

  it('暴露交互 API 并处理选择事件', () => {
    const ws = (globalThis.window as any).brainstorm;
    expect(ws).toBeTruthy();

    (globalThis.window as any).toggleSelect(selectedCard);
    expect((globalThis.window as any).selectedChoice).toBe('choice-a');

    ws.send({ type: 'ping' });
    expect(sendCalls.length).toBe(1);

    expect(clickHandler).toBeDefined();
    clickHandler?.({
      target: {
        closest: (selector: string) => {
          if (selector === '[data-choice]') return selectedCard;
          if (selector === '.options' || selector === '.cards') return container;
          return null;
        },
      },
    });

    expect(indicator.innerHTML).toContain('selected');
  });
});
