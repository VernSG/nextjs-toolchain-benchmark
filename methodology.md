# Experimental Methodology

## 1. Objective
To rigorously compare the performance characteristics of the legacy JavaScript-based toolchain (Webpack) versus the modern Rust-based toolchain (Turbopack) within the Next.js framework on Apple Silicon hardware.

## 2. Experimental Environment
All benchmarks were conducted on a consistent hardware and software environment to ensure data validity.

* **Hardware:** MacBook Air M1 (Apple Silicon).
* **Operating System:** macOS (Darwin Kernel).
* **Runtime:** Node.js v20 (LTS).
* **Framework:** Next.js 14.2.35.
    * *Legacy Mode:* `next dev` (Webpack).
    * *Turbo Mode:* `next dev --turbo` (Turbopack).

## 3. Variables
* **Independent Variable:** Toolchain type (Webpack vs. Turbopack).
* **Dependent Variables (Metrics):**
    1.  **Cold Start Time (ms):** Time from CLI command to server "Ready".
    2.  **Hot Module Replacement (HMR) Latency (ms):** Time from file save to recompilation complete.
    3.  **System Resources:** CPU Utilization (%) and Memory Usage (RSS in MB).

## 4. Measurement Procedure

The experiment was automated using a custom suite of Node.js and Bash scripts to eliminate human error and timing inconsistencies.

### Phase 1: Cold Start Measurement
1.  **Cache Isolation:** The `.next` build folder was deleted before *every* run to enforce a true cold start state.
2.  **Execution:** The script `measure_start.js` spawns the Next.js process in a detached state.
3.  **Detection:** The script captures `stdout` and uses Regex to parse the "Ready in Xms" log message from the Next.js CLI.
4.  **Termination:** Immediately upon detection, the entire process group is killed to reset the environment.

### Phase 2: Hot Module Replacement (HMR) Simulation
Due to Next.js's "Lazy Compilation" architecture (pages are not compiled until requested), a specific protocol was developed in `measure_hot_reload.js`:

1.  **Server Initialization:** The server is started and allowed to reach the "Ready" state.
2.  **Warm-Up (The "Fetch" Trigger):** The script executes an HTTP GET request (`fetch`) to `http://localhost:3000`. This simulates a browser visit, forcing Next.js to compile the initial route.
3.  **Stabilization:** A 3-second delay is applied to ensure CPU activity returns to baseline.
4.  **File Injection:** The script programmatically appends a comment (`// Hot Reload Test [timestamp]`) to `app/page.tsx` to trigger a rebuild.
5.  **Latency Capture:** The script listens for the "Compiled in Xms" log event and records the duration.
6.  **Cleanup:** The file modifications are automatically reverted (undone) after measurement.

### Phase 3: Resource Monitoring
A background script (`monitor_system.sh`) runs concurrently with the active processes.
* **Sampling Rate:** 100ms (0.1 seconds).
    * *Rationale:* Standard 1-second sampling was insufficient because Turbopack often completes tasks in sub-second timeframes (<600ms), which would lead to missing data points.
* **Metrics:** Captures Process ID (PID) specific CPU percentage and Resident Set Size (RSS) memory.

## 5. Repetition & Consistency
* **Sample Size:** 5 sequential runs for each mode (Legacy & Turbo) for both Cold Start and HMR tests.
* **Cooldown:** A 3-5 second cooldown period was enforced between iterations to prevent thermal throttling from affecting subsequent runs.

## 6. Limitations
* The experiment focuses on the development environment (`next dev`) and does not reflect production build performance (`next build`).
* Measurements are specific to the Apple Silicon (ARM64) architecture and results may vary on x86_64 systems.