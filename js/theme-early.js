"use strict";
// Wordt synchroon in <head> geladen: het thema zetten vóór de eerste weergave voorkomt een flits van het verkeerde thema.
(() => {
  let pref = "auto"; try { pref = localStorage.getItem("imdf-theme") || "auto"; } catch {}
  const dk = pref === "dark" || (pref === "auto" && matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.dataset.theme = dk ? "dark" : "light";
})();
