// src/lib/db.ts

import { MongoClient, Db, Document, MongoClientOptions } from "mongodb";
import { logError, logDebug } from "./logger";

const uri = process.env.MONGODB_URI ?? "";
if (!uri) {
  throw new Error("MONGODB_URI is not set in the environment variables.");
}

const dbName = process.env.DB_NAME || "secureGroupChat";

let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

export async function connectToDatabase(): Promise<{
  client: MongoClient;
  db: Db;
}> {
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  try {
    const client = await MongoClient.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    } as MongoClientOptions);
    const db = client.db(dbName);

    cachedClient = client;
    cachedDb = db;

    logDebug("Connected to MongoDB successfully");
    return { client, db };
  } catch (err) {
    logError("MongoDB Connection Error:", err);
    throw err;
  }
}

export async function findOne<T extends Document>(
  collectionName: string,
  query: Document,
): Promise<T | null> {
  const { db } = await connectToDatabase();
  return db.collection(collectionName).findOne(query) as Promise<T | null>;
}

export async function find<T extends Document>(
  collectionName: string,
  query: Document = {},
): Promise<T[]> {
  const { db } = await connectToDatabase();
  return (await db
    .collection(collectionName)
    .find(query)
    .toArray()) as unknown as Promise<T[]>;
}

export async function insertOne<T extends Document>(
  collectionName: string,
  document: T,
): Promise<T> {
  const { db } = await connectToDatabase();
  const result = await db.collection(collectionName).insertOne(document);
  if (result.insertedId) {
    return { ...document, _id: result.insertedId };
  }
  throw new Error("Failed to insert document");
}

export async function updateOne(
  collectionName: string,
  query: Document,
  update: Document,
): Promise<boolean> {
  const { db } = await connectToDatabase();
  const result = await db
    .collection(collectionName)
    .updateOne(query, { $set: update });
  return result.modifiedCount === 1;
}

export async function deleteOne(
  collectionName: string,
  query: Document,
): Promise<boolean> {
  const { db } = await connectToDatabase();
  const result = await db.collection(collectionName).deleteOne(query);
  return result.deletedCount === 1;
}

export const mongoDB = {
  connectToDatabase,
  findOne,
  find,
  insertOne,
  updateOne,
  deleteOne,
};
