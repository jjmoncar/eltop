'use client';

import { useEffect, useRef } from 'react';

const ADSTERRA_SCRIPT_SRC =
  'https://www.highrevenueformat.com/acb8a6299a2d176f3dc3ca1c016c82b0/invoke.js';

export function AdsterraLeftBanner() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || container.dataset.loaded === 'true') return;

    const optionsScript = document.createElement('script');
    optionsScript.text = `atOptions = {
      key: 'acb8a6299a2d176f3dc3ca1c016c82b0',
      format: 'iframe',
      height: 600,
      width: 160,
      params: {}
    };`;

    const invokeScript = document.createElement('script');
    invokeScript.src = ADSTERRA_SCRIPT_SRC;
    invokeScript.async = true;

    container.append(optionsScript, invokeScript);
    container.dataset.loaded = 'true';

    return () => {
      optionsScript.remove();
      invokeScript.remove();
    };
  }, []);

  return (
    <aside
      ref={containerRef}
      className="hidden h-[600px] w-[160px] shrink-0 overflow-hidden xl:block"
      aria-label="Publicidad"
    />
  );
}
