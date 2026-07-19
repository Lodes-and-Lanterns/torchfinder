/**
 * theme.js: Lodes & Lanterns shared theme toggle
 *
 * Reads/writes the 'll-theme' localStorage key ('dark' or 'light').
 * Falls back to prefers-color-scheme on first visit.
 * Sets data-theme on <html> and syncs any .theme-toggle button.
 *
 * Usage: <script src="/common-web/theme.js"></script>
 * Button: <button class="theme-toggle" aria-label="Toggle theme">☀️</button>
 */
(function () {
  var STORAGE_KEY = 'll-theme';
  var prefersDark = globalThis.matchMedia('(prefers-color-scheme: dark)');

  function getTheme() {
    return localStorage.getItem(STORAGE_KEY) || (prefersDark.matches ? 'dark' : 'light');
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(STORAGE_KEY, theme);
    var toggle = document.querySelector('.theme-toggle');
    if (toggle) {
      toggle.textContent = theme === 'dark' ? '\u2600\uFE0F' : '\uD83C\uDF19';
      toggle.setAttribute('aria-label', theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
    }
  }

  applyTheme(getTheme());

  document.addEventListener('DOMContentLoaded', function () {
    applyTheme(getTheme());
    var toggle = document.querySelector('.theme-toggle');
    if (toggle) {
      toggle.addEventListener('click', function () {
        applyTheme(getTheme() === 'dark' ? 'light' : 'dark');
      });
    }
  });
})();
