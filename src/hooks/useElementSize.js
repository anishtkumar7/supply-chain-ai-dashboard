import { useEffect, useState, useCallback, useRef } from 'react';

export function useElementSize() {
  const ref = useRef(null);
  const [size, setSize] = useState({ width: 640, height: 420 });

  const measure = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const { width, height } = el.getBoundingClientRect();
    const nextWidth = Math.max(280, Math.floor(width));
    const nextHeight = Math.max(300, Math.floor(height));
    setSize((prev) => {
      if (prev.width === nextWidth && prev.height === nextHeight) return prev;
      return { width: nextWidth, height: nextHeight };
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
