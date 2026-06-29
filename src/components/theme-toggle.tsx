import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "./theme-provider";
import { Button } from "./ui/button";

export function ThemeToggle() {
  const { setTheme, theme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      className="relative rounded-full w-9 h-9 border border-border/40 bg-background/50 backdrop-blur-sm flex items-center justify-center"
    >
      {theme === "light" ? (
        <Sun className="h-[1.2rem] w-[1.2rem] text-foreground transition-all duration-300 scale-100 rotate-0" />
      ) : (
        <Moon className="h-[1.2rem] w-[1.2rem] text-foreground transition-all duration-300 scale-100 rotate-0" />
      )}
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
