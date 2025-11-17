const STORAGE_KEY = "app_user_profile";
const defaultUser = { name: "Usuário", email: "user@example.com" };

export function loadUser() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : defaultUser;
    } catch(e) {
        return defaultUser;
    }
}

export function saveUser(user) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
}