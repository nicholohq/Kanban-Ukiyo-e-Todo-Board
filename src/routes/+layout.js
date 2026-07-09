// This is a fully client-side app: state lives in localStorage and there is no
// backend. Disable SSR so browser-only APIs are safe, but still prerender the
// shell so GitHub Pages has a static index.html to serve.
export const ssr = false;
export const prerender = true;
