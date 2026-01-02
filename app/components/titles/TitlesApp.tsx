"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "./titles.module.css";
import TitleList from "./TitleList";
import TitleModal from "./TitleModal";

export type TitleState = "para_ver" | "viendo" | "vista";
export type TitleKind = "movie" | "series";

export type TitleDoc = {
    _id: string;
    kind: TitleKind;
    title: string;
    state: TitleState;

    // IMDb / FilmAffinity ahora son "puntajes" 0..10 guardados como string normalizada
    imdbId: string | null;
    filmaffinityId: string | null;

    rating: number; // 1..10
    genres: string[];

    // nuevos
    platform?: string;
    notePre?: string;
    notePost?: string;

    createdAt: string;
    updatedAt: string;
};

function countByState(items: TitleDoc[]) {
    const c = { para_ver: 0, viendo: 0, vista: 0, total: items.length };
    for (const it of items) c[it.state] += 1;
    return c;
}

export default function TitlesApp() {
    const [tab, setTab] = useState<TitleState | "all">("all");
    const [q, setQ] = useState("");
    const [kind, setKind] = useState<TitleKind | "">("");

    const [items, setItems] = useState<TitleDoc[]>([]);
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState<{ type: "ok" | "err"; msg: string } | null>(null);

    const [modalOpen, setModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<"create" | "edit">("create");
    const [editing, setEditing] = useState<TitleDoc | null>(null);

    const qs = useMemo(() => {
        const sp = new URLSearchParams();
        if (q.trim()) sp.set("q", q.trim());
        if (tab !== "all") sp.set("state", tab);
        if (kind) sp.set("kind", kind);
        const s = sp.toString();
        return s ? `?${s}` : "";
    }, [q, tab, kind]);

    const counts = useMemo(() => countByState(items), [items]);

    function flash(type: "ok" | "err", msg: string) {
        setToast({ type, msg });
        setTimeout(() => setToast(null), type === "ok" ? 1600 : 2500);
    }

    async function refresh() {
        setLoading(true);
        try {
            const res = await fetch(`/api/titles${qs}`, { cache: "no-store" });
            const data = await res.json().catch(() => null);
            if (!res.ok) throw new Error(data?.error || `Error ${res.status}`);
            setItems(Array.isArray(data?.items) ? data.items : []);
        } catch (e: any) {
            flash("err", e?.message ?? "Error");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        const t = setTimeout(refresh, 250);
        return () => clearTimeout(t);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [qs]);

    function openCreate() {
        setModalMode("create");
        setEditing(null);
        setModalOpen(true);
    }

    function openEdit(item: TitleDoc) {
        setModalMode("edit");
        setEditing(item);
        setModalOpen(true);
    }

    async function create(payload: any) {
        try {
            const res = await fetch("/api/titles", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            const data = await res.json().catch(() => null);
            if (!res.ok) throw new Error(data?.error || `Error ${res.status}`);
            flash("ok", "Guardado");
            setModalOpen(false);
            await refresh();
        } catch (e: any) {
            flash("err", e?.message ?? "Error");
        }
    }

    async function saveEdit(id: string, payload: any) {
        try {
            const res = await fetch(`/api/titles/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            const data = await res.json().catch(() => null);
            if (!res.ok) throw new Error(data?.error || `Error ${res.status}`);
            flash("ok", "Actualizado");
            setModalOpen(false);
            await refresh();
        } catch (e: any) {
            flash("err", e?.message ?? "Error");
        }
    }

    async function remove(id: string) {
        if (!confirm("¿Eliminar este título?")) return;
        try {
            const res = await fetch(`/api/titles/${id}`, { method: "DELETE" });
            const data = await res.json().catch(() => null);
            if (!res.ok) throw new Error(data?.error || `Error ${res.status}`);
            flash("ok", "Eliminado");
            await refresh();
        } catch (e: any) {
            flash("err", e?.message ?? "Error");
        }
    }

    // Cambio de estado: si pasa a "vista", abrimos modal para exigir "Descripción post vista"
    function requestStateChange(item: TitleDoc, next: TitleState) {
        if (next === "vista") {
            // abrimos editar forzando state=vista; el modal ya obliga notePost
            openEdit({ ...item, state: "vista" });
        } else {
            saveEdit(item._id, { state: next });
        }
    }

    return (
        <div className={styles.page}>
            <div className={styles.container}>
                <div className={styles.header}>
                    <div>
                        <h1 className={styles.title}>Movies / Series</h1>
                    </div>

                    <div className={styles.btnRow}>
                        <button className={styles.btnPrimary} onClick={openCreate}>
                            + Agregar
                        </button>
                        <button className={styles.btnGhost} onClick={refresh} disabled={loading}>
                            {loading ? "Cargando..." : "Refrescar"}
                        </button>
                    </div>
                </div>

                {toast ? (
                    <div className={[styles.toast, toast.type === "ok" ? styles.toastOk : styles.toastErr].join(" ")}>
                        {toast.msg}
                    </div>
                ) : null}

                <div className={styles.tabs}>
                    <button className={[styles.tab, tab === "all" ? styles.tabActive : ""].join(" ")} onClick={() => setTab("all")}>
                        Todos <span className={styles.tabBadge}>{counts.total}</span>
                    </button>
                    <button className={[styles.tab, tab === "para_ver" ? styles.tabActive : ""].join(" ")} onClick={() => setTab("para_ver")}>
                        Para ver <span className={styles.tabBadge}>{counts.para_ver}</span>
                    </button>
                    <button className={[styles.tab, tab === "viendo" ? styles.tabActive : ""].join(" ")} onClick={() => setTab("viendo")}>
                        Viendo <span className={styles.tabBadge}>{counts.viendo}</span>
                    </button>
                    <button className={[styles.tab, tab === "vista" ? styles.tabActive : ""].join(" ")} onClick={() => setTab("vista")}>
                        Vista <span className={styles.tabBadge}>{counts.vista}</span>
                    </button>
                </div>

                <div className={styles.card}>
                    <div className={styles.cardTitle}>Filtros</div>

                    <div className={styles.filtersRow}>
                        <div className={styles.field}>
                            <div className={styles.label}>Buscar</div>
                            <input
                                className={styles.input}
                                value={q}
                                onChange={(e) => setQ(e.target.value)}
                                placeholder="Buscar por nombre, tipo o estado"
                            />
                        </div>

                        <div className={styles.field}>
                            <div className={styles.label}>Tipo</div>
                            <select className={styles.select} value={kind} onChange={(e) => setKind(e.target.value as any)}>
                                <option value="">Todos</option>
                                <option value="movie">Película</option>
                                <option value="series">Serie</option>
                            </select>
                        </div>

                        <div className={styles.field}>
                            <div className={styles.label}>Acciones</div>
                            <button className={styles.btnGhost} type="button" onClick={() => { setQ(""); setKind(""); setTab("all"); flash("ok", "Filtros limpiados"); }}>
                                Limpiar
                            </button>
                        </div>
                    </div>
                </div>

                <div style={{ height: 14 }} />

                <div className={styles.card}>
                    <div className={styles.cardTitle}>Listado</div>
                    <TitleList
                        items={items}
                        onEdit={openEdit}
                        onDelete={remove}
                        onRequestStateChange={requestStateChange}
                    />
                </div>

                <TitleModal
                    open={modalOpen}
                    mode={modalMode}
                    initial={editing}
                    onClose={() => setModalOpen(false)}
                    onSubmit={(payload) => {
                        if (modalMode === "create") return create(payload);
                        if (!editing?._id) return;
                        return saveEdit(editing._id, payload);
                    }}
                />
            </div>
        </div>
    );
}
