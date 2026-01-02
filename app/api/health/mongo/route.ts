import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export async function GET() {
    try {
        const client = await clientPromise;
        await client.db("admin").command({ ping: 1 });
        return NextResponse.json({ ok: true, mongo: "pong" });
    } catch (err: any) {
        return NextResponse.json(
            { ok: false, error: err?.message ?? "Mongo error" },
            { status: 500 }
        );
    }
}
