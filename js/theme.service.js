export class ThemeService {
  constructor() {
    this.theme = localStorage.getItem("theme") || "dark";
    this.initTheme();
  }

  initTheme() {
    document.body.classList.toggle("light-theme", this.isLight);
    document.documentElement.style.colorScheme = this.isLight
      ? "light"
      : "dark";
  }

  toggle() {
    this.theme = this.isLight ? "dark" : "light";
    localStorage.setItem("theme", this.theme);
    document.body.classList.toggle("light-theme", this.isLight);
    document.documentElement.style.colorScheme = this.isLight
      ? "light"
      : "dark";
    return this.theme;
  }

  get isLight() {
    return this.theme === "light";
  }
}
