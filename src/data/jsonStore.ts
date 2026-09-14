import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

// process.cwd() (the project root when running `next dev`/`next start`) is used
// instead of __dirname, since Next.js bundles route handlers into .next/ and
// __dirname would no longer point at the source tree.
const DATA_DIR = path.join(process.cwd(), 'src', 'data', 'files');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

interface BaseRecord {
  id: string;
  createdAt: string;
  updatedAt: string;
}

// A tiny JSON-file-backed collection. Records are plain objects kept in
// memory (as the source of truth for reads) and flushed to disk on every
// write. Writes are chained through `writeQueue` so concurrent webhook
// requests can't interleave and corrupt the file.
export class JsonCollection<T extends BaseRecord> {
  private filePath: string;
  private records: T[];
  private writeQueue: Promise<void>;

  constructor(fileName: string) {
    ensureDataDir();
    this.filePath = path.join(DATA_DIR, fileName);
    this.records = this.load();
    this.writeQueue = Promise.resolve();
  }

  // Guards against a corrupt/partially-written file taking down the whole
  // app - this runs at module-load time (`new JsonCollection(...)` at the
  // top of orderRepository.ts etc.), so an unhandled throw here would fail
  // every route that imports it, not just one request.
  private load(): T[] {
    if (!fs.existsSync(this.filePath)) return [];

    let raw: string;
    try {
      raw = fs.readFileSync(this.filePath, 'utf8').trim();
    } catch (err) {
      console.error(`Failed to read ${this.filePath}, starting with an empty collection:`, err);
      return [];
    }

    if (!raw) return [];

    try {
      return JSON.parse(raw);
    } catch (err) {
      console.error(`Corrupt JSON in ${this.filePath}, starting with an empty collection:`, err);
      try {
        fs.renameSync(this.filePath, `${this.filePath}.corrupt-${Date.now()}`);
      } catch {
        // best-effort backup only - fall through either way
      }
      return [];
    }
  }

  // Errors are caught here (rather than left to reject `writeQueue`) so a
  // single failed write (disk full, permissions, etc.) doesn't permanently
  // poison the chain - every write after it would otherwise also reject,
  // silently killing persistence for the rest of the process's lifetime.
  private persist(): Promise<void> {
    const snapshot = JSON.stringify(this.records, null, 2);
    this.writeQueue = this.writeQueue
      .catch(() => {})
      .then(() => fs.promises.writeFile(this.filePath, snapshot))
      .catch((err) => {
        console.error(`Failed to write ${this.filePath}:`, err);
        throw err;
      });
    return this.writeQueue;
  }

  findOne(predicate: (record: T) => boolean): T | null {
    return this.records.find(predicate) || null;
  }

  findById(id: string): T | null {
    return this.findOne((r) => r.id === id);
  }

  findAll(): T[] {
    return [...this.records];
  }

  async insert(data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<T> {
    const now = new Date().toISOString();
    const record = { id: crypto.randomUUID(), createdAt: now, updatedAt: now, ...data } as T;
    this.records.push(record);
    await this.persist();
    return record;
  }

  // `record` must be a reference obtained from this collection (findById /
  // findOne / insert) - mutate its fields directly, then call save() to
  // bump updatedAt and flush to disk, similar to a Mongoose document.
  async save(record: T): Promise<T> {
    record.updatedAt = new Date().toISOString();
    await this.persist();
    return record;
  }
}
