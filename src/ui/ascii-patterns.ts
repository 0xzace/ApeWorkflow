/**
 * 欢迎页 ASCII 动画。
 * 这里保留“动画 + 品牌徽记”的结构，但图案已经改成 ApeWorkflow 的新品牌风格。
 */

// 检测终端是否支持 Unicode 块字符
const supportsUnicode =
  process.platform !== 'win32' ||
  !!process.env.WT_SESSION || // Windows Terminal
  !!process.env.TERM_PROGRAM; // 现代终端

// 根据终端能力选择字符集，保证老终端也能显示
const CHARS = supportsUnicode
  ? { full: '██', dim: '░░', empty: '  ' }
  : { full: '##', dim: '++', empty: '  ' };

const EMPTY = CHARS.empty;
const FULL = CHARS.full;
const DIM = CHARS.dim;

const EMPTY_ROW = EMPTY.repeat(8);

function mapCell(cell: '_' | 'D' | 'F'): string {
  if (cell === 'D') return DIM;
  if (cell === 'F') return FULL;
  return EMPTY;
}

function buildRow(pattern: string): string {
  // 每个字符代表一个像素格，便于直接调整徽记轮廓
  return pattern
    .split('')
    .map((cell) => mapCell(cell as '_' | 'D' | 'F'))
    .join('');
}

function buildFrame(rows: string[]): string[] {
  // 上下保留空白，让左侧徽记和右侧文案更平衡
  return [EMPTY_ROW, EMPTY_ROW, ...rows.map(buildRow), EMPTY_ROW, EMPTY_ROW];
}

/**
 * ApeWorkflow 品牌徽记动画。
 * 这里把图案改成大写的 A，和 assets 里的品牌视觉保持一致。
 */
export const WELCOME_ANIMATION = {
  interval: 120,
  frames: [
    buildFrame([
      '________',
      '________',
      '________',
      '____D___',
      '____D___',
      '____D___',
      '________',
      '________',
    ]),
    buildFrame([
      '________',
      '________',
      '___D_D__',
      '____D___',
      '____D___',
      '____D___',
      '___D_D__',
      '________',
    ]),
    buildFrame([
      '________',
      '____D___',
      '___D_D__',
      '__D___D_',
      '__D___D_',
      '___D_D__',
      '____D___',
      '________',
    ]),
    buildFrame([
      '________',
      '___D_D__',
      '__D___D_',
      '__D___D_',
      '__DDDDD_',
      '__D___D_',
      '__D___D_',
      '________',
    ]),
    buildFrame([
      '________',
      '________',
      '____F___',
      '___F_F__',
      '__F___F_',
      '__F___F_',
      '__FFFFF_',
      '__F___F_',
    ]),
    buildFrame([
      '________',
      '________',
      '____F___',
      '___F_F__',
      '__F___F_',
      '__F___F_',
      '__FFFFF_',
      '__F___F_',
    ]),
    buildFrame([
      '________',
      '________',
      '____F___',
      '___F_F__',
      '__F___F_',
      '__F___F_',
      '__FFFFF_',
      '__F___F_',
    ]),
    buildFrame([
      '________',
      '________',
      '____F___',
      '___F_F__',
      '__F___F_',
      '__F___F_',
      '__FFFFF_',
      '__F___F_',
    ]),
  ],
};
