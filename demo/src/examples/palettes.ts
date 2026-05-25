import type { Theme } from "../hooks/useTheme";

export type Palette = { color: string; sheen: string };

/**
 * Per-example velvet palettes, themed. Light-theme variants are slightly
 * lighter and warmer so the velvet reads against the cream page bg the
 * same way the dark variants read against #070707.
 */
export const PALETTES: Record<string, Record<Theme, Palette>> = {
  hero: {
    dark: { color: "#ff0022", sheen: "#ffffff" },
    light: { color: "#ff0022", sheen: "#ffffff" },
  },
  card: {
    dark: { color: "#8B0000", sheen: "#ffb8b8" },
    light: { color: "#a82828", sheen: "#ffd4d4" },
  },
  border: {
    dark: { color: "#1a4a2a", sheen: "#7cffb0" },
    light: { color: "#00ff59", sheen: "#ffffff" },
  },
  text: {
    dark: { color: "#7700ff", sheen: "#ebbeff" },
    light: { color: "#bc7eff", sheen: "#9c6bff" },
  },
  overlay: {
    dark: { color: "#7d7dff", sheen: "#ffffff" },
    light: { color: "#0000ff", sheen: "#ffffff" },
  },
};
