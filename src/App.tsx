import { useState, useEffect } from "react";
import { ThemeProvider } from "./components/theme-provider";
import { NavHeader } from "./components/nav-header";
import { HeroParticles } from "./components/hero-particles";
import { Home } from "./views/Home";
import { ReportPage } from "./views/Report";
import { DashboardPage } from "./views/Dashboard";
import { ComplaintLetterPage } from "./views/ComplaintLetter";

export default function App() {
  // Use a clean SPA routing mechanism with browser history support
  const [currentPath, setCurrentPath] = useState(() => {
    return window.location.pathname || "/";
  });

  const handleNavigate = (path: string) => {
    window.history.pushState({}, "", path);
    setCurrentPath(path);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Intercept browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname || "/");
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const renderView = () => {
    switch (currentPath) {
      case "/":
        return <Home onNavigate={handleNavigate} />;
      case "/report":
        return <ReportPage onNavigate={handleNavigate} />;
      case "/dashboard":
        return <DashboardPage />;
      case "/complaint-letter":
        return <ComplaintLetterPage />;
      default:
        return <Home onNavigate={handleNavigate} />;
    }
  };

  return (
    <ThemeProvider defaultTheme="dark" storageKey="nagar-ai-theme">
      <div className="relative min-h-screen bg-background text-foreground transition-colors duration-300">
        {/* Navigation Header */}
        <NavHeader currentPath={currentPath} onNavigate={handleNavigate} />

        {/* Ambient background particle flow */}
        <HeroParticles />

        {/* Active View Container */}
        <div className="relative z-10 w-full">
          {renderView()}
        </div>
      </div>
    </ThemeProvider>
  );
}
