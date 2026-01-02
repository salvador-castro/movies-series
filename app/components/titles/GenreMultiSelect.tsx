"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import styles from "./titles.module.css";

export default function GenreMultiSelect({
    options,
    value,
    onChange,
    placeholder = "Buscar género...",
}: {
    options: string[];
    value: string[];
    onChange: (next: string[]) => void;
    placeholder?: string;
}) {
    const [open, setOpen] = useState(false);
    const [q, setQ] = useState("");
    const wrapRef = useRef<HTMLDivElement | null>(null);

    const filtered = useMemo(() => {
        const t = q.trim().toLowerCase();
        if (!t) return options;
        return options.filter((o) => o.toLowerCase().includes(t));
    }, [options, q]);

    function toggle(opt: string) {
        if (value.includes(opt)) onChange(value.filter((x) => x !== opt));
        else onChange([...value, opt]);
    }

    function removeChip(opt: string) {
        onChange(value.filter((x) => x !== opt));
    }

    function clearAll() {
        onChange([]);
    }

    // Cerrar al click afuera
    useEffect(() => {
        function onDocDown(e: MouseEvent) {
            const el = wrapRef.current;
            if (!el) return;
            if (!el.contains(e.target as Node)) setOpen(false);
        }
        document.addEventListener("mousedown", onDocDown);
        return () => document.removeEventListener("mousedown", onDocDown);
    }, []);

    // Si cambian las options (por cambiar tipo), limpiar query si ya no matchea
    useEffect(() => {
        setQ("");
    }, [options]);

    return (
        <div ref={wrapRef} className={styles.msWrap}>
            <div
                className={styles.msControl}
                onClick={() => setOpen(true)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                    if (e.key === "Enter") setOpen(true);
                    if (e.key === "Escape") setOpen(false);
                }}
            >
                <div className={styles.msChips}>
                    {value.length === 0 ? (
                        <span className={styles.msPlaceholder}>Seleccioná géneros…</span>
                    ) : (
                        value.map((v) => (
                            <span key={v} className={styles.msChip} title={v}>
                                {v}
                                <button
                                    type="button"
                                    className={styles.msChipX}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        removeChip(v);
                                    }}
                                    aria-label={`Quitar ${v}`}
                                >
                                    ×
                                </button>
                            </span>
                        ))
                    )}
                </div>

                <div className={styles.msActions}>
                    {value.length > 0 ? (
                        <button
                            type="button"
                            className={styles.msClear}
                            onClick={(e) => {
                                e.stopPropagation();
                                clearAll();
                            }}
                            title="Limpiar"
                        >
                            Limpiar
                        </button>
                    ) : null}
                    <span className={styles.msCaret}>{open ? "▲" : "▼"}</span>
                </div>
            </div>

            {open ? (
                <div className={styles.msMenu}>
                    <input
                        className={styles.msSearch}
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        placeholder={placeholder}
                        autoFocus
                    />

                    <div className={styles.msList}>
                        {filtered.length === 0 ? (
                            <div className={styles.msEmpty}>Sin resultados</div>
                        ) : (
                            filtered.map((opt) => {
                                const checked = value.includes(opt);
                                return (
                                    <button
                                        key={opt}
                                        type="button"
                                        className={[styles.msOption, checked ? styles.msOptionOn : ""].join(" ")}
                                        onClick={() => toggle(opt)}
                                    >
                                        <span className={styles.msCheck}>{checked ? "✓" : ""}</span>
                                        <span className={styles.msOptText}>{opt}</span>
                                    </button>
                                );
                            })
                        )}
                    </div>

                    <div className={styles.msFooter}>
                        <span className={styles.smallMuted}>
                            {value.length} seleccionado(s)
                        </span>
                        <button type="button" className={styles.btnGhost} onClick={() => setOpen(false)}>
                            Cerrar
                        </button>
                    </div>
                </div>
            ) : null}
        </div>
    );
}
