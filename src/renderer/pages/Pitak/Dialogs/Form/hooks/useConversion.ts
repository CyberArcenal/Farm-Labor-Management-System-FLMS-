import { useCallback } from 'react';

export const useConversion = () => {
  // Conversion constants
  const BUHOL_TO_METERS = 50;
  const TALI_TO_BUHOL = 10;
  const TALI_TO_METERS = BUHOL_TO_METERS * TALI_TO_BUHOL; // 500m
  const LUWANG_TO_SQM = TALI_TO_METERS * TALI_TO_METERS; // 250,000 sqm
  const LUWANG_PER_HECTARE = 20;

  // Convert buhol to meters
  const buholToMeters = useCallback((buhol: number): number => {
    return buhol * BUHOL_TO_METERS;
  }, []);

  // Convert meters to buhol
  const metersToBuhol = useCallback((meters: number): number => {
    return meters / BUHOL_TO_METERS;
  }, []);

  // Convert buhol to tali
  const buholToTali = useCallback((buhol: number): number => {
    return buhol / TALI_TO_BUHOL;
  }, []);

  // Convert tali to buhol
  const taliToBuhol = useCallback((tali: number): number => {
    return tali * TALI_TO_BUHOL;
  }, []);

  // Convert sqm to luwang (traditional: 1 square tali = 1 luwang)
  const sqmToLuwang = useCallback((sqm: number): number => {
    return sqm / LUWANG_TO_SQM;
  }, []);

  // Convert luwang to hectare
  const luwangToHectare = useCallback((luwang: number): number => {
    return luwang / LUWANG_PER_HECTARE;
  }, []);

  return {
    BUHOL_TO_METERS,
    TALI_TO_BUHOL,
    TALI_TO_METERS,
    LUWANG_TO_SQM,
    LUWANG_PER_HECTARE,
    buholToMeters,
    metersToBuhol,
    buholToTali,
    taliToBuhol,
    sqmToLuwang,
    luwangToHectare,
  };
};