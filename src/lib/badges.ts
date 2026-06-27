export interface BadgeConfig {
  id: string;
  name: string;
  description: string;
  icon: string; // Emoji icon
  color: string; // Tailwind background gradient / border color classes
  textClass: string; // Typography color classes
}

export const BADGES: Record<string, BadgeConfig> = {
  "first-reporter": {
    id: "first-reporter",
    name: "First Reporter",
    description: "Submitted your first civic report! Let your active citizenship begin.",
    icon: "🎯",
    color: "from-sky-500/20 to-sky-500/5 bg-sky-950/20 border-sky-500/30",
    textClass: "text-sky-400",
  },
  "community-guardian": {
    id: "community-guardian",
    name: "Community Guardian",
    description: "Reported 5+ civic issues. You are watchfully safeguarding your ward.",
    icon: "🛡️",
    color: "from-emerald-500/20 to-emerald-500/5 bg-emerald-950/20 border-emerald-500/30",
    textClass: "text-emerald-400",
  },
  "pothole-hunter": {
    id: "pothole-hunter",
    name: "Pothole Hunter",
    description: "Reported 3+ active potholes. Road safety starts with your report!",
    icon: "🕳️",
    color: "from-amber-500/20 to-amber-500/5 bg-amber-950/20 border-amber-500/30",
    textClass: "text-amber-400",
  },
  "civic-hero": {
    id: "civic-hero",
    name: "Civic Hero",
    description: "Reported 10+ civic issues. An exemplary pillar of community collaboration!",
    icon: "🔥",
    color: "from-rose-500/20 to-rose-500/5 bg-rose-950/20 border-rose-500/30",
    textClass: "text-rose-400",
  },
};
