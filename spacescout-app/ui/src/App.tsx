import { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { TreemapCanvas } from './TreemapCanvas';
import { Toolbar } from './Toolbar';
import { Breadcrumb } from './Breadcrumb';

export function App() {
  const [dimensions, setDimensions] = useState({
    width: window.innerWidth,
    height: window.innerHeight - 100, // Subtract toolbar + breadcrumb height
  });

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      // Backspace or Escape: zoom out to parent
      if (e.key === 'Backspace' || e.key === 'Escape') {
        // Don't trigger if user is typing in an input field
        if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
          return;
        }

        e.preventDefault();

        try {
          const parentId = await invoke<number | null>('get_parent_node');
          if (parentId !== null) {
            await invoke('set_zoom', { nodeId: parentId });
          }
        } catch (err) {
          console.error('Failed to zoom out:', err);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight - 100,
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', background: '#1a1a1a' }}>
      <Toolbar />
      <Breadcrumb />
      <TreemapCanvas width={dimensions.width} height={dimensions.height} />
    </div>
  );
}
