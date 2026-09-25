import { MongoClient, Db } from 'mongodb';
import { env } from '@/config/env';

// Cached across invocations on the same warm serverless instance, so we
// don't open a new MongoDB connection on every request (Vercel functions
// reuse the module scope between invocations while the instance is warm).
let clientPromise: Promise<MongoClient> | null = null;

function getClientPromise(): Promise<MongoClient> {
  if (!clientPromise) {
    const client = new MongoClient(env.mongodb.uri);
    clientPromise = client.connect();
  }
  return clientPromise;
}

export async function getDb(): Promise<Db> {
  const client = await getClientPromise();
  return client.db(env.mongodb.dbName);
}
