import { MongoClient, type MongoClientOptions, type ObjectId } from "mongodb";
import type { ComplaintDomain } from "@/lib/complaint";
import { getMongoUri } from "@/lib/server-env";
import { memoryDb, type MemoryComplaint, type MemoryUser } from "@/lib/memory-db";

const globalForMongo = globalThis as unknown as { mongo?: MongoClient };

export type UserRecord = {
  _id: ObjectId;
  email: string;
  username: string;
  phone?: string;
  passwordHash: string;
  createdAt: Date;
};

type UserInsert = Omit<UserRecord, "_id">;

export type ComplaintRecord = {
  _id: ObjectId;
  userId: string;
  domain: ComplaintDomain;
  languageLabel: string;
  issueText: string;
  location?: { lng: number; lat: number; label?: string };
  draft: { subject: string; body: string };
  ai?: MemoryComplaint["ai"];
  referenceId: string;
  emailSent: boolean;
  createdAt: Date;
};

const mongoOptions: MongoClientOptions = {
  serverSelectionTimeoutMS: 2000,
};

async function getClient(): Promise<MongoClient | null> {
  const uri = getMongoUri();
  if (!uri) return null;
  try {
    if (!globalForMongo.mongo) {
      globalForMongo.mongo = new MongoClient(uri, mongoOptions);
      await globalForMongo.mongo.connect();
    }
    return globalForMongo.mongo;
  } catch {
    try {
      await globalForMongo.mongo?.close();
    } catch {
      // ignore cleanup failure
    }
    globalForMongo.mongo = undefined;
    return null;
  }
}

async function withMongoFallback<T>(
  runMongo: (client: MongoClient) => Promise<T>,
  runMemory: () => Promise<T>,
): Promise<T> {
  const client = await getClient();
  if (!client) return runMemory();
  try {
    return await runMongo(client);
  } catch {
    try {
      await client.close();
    } catch {
      // ignore cleanup failure
    }
    globalForMongo.mongo = undefined;
    return runMemory();
  }
}

function toPublicUser(u: MemoryUser | UserRecord) {
  if ("_id" in u) {
    return { id: u._id.toHexString(), email: u.email, username: u.username, phone: u.phone };
  }
  return { id: u.id, email: u.email, username: u.username, phone: u.phone };
}

export const usersRepo = {
  async findByEmail(email: string): Promise<UserRecord | MemoryUser | null> {
    return withMongoFallback<UserRecord | MemoryUser | null>(
      async (client) =>
        client.db().collection<UserRecord>("users").findOne({
          email: email.trim().toLowerCase(),
        }),
      () => memoryDb.findUserByEmail(email),
    );
  },

  async create(input: {
    email: string;
    username: string;
    phone?: string;
    passwordHash: string;
  }): Promise<{ id: string }> {
    return withMongoFallback(
      async (client) => {
        const now = new Date();
        const doc: UserInsert = {
          email: input.email.trim().toLowerCase(),
          username: input.username.trim(),
          phone: input.phone?.trim(),
          passwordHash: input.passwordHash,
          createdAt: now,
        };
        const res = await client.db().collection<UserInsert>("users").insertOne(doc);
        return { id: res.insertedId.toHexString() };
      },
      async () => {
        const u = await memoryDb.createUser({
          email: input.email,
          username: input.username,
          phone: input.phone,
          passwordHash: input.passwordHash,
        });
        return { id: u.id };
      },
    );
  },

  toPublic(u: UserRecord | MemoryUser) {
    return toPublicUser(u);
  },
};

export const complaintsRepo = {
  async insert(row: Omit<MemoryComplaint, "id" | "createdAt"> & { id?: string }) {
    return withMongoFallback(
      async (client) => {
        const now = new Date();
        const doc = {
          userId: row.userId,
          domain: row.domain,
          languageLabel: row.languageLabel,
          issueText: row.issueText,
          location: row.location,
          draft: row.draft,
          ai: row.ai,
          referenceId: row.referenceId,
          emailSent: row.emailSent,
          createdAt: now,
        };
        const res = await client.db().collection<typeof doc>("complaints").insertOne(doc);
        return {
          id: res.insertedId.toHexString(),
          userId: row.userId,
          domain: row.domain,
          languageLabel: row.languageLabel,
          issueText: row.issueText,
          location: row.location,
          draft: row.draft,
          ai: row.ai,
          referenceId: row.referenceId,
          emailSent: row.emailSent,
          createdAt: now,
        };
      },
      () =>
        memoryDb.createComplaint({
          id: row.id ?? crypto.randomUUID(),
          userId: row.userId,
          domain: row.domain,
          languageLabel: row.languageLabel,
          issueText: row.issueText,
          location: row.location,
          draft: row.draft,
          ai: row.ai,
          referenceId: row.referenceId,
          emailSent: row.emailSent,
        }),
    );
  },

  async listForUser(userId: string, limit = 20) {
    return withMongoFallback<ComplaintRecord[] | MemoryComplaint[]>(
      (client) =>
        client
          .db()
          .collection<ComplaintRecord>("complaints")
          .find({ userId })
          .sort({ createdAt: -1 })
          .limit(limit)
          .toArray(),
      () => memoryDb.listComplaints(userId, limit),
    );
  },
};
