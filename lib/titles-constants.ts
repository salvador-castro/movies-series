export const plataformas = [
    "APPLE TV", "DISNEY+", "HBO", "MUBI", "NETFLIX", "NO DISPONIBLE",
    "PARAMOUNT", "PRIMEVIDEO", "SALA DE CINE", "YOUTUBE PREMIUM"
] as const;

export const generos = {
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
