/**
 * Parse height input in various formats and extract numeric value
 * Supports: 170, 5.8, 5'8, 5' 8, 5′8 (unicode prime)
 */
export function parseHeightInput(input: string): string {
  const trimmed = input.trim();

  // Check if it's feet format (5'8 or 5' 8 or 5′8)
  const feetMatch = trimmed.match(/^(\d+)\s*['′]\s*(\d+)$/);
  if (feetMatch) {
    const feet = parseInt(feetMatch[1]);
    const inches = parseInt(feetMatch[2]);
    // Return as decimal feet (e.g., 5'8" = 5.67 feet)
    return ((feet + inches / 12).toFixed(2));
  }

  // Otherwise return as-is (should be numeric)
  return trimmed;
}

/**
 * Format height for display with unit
 */
export function formatHeightDisplay(value: string, unit: string): string {
  if (!value) return '';
  
  // If unit is feet and value looks like decimal feet, convert back to feet'inches format
  if (unit === 'ft' && value.includes('.')) {
    const decimal = parseFloat(value);
    const feet = Math.floor(decimal);
    const inches = Math.round((decimal - feet) * 12);
    return `${feet}'${inches}`;
  }
  
  return value;
}

/**
 * Parse height for input field (reverse of formatHeightDisplay)
 */
export function parseHeightForInput(value: string, unit: string): string {
  if (!value) return '';
  
  // If it's in feet'inches format, convert to decimal
  if (unit === 'ft') {
    const feetMatch = value.match(/^(\d+)'(\d+)$/);
    if (feetMatch) {
      const feet = parseInt(feetMatch[1]);
      const inches = parseInt(feetMatch[2]);
      return (feet + inches / 12).toFixed(2);
    }
  }
  
  return value;
}
