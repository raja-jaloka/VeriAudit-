import React, { useEffect, useRef } from 'react';

/**
 * Higgsfield-inspired interactive neural particle and radiant nebula background canvas.
 * Renders high-performance, 60fps cosmic particles connected by neon cyan & violet light waves
 * with interactive cursor repulsion and ambient obsidian plasma.
 */
export const HiggsfieldCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Mouse coordinates for interactive warp & repulsion
    const mouse = {
      x: width / 2,
      y: height / 2,
      radius: 140,
      isActive: false,
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      mouse.isActive = true;
    };

    const handleMouseLeave = () => {
      mouse.isActive = false;
    };

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);
    window.addEventListener('resize', handleResize);

    // Particle nodes definition
    const particleCount = Math.min(65, Math.floor((width * height) / 22000));
    const particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      baseColor: string;
      alpha: number;
      pulseSpeed: number;
    }> = [];

    const colors = [
      'rgba(6, 182, 212, ',   // Neon Cyan
      'rgba(99, 102, 241, ',  // Electric Indigo
      'rgba(139, 92, 246, ',  // Violet
      'rgba(34, 211, 238, ',  // Bright Cyan
    ];

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.45,
        vy: (Math.random() - 0.5) * 0.45,
        size: Math.random() * 2.2 + 0.8,
        baseColor: colors[Math.floor(Math.random() * colors.length)],
        alpha: Math.random() * 0.6 + 0.2,
        pulseSpeed: Math.random() * 0.02 + 0.005,
      });
    }

    let frame = 0;

    const render = () => {
      frame++;
      ctx.clearRect(0, 0, width, height);

      // Draw subtle radiant nebula glow in background
      const grad1 = ctx.createRadialGradient(
        width * 0.2 + Math.sin(frame * 0.005) * 80,
        height * 0.25 + Math.cos(frame * 0.005) * 60,
        0,
        width * 0.2,
        height * 0.25,
        width * 0.55
      );
      grad1.addColorStop(0, 'rgba(6, 182, 212, 0.045)');
      grad1.addColorStop(0.5, 'rgba(99, 102, 241, 0.02)');
      grad1.addColorStop(1, 'transparent');
      ctx.fillStyle = grad1;
      ctx.fillRect(0, 0, width, height);

      const grad2 = ctx.createRadialGradient(
        width * 0.8 + Math.cos(frame * 0.004) * 90,
        height * 0.75 + Math.sin(frame * 0.004) * 70,
        0,
        width * 0.8,
        height * 0.75,
        width * 0.6
      );
      grad2.addColorStop(0, 'rgba(139, 92, 246, 0.04)');
      grad2.addColorStop(0.6, 'rgba(6, 182, 212, 0.015)');
      grad2.addColorStop(1, 'transparent');
      ctx.fillStyle = grad2;
      ctx.fillRect(0, 0, width, height);

      // Update & Draw connected neural particle web
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Move particles smoothly
        p.x += p.vx;
        p.y += p.vy;

        // Bounce on edges
        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;

        // Interactive mouse repulsion & gravitational warp
        if (mouse.isActive) {
          const dx = mouse.x - p.x;
          const dy = mouse.y - p.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < mouse.radius && dist > 0) {
            const force = (mouse.radius - dist) / mouse.radius;
            const angle = Math.atan2(dy, dx);
            p.x -= Math.cos(angle) * force * 1.8;
            p.y -= Math.sin(angle) * force * 1.8;
          }
        }

        // Pulse alpha
        const currentAlpha = p.alpha + Math.sin(frame * p.pulseSpeed) * 0.15;

        // Draw particle node
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `${p.baseColor}${Math.max(0.1, currentAlpha)})`;
        ctx.shadowBlur = 8;
        ctx.shadowColor = 'rgba(6, 182, 212, 0.5)';
        ctx.fill();
        ctx.shadowBlur = 0;

        // Connect nearby particles with subtle glowing lines
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dist = Math.hypot(p.x - p2.x, p.y - p2.y);
          const maxDist = 135;

          if (dist < maxDist) {
            const lineAlpha = (1 - dist / maxDist) * 0.16;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(6, 182, 212, ${lineAlpha})`;
            ctx.lineWidth = 0.75;
            ctx.stroke();
          }
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 0,
        opacity: 0.85,
      }}
    />
  );
};
