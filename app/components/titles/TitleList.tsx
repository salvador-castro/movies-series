"use client";

import styles from "./titles.module.css";
import type { TitleDoc, TitleState } from "./TitlesApp";

function nextState(s: TitleState): TitleState {
    if (s === "para_ver") return "viendo";
    if (s === "viendo") return "vista";
    return "para_ver";
}

function statePillClass(s: TitleState) {
    if (s === "para_ver") return styles.pillBlue;
    if (s === "viendo") return styles.pillAmber;
    return styles.pillGreen;
}

export default function TitleList({
    items,
    onEdit,
    onDelete,
    onRequestStateChange,
}: {
    items: TitleDoc[];
    onEdit: (item: TitleDoc) => void;
    onDelete: (id: string) => void;
    onRequestStateChange: (item: TitleDoc, next: TitleState) => void;
}) {
    if (items.length === 0) return <div className={styles.smallMuted}>No hay títulos todavía.</div>;

    return (
        <div className={styles.list}>
            {items.map((it) => {
                const next = nextState(it.state);

                return (
                    <div key={it._id} className={styles.item}>
                        <div className={styles.itemTop}>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <h3 className={styles.itemTitle}>
                                    {it.title}
                                    <span className={styles.pill} style={{ marginLeft: 10 }}>
                                        {it.kind === "movie" ? "Película" : "Serie"}
                                    </span>
                                </h3>

                                <div className={styles.pills}>
                                    <span className={[styles.pill, statePillClass(it.state)].join(" ")}>
                                        {it.state === "para_ver" ? "Para ver" : it.state === "viendo" ? "Viendo" : "Vista"}
                                    </span>
                                    <span className={styles.pill}>{it.rating}/10</span>
                                    {it.platform ? <span className={styles.pill}>{it.platform}</span> : null}
                                </div>

                                {/* Descripción previa: SIEMPRE */}
                                <div style={{ marginTop: 10 }}>
                                    <b>Descripción:</b>{" "}
                                    {(it as any).notePre ? (it as any).notePre : <span className={styles.smallMuted}>—</span>}
                                </div>

                                {/* Opinión: SOLO si está en VISTA */}
                                {it.state === "vista" ? (
                                    <div style={{ marginTop: 10 }}>
                                        <b>Opinión:</b>{" "}
                                        {(it as any).notePost ? (it as any).notePost : <span className={styles.smallMuted}>—</span>}
                                    </div>
                                ) : null}


                                <div className={styles.meta}>
                                    <span>IMDb: {it.imdbId ?? "—"}</span>
                                    <span>FilmAffinity: {it.filmaffinityId ?? "—"}</span>
                                    <span>Géneros: {it.genres?.length ? it.genres.join(", ") : "—"}</span>
                                </div>
                            </div>

                            <div style={{ minWidth: 280, display: "grid", gap: 10 }}>
                                <div className={styles.btnRow}>
                                    <button className={styles.btnGhost} onClick={() => onEdit(it)}>
                                        Editar
                                    </button>

                                    <button className={styles.btnGhost} onClick={() => onRequestStateChange(it, next)}>
                                        Pasar a {next === "para_ver" ? "Para ver" : next === "viendo" ? "Viendo" : "Vista"}
                                    </button>

                                    <button className={styles.btnDanger} onClick={() => onDelete(it._id)}>
                                        Eliminar
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
