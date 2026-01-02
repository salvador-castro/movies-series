import clientPromise from "@/lib/mongodb";

const DB_NAME = process.env.MONGODB_DB || "movies_series";

export async function getDb() {
    const client = await clientPromise;
    return client.db(DB_NAME);
}
