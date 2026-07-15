export interface ConversationSummary {
  unassigned: number;
  assigned: number;
  botAssigned: number;
  total: number;
  loaded: boolean;
  failed: boolean;
}

const countValue = (value: unknown): number => {
  const count = Number(value);
  return Number.isFinite(count) && count > 0 ? count : 0;
};

export const normalizeConversationSummary = (response: unknown): ConversationSummary => {
  if (typeof response === 'number') {
    const total = countValue(response);
    return { unassigned: 0, assigned: total, botAssigned: 0, total, loaded: true, failed: false };
  }

  if (!response || typeof response !== 'object') {
    return { unassigned: 0, assigned: 0, botAssigned: 0, total: 0, loaded: true, failed: false };
  }

  const counts = response as Record<string, unknown>;
  const hasAssignmentCounts = ['unassigned', 'assigned', 'bot_assigned']
    .some(key => counts[key] !== undefined);

  if (hasAssignmentCounts) {
    const unassigned = countValue(counts.unassigned);
    const assigned = countValue(counts.assigned);
    const botAssigned = countValue(counts.bot_assigned);
    return {
      unassigned,
      assigned,
      botAssigned,
      total: unassigned + assigned + botAssigned,
      loaded: true,
      failed: false
    };
  }

  const total = counts.count !== undefined
    ? countValue(counts.count)
    : countValue(counts.open) + countValue(counts.closed);
  return { unassigned: 0, assigned: total, botAssigned: 0, total, loaded: true, failed: false };
};
