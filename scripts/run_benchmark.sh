#!/bin/bash

# Konfigurasi
RUNS=30
MODES=("legacy" "turbo")

echo "=== STARTING FULL BENCHMARK SUITE ==="
mkdir -p results/raw

# Simpan info environment
echo "Date: $(date)" > environment.txt
echo "Next.js: 14.2.35" >> environment.txt

for MODE in "${MODES[@]}"; do
    echo "################################################"
    echo "STARTING TEST FOR: $MODE"
    echo "################################################"
    
    for ((i=1; i<=RUNS; i++)); do
        echo "--- Iteration $i of $RUNS ---"
        
        # === PART 1: COLD START ===
        # Hapus Cache (Hanya untuk cold start)
        rm -rf app/.next
        
        # Start Monitor
        ./scripts/monitor_system.sh "results/raw/${MODE}_run${i}_system.csv" &
        MONITOR_PID=$!
        
        # Ukur Cold Start
        node scripts/measure_start.js $MODE $i > "results/raw/${MODE}_run${i}_coldstart.log"
        
        # Stop Monitor
        kill $MONITOR_PID 2>/dev/null
        
        echo "Cold Start Done. Cooldown 3s..."
        sleep 3

        # === PART 2: HOT RELOAD ===
        # Kita tidak hapus cache di sini karena HMR butuh server jalan/warm
        # Script measure_hot_reload.js akan menyalakan server sendiri
        
        node scripts/measure_hot_reload.js $MODE $i > "results/raw/${MODE}_run${i}_hmr.log"
        
        echo "Hot Reload Done. Cooldown 5s..."
        sleep 5
    done
done

echo "=== BENCHMARK SELESAI ==="