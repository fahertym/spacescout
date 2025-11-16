import { useEffect, useState } from 'react';
import { listen } from '@tauri-apps/api/event';
import { invoke } from '@tauri-apps/api/core';
import type { BreadcrumbsResponse, BreadcrumbItem } from './types';

export function Breadcrumb() {
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([]);

  // Listen for breadcrumb updates from backend
  useEffect(() => {
    const unlisten = listen<BreadcrumbsResponse>('breadcrumbs_update', (event) => {
      setBreadcrumbs(event.payload.items);
    });

    return () => {
      unlisten.then((fn) => fn());
    };
  }, []);

  const handleBreadcrumbClick = (id: number) => {
    invoke('set_zoom', { nodeId: id });
  };

  if (breadcrumbs.length === 0) {
    return null;
  }

  return (
    <div
      style={{
        padding: '8px 16px',
        background: '#1e1e1e',
        borderBottom: '1px solid #444',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        fontSize: '14px',
        color: '#ddd',
        overflow: 'auto',
      }}
    >
      {breadcrumbs.map((crumb, index) => (
        <div key={crumb.id} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={() => handleBreadcrumbClick(crumb.id)}
            style={{
              background: 'none',
              border: 'none',
              color: index === breadcrumbs.length - 1 ? '#fff' : '#0099ff',
              cursor: index === breadcrumbs.length - 1 ? 'default' : 'pointer',
              padding: '4px 8px',
              borderRadius: '4px',
              fontSize: '14px',
              fontWeight: index === breadcrumbs.length - 1 ? 600 : 400,
              textDecoration: 'none',
              whiteSpace: 'nowrap',
            }}
            disabled={index === breadcrumbs.length - 1}
            onMouseEnter={(e) => {
              if (index !== breadcrumbs.length - 1) {
                e.currentTarget.style.background = '#2a2a2a';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'none';
            }}
          >
            {crumb.name}
          </button>
          {index < breadcrumbs.length - 1 && (
            <span style={{ color: '#666', userSelect: 'none' }}>›</span>
          )}
        </div>
      ))}
    </div>
  );
}
