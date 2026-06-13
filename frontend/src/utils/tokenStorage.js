/**
 * Secure cookie-based token storage.
 * Uses Secure + SameSite flags for HTTPS environments.
 */

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

function setCookie(name, value, days = 1) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Strict${secure}`;
}

function getCookie(name) {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? decodeURIComponent(match[2]) : null;
}

function deleteCookie(name) {
  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Strict${secure}`;
}

export function setToken(token) {
  setCookie(TOKEN_KEY, token);
}

export function getToken() {
  return getCookie(TOKEN_KEY);
}

export function removeToken() {
  deleteCookie(TOKEN_KEY);
}

export function setUserData(user) {
  setCookie(USER_KEY, JSON.stringify(user));
}

export function getUserData() {
  const raw = getCookie(USER_KEY);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

export function removeUserData() {
  deleteCookie(USER_KEY);
}

export function clearAuth() {
  removeToken();
  removeUserData();
}
