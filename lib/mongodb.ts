import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;
if (!uri) {
    throw new Error("❌ MONGODB_URI no está definida (Environment Variable en Vercel).");
}

declare global {
    // Evita múltiples conexiones en desarrollo
    // eslint-disable-next-line no-var
    var _mongoClientPromise: Promise<MongoClient> | undefined;
}

const options = {
    family: 4, // ✅ fuerza IPv4 (suele arreglar TLS/handshake en serverless)
    serverSelectionTimeoutMS: 10_000,
    connectTimeoutMS: 10_000,
};

let clientPromise: Promise<MongoClient>;

if (!global._mongoClientPromise) {
    const client = new MongoClient(uri, options);
    global._mongoClientPromise = client.connect();
}

clientPromise = global._mongoClientPromise;

export default clientPromise;
