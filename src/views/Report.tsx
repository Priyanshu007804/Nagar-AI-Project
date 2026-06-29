import React, { useState, useRef, useEffect } from "react";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { Upload, MapPin, CheckCircle, Zap, Loader2, AlertCircle, Award, Sparkles, Flame } from "lucide-react";
import { analyzeIssueImage } from "../lib/gemini";
import { saveReport, processReportGamification } from "../lib/firebase";
import { BADGES } from "../lib/badges";
import confetti from "canvas-confetti";
import { motion, AnimatePresence } from "motion/react";
import gsap from "gsap";
import { APIProvider, Map, AdvancedMarker, Pin, useMap, useMapsLibrary } from "@vis.gl/react-google-maps";

const API_KEY =
  process.env.GOOGLE_MAPS_PLATFORM_KEY ||
  (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
  process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY ||
  (import.meta as any).env?.VITE_GOOGLE_MAPS_KEY ||
  '';
const hasValidKey = Boolean(API_KEY) && API_KEY !== 'YOUR_API_KEY';

interface ReportPageProps {
  onNavigate: (path: string) => void;
}

interface MapWrapperProps {
  pinLocation: { lat: number; lng: number } | null;
  setPinLocation: React.Dispatch<React.SetStateAction<{ lat: number; lng: number } | null>>;
  setLocationText: React.Dispatch<React.SetStateAction<string>>;
  setReverseGeocoding: React.Dispatch<React.SetStateAction<boolean>>;
}

function MapWrapper({ pinLocation, setPinLocation, setLocationText, setReverseGeocoding }: MapWrapperProps) {
  const map = useMap();
  const geocodingLib = useMapsLibrary("geocoding");
  const [mapCenter, setMapCenter] = useState({ lat: 22.5726, lng: 88.3639 }); // Kolkata
  const [isLocating, setIsLocating] = useState(false);
  const [hasCentered, setHasCentered] = useState(false);

  // Auto geolocate user on load
  useEffect(() => {
    if (navigator.geolocation && !hasCentered) {
      setIsLocating(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userLoc = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setMapCenter(userLoc);
          setPinLocation(userLoc);
          setHasCentered(true);
          setIsLocating(false);
          
          if (map) {
            map.panTo(userLoc);
            map.setZoom(15);
          }
        },
        (error) => {
          console.warn("Geolocation failed:", error);
          setIsLocating(false);
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    }
  }, [map, hasCentered]);

  // Handle map click to pin location
  const handleMapClick = (e: any) => {
    if (e.detail?.latLng) {
      const clickedLoc = {
        lat: e.detail.latLng.lat,
        lng: e.detail.latLng.lng,
      };
      setPinLocation(clickedLoc);
      if (map) {
        map.panTo(clickedLoc);
      }
    }
  };

  // Reverse geocode whenever pinLocation changes
  useEffect(() => {
    if (!geocodingLib || !pinLocation) return;
    
    setReverseGeocoding(true);
    const geocoder = new geocodingLib.Geocoder();
    geocoder.geocode({ location: pinLocation }, (results, status) => {
      setReverseGeocoding(false);
      if (status === "OK" && results?.[0]) {
        setLocationText(results[0].formatted_address);
      } else {
        console.warn("Geocoder failed due to:", status);
        setLocationText(`Coordinates: ${pinLocation.lat.toFixed(5)}, ${pinLocation.lng.toFixed(5)}`);
      }
    });
  }, [geocodingLib, pinLocation]);

  const handleLocateMe = () => {
    if (navigator.geolocation) {
      setIsLocating(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userLoc = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setMapCenter(userLoc);
          setPinLocation(userLoc);
          setIsLocating(false);
          if (map) {
            map.panTo(userLoc);
            map.setZoom(15);
          }
        },
        (error) => {
          console.warn("Geolocation failed on locate me:", error);
          setIsLocating(false);
        }
      );
    }
  };

  return (
    <>
      <Map
        defaultCenter={mapCenter}
        defaultZoom={13}
        mapId="DEMO_MAP_ID"
        onClick={handleMapClick}
        internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
        style={{ width: "100%", height: "100%" }}
        gestureHandling="cooperative"
      >
        {pinLocation && (
          <AdvancedMarker position={pinLocation}>
            <Pin background="#ef4444" glyphColor="#fff" borderColor="#b91c1c" />
          </AdvancedMarker>
        )}
      </Map>

      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={handleLocateMe}
        disabled={isLocating}
        className="absolute bottom-4 right-4 z-10 bg-background/90 backdrop-blur border border-border shadow-md hover:bg-accent/90"
      >
        {isLocating ? (
          <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
        ) : (
          <MapPin className="h-4 w-4 mr-1.5 text-primary" />
        )}
        {isLocating ? "Locating..." : "Locate Me"}
      </Button>
    </>
  );
}

export function ReportPage({ onNavigate }: ReportPageProps) {
  const slideUpVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
    exit: { opacity: 0, y: -20, transition: { duration: 0.3 } },
  };

  const [dragActive, setDragActive] = useState(false);
  const [image, setImage] = useState<string | null>(null);
  const [fileName, setFileName] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [pinLocation, setPinLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [reverseGeocoding, setReverseGeocoding] = useState(false);

  // States for API integration
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  // Gamification States
  const [pointsNotification, setPointsNotification] = useState<{ show: boolean; amount: number; streak: number } | null>(null);
  const [activeBadgePopup, setActiveBadgePopup] = useState<string | null>(null);

  const [aiResult, setAiResult] = useState<{
    type: string;
    severity: string;
    confidence: number;
    description?: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const scanContainerRef = useRef<HTMLDivElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  // GSAP Animation Effect for Scan Line and Results Intro
  useEffect(() => {
    const ctx = gsap.context(() => {});

    if (isAnalyzing && image) {
      ctx.add(() => {
        const tl = gsap.timeline({ repeat: -1 });
        tl.fromTo(
          ".scan-line",
          { top: "0%" },
          { top: "100%", duration: 1.5, ease: "linear" }
        );
      });
    }

    if (aiResult && !isAnalyzing) {
      ctx.add(() => {
        const tl = gsap.timeline();
        tl.fromTo(
          resultRef.current,
          { opacity: 0, scale: 0.95 },
          { opacity: 1, scale: 1, duration: 0.5, ease: "back.out(1.2)" }
        );
      });
    }

    return () => ctx.revert();
  }, [isAnalyzing, aiResult, image]);

  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
 
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFile(files[0]);
    }
  };

  const handleFile = async (file: File) => {
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const result = e.target?.result;
        if (typeof result === "string") {
          setImage(result);
          setFileName(file.name);
          setAiResult(null);
          setAiError(null);
          setIsAnalyzing(true);

          try {
            const analysis = await analyzeIssueImage(result);
            // Handle scale variations (0-1 vs 0-100)
            const confidenceVal =
              analysis.confidence > 1
                ? Math.round(analysis.confidence)
                : Math.round(analysis.confidence * 100);

            setAiResult({
              type: analysis.issueType,
              severity: analysis.severity,
              confidence: confidenceVal,
              description: analysis.description,
            });
          } catch (error) {
            console.error("AI Analysis failed:", error);
            setAiError("AI analysis failed, please try again");
          } finally {
            setIsAnalyzing(false);
          }
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!image || !aiResult || !location) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      await saveReport({
        imageUrl: image,
        issueType: aiResult.type,
        severity: aiResult.severity,
        confidence: aiResult.confidence,
        location,
        description,
        aiDescription: aiResult.description,
        lat: pinLocation?.lat || null,
        lng: pinLocation?.lng || null,
      });

      // Process points and badges
      const gamResult = await processReportGamification(aiResult.type);

      // Initial celebration burst
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.8 }
      });

      setPointsNotification({
        show: true,
        amount: gamResult.pointsEarned,
        streak: gamResult.streak
      });

      // Hide points notification after 4 seconds
      setTimeout(() => {
        setPointsNotification(null);
      }, 4000);

      // Trigger Badge Unlock Celebration Modal if a badge is unlocked
      if (gamResult.newlyUnlockedBadges && gamResult.newlyUnlockedBadges.length > 0) {
        setTimeout(() => {
          setActiveBadgePopup(gamResult.newlyUnlockedBadges[0]);
          
          // Continuous confetti burst for unlocked badge
          const duration = 2.5 * 1000;
          const animationEnd = Date.now() + duration;
          const defaults = { startVelocity: 25, spread: 360, ticks: 50, zIndex: 100 };

          const randomInRange = (min: number, max: number) => {
            return Math.random() * (max - min) + min;
          };

          const interval = setInterval(() => {
            const timeLeft = animationEnd - Date.now();
            if (timeLeft <= 0) return clearInterval(interval);

            const particleCount = 50 * (timeLeft / duration);
            confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
            confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
          }, 250);
        }, 1200);
      }

      setSubmitted(true);

      setTimeout(() => {
        setSubmitted(false);
        setImage(null);
        setAiResult(null);
        setLocation("");
        setDescription("");
        setFileName("");
        setPinLocation(null);
      }, 5000);
    } catch (error) {
      console.error("Submission failed:", error);
      setSubmitError("Submission failed, please try again");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case "low":
        return "bg-green-900/30 text-green-400";
      case "medium":
        return "bg-yellow-900/30 text-yellow-400";
      case "critical":
      case "high":
        return "bg-red-900/30 text-red-400";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-4 pt-28 pb-12 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="mb-2 text-4xl font-bold text-foreground">Report an Issue</h1>
          <p className="text-muted-foreground">
            Upload an image and our AI will automatically classify and analyze the civic issue.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Image Upload */}
          <motion.div initial="hidden" animate="visible" variants={slideUpVariants}>
            <Card className="border-border/40 bg-card/50 p-8 backdrop-blur-md shadow-lg">
              <h2 className="mb-6 flex items-center gap-2 text-xl font-semibold text-foreground">
                <Upload className="h-5 w-5 text-primary" />
                Upload Image
              </h2>

              <div
                className={`relative rounded-lg border-2 border-dashed transition-colors ${
                  dragActive
                    ? "border-primary bg-primary/10"
                    : "border-border/40 bg-background/50 hover:bg-card/30"
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                {image ? (
                  <div className="p-6 relative group">
                    <img
                      src={image}
                      alt="Uploaded issue"
                      referrerPolicy="no-referrer"
                      className="h-80 w-full rounded-lg object-cover"
                    />

                    {/* Scanning Overlay */}
                    {isAnalyzing && (
                      <div
                        ref={scanContainerRef}
                        className="absolute inset-6 rounded-lg bg-black/40 overflow-hidden flex items-center justify-center pointer-events-none"
                      >
                        <div className="scan-line absolute left-0 right-0 h-[2px] bg-orange-500 shadow-[0_0_8px_#f97316] top-0 z-10" />
                        <div className="scan-text text-xl font-bold text-orange-400 font-mono tracking-widest bg-black/60 px-4 py-2 rounded shadow-lg border border-orange-500/30 z-20">
                          AI Analyzing<span className="animate-pulse">_</span>
                        </div>
                      </div>
                    )}

                    <p className="mt-4 text-center text-sm text-muted-foreground">{fileName}</p>
                    <button
                      type="button"
                      onClick={() => {
                        setImage(null);
                        setAiResult(null);
                        setFileName("");
                        setAiError(null);
                        setPinLocation(null);
                      }}
                      className="mt-4 w-full rounded-lg border border-border/40 py-2 text-sm text-muted-foreground hover:bg-card/50 transition-colors cursor-pointer outline-none"
                      disabled={isAnalyzing || isSubmitting}
                    >
                      Change Image
                    </button>
                  </div>
                ) : (
                  <div
                    className="cursor-pointer p-8 text-center"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="mx-auto mb-3 h-12 w-12 text-muted-foreground" />
                    <p className="text-sm font-medium text-foreground">
                      Drag and drop your image here
                    </p>
                    <p className="text-xs text-muted-foreground">or click to browse</p>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleChange}
                  className="hidden"
                  disabled={isAnalyzing || isSubmitting}
                />
              </div>

              {/* AI Error State */}
              <AnimatePresence mode="wait">
                {aiError && (
                  <motion.div
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    variants={slideUpVariants}
                    className="mt-6 flex items-center gap-3 rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-red-500"
                  >
                    <AlertCircle className="h-5 w-5" />
                    <p className="text-sm font-medium">{aiError}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* AI Classification Result */}
              {aiResult && !isAnalyzing && (
                <div
                  ref={resultRef}
                  className="mt-6 rounded-lg border border-primary/20 bg-primary/5 p-6"
                >
                  <h3 className="mb-4 flex items-center gap-2 font-semibold text-foreground">
                    <Zap className="h-5 w-5 text-primary" />
                    AI Classification Result
                  </h3>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div>
                      <p className="text-xs text-muted-foreground">Issue Type</p>
                      <p className="mt-1 text-lg font-semibold text-foreground">
                        {aiResult.type}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Severity</p>
                      <div className="mt-1">
                        <Badge className={getSeverityColor(aiResult.severity)}>
                          {aiResult.severity}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">AI Confidence</p>
                      <p className="mt-1 text-lg font-semibold text-primary">
                        {aiResult.confidence}%
                      </p>
                    </div>
                  </div>
                  {aiResult.description && (
                    <div className="mt-4 pt-4 border-t border-primary/10">
                      <p className="text-xs text-muted-foreground">AI Description</p>
                      <p className="mt-1 text-sm text-foreground">{aiResult.description}</p>
                    </div>
                  )}
                </div>
              )}
            </Card>
          </motion.div>

          {/* Interactive Google Maps Pinning */}
          <AnimatePresence mode="wait">
            {image && aiResult && !isAnalyzing && (
              <motion.div
                initial="hidden"
                animate="visible"
                exit="exit"
                variants={slideUpVariants}
              >
                <Card className="border-border/40 bg-card/50 p-8 backdrop-blur-md shadow-lg">
                  <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold text-foreground">
                    <MapPin className="h-5 w-5 text-primary" />
                    Pin Issue Location
                  </h2>
                  <p className="mb-6 text-sm text-muted-foreground">
                    Help municipal teams locate the issue precisely. Click on the map to place a red marker or let the map detect your current position automatically.
                  </p>

                  {!hasValidKey ? (
                    <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/5 p-6 text-center">
                      <AlertCircle className="mx-auto mb-3 h-10 w-10 text-yellow-500 animate-pulse" />
                      <h3 className="mb-2 text-md font-semibold text-foreground">Google Maps API Key Needed</h3>
                      <p className="text-xs text-muted-foreground max-w-md mx-auto leading-relaxed">
                        To enable interactive map pinning and reverse geocoding, please add your Google Maps API key in AI Studio Secrets:
                      </p>
                      <ul className="text-left text-xs text-muted-foreground max-w-sm mx-auto mt-4 list-decimal pl-5 space-y-1.5">
                        <li>Go to **Settings** (⚙️ gear icon, top-right)</li>
                        <li>Select **Secrets**</li>
                        <li>Add <code>GOOGLE_MAPS_PLATFORM_KEY</code> as the name</li>
                        <li>Paste your Google Maps API key and press Enter</li>
                      </ul>
                      <div className="mt-4 pt-4 border-t border-border/40">
                        <p className="text-[11px] text-muted-foreground font-mono">
                          (You can still manually type the address in the location field below)
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="relative h-[320px] w-full rounded-lg overflow-hidden border border-border/40 bg-background/50">
                        <APIProvider apiKey={API_KEY} version="weekly">
                          <MapWrapper
                            pinLocation={pinLocation}
                            setPinLocation={setPinLocation}
                            setLocationText={setLocation}
                            setReverseGeocoding={setReverseGeocoding}
                          />
                        </APIProvider>
                      </div>
                      
                      {pinLocation && (
                        <div className="rounded-lg bg-background/50 p-4 border border-border/30 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                          <div>
                            <span className="text-muted-foreground">Pinned Coordinates:</span>
                            <p className="font-mono mt-1 text-foreground font-semibold">
                              {pinLocation.lat.toFixed(6)}, {pinLocation.lng.toFixed(6)}
                            </p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Detected Address:</span>
                            {reverseGeocoding ? (
                              <div className="flex items-center gap-1.5 mt-1 text-muted-foreground">
                                <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                                <span>Geocoding location...</span>
                              </div>
                            ) : (
                              <p className="mt-1 text-foreground font-medium line-clamp-2">
                                {location || "No address detected. Click map to refresh."}
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Location and Description */}
          <AnimatePresence mode="wait">
            {image && aiResult && !isAnalyzing && (
              <motion.div
                initial="hidden"
                animate="visible"
                exit="exit"
                variants={slideUpVariants}
              >
                <Card className="border-border/40 bg-card/50 p-8 backdrop-blur-md shadow-lg">
                  <h2 className="mb-6 flex items-center gap-2 text-xl font-semibold text-foreground">
                    <CheckCircle className="h-5 w-5 text-primary" />
                    Issue Details
                  </h2>

                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-foreground">
                        Location <span className="text-red-400">*</span>
                      </label>
                      <Input
                        type="text"
                        placeholder="Enter the street, ward, or area name"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        required
                        className="mt-2 bg-background/50 text-foreground placeholder:text-muted-foreground/50"
                        disabled={isSubmitting}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground">
                        Description (Optional)
                      </label>
                      <textarea
                        placeholder="Provide additional details or landmarks about the issue"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="mt-2 h-32 w-full rounded-lg border border-border/40 bg-background/50 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors"
                        disabled={isSubmitting}
                      />
                    </div>

                    {/* Submit Error State */}
                    <AnimatePresence mode="wait">
                      {submitError && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="flex items-center gap-3 rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-red-500"
                        >
                          <AlertCircle className="h-5 w-5 shrink-0" />
                          <p className="text-sm font-medium">{submitError}</p>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <Button
                      type="submit"
                      size="lg"
                      className="w-full cursor-pointer font-semibold"
                      disabled={isSubmitting || !aiResult || (hasValidKey && !pinLocation)}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        "Submit Report"
                      )}
                    </Button>
                  </div>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </form>

        {/* Success Modal Popup */}
        <AnimatePresence>
          {submitted && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
              >
                <Card className="border-border/40 bg-card/60 p-8 text-center backdrop-blur-md shadow-xl max-w-sm">
                  <div className="mb-4 flex justify-center">
                    <CheckCircle className="h-16 w-16 text-green-500" />
                  </div>
                  <h3 className="mb-2 text-2xl font-bold text-foreground">
                    Issue reported successfully!
                  </h3>
                  <p className="text-muted-foreground">
                    Your issue has been recorded and forwarded to the relevant authorities.
                  </p>
                </Card>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Gamification: Points Toast */}
        <AnimatePresence>
          {pointsNotification?.show && (
            <motion.div
              initial={{ opacity: 0, y: -50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.9 }}
              className="fixed top-24 right-4 z-50 flex items-center gap-4 rounded-xl border border-primary/40 bg-card/90 px-6 py-4 shadow-xl shadow-primary/15 backdrop-blur-md"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20 text-primary">
                <Zap className="h-6 w-6 fill-primary" />
              </div>
              <div>
                <h4 className="text-md font-bold text-foreground">+{pointsNotification.amount} Citizen Points!</h4>
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                  Report submitted successfully
                  {pointsNotification.streak > 1 && (
                    <span className="flex items-center gap-1 font-semibold text-orange-400">
                      • {pointsNotification.streak}-day streak {pointsNotification.streak >= 3 ? "🔥" : "✨"}
                    </span>
                  )}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Gamification: Badge Unlock Modal */}
        <AnimatePresence>
          {activeBadgePopup && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md px-4"
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                className="w-full max-w-sm rounded-2xl border border-orange-500/30 bg-card/95 p-8 text-center shadow-2xl shadow-orange-500/15 backdrop-blur-md"
              >
                <div className="relative mb-6 flex justify-center">
                  <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-orange-500 to-yellow-500 opacity-25 blur-lg animate-pulse" />
                  <div className="relative flex h-24 w-24 items-center justify-center rounded-full border border-orange-500/30 bg-orange-950/20 text-5xl">
                    {BADGES[activeBadgePopup]?.icon}
                  </div>
                </div>
                
                <span className="inline-flex items-center gap-1 rounded-full bg-orange-500/10 px-2.5 py-1 text-[10px] font-bold text-orange-400 border border-orange-500/20 uppercase tracking-widest mb-3">
                  <Award className="h-3.5 w-3.5" /> Milestone Unlocked
                </span>

                <h3 className="mb-2 text-2xl font-extrabold text-foreground tracking-tight">
                  {BADGES[activeBadgePopup]?.name}
                </h3>
                
                <p className="mb-6 text-sm text-muted-foreground leading-relaxed px-2">
                  {BADGES[activeBadgePopup]?.description}
                </p>

                <Button
                  onClick={() => setActiveBadgePopup(null)}
                  size="default"
                  className="w-full cursor-pointer bg-primary font-bold hover:bg-primary/90 shadow-lg shadow-primary/20 text-white rounded-xl transition-all"
                >
                  Continue Journey
                </Button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
