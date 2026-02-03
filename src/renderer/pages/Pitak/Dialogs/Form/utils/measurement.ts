// Traditional Measurement System Constants
import * as pitakUtils from './pitakUtils';

export const MEASUREMENT_CONSTANTS = {
  BUHOL_TO_METERS: pitakUtils.BUHOL_TO_METERS,
  TALI_TO_BUHOL: pitakUtils.TALI_TO_BUHOL,
  TALI_TO_METERS: pitakUtils.TALI_TO_METERS,
  LUWANG_TO_SQM: pitakUtils.TALI_TO_METERS * pitakUtils.TALI_TO_METERS, // 500 * 500 = 250,000
  LUWANG_PER_HECTARE: pitakUtils.LUWANG_PER_HECTARE,
};

// Traditional measurement types
export type LayoutType = 'square' | 'rectangle' | 'triangle' | 'circle' | '';
export type TriangleMode = 'base_height' | 'three_sides';
export type MeasurementMethod =
  | 'square_tali'
  | 'rectangle_tali'
  | 'triangle_base_height_buhol'
  | 'triangle_heron_buhol'
  | 'circle_buhol'
  | '';

// Buhol-based inputs interface
export interface BuholInputs {
  [key: string]: number;
}

// Calculation results WITH hectare
export interface CalculationResult {
  areaSqm: number;
  totalLuwang: number;
  totalHectare?: number;
  convertedMeasurements?: {
    buhol: Record<string, number>;
    meters: Record<string, number>;
    tali: Record<string, number>;
  };
}

// Traditional conversion functions WITH hectare
export class TraditionalMeasurement {
  static readonly BUHOL_TO_METERS = MEASUREMENT_CONSTANTS.BUHOL_TO_METERS;
  static readonly TALI_TO_BUHOL = MEASUREMENT_CONSTANTS.TALI_TO_BUHOL;
  static readonly TALI_TO_METERS = MEASUREMENT_CONSTANTS.TALI_TO_METERS;
  static readonly LUWANG_TO_SQM = MEASUREMENT_CONSTANTS.LUWANG_TO_SQM;
  static readonly LUWANG_PER_HECTARE = MEASUREMENT_CONSTANTS.LUWANG_PER_HECTARE;

  static buholToMeters(buhol: number): number {
    return pitakUtils.buholToMeters(buhol);
  }

  static metersToBuhol(meters: number): number {
    return meters / this.BUHOL_TO_METERS;
  }

  static buholToTali(buhol: number): number {
    return buhol / this.TALI_TO_BUHOL;
  }

  static taliToBuhol(tali: number): number {
    return pitakUtils.taliToBuhol(tali);
  }

  static sqmToLuwang(sqm: number): number {
    return pitakUtils.sqmToLuwang(sqm);
  }

  static luwangToSqm(luwang: number): number {
    return luwang * this.LUWANG_TO_SQM;
  }

  static calculateArea(
    layoutType: LayoutType,
    inputs: BuholInputs,
    method?: TriangleMode
  ): CalculationResult {
    let areaSqm = 0;

    switch (layoutType) {
      case 'square': {
        const result = pitakUtils.calculateSquare(inputs.side || 0);
        areaSqm = result.areaSqm;
        break;
      }
      case 'rectangle': {
        const result = pitakUtils.calculateRectangle(inputs.length || 0, inputs.width || 0);
        areaSqm = result.areaSqm;
        break;
      }
      case 'triangle': {
        if (method === 'base_height') {
          const result = pitakUtils.calculateTriangleBaseHeight(inputs.base || 0, inputs.height || 0);
          areaSqm = result.areaSqm;
        } else {
          const result = pitakUtils.calculateTriangleHeron(inputs.sideA || 0, inputs.sideB || 0, inputs.sideC || 0);
          areaSqm = result.areaSqm;
        }
        break;
      }
      case 'circle': {
        const result = pitakUtils.calculateCircle(inputs.radius || 0);
        areaSqm = result.areaSqm;
        break;
      }
      default:
        areaSqm = 0;
    }

    const totalLuwang = this.sqmToLuwang(areaSqm);
    const totalHectare = totalLuwang / this.LUWANG_PER_HECTARE;

    return { areaSqm, totalLuwang, totalHectare };
  }

  static getMeasurementMethod(
    layoutType: LayoutType,
    method?: TriangleMode
  ): MeasurementMethod {
    switch (layoutType) {
      case 'square':
        return 'square_tali';
      case 'rectangle':
        return 'rectangle_tali';
      case 'triangle':
        return method === 'base_height'
          ? 'triangle_base_height_buhol'
          : 'triangle_heron_buhol';
      case 'circle':
        return 'circle_buhol';
      default:
        return '';
    }
  }

  static formatBuholInput(value: number): string {
    const tali = Math.floor(value / this.TALI_TO_BUHOL);
    const remainingBuhol = value % this.TALI_TO_BUHOL;

    if (tali === 0) return `${remainingBuhol} buhol`;
    if (remainingBuhol === 0) return `${tali} tali`;
    return `${tali} tali ${remainingBuhol} buhol`;
  }

  static getConversionExplanation(
    layoutType: LayoutType,
    inputs: BuholInputs
  ): string[] {
    const explanations: string[] = [];

    explanations.push('Traditional Measurement System:');
    explanations.push('• 1 buhol = 50 meters');
    explanations.push('• 1 tali = 10 buhol = 500 meters');
    explanations.push(`• 1 luwang = 1 square tali = 500m × 500m = ${this.TALI_TO_METERS * this.TALI_TO_METERS} sqm`);

    switch (layoutType) {
      case 'square':
        if (inputs.side) {
          explanations.push(`• Side: ${this.formatBuholInput(inputs.side)}`);
          const sideMeters = this.buholToMeters(inputs.side);
          explanations.push(`  = ${sideMeters} meters`);
        }
        break;
      case 'rectangle':
        if (inputs.length && inputs.width) {
          explanations.push(`• Length: ${this.formatBuholInput(inputs.length)}`);
          explanations.push(`• Width: ${this.formatBuholInput(inputs.width)}`);
          const lengthMeters = this.buholToMeters(inputs.length);
          const widthMeters = this.buholToMeters(inputs.width);
          explanations.push(`  = ${lengthMeters} × ${widthMeters} meters`);
        }
        break;
      case 'triangle':
        if (inputs.base && inputs.height) {
          explanations.push(`• Base: ${this.formatBuholInput(inputs.base)}`);
          explanations.push(`• Height: ${this.formatBuholInput(inputs.height)}`);
          const baseMeters = this.buholToMeters(inputs.base);
          const heightMeters = this.buholToMeters(inputs.height);
          explanations.push(`  = ${baseMeters} × ${heightMeters} meters`);
        } else if (inputs.sideA && inputs.sideB && inputs.sideC) {
          explanations.push(`• Side A: ${this.formatBuholInput(inputs.sideA)}`);
          explanations.push(`• Side B: ${this.formatBuholInput(inputs.sideB)}`);
          explanations.push(`• Side C: ${this.formatBuholInput(inputs.sideC)}`);
          const aMeters = this.buholToMeters(inputs.sideA);
          const bMeters = this.buholToMeters(inputs.sideB);
          const cMeters = this.buholToMeters(inputs.sideC);
          explanations.push(`  = ${aMeters}, ${bMeters}, ${cMeters} meters`);
        }
        break;
      case 'circle':
        if (inputs.radius) {
          explanations.push(`• Radius: ${this.formatBuholInput(inputs.radius)}`);
          const radiusMeters = this.buholToMeters(inputs.radius);
          explanations.push(`  = ${radiusMeters} meters`);
        }
        break;
    }

    return explanations;
  }
}