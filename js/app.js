// Главный модуль приложения
import * as data   from './dataLayer.js';
import * as render from './renderLayer.js';
import { saveUserName, getUserName } from './storage.js';
import { calculateStats } from './stats.js';
import { filterByGenres, sortMovies } from './filters.js';


// Состояние
let allGenres         = [];
let selectedGenreIds  = [];
let currentDisplayMovies = [];
let currentSort       = 'rating.kp';
let isLoading         = false;

// Загрузка и рендер фильмов
async function loadMoviesAndRender(resetPage = true) {
    if (isLoading) return;
    isLoading = true;
    setLoadingState(true);

    if (resetPage) data.setPage(1);
    const page = data.getCurrentPage();

    try {
        await data.fetchMovies(page);
        applyFiltersAndSort();
    } catch (error) {
        console.error('Ошибка загрузки:', error);
        const container = document.getElementById('movies-container');
        if (container && currentDisplayMovies.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <span class="empty-icon">❌</span>
                    <p>Ошибка загрузки фильмов</p>
                    <small>Проверьте подключение к интернету</small>
                </div>`;
        }
    } finally {
        isLoading = false;
        setLoadingState(false);
    }
}

// Применяет фильтры/сортировку к уже загруженным фильмам (без запроса к API)
function applyFiltersAndSort() {
    const all = data.getAllMovies();
    if (!all || all.length === 0) return;

    const filtered = filterByGenres(all, selectedGenreIds, allGenres);
    const sorted   = sortMovies(filtered, currentSort);
    currentDisplayMovies = sorted;

    render.renderMovies(sorted, 'movies-container', onMovieClick);
}

// Обработчики событий
async function onMovieClick(movieId) {
    const details = await data.fetchMovieDetails(movieId);
    if (details) render.showMovieDetails(details);
}

function onGenreChange() {
    selectedGenreIds = Array.from(
        document.querySelectorAll('#genre-checkboxes input:checked')
    ).map(cb => cb.value);

    data.setGenres(selectedGenreIds);
    // Жанровый фильтр применяем к уже загруженным
    applyFiltersAndSort();
}

function onSearch() {
    const query = document.getElementById('search-input').value.trim();
    data.setQuery(query);
    loadMoviesAndRender(true);
}

function onSortChange() {
    currentSort = document.getElementById('sort-select').value;
    data.setSort(currentSort);
    // Перезагружаем, чтобы сервер отсортировал выборку правильно
    loadMoviesAndRender(true);
}

async function onLoadMore() {
    if (isLoading) return;
    const newPage = data.getCurrentPage() + 1;
    data.setPage(newPage);
    await loadMoviesAndRender(false);
}

// Статистика
function showStats() {
    const stats   = calculateStats(currentDisplayMovies);
    const modal   = document.getElementById('stats-modal');
    const content = document.getElementById('stats-content');

    content.innerHTML = `
        <div class="stats-panel">
            <h3 class="stats-title">📊 Статистика подборки</h3>
            <div class="stats-grid">
                <div class="stat-card">
                    <span class="stat-value">${stats.total || 0}</span>
                    <span class="stat-label">Фильмов</span>
                </div>
                <div class="stat-card">
                    <span class="stat-value">${stats.avgRating || '—'}</span>
                    <span class="stat-label">Средний рейтинг</span>
                </div>
                <div class="stat-card stat-card--wide">
                    <span class="stat-label">🏆 Лучший фильм</span>
                    <span class="stat-value stat-value--sm">${escapeHtml(stats.topRatedTitle) || '—'}</span>
                    <span class="stat-sub">${stats.topRatedRating || ''}</span>
                </div>
                <div class="stat-card stat-card--wide">
                    <span class="stat-label">📅 Насыщенный год</span>
                    <span class="stat-value stat-value--sm">${stats.mostYear || '—'}</span>
                </div>
            </div>
        </div>`;

    modal.classList.remove('hidden');
}

// UI helpers
function setLoadingState(loading) {
    const btn       = document.getElementById('load-more-btn');
    const container = document.getElementById('movies-container');

    if (loading && data.getCurrentPage() === 1) {
        container.innerHTML = `
            <div class="loading-grid">
                ${Array(8).fill('<div class="skeleton-card"><div class="skeleton-poster"></div><div class="skeleton-info"><div class="skeleton-line"></div><div class="skeleton-line short"></div></div></div>').join('')}
            </div>`;
    }
    if (btn) btn.disabled = loading;
}

function closeModal() {
    document.getElementById('stats-modal').classList.add('hidden');
}

// Инициализация экрана приветствия
function initWelcome() {
    const startBtn   = document.getElementById('start-btn');
    const nameInput  = document.getElementById('user-name-input');

    const saved = getUserName();
    if (saved) nameInput.value = saved;

    const proceed = () => {
        const name = nameInput.value.trim();
        if (!name) {
            nameInput.classList.add('input-error');
            nameInput.placeholder = 'Введите имя!';
            return;
        }
        nameInput.classList.remove('input-error');
        saveUserName(name);
        document.getElementById('welcome-screen').classList.remove('active');
        document.getElementById('main-screen').classList.add('active');
        document.getElementById('greeting-message').textContent = `Привет, ${name}! 👋`;
        initMain();
    };

    startBtn.addEventListener('click', proceed);
    nameInput.addEventListener('keypress', e => { if (e.key === 'Enter') proceed(); });
    nameInput.addEventListener('input', () => nameInput.classList.remove('input-error'));
}

// Инициализация главного экрана
async function initMain() {
    allGenres = await data.fetchGenres();
    render.renderGenres(allGenres, 'genre-checkboxes', onGenreChange);

    document.getElementById('search-btn')
        .addEventListener('click', onSearch);
    document.getElementById('search-input')
        .addEventListener('keypress', e => { if (e.key === 'Enter') onSearch(); });
    document.getElementById('sort-select')
        .addEventListener('change', onSortChange);
    document.getElementById('load-more-btn')
        .addEventListener('click', onLoadMore);
    document.getElementById('show-stats-btn')
        .addEventListener('click', showStats);

    document.querySelector('.close-modal')
        .addEventListener('click', closeModal);
    document.getElementById('stats-modal')
        .addEventListener('click', e => { if (e.target === e.currentTarget) closeModal(); });

    // Закрытие по Escape
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape') closeModal();
    });

    await loadMoviesAndRender(true);
}

// Утилиты
function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

// Старт
initWelcome();
