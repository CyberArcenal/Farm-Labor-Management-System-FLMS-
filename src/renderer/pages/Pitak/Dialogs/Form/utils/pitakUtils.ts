// pitakUtils.ts
// Utility functions for calculating pitak area using traditional tali/buhol system

/**
 * Conversion constants
 */
export const BUHOL_TO_METERS = 50;
export const TALI_TO_BUHOL = 10;
export const TALI_TO_METERS = BUHOL_TO_METERS * TALI_TO_BUHOL; // 500m
export const LUWANG_PER_HECTARE = 20;

/**
 * Convert buhol count to meters
 */
export function buholToMeters(buhol: number): number {
  return buhol * BUHOL_TO_METERS;
}

/**
 * Convert tali count to buhol
 */
export function taliToBuhol(tali: number): number {
  return tali * TALI_TO_BUHOL;
}

/**
 * Convert sqm to luwang (traditional: 1 tali × 1 tali = 1 luwang)
 * Here we scale relative to tali-square
 */
export function sqmToLuwang(areaSqm: number): number {
  const taliSquare = TALI_TO_METERS * TALI_TO_METERS; // 500m × 500m = 250,000 sqm
  return areaSqm / taliSquare; // Ito ang tamang conversion
}

/**
 * Convert luwang to hectare
 */
export function luwangToHectare(luwang: number): number {
  return luwang / LUWANG_PER_HECTARE;
}

/**
 * Square pitak area (side in buhol)
 */
export function calculateSquare(sideBuhol: number) {
  const sideMeters = buholToMeters(sideBuhol);
  const areaSqm = sideMeters * sideMeters;
  const luwang = sqmToLuwang(areaSqm);
  const hectare = luwangToHectare(luwang);
  return { areaSqm, luwang, hectare };
}

/**
 * Rectangle pitak area (length & width in buhol)
 */
export function calculateRectangle(lengthBuhol: number, widthBuhol: number) {
  const lengthMeters = buholToMeters(lengthBuhol);
  const widthMeters = buholToMeters(widthBuhol);
  const areaSqm = lengthMeters * widthMeters;
  const luwang = sqmToLuwang(areaSqm);
  const hectare = luwangToHectare(luwang);
  return { areaSqm, luwang, hectare };
}

/**
 * Triangle pitak area (base & height in buhol)
 */
export function calculateTriangleBaseHeight(baseBuhol: number, heightBuhol: number) {
  const baseMeters = buholToMeters(baseBuhol);
  const heightMeters = buholToMeters(heightBuhol);
  const areaSqm = (baseMeters * heightMeters) / 2;
  const luwang = sqmToLuwang(areaSqm);
  const hectare = luwangToHectare(luwang);
  return { areaSqm, luwang, hectare };
}

/**
 * Triangle pitak area (Heron's formula, 3 sides in buhol)
 */
export function calculateTriangleHeron(aBuhol: number, bBuhol: number, cBuhol: number) {
  const a = buholToMeters(aBuhol);
  const b = buholToMeters(bBuhol);
  const c = buholToMeters(cBuhol);
  const s = (a + b + c) / 2;
  const areaSqm = Math.sqrt(s * (s - a) * (s - b) * (s - c));
  const luwang = sqmToLuwang(areaSqm);
  const hectare = luwangToHectare(luwang);
  return { areaSqm, luwang, hectare };
}

/**
 * Circle pitak area (radius in buhol)
 */
export function calculateCircle(radiusBuhol: number) {
  const radiusMeters = buholToMeters(radiusBuhol);
  const areaSqm = Math.PI * radiusMeters * radiusMeters;
  const luwang = sqmToLuwang(areaSqm);
  const hectare = luwangToHectare(luwang);
  return { areaSqm, luwang, hectare };
}