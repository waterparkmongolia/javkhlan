export type SupportTier = 'starter' | 'star' | 'special' | 'super' | 'sponsor' | 'subscription' | 'custom';

export type AppTab = 'home' | 'team' | 'support' | 'tasks' | 'citizens' | 'apps' | 'book' | 'shop' | 'membership' | 'website' | 'lucky_draw' | 'lottery' | 'askify' | 'games' | 'magic' | 'zavgui' | 'profile' | 'learn' | 'happy';

export interface Lottery {
  id: string;
  type: string;
  kind: 'хожих_хүртэл' | 'насан_туршын';
  price: number;
  isActive: boolean;
  timestamp: any;
}

export interface AppEntry {
  id: string;
  name: string;
  type: string;
  logoUrl: string;
  link: string;
  description: string;
  timestamp: any;
}

export interface SupportAction {
  id: string;
  name: string;
  phone: string;
  amount: number;
  message: string;
  tier: SupportTier;
  timestamp: any; // Firestore Timestamp
  isSubscription?: boolean;
  age?: number;
  businessInfo?: string;
}

export interface Task {
  id: string;
  name: string;
  phone: string;
  description: string;
  supportAmount: number;
  likes: number;
  dislikes: number;
  superSupportTotal: number;
  timestamp: any;
  status: 'pending' | 'in-progress' | 'completed';
  imageUrl?: string;
  takenBy?: string;
}

export interface ChatMessage {
  id: string;
  senderName: string;
  text: string;
  timestamp: any;
  likes: number;
  imageUrl?: string;
}

export interface TeamCandidate {
  id: string;
  name: string;
  phone: string;
  profession: string;
  description: string;
  votes: number;
  timestamp: any;
  isTeamMember: boolean;
}

export interface Stats {
  totalAmount: number;
  totalSupporters: number;
  totalSupported: number;
  totalSubscribers: number;
  totalHelpRequests?: number;
  totalSuggestions?: number;
  tierCounts: Record<SupportTier, number>;
  profileImageUrl?: string;
  coverImageUrl?: string;
  fullName?: string;
  username?: string;
}

export interface HelpRequest {
  id: string;
  name: string;
  phone: string;
  content: string;
  amount: number;
  timestamp: any;
}

export interface Suggestion {
  id: string;
  name: string;
  phone: string;
  content: string;
  amount: number;
  timestamp: any;
}

export interface CRARating {
  id: string;
  type: 'free' | 'paid';
  rating: number; // 1-100
  timestamp: any;
  userName?: string;
}

export interface CRCReport {
  id: string;
  type: 'good' | 'bad';
  reason: string;
  credit: number;
  timestamp: any;
  userName?: string;
}

export interface CTRRating {
  id: string;
  type: 'free' | 'paid';
  rating: number; // 1-100
  timestamp: any;
  userName?: string;
}

export interface BiographyEntry {
  id: string;
  projectName: string;
  totalCost: number;
  description: string;
  imageUrl?: string;
  peopleInvolved: string;
  timestamp: any;
}

export const TIER_CONFIG: Record<SupportTier, { label: string; amount: number; color: string; description?: string }> = {
  starter: { label: 'Starter', amount: 2000, color: 'bg-blue-500' },
  star: { label: 'Star', amount: 20000, color: 'bg-purple-500' },
  special: { label: 'Special', amount: 200000, color: 'bg-pink-500' },
  super: { label: 'Super', amount: 2000000, color: 'bg-amber-500' },
  sponsor: { label: 'Sponsor', amount: 20000000, color: 'bg-emerald-500' },
  subscription: { label: 'Subscription', amount: 5000, color: 'bg-rose-500', description: 'Сар бүр тогтмол' },
  custom: { label: 'Custom', amount: 0, color: 'bg-slate-500' },
};
