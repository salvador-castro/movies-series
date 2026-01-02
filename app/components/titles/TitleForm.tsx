"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "./titles.module.css";
import type { TitleKind, TitleState } from "./TitlesApp";
import GenreMultiSelect from "./GenreMultiSelect";

const generos = {
    Película: [
        "Acción", "Animación", "Aventura", "Bélico", "Biográfico", "Ciencia Ficción",
        "Cine Negro", "Comedia", "Comedia Drámatica", "Comedia Negra", "Deportivo", "Documental",
        "Drama", "Fantasía", "Histórico", "Misterio", "Musical", "Policial", "Romance", "Suspenso",
        "Terror", "Western"
    ],
    Serie: [
        "Animación", "Antológica", "Ciencia Ficción", "Comedia", "Comedia Drámatica", "Crimen",
        "Documental", "Drama", "Drama Juvenil", "Espionaje", "Fantasía", "Histórico", "Médico",
        "Misterio", "Policíaco", "Reality Show", "Romance", "Sitcom", "Superhéroes",
        "Terror", "Thriller"
    ]
} as const;

function Stars10({ value, onChange }: { value: number | null; onChange: (v: number | null) => void }) {
    const v = value ?? 0;
    return (
        <div className={styles.starsRow}>
            {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => {
                const on = n <= v;
                return (
                    <button
                        key={n}
                        type="button"
                        className={[styles.starBtn, on ? styles.starOn : ""].join(" ")}
                        onClick={() => onChange(on && n === v ? null : n)}
                        title={`${n}/10`}
                    >
                        ★
                    </button>
                );
            })}
            <span className={styles.smallMuted}>{value ? `${value}/10` : "—"}</span>
        </div>
    );
}

function onlyDigitsOrEmpty(s: string) {
    const t = s.trim();
    if (!t) return "";
    return t.replace(/[^\d]/g, "");
}

export default function TitleForm({ onCreate }: { onCreate: (payload: any) => void }) {
    const [kind, setKind] = useState<TitleKind>("movie");
    const [state, setState] = useState<TitleState>("para_ver");
    const [title, setTitle] = useState("");
    const [rating, setRating] = useState<number | null>(null);

    // NUMÉRICOS (se guardan como string con dígitos o null)
    const [imdb, setImdb] = useState("");
    const [filmaffinity, setFilmaffinity] = useState("");

    const [note, setNote] = useState("");

    // géneros (multi)
    const [selectedGenres, setSelectedGenres] = useState<string[]>([]);

    const genreOptions = useMemo(() => {
        return kind === "movie" ? [...generos["Película"]] : [...generos["Serie"]];
    }, [kind]);

    // Si cambia el tipo, limpiar géneros que no correspondan
    useEffect(() => {
        setSelectedGenres((prev) => prev.filter((g) => (genreOptions as readonly string[]).includes(g)));
    }, [genreOptions]);

    function toggleGenre(g: string) {
        setSelectedGenres((prev) => (prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]));
    }

    function clearGenres() {
        setSelectedGenres([]);
    }

    function submit(e: React.FormEvent) {
        e.preventDefault();
        const t = title.trim();
        if (!t) return alert("El título es obligatorio.");

        const imdbDigits = onlyDigitsOrEmpty(imdb);
        const faDigits = onlyDigitsOrEmpty(filmaffinity);

        onCreate({
            kind,
            title: t,
            state,
            rating,
            imdbId: imdbDigits ? imdbDigits : null,
            filmaffinityId: faDigits ? faDigits : null,
            note,
            genres: selectedGenres,
        });

        setTitle("");
        setRating(null);
        setImdb("");
        setFilmaffinity("");
        setNote("");
        setSelectedGenres([]);
        setKind("movie");
        setState("para_ver");
    }

    return (
        <form onSubmit={submit} style={{ display: "grid", gap: 10 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div className={styles.field}>
                    <div className={styles.label}>Tipo</div>
                    <select className={styles.select} value={kind} onChange={(e) => setKind(e.target.value as any)}>
                        <option value="movie">Película</option>
                        <option value="series">Serie</option>
                    </select>
                </div>

                <div className={styles.field}>
                    <div className={styles.label}>Estado</div>
                    <select className={styles.select} value={state} onChange={(e) => setState(e.target.value as any)}>
                        <option value="para_ver">Para ver</option>
                        <option value="viendo">Viendo</option>
                        <option value="vista">Vista</option>
                    </select>
                </div>
            </div>

            <div className={styles.field}>
                <div className={styles.label}>Título *</div>
                <input className={styles.input} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Matrix" />
            </div>

            <div className={styles.field}>
                <div className={styles.label}>Rating (clic ★)</div>
                <Stars10 value={rating} onChange={setRating} />
            </div>

            {/* Géneros según tipo */}
            <div className={styles.field}>
                <div className={styles.label}>Géneros</div>

                <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
                    <div className={styles.smallMuted}>
                        {selectedGenres.length ? `${selectedGenres.length} seleccionado(s)` : "Elegí uno o varios"}
                    </div>
                </div>

                <div className={styles.field}>
                    <div className={styles.label}>Géneros</div>
                    <GenreMultiSelect
                        options={genreOptions}
                        value={selectedGenres}
                        onChange={setSelectedGenres}
                        placeholder="Buscar género..."
                    />
                    <div className={styles.smallMuted} style={{ marginTop: 6 }}>
                        {selectedGenres.length ? `${selectedGenres.length} seleccionado(s)` : "Elegí uno o varios"}
                    </div>
                </div>

            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div className={styles.field}>
                    <div className={styles.label}>IMDb</div>
                    <input
                        className={styles.input}
                        type="number"
                        inputMode="numeric"
                        value={imdb}
                        onChange={(e) => setImdb(e.target.value)}
                        placeholder="Solo números"
                    />
                </div>

                <div className={styles.field}>
                    <div className={styles.label}>FilmAffinity</div>
                    <input
                        className={styles.input}
                        type="number"
                        inputMode="numeric"
                        value={filmaffinity}
                        onChange={(e) => setFilmaffinity(e.target.value)}
                        placeholder="Solo números"
                    />
                </div>
            </div>

            <div className={styles.field}>
                <div className={styles.label}>Nota</div>
                <textarea
                    className={styles.textarea}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Por qué la agregaste..."
                />
            </div>

            <button className={styles.btnPrimary} type="submit">
                Guardar
            </button>
        </form>
    );
}
