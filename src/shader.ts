export const VERTEX_SHADER = `
attribute vec2 a_position;
varying vec2 vUv;
void main() {
  vUv = a_position * 0.5 + 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`

/**
 * Hyperrealistic fabric shader — folds + fibers + slow drift.
 *
 * Renders draped velvet / silk / satin / suede from one set of uniforms:
 *
 *   grain     — fiber density (0 = silk, 0.5 = satin, 1 = velvet/suede)
 *   depth     — fold depth / crushed-ness (0 = flat, 1 = crushed)
 *   roughness — sheen sharpness (low = matte broad, high = glossy tight)
 *   intensity — overall highlight strength
 *
 * The animation is the noise-field sampling itself drifting linearly
 * through u_time — true continuous flow, no sinusoidal restart.
 */
export const FRAGMENT_SHADER = `
precision highp float;
varying vec2 vUv;

uniform vec2  u_resolution;
uniform vec2  u_light;
uniform float u_time;
uniform vec3  u_color;
uniform vec3  u_sheen;
uniform float u_intensity;
uniform float u_grain;
uniform float u_depth;
uniform float u_roughness;

// ── Noise primitives ─────────────────────────────────────────
float hash21(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float vnoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash21(i),                 hash21(i + vec2(1.0, 0.0)), u.x),
    mix(hash21(i + vec2(0.0,1.0)), hash21(i + vec2(1.0, 1.0)), u.x),
    u.y
  );
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  mat2 rot = mat2(0.8, 0.6, -0.6, 0.8);
  for (int i = 0; i < 6; i++) {
    v += a * vnoise(p);
    p = rot * p * 2.0 + 11.7;
    a *= 0.5;
  }
  return v;
}

// Sharp ridge from a smooth fbm value — peaks at v=0.5, falls to 0 at the
// extremes. The basis for fabric folds: tops of ridges catch the light.
float ridge(float v) {
  return 1.0 - abs(v - 0.5) * 2.0;
}

void main() {
  vec2  uv     = vUv;
  float aspect = u_resolution.x / max(u_resolution.y, 1.0);
  vec2  cursorBias = (u_light - 0.5) * 0.4;

  // ── Linear drift — visible continuous flow ────────────────
  // Bumped well above the previous speeds so animation is obvious at
  // default speed=1. Three layers move in different directions so the
  // surface looks like it's evolving, not sliding.
  vec2 drift     = vec2(u_time * 0.090,  u_time * 0.063);
  vec2 drift2    = vec2(u_time * 0.052, -u_time * 0.118);
  vec2 megaDrift = vec2(u_time * 0.030, -u_time * 0.020);

  vec2 p = vec2(uv.x * aspect, uv.y) + cursorBias;

  // ── Primary folds — anisotropic ridges in fabric direction ──
  mat2 foldRot = mat2(0.92, 0.39, -0.39, 0.92);
  float foldFreq  = 2.6 + u_depth * 3.4;
  float fold      = fbm(foldRot * p * foldFreq + drift);
  float foldRidge = pow(ridge(fold), 1.2 + u_depth * 2.4);

  // ── Cross folds — finer, perpendicular, drifting other way ─
  mat2 foldRot2 = mat2(0.32, -0.95, 0.95, 0.32);
  float fold2Freq  = 4.2 + u_depth * 3.8;
  float fold2      = fbm(foldRot2 * p * fold2Freq + drift2);
  float foldRidge2 = pow(ridge(fold2), 1.4 + u_depth * 2.0);

  // ── Mega wash — slow low-freq brightness drift ────────────
  float mega = fbm(p * 0.85 + megaDrift);

  // ── Fiber pile — fine grain you only see in velvet/suede ──
  float pixelDensity = max(u_resolution.x, u_resolution.y) / 700.0;
  float fineFreq = mix(60.0, 360.0, u_grain) * (0.6 + pixelDensity * 0.4);
  float fine     = vnoise(p * fineFreq);
  // u_roughness sharpens or softens the fiber dots.
  float fineLo = mix(0.55, 0.42, u_roughness / 10.0);
  float fineHi = mix(0.66, 0.55, u_roughness / 10.0);
  fine = smoothstep(fineLo, fineHi, fine);

  // Second fiber layer at offset angle keeps the grain from looking grid-y
  mat2 fineRot = mat2(0.95, 0.31, -0.31, 0.95);
  float fine2  = vnoise(fineRot * p * fineFreq * 1.7 + 19.0);
  fine2 = smoothstep(0.48, 0.6, fine2);
  fine  = max(fine, fine2 * 0.55);

  // ── Brightness composition ─────────────────────────────────
  // Kept in [0, 1] so the base color never blows past saturation —
  // earlier versions multiplied by a (0.72 + mega * 0.55) factor that
  // amplified the base above 1.0 in ridge highlights, which read as
  // pure white at small element sizes.
  float ridges = foldRidge * 0.6 + foldRidge2 * 0.4;
  float brightness = 0.28 + ridges * 0.55;
  brightness += (mega - 0.5) * 0.22;
  brightness += fine * 0.10 * u_intensity * (0.2 + u_grain * 0.8);
  vec2 edge = (uv - 0.5) * 2.0;
  brightness *= 1.0 - dot(edge, edge) * 0.13;
  brightness = clamp(brightness, 0.0, 1.0);

  vec3 base = u_color * brightness;

  // ── Specular sheen on the brightest fold ridges ──────────
  // Capped at 0.55 max contribution so the velvet color always shows
  // through. u_roughness tightens the falloff: low = broad matte glow,
  // high = tight glossy silk highlight.
  float sheenMask = smoothstep(0.55, 0.92, ridges * (0.7 + mega * 0.45));
  sheenMask = pow(sheenMask, max(1.0, u_roughness * 0.4));
  sheenMask = sheenMask * u_intensity * 0.55;

  // Mix toward sheen but never fully — keep the base color readable
  vec3 col = mix(base, u_sheen, sheenMask);

  // Subsurface warmth from fiber detail keeps highlights from going bland
  col += u_color * fine * 0.04 * u_intensity;

  col = pow(max(col, 0.0), vec3(0.92));

  gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}
`
