import { useEffect } from 'react';
import { useRouterState } from '@tanstack/react-router';

export const useLoadingFavicon = () => {
  const isLoading = useRouterState({ select: (s) => s.isLoading });

  useEffect(() => {
    if (!isLoading) return;

    const link = document.querySelector<HTMLLinkElement>(
      'link[rel="icon"]'
    );
    if (!link) return;

    const originalHref = link.href;
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d')!;

    let angle = 0;
    let frameId: number;

    const draw = () => {
      ctx.clearRect(0, 0, 32, 32);

      // Spinning arc
      ctx.beginPath();
      ctx.arc(16, 16, 12, angle, angle + Math.PI * 1.4);
      ctx.strokeStyle = '#1e2934';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.stroke();

      link.href = canvas.toDataURL('image/png');
      angle += 0.15;
      frameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(frameId);
      link.href = originalHref;
    };
  }, [isLoading]);
};
