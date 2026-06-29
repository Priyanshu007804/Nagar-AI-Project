import { useEffect, useState, useRef } from 'react';
import gsap from 'gsap';
import { useTheme } from './theme-provider';

type TimeOfDay = 'morning' | 'noon' | 'evening' | 'night';

export function HeroCityscape() {
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>('noon');
  const [mounted, setMounted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    setMounted(true);
    // Determine IST time
    const getISTTime = () => {
      const d = new Date();
      // Add timezone offset to get UTC, then add 5.5 hours for IST
      const utc = d.getTime() + (d.getTimezoneOffset() * 60000);
      const ist = new Date(utc + (3600000 * 5.5));
      return ist.getHours();
    };

    const hour = getISTTime();
    
    if (hour >= 5 && hour < 10) setTimeOfDay('morning');
    else if (hour >= 10 && hour < 17) setTimeOfDay('noon');
    else if (hour >= 17 && hour < 20) setTimeOfDay('evening');
    else setTimeOfDay('night');
  }, []);

  useEffect(() => {
    const checkDark = () => {
      const dark = document.documentElement.classList.contains('dark') || theme === 'dark';
      setIsDark(dark);
    };
    checkDark();
  }, [theme]);

  useEffect(() => {
    if (!mounted) return;
    
    const ctx = gsap.context(() => {
      // Cloud animation
      gsap.fromTo('.cloud', 
        { x: -300 },
        {
          x: '100vw',
          duration: 45,
          ease: 'none',
          repeat: -1,
          stagger: 15
        }
      );

      // Sun/Moon gentle float
      gsap.to('.celestial-body', {
        y: -10,
        duration: 4,
        ease: 'sine.inOut',
        yoyo: true,
        repeat: -1
      });
      
      // Twinkling stars if night or evening
      if (timeOfDay === 'night' || timeOfDay === 'evening') {
        gsap.to('.star', {
          opacity: 0.15,
          duration: 'random(1, 3.5)' as any,
          ease: 'sine.inOut',
          yoyo: true,
          repeat: -1,
          stagger: 0.08
        });
      }
    }, containerRef);
    return () => ctx.revert();
  }, [mounted, timeOfDay]);

  if (!mounted) return <div className="absolute inset-0 z-0 bg-background" />;

  const getSkyGradient = () => {
    if (isDark) {
      switch (timeOfDay) {
        case 'morning': return 'bg-gradient-to-b from-[#0f1124] via-[#1b152d] to-[#020617]';
        case 'noon': return 'bg-gradient-to-b from-[#030919] via-[#09142d] to-[#020617]';
        case 'evening': return 'bg-gradient-to-b from-[#18092a] via-[#24112c] to-[#020617]';
        case 'night': return 'bg-gradient-to-b from-[#02040a] via-[#070b1a] to-[#020617]';
      }
    } else {
      switch (timeOfDay) {
        case 'morning': return 'bg-gradient-to-b from-orange-100/40 via-slate-100/80 to-[#f8fafc]';
        case 'noon': return 'bg-gradient-to-b from-sky-100/40 via-slate-50 to-[#f8fafc]';
        case 'evening': return 'bg-gradient-to-b from-purple-100/30 via-orange-100/30 to-[#f8fafc]';
        case 'night': return 'bg-gradient-to-b from-slate-200/50 via-slate-100 to-[#f8fafc]';
      }
    }
  };

  // Generate stars
  const renderStars = () => {
    return Array.from({ length: 45 }).map((_, i) => {
      const size = Math.random() * 2 + 0.8;
      const isGolden = Math.random() > 0.82;
      return (
        <div 
          key={i}
          className="star absolute rounded-full"
          style={{
            width: `${size}px`,
            height: `${size}px`,
            backgroundColor: isGolden ? '#fef08a' : '#ffffff',
            top: `${Math.random() * 50}%`,
            left: `${Math.random() * 100}%`,
            opacity: Math.random() * 0.6 + 0.3,
            boxShadow: size > 1.8 ? (isGolden ? '0 0 6px #fef08a' : '0 0 6px #ffffff') : 'none',
          }}
        />
      );
    });
  };

  const getCloudFill = () => {
    return isDark ? 'rgba(148, 163, 184, 0.05)' : 'rgba(255, 255, 255, 0.35)';
  };

  return (
    <div ref={containerRef} className={`absolute inset-0 z-0 overflow-hidden ${getSkyGradient()} transition-colors duration-1000`}>
      {/* Sky elements */}
      {isDark && (timeOfDay === 'night' || timeOfDay === 'evening') && renderStars()}
      
      {/* Celestial Body Container (Ambient Sun/Moon) */}
      <div className="celestial-body absolute"
           style={{
             top: timeOfDay === 'noon' ? '12%' : timeOfDay === 'night' ? '12%' : '30%',
             left: timeOfDay === 'morning' ? '25%' : timeOfDay === 'evening' ? '75%' : '50%',
             transform: 'translateX(-50%)',
             transition: 'top 1.5s cubic-bezier(0.16, 1, 0.3, 1), left 1.5s cubic-bezier(0.16, 1, 0.3, 1)',
             width: '180px',
             height: '180px',
             pointerEvents: 'none'
           }}
      >
        {/* Soft atmospheric glow halo */}
        <div className="absolute inset-0 rounded-full blur-2xl transition-colors duration-1000"
             style={{
               background: isDark
                 ? (timeOfDay === 'night' ? 'rgba(56, 189, 248, 0.12)' : 'rgba(249, 115, 22, 0.12)')
                 : (timeOfDay === 'night' ? 'rgba(56, 189, 248, 0.06)' : 'rgba(234, 179, 8, 0.06)')
             }}
        />
        {/* Sleek, solid core */}
        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full shadow-lg transition-all duration-1000 ${
          timeOfDay === 'night'
            ? 'w-14 h-14 bg-slate-100/90 border border-slate-200/20 shadow-sky-500/5'
            : 'w-16 h-16 bg-gradient-to-tr from-amber-300 to-orange-400 border border-amber-200/10 shadow-orange-500/5'
        }`}>
          {/* Moon details */}
          {timeOfDay === 'night' && (
            <div className="absolute inset-0 opacity-20">
              <div className="absolute top-3 left-4 w-3 h-3 rounded-full bg-slate-400/40" />
              <div className="absolute top-8 right-3 w-4 h-4 rounded-full bg-slate-400/40" />
              <div className="absolute bottom-4 left-5 w-3 h-3 rounded-full bg-slate-400/40" />
            </div>
          )}
        </div>
      </div>

      {/* Clouds with soft blurred edges */}
      <div className="absolute top-[12%] left-0 opacity-60 cloud blur-[1px]">
        <svg width="180" height="60" viewBox="0 0 120 40" fill={getCloudFill()} xmlns="http://www.w3.org/2000/svg">
          <path d="M20 20 C20 10, 40 10, 40 20 C40 5, 70 5, 70 20 C70 10, 90 10, 90 20 C100 20, 100 40, 80 40 L20 40 C0 40, 0 20, 20 20 Z" />
        </svg>
      </div>
      <div className="absolute top-[25%] left-0 opacity-40 cloud blur-[1px]">
        <svg width="240" height="80" viewBox="0 0 120 40" fill={getCloudFill()} xmlns="http://www.w3.org/2000/svg">
          <path d="M20 20 C20 10, 40 10, 40 20 C40 5, 70 5, 70 20 C70 10, 90 10, 90 20 C100 20, 100 40, 80 40 L20 40 C0 40, 0 20, 20 20 Z" />
        </svg>
      </div>
      <div className="absolute top-[38%] left-0 opacity-50 cloud blur-[1px]">
        <svg width="140" height="50" viewBox="0 0 120 40" fill={getCloudFill()} xmlns="http://www.w3.org/2000/svg">
          <path d="M20 20 C20 10, 40 10, 40 20 C40 5, 70 5, 70 20 C70 10, 90 10, 90 20 C100 20, 100 40, 80 40 L20 40 C0 40, 0 20, 20 20 Z" />
        </svg>
      </div>

      {/* City Skyline Silhouette with gradients and glowing nodes */}
      <div className="absolute bottom-0 w-full h-[55%] flex items-end opacity-95">
        <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 1000 300" xmlns="http://www.w3.org/2000/svg">
          <defs>
            {/* Dark Theme Gradients */}
            <linearGradient id="bgGradDark" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#1e1b4b" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#020617" stopOpacity="0.95" />
            </linearGradient>
            <linearGradient id="midGradDark" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#2c113d" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#020617" stopOpacity="0.98" />
            </linearGradient>
            <linearGradient id="foreGradDark" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#0e172c" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#020617" stopOpacity="1" />
            </linearGradient>

            {/* Light Theme Gradients */}
            <linearGradient id="bgGradLight" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#cbd5e1" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#f8fafc" stopOpacity="0.9" />
            </linearGradient>
            <linearGradient id="midGradLight" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#94a3b8" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#f8fafc" stopOpacity="0.95" />
            </linearGradient>
            <linearGradient id="foreGradLight" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#64748b" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#f8fafc" stopOpacity="1" />
            </linearGradient>
          </defs>

          {/* Background Buildings Group */}
          <g fill={isDark ? 'url(#bgGradDark)' : 'url(#bgGradLight)'} stroke={isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)'} strokeWidth="1">
            <rect x="0" y="100" width="80" height="200" />
            <rect x="70" y="60" width="60" height="240" />
            <rect x="140" y="120" width="90" height="180" />
            <rect x="250" y="80" width="70" height="220" />
            <rect x="340" y="140" width="100" height="160" />
            <rect x="460" y="50" width="80" height="250" />
            <rect x="560" y="90" width="70" height="210" />
            <rect x="650" y="130" width="90" height="170" />
            <rect x="760" y="70" width="80" height="230" />
            <rect x="860" y="110" width="60" height="190" />
            <rect x="940" y="90" width="60" height="210" />
          </g>
          
          {/* Midground Buildings Group */}
          <g fill={isDark ? 'url(#midGradDark)' : 'url(#midGradLight)'} stroke={isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'} strokeWidth="1">
            <rect x="30" y="150" width="50" height="150" />
            <rect x="100" y="100" width="60" height="200" />
            <rect x="180" y="160" width="70" height="140" />
            <rect x="280" y="120" width="80" height="180" />
            <rect x="380" y="170" width="60" height="130" />
            <rect x="480" y="110" width="70" height="190" />
            <rect x="580" y="150" width="50" height="150" />
            <rect x="660" y="180" width="80" height="120" />
            <rect x="780" y="130" width="60" height="170" />
            <rect x="880" y="160" width="50" height="140" />
          </g>

          {/* Glowing Smart Rooftop Edges */}
          {isDark && (
            <g opacity="0.6">
              <line x1="70" y1="60" x2="130" y2="60" stroke="#f97316" strokeWidth="1.5" />
              <line x1="100" y1="100" x2="160" y2="100" stroke="#eab308" strokeWidth="1.5" />
              <line x1="460" y1="50" x2="540" y2="50" stroke="#f97316" strokeWidth="1.5" />
              <line x1="760" y1="70" x2="840" y2="70" stroke="#eab308" strokeWidth="1.5" />
            </g>
          )}

          {/* Foreground Buildings Group */}
          <g fill={isDark ? 'url(#foreGradDark)' : 'url(#foreGradLight)'} stroke={isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'} strokeWidth="1">
            <rect x="0" y="200" width="60" height="100" />
            <rect x="80" y="170" width="50" height="130" />
            <rect x="150" y="210" width="80" height="90" />
            <rect x="250" y="160" width="60" height="140" />
            <rect x="330" y="220" width="70" height="80" />
            <rect x="420" y="150" width="80" height="150" />
            <rect x="520" y="200" width="60" height="100" />
            <rect x="600" y="170" width="70" height="130" />
            <rect x="690" y="230" width="90" height="70" />
            <rect x="800" y="180" width="60" height="120" />
            <rect x="880" y="210" width="70" height="90" />
            <rect x="960" y="190" width="40" height="110" />
          </g>

          {/* Soft glowing windows for night/evening mode */}
          {isDark && (timeOfDay === 'night' || timeOfDay === 'evening') && (
            <g fill="#fef08a" opacity="0.45">
              {/* Scattered windows with different opacities */}
              <rect x="110" y="120" width="5" height="7" opacity="0.8" />
              <rect x="110" y="140" width="5" height="7" opacity="0.3" />
              <rect x="130" y="120" width="5" height="7" opacity="0.6" />
              <rect x="300" y="140" width="5" height="7" opacity="0.9" />
              <rect x="320" y="160" width="5" height="7" opacity="0.4" />
              <rect x="320" y="180" width="5" height="7" opacity="0.7" />
              <rect x="500" y="130" width="5" height="7" opacity="0.8" />
              <rect x="520" y="150" width="5" height="7" opacity="0.5" />
              <rect x="520" y="170" width="5" height="7" opacity="0.6" />
              <rect x="800" y="150" width="5" height="7" opacity="0.9" />
              
              <rect x="20" y="220" width="6" height="8" opacity="0.6" />
              <rect x="40" y="220" width="6" height="8" opacity="0.8" />
              <rect x="90" y="190" width="6" height="8" opacity="0.5" />
              <rect x="110" y="190" width="6" height="8" opacity="0.7" />
              <rect x="270" y="180" width="6" height="8" opacity="0.8" />
              <rect x="290" y="200" width="6" height="8" opacity="0.4" />
              <rect x="440" y="170" width="6" height="8" opacity="0.9" />
              <rect x="440" y="190" width="6" height="8" opacity="0.5" />
              <rect x="470" y="170" width="6" height="8" opacity="0.7" />
              <rect x="620" y="190" width="6" height="8" opacity="0.6" />
              <rect x="640" y="210" width="6" height="8" opacity="0.8" />
              <rect x="820" y="200" width="6" height="8" opacity="0.7" />
              <rect x="840" y="220" width="6" height="8" opacity="0.5" />
              <rect x="900" y="230" width="6" height="8" opacity="0.9" />
            </g>
          )}

          {/* Active Civic Monitoring Nodes (Thematic Smart City Indicator) */}
          <g>
            {/* Node 1: left skyscraper */}
            <circle cx="100" cy="60" r="3" fill="#f97316" />
            <circle cx="100" cy="60" r="9" stroke="#f97316" strokeWidth="1" fill="none" opacity="0.4" className="animate-ping" style={{ transformOrigin: '100px 60px', animationDuration: '3s' }} />
            
            {/* Node 2: tall center tower */}
            <circle cx="500" cy="50" r="3" fill="#eab308" />
            <circle cx="500" cy="50" r="11" stroke="#eab308" strokeWidth="1" fill="none" opacity="0.4" className="animate-ping" style={{ transformOrigin: '500px 50px', animationDuration: '4s' }} />

            {/* Node 3: right tower */}
            <circle cx="800" cy="70" r="3" fill="#f97316" />
            <circle cx="800" cy="70" r="9" stroke="#f97316" strokeWidth="1" fill="none" opacity="0.4" className="animate-ping" style={{ transformOrigin: '800px 70px', animationDuration: '3.5s' }} />
          </g>

          {/* Street Lights (only in dark mode at night/evening) */}
          {isDark && (timeOfDay === 'night' || timeOfDay === 'evening') && (
            <g>
              {[100, 200, 300, 400, 500, 600, 700, 800, 900].map(x => (
                <g key={`light-${x}`}>
                  {/* Pole */}
                  <rect x={x} y="275" width="1.5" height="25" fill="#1e293b" />
                  <rect x={x - 3} y="275" width="7" height="1.5" fill="#1e293b" />
                  {/* Light core */}
                  <circle cx={x - 3} cy="276" r="1.5" fill="#fef08a" />
                  <circle cx={x + 4} cy="276" r="1.5" fill="#fef08a" />
                  {/* Glow halo */}
                  <circle cx={x - 3} cy="276" r="5" fill="rgba(254, 240, 138, 0.3)" filter="blur(1px)" />
                  <circle cx={x + 4} cy="276" r="5" fill="rgba(254, 240, 138, 0.3)" filter="blur(1px)" />
                </g>
              ))}
            </g>
          )}
        </svg>
      </div>

      {/* Fog/Misty horizon overlay to blend perfectly into the active page background */}
      <div className={`absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t pointer-events-none z-10 transition-colors duration-1000 ${
        isDark ? 'from-[#020617] via-[#020617]/75 to-transparent' : 'from-[#f8fafc] via-[#f8fafc]/75 to-transparent'
      }`} />
    </div>
  );
}
