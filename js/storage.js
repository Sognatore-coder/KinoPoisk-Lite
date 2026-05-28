const STORAGE_KEY = 'movieUser';
export function saveUserName(name) {
    localStorage.setItem(STORAGE_KEY, name);
}
export function getUserName() {
    return localStorage.getItem(STORAGE_KEY) || '';
}