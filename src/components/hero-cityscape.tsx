import { useEffect, useState, useRef } from 'react';
import gsap from 'gsap';

type TimeOfDay = 'morning' | 'noon' | 'evening' | 'night';

export function HeroCityscape() {
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>('noon');
  const [mounted, setMounted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

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
        y: -15,
        duration: 3,
        ease: 'sine.inOut',
        yoyo: true,
        repeat: -1
      });
      
      // Twinkling stars if night
      if (timeOfDay === 'night') {
        gsap.to('.star', {
          opacity: 0.1,
          duration: 'random(1, 3)' as any,
          ease: 'sine.inOut',
          yoyo: true,
          repeat: -1,
          stagger: 0.1
        });
      }
    }, containerRef);
    return () => ctx.revert();
  }, [mounted, timeOfDay]);

  if (!mounted) return <div className="absolute inset-0 z-0 bg-background" />;

  const getSkyGradient = () => {
    switch (timeOfDay) {
      case 'morning': return 'bg-gradient-to-b from-blue-300 via-orange-200 to-orange-400';
      case 'noon': return 'bg-gradient-to-b from-blue-500 via-blue-300 to-cyan-100';
      case 'evening': return 'bg-gradient-to-b from-indigo-800 via-purple-600 to-orange-500';
      case 'night': return 'bg-gradient-to-b from-slate-900 via-indigo-950 to-indigo-900';
    }
  };

  // Generate stars
  const renderStars = () => {
    return Array.from({ length: 60 }).map((_, i) => (
      <div 
        key={i}
        className="star absolute rounded-full bg-white"
        style={{
          width: Math.random() * 3 + 1 + 'px',
          height: Math.random() * 3 + 1 + 'px',
          top: Math.random() * 60 + '%',
          left: Math.random() * 100 + '%',
          opacity: Math.random() * 0.8 + 0.2
        }}
      />
    ));
  };

  return (
    <div ref={containerRef} className={`absolute inset-0 z-0 overflow-hidden ${getSkyGradient()} transition-colors duration-1000`}>
      {/* Sky elements */}
      {timeOfDay === 'night' && renderStars()}
      
      {/* Sun/Moon */}
      <div className={`celestial-body absolute rounded-full ${timeOfDay === 'night' ? 'bg-slate-200 w-24 h-24 shadow-[0_0_40px_rgba(255,255,255,0.4)]' : 'bg-yellow-300 w-32 h-32 shadow-[0_0_60px_rgba(253,224,71,0.6)]'}`}
           style={{
             top: timeOfDay === 'noon' ? '15%' : timeOfDay === 'night' ? '15%' : '35%',
             left: timeOfDay === 'morning' ? '20%' : timeOfDay === 'evening' ? '70%' : '50%',
             transform: 'translateX(-50%)',
             transition: 'top 1s ease-in-out, left 1s ease-in-out'
           }}
      >
        {/* Moon Craters */}
        {timeOfDay === 'night' && (
          <>
            <div className="absolute top-4 left-6 w-4 h-4 rounded-full bg-slate-300/60" />
            <div className="absolute top-10 right-4 w-6 h-6 rounded-full bg-slate-300/60" />
            <div className="absolute bottom-6 left-8 w-5 h-5 rounded-full bg-slate-300/60" />
          </>
        )}
      </div>

      {/* Clouds */}
      <div className="absolute top-[15%] left-0 opacity-70 cloud">
        <svg width="180" height="60" viewBox="0 0 120 40" fill={timeOfDay === 'night' ? '#334155' : 'white'} xmlns="http://www.w3.org/2000/svg">
          <path d="M20 20 C20 10, 40 10, 40 20 C40 5, 70 5, 70 20 C70 10, 90 10, 90 20 C100 20, 100 40, 80 40 L20 40 C0 40, 0 20, 20 20 Z" />
        </svg>
      </div>
      <div className="absolute top-[30%] left-0 opacity-50 cloud" style={{ animationDelay: '5s' }}>
        <svg width="240" height="80" viewBox="0 0 120 40" fill={timeOfDay === 'night' ? '#1e293b' : 'white'} xmlns="http://www.w3.org/2000/svg">
          <path d="M20 20 C20 10, 40 10, 40 20 C40 5, 70 5, 70 20 C70 10, 90 10, 90 20 C100 20, 100 40, 80 40 L20 40 C0 40, 0 20, 20 20 Z" />
        </svg>
      </div>
      <div className="absolute top-[45%] left-0 opacity-60 cloud" style={{ animationDelay: '10s' }}>
        <svg width="140" height="50" viewBox="0 0 120 40" fill={timeOfDay === 'night' ? '#475569' : 'white'} xmlns="http://www.w3.org/2000/svg">
          <path d="M20 20 C20 10, 40 10, 40 20 C40 5, 70 5, 70 20 C70 10, 90 10, 90 20 C100 20, 100 40, 80 40 L20 40 C0 40, 0 20, 20 20 Z" />
        </svg>
      </div>

      {/* City Skyline Silhouette */}
      <div className="absolute bottom-0 w-full h-[60%] flex items-end opacity-95">
        <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 1000 300" xmlns="http://www.w3.org/2000/svg">
          {/* Background Buildings */}
          <g fill={timeOfDay === 'night' ? '#0f172a' : '#1e293b'} opacity="0.7">
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
          
          {/* Midground Buildings */}
          <g fill={timeOfDay === 'night' ? '#020617' : '#0f172a'} opacity="0.9">
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

          {/* Foreground Buildings */}
          <g fill={timeOfDay === 'night' ? '#000000' : '#020617'}>
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

          {/* Lit windows for night mode */}
          {timeOfDay === 'night' && (
            <g fill="#fef08a" opacity="0.6">
              {/* Some scattered windows in midground */}
              <rect x="110" y="120" width="6" height="8" />
              <rect x="110" y="140" width="6" height="8" />
              <rect x="130" y="120" width="6" height="8" />
              <rect x="300" y="140" width="6" height="8" />
              <rect x="320" y="160" width="6" height="8" />
              <rect x="320" y="180" width="6" height="8" />
              <rect x="500" y="130" width="6" height="8" />
              <rect x="520" y="150" width="6" height="8" />
              <rect x="520" y="170" width="6" height="8" />
              <rect x="800" y="150" width="6" height="8" />
              
              {/* Foreground windows */}
              <rect x="20" y="220" width="8" height="10" />
              <rect x="40" y="220" width="8" height="10" />
              <rect x="90" y="190" width="8" height="10" />
              <rect x="110" y="190" width="8" height="10" />
              <rect x="270" y="180" width="8" height="10" />
              <rect x="290" y="200" width="8" height="10" />
              <rect x="440" y="170" width="8" height="10" />
              <rect x="440" y="190" width="8" height="10" />
              <rect x="470" y="170" width="8" height="10" />
              <rect x="620" y="190" width="8" height="10" />
              <rect x="640" y="210" width="8" height="10" />
              <rect x="820" y="200" width="8" height="10" />
              <rect x="840" y="220" width="8" height="10" />
              <rect x="900" y="230" width="8" height="10" />
            </g>
          )}

          {/* Street Lights (only at night) */}
          {timeOfDay === 'night' && (
            <g>
              {[50, 150, 250, 350, 450, 550, 650, 750, 850, 950].map(x => (
                <g key={`light-${x}`}>
                  {/* Pole */}
                  <rect x={x} y="270" width="2" height="30" fill="#222" />
                  <rect x={x - 4} y="270" width="10" height="2" fill="#222" />
                  {/* Light */}
                  <circle cx={x - 4} cy="271" r="2" fill="#fef08a" />
                  <circle cx={x + 6} cy="271" r="2" fill="#fef08a" />
                  {/* Glow */}
                  <circle cx={x - 4} cy="271" r="6" fill="rgba(254, 240, 138, 0.4)" filter="blur(2px)" />
                  <circle cx={x + 6} cy="271" r="6" fill="rgba(254, 240, 138, 0.4)" filter="blur(2px)" />
                </g>
              ))}
            </g>
          )}
        </svg>
      </div>
    </div>
  );
}
