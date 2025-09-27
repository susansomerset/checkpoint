/**
 * Font size rules based on point values for assignments
 */

export interface FontSizeConfig {
  className: string
  minPoints: number
  maxPoints: number
  description: string
}

/**
 * Font size configuration based on point values
 */
export const FONT_SIZE_CONFIGS: FontSizeConfig[] = [
  {
    className: 'text-sm',
    minPoints: 0,
    maxPoints: 9,
    description: 'Small (5-9 points)'
  },
  {
    className: 'text-base',
    minPoints: 10,
    maxPoints: 29,
    description: 'Normal (10-29 points)'
  },
  {
    className: 'text-lg font-bold',
    minPoints: 30,
    maxPoints: Infinity,
    description: 'Large and bold (30+ points)'
  }
]

/**
 * Get font size class for a given point value
 */
export const getFontSizeClass = (points: number): string => {
  const config = FONT_SIZE_CONFIGS.find(
    config => points >= config.minPoints && points <= config.maxPoints
  )
  
  return config?.className || 'text-base'
}

/**
 * Get font size description for a given point value
 */
export const getFontSizeDescription = (points: number): string => {
  const config = FONT_SIZE_CONFIGS.find(
    config => points >= config.minPoints && points <= config.maxPoints
  )
  
  return config?.description || 'Normal size'
}

/**
 * Check if assignment should be large and bold
 */
export const isLargeAndBold = (points: number): boolean => {
  return points >= 30
}

/**
 * Check if assignment should be small
 */
export const isSmall = (points: number): boolean => {
  return points >= 0 && points <= 9
}

/**
 * Check if assignment should be normal size
 */
export const isNormalSize = (points: number): boolean => {
  return points >= 10 && points <= 29
}

/**
 * Get all font size classes for testing
 */
export const getAllFontSizeClasses = (): string[] => {
  return FONT_SIZE_CONFIGS.map(config => config.className)
}

/**
 * Get font size config for testing
 */
export const getFontSizeConfig = (points: number): FontSizeConfig | undefined => {
  return FONT_SIZE_CONFIGS.find(
    config => points >= config.minPoints && points <= config.maxPoints
  )
}
