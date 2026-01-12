#!/usr/bin/env python3
import statistics

def percentile(data, p):
    """Calculate the p-th percentile of a list of numbers."""
    sorted_data = sorted(data)
    k = (len(sorted_data) - 1) * p / 100
    f = int(k)
    c = f + 1 if f + 1 < len(sorted_data) else f
    return sorted_data[f] + (sorted_data[c] - sorted_data[f]) * (k - f)

# Data extracted from logs (N=30 runs each)
legacy_hmr = [149, 162, 163, 163, 167, 162, 164, 165, 167, 149, 163, 164, 169, 162, 163, 164, 163, 165, 164, 168, 156, 153, 166, 168, 177, 163, 167, 166, 163, 163]
turbo_hmr = [28, 41, 26, 26, 25, 25, 26, 26, 26, 27, 27, 26, 26, 25, 26, 25, 26, 25, 26, 26, 25, 27, 27, 25, 26, 27, 26, 25, 26, 25]
legacy_cold = [1438, 1275, 1265, 1289, 1300, 1242, 1342, 1284, 1237, 1294, 1433, 1266, 1377, 1224, 1279, 1196, 1511, 1234, 1282, 1226, 1268, 1253, 1280, 1290, 1215, 1278, 1208, 1259, 1263, 1251]
turbo_cold = [622, 567, 564, 570, 563, 566, 566, 565, 566, 563, 567, 604, 567, 566, 565, 567, 564, 571, 565, 568, 569, 566, 567, 564, 569, 565, 565, 565, 566, 566]

def calc_stats(data, name):
    mean = statistics.mean(data)
    median = statistics.median(data)
    stdev = statistics.stdev(data)
    p95 = percentile(data, 95)
    return {
        'name': name,
        'n': len(data),
        'mean': mean,
        'median': median,
        'stdev': stdev,
        'p95': p95,
        'min': min(data),
        'max': max(data)
    }

legacy_hmr_stats = calc_stats(legacy_hmr, "Legacy HMR")
turbo_hmr_stats = calc_stats(turbo_hmr, "Turbo HMR")
legacy_cold_stats = calc_stats(legacy_cold, "Legacy Cold Start")
turbo_cold_stats = calc_stats(turbo_cold, "Turbo Cold Start")

print("=" * 60)
print("STATISTICAL ANALYSIS RESULTS (N=30)")
print("=" * 60)

for s in [legacy_cold_stats, turbo_cold_stats, legacy_hmr_stats, turbo_hmr_stats]:
    print(f"\n{s['name']} (n={s['n']}):")
    print(f"  Mean:   {s['mean']:.2f} ms")
    print(f"  Median: {s['median']:.2f} ms")
    print(f"  Std Dev:{s['stdev']:.2f} ms")
    print(f"  P95:    {s['p95']:.2f} ms")
    print(f"  Range:  {s['min']} - {s['max']} ms")

print("\n" + "=" * 60)
print("SPEEDUP FACTORS")
print("=" * 60)
cold_speedup = legacy_cold_stats['mean'] / turbo_cold_stats['mean']
hmr_speedup = legacy_hmr_stats['mean'] / turbo_hmr_stats['mean']
print(f"Cold Start Speedup: {cold_speedup:.2f}x (Legacy/Turbo)")
print(f"HMR Speedup: {hmr_speedup:.2f}x (Legacy/Turbo)")

print("\n" + "=" * 60)
print("COEFFICIENT OF VARIATION (Stability)")
print("=" * 60)
print(f"Legacy Cold Start CV: {(legacy_cold_stats['stdev']/legacy_cold_stats['mean'])*100:.2f}%")
print(f"Turbo Cold Start CV:  {(turbo_cold_stats['stdev']/turbo_cold_stats['mean'])*100:.2f}%")
print(f"Legacy HMR CV:        {(legacy_hmr_stats['stdev']/legacy_hmr_stats['mean'])*100:.2f}%")
print(f"Turbo HMR CV:         {(turbo_hmr_stats['stdev']/turbo_hmr_stats['mean'])*100:.2f}%")
