"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "./titles.module.css";
import TitleList from "./TitleList";
import TitleModal from "./TitleModal";
import Pagination from "./Pagination";

export type TitleState = "para_ver" | "viendo" | "vista";
export type TitleKind = "movie" | "series";

export type TitleDoc = {
    _id: string;
    kind: TitleKind;
    title: string;
    state: TitleState;

    imdbId: string | null;
    filmaffinityId: string | null;

    rating: number; // 1..10
    genres: string[];

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

const ITEMS_PER_PAGE = 10;

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

    // ✅ paginación
    const [page, setPage] = useState(1);

    const qs = useMemo(() => {
        const sp = new URLSearchParams();
        if (q.trim()) sp.set("q", q.trim());
        if (kind) sp.set("kind", kind);
        const s = sp.toString();
        return s ? `?${s}` : "";
    }, [q, kind]);

    const filteredItems = useMemo(() => {
        if (tab === "all") return items;
        return items.filter((it) => it.state === tab);
    }, [items, tab]);

    // ✅ total páginas según filtros/tabs
    const totalPages = useMemo(() => {
        return Math.max(1, Math.ceil(filteredItems.length / ITEMS_PER_PAGE));
    }, [filteredItems.length]);

    // ✅ clamp si quedaste en una página que ya no existe
    useEffect(() => {
        if (page > totalPages) setPage(totalPages);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [totalPages]);

    // ✅ items paginados (lo que va a TitleList)
    const pagedItems = useMemo(() => {
        const start = (page - 1) * ITEMS_PER_PAGE;
        return filteredItems.slice(start, start + ITEMS_PER_PAGE);
    }, [filteredItems, page]);

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
            setPage(1); // ✅ al refrescar, volvemos a la primera página
        } catch (e: any) {
            flash("err", e?.message ?? "Error");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        // ✅ cuando cambian filtros de backend (q/kind), pedimos data
        // y también reseteamos a página 1 para evitar UX rara
        setPage(1);

        const t = setTimeout(refresh, 250);
        return () => clearTimeout(t);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [qs]);

    // ✅ cuando cambian tabs (frontend), volvemos a la primera página
    useEffect(() => {
        setPage(1);
    }, [tab]);

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

    function requestStateChange(item: TitleDoc, next: TitleState) {
        if (next === "vista") {
            openEdit({ ...item, state: "vista" });
        } else {
            saveEdit(item._id, { state: next });
        }
    }

    const [exportingPdf, setExportingPdf] = useState(false);

    function buildPdfUrl() {
        const sp = new URLSearchParams();
        if (q.trim()) sp.set("q", q.trim());
        if (kind) sp.set("kind", kind);
        sp.set("tab", tab);
        return `/api/titles/pdf?${sp.toString()}`;
    }

    async function handleExportPdf() {
        if (exportingPdf) return;

        try {
            setExportingPdf(true);

            const url = buildPdfUrl();

            const res = await fetch(url, { method: "GET", cache: "no-store" });
            if (!res.ok) {
                const data = await res.json().catch(() => null);
                throw new Error(data?.error || `Error ${res.status}`);
            }

            const w = window.open(url, "_blank", "noopener,noreferrer");
            if (!w) throw new Error("El navegador bloqueó el popup. Permití popups para este sitio.");

            flash("ok", "PDF generado");
        } catch (e: any) {
            flash("err", e?.message ?? "No se pudo exportar el PDF");
        } finally {
            setExportingPdf(false);
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
                        <button className={[styles.btnPrimary, styles.btnSm].join(" ")} onClick={openCreate}>
                            + Agregar
                        </button>

                        <button className={[styles.btnGhost, styles.btnSm].join(" ")} onClick={refresh} disabled={loading}>
                            {loading ? "Cargando..." : "Refrescar"}
                        </button>

                        <button
                            type="button"
                            onClick={handleExportPdf}
                            disabled={loading || exportingPdf}
                            className={[
                                styles.exportBtn,
                                styles.btnSm,
                                loading || exportingPdf ? styles.exportBtnDisabled : "",
                            ].join(" ")}
                            title="Exportar listado a PDF"
                        >
                            <span className={styles.exportIcon} aria-hidden="true">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                                    <path d="M12 3v10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                    <path
                                        d="M8 9l4 4 4-4"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                    <path d="M4 17v3h16v-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                </svg>
                            </span>
                            {exportingPdf ? "PDF..." : "Exportar PDF"}
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
                            <button
                                className={styles.btnGhost}
                                type="button"
                                onClick={() => {
                                    setQ("");
                                    setKind("");
                                    setTab("all");
                                    setPage(1);
                                    flash("ok", "Filtros limpiados");
                                }}
                            >
                                Limpiar
                            </button>
                        </div>
                    </div>
                </div>

                <div style={{ height: 14 }} />

                <div className={styles.card}>
                    <div className={styles.cardTitle}>Listado</div>

                    <TitleList items={pagedItems} onEdit={openEdit} onDelete={remove} onRequestStateChange={requestStateChange} />

                    {/* ✅ paginación */}
                    <Pagination page={page} totalPages={totalPages} onChange={setPage} />
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
