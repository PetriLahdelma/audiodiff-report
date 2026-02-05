export const exitCode = { OK: 0, THRESHOLD_FAIL: 2, RUNTIME_ERROR: 3, INVALID_ARGS: 4 };
export function rms(signal) {
    let sum = 0;
    for (let i = 0; i < signal.length; i++)
        sum += signal[i] * signal[i];
    return Math.sqrt(sum / signal.length);
}
export function peak(signal) {
    let p = 0;
    for (let i = 0; i < signal.length; i++) {
        const v = Math.abs(signal[i]);
        if (v > p)
            p = v;
    }
    return p;
}
