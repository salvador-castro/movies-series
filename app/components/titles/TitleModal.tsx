"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "./titles.module.css";
import GenreMultiSelect from "./GenreMultiSelect";
import { generos, plataformas } from "./constants";
import type { TitleDoc, TitleKind, TitleState } from "./TitlesApp";

type Mode = "create" | "edit";

type FormState = {
    kind: TitleKind;
    state: TitleState;
    title: string;
    platform: string;
    rating: number; // 1..10
    imdb: string; // 0..10 con punto, o ""
    filmaffinity: string; // 0..10 con punto, o ""
    genres: string[];
    notePre: string;
    notePost: string;
};

function normalizeDecimalInput(raw: string) {
    // convierte coma a punto y deja solo dígitos + 1 punto
    const s = raw.trim().replace(",", ".");
    if (!s) return "";
    // permite "9." mientras escribe
    const cleaned = s.replace(/[^0-9.]/g, "");
    const parts = cleaned.split(".");
    if (parts.length === 1) return parts[0];
    return `${parts[0]}.${parts.slice(1).join("")}`;
}

function parseScore0to10(s: string): number | null {
    const t = s.trim();
    if (!t) return null;
    const n = Number(t);
    if (!Number.isFinite(n)) return null;
    if (n < 0 || n > 10) return null;
    return n;
}

function Stars10({
    value,
    onChange,
}: {
    value: number;
    onChange: (v: number) => void;
}) {
    return (
        <div className={styles.starsRow}>
            {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => {
                const on = n <= value;
                return (
                    <button
                        key={n}
                        type="button"
                        className={[styles.starBtn, on ? styles.starOn : ""].join(" ")}
                        onClick={() => onChange(n)}
                        title={`${n}/10`}
                    >
                        ★
                    </button>
                );
            })}
            <span className={styles.smallMuted}>{value}/10</span>
        </div>
    );
}

export default function TitleModal({
    open,
    mode,
    initial,
    onClose,
    onSubmit,
}: {
    open: boolean;
    mode: Mode;
    initial?: TitleDoc | null;
    onClose: () => void;
    onSubmit: (payload: any) => void;
}) {
    const [error, setError] = useState<string | null>(null);

    const [f, setF] = useState<FormState>(() => ({
        kind: initial?.kind ?? "movie",
        state: initial?.state ?? "para_ver",
        title: initial?.title ?? "",
        platform: (initial as any)?.platform ?? "",
        rating: typeof initial?.rating === "number" && initial.rating >= 1 && initial.rating <= 10 ? initial.rating : 8,
        imdb: typeof (initial as any)?.imdbId === "string" ? (initial as any).imdbId : "",
        filmaffinity: typeof (initial as any)?.filmaffinityId === "string" ? (initial as any).filmaffinityId : "",
        genres: Array.isArray(initial?.genres) ? initial!.genres : [],
        notePre: (initial as any)?.notePre ?? ((initial as any)?.note ?? ""),
        notePost: (initial as any)?.notePost ?? "",
    }));

    // Cuando cambia initial (editar otro item), resetea form
    useEffect(() => {
        if (!open) return;
        setError(null);
        setF({
            kind: initial?.kind ?? "movie",
            state: initial?.state ?? "para_ver",
            title: initial?.title ?? "",
            platform: (initial as any)?.platform ?? "",
            rating: typeof initial?.rating === "number" && initial.rating >= 1 && initial.rating <= 10 ? initial.rating : 8,
            imdb: typeof (initial as any)?.imdbId === "string" ? (initial as any).imdbId : "",
            filmaffinity: typeof (initial as any)?.filmaffinityId === "string" ? (initial as any).filmaffinityId : "",
            genres: Array.isArray(initial?.genres) ? initial!.genres : [],
            notePre: (initial as any)?.notePre ?? ((initial as any)?.note ?? ""),
            notePost: (initial as any)?.notePost ?? "",
        });
    }, [open, initial]);

    const genreOptions = useMemo(() => {
        return f.kind === "movie" ? [...generos["Película"]] : [...generos["Serie"]];
    }, [f.kind]);

    // al cambiar tipo, elimina géneros inválidos
    useEffect(() => {
        setF((prev) => ({ ...prev, genres: prev.genres.filter((g) => (genreOptions as string[]).includes(g)) }));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [genreOptions.join("|")]);

    if (!open) return null;

    function validate(): string | null {
        if (!f.title.trim()) return "El título es obligatorio.";
        if (!f.platform.trim()) return "La plataforma es obligatoria.";
        if (!f.genres.length) return "Tenés que elegir al menos 1 género.";
        if (!f.notePre.trim()) return "La descripción previa es obligatoria.";
        if (!f.rating || f.rating < 1 || f.rating > 10) return "El rating debe ser 1..10.";

        if (f.state === "vista" && !f.notePost.trim()) {
            return "La descripción post vista es obligatoria cuando el estado es 'vista'.";
        }

        // IMDb / FilmAffinity: opcionales, pero mutuamente excluyentes
        const imdbN = parseScore0to10(f.imdb);
        const faN = parseScore0to10(f.filmaffinity);

        if (f.imdb.trim() && imdbN === null) return "IMDb debe ser un número entre 0 y 10 (ej: 9.5).";
        if (f.filmaffinity.trim() && faN === null) return "FilmAffinity debe ser un número entre 0 y 10 (ej: 8.0).";

        if (f.imdb.trim() && f.filmaffinity.trim()) return "Completá IMDb o FilmAffinity, pero no ambos.";

        return null;
    }

    function submit(e: React.FormEvent) {
        e.preventDefault();
        const err = validate();
        if (err) {
            setError(err);
            return;
        }
        setError(null);

        const imdb = normalizeDecimalInput(f.imdb);
        const filmaffinity = normalizeDecimalInput(f.filmaffinity);

        // payload final
        onSubmit({
            kind: f.kind,
            state: f.state,
            title: f.title.trim(),
            platform: f.platform.trim(),
            rating: f.rating,
            imdbId: imdb ? String(Number(imdb)) : null, // normaliza "9.50" -> "9.5"
            filmaffinityId: filmaffinity ? String(Number(filmaffinity)) : null,
            genres: f.genres,
            notePre: f.notePre.trim(),
            notePost: f.state === "vista" ? f.notePost.trim() : "",
        });
    }

    return (
        <div className={styles.overlay} onMouseDown={onClose}>
            <div className={styles.modal} onMouseDown={(e) => e.stopPropagation()}>
                <div className={styles.modalHeader}>
                    <h3 className={styles.modalTitle}>
                        {mode === "create" ? "Agregar" : "Editar"}
                    </h3>
                    <button className={styles.modalClose} onClick={onClose}>
                        Cerrar
                    </button>
                </div>

                {error ? (
                    <div className={[styles.toast, styles.toastErr].join(" ")}>{error}</div>
                ) : null}

                <form onSubmit={submit} style={{ display: "grid", gap: 10 }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                        <div className={styles.field}>
                            <div className={styles.label}>Tipo *</div>
                            <select className={styles.select} value={f.kind} onChange={(e) => setF((p) => ({ ...p, kind: e.target.value as TitleKind }))}>
                                <option value="movie">Película</option>
                                <option value="series">Serie</option>
                            </select>
                        </div>

                        <div className={styles.field}>
                            <div className={styles.label}>Estado *</div>
                            <select className={styles.select} value={f.state} onChange={(e) => setF((p) => ({ ...p, state: e.target.value as TitleState }))}>
                                <option value="para_ver">Para ver</option>
                                <option value="viendo">Viendo</option>
                                <option value="vista">Vista</option>
                            </select>
                        </div>
                    </div>

                    <div className={styles.field}>
                        <div className={styles.label}>Título *</div>
                        <input className={styles.input} value={f.title} onChange={(e) => setF((p) => ({ ...p, title: e.target.value }))} />
                    </div>

                    <div className={styles.field}>
                        <div className={styles.label}>Plataforma *</div>
                        <select className={styles.select} value={f.platform} onChange={(e) => setF((p) => ({ ...p, platform: e.target.value }))}>
                            <option value="">Seleccionar…</option>
                            {plataformas.map((p) => (
                                <option key={p} value={p}>{p}</option>
                            ))}
                        </select>
                    </div>

                    <div className={styles.field}>
                        <div className={styles.label}>Géneros *</div>
                        <GenreMultiSelect options={genreOptions} value={f.genres} onChange={(genres) => setF((p) => ({ ...p, genres }))} />
                    </div>

                    <div className={styles.field}>
                        <div className={styles.label}>Rating *</div>
                        <Stars10 value={f.rating} onChange={(rating) => setF((p) => ({ ...p, rating }))} />
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                        <div className={styles.field}>
                            <div className={styles.label}>IMDb (0..10)</div>
                            <input
                                className={styles.input}
                                inputMode="decimal"
                                value={f.imdb}
                                onChange={(e) => setF((p) => ({ ...p, imdb: normalizeDecimalInput(e.target.value), filmaffinity: e.target.value.trim() ? "" : p.filmaffinity }))}
                                placeholder="Ej: 9.5"
                            />
                        </div>

                        <div className={styles.field}>
                            <div className={styles.label}>FilmAffinity (0..10)</div>
                            <input
                                className={styles.input}
                                inputMode="decimal"
                                value={f.filmaffinity}
                                onChange={(e) => setF((p) => ({ ...p, filmaffinity: normalizeDecimalInput(e.target.value), imdb: e.target.value.trim() ? "" : p.imdb }))}
                                placeholder="Ej: 8"
                            />
                        </div>
                    </div>

                    <div className={styles.field}>
                        <div className={styles.label}>Descripción previa *</div>
                        <textarea className={styles.textarea} value={f.notePre} onChange={(e) => setF((p) => ({ ...p, notePre: e.target.value }))} />
                    </div>

                    {f.state === "vista" ? (
                        <div className={styles.field}>
                            <div className={styles.label}>Descripción post vista *</div>
                            <textarea className={styles.textarea} value={f.notePost} onChange={(e) => setF((p) => ({ ...p, notePost: e.target.value }))} />
                        </div>
                    ) : null}

                    <button className={styles.btnPrimary} type="submit">
                        {mode === "create" ? "Guardar" : "Guardar cambios"}
                    </button>
                </form>
            </div>
        </div>
    );
}
