const ISSUE_STATUSES = [
  'degraded',
  'warn',
  'warning',
  'restricted',
  'flagged',
  'rate_limited',
  'capped',
  'yellow',
  'down',
  'error',
  'failed',
  'disconnected',
  'banned',
  'bannedm',
  'disabled',
  'red'
];

export function isOperationalIssueStatus(status: string): boolean {
  const normalized = status ? String(status).toLowerCase() : '';
  return ISSUE_STATUSES.indexOf(normalized) !== -1;
}

export function isOperationalQueueIssue(queue: any): boolean {
  if (!queue) return false;
  return isOperationalIssueStatus(queue.status) ||
    Number(queue.messagesReady || 0) > 0 ||
    Number(queue.messagesUnacknowledged || 0) > 0 ||
    Number(queue.consumers || 0) === 0;
}
