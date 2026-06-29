// Dual-mode Firebase / localStorage persistent store with Google Maps coordinate support
import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  getFirestore, 
  collection, 
  addDoc, 
  getDocs, 
  onSnapshot, 
  query, 
  orderBy, 
  serverTimestamp, 
  doc, 
  getDocFromServer,
  getDoc,
  setDoc,
  updateDoc,
  limit
} from "firebase/firestore";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged, 
  updateProfile,
  User,
  GoogleAuthProvider,
  signInWithPopup
} from "firebase/auth";
import firebaseAppletConfig from "../../firebase-applet-config.json";
import { mockReports } from "./data";

// Type definitions
export interface Report {
  id: string;
  issueType: string;
  location: string;
  severity: string;
  status: string;
  date: string;
  description?: string;
  aiDescription?: string;
  imageUrl?: string;
  confidence?: number;
  lat?: number;
  lng?: number;
  reporterId?: string;
  reporterName?: string;
  verifiedBy?: string[];
  createdAt?: any;
}

export interface UserProfile {
  id: string;
  name: string;
  points: number;
  streak: number;
  lastReportDate?: string; // YYYY-MM-DD
  reportedCount: number;
  potholeCount: number;
  unlockedBadges: string[];
}

// Memory / LocalStorage fallback storage
const LOCAL_STORAGE_KEY = "nagar_ai_reports";
const LOCAL_PROFILE_KEY = "nagar_ai_profile";
const LOCAL_USER_ID_KEY = "nagar_ai_user_id";

// Active listeners for real-time sync when using localStorage
const listeners: ((reports: Report[]) => void)[] = [];
const profileListeners: ((profile: UserProfile) => void)[] = [];
const leaderboardListeners: ((leaderboard: UserProfile[]) => void)[] = [];

// Pre-seeded high-quality dummy citizen profiles for active leaderboard feel
const dummyLeaderboard: UserProfile[] = [
  { id: "dummy-1", name: "Civic Badger #384", points: 240, streak: 8, reportedCount: 12, potholeCount: 4, unlockedBadges: ["first-reporter", "community-guardian", "pothole-hunter", "civic-hero"] },
  { id: "dummy-2", name: "Alert Falcon #192", points: 180, streak: 5, reportedCount: 7, potholeCount: 2, unlockedBadges: ["first-reporter", "community-guardian"] },
  { id: "dummy-3", name: "Nagar Panther #847", points: 130, streak: 4, reportedCount: 4, potholeCount: 3, unlockedBadges: ["first-reporter", "pothole-hunter"] },
  { id: "dummy-4", name: "Urban Owl #211", points: 80, streak: 2, reportedCount: 2, potholeCount: 0, unlockedBadges: ["first-reporter"] },
  { id: "dummy-5", name: "Eco Otter #712", points: 40, streak: 1, reportedCount: 1, potholeCount: 0, unlockedBadges: ["first-reporter"] },
];

function getLocalStorageReports(): Report[] {
  if (typeof window === "undefined") return [];
  const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (!stored) {
    // Seed with mock reports on first load
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(mockReports));
    return mockReports;
  }
  try {
    return JSON.parse(stored);
  } catch (e) {
    return mockReports;
  }
}

function saveLocalStorageReports(reports: Report[]) {
  if (typeof window !== "undefined") {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(reports));
  }
}

function notifyListeners() {
  const currentReports = getLocalStorageReports();
  listeners.forEach((listener) => listener(currentReports));
}

// Firebase Initialization
let db: any = null;
let auth: any = null;
let useFirebase = false;

const firebaseConfig = {
  apiKey: firebaseAppletConfig.apiKey || (import.meta as any).env?.VITE_FIREBASE_API_KEY || "",
  authDomain: firebaseAppletConfig.authDomain || (import.meta as any).env?.VITE_FIREBASE_AUTH_DOMAIN || "",
  projectId: firebaseAppletConfig.projectId || (import.meta as any).env?.VITE_FIREBASE_PROJECT_ID || "",
  storageBucket: firebaseAppletConfig.storageBucket || (import.meta as any).env?.VITE_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: firebaseAppletConfig.messagingSenderId || (import.meta as any).env?.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: firebaseAppletConfig.appId || (import.meta as any).env?.VITE_FIREBASE_APP_ID || "",
};

if (firebaseConfig.apiKey && firebaseConfig.projectId) {
  try {
    const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    db = firebaseAppletConfig.firestoreDatabaseId 
      ? getFirestore(app, firebaseAppletConfig.firestoreDatabaseId) 
      : getFirestore(app);
    auth = getAuth(app);
    useFirebase = true;
    console.log("Firebase initialized successfully with Auth and custom Firestore database ID.");
    
    // Validate Connection to Firestore (Firebase Skill CRITICAL CONSTRAINT)
    const testConnection = async () => {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error: any) {
        if (error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration. Client is offline.");
        }
      }
    };
    testConnection();
  } catch (e) {
    console.warn("Firebase config present but failed to initialize. Falling back to local storage.", e);
    useFirebase = false;
  }
}

// Authentication active tracking
let currentAuthUser: User | null = null;
if (auth) {
  onAuthStateChanged(auth, (user) => {
    currentAuthUser = user;
  });
}

export async function signUpUser(email: string, password: string, name: string): Promise<User> {
  if (!useFirebase || !auth) {
    throw new Error("Firebase Auth is not initialized.");
  }
  try {
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    const user = credential.user;
    await updateProfile(user, { displayName: name });
    
    // Create their UserProfile document
    const defaultProfile: UserProfile = {
      id: user.uid,
      name: name,
      points: 10, // Start with 10 onboarding points!
      streak: 0,
      reportedCount: 0,
      potholeCount: 0,
      unlockedBadges: [],
    };
    await updateUserProfile(defaultProfile);
    
    return user;
  } catch (error: any) {
    console.error("Firebase Sign Up Error:", error);
    throw error;
  }
}

export async function signInUser(email: string, password: string): Promise<User> {
  if (!useFirebase || !auth) {
    throw new Error("Firebase Auth is not initialized.");
  }
  try {
    const credential = await signInWithEmailAndPassword(auth, email, password);
    const user = credential.user;
    
    // Ensure profile exists in Firestore, if not create one
    const profileDocRef = doc(db, "profiles", user.uid);
    const profileSnap = await getDoc(profileDocRef);
    if (!profileSnap.exists()) {
      const defaultProfile: UserProfile = {
        id: user.uid,
        name: user.displayName || generateAnonymousName(),
        points: 0,
        streak: 0,
        reportedCount: 0,
        potholeCount: 0,
        unlockedBadges: [],
      };
      await updateUserProfile(defaultProfile);
    }
    
    return user;
  } catch (error: any) {
    console.error("Firebase Sign In Error:", error);
    throw error;
  }
}

export async function signInWithGoogle(): Promise<User> {
  if (!useFirebase || !auth) {
    throw new Error("Firebase Auth is not initialized.");
  }
  try {
    const provider = new GoogleAuthProvider();
    const credential = await signInWithPopup(auth, provider);
    const user = credential.user;
    
    // Ensure profile exists in Firestore, if not create one
    const profileDocRef = doc(db, "profiles", user.uid);
    const profileSnap = await getDoc(profileDocRef);
    if (!profileSnap.exists()) {
      const defaultProfile: UserProfile = {
        id: user.uid,
        name: user.displayName || generateAnonymousName(),
        points: 10, // Start with 10 onboarding points!
        streak: 0,
        reportedCount: 0,
        potholeCount: 0,
        unlockedBadges: [],
      };
      await updateUserProfile(defaultProfile);
    }
    
    return user;
  } catch (error: any) {
    console.error("Firebase Google Sign In Error:", error);
    throw error;
  }
}

export async function signOutUser(): Promise<void> {
  if (useFirebase && auth) {
    await signOut(auth);
    currentAuthUser = null;
  }
}

export function subscribeToAuth(callback: (user: User | null) => void): () => void {
  if (useFirebase && auth) {
    const unsub = onAuthStateChanged(auth, (user) => {
      currentAuthUser = user;
      callback(user);
    });
    return unsub;
  }
  // Fallback for non-Firebase environments
  callback(null);
  return () => {};
}

export function getCurrentAuthUser(): User | null {
  return currentAuthUser;
}

// Firestore Error Handlers
enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: null,
      email: null,
      emailVerified: null,
      isAnonymous: null,
      tenantId: null,
      providerInfo: []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

/**
 * Generates an elegant anonymous civic name.
 */
export function generateAnonymousName(): string {
  const adjectives = ["Alert", "Civic", "Eco", "Guard", "Active", "Street", "Nagar", "City", "Green", "Urban"];
  const animals = ["Falcon", "Badger", "Otter", "Owl", "Beaver", "Squirrel", "Panther", "Fox", "Hedgehog", "Rabbit"];
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const anim = animals[Math.floor(Math.random() * animals.length)];
  const num = Math.floor(100 + Math.random() * 900);
  return `${adj} ${anim} #${num}`;
}

/**
 * Gets or creates a unique client-side session ID.
 */
export function getCurrentUserId(): string {
  if (useFirebase && auth?.currentUser) {
    return auth.currentUser.uid;
  }
  if (currentAuthUser) {
    return currentAuthUser.uid;
  }
  if (typeof window === "undefined") return "server-user";
  let uid = localStorage.getItem(LOCAL_USER_ID_KEY);
  if (!uid) {
    uid = `usr-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem(LOCAL_USER_ID_KEY, uid);
  }
  return uid;
}

/**
 * Gets or initializes the current user's gamification profile.
 */
export async function getUserProfile(): Promise<UserProfile> {
  const uid = getCurrentUserId();
  const defaultProfile: UserProfile = {
    id: uid,
    name: generateAnonymousName(),
    points: 0,
    streak: 0,
    reportedCount: 0,
    potholeCount: 0,
    unlockedBadges: [],
  };

  if (useFirebase && db) {
    const docRef = doc(db, "profiles", uid);
    try {
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data() as UserProfile;
        // Keep in sync with local storage
        localStorage.setItem(LOCAL_PROFILE_KEY, JSON.stringify(data));
        return data;
      } else {
        // Create initial profile in Firestore
        await setDoc(docRef, defaultProfile);
        localStorage.setItem(LOCAL_PROFILE_KEY, JSON.stringify(defaultProfile));
        return defaultProfile;
      }
    } catch (e) {
      console.warn("Error fetching profile from Firestore, using local fallback:", e);
    }
  }

  // Local Storage Fallback
  const stored = localStorage.getItem(LOCAL_PROFILE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      return defaultProfile;
    }
  }

  localStorage.setItem(LOCAL_PROFILE_KEY, JSON.stringify(defaultProfile));
  return defaultProfile;
}

/**
 * Updates the current user profile or any profile (if specified).
 */
export async function updateUserProfile(profile: UserProfile): Promise<void> {
  if (typeof window !== "undefined" && profile.id === getCurrentUserId()) {
    localStorage.setItem(LOCAL_PROFILE_KEY, JSON.stringify(profile));
  }

  if (useFirebase && db) {
    const docRef = doc(db, "profiles", profile.id);
    try {
      await setDoc(docRef, profile, { merge: true });
    } catch (e) {
      console.error("Failed to update profile in Firestore:", e);
    }
  }

  // Notify profile listeners
  if (profile.id === getCurrentUserId()) {
    profileListeners.forEach((listener) => listener(profile));
  }
  
  // Trigger leaderboard refresh
  notifyLeaderboardListeners();
}

/**
 * Subscribes to real-time changes of the current user profile.
 */
export function subscribeToUserProfile(callback: (profile: UserProfile) => void): () => void {
  const uid = getCurrentUserId();
  
  if (useFirebase && db) {
    const docRef = doc(db, "profiles", uid);
    const unsub = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as UserProfile;
        localStorage.setItem(LOCAL_PROFILE_KEY, JSON.stringify(data));
        callback(data);
      }
    }, (error) => {
      console.warn("Firestore profile subscription error, falling back to local profile:", error);
      getUserProfile().then(callback);
    });
    return unsub;
  }

  // LocalStorage subscription fallback
  profileListeners.push(callback);
  getUserProfile().then(callback);

  return () => {
    const idx = profileListeners.indexOf(callback);
    if (idx !== -1) {
      profileListeners.splice(idx, 1);
    }
  };
}

/**
 * Merges real user profiles with dummy pre-seeded ones to construct active Leaderboard.
 */
async function notifyLeaderboardListeners() {
  const currentLeaderboard = await getLeaderboard();
  leaderboardListeners.forEach((listener) => listener(currentLeaderboard));
}

/**
 * Gets the active Top 5 Leaderboard, merging real and dummy active data.
 */
export async function getLeaderboard(): Promise<UserProfile[]> {
  let realProfiles: UserProfile[] = [];

  if (useFirebase && db) {
    try {
      const q = query(collection(db, "profiles"), orderBy("points", "desc"), limit(10));
      const snap = await getDocs(q);
      snap.forEach((docSnap) => {
        realProfiles.push(docSnap.data() as UserProfile);
      });
    } catch (e) {
      console.warn("Failed to retrieve leaderboard from Firestore:", e);
    }
  }

  // If local profile isn't in realProfiles, include it
  const localProfile = await getUserProfile();
  if (!realProfiles.find((p) => p.id === localProfile.id)) {
    realProfiles.push(localProfile);
  }

  // Blend with pre-seeded dummy leaderboard profiles
  const merged = [...realProfiles];
  dummyLeaderboard.forEach((dummy) => {
    if (!merged.find((p) => p.id === dummy.id || p.name === dummy.name)) {
      merged.push(dummy);
    }
  });

  // Sort and pick top 5
  merged.sort((a, b) => b.points - a.points);
  return merged.slice(0, 5);
}

/**
 * Subscribes to real-time updates for the citizen leaderboard.
 */
export function subscribeToLeaderboard(callback: (leaderboard: UserProfile[]) => void): () => void {
  if (useFirebase && db) {
    const unsub = onSnapshot(collection(db, "profiles"), () => {
      getLeaderboard().then(callback);
    }, (error) => {
      console.warn("Firestore leaderboard subscription error, falling back:", error);
      getLeaderboard().then(callback);
    });
    return unsub;
  }

  // Local Storage fallback
  leaderboardListeners.push(callback);
  getLeaderboard().then(callback);

  return () => {
    const idx = leaderboardListeners.indexOf(callback);
    if (idx !== -1) {
      leaderboardListeners.splice(idx, 1);
    }
  };
}

/**
 * Verifies a reported issue, adding +5 verification points to the reporter.
 */
export async function verifyReport(reportId: string): Promise<boolean> {
  const uid = getCurrentUserId();
  let reporterId = "";
  let success = false;

  if (useFirebase && db) {
    const reportRef = doc(db, "reports", reportId);
    try {
      const snap = await getDoc(reportRef);
      if (snap.exists()) {
        const reportData = snap.data() as Report;
        const verifiedBy = reportData.verifiedBy || [];
        if (verifiedBy.includes(uid)) return false; // Already verified by this user
        
        const newVerifiedBy = [...verifiedBy, uid];
        await updateDoc(reportRef, { verifiedBy: newVerifiedBy });
        reporterId = reportData.reporterId || "";
        success = true;

        if (reporterId && reporterId !== uid) {
          const reporterRef = doc(db, "profiles", reporterId);
          const reporterSnap = await getDoc(reporterRef);
          if (reporterSnap.exists()) {
            const reporterData = reporterSnap.data() as UserProfile;
            await updateDoc(reporterRef, { points: (reporterData.points || 0) + 5 });
          }
        }
      }
    } catch (e) {
      console.error("Failed to verify report in Firestore:", e);
    }
  } else {
    // Local storage fallback
    const reports = getLocalStorageReports();
    const reportIndex = reports.findIndex((r) => r.id === reportId);
    if (reportIndex !== -1) {
      const report = reports[reportIndex];
      const verifiedBy = report.verifiedBy || [];
      if (!verifiedBy.includes(uid)) {
        report.verifiedBy = [...verifiedBy, uid];
        saveLocalStorageReports(reports);
        reporterId = report.reporterId || "";
        success = true;
        notifyListeners();

        // If verified local user
        const localProfile = await getUserProfile();
        if (reporterId === localProfile.id) {
          localProfile.points += 5;
          await updateUserProfile(localProfile);
        }
      }
    }
  }

  return success;
}

/**
 * Saves a report to persistence (Firebase or LocalStorage).
 */
export async function saveReport(report: any): Promise<string> {
  const id = report.id || `rep-${Date.now()}`;
  const profile = await getUserProfile();
  
  const reportData = {
    issueType: report.issueType || "Other",
    location: report.location || "",
    severity: report.severity || "Medium",
    status: report.status || "Pending",
    date: new Date().toISOString().split("T")[0],
    description: report.description || "",
    aiDescription: report.aiDescription || "",
    imageUrl: report.imageUrl || "",
    confidence: report.confidence || 100,
    lat: typeof report.lat === "number" ? report.lat : null,
    lng: typeof report.lng === "number" ? report.lng : null,
    reporterId: profile.id,
    reporterName: profile.name,
    verifiedBy: [] as string[],
  };

  if (useFirebase && db) {
    const path = "reports";
    try {
      const docRef = await addDoc(collection(db, path), {
        ...reportData,
        createdAt: serverTimestamp(),
      });
      return docRef.id;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }

  // Fallback to localStorage
  const localReport: Report = {
    id,
    ...reportData,
    lat: reportData.lat ?? undefined,
    lng: reportData.lng ?? undefined,
    createdAt: new Date(),
  };

  const reports = getLocalStorageReports();
  reports.unshift(localReport);
  saveLocalStorageReports(reports);
  notifyListeners();
  return id;
}

/**
 * Fetches all reports.
 */
export async function getReports(): Promise<Report[]> {
  if (useFirebase && db) {
    const path = "reports";
    try {
      const q = query(collection(db, path), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      const fetchedReports: Report[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        fetchedReports.push({
          id: docSnap.id,
          issueType: data.issueType,
          location: data.location,
          severity: data.severity,
          status: data.status,
          date: data.date,
          description: data.description,
          aiDescription: data.aiDescription,
          imageUrl: data.imageUrl,
          confidence: data.confidence,
          lat: data.lat,
          lng: data.lng,
          reporterId: data.reporterId,
          reporterName: data.reporterName,
          verifiedBy: data.verifiedBy || [],
          createdAt: data.createdAt,
        });
      });
      return fetchedReports;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, path);
    }
  }
  return getLocalStorageReports();
}

/**
 * Subscribes to real-time updates of reports.
 */
export function subscribeToReports(callback: (reports: Report[]) => void): () => void {
  if (useFirebase && db) {
    const path = "reports";
    const q = query(collection(db, path), orderBy("createdAt", "desc"));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedReports: Report[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        fetchedReports.push({
          id: docSnap.id,
          issueType: data.issueType,
          location: data.location,
          severity: data.severity,
          status: data.status,
          date: data.date,
          description: data.description,
          aiDescription: data.aiDescription,
          imageUrl: data.imageUrl,
          confidence: data.confidence,
          lat: data.lat,
          lng: data.lng,
          reporterId: data.reporterId,
          reporterName: data.reporterName,
          verifiedBy: data.verifiedBy || [],
          createdAt: data.createdAt,
        });
      });
      callback(fetchedReports);
    }, (error) => {
      console.warn("Firestore reports subscription error, falling back to localStorage:", error);
      callback(getLocalStorageReports());
    });

    return unsubscribe;
  }

  // Fallback to localStorage
  listeners.push(callback);
  callback(getLocalStorageReports());

  return () => {
    const idx = listeners.indexOf(callback);
    if (idx !== -1) {
      listeners.splice(idx, 1);
    }
  };
}

/**
 * Updates citizen stats, streak, and checks badge unlocks upon reporting an issue.
 */
export async function processReportGamification(issueType: string): Promise<{ pointsEarned: number; streak: number; newlyUnlockedBadges: string[] }> {
  const profile = await getUserProfile();
  
  // 1. Every issue reported = +10 points
  let pointsEarned = 10;
  profile.reportedCount += 1;
  
  if (issueType.toLowerCase() === "pothole") {
    profile.potholeCount += 1;
  }
  
  // 2. Calculate streak
  const todayStr = new Date().toISOString().split("T")[0];
  let newStreak = profile.streak || 0;
  
  if (!profile.lastReportDate) {
    newStreak = 1;
  } else {
    const lastDate = new Date(profile.lastReportDate);
    // Parse without timezones to prevent boundary shifting issues
    const lastDateTime = new Date(profile.lastReportDate + "T00:00:00").getTime();
    const todayTime = new Date(todayStr + "T00:00:00").getTime();
    const diffTime = todayTime - lastDateTime;
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
      newStreak += 1;
    } else if (diffDays > 1) {
      newStreak = 1; // Reset streak if they missed a day
    }
    // If diffDays === 0, streak remains unchanged
  }
  
  profile.streak = newStreak;
  profile.lastReportDate = todayStr;
  profile.points += pointsEarned;
  
  // 3. Badge check
  const newlyUnlockedBadges: string[] = [];
  const existingBadges = profile.unlockedBadges || [];
  
  const checkBadge = (badgeId: string) => {
    if (!existingBadges.includes(badgeId)) {
      newlyUnlockedBadges.push(badgeId);
    }
  };
  
  // - "First Reporter" — submitted first issue
  if (profile.reportedCount >= 1) {
    checkBadge("first-reporter");
  }
  // - "Community Guardian" — 5+ issues reported
  if (profile.reportedCount >= 5) {
    checkBadge("community-guardian");
  }
  // - "Pothole Hunter" — 3+ pothole reports
  if (profile.potholeCount >= 3) {
    checkBadge("pothole-hunter");
  }
  // - "Civic Hero" — 10+ issues reported
  if (profile.reportedCount >= 10) {
    checkBadge("civic-hero");
  }
  
  profile.unlockedBadges = [...existingBadges, ...newlyUnlockedBadges];
  
  await updateUserProfile(profile);
  
  return {
    pointsEarned,
    streak: newStreak,
    newlyUnlockedBadges,
  };
}
