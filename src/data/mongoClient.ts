import { MongoClient, Db, ServerApiVersion } from 'mongodb';
import { env } from '@/config/env';

// Cached across invocations on the same warm serverless instance, so we
// don't open a new MongoDB connection on every request (Vercel functions
// reuse the module scope between invocations while the instance is warm).
let clientPromise: Promise<MongoClient> | null = null;

function connect(): Promise<MongoClient> {
  const client = new MongoClient(env.mongodb.uri, {
    serverApi: { version: ServerApiVersion.v1, strict: true, deprecationErrors: true },
    // Serverless functions are short-lived and can run many concurrently,
    // so keep the pool small per instance rather than the driver's default.
    maxPoolSize: 5,
    minPoolSize: 0,
    serverSelectionTimeoutMS: 10000,
  });
  return client.connect();
}

function getClientPromise(): Promise<MongoClient> {
  if (!clientPromise) {
    clientPromise = connect();
  }
  return clientPromise;
}

export async function getDb(): Promise<Db> {
  try {
    const client = await getClientPromise();
    return client.db(env.mongodb.dbName);
  } catch (err) {
    // A cached connection can go stale across cold starts (e.g. the TLS
    // session was torn down server-side) - drop it and reconnect once
    // instead of returning the same broken promise on every future call.
    clientPromise = null;
    const client = await getClientPromise();
    return client.db(env.mongodb.dbName);
  }
}
