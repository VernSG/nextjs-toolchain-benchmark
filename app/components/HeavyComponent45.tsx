
    import React from 'react';
    
    // Simulasi beban statis (beban parsing)
    const heavyData = Array.from({ length: 2000 }, (_, i) => "Data item " + i);

    export default function HeavyComponent45() {
        // Simulasi beban render
        return (
            <div className="p-4 border m-2 bg-gray-50 rounded shadow-sm">
                <h3 className="font-bold text-sm">Component #45</h3>
                <p className="text-xs text-gray-500">Loaded {heavyData.length} heavy items</p>
            </div>
        );
    }