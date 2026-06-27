import { useEffect, useRef } from 'react';
import gsap from 'gsap';

export function HeroParticles() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const particles: HTMLDivElement[] = [];
    
    // Create particles
    const particleCount = 40;
    
    for (let i = 0; i < particleCount; i++) {
      const particle = document.createElement('div');
      
      // Randomize color between orange and yellow to match theme
      const isOrange = Math.random() > 0.5;
      particle.className = `absolute rounded-full pointer-events-none ${isOrange ? 'bg-orange-500/20' : 'bg-yellow-500/20'}`;
      
      const size = gsap.utils.random(4, 12);
      
      gsap.set(particle, {
        width: size,
        height: size,
        x: gsap.utils.random(0, window.innerWidth),
        y: gsap.utils.random(0, window.innerHeight),
        scale: gsap.utils.random(0.5, 1.5)
      });
      
      container.appendChild(particle);
      particles.push(particle);
      
      // Infinite float animation
      gsap.to(particle, {
        y: `+=${gsap.utils.random(-150, 150)}`,
        x: `+=${gsap.utils.random(-150, 150)}`,
        duration: gsap.utils.random(10, 20),
        ease: 'sine.inOut',
        repeat: -1,
        yoyo: true
      });
    }

    // Interactivity: Move particles away from mouse slightly
    const onMouseMove = (e: MouseEvent) => {
      const mouseX = e.clientX;
      const mouseY = e.clientY + window.scrollY; // adjust for scroll
      
      particles.forEach((p) => {
        const x = gsap.getProperty(p, "x") as number;
        const y = gsap.getProperty(p, "y") as number;
        
        const dx = mouseX - x;
        const dy = mouseY - y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        // If mouse is within 200px of particle, repel it
        if (dist < 200) {
          const force = (200 - dist) / 200;
          gsap.to(p, {
            x: x - (dx * force * 0.5),
            y: y - (dy * force * 0.5),
            duration: 0.5,
            ease: 'power2.out',
            overwrite: 'auto'
          });
        }
      });
    };
    
    window.addEventListener('mousemove', onMouseMove);
    
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      particles.forEach(p => p.remove()); // Cleanup DOM
    };
  }, []);

  return (
    <div 
      ref={containerRef} 
      className="absolute inset-0 z-0 overflow-hidden pointer-events-none" 
    />
  );
}
