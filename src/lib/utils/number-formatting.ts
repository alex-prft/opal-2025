/**
 * Number Formatting Utilities
 *
 * Provides safe numeric formatting functions that prevent NaN from being rendered
 * as React children, which causes console warnings.
 */

/**
 * Safely rounds a number, preventing NaN from being rendered as React children
 * @param value - The value to round
 * @param fallback - The fallback value if the input is not a valid number (default: 0)
 * @returns A valid number, never NaN
 */
export function safeRound(value: unknown, fallback: number = 0): number {
  if (typeof value !== 'number' || !isFinite(value) || isNaN(value)) {
    return fallback;
  }
  return Math.round(value);
}

/**
 * Safely floors a number, preventing NaN from being rendered as React children
 * @param value - The value to floor
 * @param fallback - The fallback value if the input is not a valid number (default: 0)
 * @returns A valid number, never NaN
 */
export function safeFloor(value: unknown, fallback: number = 0): number {
  if (typeof value !== 'number' || !isFinite(value) || isNaN(value)) {
    return fallback;
  }
  return Math.floor(value);
}

/**
 * Safely ceils a number, preventing NaN from being rendered as React children
 * @param value - The value to ceil
 * @param fallback - The fallback value if the input is not a valid number (default: 0)
 * @returns A valid number, never NaN
 */
export function safeCeil(value: unknown, fallback: number = 0): number {
  if (typeof value !== 'number' || !isFinite(value) || isNaN(value)) {
    return fallback;
  }
  return Math.ceil(value);
}

/**
 * Safely formats a number as a percentage
 * @param value - The decimal value to convert to percentage (0.75 = 75%)
 * @param fallback - The fallback percentage if the input is not valid (default: 0)
 * @param decimals - Number of decimal places (default: 0)
 * @returns A formatted percentage string like "75%"
 */
export function safePercentage(value: unknown, fallback: number = 0, decimals: number = 0): string {
  if (typeof value !== 'number' || !isFinite(value) || isNaN(value)) {
    return `${fallback}%`;
  }

  const percentage = value * 100;
  if (!isFinite(percentage) || isNaN(percentage)) {
    return `${fallback}%`;
  }

  return `${percentage.toFixed(decimals)}%`;
}

/**
 * Safely formats a confidence score as a percentage
 * @param confidence - The confidence value (can be 0-1 decimal or 0-100 percentage)
 * @param fallback - The fallback value if invalid (default: 75)
 * @returns A formatted percentage string like "85%"
 */
export function safeConfidenceScore(confidence: unknown, fallback: number = 75): string {
  if (typeof confidence !== 'number' || !isFinite(confidence) || isNaN(confidence)) {
    return `${fallback}%`;
  }

  // Convert to percentage if it's a decimal (0-1 range, but allow for values like 1.5 as 150%)
  let percentage = confidence;
  if (confidence <= 1 && confidence >= 0) {
    percentage = confidence * 100;
  } else if (confidence > 1 && confidence <= 2) {
    // Values between 1-2 are treated as percentages (1.5 = 150%)
    percentage = confidence * 100;
  }

  // Validate the result
  if (!isFinite(percentage) || isNaN(percentage)) {
    return `${fallback}%`;
  }

  // Clamp to reasonable bounds
  percentage = Math.max(0, Math.min(100, percentage));

  return `${Math.round(percentage)}%`;
}

/**
 * Safely formats a numeric value for display, ensuring it's never NaN
 * @param value - The value to format
 * @param fallback - The fallback value if invalid (default: 0)
 * @param decimals - Number of decimal places (default: 0)
 * @returns A formatted number string
 */
export function safeNumericDisplay(value: unknown, fallback: number = 0, decimals: number = 0): string {
  if (typeof value !== 'number' || !isFinite(value) || isNaN(value)) {
    return fallback.toFixed(decimals);
  }
  return value.toFixed(decimals);
}

/**
 * Safely calculates an average from an array of numbers
 * @param values - Array of numeric values
 * @param fallback - Fallback value if calculation fails (default: 0)
 * @returns The average value, never NaN
 */
export function safeAverage(values: unknown[], fallback: number = 0): number {
  if (!Array.isArray(values) || values.length === 0) {
    return fallback;
  }

  const validNumbers = values.filter(v => typeof v === 'number' && isFinite(v) && !isNaN(v)) as number[];

  if (validNumbers.length === 0) {
    return fallback;
  }

  const sum = validNumbers.reduce((acc, val) => acc + val, 0);
  const average = sum / validNumbers.length;

  if (!isFinite(average) || isNaN(average)) {
    return fallback;
  }

  return average;
}

/**
 * Safely formats a score out of a maximum value (e.g., "85/100")
 * @param score - The current score
 * @param max - The maximum possible score
 * @param fallback - Fallback score if invalid (default: 0)
 * @returns A formatted score string like "85/100"
 */
export function safeScoreDisplay(score: unknown, max: number, fallback: number = 0): string {
  const safeScore = typeof score === 'number' && isFinite(score) && !isNaN(score) ? score : fallback;
  const safeMax = typeof max === 'number' && isFinite(max) && !isNaN(max) ? max : 100;

  return `${Math.round(safeScore)}/${Math.round(safeMax)}`;
}

/**
 * Validates that a value is a safe number for React rendering
 * @param value - The value to check
 * @returns True if the value is safe to render, false if it would cause React warnings
 */
export function isSafeForRendering(value: unknown): boolean {
  if (typeof value === 'number') {
    return isFinite(value) && !isNaN(value);
  }
  return true; // Non-numbers are generally safe
}

/**
 * Makes any value safe for React children rendering by converting problematic numbers
 * @param value - The value to make safe
 * @param fallback - Fallback for invalid numbers (default: 0)
 * @returns A value that's safe to render as React children
 */
export function makeSafeForChildren(value: unknown, fallback: unknown = 0): any {
  if (typeof value === 'number') {
    if (isNaN(value) || !isFinite(value)) {
      return fallback;
    }
  }
  return value;
}