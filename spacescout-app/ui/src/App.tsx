import { useEffect, useState } from 'react';
import { TreemapCanvas } from './TreemapCanvas';
import { Toolbar } from './Toolbar';
import { Breadcrumb } from './Breadcrumb';

export function App() {
  const [dimensions, setDimensions] = useState({
    width: window.innerWidth,
    height: window.innerHeight - 100, // Subtract toolbar + breadcrumb height
  });

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
