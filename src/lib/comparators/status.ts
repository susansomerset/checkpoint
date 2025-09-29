export const STATUS_PRIORITY = ['Missing','Submitted (Late)','Submitted','Graded'] as const;
const rank = Object.fromEntries(STATUS_PRIORITY.map((s,i)=>[s,i]));

export function compareStatus(a: string, b: string) {
  return (rank[a] ?? 999) - (rank[b] ?? 999);
}
