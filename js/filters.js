export function filterByGenres(movies, selectedGenreIds, allGenres) {
    if (!selectedGenreIds || selectedGenreIds.length === 0) return movies;
    
    return movies.filter(movie => {
        if (!movie.genre_ids || movie.genre_ids.length === 0) return false;
        return selectedGenreIds.some(selectedGenre => 
            movie.genre_ids.some(movieGenre => 
                movieGenre.toLowerCase() === selectedGenre.toLowerCase()
            )
        );
    });
}

export function sortMovies(movies, sortBy) {
    const copy = [...movies];
    
    switch(sortBy) {
        case 'rating.kp':
            return copy.sort((a, b) => (b.vote_average || 0) - (a.vote_average || 0));
        case 'year':
            return copy.sort((a, b) => (b.year || 0) - (a.year || 0));
        case 'votes':
            return copy.sort((a, b) => (b.vote_count || 0) - (a.vote_count || 0));
        default:
            return copy;
    }
}