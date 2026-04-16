// AOS (Animate On Scroll) initialisation — kept in a separate file so the
// Content-Security-Policy can omit 'unsafe-inline' from script-src.
AOS.init({
  duration: 800,
  easing: "ease-in-out",
  once: true,
  mirror: false
});
