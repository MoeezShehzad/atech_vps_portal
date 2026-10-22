import React, { useState, useEffect, useRef } from 'react';

interface LiquidGlassSphereProps {
  className?: string;
}

export default function LiquidGlassSphere({ className = '' }: LiquidGlassSphereProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      // Calculate normalized offset from center (-1 to 1)
      const x = (e.clientX - centerX) / (rect.width / 2);
      const y = (e.clientY - centerY) / (rect.height / 2);

      // Clamp between -1.5 and 1.5
      if (Math.abs(x) < 2 && Math.abs(y) < 2) {
        setMousePos({ x: Math.max(-1, Math.min(1, x)), y: Math.max(-1, Math.min(1, y)) });
      }
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Smooth tilt calculations
  const tiltX = mousePos.y * -14;
  const tiltY = mousePos.x * 16;
  const glintShiftX = mousePos.x * 22;
  const glintShiftY = mousePos.y * 18;

  return (
    <div
      ref={containerRef}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setMousePos({ x: 0, y: 0 });
      }}
      className={`relative flex items-center justify-center select-none ${className}`}
      style={{ perspective: '1200px' }}
    >
      {/* 1. ATMOSPHERIC BACKLIGHT GLOW (Nexa-inspired Electric Blue & Cyan) */}
      <div
        className="absolute w-[360px] sm:w-[460px] h-[360px] sm:h-[460px] rounded-full blur-[80px] sm:blur-[100px] pointer-events-none transition-all duration-700 opacity-60 dark:opacity-80"
        style={{
          background: 'radial-gradient(circle at 45% 45%, rgba(66, 99, 255, 0.45) 0%, rgba(82, 217, 255, 0.25) 45%, rgba(5, 8, 22, 0) 70%)',
          transform: `translate3d(${glintShiftX * 0.5}px, ${glintShiftY * 0.5}px, 0)`,
        }}
      />

      {/* 2. GOLDEN RATIO TECHNICAL ORBITAL RINGS */}
      <div
        className="absolute w-[380px] sm:w-[480px] h-[380px] sm:h-[480px] pointer-events-none"
        style={{
          transform: `rotateX(61.8deg) rotateY(${tiltY * 0.3}deg) rotateZ(${tiltX * 0.2}deg)`,
          transition: 'transform 0.4s ease-out',
        }}
      >
        {/* Outer Fine Orbit Ring (φ = 1.618) */}
        <div className="absolute inset-0 rounded-full border border-blue-400/20 dark:border-blue-400/30 animate-[spin_48s_linear_infinite]" />
        
        {/* Secondary Inclined Dashed Technical Ring */}
        <div 
          className="absolute inset-6 rounded-full border border-dashed border-cyan-400/20 dark:border-cyan-300/30 animate-[spin_32s_linear_infinite_reverse]" 
        />

        {/* Orbiting Telemetry Node */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-1.5 animate-[spin_24s_linear_infinite]">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-lg shadow-cyan-400/80 animate-ping" />
          <span className="w-2 h-2 rounded-full bg-blue-500" />
        </div>
      </div>

      {/* 3. 3D LIQUID-GLASS SPHERE CORE CONTAINER */}
      <div
        className="relative w-[280px] sm:w-[350px] md:w-[380px] h-[280px] sm:h-[350px] md:h-[380px] rounded-full transition-transform duration-500 ease-out cursor-grab active:cursor-grabbing"
        style={{
          transform: `rotateX(${tiltX}deg) rotateY(${tiltY}deg) translateZ(20px)`,
          transformStyle: 'preserve-3d',
        }}
      >
        {/* Sphere Base Shadow */}
        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-3/4 h-8 bg-blue-950/40 dark:bg-black/60 rounded-full blur-xl pointer-events-none" />

        {/* The Sculptural Liquid Glass Orb Body */}
        <div className="relative w-full h-full rounded-full overflow-hidden shadow-2xl shadow-blue-600/30 dark:shadow-blue-500/20 border border-white/40 dark:border-white/10 backdrop-blur-xs">
          
          {/* Deep Obsidian & Liquid Sapphire Gradient Base */}
          <div
            className="absolute inset-0 rounded-full transition-all duration-700"
            style={{
              background: `
                radial-gradient(circle at ${35 + mousePos.x * 10}% ${30 + mousePos.y * 10}%, 
                  #ffffff 0%, 
                  #93c5fd 8%, 
                  #3b82f6 24%, 
                  #1d4ed8 45%, 
                  #1e1b4b 72%, 
                  #050816 100%
                )
              `,
            }}
          />

          {/* Internal Electric-Blue Caustic Liquid Wave Simulation */}
          <div
            className="absolute inset-0 rounded-full opacity-70 mix-blend-screen animate-pulse"
            style={{
              background: `
                radial-gradient(ellipse 90% 75% at ${55 - mousePos.x * 15}% ${65 - mousePos.y * 15}%, 
                  rgba(82, 217, 255, 0.75) 0%, 
                  rgba(66, 99, 255, 0.5) 40%, 
                  transparent 75%
                )
              `,
              filter: 'blur(12px)',
              animationDuration: '6s',
            }}
          />

          {/* Secondary Violet Chromatic Dispersion Wave */}
          <div
            className="absolute inset-0 rounded-full opacity-60 mix-blend-color-dodge pointer-events-none"
            style={{
              background: `
                radial-gradient(circle at ${65 - glintShiftX * 0.4}% ${35 + glintShiftY * 0.4}%, 
                  rgba(192, 132, 252, 0.6) 0%, 
                  rgba(59, 130, 246, 0.3) 50%, 
                  transparent 80%
                )
              `,
              filter: 'blur(18px)',
            }}
          />

          {/* Precision Specular Highlights (Upper Curvature Light Arc) */}
          <div
            className="absolute rounded-full pointer-events-none transition-all duration-200"
            style={{
              top: `${14 + glintShiftY * 0.2}%`,
              left: `${20 + glintShiftX * 0.2}%`,
              width: '42%',
              height: '24%',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.3) 50%, transparent 85%)',
              filter: 'blur(3px)',
              transform: 'rotate(-25deg)',
            }}
          />

          {/* Secondary Micro Specular Sheen Pin */}
          <div
            className="absolute rounded-full pointer-events-none transition-all duration-150"
            style={{
              top: `${26 + glintShiftY * 0.25}%`,
              left: `${26 + glintShiftX * 0.25}%`,
              width: '10%',
              height: '7%',
              borderRadius: '50%',
              background: '#ffffff',
              boxShadow: '0 0 16px 4px rgba(255, 255, 255, 0.9), 0 0 32px 8px rgba(82, 217, 255, 0.6)',
            }}
          />

          {/* Internal Fresnel Glass Rim Reflection */}
          <div
            className="absolute inset-0 rounded-full pointer-events-none border-2 border-white/20"
            style={{
              boxShadow: 'inset 0 0 45px rgba(82, 217, 255, 0.5), inset 0 0 15px rgba(255, 255, 255, 0.6)',
            }}
          />

          {/* Organic Technical Lattice Texture (Golden Ratio Mesh Overlay) */}
          <svg className="absolute inset-0 w-full h-full opacity-20 pointer-events-none mix-blend-overlay" viewBox="0 0 400 400">
            <defs>
              <pattern id="meshGrid" width="40" height="40" patternUnits="userSpaceOnUse">
                <circle cx="20" cy="20" r="1" fill="#ffffff" />
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="0.75" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#meshGrid)" />
          </svg>
        </div>

        {/* 4. FLOATING FIBONACCI GLASS BADGE: TOP RIGHT (At 61.8% Golden Height) */}
        <div
          className="absolute -top-3 -right-6 sm:-right-8 bg-white/80 dark:bg-[#111A30]/85 backdrop-blur-md border border-slate-200 dark:border-blue-500/30 rounded-2xl px-3.5 py-2 shadow-xl shadow-blue-950/20 flex items-center gap-2.5 transition-transform duration-300 pointer-events-auto"
          style={{
            transform: `translate3d(${glintShiftX * -0.6}px, ${glintShiftY * -0.6}px, 40px)`,
          }}
        >
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <div>
            <div className="text-[11px] font-bold text-slate-900 dark:text-white leading-tight">
              Enterprise Cloud
            </div>
            <div className="text-[9px] font-medium text-slate-500 dark:text-blue-200/70">
              Low-Latency Virtualization
            </div>
          </div>
        </div>

        {/* 5. FLOATING FIBONACCI GLASS BADGE: BOTTOM LEFT (At 38.2% Golden Ratio) */}
        <div
          className="absolute -bottom-4 -left-6 sm:-left-8 bg-white/80 dark:bg-[#111A30]/85 backdrop-blur-md border border-slate-200 dark:border-blue-500/30 rounded-2xl px-3.5 py-2 shadow-xl shadow-blue-950/20 flex items-center gap-2.5 transition-transform duration-300 pointer-events-auto"
          style={{
            transform: `translate3d(${glintShiftX * 0.5}px, ${glintShiftY * 0.5}px, 50px)`,
          }}
        >
          <div className="w-7 h-7 rounded-xl bg-blue-600/10 dark:bg-blue-500/20 text-blue-600 dark:text-cyan-300 flex items-center justify-center font-bold text-xs">
            φ
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-900 dark:text-white leading-tight">
              100% Pure SSD
            </div>
            <div className="text-[9px] font-medium text-slate-500 dark:text-blue-200/70">
              Full Root Admin Access
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
