import type { ComplaintDomain } from "@/lib/complaint";

export type DraftAiMeta = {
  severityScore: number;
  severityLabel: string;
  routedDepartment: string;
  intent?: string;
  entities?: Record<string, string[]>;
};

export type LocalComplaintItem = {
  id: string;
  referenceId: string;
  domain: ComplaintDomain;
  createdAt: string;
  draftSubject: string;
  draftBody?: string;
  issueText?: string;
  locationLabel?: string;
  ai?: DraftAiMeta;
  emailSent: boolean;
  languageLabel?: string;
};

const STORAGE_KEY_PREFIX = "jansetu_local_complaints_";

/**
 * Lists locally stored complaints for a user.
 * This is used for quick UI rendering and offline support.
 */
export function listLocalComplaints(userId: string, limit: number = 25): LocalComplaintItem[] {
  if (typeof window === "undefined") return [];
  try {
    const saved = localStorage.getItem(STORAGE_KEY_PREFIX + userId);
    if (!saved) return [];
    const items = JSON.parse(saved) as LocalComplaintItem[];
    // Ensure they are sorted by date desc
    return items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, limit);
  } catch {
    return [];
  }
}

/**
 * Finds a specific local complaint by its referenceId.
 */
export function findLocalComplaint(userId: string, referenceId: string): LocalComplaintItem | null {
  if (typeof window === "undefined") return null;
  try {
    const saved = localStorage.getItem(STORAGE_KEY_PREFIX + userId);
    if (!saved) return null;
    const items = JSON.parse(saved) as LocalComplaintItem[];
    return items.find((x) => x.referenceId === referenceId) ?? null;
  } catch {
    return null;
  }
}

/**
 * Merges remote complaints into the local store.
 */
export function mergeLocalComplaints(userId: string, remoteItems: LocalComplaintItem[]): void {
  if (typeof window === "undefined") return;
  try {
    const saved = localStorage.getItem(STORAGE_KEY_PREFIX + userId);
    const localItems = saved ? (JSON.parse(saved) as LocalComplaintItem[]) : [];
    
    // Create a map to deduplicate by referenceId
    const map = new Map<string, LocalComplaintItem>();
    
    // Add local items first
    localItems.forEach(item => {
      if (item.referenceId) map.set(item.referenceId, item);
    });
    
    // Add remote items (overwrite existing ones as remote is source of truth for synced data)
    remoteItems.forEach(item => {
      if (item.referenceId) {
        const existing = map.get(item.referenceId);
        map.set(item.referenceId, { ...existing, ...item });
      }
    });
    
    const merged = Array.from(map.values()).sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    
    // Keep a reasonable number of local items
    localStorage.setItem(STORAGE_KEY_PREFIX + userId, JSON.stringify(merged.slice(0, 100)));
  } catch {
    // ignore
  }
}
