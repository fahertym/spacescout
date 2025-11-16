import { useEffect, useRef, useState } from 'react';
import { listen } from '@tauri-apps/api/event';
import { invoke } from '@tauri-apps/api/core';
import type { Rect, TreemapUpdate } from './types';

interface TreemapCanvasProps {
  width: number;
  height: number;
}

// Format bytes to human-readable size
function formatSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(1)} ${units[unitIndex]}`;
}

// Generate color from string hash (consistent colors for same paths)
function stringToColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }

  const h = hash % 360;
  const s = 60 + (hash % 20);
  const l = 40 + (hash % 20);

  return `hsl(${h}, ${s}%, ${l}%)`;
}

export function TreemapCanvas({ width, height }: TreemapCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [rects, setRects] = useState<Rect[]>([]);
  const [hoveredRect, setHoveredRect] = useState<Rect | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // Listen for treemap updates from backend
  useEffect(() => {
    const unlisten = listen<TreemapUpdate>('treemap_update', (event) => {
      setRects(event.payload.rects);
    });

    return () => {
      unlisten.then((fn) => fn());
    };
  }, []);

  // Draw treemap when rects change
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw rectangles
    for (const rect of rects) {
      const x = rect.x * width;
      const y = rect.y * height;
      const w = rect.w * width;
      const h = rect.h * height;

      // Skip tiny rectangles
      if (w < 2 || h < 2) continue;

      // Generate color
      const color = stringToColor(rect.name);
      ctx.fillStyle = color;
      ctx.fillRect(x, y, w, h);

      // Draw border
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 1;
      ctx.strokeRect(x, y, w, h);

      // Draw label if rectangle is large enough
      const minLabelWidth = 60;
      const minLabelHeight = 20;
      if (w > minLabelWidth && h > minLabelHeight) {
        ctx.fillStyle = '#fff';
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';

        // Truncate text to fit
        const maxWidth = w - 8;
        let displayName = rect.name;
        const metrics = ctx.measureText(displayName);
        if (metrics.width > maxWidth) {
          while (ctx.measureText(displayName + '...').width > maxWidth && displayName.length > 0) {
            displayName = displayName.slice(0, -1);
          }
          displayName += '...';
        }

        ctx.fillText(displayName, x + 4, y + 4);

        // Draw size if space allows
        if (h > 40) {
          const sizeText = formatSize(rect.size);
          ctx.fillText(sizeText, x + 4, y + 18);
        }
      }
    }

    // Highlight hovered rectangle
    if (hoveredRect) {
      const x = hoveredRect.x * width;
      const y = hoveredRect.y * height;
      const w = hoveredRect.w * width;
      const h = hoveredRect.h * height;

      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 3;
      ctx.strokeRect(x, y, w, h);
    }
  }, [rects, hoveredRect, width, height]);

  // Handle mouse move for hover detection
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / width;
    const y = (e.clientY - rect.top) / height;

    // Find smallest rectangle containing the mouse (most specific)
    let found: Rect | null = null;
    let minArea = Infinity;

    for (const r of rects) {
      if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) {
        const area = r.w * r.h;
        if (area < minArea) {
          minArea = area;
          found = r;
        }
      }
    }

    setHoveredRect(found);
    setMousePos({ x: e.clientX, y: e.clientY });
  };

  // Handle click to zoom
  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (hoveredRect && hoveredRect.is_dir) {
      invoke('set_zoom', { nodeId: hoveredRect.id[0] });
    }
  };

  // Handle right-click to open in file manager
  const handleContextMenu = (e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (hoveredRect) {
      // Path is not currently sent from backend, would need to add to Rect struct
      // invoke('open_in_file_manager', { path: hoveredRect.path });
    }
  };

  return (
    <div style={{ position: 'relative' }}>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        onMouseMove={handleMouseMove}
        onClick={handleClick}
        onContextMenu={handleContextMenu}
        style={{
          cursor: hoveredRect ? (hoveredRect.is_dir ? 'pointer' : 'default') : 'default',
          display: 'block',
        }}
      />

      {/* Tooltip */}
      {hoveredRect && (
        <div
          style={{
            position: 'fixed',
            left: mousePos.x + 10,
            top: mousePos.y + 10,
            background: 'rgba(0, 0, 0, 0.9)',
            color: '#fff',
            padding: '8px 12px',
            borderRadius: '4px',
            fontSize: '12px',
            pointerEvents: 'none',
            zIndex: 1000,
            maxWidth: '300px',
            wordWrap: 'break-word',
          }}
        >
          <div><strong>{hoveredRect.name}</strong></div>
          <div>Size: {formatSize(hoveredRect.size)}</div>
          <div>Type: {hoveredRect.is_dir ? 'Directory' : 'File'}</div>
          {hoveredRect.is_dir && <div style={{ marginTop: 4, fontSize: '10px' }}>Click to zoom in</div>}
        </div>
      )}
    </div>
  );
}
