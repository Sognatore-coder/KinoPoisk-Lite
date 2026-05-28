// Работа с данными (API)
const API_KEY = 'CNEAVK2-TRYM6MK-PAFWC3V-HHXA7YZ';
const BASE_URL = 'https://api.poiskkino.dev/v1.4';

const FIELDS = [
    'id', 'name', 'alternativeName', 'year',
    'rating', 'poster', 'genres', 'description', 'movieLength'
].map(f => `selectFields=${f}`).join('&');

let currentPage  = 1;
let currentQuery = '';
let currentGenreIds = [];
let currentSort  = 'rating.kp';
let allMovies    = [];

// Загрузка фильмов
export async function fetchMovies(page = 1) {
    let url;

    if (currentQuery) {
        url = `${BASE_URL}/movie/search?page=${page}&limit=20&query=${encodeURIComponent(currentQuery)}&${FIELDS}`;
    } else {
        url = `${BASE_URL}/movie?page=${page}&limit=20&${FIELDS}&notNullFields=poster.url&notNullFields=rating.kp`;

        if (currentGenreIds.length) {
            for (const genre of currentGenreIds) {
                url += `&genres.name=${encodeURIComponent(genre)}`;
            }
        }

        // Серверная сортировка (только когда нет поиска)
        const sortMap = {
            'rating.kp': 'rating.kp',
            'year':       'year',
            'votes':      'votes.kp'
        };
        const serverSort = sortMap[currentSort] || 'rating.kp';
        url += `&sortField=${serverSort}&sortType=-1`;
    }

    try {
        const response = await fetch(url, {
            headers: {
                'X-API-KEY': API_KEY,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const data = await response.json();
        let movies = data.docs || [];

        // Только фильмы с постером, рейтингом и описанием
        movies = movies.filter(m => {
            const hasPoster  = !!(m.poster?.url || m.poster?.previewUrl);
            const hasRating  = (m.rating?.kp || m.rating?.imdb || 0) > 0;
            const hasDesc    = m.description && m.description.length > 30;
            const hasName    = !!(m.name || m.alternativeName);
            return hasPoster && hasRating && hasDesc && hasName;
        });

        // Нормализация структуры
        movies = movies.map(m => ({
            id:           m.id,
            title:        m.name || m.alternativeName || 'Без названия',
            originalTitle:m.alternativeName || m.name || '',
            year:         m.year,
            vote_average: m.rating?.kp || m.rating?.imdb || 0,
            vote_count:   m.votes?.kp  || m.votes?.imdb  || 0,
            // Сохраняем полный URL постера
            poster_path:  m.poster?.url || m.poster?.previewUrl || '',
            genre_ids:    m.genres?.map(g => g.name) || [],
            description:  m.description || '',
            movieLength:  m.movieLength || null
        }));

        if (page === 1) {
            allMovies = movies;
        } else {
            // Не дублируем при "загрузить ещё"
            const existingIds = new Set(allMovies.map(m => m.id));
            allMovies = [...allMovies, ...movies.filter(m => !existingIds.has(m.id))];
        }

        return { results: movies, total: data.total || 0 };

    } catch (error) {
        console.error('Ошибка fetchMovies:', error);
        return { results: [], total: 0 };
    }
}


// Детали конкретного фильма
export async function fetchMovieDetails(movieId) {
    const fields = ['id','name','alternativeName','year','rating','votes',
                    'poster','genres','description','movieLength','countries']
        .map(f => `selectFields=${f}`).join('&');

    const url = `${BASE_URL}/movie/${movieId}?${fields}`;

    try {
        const response = await fetch(url, { headers: { 'X-API-KEY': API_KEY } });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const m = await response.json();

        return {
            id:           m.id,
            title:        m.name || m.alternativeName || 'Без названия',
            originalTitle:m.alternativeName || m.name || '',
            year:         m.year,
            rating:       m.rating?.kp || m.rating?.imdb || 0,
            votes:        m.votes?.kp  || m.votes?.imdb  || 0,
            poster:       m.poster?.url || m.poster?.previewUrl || '',
            description:  m.description || 'Описание отсутствует',
            movieLength:  m.movieLength || null,
            genres:       m.genres?.map(g => g.name).join(', ') || 'Не указаны',
            countries:    m.countries?.map(c => c.name).join(', ') || 'Не указаны'
        };
    } catch (error) {
        console.error('Ошибка fetchMovieDetails:', error);
        return null;
    }
}

// Жанры (статический список)
export async function fetchGenres() {
    return [
        { id: 'боевик',      name: 'Боевик'      },
        { id: 'комедия',     name: 'Комедия'     },
        { id: 'драма',       name: 'Драма'       },
        { id: 'фантастика',  name: 'Фантастика'  },
        { id: 'ужасы',       name: 'Ужасы'       },
        { id: 'триллер',     name: 'Триллер'     },
        { id: 'мелодрама',   name: 'Мелодрама'   },
        { id: 'детектив',    name: 'Детектив'    },
        { id: 'приключения', name: 'Приключения' },
        { id: 'документальный', name: 'Документальный' }
    ];
}

// Геттеры / сеттеры 
export function setQuery(query)   { currentQuery = query;   currentPage = 1; allMovies = []; }
export function setGenres(genres) { currentGenreIds = genres; currentPage = 1; allMovies = []; }
export function setSort(sort)     { currentSort = sort;     currentPage = 1; allMovies = []; }
export function setPage(page)     { currentPage = page; }
export function getCurrentPage()  { return currentPage; }
export function getAllMovies()     { return [...allMovies]; }
export function getQuery()        { return currentQuery; }

// URL постера
export function getImageUrl(path) {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    // На случай если вернётся относительный путь
    return `https://kinopoiskapiunofficial.tech/images/posters/kp/${path}`;
}
