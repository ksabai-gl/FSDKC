import { MongoClient } from 'mongodb';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { getSeedDocuments } from './seed-data.js';

let client = null;
let db = null;
let memoryServer = null;
let usingMemory = false;
let dbName = 'klearcom';

function getDbName() {
  return process.env.MONGODB_DB_NAME || 'klearcom';
}

function maskUri(uri) {
  return uri.replace(/:([^:@]+)@/, ':****@');
}

export async function connectMongo() {
  dbName = getDbName();
  const externalUri = process.env.MONGODB_URI;

  if (externalUri) {
    client = new MongoClient(externalUri, {
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000,
    });
    await client.connect();
    db = client.db(dbName);
    usingMemory = false;
    console.log(`MongoDB Atlas connected → database: ${dbName}`);
    console.log(`URI: ${maskUri(externalUri)}`);
  } else {
    memoryServer = await MongoMemoryServer.create();
    const uri = memoryServer.getUri(dbName);
    client = new MongoClient(uri);
    await client.connect();
    db = client.db(dbName);
    usingMemory = true;
    console.log(`MongoDB in-memory started → database: ${dbName}`);
    console.log('Tip: set MONGODB_URI in dev-api/.env to use Atlas');
  }

  await db.collection('transcripts').createIndex({ module: 1, reference_id: 1, created_at: -1 });
  await db.collection('test_events').createIndex({ session_id: 1, created_at: 1 });
  await db.collection('call_diagnostics').createIndex({ module: 1, reference_id: 1 });

  return db;
}

export function getDb() {
  if (!db) throw new Error('MongoDB not connected');
  return db;
}

export function getDbInfo() {
  return { name: dbName, mode: usingMemory ? 'in-memory' : 'atlas' };
}

export function isUsingMemory() {
  return usingMemory;
}

export async function healthCheck() {
  try {
    const result = await getDb().command({ ping: 1 });
    const transcripts = await getDb().collection('transcripts').countDocuments();
    const events = await getDb().collection('test_events').countDocuments();
    const diagnostics = await getDb().collection('call_diagnostics').countDocuments();
    const info = getDbInfo();

    return {
      connected: result?.ok === 1,
      mode: info.mode,
      database: info.name,
      collections: { transcripts, test_events: events, diagnostics },
    };
  } catch (err) {
    return { connected: false, error: err.message, database: dbName };
  }
}

export async function storeTranscript(module, referenceId, payload) {
  const doc = {
    module,
    reference_id: referenceId,
    payload,
    created_at: new Date(),
  };
  const result = await getDb().collection('transcripts').insertOne(doc);
  return { ...doc, _id: result.insertedId };
}

export async function storeTestEvent(sessionId, module, referenceId, event) {
  const doc = {
    session_id: sessionId,
    module,
    reference_id: referenceId,
    event,
    created_at: new Date(),
  };
  const result = await getDb().collection('test_events').insertOne(doc);
  return { ...doc, _id: result.insertedId };
}

export async function storeDiagnostic(module, referenceId, data) {
  const doc = {
    module,
    reference_id: referenceId,
    ...data,
    created_at: new Date(),
  };
  const result = await getDb().collection('call_diagnostics').insertOne(doc);
  return { ...doc, _id: result.insertedId };
}

export async function getTranscripts(module, referenceId) {
  return getDb()
    .collection('transcripts')
    .find({ module, reference_id: referenceId })
    .sort({ created_at: -1 })
    .limit(50)
    .toArray();
}

export async function getTestEvents(sessionId) {
  return getDb()
    .collection('test_events')
    .find({ session_id: sessionId })
    .sort({ created_at: 1 })
    .toArray();
}

export async function seedMongoData(force = false) {
  const transcripts = getDb().collection('transcripts');
  const diagnostics = getDb().collection('call_diagnostics');
  const { transcripts: seedTranscripts, diagnostics: seedDiagnostics } = getSeedDocuments();

  const existing = await transcripts.countDocuments({ app: 'klearcom' });
  const legacyCount = await transcripts.countDocuments({ app: { $exists: false } });

  if (!force && (existing > 0 || legacyCount > 0)) {
    console.log(`MongoDB [${dbName}] has ${existing + legacyCount} transcripts — skipping seed`);
    return { seeded: false, count: existing + legacyCount };
  }

  if (force) {
    await transcripts.deleteMany({ app: 'klearcom' });
    await diagnostics.deleteMany({ app: 'klearcom' });
  }

  const taggedTranscripts = seedTranscripts.map((d) => ({ ...d, app: 'klearcom' }));
  const taggedDiagnostics = seedDiagnostics.map((d) => ({ ...d, app: 'klearcom' }));

  await transcripts.insertMany(taggedTranscripts);
  await diagnostics.insertMany(taggedDiagnostics);

  console.log(`MongoDB [${dbName}] seeded: ${taggedTranscripts.length} transcripts, ${taggedDiagnostics.length} diagnostics`);
  return { seeded: true, transcripts: taggedTranscripts.length, diagnostics: taggedDiagnostics.length };
}

export async function closeMongo() {
  if (client) await client.close();
  if (memoryServer) await memoryServer.stop();
}
