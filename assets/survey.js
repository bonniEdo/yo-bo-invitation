(() => {
  'use strict';
  // Keep a working link in HTML for browsers with scripts disabled.
  const configured = window.SURVEY_CONFIG?.googleFormUrl;
  if (!configured) return;
  try {
    const url = new URL(configured);
    if (url.origin !== 'https://docs.google.com' || !/^\/forms\/d\/e\/[\w-]+\/viewform$/.test(url.pathname) || url.username || url.password) return;
    document.querySelectorAll('[data-survey-link]').forEach(link => { link.href = url.href; });
  } catch { /* The original HTML links remain available. */ }
})();
