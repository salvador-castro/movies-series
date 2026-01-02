"use client";

import styles from "./titles.module.css";

export default function Pagination({
    page,
    totalPages,
    onChange,
}: {
    page: number;
    totalPages: number;
    onChange: (page: number) => void;
}) {
    if (totalPages <= 1) return null;

    const pages: Array<number | "..."> = [];

    for (let i = 1; i <= totalPages; i++) {
        const isEdge = i === 1 || i === totalPages;
        const isNear = Math.abs(i - page) <= 1;
        if (isEdge || isNear) pages.push(i);
        else if (pages[pages.length - 1] !== "...") pages.push("...");
    }

    const go = (p: number) => onChange(Math.max(1, Math.min(totalPages, p)));

    return (
        <div className={styles.paginationWrap} role="navigation" aria-label="Paginación">
            <div className={styles.paginationPills}>
                <button
                    type="button"
                    className={styles.pagePill}
                    onClick={() => go(page - 1)}
                    disabled={page === 1}
                    aria-label="Página anterior"
                >
                    ←
                </button>

                {pages.map((p, idx) =>
                    p === "..." ? (
                        <span key={`e-${idx}`} className={styles.pageDots} aria-hidden="true">
                            …
                        </span>
                    ) : (
                        <button
                            key={p}
                            type="button"
                            className={[styles.pagePill, p === page ? styles.pagePillActive : ""].join(" ")}
                            onClick={() => go(p)}
                            aria-current={p === page ? "page" : undefined}
                        >
                            {p}
                        </button>
                    )
                )}

                <button
                    type="button"
                    className={styles.pagePill}
                    onClick={() => go(page + 1)}
                    disabled={page === totalPages}
                    aria-label="Página siguiente"
                >
                    →
                </button>
            </div>
        </div>
    );
}
