type Threshold = { key: string; op: string; value: string };

export function parseThresholds(expr: string): Threshold[] {
  return expr.split(',').map((rawPart) => {
    const part = rawPart.trim();
    const match = part.match(/^([a-zA-Z]+)\s*(>=|<=|=|>|<)\s*(true|false|-?(?:\d+(?:\.\d+)?|\.\d+))$/);
    if (!match) throw new Error(`Invalid threshold: ${part || rawPart}`);
    return { key: match[1], op: match[2], value: match[3] };
  });
}

export function evalThresholds(report: any, thresholds: Threshold[]): boolean {
  for (const res of report.results) {
    for (const t of thresholds) {
      const val = res.metrics[t.key];
      if (val === undefined) continue;
      if (!compare(val, t.op, t.value)) return false;
    }
  }
  return true;
}

function compare(actual: any, op: string, expected: string): boolean {
  const exp = expected === 'true' || expected === 'false' ? expected === 'true' : Number(expected);
  switch (op) {
    case '>': return actual > exp;
    case '<': return actual < exp;
    case '>=': return actual >= exp;
    case '<=': return actual <= exp;
    case '=': return actual === exp;
    default: return true;
  }
}
