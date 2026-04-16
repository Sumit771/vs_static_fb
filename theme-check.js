// theme-check.js
// Blocking script to prevent FOUC (Flash of Unstyled Content) 
// Must be loaded in <head>
(function() {
  if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
})();
