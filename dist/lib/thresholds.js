export function parseThresholds(expr) {
    return expr.split(',').map((part) => {
        const match = part.match(/([a-zA-Z]+)\s*(>=|<=|=|>|<)\s*([\w.\-]+)/);
        if (!match)
            throw new Error(`Invalid threshold: ${part}`);
        return { key: match[1], op: match[2], value: match[3] };
    });
}
export function evalThresholds(report, thresholds) {
    for (const res of report.results) {
        for (const t of thresholds) {
            const val = res.metrics[t.key];
            if (val === undefined)
                continue;
            if (!compare(val, t.op, t.value))
                return false;
        }
    }
    return true;
}
function compare(actual, op, expected) {
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
