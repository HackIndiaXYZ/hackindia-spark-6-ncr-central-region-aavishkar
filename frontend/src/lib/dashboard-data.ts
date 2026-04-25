// ─── Dashboard Demo Data ────────────────────────────────────────────────────

export type ComplaintStatus = "Pending" | "In Progress" | "Resolved" | "Rejected";
export type ComplaintSeverity = "Low" | "Medium" | "High" | "Critical";
export type ComplaintCategory =
  | "Corruption"
  | "Sanitation"
  | "Roads"
  | "Electricity"
  | "Water Supply"
  | "Noise Pollution"
  | "Public Safety"
  | "Encroachment";

export interface DashboardComplaint {
  id: string;
  title: string;
  category: ComplaintCategory;
  location: string;
  lat: number;
  lng: number;
  status: ComplaintStatus;
  severity: ComplaintSeverity;
  dateField: string;
  description: string;
  points: number;
  hasEvidence: boolean;
  hasPreciseLocation: boolean;
  timeline: TimelineStep[];
}

export interface TimelineStep {
  label: string;
  date: string;
  done: boolean;
  active: boolean;
}

export interface LeaderboardEntry {
  rank: number;
  name: string;
  avatar: string;
  points: number;
  level: string;
  badge: string;
  isCurrentUser?: boolean;
}

export interface Notification {
  id: string;
  type: "status" | "points" | "leaderboard" | "badge";
  message: string;
  time: string;
  read: boolean;
  icon: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  earned: boolean;
  earnedDate?: string;
  color: string;
}

// ─── Utility Functions ───────────────────────────────────────────────────────

export function getLevel(points: number): { label: string; next: number; color: string } {
  if (points < 50) return { label: "Civic Rookie", next: 50, color: "#6affed" };
  if (points < 150) return { label: "Contributor", next: 150, color: "#a080ff" };
  if (points < 400) return { label: "Active Citizen", next: 400, color: "#ffc448" };
  return { label: "City Guardian", next: Infinity, color: "#ff5da0" };
}

export function getLevelProgress(points: number): number {
  if (points < 50) return (points / 50) * 100;
  if (points < 150) return ((points - 50) / 100) * 100;
  if (points < 400) return ((points - 150) / 250) * 100;
  return 100;
}

export function getSeverityPoints(severity: ComplaintSeverity): number {
  const map: Record<ComplaintSeverity, number> = { Low: 5, Medium: 10, High: 20, Critical: 40 };
  return map[severity];
}

export function getStatusColor(status: ComplaintStatus): string {
  const map: Record<ComplaintStatus, string> = {
    Pending: "#ffc448",
    "In Progress": "#6affed",
    Resolved: "#4ade80",
    Rejected: "#ff5da0",
  };
  return map[status];
}

export function getSeverityColor(severity: ComplaintSeverity): string {
  const map: Record<ComplaintSeverity, string> = {
    Low: "#4ade80",
    Medium: "#ffc448",
    High: "#ff9500",
    Critical: "#ff5da0",
  };
  return map[severity];
}

// ─── Mock Data ───────────────────────────────────────────────────────────────

export const MOCK_COMPLAINTS: DashboardComplaint[] = [
  {
    id: "c001",
    title: "Broken street light near Connaught Place",
    category: "Electricity",
    location: "Connaught Place, New Delhi",
    lat: 28.6315,
    lng: 77.2167,
    status: "Resolved",
    severity: "High",
    dateField: "2026-04-01",
    description: "Multiple street lights have been non-functional for over 3 weeks causing safety issues at night.",
    points: 20,
    hasEvidence: true,
    hasPreciseLocation: true,
    timeline: [
      { label: "Filed", date: "Apr 1", done: true, active: false },
      { label: "Acknowledged", date: "Apr 2", done: true, active: false },
      { label: "In Progress", date: "Apr 5", done: true, active: false },
      { label: "Resolved", date: "Apr 8", done: true, active: true },
    ],
  },
  {
    id: "c002",
    title: "Garbage not collected for 2 weeks in Sector 15",
    category: "Sanitation",
    location: "Sector 15, Noida",
    lat: 28.5675,
    lng: 77.3143,
    status: "In Progress",
    severity: "Medium",
    dateField: "2026-04-10",
    description: "Garbage bins are overflowing and sanitation workers have not visited in 2 weeks.",
    points: 10,
    hasEvidence: true,
    hasPreciseLocation: true,
    timeline: [
      { label: "Filed", date: "Apr 10", done: true, active: false },
      { label: "Acknowledged", date: "Apr 11", done: true, active: false },
      { label: "In Progress", date: "Apr 13", done: false, active: true },
      { label: "Resolved", date: "—", done: false, active: false },
    ],
  },
  {
    id: "c003",
    title: "Pothole on NH-48 causing accidents",
    category: "Roads",
    location: "NH-48, Gurugram",
    lat: 28.4595,
    lng: 77.0266,
    status: "Pending",
    severity: "Critical",
    dateField: "2026-04-15",
    description: "A massive pothole on the highway has caused 3 minor accidents this week. Immediate attention needed.",
    points: 40,
    hasEvidence: true,
    hasPreciseLocation: true,
    timeline: [
      { label: "Filed", date: "Apr 15", done: true, active: true },
      { label: "Acknowledged", date: "—", done: false, active: false },
      { label: "In Progress", date: "—", done: false, active: false },
      { label: "Resolved", date: "—", done: false, active: false },
    ],
  },
  {
    id: "c004",
    title: "Water supply disruption – Ward 42",
    category: "Water Supply",
    location: "Ward 42, Delhi",
    lat: 28.7041,
    lng: 77.1025,
    status: "Rejected",
    severity: "Low",
    dateField: "2026-04-18",
    description: "Water supply has been irregular for 5 days. Residents are suffering.",
    points: 5,
    hasEvidence: false,
    hasPreciseLocation: false,
    timeline: [
      { label: "Filed", date: "Apr 18", done: true, active: false },
      { label: "Acknowledged", date: "Apr 19", done: true, active: false },
      { label: "Rejected", date: "Apr 20", done: true, active: true },
      { label: "Resolved", date: "—", done: false, active: false },
    ],
  },
  {
    id: "c005",
    title: "Encroachment on public park in Lajpat Nagar",
    category: "Encroachment",
    location: "Lajpat Nagar, Delhi",
    lat: 28.5665,
    lng: 77.2431,
    status: "In Progress",
    severity: "High",
    dateField: "2026-04-20",
    description: "Local vendors have encroached on the public park reducing space for residents.",
    points: 20,
    hasEvidence: true,
    hasPreciseLocation: true,
    timeline: [
      { label: "Filed", date: "Apr 20", done: true, active: false },
      { label: "Acknowledged", date: "Apr 21", done: true, active: false },
      { label: "In Progress", date: "Apr 22", done: false, active: true },
      { label: "Resolved", date: "—", done: false, active: false },
    ],
  },
  {
    id: "c006",
    title: "Corruption in ration shop – overcharging",
    category: "Corruption",
    location: "Rohini, Delhi",
    lat: 28.7089,
    lng: 77.1236,
    status: "Pending",
    severity: "Critical",
    dateField: "2026-04-22",
    description: "Ration shop owner is overcharging and denying rations to below-poverty families.",
    points: 40,
    hasEvidence: false,
    hasPreciseLocation: true,
    timeline: [
      { label: "Filed", date: "Apr 22", done: true, active: true },
      { label: "Acknowledged", date: "—", done: false, active: false },
      { label: "In Progress", date: "—", done: false, active: false },
      { label: "Resolved", date: "—", done: false, active: false },
    ],
  },
];

export const MOCK_USER = {
  name: "Rahul Sharma",
  email: "rahul.sharma@gmail.com",
  avatar: "RS",
  totalComplaints: 12,
  resolvedComplaints: 7,
  points: 285,
  streakDays: 5,
  trustScore: 87,
  joinedDate: "March 2026",
  profileCompletion: 82,
  anonymousMode: false,
};

export const MOCK_LEADERBOARD: LeaderboardEntry[] = [
  { rank: 1, name: "Priya Mehta", avatar: "PM", points: 1240, level: "City Guardian", badge: "🏆" },
  { rank: 2, name: "Vikram Singh", avatar: "VS", points: 987, level: "City Guardian", badge: "🥈" },
  { rank: 3, name: "Ananya Iyer", avatar: "AI", points: 834, level: "City Guardian", badge: "🥉" },
  { rank: 4, name: "Sanjay Kumar", avatar: "SK", points: 721, level: "City Guardian", badge: "⭐" },
  { rank: 5, name: "Deepika Rao", avatar: "DR", points: 634, level: "Active Citizen", badge: "🌟" },
  { rank: 6, name: "Arjun Nair", avatar: "AN", points: 589, level: "Active Citizen", badge: "✨" },
  { rank: 7, name: "Kavita Patel", avatar: "KP", points: 452, level: "Active Citizen", badge: "💫" },
  { rank: 8, name: "Rahul Sharma", avatar: "RS", points: 285, level: "Active Citizen", badge: "🎖️", isCurrentUser: true },
  { rank: 9, name: "Manish Joshi", avatar: "MJ", points: 241, level: "Contributor", badge: "🎗️" },
  { rank: 10, name: "Sneha Verma", avatar: "SV", points: 198, level: "Contributor", badge: "📌" },
];

export const MOCK_NOTIFICATIONS: Notification[] = [
  { id: "n1", type: "status", message: "Your complaint 'Broken street light' was Resolved! ✅", time: "2 min ago", read: false, icon: "✅" },
  { id: "n2", type: "points", message: "You earned +30 points for resolved complaint!", time: "2 min ago", read: false, icon: "⚡" },
  { id: "n3", type: "leaderboard", message: "You moved up 2 spots on the leaderboard! Now #8", time: "1 hour ago", read: false, icon: "🏆" },
  { id: "n4", type: "badge", message: "New badge earned: 'Fast Resolver' 🏅", time: "3 hours ago", read: true, icon: "🏅" },
  { id: "n5", type: "status", message: "Your complaint 'Garbage in Sector 15' is now In Progress", time: "1 day ago", read: true, icon: "🔄" },
];

export const MOCK_ACHIEVEMENTS: Achievement[] = [
  { id: "a1", title: "First Complaint", description: "Filed your very first complaint", icon: "🌱", earned: true, earnedDate: "Mar 15, 2026", color: "#4ade80" },
  { id: "a2", title: "5 Issues Reported", description: "Reported 5 civic issues", icon: "⭐", earned: true, earnedDate: "Apr 1, 2026", color: "#ffc448" },
  { id: "a3", title: "Fast Resolver", description: "Had a complaint resolved in 48 hours", icon: "⚡", earned: true, earnedDate: "Apr 8, 2026", color: "#6affed" },
  { id: "a4", title: "Community Watch", description: "Filed complaints in 3 different categories", icon: "👁️", earned: true, earnedDate: "Apr 12, 2026", color: "#a080ff" },
  { id: "a5", title: "10 Issues Reported", description: "Reported 10 civic issues", icon: "🔟", earned: false, color: "#9ca3af" },
  { id: "a6", title: "City Guardian", description: "Reach 400+ points", icon: "🛡️", earned: false, color: "#9ca3af" },
  { id: "a7", title: "Streak Master", description: "Maintain a 7-day streak", icon: "🔥", earned: false, color: "#9ca3af" },
  { id: "a8", title: "Evidence Expert", description: "Upload evidence for 5 complaints", icon: "📷", earned: false, color: "#9ca3af" },
];

export const MOCK_CHART_DATA = {
  complaintsOverTime: [
    { month: "Nov", count: 0 },
    { month: "Dec", count: 1 },
    { month: "Jan", count: 2 },
    { month: "Feb", count: 3 },
    { month: "Mar", count: 4 },
    { month: "Apr", count: 2 },
  ],
  resolutionRate: [
    { month: "Nov", rate: 0 },
    { month: "Dec", rate: 100 },
    { month: "Jan", rate: 50 },
    { month: "Feb", rate: 67 },
    { month: "Mar", rate: 75 },
    { month: "Apr", rate: 58 },
  ],
  categoryBreakdown: [
    { name: "Electricity", value: 1 },
    { name: "Sanitation", value: 2 },
    { name: "Roads", value: 2 },
    { name: "Water", value: 1 },
    { name: "Corruption", value: 2 },
    { name: "Encroachment", value: 1 },
    { name: "Others", value: 3 },
  ],
};

export const MOCK_AI_INSIGHTS = [
  {
    title: "Most common issue in your area",
    value: "Sanitation & Garbage",
    detail: "34% of complaints in Sector 15 are about garbage collection delays",
    icon: "🗑️",
    color: "#ffc448",
  },
  {
    title: "Best time to file complaints",
    value: "Tuesday – Thursday",
    detail: "Complaints filed mid-week are resolved 2x faster on average",
    icon: "⏰",
    color: "#6affed",
  },
  {
    title: "Predicted resolution time",
    value: "~4.2 days",
    detail: "Based on current government response patterns in your district",
    icon: "📊",
    color: "#a080ff",
  },
  {
    title: "Similar complaints near you",
    value: "7 Active Reports",
    detail: "Your neighbours have filed 7 similar complaints in the last 30 days",
    icon: "📍",
    color: "#ff5da0",
  },
];
