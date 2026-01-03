import { NextResponse } from "next/server";
import React from "react";
import { renderToStream } from "@react-pdf/renderer";
import { Readable } from "node:stream";

import TitlesPDF from "@/app/components/titles/TitlesPDF";

// ✅ Para evitar Edge (React-PDF necesita Node runtime)
export const runtime = "nodejs";
// ✅ Para que no cachee y siempre salga actualizado
export const dynamic = "force-dynamic";

type TitleState = "para_ver" | "viendo" | "vista";
type TitleKind = "movie" | "series";

/**
 * IMPORTANTE:
 * Yo no puedo confirmar cuál es tu helper real de MongoDB (no lo pegaste).
 * La forma más segura SIN inventar tu DB layer es reutilizar tu endpoint existente /api/titles
 * y traer de ahí los items (misma lógica y mismos filtros).
 */
export async function GET(req: Request) {
  const url = new URL(req.url);

  // Soporta: q, kind y tab (opcional)
  const q = url.searchParams.get("q") ?? "";
  const kind = (url.searchParams.get("kind") ?? "") as TitleKind | "";
  const tab = (url.searchParams.get("tab") ?? "all") as TitleState | "all";

  // Reuso del listado JSON ya existente
  const apiUrl = new URL("/api/titles", url.origin);
  if (q.trim()) apiUrl.searchParams.set("q", q.trim());
  if (kind) apiUrl.searchParams.set("kind", kind);

  const res = await fetch(apiUrl.toString(), { cache: "no-store" });
  const data = await res.json().catch(() => null);

  if (!res.ok) {
    return NextResponse.json(
      { error: data?.error || `Error ${res.status}` },
      { status: res.status }
    );
  }

  let items = Array.isArray(data?.items) ? data.items : [];

  // filtro por tab si corresponde
  if (tab !== "all") {
    items = items.filter((it: any) => it?.state === tab);
  }

  const filtersTextParts: string[] = [];
  if (q.trim()) filtersTextParts.push(`Búsqueda: "${q.trim()}"`);
  if (kind) filtersTextParts.push(`Tipo: ${kind === "movie" ? "Película" : "Serie"}`);
  if (tab !== "all") filtersTextParts.push(`Estado: ${tab}`);
  const filtersText = filtersTextParts.length ? filtersTextParts.join(" · ") : undefined;

  // ✅ Sin JSX: más estable en route.ts
  const element = React.createElement(TitlesPDF, { titles: items, filtersText });

  const nodeStream = (await renderToStream(element as any)) as any;

  // NextResponse necesita WebStream (en Node 18+)
  const webStream = Readable.toWeb(nodeStream);

  return new NextResponse(webStream as any, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'attachment; filename="peliculas-series.pdf"',
    },
  });
}
