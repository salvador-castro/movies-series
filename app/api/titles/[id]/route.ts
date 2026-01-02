import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/db";
import { plataformas } from "@/lib/titles-constants";

type Ctx = { params: Promise<{ id: string }> };

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

export async function PATCH(req: NextRequest, { params }: Ctx) {
    const { id } = await params;

    if (!ObjectId.isValid(id)) {
        return NextResponse.json({ error: "id inválido", received: id }, { status: 400 });
    }

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
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

    if (!plataformas.includes(platform)) {
        return NextResponse.json({ error: "platform inválida" }, { status: 400 });
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

    const update = {
        title: String(title),
        kind,
        state,
        platform,
        rating,
        imdbId: imdb !== null ? String(imdb) : null,
        filmaffinityId: fa !== null ? String(fa) : null,
        genres: Array.isArray(genres) ? genres.map(String) : [],
        notePre: String(notePre),
        notePost: state === "vista" ? String(notePost) : "",
        updatedAt: new Date(),
    };

    const db = await getDb();
    const res = await db.collection("titles").updateOne(
        { _id: new ObjectId(id) },
        { $set: update }
    );

    if (res.matchedCount === 0) {
        return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
    const { id } = await params;

    if (!ObjectId.isValid(id)) {
        return NextResponse.json({ error: "id inválido", received: id }, { status: 400 });
    }

    const db = await getDb();
    const res = await db.collection("titles").deleteOne({ _id: new ObjectId(id) });

    if (res.deletedCount === 0) {
        return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
}
