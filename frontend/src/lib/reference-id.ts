export function createReferenceId(): string {
  const y = new Date().getFullYear();
  const n = Math.floor(1000 + Math.random() * 9000);
  return `JS-${y}-${n}`;
}
