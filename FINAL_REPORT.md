# Performance Analysis: Next.js Toolchains on Apple Silicon (N=30)

**Document Version:** 1.0  
**Date:** January 13, 2026  
**Platform:** Apple Silicon (macOS)  
**Framework:** Next.js  
**Sample Size:** N=30 runs per toolchain

---

## 1. Overview

This report presents the findings of a benchmark study (N=30) comparing the performance characteristics of two Next.js development toolchains: the legacy Webpack-based bundler and the Turbopack bundler, both evaluated on Apple Silicon architecture.

### Observed Results

| Metric | Legacy (Webpack) | Turbopack | Observed Speedup Factor |
|--------|------------------|-----------|-------------------------|
| Cold Start (Mean) | 1,285.30 ms | 569.27 ms | ~2.26x |
| Hot Module Replacement (Mean) | 163.27 ms | 26.43 ms | ~6.18x |

The largest observed performance differential was in **Hot Module Replacement (HMR)**, where Turbopack exhibited approximately **6.18x lower latency** than the legacy Webpack toolchain in this test configuration.

Turbopack also exhibited lower variance across measurements, with a coefficient of variation (CV) of 2.15% for Cold Start operations compared to 5.52% for the legacy toolchain.

---

## 2. Methodology

### 2.1 Experimental Design

This study employed an automated benchmarking methodology to support reproducibility:

1. **Automated Instrumentation:** Custom shell scripts and Node.js-based measurement utilities were developed to reduce human-induced variance in timing measurements.

2. **Phased Approach:** A pilot study (N=5) was initially conducted to validate the measurement tools, calibrate timing thresholds, and identify potential confounding variables. Following validation, this main experiment (N=30) was executed.

3. **Isolation Protocol:** Each benchmark run was executed with:
   - Clean process termination between runs
   - Consistent file system state
   - Standardized warm-up procedures for HMR measurements

### 2.2 Metrics Collected

| Metric | Definition | Measurement Method |
|--------|------------|-------------------|
| **Cold Start** | Time from process initiation to server ready state | Pattern matching on "Ready detected: X ms" log output |
| **Hot Module Replacement (HMR)** | Time from file modification to client update acknowledgment | Pattern matching on "HMR Detected: X ms" log output |
| **CPU Utilization** | Percentage of CPU resources consumed | System monitoring via `ps` command sampling |
| **Memory Consumption** | Peak RAM allocation during operation | System monitoring via `ps` command sampling |

### 2.3 Statistical Methods

The following statistical measures were computed for each metric category:
- **Mean (μ):** Arithmetic average across all runs
- **Median:** Central tendency measure, robust to outliers
- **Standard Deviation (σ):** Measure of dispersion from the mean
- **95th Percentile (P95):** Worst-case performance threshold, critical for reliability assessment
- **Coefficient of Variation (CV):** Normalized measure of dispersion (σ/μ × 100%)

---

## 3. Statistical Results

### 3.1 Cold Start Performance

| Statistic | Legacy (Webpack) | Turbopack | Δ (Difference) |
|-----------|------------------|-----------|----------------|
| **Mean** | 1,285.30 ms | 569.27 ms | -716.03 ms |
| **Median** | 1,271.50 ms | 566.00 ms | -705.50 ms |
| **Std Dev** | 70.90 ms | 12.27 ms | -58.63 ms |
| **P95** | 1,435.75 ms | 589.15 ms | -846.60 ms |
| **Range** | 1,196 – 1,511 ms | 563 – 622 ms | — |
| **CV** | 5.52% | 2.15% | -3.37% |

**Observations:** In this configuration, Turbopack achieved an approximately **2.26x reduction** in cold start time compared to Webpack. The lower standard deviation (12.27 ms vs. 70.90 ms) suggests that Turbopack may provide more consistent startup times in this test environment. The P95 values indicate that even in upper-bound scenarios within this dataset, Turbopack (589 ms) completed cold start in less time than the legacy toolchain's average performance (1,285 ms).

### 3.2 Hot Module Replacement (HMR) Performance

| Statistic | Legacy (Webpack) | Turbopack | Δ (Difference) |
|-----------|------------------|-----------|----------------|
| **Mean** | 163.27 ms | 26.43 ms | -136.84 ms |
| **Median** | 163.50 ms | 26.00 ms | -137.50 ms |
| **Std Dev** | 5.58 ms | 2.86 ms | -2.72 ms |
| **P95** | 168.55 ms | 27.55 ms | -141.00 ms |
| **Range** | 149 – 177 ms | 25 – 41 ms | — |
| **CV** | 3.42% | 10.82% | +7.40% |

**Observations:** Turbopack's HMR was observed to be approximately **6.18x faster** than Webpack in this test configuration. The higher coefficient of variation for Turbopack (10.82% vs. 3.42%) may reflect measurement resolution limitations at sub-30ms timescales, where small absolute variations can produce larger relative percentages.

### 3.3 Speedup Factor Summary

| Metric | Observed Speedup Factor | Description |
|--------|-------------------------|-------------|
| Cold Start | ~2.26x | Development server initialization appeared faster with Turbopack |
| HMR | ~6.18x | Code changes appeared to reflect faster with Turbopack |

---

## 4. Resource Efficiency

Beyond temporal performance metrics, resource utilization represents an additional dimension of toolchain comparison, particularly relevant for developers operating on battery-powered devices or resource-constrained environments.

### 4.1 Memory Consumption

| Metric | Legacy (Webpack) | Turbopack | Observed Difference |
|--------|------------------|-----------|---------------------|
| Typical Range | 280-320 MB | 200-230 MB | ~28% reduction |
| Peak Observed | ~350 MB | ~250 MB | ~100 MB lower |

### 4.2 CPU Utilization Patterns

| Characteristic | Legacy (Webpack) | Turbopack |
|----------------|------------------|-----------|
| Cold Start Pattern | Sustained high CPU for 2-3 seconds | Brief burst (<1 second) |
| HMR Pattern | Moderate sustained load | Minimal, brief spike |
| Idle State | ~5-8% baseline | ~2-4% baseline |

### 4.3 Observations

| Dimension | Observation |
|-----------|-------------|
| Battery Life | Lower sustained CPU usage may potentially reduce power consumption |
| Thermal Impact | Shorter high-CPU periods may potentially reduce heat generation |
| Concurrent Workloads | Lower memory footprint may potentially leave more resources for other applications |

---

## 5. Summary

### 5.1 Summary of Observations

This benchmark study (N=30) provides preliminary data comparing the two toolchains across measured performance dimensions in this specific configuration:

| Dimension | Observed Difference | Notes |
|-----------|---------------------|-------|
| Cold Start Speed | ~2.26x faster with Turbopack | Single environment tested |
| HMR Latency | ~6.18x faster with Turbopack | Minimal project configuration |
| Memory Usage | ~28% lower with Turbopack | Peak memory comparison |
| CPU Pattern | Different profiles observed | Burst vs. sustained patterns |
| Consistency (Cold Start CV) | ~2.6x more stable with Turbopack | Lower coefficient of variation |

### 5.2 Observations by Use Case

| Use Case | Observation |
|----------|-------------|
| Quick Prototyping | Both toolchains provided functional development environments in our tests |
| Iterative Development | Turbopack's lower observed HMR latency may potentially improve iteration speed |
| Resource-Constrained Environments | Turbopack's lower observed memory usage may potentially leave more resources for other applications |

### 5.3 Limitations and Future Work

- This study focused on a single hardware platform (Apple M1); results may vary on other architectures
- Only development mode (`next dev`) was evaluated; production build performance was not tested
- Long-term stability metrics (multi-hour sessions) were not evaluated

### 5.4 Data Availability

The benchmark data collected in this study is intended to serve as baseline reference data for future comparative studies. Complete benchmark data is preserved in `results/final_dataset_n30/` for reproducibility and further analysis.

---

*Document generated: January 13, 2026*  
*This document is intended as technical documentation for a benchmark dataset artifact.*
