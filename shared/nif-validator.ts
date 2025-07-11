/**
 * Portuguese NIF (Número de Identificação Fiscal) Validator
 * Validates Portuguese tax identification numbers according to official rules
 */

export interface NIFValidationResult {
  isValid: boolean;
  formatted: string;
  type: 'individual' | 'company' | 'other' | 'unknown';
  errors: string[];
}

export class NIFValidator {
  // NIF type mappings based on first digit(s)
  private static readonly NIF_TYPES = {
    individual: [1, 2, 3],
    company: [5, 6, 7, 8, 9],
    other: [4] // Non-residents, special cases
  };

  /**
   * Validates a Portuguese NIF
   */
  static validate(nif: string): NIFValidationResult {
    const result: NIFValidationResult = {
      isValid: false,
      formatted: '',
      type: 'unknown',
      errors: []
    };

    // Clean input
    const cleanNif = nif.replace(/\s+/g, '').replace(/[^0-9]/g, '');
    
    // Check length
    if (cleanNif.length !== 9) {
      result.errors.push('NIF deve ter exatamente 9 dígitos');
      return result;
    }

    // Check if all digits are the same
    if (/^(\d)\1{8}$/.test(cleanNif)) {
      result.errors.push('NIF não pode ter todos os dígitos iguais');
      return result;
    }

    // Get first digit and determine type
    const firstDigit = parseInt(cleanNif[0]);
    let type: 'individual' | 'company' | 'other' | 'unknown' = 'unknown';
    
    if (this.NIF_TYPES.individual.includes(firstDigit)) {
      type = 'individual';
    } else if (this.NIF_TYPES.company.includes(firstDigit)) {
      type = 'company';
    } else if (this.NIF_TYPES.other.includes(firstDigit)) {
      type = 'other';
    } else {
      result.errors.push('Primeiro dígito do NIF inválido');
      return result;
    }

    // Validate check digit
    if (!this.validateCheckDigit(cleanNif)) {
      result.errors.push('Dígito de controlo do NIF inválido');
      return result;
    }

    result.isValid = true;
    result.formatted = this.formatNIF(cleanNif);
    result.type = type;
    
    return result;
  }

  /**
   * Validates the check digit using Portuguese NIF algorithm
   */
  private static validateCheckDigit(nif: string): boolean {
    const digits = nif.split('').map(d => parseInt(d));
    const weights = [9, 8, 7, 6, 5, 4, 3, 2];
    
    let sum = 0;
    for (let i = 0; i < 8; i++) {
      sum += digits[i] * weights[i];
    }
    
    const remainder = sum % 11;
    const checkDigit = remainder < 2 ? 0 : 11 - remainder;
    
    return checkDigit === digits[8];
  }

  /**
   * Formats NIF with spaces for better readability
   */
  static formatNIF(nif: string): string {
    const cleanNif = nif.replace(/\s+/g, '').replace(/[^0-9]/g, '');
    if (cleanNif.length === 9) {
      return `${cleanNif.substring(0, 3)} ${cleanNif.substring(3, 6)} ${cleanNif.substring(6, 9)}`;
    }
    return cleanNif;
  }

  /**
   * Removes formatting from NIF
   */
  static cleanNIF(nif: string): string {
    return nif.replace(/\s+/g, '').replace(/[^0-9]/g, '');
  }

  /**
   * Check if NIF might be valid (quick check without full validation)
   */
  static quickCheck(nif: string): boolean {
    const cleanNif = this.cleanNIF(nif);
    return cleanNif.length === 9 && /^\d{9}$/.test(cleanNif);
  }
}

/**
 * Online NIF validation using Portuguese tax authority API
 * Note: This would require the actual API implementation
 */
export class NIFOnlineValidator {
  static async validateOnline(nif: string): Promise<{
    isValid: boolean;
    companyName?: string;
    address?: string;
    status?: string;
    error?: string;
  }> {
    // This is a placeholder for the actual Portuguese tax authority API
    // In a real implementation, this would call the official API
    console.log('Online NIF validation not implemented - would call Portuguese tax authority API');
    
    // For now, just do local validation
    const localResult = NIFValidator.validate(nif);
    return {
      isValid: localResult.isValid,
      error: localResult.errors.join(', ') || undefined
    };
  }
}

// Export utility functions
export const validateNIF = NIFValidator.validate;
export const formatNIF = NIFValidator.formatNIF;
export const cleanNIF = NIFValidator.cleanNIF;