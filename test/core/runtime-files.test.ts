import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { afterEach, describe, expect, it, vi } from 'vitest';

const cjsRequire = createRequire(import.meta.url);
const serverModulePath = path.resolve(
  'src/core/templates/workflows/apeworkflow-brainstorming/scripts/server.cjs'
);
const renderGraphsPath = path.resolve(
  'src/core/templates/workflows/apeworkflow-writing-skills/render-graphs.js'
);
const vitestSetupPath = path.resolve('vitest.setup.ts');
const eslintConfigPath = path.resolve('eslint.config.js');

function createMaskedClientFrame(text: string): Buffer {
  const payload = Buffer.from(text);
  const mask = Buffer.from([1, 2, 3, 4]);
  const frame = Buffer.alloc(6 + payload.length);
  frame[0] = 0x81;
  frame[1] = 0x80 | payload.length;
  mask.copy(frame, 2);
  for (let i = 0; i < payload.length; i += 1) {
    frame[6 + i] = payload[i] ^ mask[i % 4];
  }
  return frame;
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('runtime coverage targets', () => {
  it('覆盖脑暴服务器脚本的导出工具函数', () => {
    const originalEnv = {
      BRAINSTORM_DIR: process.env.BRAINSTORM_DIR,
      BRAINSTORM_HOST: process.env.BRAINSTORM_HOST,
      BRAINSTORM_URL_HOST: process.env.BRAINSTORM_URL_HOST,
      BRAINSTORM_OWNER_PID: process.env.BRAINSTORM_OWNER_PID,
    };
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'apeworkflow-brainstorm-'));

    try {
      process.env.BRAINSTORM_DIR = tempDir;
      process.env.BRAINSTORM_HOST = '127.0.0.1';
      process.env.BRAINSTORM_URL_HOST = 'localhost';
      delete process.env.BRAINSTORM_OWNER_PID;
      delete cjsRequire.cache[serverModulePath];

      const server = cjsRequire(serverModulePath) as typeof import(
        '../../src/core/templates/workflows/apeworkflow-brainstorming/scripts/server.cjs'
      );

      expect(server.computeAcceptKey('dGhlIHNhbXBsZSBub25jZQ==')).toBe(
        's3pPLMBiTxaQ9kYGzzhZRbK+xOo='
      );

      const encoded = server.encodeFrame(server.OPCODES.TEXT, Buffer.from('hello'));
      expect(encoded[0]).toBe(0x81);
      expect(server.decodeFrame(createMaskedClientFrame('hello'))?.payload.toString()).toBe(
        'hello'
      );
    } finally {
      process.env.BRAINSTORM_DIR = originalEnv.BRAINSTORM_DIR;
      process.env.BRAINSTORM_HOST = originalEnv.BRAINSTORM_HOST;
      process.env.BRAINSTORM_URL_HOST = originalEnv.BRAINSTORM_URL_HOST;
      process.env.BRAINSTORM_OWNER_PID = originalEnv.BRAINSTORM_OWNER_PID;
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('覆盖写作技能的图渲染脚本', () => {
    const runRenderGraphs = (combine: boolean) => {
      const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'apeworkflow-graphs-'));
      const skillDir = path.join(tempDir, 'sample-skill');
      fs.mkdirSync(skillDir, { recursive: true });
      fs.writeFileSync(
        path.join(skillDir, 'SKILL.md'),
        [
          '# Sample skill',
          '',
          '```dot',
          'digraph flow {',
          '  rankdir=LR;',
          '  a -> b;',
          '}',
          '```',
          '',
          '```dot',
          'digraph extra {',
          '  x -> y;',
          '}',
          '```',
          '',
        ].join('\n')
      );

      const logs: string[] = [];
      const errors: string[] = [];
      let svgCalls = 0;
      const originalArgv = process.argv.slice();

      try {
        process.argv = combine
          ? ['node', renderGraphsPath, skillDir, '--combine']
          : ['node', renderGraphsPath, skillDir];

        const sandbox = {
          require: (specifier: string) => {
            if (specifier === 'fs') return fs;
            if (specifier === 'path') return path;
            if (specifier === 'child_process') {
              return {
                execSync: (command: string) => {
                  if (command === 'which dot') return '/usr/bin/dot\n';
                  if (command === 'dot -Tsvg') {
                    svgCalls += 1;
                    return `<svg data-call="${svgCalls}"></svg>`;
                  }
                  throw new Error(`unexpected command: ${command}`);
                },
              };
            }
            throw new Error(`unexpected require: ${specifier}`);
          },
          module: { exports: {} },
          exports: {},
          process: {
            argv: process.argv,
            exit: (code?: number) => {
              throw new Error(`process.exit:${code}`);
            },
          },
          console: {
            log: (...args: unknown[]) => {
              logs.push(args.map(String).join(' '));
            },
            error: (...args: unknown[]) => {
              errors.push(args.map(String).join(' '));
            },
          },
        };

        vm.runInNewContext(fs.readFileSync(renderGraphsPath, 'utf-8'), sandbox, {
          filename: renderGraphsPath,
        });

        const outputDir = path.join(skillDir, 'diagrams');
        if (combine) {
          const skillName = path.basename(skillDir).replace(/-/g, '_');
          expect(fs.existsSync(path.join(outputDir, `${skillName}_combined.svg`))).toBe(true);
          expect(fs.existsSync(path.join(outputDir, `${skillName}_combined.dot`))).toBe(true);
        } else {
          expect(fs.existsSync(path.join(outputDir, 'flow.svg'))).toBe(true);
          expect(fs.existsSync(path.join(outputDir, 'extra.svg'))).toBe(true);
          expect(fs.readFileSync(path.join(outputDir, 'flow.svg'), 'utf-8')).toContain(
            'data-call="1"'
          );
        }

        expect(logs.join('\n')).toContain('Found 2 diagram(s)');
        expect(errors).toEqual([]);
      } finally {
        process.argv = originalArgv;
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
    };

    // 中文注释：分别覆盖单图渲染和合并渲染，确保主分支都能执行到。
    runRenderGraphs(false);
    runRenderGraphs(true);
  });

  it('覆盖 vitest setup 文件的 setup 和 teardown', async () => {
    const setupModule = await import(pathToFileURL(vitestSetupPath).href);
    const originalExit = process.exit;
    const scheduled: Array<() => void> = [];
    const setTimeoutSpy = vi.spyOn(globalThis, 'setTimeout').mockImplementation((handler: any) => {
      scheduled.push(handler);
      return { unref: vi.fn() } as any;
    });
    const exitSpy = vi.fn();
    process.exit = exitSpy as typeof process.exit;

    try {
      await setupModule.setup();
      await setupModule.teardown();
      expect(scheduled).toHaveLength(1);
      scheduled[0]();
      expect(exitSpy).toHaveBeenCalledWith(0);
    } finally {
      setTimeoutSpy.mockRestore();
      process.exit = originalExit;
    }
  });

  it('覆盖 eslint 配置文件的导出值', async () => {
    const configModule = await import(pathToFileURL(eslintConfigPath).href);
    expect(Array.isArray(configModule.default)).toBe(true);
    expect(configModule.default.length).toBeGreaterThan(0);
  });
});
