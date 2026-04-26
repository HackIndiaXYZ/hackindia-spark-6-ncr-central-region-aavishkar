import type { ComplaintDomain } from "@/lib/complaint";

export type MemoryUser = {
  id: string;
  email: string;
  username: string;
  phone?: string;
  passwordHash: string;
  createdAt: Date;
};

export type MemoryComplaint = {
  id: string;
  userId: string;
  domain: ComplaintDomain;
  languageLabel: string;
  issueText: string;
  location?: { lng: number; lat: number; label?: string };
  draft: { subject: string; body: string };
  ai?: {
    severityScore: number;
    severityLabel: string;
    routedDepartment: string;
    intent?: string;
    entities?: Record<string, string[]>;
  };
  referenceId: string;
  emailSent: boolean;
  createdAt: Date;
};

type Store = { users: MemoryUser[]; complaints: MemoryComplaint[] };

function getStore(): Store {
  const g = globalThis as unknown as { __jansetu_store?: Store };
  if (!g.__jansetu_store) g.__jansetu_store = { users: [], complaints: [] };
  return g.__jansetu_store;
}

export const memoryDb = {
  async findUserByEmail(email: string): Promise<MemoryUser | null> {
    const e = email.trim().toLowerCase();
    return getStore().users.find((u) => u.email.toLowerCase() === e) ?? null;
  },
  async createUser(input: Omit<MemoryUser, "id" | "createdAt"> & { id?: string }) {
    const user: MemoryUser = {
      id: input.id ?? crypto.randomUUID(),
      email: input.email.trim().toLowerCase(),
      username: input.username.trim(),
      phone: input.phone?.trim() || undefined,
      passwordHash: input.passwordHash,
      createdAt: new Date(),
    };
    getStore().users.push(user);
    return user;
  },
  async listUsers(limit = 500): Promise<MemoryUser[]> {
    return getStore().users.slice(0, limit);
  },
  async createComplaint(c: Omit<MemoryComplaint, "createdAt">) {
    const row: MemoryComplaint = { ...c, createdAt: new Date() };
    getStore().complaints.unshift(row);
    return row;
  },
  async listComplaints(userId: string, limit = 20): Promise<MemoryComplaint[]> {
    return getStore()
      .complaints.filter((x) => x.userId === userId)
      .slice(0, limit);
  },
  async listAllComplaints(limit = 100): Promise<MemoryComplaint[]> {
    return getStore().complaints.slice(0, limit);
  },
};
