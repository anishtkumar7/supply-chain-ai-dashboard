import { useEffect, useState, useCallback, useRef } from 'react';

export function useElementSize() {
  const ref = useRef(null);
  const [size, setSize] = useState({ width: 640, height: 420 });

  const measure = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const { width, height } = el.getBoundingClientRect();
    setSize({
      width: Math.max(280, Math.floor(width)),
      height: Math.max(300, Math.floor(height)),
    });
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    measure();
    const ro = new ResizeObserver(() => measure());
    ro.observe(el);
    return () => ro.disconnect();
  }, [measure]);

  return { ref, ...size };
}
