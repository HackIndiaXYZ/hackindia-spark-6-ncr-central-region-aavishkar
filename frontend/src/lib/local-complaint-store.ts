import type { ComplaintDomain } from "@/lib/complaint";

const DB_NAME = "jansetu-local-complaints";
const DB_VERSION = 1;
const STORE_NAME = "complaints";
const MAX_LOCAL_ITEMS = 30;

export type LocalAttachmentKind = "image" | "video";

export type LocalAttachment = {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  kind: LocalAttachmentKind;
  blob: Blob;
};

export type LocalComplaint = {
  id: string;
  accountKey: string;
  createdAt: string;
  referenceId?: string;
  domain: ComplaintDomain;
  issueText: string;
  draft: { subject: string; body: string };
  attachments: LocalAttachment[];
};

function openDb() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: "id" });
        store.createIndex("accountKey_createdAt", ["accountKey", "createdAt"], { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Failed to open local DB"));
  });
}

async function withStore<T>(
  mode: IDBTransactionMode,
  action: (store: IDBObjectStore, tx: IDBTransaction) => void,
): Promise<T> {
  const db = await openDb();
  return new Promise<T>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, mode);
    const store = tx.objectStore(STORE_NAME);
    action(store, tx);
    tx.oncomplete = () => db.close();
    tx.onerror = () => {
      db.close();
      reject(tx.error ?? new Error("IndexedDB transaction failed"));
    };
    tx.onabort = () => {
      db.close();
      reject(tx.error ?? new Error("IndexedDB transaction aborted"));
    };
    (tx as IDBTransaction & { __result?: T }).__result = undefined;
    const done = () => resolve((tx as IDBTransaction & { __result?: T }).__result as T);
    tx.addEventListener("complete", done, { once: true });
  });
}

export async function saveComplaintDraftLocal(complaint: LocalComplaint) {
  await withStore<void>("readwrite", (store, tx) => {
    store.put(complaint);
    (tx as IDBTransaction & { __result?: void }).__result = undefined;
  });
  await trimOldComplaints(complaint.accountKey);
}

export async function listComplaintsLocal(accountKey: string): Promise<LocalComplaint[]> {
  return withStore<LocalComplaint[]>("readonly", (store, tx) => {
    const index = store.index("accountKey_createdAt");
    const range = IDBKeyRange.bound([accountKey, ""], [accountKey, "\uffff"]);
    const req = index.getAll(range);
    req.onsuccess = () => {
      const rows = (req.result ?? []) as LocalComplaint[];
      rows.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
      (tx as IDBTransaction & { __result?: LocalComplaint[] }).__result = rows;
    };
  });
}

export async function listAllComplaintsLocal(): Promise<LocalComplaint[]> {
  return withStore<LocalComplaint[]>("readonly", (store, tx) => {
    const req = store.getAll();
    req.onsuccess = () => {
      const rows = (req.result ?? []) as LocalComplaint[];
      rows.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
      (tx as IDBTransaction & { __result?: LocalComplaint[] }).__result = rows;
    };
  });
}

export async function getComplaintByIdLocal(id: string): Promise<LocalComplaint | null> {
  return withStore<LocalComplaint | null>("readonly", (store, tx) => {
    const req = store.get(id);
    req.onsuccess = () => {
      (tx as IDBTransaction & { __result?: LocalComplaint | null }).__result =
        (req.result as LocalComplaint | undefined) ?? null;
    };
  });
}

export async function deleteAttachmentLocal(complaintId: string, attachmentId: string) {
  const row = await getComplaintByIdLocal(complaintId);
  if (!row) return;
  const next: LocalComplaint = {
    ...row,
    attachments: row.attachments.filter((a) => a.id !== attachmentId),
  };
  await saveComplaintDraftLocal(next);
}

async function trimOldComplaints(accountKey: string) {
  const rows = await listComplaintsLocal(accountKey);
  if (rows.length <= MAX_LOCAL_ITEMS) return;
  const staleIds = rows.slice(MAX_LOCAL_ITEMS).map((x) => x.id);
  await withStore<void>("readwrite", (store, tx) => {
    for (const id of staleIds) store.delete(id);
    (tx as IDBTransaction & { __result?: void }).__result = undefined;
  });
}
