import { useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { open } from '@tauri-apps/plugin-shell';

export function Toolbar() {
  const [scanPath, setScanPath] = useState('');
  const [minSizeKB, setMinSizeKB] = useState(0);
  const [isScanning, setIsScanning] = useState(false);

  const handleStartScan = async () => {
    if (!scanPath) {
      alert('Please enter a path to scan');
      return;
    }

    setIsScanning(true);
    try {
      await invoke('start_scan', {
        root: scanPath,
        minSizeKb: minSizeKB,
      });
    } catch (error) {
      console.error('Scan failed:', error);
      alert(`Scan failed: ${error}`);
      setIsScanning(false);
    }
  };

  return (
    <div
      style={{
        padding: '12px 16px',
        background: '#2a2a2a',
        borderBottom: '1px solid #444',
        display: 'flex',
        gap: '12px',
        alignItems: 'center',
      }}
    >
      <div style={{ flex: 1, display: 'flex', gap: '8px', alignItems: 'center' }}>
        <label style={{ color: '#ddd', fontSize: '14px' }}>Path:</label>
        <input
          type="text"
          value={scanPath}
          onChange={(e) => setScanPath(e.target.value)}
          placeholder="/path/to/scan"
          style={{
            flex: 1,
            padding: '6px 10px',
            background: '#1a1a1a',
            color: '#fff',
            border: '1px solid #555',
            borderRadius: '4px',
            fontSize: '14px',
          }}
        />
      </div>

      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <label style={{ color: '#ddd', fontSize: '14px' }}>Min size (KB):</label>
        <input
          type="number"
          value={minSizeKB}
          onChange={(e) => setMinSizeKB(Number(e.target.value))}
          min="0"
          style={{
            width: '80px',
            padding: '6px 10px',
            background: '#1a1a1a',
            color: '#fff',
            border: '1px solid #555',
            borderRadius: '4px',
            fontSize: '14px',
          }}
        />
      </div>

      <button
        onClick={handleStartScan}
        disabled={isScanning}
        style={{
          padding: '6px 16px',
          background: isScanning ? '#555' : '#0066cc',
          color: '#fff',
          border: 'none',
          borderRadius: '4px',
          fontSize: '14px',
          cursor: isScanning ? 'not-allowed' : 'pointer',
          fontWeight: 500,
        }}
      >
        {isScanning ? 'Scanning...' : 'Scan'}
      </button>
    </div>
  );
}
