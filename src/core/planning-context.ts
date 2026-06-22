export type PlanningGranularity = 'fine' | 'medium' | 'coarse';

export interface PlanningContext {
  granularity: PlanningGranularity;
  proposal?: string;
  specs?: string;
  design?: string;
  tasks?: string;
  plans?: string[];

  has(field: string): boolean;
}

function createPlanningContext(
  granularity: PlanningGranularity,
  data: Record<string, string | string[]>
): PlanningContext {
  const base: PlanningContext = {
    granularity,
    has(field: string): boolean {
      return field in data;
    },
  };

  const content = data as Record<string, unknown>;
  if ('proposal' in content) base.proposal = content.proposal as string;
  if ('specs' in content) base.specs = content.specs as string;
  if ('design' in content) base.design = content.design as string;
  if ('tasks' in content) base.tasks = content.tasks as string;
  if ('plans' in content) base.plans = content.plans as string[];

  return base;
}

export function loadPlanningContext(
  _changeName: string,
  granularity: PlanningGranularity,
  allData: Record<string, string | string[]>
): PlanningContext {
  const filtered: Record<string, string | string[]> = {};

  if (allData.proposal !== undefined) filtered.proposal = allData.proposal;
  if (allData.plans !== undefined) filtered.plans = allData.plans;
  if (allData.tasks !== undefined) filtered.tasks = allData.tasks;

  if (granularity === 'fine' || granularity === 'medium') {
    if (allData.specs !== undefined) filtered.specs = allData.specs;
    if (allData.design !== undefined) filtered.design = allData.design;
  }

  return createPlanningContext(granularity, filtered);
}
