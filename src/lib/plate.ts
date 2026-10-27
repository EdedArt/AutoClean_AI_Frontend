export const INVALID_PLATE_MESSAGE = 'Formato de placa no válido. Ejemplo: ABC-123';

const PLATE_REGEX = /^[A-Z]{3}-\d{3}$/;

/**
 * Formats user input into standard license plate notation:
 * - Converts to uppercase
 * - Strips all non-alphanumeric characters
 * - Inserts a hyphen after the first 3 characters
 * - Clamps at 7 total characters (e.g. ABC-123)
 */
export function formatPlateInput(raw: string): string {
  const cleaned = raw.toUpperCase().replace(/[^A-Z0-9]/g, '');

  if (cleaned.length <= 3) {
    return cleaned;
  }

  const letters = cleaned.slice(0, 3);
  const digitsOrChars = cleaned.slice(3, 6);

  return `${letters}-${digitsOrChars}`;
}

/**
 * Validates if the given plate strictly satisfies the backend plate format:
 * Exactly three uppercase letters, a hyphen, and three digits (e.g. ABC-123).
 */
export function isValidPlate(value: string): boolean {
  return PLATE_REGEX.test(value.trim());
}
