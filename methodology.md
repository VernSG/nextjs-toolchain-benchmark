# Experimental Methodology

**Document Version:** 2.0  
**Last Updated:** January 13, 2026  
**Study Type:** Comparative Performance Analysis with Scalability Evaluation

---

## 1. Research Objective

This study aims to rigorously compare the performance characteristics of two Next.js development toolchains:

1. **Legacy Toolchain:** JavaScript-based Webpack bundler (`next dev`)
2. **Modern Toolchain:** Rust-based Turbopack bundler (`next dev --turbo`)

The investigation encompasses two distinct analytical dimensions:

| Dimension | Research Question |
|-----------|-------------------|
| **Raw Performance** | What are the baseline performance differentials between toolchains on a minimal project? |
| **Scalability** | How does each toolchain's performance degrade (or maintain) as project complexity increases? |

---

## 2. Experimental Environment

All benchmark executions were conducted within a controlled, consistent hardware and software environment to ensure measurement validity and reproducibility.

### 2.1 Hardware Specifications

| Component | Specification |
|-----------|---------------|
| Device | MacBook Air (2020) |
| Processor | Apple M1 (ARM64 Architecture) |
| Memory | 8 GB Unified Memory |
| Storage | 256 GB SSD (APFS) |

### 2.2 Software Configuration

| Component | Version |
|-----------|---------|
| Operating System | macOS Sequoia 15.0 (Darwin Kernel) |
| Node.js Runtime | v20.19.0 LTS |
| Package Manager | npm v10.x |
| Framework | Next.js 14.2.35 |

### 2.3 Toolchain Invocation

| Mode | Command | Bundler |
|------|---------|---------|
| Legacy | `next dev` | Webpack 5.x |
| Turbo | `next dev --turbo` | Turbopack (Rust-native) |

---

## 3. Experimental Variables

### 3.1 Independent Variables

| Variable | Levels | Description |
|----------|--------|-------------|
| **Toolchain Type** | Legacy (Webpack), Turbopack | The bundler technology under evaluation |
| **Project Complexity** | Small (Baseline), Medium (50 Components) | The scale of the application structure |

### 3.2 Dependent Variables

| Metric | Unit | Operational Definition |
|--------|------|------------------------|
| **Cold Start Time** | milliseconds (ms) | Duration from process initiation (`npm run dev`) to server ready state, as indicated by the "Ready in Xms" log output |
| **HMR Latency** | milliseconds (ms) | Duration from file modification timestamp to recompilation completion, as indicated by the "Compiled in Xms" log output |

### 3.3 Controlled Variables

To minimize confounding effects, the following variables were held constant:

- Ambient system temperature (room-temperature operation)
- Background process load (minimal concurrent applications)
- Network conditions (localhost-only communication)
- File system state (clean `.next` cache for cold start measurements)

---

## 4. Test Phases

The experimental design comprises two sequential phases, each addressing a distinct research question.

### 4.1 Phase 1: Baseline Performance (Small Project)

**Objective:** Establish baseline performance metrics using a minimal Next.js application to quantify the inherent performance differential between toolchains.

**Project Characteristics:**

| Attribute | Value |
|-----------|-------|
| Source | Default `create-next-app` template |
| Component Count | ~3-5 (minimal) |
| Dependencies | Next.js core only |
| Routing Structure | Single route (`/`) |

**Measurements Collected:**
- Cold Start Time (N=30 per toolchain)
- HMR Latency (N=30 per toolchain)
- System Resource Utilization (CPU%, Memory MB)

### 4.2 Phase 2: Scalability Analysis (Medium Project)

**Objective:** Evaluate how each toolchain's HMR performance scales under increased project complexity, specifically testing the hypothesis that Turbopack exhibits O(1) constant-time behavior while Webpack exhibits O(n) linear scaling.

**Project Transformation:**

The baseline project was programmatically transformed into a medium-scale application using the [`generate_dummy.js`](scripts/generate_dummy.js) script, which performs the following operations:

#### 4.2.1 Component Generation Algorithm

```javascript
// Pseudocode representation of generate_dummy.js logic
for (i = 1; i <= 50; i++) {
    createComponent({
        name: `HeavyComponent${i}`,
        payload: Array(2000).fill("Data item"),  // Static parsing load
        template: ReactFunctionalComponent
    });
}
```

#### 4.2.2 Technical Implementation

1. **Heavy Component Structure:**
   Each generated component ([`HeavyComponent1.tsx`](app/components/HeavyComponent1.tsx) through [`HeavyComponent50.tsx`](app/components/HeavyComponent50.tsx)) contains:
   - A static array of 2,000 string elements to increase JavaScript parsing overhead
   - A functional React component with Tailwind CSS styling
   - Unique identifier for traceability

2. **Dependency Graph Injection:**
   The script automatically modifies [`page.tsx`](app/page.tsx) to import and render all 50 components, thereby expanding the module dependency graph from ~5 nodes to ~55 nodes.

3. **Load Characteristics:**

| Metric | Small Project | Medium Project | Increase Factor |
|--------|---------------|----------------|-----------------|
| Component Files | ~5 | 55 | 11× |
| Import Statements | ~3 | 53 | 17.7× |
| Static Data Elements | ~0 | 100,000 | — |
| Estimated Bundle Complexity | Baseline | 10-15× | — |

**Measurements Collected:**
- HMR Latency (N=30 per toolchain)

---

## 5. Measurement Protocol

All measurements were automated using a custom instrumentation suite to eliminate human-induced timing variance and ensure reproducibility.

### 5.1 Automation Infrastructure

| Script | Function | Location |
|--------|----------|----------|
| [`run_benchmark.sh`](scripts/run_benchmark.sh) | Master orchestration script; iterates through all test conditions | `scripts/` |
| [`measure_start.js`](scripts/measure_start.js) | Cold start time capture via stdout parsing | `scripts/` |
| [`measure_hot_reload.js`](scripts/measure_hot_reload.js) | HMR latency capture with warm-up protocol | `scripts/` |
| [`monitor_system.sh`](scripts/monitor_system.sh) | Concurrent system resource sampling | `scripts/` |

### 5.2 Cold Start Measurement Procedure

```
┌─────────────────────────────────────────────────────────────┐
│  COLD START MEASUREMENT PROTOCOL                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. Cache Purge                                             │
│     └── rm -rf .next/                                       │
│                                                             │
│  2. Process Spawn                                           │
│     └── spawn('npm', ['run', npmCommand], {detached: true}) │
│                                                             │
│  3. Output Monitoring                                       │
│     └── stdout.on('data') → Regex: /Ready in (\d+)ms/       │
│                                                             │
│  4. Timestamp Capture                                       │
│     └── Record matched duration value                       │
│                                                             │
│  5. Process Termination                                     │
│     └── process.kill(-server.pid, 'SIGTERM')                │
│                                                             │
│  6. Cooldown Period                                         │
│     └── sleep(3000) // 3 seconds                            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 5.3 HMR Measurement Procedure

Due to Next.js's **Lazy Compilation** architecture—wherein routes are not compiled until first requested—a specialized warm-up protocol was developed:

```
┌─────────────────────────────────────────────────────────────┐
│  HMR MEASUREMENT PROTOCOL (with Fetch Warm-up)              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. Server Initialization                                   │
│     └── Start dev server, await "Ready" state               │
│                                                             │
│  2. ★ FETCH WARM-UP (Critical Step) ★                       │
│     └── fetch('http://localhost:3000')                      │
│     └── Purpose: Force initial route compilation            │
│     └── Simulates browser navigation to trigger lazy build  │
│                                                             │
│  3. Stabilization Delay                                     │
│     └── setTimeout(3000) // Wait for CPU baseline           │
│                                                             │
│  4. File Modification Injection                             │
│     └── Append: "// HMR Test: ${Date.now()}" to page.tsx    │
│     └── Record: hotReloadStartTime = Date.now()             │
│                                                             │
│  5. Recompilation Detection                                 │
│     └── stdout.on('data') → Regex: /Compiled.*in (\d+)ms/   │
│                                                             │
│  6. File Restoration                                        │
│     └── fs.writeFileSync(filePath, originalContent)         │
│                                                             │
│  7. Process Termination & Cooldown                          │
│     └── Kill process group, sleep(5000)                     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Rationale for Fetch Warm-up:**
Without the HTTP fetch step, HMR measurements would include initial compilation time, conflating cold-start overhead with incremental rebuild performance. The warm-up ensures that only true hot-reload latency is captured.

### 5.4 Sample Size Determination

| Parameter | Value | Justification |
|-----------|-------|---------------|
| **Sample Size (N)** | 30 runs per condition | Sufficient for Central Limit Theorem applicability; enables parametric statistical analysis |
| **Total Measurements** | 120 HMR samples (2 toolchains × 2 project sizes × 30 runs) | Provides statistical power for detecting effect sizes >0.5σ |
| **Pilot Study** | N=5 (preliminary) | Validated instrumentation accuracy and identified measurement artifacts |

### 5.5 Inter-Trial Controls

| Control | Implementation | Purpose |
|---------|----------------|---------|
| Cache Isolation | `rm -rf .next/` before cold start runs | Ensures true cold-start state |
| Process Termination | SIGTERM to process group (`-pid`) | Prevents zombie processes |
| Cooldown Period | 3-5 seconds between iterations | Mitigates thermal throttling effects |
| File State Reset | Automatic reversion of modified files | Maintains consistent test conditions |

---

## 6. Data Processing & Statistical Analysis

### 6.1 Raw Data Collection

All measurements are persisted in the [`results/`](results/) directory with the following structure:

```
results/
├── final_dataset_n30/          # Phase 1 (Baseline) data
│   ├── legacy_run{1-30}_*.log
│   └── turbo_run{1-30}_*.log
├── medium_project_n30/         # Phase 2 (Scalability) data
│   ├── legacy_run{1-30}_*.log
│   └── turbo_run{1-30}_*.log
└── SUMMARY.txt                 # Aggregated statistics
```

### 6.2 Statistical Measures

The following descriptive and inferential statistics are computed for each metric:

| Statistic | Formula | Interpretation |
|-----------|---------|----------------|
| **Arithmetic Mean (μ)** | $\mu = \frac{1}{N}\sum_{i=1}^{N} x_i$ | Central tendency; expected typical value |
| **Median** | Middle value of sorted dataset | Robust central tendency (outlier-resistant) |
| **Standard Deviation (σ)** | $\sigma = \sqrt{\frac{1}{N}\sum_{i=1}^{N}(x_i - \mu)^2}$ | Dispersion from mean |
| **95th Percentile (P95)** | Value below which 95% of observations fall | Worst-case performance bound |
| **Coefficient of Variation (CV)** | $CV = \frac{\sigma}{\mu} \times 100\%$ | Normalized variability metric |
| **Range** | $\text{Max} - \text{Min}$ | Total spread of observations |

### 6.3 Performance Comparison Metrics

| Metric | Formula | Interpretation |
|--------|---------|----------------|
| **Speedup Factor** | $S = \frac{T_{Legacy}}{T_{Turbo}}$ | Multiplicative performance improvement |
| **Percentage Reduction** | $R = \frac{T_{Legacy} - T_{Turbo}}{T_{Legacy}} \times 100\%$ | Relative time savings |
| **Scalability Delta** | $\Delta = \frac{T_{Medium} - T_{Small}}{T_{Small}} \times 100\%$ | Performance degradation rate |

### 6.4 Analysis Scripts

Statistical computations are performed using [`analyze_data.py`](scripts/analyze_data.py), which implements:

- Automated log file parsing
- Descriptive statistics calculation
- Cross-condition comparison
- Formatted report generation

---

## 7. Limitations & Threats to Validity

### 7.1 Internal Validity

| Threat | Mitigation |
|--------|------------|
| Measurement instrumentation error | Automated regex parsing with validated patterns |
| Thermal throttling | Cooldown periods between runs |
| Background process interference | Minimal concurrent application load |

### 7.2 External Validity

| Limitation | Implication |
|------------|-------------|
| Single hardware platform (Apple M1) | Results may vary on x86_64 or other ARM architectures |
| Development mode only (`next dev`) | Production build performance (`next build`) not evaluated |
| Synthetic component generation | Real-world component complexity may differ |
| Single framework version | Results specific to Next.js 14.2.35 |

### 7.3 Construct Validity

| Consideration | Approach |
|---------------|----------|
| HMR latency definition | Measured from file modification to "Compiled" log, not browser refresh |
| "Heavy" component operationalization | 2,000-element static array per component; may not represent all complexity types |

---

## 8. Reproducibility

To replicate this study:

1. **Environment Setup:**
   ```bash
   git clone <repository-url>
   cd <repository-name>
   npm install
   ```

2. **Phase 1 Execution (Baseline):**
   ```bash
   ./scripts/run_benchmark.sh
   ```

3. **Phase 2 Setup (Scalability):**
   ```bash
   node scripts/generate_dummy.js
   ```

4. **Phase 2 Execution:**
   ```bash
   ./scripts/run_benchmark.sh
   ```

5. **Data Analysis:**
   ```bash
   python scripts/analyze_data.py
   ```

---

*Methodology document prepared in accordance with empirical software engineering research standards.*