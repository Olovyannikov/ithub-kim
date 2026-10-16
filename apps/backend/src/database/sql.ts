/**
 * Строит выражение для CHECK-ограничения из набора допустимых значений.
 *
 * Значения приходят из @kim/shared, то есть единственный источник истины —
 * TypeScript, а база лишь подтверждает его на своём уровне (ADR-0003).
 */
export function checkIn(column: string, values: readonly string[]): string {
  const list = values.map((value) => `'${value.replace(/'/g, "''")}'`).join(', ');

  return `"${column}" IN (${list})`;
}
