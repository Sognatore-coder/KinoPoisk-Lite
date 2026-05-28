// Вычисление статистики по списку фильмов
export function calculateStats(movies) {
    const total = movies.length;
    if (!total) return { total: 0 };

    const avgRating = movies.reduce((sum, m) => sum + (m.vote_average || 0), 0) / total;

    const topRated = [...movies].sort((a, b) =>
        (b.vote_average || 0) - (a.vote_average || 0)
    )[0];

    // Подсчёт фильмов по годам 
    const byYear = {};
    movies.forEach(m => {
        if (m.year) byYear[m.year] = (byYear[m.year] || 0) + 1;
    });

    const mostYearEntry = Object.entries(byYear)
        .sort((a, b) => b[1] - a[1])[0];

    return {
        total,
        avgRating:      avgRating.toFixed(1),
        topRatedTitle:  topRated?.title || '—',
        topRatedRating: topRated?.vote_average?.toFixed(1) || '—',
        mostYear: mostYearEntry
            ? `${mostYearEntry[0]} (${mostYearEntry[1]} фил.)`
            : '—'
    };
}
