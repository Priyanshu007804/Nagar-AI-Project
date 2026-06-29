import { useState, useEffect, FormEvent } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  User, 
  Mail, 
  Lock, 
  Shield, 
  Award, 
  Flame, 
  LogOut, 
  LogIn,
  Activity, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle,
  Plus,
  Compass
} from "lucide-react";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { 
  signUpUser, 
  signInUser, 
  signInWithGoogle,
  signOutUser, 
  subscribeToAuth, 
  getUserProfile, 
  subscribeToUserProfile,
  UserProfile,
  getReports,
  Report
} from "../lib/firebase";
import { BADGES } from "../lib/badges";

interface ProfilePageProps {
  onNavigate: (path: string) => void;
}

export function ProfilePage({ onNavigate }: ProfilePageProps) {
  const [authUser, setAuthUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [userReports, setUserReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [authActionLoading, setAuthActionLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Track authentication state
  useEffect(() => {
    setLoading(true);
    const unsubAuth = subscribeToAuth((user) => {
      setAuthUser(user);
      if (!user) {
        setProfile(null);
        setUserReports([]);
        setLoading(false);
      }
    });
    return unsubAuth;
  }, []);

  // Track profile and user reports once logged in
  useEffect(() => {
    if (!authUser) return;

    // Realtime profile synchronization
    const unsubProfile = subscribeToUserProfile((p) => {
      setProfile(p);
      setLoading(false);
    });

    // Fetch reports
    const fetchUserReports = async () => {
      try {
        const allReports = await getReports();
        const filtered = allReports.filter((r) => r.reporterId === authUser.uid);
        setUserReports(filtered);
      } catch (err) {
        console.error("Failed to fetch user reports:", err);
      }
    };

    fetchUserReports();
    // Re-fetch periodically or when reports might update
    const interval = setInterval(fetchUserReports, 10000);

    return () => {
      unsubProfile();
      clearInterval(interval);
    };
  }, [authUser]);

  // Handle Google Sign In
  const handleGoogleSignIn = async () => {
    setErrorMessage("");
    setAuthActionLoading(true);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      console.error(err);
      let friendlyMessage = err.message || "An unexpected error occurred during Google authentication.";
      if (err.message?.includes("auth/popup-blocked")) {
        friendlyMessage = "The login popup was blocked. Please enable popups or allow redirects in your browser.";
      } else if (err.message?.includes("auth/popup-closed-by-user")) {
        friendlyMessage = "The Google login popup was closed. Please try again.";
      } else if (err.message?.includes("auth/cancelled-popup-request")) {
        friendlyMessage = "Google login is already in progress in another window.";
      }
      setErrorMessage(friendlyMessage);
    } finally {
      setAuthActionLoading(false);
    }
  };

  // Handle Logout
  const handleLogout = async () => {
    setLoading(true);
    try {
      await signOutUser();
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Gamification Ranking Levels based on score points
  const getRankLevel = (points: number) => {
    if (points >= 500) {
      return { level: 5, rank: "Diamond Civic Legend", color: "text-purple-400", bg: "bg-purple-950/40 border-purple-500/30", nextScore: 9999, label: "Peak Rank reached!" };
    } else if (points >= 300) {
      return { level: 4, rank: "Platinum Pioneer", color: "text-teal-400", bg: "bg-teal-950/40 border-teal-500/30", nextScore: 500, label: "200 more points to reach Diamond Civic Legend" };
    } else if (points >= 150) {
      return { level: 3, rank: "Gold Guardian", color: "text-amber-400", bg: "bg-amber-950/40 border-amber-500/30", nextScore: 300, label: "150 more points to reach Platinum Pioneer" };
    } else if (points >= 50) {
      return { level: 2, rank: "Silver Sentinel", color: "text-slate-300", bg: "bg-slate-900 border-slate-700", nextScore: 150, label: "100 more points to reach Gold Guardian" };
    } else {
      return { level: 1, rank: "Bronze Vigilante", color: "text-orange-400", bg: "bg-orange-950/40 border-orange-500/30", nextScore: 50, label: `${50 - points} more points to reach Silver Sentinel` };
    }
  };

  const currentRank = profile ? getRankLevel(profile.points) : getRankLevel(0);

  // Animation layout configs
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 15, opacity: 0 },
    show: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 100 } }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative flex items-center justify-center h-16 w-16">
            <div className="absolute animate-ping h-8 w-8 rounded-full bg-primary/20" />
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary" />
          </div>
          <p className="text-muted-foreground animate-pulse text-sm font-medium">Synchronizing Secure Citizen Profile...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background pb-16">
      <div className="mx-auto max-w-4xl px-4 pt-28 sm:px-6 lg:px-8">
        
        <AnimatePresence mode="wait">
          {!authUser ? (
            /* ================== SIGN IN / REGISTRATION VIEW ================== */
            <motion.div
              key="auth-view"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mx-auto max-w-md"
            >
              <div className="mb-8 text-center">
                <h1 className="text-4xl font-extrabold text-foreground tracking-tight mb-2 bg-gradient-to-r from-orange-400 to-yellow-400 bg-clip-text text-transparent">
                  Citizen Portal
                </h1>
                <p className="text-muted-foreground text-sm">
                  Authenticate your citizen profile securely using Google to unlock gamification scores, rewards, and track report analytics.
                </p>
              </div>

              <Card className="border-border/40 bg-card/45 p-8 backdrop-blur-md shadow-2xl text-center flex flex-col items-center">
                <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mb-6 border border-primary/20">
                  <Shield className="h-8 w-8 text-primary" />
                </div>
                
                <h2 className="text-xl font-bold text-foreground mb-2">Welcome, Citizen!</h2>
                <p className="text-sm text-muted-foreground mb-8 max-w-xs">
                  Sign in with your Google account to get verified instantly, claim your 10 onboarding Reputation XP, and start reporting local issues.
                </p>

                {errorMessage && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full flex items-start gap-2 text-xs text-red-400 bg-red-950/35 border border-red-500/20 rounded-lg p-3 mb-5 text-left"
                  >
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>{errorMessage}</span>
                  </motion.div>
                )}

                <Button
                  id="btn-google-signin"
                  onClick={handleGoogleSignIn}
                  className="w-full h-12 bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-black font-bold text-sm tracking-wide transition-all shadow-md hover:shadow-orange-500/20 hover:scale-[1.01] flex items-center justify-center gap-2 cursor-pointer"
                  disabled={authActionLoading}
                >
                  {authActionLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-black" />
                      <span>Signing in with Google...</span>
                    </>
                  ) : (
                    <>
                      <LogIn className="h-5 w-5" />
                      <span>Sign In with Google</span>
                    </>
                  )}
                </Button>

                <div className="mt-6 flex items-center justify-center gap-1 text-[10px] text-muted-foreground/60 uppercase font-bold tracking-wider">
                  <Sparkles className="h-3 w-3 text-primary" /> Instant Verification & Encryption
                </div>
              </Card>
            </motion.div>
          ) : (
            /* ================== ACTIVE USER PROFILE VIEW ================== */
            <motion.div
              key="profile-view"
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="space-y-8"
            >
              {/* Header Badge */}
              <motion.div variants={itemVariants} className="flex flex-col md:flex-row items-center justify-between gap-6 bg-card/30 border border-border/30 rounded-2xl p-6 md:p-8 backdrop-blur-md shadow-lg">
                <div className="flex flex-col md:flex-row items-center gap-5 text-center md:text-left">
                  {/* Initials Avatar with ambient color */}
                  <div className="relative">
                    <div className="h-20 w-20 rounded-full bg-gradient-to-tr from-orange-400 to-yellow-500 flex items-center justify-center font-extrabold text-3xl text-black shadow-lg">
                      {profile?.name?.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase() || authUser.displayName?.split(" ").map((w: string) => w[0]).slice(0, 2).join("").toUpperCase() || "C"}
                    </div>
                    <div className="absolute -bottom-1 -right-1 bg-primary text-black rounded-full p-1.5 border-2 border-background shadow-md">
                      <Shield className="h-3.5 w-3.5 fill-current" />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex flex-col md:flex-row items-center gap-2">
                      <h1 className="text-2xl font-bold tracking-tight text-foreground">
                        {profile?.name || authUser.displayName || "Concerned Citizen"}
                      </h1>
                      <Badge className="bg-primary/10 text-primary border border-primary/20 text-[10px] font-semibold py-0.5 px-2">
                        Authorized Resident
                      </Badge>
                    </div>
                    <p className="text-muted-foreground text-sm font-mono flex items-center justify-center md:justify-start gap-1.5">
                      <Mail className="h-3.5 w-3.5 text-primary" /> {authUser.email}
                    </p>
                    <div className="text-xs bg-muted/40 rounded-md py-1 px-2.5 inline-block text-muted-foreground">
                      Citizen UID: <span className="font-mono text-foreground/80">{authUser.uid.substring(0, 8)}...</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-center gap-2">
                  <Button
                    id="btn-logout"
                    variant="outline"
                    onClick={handleLogout}
                    className="border-border/60 hover:bg-red-950/20 hover:border-red-500/20 hover:text-red-400 transition-all font-semibold text-xs py-5 px-4 cursor-pointer flex items-center gap-2"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign Out Account
                  </Button>
                </div>
              </motion.div>

              {/* Civic Scorecard Dashboard Grid */}
              <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* Points Card */}
                <Card className="relative overflow-hidden bg-gradient-to-br from-orange-500/10 via-card/50 to-card border-border/40 p-6 backdrop-blur-md hover:scale-[1.01] transition-transform shadow-lg">
                  <div className="absolute top-0 right-0 p-8 opacity-10">
                    <Award className="h-24 w-24 text-orange-400" />
                  </div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Civic Reputation Score</p>
                  <p className="text-4xl font-extrabold text-orange-400 tracking-tight leading-none mb-3">
                    {profile?.points || 0} <span className="text-xs font-medium text-muted-foreground">Reputation XP</span>
                  </p>
                  <div className={`text-xs inline-flex items-center gap-1.5 font-bold rounded-full py-1 px-2.5 ${currentRank.bg} ${currentRank.color}`}>
                    <Shield className="h-3 w-3 fill-current" />
                    {currentRank.rank}
                  </div>
                </Card>

                {/* Reporting Streak */}
                <Card className="relative overflow-hidden bg-gradient-to-br from-yellow-500/10 via-card/50 to-card border-border/40 p-6 backdrop-blur-md hover:scale-[1.01] transition-transform shadow-lg">
                  <div className="absolute top-0 right-0 p-8 opacity-10">
                    <Flame className="h-24 w-24 text-yellow-400" />
                  </div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Active Reporting Streak</p>
                  <p className="text-4xl font-extrabold text-yellow-400 tracking-tight leading-none mb-3">
                    {profile?.streak || 0} <span className="text-xs font-medium text-muted-foreground">Days Consecutive</span>
                  </p>
                  <p className="text-xs text-muted-foreground leading-normal">
                    {profile?.streak && profile.streak > 0 
                      ? "Awesome job! Keep reporting municipal grievances on consecutive days to compound your reputation score!"
                      : "Submit reports daily to build an active streak and earn bonus score multipliers."}
                  </p>
                </Card>

                {/* Total Reports */}
                <Card className="relative overflow-hidden bg-gradient-to-br from-emerald-500/10 via-card/50 to-card border-border/40 p-6 backdrop-blur-md hover:scale-[1.01] transition-transform shadow-lg">
                  <div className="absolute top-0 right-0 p-8 opacity-10">
                    <Activity className="h-24 w-24 text-emerald-400" />
                  </div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Civic Contributions</p>
                  <p className="text-4xl font-extrabold text-emerald-400 tracking-tight leading-none mb-3">
                    {profile?.reportedCount || 0} <span className="text-xs font-medium text-muted-foreground">Issues Resolved/Filed</span>
                  </p>
                  <p className="text-xs text-muted-foreground leading-normal">
                    You have successfully submitted <strong className="text-foreground">{profile?.reportedCount || 0}</strong> municipal reports, including <strong className="text-foreground">{profile?.potholeCount || 0}</strong> pothole reports.
                  </p>
                </Card>
              </motion.div>

              {/* Dynamic Score Analysis & Citizen Rank Meter */}
              <motion.div variants={itemVariants}>
                <Card className="border-border/40 bg-card/45 p-6 md:p-8 backdrop-blur-md shadow-lg">
                  <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" /> Rank & Score Analytics
                  </h2>

                  <div className="space-y-6">
                    {/* Progress Slider */}
                    <div>
                      <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground mb-2">
                        <span>Current Rank: <strong className="text-foreground">{currentRank.rank}</strong></span>
                        <span>{profile?.points || 0} / {currentRank.nextScore === 9999 ? "MAX" : `${currentRank.nextScore} XP`}</span>
                      </div>
                      
                      {/* Bar container */}
                      <div className="h-3 w-full bg-background/50 border border-border/20 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-orange-400 to-yellow-400 transition-all duration-1000"
                          style={{ 
                            width: `${currentRank.nextScore === 9999 ? 100 : Math.min(100, ((profile?.points || 0) / currentRank.nextScore) * 100)}%` 
                          }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground/80 mt-2 font-medium italic">
                        {currentRank.label}
                      </p>
                    </div>

                    {/* Breakdown section */}
                    <div className="border-t border-border/30 pt-5 mt-4">
                      <h3 className="text-sm font-semibold text-foreground mb-3 uppercase tracking-wider text-foreground/90">Detailed Score Breakdown</h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                        <div className="flex items-center justify-between p-3 rounded-lg bg-background/30 border border-border/20 text-xs">
                          <span className="text-muted-foreground">Onboarding Registration XP</span>
                          <span className="font-bold text-green-400">+10 Points</span>
                        </div>
                        
                        <div className="flex items-center justify-between p-3 rounded-lg bg-background/30 border border-border/20 text-xs">
                          <span className="text-muted-foreground">Grievance Submission Points</span>
                          <span className="font-bold text-green-400">+{profile?.reportedCount ? profile.reportedCount * 10 : 0} Points</span>
                        </div>

                        <div className="flex items-center justify-between p-3 rounded-lg bg-background/30 border border-border/20 text-xs">
                          <span className="text-muted-foreground">Streak Achievement Multiplier</span>
                          <span className="font-bold text-yellow-400">+{profile?.streak ? profile.streak * 5 : 0} Streak Points</span>
                        </div>

                        <div className="flex items-center justify-between p-3 rounded-lg bg-background/30 border border-border/20 text-xs">
                          <span className="text-muted-foreground">Verification Validation Points</span>
                          <span className="font-bold text-blue-400">Included in profile total</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>

              {/* Gamified Badges Showcase */}
              <motion.div variants={itemVariants} className="space-y-4">
                <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
                  <Award className="h-5.5 w-5.5 text-primary" /> Unlocked Civic Badges
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {Object.values(BADGES).map((badge) => {
                    const isUnlocked = profile?.unlockedBadges?.includes(badge.id);
                    
                    return (
                      <Card
                        key={badge.id}
                        className={`p-5 backdrop-blur-md border transition-all relative overflow-hidden ${
                          isUnlocked
                            ? `bg-gradient-to-br ${badge.color} shadow-md border-primary/30 scale-[1.01]`
                            : "bg-card/10 border-border/20 opacity-55"
                        }`}
                      >
                        <div className="flex items-start gap-4">
                          <div className={`h-12 w-12 rounded-xl flex items-center justify-center text-3xl shadow-inner bg-background/45 ${!isUnlocked && "grayscale"}`}>
                            {badge.icon}
                          </div>
                          
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <h3 className={`font-bold text-sm leading-none ${isUnlocked ? badge.textClass : "text-muted-foreground"}`}>
                                {badge.name}
                              </h3>
                              {isUnlocked ? (
                                <Badge className="bg-primary/20 text-primary hover:bg-primary/20 text-[9px] py-0 px-1 border-0">
                                  Unlocked
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-[9px] text-muted-foreground/60 py-0 px-1 border-border/20 font-mono">
                                  Locked
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground/90 leading-normal">
                              {badge.description}
                            </p>
                          </div>
                        </div>

                        {/* Lock / Unlock background decoration */}
                        {!isUnlocked && (
                          <div className="absolute top-2 right-2 p-1 text-muted-foreground/35">
                            <Lock className="h-3.5 w-3.5" />
                          </div>
                        )}
                        {isUnlocked && (
                          <div className="absolute top-2 right-2 p-1 text-primary/45">
                            <CheckCircle2 className="h-4 w-4" />
                          </div>
                        )}
                      </Card>
                    );
                  })}
                </div>
              </motion.div>

              {/* Citizen Personal Reports Logs */}
              <motion.div variants={itemVariants} className="space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
                    <Activity className="h-5.5 w-5.5 text-primary" /> My Grievance Submissions
                  </h2>
                  <Button
                    id="btn-report-redirect"
                    size="sm"
                    onClick={() => onNavigate("/report")}
                    className="bg-primary text-black font-semibold hover:bg-primary/90 text-xs py-1.5 px-3.5 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" /> Report New Issue
                  </Button>
                </div>

                {userReports.length === 0 ? (
                  <Card className="border-border/40 bg-card/20 p-8 text-center backdrop-blur-md">
                    <Compass className="h-10 w-10 text-muted-foreground/50 mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground font-medium mb-4">You haven't submitted any civic reports yet.</p>
                    <Button
                      id="btn-first-report"
                      variant="outline"
                      onClick={() => onNavigate("/report")}
                      className="text-xs border-primary/20 text-primary hover:bg-primary/10 cursor-pointer"
                    >
                      Submit Your First Report (+10 Points)
                    </Button>
                  </Card>
                ) : (
                  <div className="space-y-3.5">
                    {userReports.map((report) => (
                      <Card
                        key={report.id}
                        className="bg-card/30 border-border/30 hover:border-border/50 transition-colors p-5 backdrop-blur-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm"
                      >
                        <div className="flex items-start gap-4">
                          {report.imageUrl ? (
                            <img
                              src={report.imageUrl}
                              alt={report.issueType}
                              referrerPolicy="no-referrer"
                              className="h-12 w-12 rounded-lg object-cover bg-muted shrink-0 shadow-inner"
                            />
                          ) : (
                            <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center font-bold text-muted-foreground text-xs shrink-0">
                              No Pic
                            </div>
                          )}
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-bold text-sm text-foreground leading-none">{report.issueType}</h3>
                              <Badge className={`text-[9px] py-0 px-1.5 ${
                                report.severity?.toLowerCase() === "critical" || report.severity?.toLowerCase() === "high" ? "bg-red-950/40 text-red-400 border-red-500/20" :
                                report.severity?.toLowerCase() === "medium" ? "bg-yellow-950/40 text-yellow-400 border-yellow-500/20" :
                                "bg-green-950/40 text-green-400 border-green-500/20"
                              }`}>
                                {report.severity}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground/90 font-medium mb-1">{report.location}</p>
                            {report.description && (
                              <p className="text-xs text-muted-foreground italic line-clamp-1">
                                "{report.description}"
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-3 self-end sm:self-center">
                          <span className="text-[11px] font-semibold font-mono text-muted-foreground/80">{report.date}</span>
                          <Badge className={`text-xs py-0.5 px-2.5 rounded-full font-bold uppercase ${
                            report.status?.toLowerCase() === "resolved" ? "bg-green-500/10 text-green-400 border border-green-500/20" :
                            report.status?.toLowerCase() === "in progress" ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" :
                            "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"
                          }`}>
                            {report.status}
                          </Badge>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
        
      </div>
    </main>
  );
}
