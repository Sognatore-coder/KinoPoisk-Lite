// Отображение данных
import { getImageUrl } from './dataLayer.js';


// SVG-заглушка для отсутствующего постера
const PLACEHOLDER_SVG = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='450' viewBox='0 0 300 450'%3E%3Crect width='300' height='450' fill='%231a1a2e'/%3E%3Crect x='100' y='150' width='100' height='80' rx='8' fill='%232d2d44'/%3E%3Ccircle cx='150' cy='185' r='20' fill='%233d3d5c'/%3E%3Cpolygon points='130,205 170,205 150,170' fill='%23e50914' opacity='0.7'/%3E%3Ctext x='150' y='270' text-anchor='middle' fill='%23555577' font-family='sans-serif' font-size='13'%3EНет постера%3C/text%3E%3C/svg%3E`;

// Карточки фильмов
export function renderMovies(movies, containerId, onMovieClick) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (!movies || movies.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <span class="empty-icon">🎬</span>
                <p>Фильмы не найдены</p>
                <small>Попробуйте изменить фильтры или поисковый запрос</small>
            </div>`;
        return;
    }

    container.innerHTML = movies.map(movie => {
        const posterUrl = getImageUrl(movie.poster_path) || PLACEHOLDER_SVG;
        const rating    = movie.vote_average?.toFixed(1) || '?';
        const ratingClass = getRatingClass(movie.vote_average);

        return `
        <div class="movie-card" data-id="${movie.id}">
            <div class="movie-poster">
                <img
                    src="${PLACEHOLDER_SVG}"
                    data-src="${posterUrl}"
                    alt="${escapeHtml(movie.title)}"
                    class="poster-img lazy"
                    loading="lazy"
                    onerror="this.src='${PLACEHOLDER_SVG}'; this.onerror=null;">
                <div class="card-overlay">
                    <span class="play-btn">▶</span>
                </div>
                <div class="rating-badge ${ratingClass}">${rating}</div>
            </div>
            <div class="movie-info">
                <div class="movie-title" title="${escapeHtml(movie.title)}">${escapeHtml(movie.title)}</div>
                <div class="movie-meta">
                    <span class="movie-year">${movie.year || '—'}</span>
                    ${movie.movieLength ? `<span class="movie-length">⏱ ${movie.movieLength} мин</span>` : ''}
                </div>
                ${movie.genre_ids?.length ? `<div class="movie-genres">${movie.genre_ids.slice(0,2).map(g => `<span class="genre-tag">${escapeHtml(g)}</span>`).join('')}</div>` : ''}
            </div>
        </div>`;
    }).join('');

    // Ленивая загрузка постеров через IntersectionObserver
    initLazyLoading(container);

    // Клики по карточкам
    container.querySelectorAll('.movie-card').forEach(card => {
        card.addEventListener('click', () => {
            const id = parseInt(card.dataset.id);
            if (onMovieClick && !isNaN(id)) onMovieClick(id);
        });
    });
}

// Ленивая загрузка изображений
function initLazyLoading(container) {
    if (!('IntersectionObserver' in window)) {
        // Fallback — грузим всё сразу
        container.querySelectorAll('img.lazy').forEach(img => {
            img.src = img.dataset.src || img.src;
        });
        return;
    }

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                const src = img.dataset.src;
                if (src) {
                    img.src = src;
                    img.classList.remove('lazy');
                    img.classList.add('loaded');
                }
                observer.unobserve(img);
            }
        });
    }, { rootMargin: '200px' });

    container.querySelectorAll('img.lazy').forEach(img => observer.observe(img));
}

// Цвет рейтинга
function getRatingClass(rating) {
    if (!rating) return 'rating-none';
    if (rating >= 7.5) return 'rating-high';
    if (rating >= 6.0) return 'rating-mid';
    return 'rating-low';
}

// Чекбоксы жанров
export function renderGenres(genres, containerId, onGenreChange) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = genres.map(genre => `
        <label class="genre-chip">
            <input type="checkbox" value="${genre.id}">
            <span>${escapeHtml(genre.name)}</span>
        </label>
    `).join('');

    container.querySelectorAll('input[type="checkbox"]').forEach(cb => {
        cb.addEventListener('change', onGenreChange);
    });
}

// Модальное окно деталей фильма
export function showMovieDetails(details) {
    const modal   = document.getElementById('stats-modal');
    const content = document.getElementById('stats-content');
    if (!details || !modal || !content) return;

    const poster      = getImageUrl(details.poster) || PLACEHOLDER_SVG;
    const lengthText  = details.movieLength ? `${details.movieLength} мин` : '—';
    const ratingClass = getRatingClass(details.rating);

    content.innerHTML = `
        <div class="movie-detail">
            <div class="movie-detail-poster">
                <img src="${PLACEHOLDER_SVG}"
                     data-src="${poster}"
                     alt="${escapeHtml(details.title)}"
                     class="lazy detail-poster-img"
                     onerror="this.src='${PLACEHOLDER_SVG}'; this.onerror=null;">
            </div>
            <div class="movie-detail-info">
                <h2 class="detail-title">${escapeHtml(details.title)}</h2>
                ${details.originalTitle && details.originalTitle !== details.title
                    ? `<p class="detail-orig">${escapeHtml(details.originalTitle)}</p>`
                    : ''}
                <div class="detail-rating-row">
                    <span class="detail-rating-badge ${ratingClass}">
                        ⭐ ${details.rating?.toFixed(1) || '?'}
                    </span>
                    ${details.votes ? `<span class="detail-votes">${formatVotes(details.votes)} голосов</span>` : ''}
                </div>
                <div class="detail-grid">
                    <div class="detail-item">
                        <span class="detail-label">📅 Год</span>
                        <span>${details.year || '—'}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">⏱ Длительность</span>
                        <span>${lengthText}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">🎭 Жанры</span>
                        <span>${escapeHtml(details.genres) || '—'}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">🌍 Страны</span>
                        <span>${escapeHtml(details.countries) || '—'}</span>
                    </div>
                </div>
                <div class="detail-description">
                    <h4>📖 Описание</h4>
                    <p>${escapeHtml(details.description) || 'Описание отсутствует'}</p>
                </div>
            </div>
        </div>`;

    // Грузим постер в модалке
    const detailImg = content.querySelector('img.lazy');
    if (detailImg && detailImg.dataset.src) {
        detailImg.src = detailImg.dataset.src;
        detailImg.classList.remove('lazy');
    }

    modal.classList.remove('hidden');
}

// Утилиты
function formatVotes(n) {
    if (!n) return '0';
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
    if (n >= 1_000)     return (n / 1_000).toFixed(0) + 'K';
    return String(n);
}

function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}
