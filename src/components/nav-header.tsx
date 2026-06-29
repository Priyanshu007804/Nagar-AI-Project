import { Menu, X, Landmark } from 'lucide-react';
import { ThemeToggle } from './theme-toggle';
import { useState, useEffect } from 'react';

interface NavHeaderProps {
  currentPath: string;
  onNavigate: (path: string) => void;
}

export function NavHeader({ currentPath, onNavigate }: NavHeaderProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isActive = (path: string) => {
    if (path === '/' && currentPath === '/') return true;
    if (path !== '/' && currentPath.startsWith(path)) return true;
    return false;
  };

  const isNavVisible = isScrolled || mobileMenuOpen || currentPath !== '/';

  const navItems = [
    { path: '/', label: 'Home' },
    { path: '/report', label: 'Report Issue' },
    { path: '/dashboard', label: 'Dashboard' },
    { path: '/complaint-letter', label: 'Complaint Letter' },
    { path: '/profile', label: 'Citizen Profile' }
  ];

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isNavVisible 
          ? 'border-b border-border/40 bg-background/85 backdrop-blur-md shadow-sm py-3' 
          : 'bg-transparent border-transparent py-5'
      }`}
    >
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <button 
          onClick={() => onNavigate('/')} 
          className="flex items-center gap-2.5 z-50 bg-transparent border-0 cursor-pointer p-0 text-left outline-none"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-lg shadow-primary/30">
            <Landmark className="h-5.5 w-5.5" />
          </div>
          <span className="font-bold text-xl text-foreground tracking-tight">
            NagarAI
          </span>
        </button>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-1 lg:gap-2">
          {navItems.map((item) => (
            <button
              key={item.path}
              onClick={() => onNavigate(item.path)}
              className={`rounded-lg px-3.5 py-2 text-sm font-medium transition-colors border-0 cursor-pointer bg-transparent outline-none ${
                isActive(item.path)
                  ? 'bg-primary/10 text-primary font-semibold'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
            >
              {item.label}
            </button>
          ))}
          <div className="ml-2 pl-2 border-l border-border/40">
            <ThemeToggle />
          </div>
        </div>
        
        {/* Mobile Toggle Button */}
        <div className="md:hidden flex items-center">
          <ThemeToggle />
          <button 
            className="ml-2 p-2 text-foreground border-0 bg-transparent cursor-pointer outline-none"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-background/95 backdrop-blur-lg border-b border-border/40 p-4 flex flex-col gap-2 shadow-xl animate-in slide-in-from-top-2">
          {navItems.map((item) => (
            <button
              key={item.path}
              onClick={() => {
                onNavigate(item.path);
                setMobileMenuOpen(false);
              }}
              className={`rounded-lg px-4 py-3 text-base font-medium transition-colors border-0 text-left cursor-pointer bg-transparent outline-none ${
                isActive(item.path)
                  ? 'bg-primary/10 text-primary font-semibold'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </header>
  );
}
