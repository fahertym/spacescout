import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import type { ScanProgress, TreemapUpdate } from './types';

export function Toolbar() {
  const [scanPath, setScanPath] = useState('');
  const [minSizeKB, setMinSizeKB] = useState(0);
  const [isScanning, setIsScanning] = useState(false);
  const [progress, setProgress] = useState<ScanProgress | null>(null);

  // Load home directory as default path on mount
  useEffect(() => {
    invoke<string>('get_home_dir')
      .then((homeDir) => setScanPath(homeDir))
      .catch((err) => console.error('Failed to get home directory:', err));
  }, []);

  // Listen for scan progress and completion
  useEffect(() => {
    const unlistenProgress = listen<ScanProgress>('scan_progress', (event) => {
      setProgress(event.payload);
    });

    const unlistenComplete = listen<TreemapUpdate>('treemap_update', () => {
      setIsScanning(false);
      setProgress(null);
    });

    return () => {
      unlistenProgress.then((fn) => fn());
      unlistenComplete.then((fn) => fn());
    };
  }, []);

  const handleStartScan = async () => {
    if (!scanPath) {
      alert('Please enter a path to scan');
      return;
    }

    setIsScanning(true);
    setProgress(null);
    try {
      await invoke('start_scan', {
        root: scanPath,
        minSizeKb: minSizeKB,
      });
    } catch (error) {
      console.error('Scan failed:', error);
      alert(`Scan failed: ${error}`);
      setIsScanning(false);
      setProgress(null);
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

      {isScanning && progress && (
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', color: '#aaa', fontSize: '12px' }}>
          <span>{progress.files.toLocaleString()} files</span>
          <span>{progress.dirs.toLocaleString()} dirs</span>
          {progress.errors > 0 && (
            <span style={{ color: '#ff6b6b' }}>{progress.errors} errors</span>
          )}
        </div>
      )}
    </div>
  );
}
