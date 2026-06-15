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
 * 从中心核心逐步展开到完整六边形徽记，替换掉旧的“o”形图案。
 */
export const WELCOME_ANIMATION = {
  interval: 120,
  frames: [
    buildFrame([
      '________',
      '________',
      '________',
      '________',
      '____D___',
      '____D___',
      '________',
      '________',
    ]),
    buildFrame([
      '________',
      '________',
      '________',
      '___D_D__',
      '____D___',
      '____D___',
      '___D_D__',
      '________',
    ]),
    buildFrame([
      '________',
      '________',
      '________',
      '___DD___',
      '___D_D__',
      '___D_D__',
      '___DD___',
      '________',
    ]),
    buildFrame([
      '________',
      '________',
      '____D___',
      '__D__D__',
      '__DFFD__',
      '__DFFD__',
      '__D__D__',
      '____D___',
    ]),
    buildFrame([
      '________',
      '________',
      '___DD___',
      '__D__D__',
      '_D_FF_D_',
      '_D_FF_D_',
      '__D__D__',
      '___DD___',
    ]),
    buildFrame([
      '________',
      '________',
      '___DD___',
      '__D__D__',
      '_D_DD_D_',
      '_D_FF_D_',
      '__D__D__',
      '___DD___',
    ]),
    buildFrame([
      '________',
      '________',
      '___DD___',
      '__D__D__',
      '_D_FF_D_',
      '_D_FF_D_',
      '__D__D__',
      '___DD___',
    ]),
    buildFrame([
      '________',
      '________',
      '___DD___',
      '__D__D__',
      '_D_FF_D_',
      '_D_FF_D_',
      '__D__D__',
      '___DD___',
    ]),
  ],
};
