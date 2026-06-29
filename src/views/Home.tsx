import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { HeroCityscape } from "../components/hero-cityscape";
import { Zap, Brain, Award, Activity, Terminal, Sliders, ShieldAlert, Play, RefreshCw, CheckCircle, Server, AlertTriangle, Layers, Cpu, Radar, Map } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

function Counter({ targetValue, duration = 2000 }: { targetValue: number; duration?: number }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    let observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          let startTimestamp: number;
          const step = (timestamp: number) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
            setCount(Math.floor(ease * targetValue));
            if (progress < 1) {
              window.requestAnimationFrame(step);
            }
          };
          window.requestAnimationFrame(step);
          observer.disconnect();
        }
      },
      { threshold: 0.5 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [targetValue, duration]);

  return <span ref={ref}>{count.toLocaleString()}</span>;
}

interface HomeProps {
  onNavigate: (path: string) => void;
}

export function Home({ onNavigate }: HomeProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Holographic Command Deck states
  const [terminalLogs, setTerminalLogs] = useState<Array<{ time: string; system: string; message: string; type?: string }>>([
    { time: "09:00:15", system: "SYS", message: "NagarAI core initialized. Models loaded successfully." },
    { time: "09:02:40", system: "AI_INGEST", message: "Listening to civic streams across 21 Wards." },
    { time: "09:30:12", system: "ROUTING", message: "All local dispatch models calibrated to live traffic." },
  ]);
  const [simulating, setSimulating] = useState(false);
  const [pulsePoint, setPulsePoint] = useState<{ x: number; y: number; type: string } | null>(null);
  const [selectedSimType, setSelectedSimType] = useState<string>("pothole");
  const [metrics, setMetrics] = useState({
    dispatchAccuracy: 98.4,
    activeIncidents: 142,
    resolvedToday: 41,
    avgResponse: "84.6s"
  });

  const runSimulation = (type: string) => {
    if (simulating) return;
    setSimulating(true);
    setSelectedSimType(type);

    const randomX = Math.floor(Math.random() * 70) + 15; // 15% to 85%
    const randomY = Math.floor(Math.random() * 60) + 20; // 20% to 80%
    setPulsePoint({ x: randomX, y: randomY, type });

    const timeString = () => {
      const now = new Date();
      return now.toTimeString().split(" ")[0];
    };

    // Sequenced logging mimicry
    const newLogs = [
      { time: timeString(), system: "SIMULATE", message: `Civic Fault triggered: [${type.toUpperCase()}] at coordinate region (${randomX}, ${randomY}).`, type },
    ];
    setTerminalLogs(prev => [...prev, newLogs[0]]);

    setTimeout(() => {
      const logs2 = { 
        time: timeString(), 
        system: "AI_BRAIN", 
        message: `Analyzing visual stream: detected high severity. Certainty: ${(Math.random() * 4 + 95).toFixed(1)}%.`,
        type
      };
      setTerminalLogs(prev => [...prev, logs2]);
    }, 1000);

    setTimeout(() => {
      const logs3 = { 
        time: timeString(), 
        system: "DISPATCH", 
        message: `Smart Router matched incident with Ward contractor. Optimal path generated.`,
        type
      };
      setTerminalLogs(prev => [...prev, logs3]);
      
      // Update stats dynamically to make user feel impact
      setMetrics(prev => ({
        ...prev,
        activeIncidents: prev.activeIncidents + 1,
        resolvedToday: prev.resolvedToday + (Math.random() > 0.5 ? 1 : 0),
        dispatchAccuracy: parseFloat((prev.dispatchAccuracy + (Math.random() * 0.2 - 0.1)).toFixed(1))
      }));
      setSimulating(false);
    }, 2400);
  };

  useEffect(() => {
    // Parallax on hero
    gsap.fromTo(
      ".hero-content",
      { y: 0 },
      {
        y: -50,
        ease: "none",
        scrollTrigger: {
          trigger: ".hero-section",
          start: "top top",
          end: "bottom top",
          scrub: true,
        },
      }
    );

    // Initial load animation
    gsap.from(".hero-element", {
      y: 50,
      opacity: 0,
      duration: 1,
      stagger: 0.2,
      ease: "power3.out",
    });

    // Stats section slide in scrub
    gsap.fromTo(
      ".stat-card",
      { y: 100, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        stagger: 0.15,
        scrollTrigger: {
          trigger: ".stats-section",
          start: "top 80%",
          end: "top 40%",
          scrub: true,
        },
      }
    );

    // Heading clip path transition
    gsap.fromTo(
      ".features-heading",
      { clipPath: "inset(0 100% 0 0)" },
      {
        clipPath: "inset(0 0% 0 0)",
        scrollTrigger: {
          trigger: ".features-heading",
          start: "top 80%",
          end: "top 40%",
          scrub: 1,
        },
      }
    );

    // Feature cards slide in
    const cards = gsap.utils.toArray(".feature-card") as HTMLElement[];
    cards.forEach((card, index) => {
      const isLeft = index % 2 === 0;
      gsap.fromTo(
        card,
        { x: isLeft ? -100 : 100, opacity: 0 },
        {
          x: 0,
          opacity: 1,
          scrollTrigger: {
            trigger: ".features-section",
            start: "top 70%",
            end: "top 20%",
            scrub: 1,
          },
        }
      );
    });

    // CTA background glow
    gsap.to(".cta-section", {
      backgroundColor: "rgba(30, 27, 75, 0.4)",
      scrollTrigger: {
        trigger: ".cta-section",
        start: "top bottom",
        end: "center center",
        scrub: true,
      },
    });

    // CTA Button elastic bounce
    gsap.fromTo(
      ".cta-button",
      { scale: 0.5, opacity: 0 },
      {
        scale: 1,
        opacity: 1,
        duration: 1,
        ease: "elastic.out(1, 0.5)",
        scrollTrigger: {
          trigger: ".cta-button",
          start: "top 85%",
          toggleActions: "play none none reverse",
        },
      }
    );

    return () => {
      ScrollTrigger.getAll().forEach((t) => t.kill());
    };
  }, []);

  return (
    <div ref={containerRef} className="relative w-full overflow-x-hidden">
      <main className="bg-background">
        {/* High-Fidelity Interactive Civic Command Center (Hero Replacement) */}
        <section className="hero-section relative px-4 pt-24 pb-16 sm:px-6 lg:px-8 overflow-hidden border-b border-border/30">
          {/* Keep the beautiful cityscape ambient backdrop */}
          <HeroCityscape />

          <div className="relative z-10 mx-auto max-w-7xl w-full">
            {/* Header branding info */}
            <div className="mb-10 text-center lg:text-left flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 border-b border-border/10 pb-8">
              <div className="max-w-2xl">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-[11px] font-mono text-emerald-400 mb-4 animate-pulse">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  MUNICIPAL AI NETWORK: SECURE & ACTIVE
                </div>
                <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight bg-gradient-to-r from-orange-400 via-yellow-400 to-amber-500 bg-clip-text text-transparent leading-none drop-shadow-sm mb-4">
                  NagarAI Command Center
                </h1>
                <p className="text-sm sm:text-base text-muted-foreground max-w-xl">
                  Decentralized civic monitoring, automated complaint dispatch, and neural predictive analytics for modern municipal governance.
                </p>
              </div>
              
              {/* Telemetry quick overview */}
              <div className="flex flex-wrap gap-4 justify-center lg:justify-end font-mono text-xs">
                <div className="bg-card/45 border border-border/30 rounded-xl p-4 min-w-[130px] backdrop-blur-md shadow-sm">
                  <span className="text-muted-foreground block text-[10px] uppercase tracking-wider mb-1">SYSTEM HEAT</span>
                  <div className="flex items-center gap-1.5 text-orange-400 font-bold text-lg">
                    <Activity className="h-4 w-4 animate-pulse" />
                    NOMINAL
                  </div>
                </div>
                <div className="bg-card/45 border border-border/30 rounded-xl p-4 min-w-[130px] backdrop-blur-md shadow-sm">
                  <span className="text-muted-foreground block text-[10px] uppercase tracking-wider mb-1">WARD THREADS</span>
                  <div className="flex items-center gap-1.5 text-yellow-400 font-bold text-lg">
                    <Cpu className="h-4 w-4" />
                    21 ACTIVE
                  </div>
                </div>
              </div>
            </div>

            {/* Immersive Bento Grid Dashboard Panel */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              {/* Left Column: Simulation Launcher & Metrics Controller (lg:col-span-5) */}
              <div className="lg:col-span-5 flex flex-col gap-6">
                <Card className="border-border/40 bg-card/45 p-6 backdrop-blur-md shadow-xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl" />
                  
                  <div className="flex items-center gap-2 mb-4 pb-3 border-b border-border/20">
                    <Sliders className="h-4 w-4 text-primary" />
                    <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">Interactive Simulation Controller</h2>
                  </div>

                  <p className="text-xs text-muted-foreground mb-6">
                    Launch a simulated municipal fault report below to observe how the NagarAI routing intelligence instantly categorizes, maps, and initiates auto-dispatch work orders.
                  </p>

                  {/* Simulator buttons */}
                  <div className="grid grid-cols-2 gap-3 mb-6">
                    <button
                      onClick={() => runSimulation("pothole")}
                      disabled={simulating}
                      className={`flex flex-col items-start gap-1 p-3.5 rounded-xl border text-left transition-all duration-300 relative group cursor-pointer ${
                        selectedSimType === "pothole" && simulating
                          ? "bg-yellow-500/10 border-yellow-500/50 shadow-[0_0_15px_rgba(234,179,8,0.15)]"
                          : "bg-background/40 border-border/35 hover:bg-card hover:border-yellow-500/30"
                      }`}
                    >
                      <span className="h-2 w-2 rounded-full bg-yellow-500 absolute top-3 right-3 group-hover:animate-ping" />
                      <AlertTriangle className="h-4 w-4 text-yellow-500 mb-1" />
                      <span className="font-bold text-xs text-foreground">Pothole Alert</span>
                      <span className="text-[9px] text-muted-foreground">Road damage</span>
                    </button>

                    <button
                      onClick={() => runSimulation("flooding")}
                      disabled={simulating}
                      className={`flex flex-col items-start gap-1 p-3.5 rounded-xl border text-left transition-all duration-300 relative group cursor-pointer ${
                        selectedSimType === "flooding" && simulating
                          ? "bg-blue-500/10 border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.15)]"
                          : "bg-background/40 border-border/35 hover:bg-card hover:border-blue-500/30"
                      }`}
                    >
                      <span className="h-2 w-2 rounded-full bg-blue-500 absolute top-3 right-3 group-hover:animate-ping" />
                      <Activity className="h-4 w-4 text-blue-500 mb-1" />
                      <span className="font-bold text-xs text-foreground">Waterlog Warning</span>
                      <span className="text-[9px] text-muted-foreground">Monsoon flooding</span>
                    </button>

                    <button
                      onClick={() => runSimulation("streetlight")}
                      disabled={simulating}
                      className={`flex flex-col items-start gap-1 p-3.5 rounded-xl border text-left transition-all duration-300 relative group cursor-pointer ${
                        selectedSimType === "streetlight" && simulating
                          ? "bg-orange-500/10 border-orange-500/50 shadow-[0_0_15px_rgba(249,115,22,0.15)]"
                          : "bg-background/40 border-border/35 hover:bg-card hover:border-orange-500/30"
                      }`}
                    >
                      <span className="h-2 w-2 rounded-full bg-orange-500 absolute top-3 right-3 group-hover:animate-ping" />
                      <Zap className="h-4 w-4 text-orange-500 mb-1" />
                      <span className="font-bold text-xs text-foreground">Power Fault</span>
                      <span className="text-[9px] text-muted-foreground">Broken streetlight</span>
                    </button>

                    <button
                      onClick={() => runSimulation("garbage")}
                      disabled={simulating}
                      className={`flex flex-col items-start gap-1 p-3.5 rounded-xl border text-left transition-all duration-300 relative group cursor-pointer ${
                        selectedSimType === "garbage" && simulating
                          ? "bg-emerald-500/10 border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.15)]"
                          : "bg-background/40 border-border/35 hover:bg-card hover:border-emerald-500/30"
                      }`}
                    >
                      <span className="h-2 w-2 rounded-full bg-emerald-500 absolute top-3 right-3 group-hover:animate-ping" />
                      <Award className="h-4 w-4 text-emerald-500 mb-1" />
                      <span className="font-bold text-xs text-foreground">Sanitation Dump</span>
                      <span className="text-[9px] text-muted-foreground">Garbage pile</span>
                    </button>
                  </div>

                  {/* Active Simulation progress indicators */}
                  {simulating && (
                    <div className="mb-6 p-3 rounded-lg bg-background/50 border border-border/20 text-xs font-mono space-y-2 animate-fade-in">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-primary flex items-center gap-1.5">
                          <RefreshCw className="h-3 w-3 animate-spin" />
                          ROUTING ENGINES ACTIVE...
                        </span>
                        <span className="text-muted-foreground">STABLE</span>
                      </div>
                      <div className="h-1.5 w-full bg-border/40 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-orange-500 to-yellow-400 rounded-full animate-[shimmer_1.5s_infinite]" style={{ width: "70%" }} />
                      </div>
                    </div>
                  )}

                  {/* Live Simulation Real-time Metrics Grid */}
                  <div className="grid grid-cols-2 gap-4 border-t border-border/20 pt-5">
                    <div>
                      <span className="text-[9px] font-mono text-muted-foreground block uppercase tracking-wider mb-1">AI Classification Acc.</span>
                      <span className="text-lg font-extrabold text-foreground tracking-tight">{metrics.dispatchAccuracy}%</span>
                    </div>
                    <div>
                      <span className="text-[9px] font-mono text-muted-foreground block uppercase tracking-wider mb-1">Active Smart Dispatches</span>
                      <span className="text-lg font-extrabold text-foreground tracking-tight">{metrics.activeIncidents}</span>
                    </div>
                    <div>
                      <span className="text-[9px] font-mono text-muted-foreground block uppercase tracking-wider mb-1">Resolved Today (SIM)</span>
                      <span className="text-lg font-extrabold text-emerald-400 tracking-tight">+{metrics.resolvedToday}</span>
                    </div>
                    <div>
                      <span className="text-[9px] font-mono text-muted-foreground block uppercase tracking-wider mb-1">Average Dispatch Speed</span>
                      <span className="text-lg font-extrabold text-yellow-400 tracking-tight">{metrics.avgResponse}</span>
                    </div>
                  </div>
                </Card>

                {/* Real-world direct launchpad buttons */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button
                    size="lg"
                    onClick={() => onNavigate("/report")}
                    className="w-full hover:scale-105 transition-transform text-sm cursor-pointer font-bold shadow-lg shadow-primary/10 flex items-center justify-center gap-2"
                  >
                    <Layers className="h-4 w-4" />
                    Report Real Incident
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={() => onNavigate("/dashboard")}
                    className="w-full hover:scale-105 transition-transform text-sm cursor-pointer bg-background/25 backdrop-blur-md border-border/60 hover:bg-muted/40 flex items-center justify-center gap-2"
                  >
                    <Map className="h-4 w-4" />
                    Open Live Dashboard
                  </Button>
                </div>
              </div>

              {/* Right Column: Tactical Vector Grid & Dynamic Terminal (lg:col-span-7) */}
              <div className="lg:col-span-7 flex flex-col gap-6">
                
                {/* Visual City Grid representation panel */}
                <Card className="border-border/40 bg-card/35 backdrop-blur-md shadow-xl flex-1 flex flex-col overflow-hidden">
                  <div className="p-4 border-b border-border/10 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <Radar className="h-4 w-4 text-orange-400 animate-pulse" />
                      <span className="font-mono font-bold text-foreground">Tactical Grid Overlay & Telemetry Feed</span>
                    </div>
                    <span className="font-mono text-muted-foreground text-[10px]">SCALE: WARD-WIDE</span>
                  </div>

                  {/* Smart map graphic representation */}
                  <div className="relative flex-1 min-h-[220px] bg-slate-950/70 overflow-hidden border-b border-border/10 flex items-center justify-center p-4">
                    {/* Concentric rings background */}
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:24px_24px] opacity-15" />
                    <div className="absolute h-[300px] w-[300px] border border-border/10 rounded-full flex items-center justify-center">
                      <div className="h-[200px] w-[200px] border border-border/10 rounded-full flex items-center justify-center">
                        <div className="h-[100px] w-[100px] border border-border/10 rounded-full" />
                      </div>
                    </div>

                    {/* Vector map roads / grid line intersections */}
                    <svg className="absolute inset-0 w-full h-full opacity-20 pointer-events-none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M 0,100 L 1000,100" stroke="#f97316" strokeWidth="1" strokeDasharray="3,3" />
                      <path d="M 0,200 L 1000,200" stroke="#f97316" strokeWidth="1" strokeDasharray="3,3" />
                      <path d="M 200,0 L 200,1000" stroke="#eab308" strokeWidth="1" strokeDasharray="3,3" />
                      <path d="M 500,0 L 500,1000" stroke="#f97316" strokeWidth="1" strokeDasharray="3,3" />
                      
                      {/* Curved pathway representing highway layout */}
                      <path d="M 50,0 Q 250,150 800,280" fill="none" stroke="#64748b" strokeWidth="2.5" />
                      <path d="M 0,250 Q 400,120 1000,100" fill="none" stroke="#64748b" strokeWidth="1.5" />
                    </svg>

                    {/* Default fixed active node indicators to feel like real telemetry map */}
                    <div className="absolute top-[28%] left-[22%] group">
                      <div className="h-3 w-3 rounded-full bg-emerald-500/80 animate-pulse flex items-center justify-center">
                        <span className="h-1.5 w-1.5 bg-white rounded-full" />
                      </div>
                      <div className="absolute left-4 -top-2 bg-slate-900 border border-emerald-500/30 rounded-md py-0.5 px-2 text-[8px] font-mono whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                        ID: 410 // FIXED
                      </div>
                    </div>

                    <div className="absolute top-[68%] left-[78%] group">
                      <div className="h-3 w-3 rounded-full bg-yellow-500/80 animate-pulse flex items-center justify-center">
                        <span className="h-1.5 w-1.5 bg-white rounded-full" />
                      </div>
                      <div className="absolute left-4 -top-2 bg-slate-900 border border-yellow-500/30 rounded-md py-0.5 px-2 text-[8px] font-mono whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                        ID: 809 // PENDING
                      </div>
                    </div>

                    {/* Simulated Pulse Point triggered dynamically when user simulation is active */}
                    {pulsePoint && (
                      <div 
                        className="absolute -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none transition-all duration-700 ease-out"
                        style={{ left: `${pulsePoint.x}%`, top: `${pulsePoint.y}%` }}
                      >
                        {/* Multiple concentric pulsing ring layers */}
                        <div className={`absolute -inset-8 rounded-full border opacity-50 animate-ping duration-1000 ${
                          pulsePoint.type === 'pothole' ? 'border-yellow-500' :
                          pulsePoint.type === 'flooding' ? 'border-blue-500' :
                          pulsePoint.type === 'streetlight' ? 'border-orange-500' :
                          'border-emerald-500'
                        }`} />
                        <div className={`absolute -inset-4 rounded-full border opacity-70 animate-ping duration-1000 delay-150 ${
                          pulsePoint.type === 'pothole' ? 'border-yellow-500' :
                          pulsePoint.type === 'flooding' ? 'border-blue-500' :
                          pulsePoint.type === 'streetlight' ? 'border-orange-500' :
                          'border-emerald-500'
                        }`} />
                        
                        {/* Glowing core block */}
                        <div className={`h-4 w-4 rounded-full border shadow-2xl flex items-center justify-center animate-bounce ${
                          pulsePoint.type === 'pothole' ? 'bg-yellow-500 border-yellow-300 shadow-yellow-500/40' :
                          pulsePoint.type === 'flooding' ? 'bg-blue-500 border-blue-300 shadow-blue-500/40' :
                          pulsePoint.type === 'streetlight' ? 'bg-orange-500 border-orange-300 shadow-orange-500/40' :
                          'bg-emerald-500 border-emerald-300 shadow-emerald-500/40'
                        }`}>
                          <span className="h-1.5 w-1.5 bg-white rounded-full" />
                        </div>
                      </div>
                    )}

                    <div className="absolute bottom-3 left-4 text-[9px] font-mono text-muted-foreground bg-slate-900/80 border border-border/20 py-1 px-2.5 rounded-lg">
                      COORDS: {pulsePoint ? `X:${pulsePoint.x}, Y:${pulsePoint.y}` : "SYS NOMINAL_"}
                    </div>
                  </div>

                  {/* Terminal Logs console container */}
                  <div className="bg-slate-950 flex flex-col h-[160px] overflow-hidden p-4 relative font-mono text-[11px] leading-relaxed select-text">
                    <div className="absolute top-0 right-0 p-2 opacity-15 pointer-events-none">
                      <Terminal className="h-10 w-10 text-white" />
                    </div>
                    
                    {/* Live Scrolling output logs */}
                    <div className="flex-1 overflow-y-auto space-y-1.5 pr-2 flex flex-col scrollbar-thin scrollbar-thumb-border">
                      {terminalLogs.slice(-5).map((log, index) => (
                        <div key={index} className="flex gap-2.5 items-start">
                          <span className="text-muted-foreground/60 shrink-0 select-none">[{log.time}]</span>
                          <span className={`font-bold shrink-0 select-none ${
                            log.system === 'SIMULATE' ? 'text-yellow-400' :
                            log.system === 'AI_BRAIN' ? 'text-primary' :
                            log.system === 'DISPATCH' ? 'text-emerald-400' :
                            'text-slate-400'
                          }`}>
                            {log.system}:
                          </span>
                          <span className="text-slate-300">{log.message}</span>
                        </div>
                      ))}
                    </div>

                    <div className="border-t border-border/10 pt-2.5 mt-2 flex items-center justify-between text-muted-foreground text-[10px]">
                      <div className="flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                        CONSOLE FEED // ONLINE
                      </div>
                      <span>ACTIVE SEED SOURCE</span>
                    </div>
                  </div>
                </Card>
              </div>

            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="stats-section border-t border-border/40 px-4 py-16 sm:px-6 lg:px-8 relative z-10">
          <div className="mx-auto max-w-7xl">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <div className="stat-card rounded-xl border border-border/50 bg-card p-8 sm:p-10 text-center hover:bg-card/90 transition-all duration-300 shadow-[0_0_25px_rgba(139,92,246,0.15)] hover:shadow-[0_0_40px_rgba(139,92,246,0.35)] backdrop-blur-md">
                <div className="stat-number mb-3 text-5xl font-extrabold text-primary drop-shadow-md">
                  <Counter targetValue={2847} />
                </div>
                <div className="text-lg font-medium text-muted-foreground">Issues Reported</div>
              </div>
              
              <div className="stat-card rounded-xl border border-border/50 bg-card p-8 sm:p-10 text-center hover:bg-card/90 transition-all duration-300 shadow-[0_0_25px_rgba(34,197,94,0.15)] hover:shadow-[0_0_40px_rgba(34,197,94,0.35)] backdrop-blur-md">
                <div className="stat-number mb-3 text-5xl font-extrabold text-green-500 drop-shadow-md">
                  <Counter targetValue={1923} />
                </div>
                <div className="text-lg font-medium text-muted-foreground">Resolved</div>
              </div>

              <div className="stat-card rounded-xl border border-border/50 bg-card p-8 sm:p-10 text-center hover:bg-card/90 transition-all duration-300 shadow-[0_0_25px_rgba(234,179,8,0.15)] hover:shadow-[0_0_40px_rgba(234,179,8,0.35)] backdrop-blur-md">
                <div className="stat-number mb-3 text-5xl font-extrabold text-yellow-500 drop-shadow-md">
                  <Counter targetValue={654} />
                </div>
                <div className="text-lg font-medium text-muted-foreground">In Progress</div>
              </div>

              <div className="stat-card rounded-xl border border-border/50 bg-card p-8 sm:p-10 text-center hover:bg-card/90 transition-all duration-300 shadow-[0_0_25px_rgba(239,68,68,0.15)] hover:shadow-[0_0_40px_rgba(239,68,68,0.35)] backdrop-blur-md">
                <div className="stat-number mb-3 text-5xl font-extrabold text-red-500 drop-shadow-md">
                  <Counter targetValue={270} />
                </div>
                <div className="text-lg font-medium text-muted-foreground">Critical</div>
              </div>
            </div>
          </div>
        </section>

        {/* Why Choose NagarAI Section */}
        <section className="features-section border-t border-border/40 px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <h2 className="features-heading mb-12 text-center text-4xl font-bold text-foreground">
              Why Choose NagarAI?
            </h2>
            <div className="grid gap-8 md:grid-cols-3">
              <div className="feature-card h-full">
                <Card className="h-full border-border/40 bg-card/50 p-8 hover:bg-card/85 transition-all duration-300 backdrop-blur-md shadow-[0_0_20px_rgba(139,92,246,0.1)] hover:shadow-[0_0_35px_rgba(139,92,246,0.25)] hover:-translate-y-2">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <Zap className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="mb-3 text-xl font-semibold text-foreground">
                    Smart Reporting
                  </h3>
                  <p className="text-muted-foreground">
                    Drag-and-drop image uploads with instant AI classification of civic issues like potholes, waterlogging, broken streetlights, and garbage.
                  </p>
                </Card>
              </div>

              <div className="feature-card h-full">
                <Card className="h-full border-border/40 bg-card/50 p-8 hover:bg-card/85 transition-all duration-300 backdrop-blur-md shadow-[0_0_20px_rgba(139,92,246,0.1)] hover:shadow-[0_0_35px_rgba(139,92,246,0.25)] hover:-translate-y-2">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <Brain className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="mb-3 text-xl font-semibold text-foreground">
                    Predictive AI
                  </h3>
                  <p className="text-muted-foreground">
                    Advanced machine learning algorithms predict issue severity and identify high-risk zones across the city with heatmap visualization.
                  </p>
                </Card>
              </div>

              <div className="feature-card h-full">
                <Card className="h-full border-border/40 bg-card/50 p-8 hover:bg-card/85 transition-all duration-300 backdrop-blur-md shadow-[0_0_20px_rgba(139,92,246,0.1)] hover:shadow-[0_0_35px_rgba(139,92,246,0.25)] hover:-translate-y-2">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <Award className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="mb-3 text-xl font-semibold text-foreground">
                    Auto Accountability
                  </h3>
                  <p className="text-muted-foreground">
                    Track resolution rates by ward, compare performance metrics, and generate official complaint letters with automatic government tracking.
                  </p>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="cta-section border-t border-border/40 bg-card/30 px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="mb-4 text-3xl font-bold text-foreground">
              Ready to Make a Difference?
            </h2>
            <p className="mb-8 text-lg text-muted-foreground">
              Start reporting issues and help your city become cleaner, safer, and more efficient.
            </p>
            <div className="cta-button">
              <Button size="lg" onClick={() => onNavigate("/report")} className="hover:scale-105 transition-transform cursor-pointer">
                Report Your First Issue
              </Button>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-border/40 px-4 py-8 sm:px-6 lg:px-8 relative z-10">
          <div className="mx-auto max-w-7xl text-center text-sm text-muted-foreground">
            <p>NagarAI © 2026. Making cities smarter, one report at a time.</p>
          </div>
        </footer>
      </main>
    </div>
  );
}
