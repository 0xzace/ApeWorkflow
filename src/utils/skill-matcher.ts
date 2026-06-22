interface SkillMatch {
  keyword: string;
  skill: string;
  weight: number;
}

const MATCHES: SkillMatch[] = [
  { keyword: 'implement', skill: 'apeworkflow-apply-change', weight: 1 },
  { keyword: 'implement', skill: 'apeworkflow-propose', weight: 1 },
  { keyword: 'create.*change', skill: 'apeworkflow-propose', weight: 2 },
  { keyword: 'new.*feature', skill: 'apeworkflow-propose', weight: 1 },
  { keyword: 'fix.*bug|debug.*issue', skill: 'apeworkflow-systematic-debugging', weight: 2 },
  { keyword: 'bug', skill: 'apeworkflow-systematic-debugging', weight: 1 },
  { keyword: 'debug', skill: 'apeworkflow-systematic-debugging', weight: 1 },
  { keyword: 'review', skill: 'apeworkflow-requesting-code-review', weight: 1 },
  { keyword: 'review.*feedback', skill: 'apeworkflow-receiving-code-review', weight: 1 },
  { keyword: 'plan|specification', skill: 'apeworkflow-writing-plans', weight: 2 },
  { keyword: 'plan', skill: 'apeworkflow-writing-plans', weight: 1 },
  { keyword: 'cleanup|merge|branch', skill: 'apeworkflow-finishing-a-development-branch', weight: 1 },
  { keyword: 'explore|think.*through', skill: 'apeworkflow-explore', weight: 2 },
  { keyword: 'archive', skill: 'apeworkflow-archive-change', weight: 2 },
  { keyword: 'verify', skill: 'apeworkflow-verification', weight: 2 },
  { keyword: 'apply.*task', skill: 'apeworkflow-apply-change', weight: 1 },
];

const READ_ONLY_KEYWORDS = ['list', 'status', 'view', 'show'];

const READ_ONLY_PATTERNS = [
  /what\s+do\s+/,
  /how\s+does?\s+/,
  /how\s+to\s+/,
];

/**
 * Match skills to user input based on keyword/intent.
 * Returns at most 3 skills sorted by relevance weight.
 */
export function matchSkills(input: string, maxSkills: number = 3): string[] {
  const lower = input.toLowerCase();

  // Check for read-only operations first
  for (const kw of READ_ONLY_KEYWORDS) {
    if (new RegExp(`\\b${kw}\\b`).test(lower)) {
      return [];
    }
  }
  for (const pattern of READ_ONLY_PATTERNS) {
    if (pattern.test(lower)) {
      return [];
    }
  }

  // Score each skill
  const scored = MATCHES
    .map((m) => ({
      skill: m.skill,
      score: new RegExp(m.keyword, 'i').test(lower) ? m.weight : 0,
    }))
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxSkills)
    .map((s) => s.skill);

  return [...new Set(scored)]; // deduplicate
}
