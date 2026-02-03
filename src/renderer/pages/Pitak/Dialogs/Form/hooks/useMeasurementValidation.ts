import { useState, useCallback } from 'react';
import type { BuholInputs } from '../utils/measurement';

export const useMeasurementValidation = () => {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateBuholInput = useCallback((
    value: number,
    fieldName: string,
    required = true
  ): string => {
    // Check if value is provided
    if (required && (value === undefined || value === null || isNaN(value))) {
      return `${fieldName} is required`;
    }
    
    // Check for negative values
    if (value < 0) {
      return `${fieldName} cannot be negative`;
    }
    
    // Check for zero value when required
    if (required && value <= 0) {
      return `${fieldName} must be greater than 0 buhol`;
    }
    
    // Allow decimals, so remove the integer check
    // if (!Number.isInteger(value)) {
    //   return `${fieldName} must be a whole number (buhol)`;
    // }
    
    // Increased max value to accommodate decimals
    if (value > 2000) {
      return `${fieldName} cannot exceed 2000 buhol`;
    }
    
    // Validate precision (allow up to 2 decimal places)
    const decimalPlaces = (value.toString().split('.')[1] || '').length;
    if (decimalPlaces > 2) {
      return `${fieldName} cannot have more than 2 decimal places`;
    }
    
    return '';
  }, []);

  const validateShapeInputs = useCallback((
    layoutType: string,
    inputs: BuholInputs,
    triangleMode?: 'base_height' | 'three_sides'
  ): Record<string, string> => {
    const newErrors: Record<string, string> = {};

    switch (layoutType) {
      case 'square':
        newErrors.side = validateBuholInput(inputs.side || 0, 'Side');
        break;

      case 'rectangle':
        newErrors.length = validateBuholInput(inputs.length || 0, 'Length');
        newErrors.width = validateBuholInput(inputs.width || 0, 'Width');
        break;

      case 'triangle':
        if (triangleMode === 'base_height') {
          newErrors.base = validateBuholInput(inputs.base || 0, 'Base');
          newErrors.height = validateBuholInput(inputs.height || 0, 'Height');
        } else {
          newErrors.sideA = validateBuholInput(inputs.sideA || 0, 'Side A');
          newErrors.sideB = validateBuholInput(inputs.sideB || 0, 'Side B');
          newErrors.sideC = validateBuholInput(inputs.sideC || 0, 'Side C');
        }
        break;

      case 'circle':
        newErrors.radius = validateBuholInput(inputs.radius || 0, 'Radius');
        break;
    }

    return newErrors;
  }, [validateBuholInput]);

  const clearError = useCallback((fieldName: string) => {
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[fieldName];
      return newErrors;
    });
  }, []);

  const clearAllErrors = useCallback(() => {
    setErrors({});
  }, []);

  return {
    errors,
    setErrors,
    validateBuholInput,
    validateShapeInputs,
    clearError,
    clearAllErrors,
  };
};