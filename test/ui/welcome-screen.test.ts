import { describe, expect, it } from 'vitest';

import { getWelcomeText } from '../../src/ui/welcome-screen.js';

describe('welcome screen', () => {
  it('shows the current visible workflow capabilities', () => {
    const welcomeText = getWelcomeText().join('\n');
    const hiddenCommands = ['/ape:new', '/ape:continue', '/ape:ff', '/ape:sync'];

    // 启动页只展示当前可见的工作流命令，不允许回退到旧的隐藏命令。
    expect(welcomeText).toContain('This setup will configure:');
    expect(welcomeText).toContain('The current ApeWorkflow command surface');
    expect(welcomeText).toContain('/ape:explore');
    expect(welcomeText).toContain('/ape:propose');
    expect(welcomeText).toContain('/ape:apply');
    expect(welcomeText).toContain('/ape:verify');
    expect(welcomeText).toContain('/ape:archive');
    expect(welcomeText).toContain('/ape:onboard');
    expect(welcomeText).toContain('/ape:bulk-archive');
    expect(welcomeText).toContain('/ape:feedback');

    for (const hidden of hiddenCommands) {
      expect(welcomeText).not.toContain(hidden);
    }
  });
});
