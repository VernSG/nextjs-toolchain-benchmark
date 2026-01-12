#!/bin/bash
OUTPUT_FILE=$1
echo "timestamp,cpu_percent,memory_mb" > $OUTPUT_FILE

# Loop tanpa henti
while true; do
    # Cari PID
    PID=$(pgrep -f "next-server" | head -n 1)
    
    if [ -z "$PID" ]; then
        PID=$(pgrep -f "next-dev" | head -n 1)
    fi

    if [ ! -z "$PID" ]; then
        # Ambil data
        STATS=$(ps -p $PID -o %cpu,rss | tail -n 1)
        
        # Validasi output ps agar tidak error jika kosong
        if [ ! -z "$STATS" ]; then
            CPU=$(echo $STATS | awk '{print $1}')
            MEM_KB=$(echo $STATS | awk '{print $2}')
            
            # Hitung MB
            if [ ! -z "$MEM_KB" ]; then
                MEM_MB=$((MEM_KB / 1024))
                # Gunakan %s.%N untuk presisi waktu nano (jika didukung) atau %s biasa
                TS=$(date +%s) 
                echo "$TS,$CPU,$MEM_MB" >> $OUTPUT_FILE
            fi
        fi
    fi
    
    # PERUBAHAN UTAMA: Sampling setiap 0.1 detik (100ms)
    sleep 0.1
done