import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { plataformas } from "@/lib/titles-constants";

export const runtime = "nodejs";

type State = "para_ver" | "viendo" | "vista";
type Kind = "movie" | "series";

function normalizeDecimal(raw: any): string {
    return String(raw ?? "").trim().replace(",", ".");
}

function parseScore0to10(raw: any): number | null {
    const s = normalizeDecimal(raw);
    if (!s) return null;
    const n = Number(s);
    if (!Number.isFinite(n) || n < 0 || n > 10) return null;
    return Number(n.toFixed(1));
}

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get("q") || "").trim();
    const state = searchParams.get("state");
    const kind = searchParams.get("kind");

    const filter: any = {};
    if (state) filter.state = state;
    if (kind) filter.kind = kind;
    if (q) filter.title = { $regex: q, $options: "i" };

    const db = await getDb();
    const items = await db
        .collection("titles")
        .find(filter)
        .sort({ updatedAt: -1 })
        .limit(200)
        .toArray();

    return NextResponse.json({ items });
}

export async function POST(req: Request) {
    const body = await req.json().catch(() => null);
    if (!body) {
        return NextResponse.json({ error: "Body inválido" }, { status: 400 });
    }

    const {
        title,
        kind,
        state,
        platform,
        rating,
        imdbId,
        filmaffinityId,
        genres,
        notePre,
        notePost,
    } = body;

    if (!title || !kind || !platform || !notePre) {
        return NextResponse.json({ error: "Campos obligatorios faltantes" }, { status: 400 });
    }

    if (!["movie", "series"].includes(kind)) {
        return NextResponse.json({ error: "kind inválido" }, { status: 400 });
    }

    if (!["para_ver", "viendo", "vista"].includes(state)) {
        return NextResponse.json({ error: "state inválido" }, { status: 400 });
    }

    if (!plataformas.includes(platform)) {
        return NextResponse.json({ error: "platform inválida" }, { status: 400 });
    }

    if (!Array.isArray(genres) || genres.length === 0) {
        return NextResponse.json({ error: "Debe tener al menos un género" }, { status: 400 });
    }

    if (typeof rating !== "number" || rating < 1 || rating > 10) {
        return NextResponse.json({ error: "rating debe ser 1..10" }, { status: 400 });
    }

    const imdb = imdbId ? parseScore0to10(imdbId) : null;
    const fa = filmaffinityId ? parseScore0to10(filmaffinityId) : null;

    if (imdb !== null && fa !== null) {
        return NextResponse.json({ error: "IMDb y FilmAffinity son excluyentes" }, { status: 400 });
    }

    if (state === "vista" && !notePost) {
        return NextResponse.json(
            { error: "notePost es obligatorio cuando state es vista" },
            { status: 400 }
        );
    }

    const now = new Date();

    const doc = {
        title: String(title).trim(),
        kind,
        state,
        platform,
        rating,
        imdbId: imdb !== null ? String(imdb) : null,
        filmaffinityId: fa !== null ? String(fa) : null,
        genres: genres.map(String),
        notePre: String(notePre),
        notePost: state === "vista" ? String(notePost) : "",
        createdAt: now,
        updatedAt: now,
    };

    const db = await getDb();
    const res = await db.collection("titles").insertOne(doc);

    return NextResponse.json({ insertedId: res.insertedId });
}
