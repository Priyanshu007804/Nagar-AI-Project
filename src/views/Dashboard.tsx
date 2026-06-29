import React, { useEffect, useState, useRef } from "react";
import { motion } from "motion/react";
import gsap from "gsap";
import { Card } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { TrendingUp, AlertCircle, CheckCircle2, Clock, Loader2, Zap, MapPin, Award, Flame, Star } from "lucide-react";
import { wardLeaderboard } from "../lib/data";
import { subscribeToReports, subscribeToUserProfile, subscribeToLeaderboard, UserProfile, verifyReport, getCurrentUserId } from "../lib/firebase";
import { BADGES } from "../lib/badges";
import confetti from "canvas-confetti";
import { predictCivicRisks } from "../lib/gemini";
import { APIProvider, Map, AdvancedMarker, Pin, InfoWindow, useAdvancedMarkerRef } from "@vis.gl/react-google-maps";

const API_KEY =
  process.env.GOOGLE_MAPS_PLATFORM_KEY ||
  (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
  process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY ||
  (import.meta as any).env?.VITE_GOOGLE_MAPS_KEY ||
  '';
const hasValidKey = Boolean(API_KEY) && API_KEY !== 'YOUR_API_KEY';

type Report = {
  id: string;
  issueType: string;
  location: string;
  severity: string;
  status?: string;
  date?: string;
  description?: string;
  aiDescription?: string;
  imageUrl?: string;
  confidence?: number;
  lat?: number;
  lng?: number;
  createdAt?: any;
};

type Stats = {
  totalReports: number;
  resolved: number;
  pending: number;
  critical: number;
};

type Zone = {
  id: string;
  risk: "low" | "medium" | "high";
};

// Seeding mock reports with realistic coordinates around Mumbai
const mockCoords = [
  { lat: 19.0760, lng: 72.8777 }, // Main Street (near center)
  { lat: 19.0820, lng: 72.8820 }, // Park Avenue
  { lat: 19.0680, lng: 72.8700 }, // Oak Road
  { lat: 19.0710, lng: 72.8910 }, // Market Square
  { lat: 19.0900, lng: 72.8650 }, // Beach Road
];

interface DashboardMapMarkerProps {
  key?: any;
  report: Report;
}

function DashboardMapMarker({ report }: DashboardMapMarkerProps) {
  const [markerRef, marker] = useAdvancedMarkerRef();
  const [isOpen, setIsOpen] = useState(false);

  if (typeof report.lat !== "number" || typeof report.lng !== "number") return null;

  const getMarkerColors = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case "low":
        return { bg: "#22c55e", border: "#15803d" }; // Green
      case "medium":
        return { bg: "#eab308", border: "#a16207" }; // Yellow
      case "critical":
      case "high":
        return { bg: "#ef4444", border: "#b91c1c" }; // Red
      default:
        return { bg: "#3b82f6", border: "#1d4ed8" }; // Blue
    }
  };

  const colors = getMarkerColors(report.severity);

  return (
    <>
      <AdvancedMarker
        ref={markerRef}
        position={{ lat: report.lat, lng: report.lng }}
        onClick={() => setIsOpen(true)}
      >
        <Pin background={colors.bg} glyphColor="#fff" borderColor={colors.border} />
      </AdvancedMarker>
      {isOpen && (
        <InfoWindow anchor={marker} onCloseClick={() => setIsOpen(false)}>
          <div className="p-2 max-w-[240px] text-foreground text-xs space-y-2 select-none">
            <div className="flex items-center justify-between gap-2 border-b border-border/10 pb-1.5">
              <span className="font-bold text-sm text-foreground">{report.issueType}</span>
              <Badge className={`text-[10px] py-0.5 px-1.5 font-semibold ${
                report.severity.toLowerCase() === 'critical' || report.severity.toLowerCase() === 'high' ? 'bg-red-950/50 text-red-400' :
                report.severity.toLowerCase() === 'medium' ? 'bg-yellow-950/50 text-yellow-400' :
                'bg-green-950/50 text-green-400'
              }`}>
                {report.severity}
              </Badge>
            </div>
            <p className="text-muted-foreground font-medium">{report.location}</p>
            {report.description && (
              <p className="text-muted-foreground/85 italic mt-1 font-sans">
                "{report.description}"
              </p>
            )}
            <div className="pt-1.5 flex justify-between text-[10px] text-muted-foreground">
              <span>Status: <strong className="text-primary font-semibold">{report.status}</strong></span>
              <span>{report.date}</span>
            </div>
          </div>
        </InfoWindow>
      )}
    </>
  );
}

export function DashboardPage() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4 },
    },
  };

  const [reports, setReports] = useState<Report[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalReports: 0,
    resolved: 0,
    pending: 0,
    critical: 0,
  });
  const [heatmapZones, setHeatmapZones] = useState<Zone[][]>([]);
  const [predictions, setPredictions] = useState<string[]>([]);
  const [isPredicting, setIsPredicting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const hasFetchedPredictionsRef = useRef(false);

  // Gamification States
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [leaderboard, setLeaderboard] = useState<UserProfile[]>([]);
  const [currentUserId, setCurrentUserId] = useState("");
  const [verifyingId, setVerifyingId] = useState<string | null>(null);

  // Generate a 6x6 Heatmap Grid (36 zones)
  const generateHeatmap = () => {
    const grid: Zone[][] = [];
    let zoneCounter = 1;
    for (let r = 0; r < 6; r++) {
      const row: Zone[] = [];
      for (let c = 0; c < 6; c++) {
        const rand = Math.random();
        const risk = rand > 0.85 ? "high" : rand > 0.5 ? "medium" : "low";
        row.push({
          id: `Z${zoneCounter++}`,
          risk,
        });
      }
      grid.push(row);
    }
    return grid;
  };

  useEffect(() => {
    const unsubscribe = subscribeToReports((fetchedReports) => {
      const processedReports = fetchedReports.map((r, index) => {
        // Fallback lat/lng coordinates for mock/seeded reports
        const fallback = mockCoords[index % mockCoords.length];
        return {
          ...r,
          lat: typeof r.lat === "number" ? r.lat : fallback.lat,
          lng: typeof r.lng === "number" ? r.lng : fallback.lng,
          // Format timestamp if it exists, otherwise fallback to now
          date: r.createdAt?.toDate
            ? r.createdAt.toDate().toLocaleDateString("en-IN")
            : r.date || new Date().toLocaleDateString("en-IN"),
          // Existing uploads default to Pending
          status: r.status || "Pending",
        };
      });

      setReports(processedReports);

      // Calculate Stats
      const total = processedReports.length;
      const resolved = processedReports.filter(
        (r) => r.status?.toLowerCase() === "resolved"
      ).length;
      const pending = processedReports.filter(
        (r) => r.status?.toLowerCase() !== "resolved"
      ).length;
      const critical = processedReports.filter(
        (r) =>
          r.severity?.toLowerCase() === "high" ||
          r.severity?.toLowerCase() === "critical"
      ).length;

      setStats({
        totalReports: total,
        resolved,
        pending,
        critical,
      });

      if (heatmapZones.length === 0) {
        setHeatmapZones(generateHeatmap());
      }

      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    setCurrentUserId(getCurrentUserId());

    const unsubProfile = subscribeToUserProfile((p) => {
      setProfile(p);
    });

    const unsubLeaderboard = subscribeToLeaderboard((l) => {
      setLeaderboard(l);
    });

    return () => {
      unsubProfile();
      unsubLeaderboard();
    };
  }, []);

  const handleVerify = async (reportId: string) => {
    setVerifyingId(reportId);
    try {
      const success = await verifyReport(reportId);
      if (success) {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.85 }
        });
      }
    } catch (e) {
      console.error("Failed to verify report:", e);
    } finally {
      setVerifyingId(null);
    }
  };

  const heatmapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (heatmapZones.length === 0) return;

    const ctx = gsap.context(() => {
      // High risk pulsing glow
      gsap.fromTo(
        ".heatmap-cell-high",
        { boxShadow: "0 0 8px #ef4444" },
        {
          boxShadow: "0 0 20px #ef4444",
          duration: 1.5,
          ease: "power1.inOut",
          repeat: -1,
          yoyo: true,
          stagger: {
            each: 0.1,
            from: "random",
          },
        }
      );

      // Medium risk pulsing glow
      gsap.fromTo(
        ".heatmap-cell-medium",
        { boxShadow: "0 0 8px #f59e0b" },
        {
          boxShadow: "0 0 20px #f59e0b",
          duration: 2,
          ease: "power1.inOut",
          repeat: -1,
          yoyo: true,
          stagger: {
            each: 0.15,
            from: "random",
          },
        }
      );
    }, heatmapRef);

    return () => ctx.revert();
  }, [heatmapZones]);

  // Fetch AI Predictions when reports update
  useEffect(() => {
    if (reports.length > 0 && !hasFetchedPredictionsRef.current) {
      hasFetchedPredictionsRef.current = true;
      const fetchPredictions = async () => {
        setIsPredicting(true);
        try {
          const types = reports.map((r) => r.issueType).slice(0, 10).join(", ");
          const locations = reports.map((r) => r.location).slice(0, 10).join(", ");
          const summary = `We have ${reports.length} total reports. Recent issues include: ${types} in areas like: ${locations}.`;

          const preds = await predictCivicRisks(summary);
          
          if (Array.isArray(preds)) {
            setPredictions(preds);
          } else if (preds && typeof preds === "object" && Array.isArray((preds as any).predictions)) {
            setPredictions((preds as any).predictions);
          } else {
            setPredictions([
              "Ensure low-lying storm drains are monitored for severe blockages.",
              "Track active garbage pile-up reports near municipal market areas.",
              "Coordinate prompt contractor response for arterial pothole hazards."
            ]);
          }
        } catch (error) {
          console.error("AI Predictions failed:", error);
          setPredictions([
            "Ensure low-lying storm drains are monitored for severe blockages.",
            "Track active garbage pile-up reports near municipal market areas.",
            "Coordinate prompt contractor response for arterial pothole hazards."
          ]);
        } finally {
          setIsPredicting(false);
        }
      };
      fetchPredictions();
    }
  }, [reports]);

  const getSeverityColor = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case "low":
        return "bg-green-900/30 text-green-400 border border-green-500/20";
      case "medium":
        return "bg-yellow-900/30 text-yellow-400 border border-yellow-500/20";
      case "critical":
      case "high":
        return "bg-red-900/30 text-red-400 border border-red-500/20";
      default:
        return "bg-muted text-muted-foreground border border-border/30";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "resolved":
        return "bg-green-900/30 text-green-400 border border-green-500/20";
      case "in progress":
        return "bg-blue-900/30 text-blue-400 border border-blue-500/20";
      case "pending":
        return "bg-yellow-900/30 text-yellow-400 border border-yellow-500/20";
      default:
        return "bg-muted text-muted-foreground border border-border/30";
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "high":
        return "bg-red-500/20 text-red-400 border-red-500/50";
      case "medium":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/50";
      case "low":
        return "bg-green-500/20 text-green-400 border-green-500/50";
      default:
        return "bg-muted text-muted-foreground border-border/30";
    }
  };

  return (
    <main className="min-h-screen bg-background pb-12">
      <div className="mx-auto max-w-7xl px-4 pt-28 pb-12 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="mb-2 text-4xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor civic issues and track resolution metrics across the city in real-time.
          </p>
        </div>

        {/* Stats Grid */}
        <motion.div
          className="mb-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4"
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          <motion.div variants={itemVariants}>
            <Card className="h-full border-border/40 bg-card/50 p-6 backdrop-blur-md shadow-lg">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Reports</p>
                  <p className="mt-2 text-3xl font-bold text-foreground flex items-center">
                    {isLoading ? (
                      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    ) : (
                      stats.totalReports.toLocaleString()
                    )}
                  </p>
                </div>
                <div className="rounded-lg bg-primary/10 p-3">
                  <TrendingUp className="h-6 w-6 text-primary" />
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card className="h-full border-border/40 bg-card/50 p-6 backdrop-blur-md shadow-lg">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Resolved</p>
                  <p className="mt-2 text-3xl font-bold text-green-400 flex items-center">
                    {isLoading ? (
                      <Loader2 className="h-5 w-5 animate-spin text-green-400/50" />
                    ) : (
                      stats.resolved.toLocaleString()
                    )}
                  </p>
                </div>
                <div className="rounded-lg bg-green-900/20 p-3">
                  <CheckCircle2 className="h-6 w-6 text-green-400" />
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card className="h-full border-border/40 bg-card/50 p-6 backdrop-blur-md shadow-lg">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Pending</p>
                  <p className="mt-2 text-3xl font-bold text-yellow-400 flex items-center">
                    {isLoading ? (
                      <Loader2 className="h-5 w-5 animate-spin text-yellow-400/50" />
                    ) : (
                      stats.pending.toLocaleString()
                    )}
                  </p>
                </div>
                <div className="rounded-lg bg-yellow-900/20 p-3">
                  <Clock className="h-6 w-6 text-yellow-400" />
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card className="h-full border-border/40 bg-card/50 p-6 backdrop-blur-md shadow-lg">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Critical</p>
                  <p className="mt-2 text-3xl font-bold text-red-400 flex items-center">
                    {isLoading ? (
                      <Loader2 className="h-5 w-5 animate-spin text-red-400/50" />
                    ) : (
                      stats.critical.toLocaleString()
                    )}
                  </p>
                </div>
                <div className="rounded-lg bg-red-900/20 p-3">
                  <AlertCircle className="h-6 w-6 text-red-400" />
                </div>
              </div>
            </Card>
          </motion.div>
        </motion.div>

        {/* Issue Map Section */}
        <motion.div
          className="mb-8"
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          <motion.div variants={itemVariants}>
            <Card className="border-border/40 bg-card/50 p-6 backdrop-blur-md shadow-lg">
              <div className="flex items-center gap-2 mb-4">
                <MapPin className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-bold text-foreground">Interactive Issue Map</h2>
              </div>
              <p className="text-sm text-muted-foreground mb-6">
                Visualizing all reported civic concerns and resolution statuses across the city. Click on any colored marker to view corresponding details.
              </p>

              {!hasValidKey ? (
                <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/5 p-8 text-center">
                  <AlertCircle className="mx-auto mb-3 h-10 w-10 text-yellow-500 animate-pulse" />
                  <h3 className="mb-2 text-md font-semibold text-foreground">Google Maps API Key Required</h3>
                  <p className="text-xs text-muted-foreground max-w-md mx-auto leading-relaxed">
                    To view active issue pinning markers and localized statistics, please configure your Google Maps API Key in AI Studio Secrets:
                  </p>
                  <ul className="text-left text-xs text-muted-foreground max-w-sm mx-auto mt-4 list-decimal pl-5 space-y-1.5">
                    <li>Open <strong>Settings</strong> (⚙️ gear icon, top-right)</li>
                    <li>Select <strong>Secrets</strong></li>
                    <li>Add <code>GOOGLE_MAPS_PLATFORM_KEY</code> as the name</li>
                    <li>Paste your Google Maps API key and press Enter</li>
                  </ul>
                </div>
              ) : (
                <div className="relative h-[450px] w-full rounded-lg overflow-hidden border border-border/40 bg-background/50">
                  <APIProvider apiKey={API_KEY} version="weekly">
                    <Map
                      defaultCenter={{ lat: 19.0760, lng: 72.8777 }} // Mumbai Center
                      defaultZoom={13}
                      mapId="DEMO_MAP_ID"
                      internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
                      style={{ width: "100%", height: "100%" }}
                      gestureHandling="cooperative"
                    >
                      {reports.map((report) => (
                        <DashboardMapMarker key={report.id} report={report} />
                      ))}
                    </Map>
                  </APIProvider>
                </div>
              )}
            </Card>
          </motion.div>
        </motion.div>

        {/* Details Grid */}
        <motion.div
          className="grid gap-8 lg:grid-cols-3"
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          {/* Main Panel */}
          <div className="lg:col-span-2 space-y-8 min-w-0">
            {/* Predictive Heatmap */}
            <motion.div variants={itemVariants}>
              <Card className="border-border/40 bg-card/50 p-6 backdrop-blur-md shadow-lg">
                <div className="flex items-center gap-2 mb-6">
                  <Zap className="h-5 w-5 text-primary" />
                  <h2 className="text-xl font-bold text-foreground">Predictive Issue Heatmap</h2>
                </div>

                <div className="overflow-x-auto pb-4 mb-4">
                  <div ref={heatmapRef} className="space-y-2 min-w-[320px]">
                    {heatmapZones.map((row, rowIdx) => (
                      <div key={rowIdx} className="grid grid-cols-6 gap-2">
                        {row.map((zone, colIdx) => (
                          <div
                            key={colIdx}
                            className={`heatmap-cell-${zone.risk} rounded border p-2 text-center transition-all hover:scale-105 cursor-pointer font-semibold ${getRiskColor(
                              zone.risk
                            )}`}
                            title={`${zone.id} - ${zone.risk} risk`}
                          >
                            <p className="text-[10px] opacity-70 select-none">{zone.id}</p>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Gemini Forecast */}
                <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
                  <h3 className="mb-3 text-sm font-semibold text-primary flex items-center gap-2">
                    {isPredicting && <Loader2 className="h-4 w-4 animate-spin" />}
                    Gemini AI Forecast (Monsoon Risk Analysis)
                  </h3>
                  {predictions.length > 0 ? (
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      {predictions.map((pred, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="mt-0.5 rounded-full bg-primary/20 p-1 shrink-0">
                            <span className="block h-1.5 w-1.5 rounded-full bg-primary" />
                          </span>
                          {pred}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      {isPredicting
                        ? "Analyzing civic data for predictions..."
                        : "Waiting for reports data to forecast risks..."}
                    </p>
                  )}
                </div>
              </Card>
            </motion.div>

             {/* Recent Reports Table */}
            <motion.div variants={itemVariants}>
              <Card className="border-border/40 bg-card/50 p-6 backdrop-blur-md shadow-lg">
                <h2 className="mb-6 text-xl font-bold text-foreground">Recent Reports</h2>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border/40 hover:bg-transparent">
                        <TableHead className="text-muted-foreground font-semibold">Issue</TableHead>
                        <TableHead className="text-muted-foreground font-semibold">Location</TableHead>
                        <TableHead className="text-muted-foreground font-semibold">Severity</TableHead>
                        <TableHead className="text-muted-foreground font-semibold">Status</TableHead>
                        <TableHead className="text-muted-foreground font-semibold">Verification</TableHead>
                        <TableHead className="text-muted-foreground font-semibold">Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isLoading ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                          </TableCell>
                        </TableRow>
                      ) : reports.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                            No reports found. Submit a new report to populate the dashboard!
                          </TableCell>
                        </TableRow>
                      ) : (
                        reports.map((report) => (
                          <TableRow
                            key={report.id}
                            className="border-border/40 hover:bg-card/50 transition-colors"
                          >
                            <TableCell className="font-semibold text-foreground">
                              {report.issueType || "Unknown Issue"}
                            </TableCell>
                            <TableCell className="text-muted-foreground max-w-[150px] truncate">
                              {report.location}
                            </TableCell>
                            <TableCell>
                              <Badge className={getSeverityColor(report.severity)}>
                                {report.severity}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge className={getStatusColor(report.status!)}>
                                {report.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="whitespace-nowrap">
                              {report.reporterId === currentUserId ? (
                                <span className="inline-flex items-center gap-1 text-[10px] bg-primary/10 text-primary border border-primary/25 rounded-full px-2 py-0.5 font-bold">
                                  Your Report ({report.verifiedBy?.length || 0})
                                </span>
                              ) : report.verifiedBy?.includes(currentUserId) ? (
                                <span className="inline-flex items-center gap-1 text-[10px] bg-green-500/10 text-green-400 border border-green-500/25 rounded-full px-2 py-0.5 font-bold">
                                  ✓ Verified ({report.verifiedBy?.length || 0})
                                </span>
                              ) : (
                                <button
                                  onClick={() => handleVerify(report.id)}
                                  disabled={verifyingId === report.id}
                                  className="inline-flex items-center gap-1 text-[10px] bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 border border-orange-500/30 rounded-full px-2.5 py-1 font-bold cursor-pointer transition-all"
                                >
                                  {verifyingId === report.id ? "..." : "+5 Verify"}
                                </button>
                              )}
                            </TableCell>
                            <TableCell className="text-muted-foreground whitespace-nowrap">
                              {report.date}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </Card>
            </motion.div>
          </div>

          {/* Sidebar Section */}
          <motion.div variants={itemVariants} className="min-w-0 space-y-6 lg:sticky lg:top-24">
            
            {/* Gamification: Citizen Profile */}
            <Card className="border-border/40 bg-card/50 p-6 backdrop-blur-md shadow-lg">
              <div className="flex items-center gap-2 mb-4">
                <Star className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-bold text-foreground">My Citizen Profile</h2>
              </div>
              
              {profile ? (
                <div className="space-y-4">
                  {/* Avatar and Name */}
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 text-2xl select-none">
                      👤
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{profile.name}</p>
                      <p className="text-xs font-bold text-primary mt-0.5">{profile.points} Points Earned</p>
                    </div>
                  </div>

                  {/* Streak Block */}
                  <div className="flex items-center gap-3 rounded-xl bg-gradient-to-r from-orange-500/10 to-transparent border border-orange-500/15 p-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-orange-500/20 text-orange-400">
                      <Flame className={`h-5 w-5 ${profile.streak >= 3 ? "animate-bounce fill-orange-400" : ""}`} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-foreground">
                        {profile.streak > 0 
                          ? `${profile.streak}-Day Streak! ${profile.streak >= 3 ? "🔥" : ""}` 
                          : "Start Your Streak!"}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">
                        {profile.streak >= 3 
                          ? "You are on fire! Keep submitting reports daily! 🔥" 
                          : profile.streak > 0 
                            ? "Submit issues consecutive days to build status!" 
                            : "Report a civic concern today to begin your streak."}
                      </p>
                    </div>
                  </div>

                  {/* Badges Block */}
                  <div className="pt-2">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2.5">
                      Earned Badges
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {Object.values(BADGES).map((badge) => {
                        const isUnlocked = profile.unlockedBadges?.includes(badge.id);
                        return (
                          <div
                            key={badge.id}
                            className={`relative group flex h-10 w-10 items-center justify-center rounded-xl border transition-all ${
                              isUnlocked
                                ? `bg-gradient-to-br ${badge.color} border-orange-500/30 text-2xl scale-100 opacity-100 hover:scale-105 shadow-md shadow-orange-500/5`
                                : "bg-background/20 border-border/10 text-xl grayscale opacity-35 hover:grayscale-0 hover:opacity-60"
                            }`}
                          >
                            <span className="select-none">{badge.icon}</span>
                            {/* Premium CSS Tooltip */}
                            <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:block z-50 w-44 rounded-lg border border-border/40 bg-card p-2 text-center text-[10px] shadow-xl backdrop-blur-md">
                              <p className={`font-bold ${isUnlocked ? badge.textClass : "text-muted-foreground"}`}>{badge.name}</p>
                              <p className="text-[9px] text-muted-foreground mt-0.5 leading-tight">{badge.description}</p>
                              <p className="text-[8px] font-bold text-primary mt-1">
                                {isUnlocked ? "✨ Unlocked" : "🔒 Locked"}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center py-6 text-muted-foreground text-xs gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  <span>Loading citizen credentials...</span>
                </div>
              )}
            </Card>

            {/* Gamification: Leaderboard */}
            <Card className="border-border/40 bg-card/50 p-6 backdrop-blur-md shadow-lg">
              <div className="flex items-center gap-2 mb-4">
                <Award className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-bold text-foreground">Citizen Leaderboard</h2>
              </div>
              <p className="text-xs text-muted-foreground mb-4">
                Top 5 active citizens leading our ward efforts. Updates in real-time.
              </p>
              
              <div className="space-y-2.5">
                {leaderboard.length > 0 ? (
                  leaderboard.map((citizen, idx) => {
                    const isMe = citizen.id === profile?.id;
                    return (
                      <div
                        key={citizen.id}
                        className={`flex items-center justify-between rounded-lg border p-3 transition-all ${
                          isMe
                            ? "border-primary/40 bg-primary/10 shadow-md shadow-primary/5"
                            : "border-border/20 bg-background/40 hover:bg-card/40"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          {/* Rank Badge */}
                          <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-extrabold ${
                            idx === 0 ? "bg-amber-400 text-black shadow shadow-amber-400/20" :
                            idx === 1 ? "bg-slate-300 text-black" :
                            idx === 2 ? "bg-amber-700 text-white" :
                            "bg-muted text-muted-foreground"
                          }`}>
                            {idx + 1}
                          </div>
                          
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-foreground truncate flex items-center gap-1.5">
                              {citizen.name}
                              {isMe && (
                                <span className="rounded bg-primary/20 px-1 py-0.2 text-[8px] font-extrabold text-primary tracking-wider uppercase select-none">
                                  You
                                </span>
                              )}
                            </p>
                            
                            {/* Badges strip on leaderboard */}
                            <div className="flex items-center gap-1 mt-0.5">
                              {citizen.unlockedBadges && citizen.unlockedBadges.length > 0 ? (
                                citizen.unlockedBadges.slice(0, 3).map((bId) => (
                                  <span
                                    key={bId}
                                    title={BADGES[bId]?.name || bId}
                                    className="text-xs select-none"
                                  >
                                    {BADGES[bId]?.icon || "🏅"}
                                  </span>
                                ))
                              ) : (
                                <span className="text-[9px] text-muted-foreground/60 italic">New Volunteer</span>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-right shrink-0">
                          <p className="text-xs font-bold text-foreground">{citizen.points} pts</p>
                          {citizen.streak >= 3 && (
                            <p className="text-[9px] font-semibold text-orange-400 mt-0.5">
                              {citizen.streak}d Streak 🔥
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-6 text-muted-foreground text-xs flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    <span>Sourcing leader data...</span>
                  </div>
                )}
              </div>
            </Card>

            {/* Existing Ward Performance Card */}
            <Card className="border-border/40 bg-card/50 p-6 backdrop-blur-md shadow-lg">
              <h2 className="mb-6 text-xl font-bold text-foreground">Ward Performance</h2>
              <div className="space-y-4">
                {wardLeaderboard.map((ward, idx) => {
                  const percentage = Math.round((ward.resolved / ward.total) * 100);
                  return (
                    <div
                      key={idx}
                      className="rounded-lg border border-border/40 bg-background/50 p-4 hover:bg-card/50 transition-colors"
                    >
                      <div className="mb-2 flex items-start justify-between gap-1.5">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-foreground truncate">{ward.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {ward.resolved}/{ward.total} resolved
                          </p>
                        </div>
                        <Badge className="bg-primary/20 text-primary shrink-0 select-none">
                          {percentage}%
                        </Badge>
                      </div>
                      <div className="h-2 rounded-full bg-background/50 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-primary to-primary/60 transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </motion.div>
        </motion.div>
      </div>
    </main>
  );
}
