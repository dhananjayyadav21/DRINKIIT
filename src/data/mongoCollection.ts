import { Collection, Filter } from 'mongodb';
import crypto from 'crypto';
import { getDb } from './mongoClient';

interface BaseRecord {
  id: string;
  createdAt: string;
  updatedAt: string;
}

// Mirrors the old JsonCollection API but backed by MongoDB, since Vercel's
// serverless filesystem is read-only (writing a JSON file on every save
// crashed in production). Records keep their own `id` (UUID) field instead
// of relying on Mongo's `_id`, so the rest of the app didn't need to change.
export class MongoCollection<T extends BaseRecord> {
  private collectionName: string;

  constructor(collectionName: string) {
    this.collectionName = collectionName;
  }

  private async getCollection(): Promise<Collection<T>> {
    const db = await getDb();
    return db.collection<T>(this.collectionName);
  }

  async findOne(filter: Filter<T>): Promise<T | null> {
    const collection = await this.getCollection();
    return collection.findOne(filter, { projection: { _id: 0 } }) as Promise<T | null>;
  }

  async findById(id: string): Promise<T | null> {
    return this.findOne({ id } as Filter<T>);
  }

  async findAll(): Promise<T[]> {
    const collection = await this.getCollection();
    return collection.find({}, { projection: { _id: 0 } }).toArray() as Promise<T[]>;
  }

  async insert(data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<T> {
    const now = new Date().toISOString();
    const record = { id: crypto.randomUUID(), createdAt: now, updatedAt: now, ...data } as T;
    const collection = await this.getCollection();
    await collection.insertOne(record as any);
    return record;
  }

  // `record` must be a full document (from findById/findOne/insert) - mutate
  // its fields directly, then call save() to bump updatedAt and persist it.
  async save(record: T): Promise<T> {
    record.updatedAt = new Date().toISOString();
    const collection = await this.getCollection();
    await collection.replaceOne({ id: record.id } as Filter<T>, record as any, { upsert: true });
    return record;
  }
}
