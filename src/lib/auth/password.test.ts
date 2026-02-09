import {
  validatePassword,
  getPasswordStrengthColor,
  getPasswordStrengthLabel,
} from './password'

describe('validatePassword', () => {
  it('validates a strong password (all requirements met)', () => {
    const result = validatePassword('MyStr0ng!Pass')

    expect(result.isValid).toBe(true)
    expect(result.score).toBe(5)
    expect(result.requirements.minLength).toBe(true)
    expect(result.requirements.hasUppercase).toBe(true)
    expect(result.requirements.hasLowercase).toBe(true)
    expect(result.requirements.hasNumber).toBe(true)
    expect(result.requirements.hasSpecial).toBe(true)
    expect(result.message).toBe('Strong password')
  })

  it('rejects passwords shorter than 8 characters', () => {
    const result = validatePassword('Ab1!')

    expect(result.isValid).toBe(false)
    expect(result.requirements.minLength).toBe(false)
    expect(result.message).toContain('8 characters')
  })

  it('rejects passwords without uppercase', () => {
    const result = validatePassword('lowercase1!')

    expect(result.isValid).toBe(false)
    expect(result.requirements.hasUppercase).toBe(false)
    expect(result.requirements.hasLowercase).toBe(true)
    expect(result.message).toBe('Add an uppercase letter')
  })

  it('rejects passwords without lowercase', () => {
    const result = validatePassword('UPPERCASE1!')

    expect(result.isValid).toBe(false)
    expect(result.requirements.hasLowercase).toBe(false)
    expect(result.requirements.hasUppercase).toBe(true)
    expect(result.message).toBe('Add a lowercase letter')
  })

  it('rejects passwords without a number', () => {
    const result = validatePassword('NoNumber!!')

    expect(result.isValid).toBe(false)
    expect(result.requirements.hasNumber).toBe(false)
    expect(result.message).toBe('Add a number')
  })

  it('rejects passwords without special character', () => {
    const result = validatePassword('NoSpecial1A')

    expect(result.isValid).toBe(false)
    expect(result.requirements.hasSpecial).toBe(false)
    expect(result.message).toBe('Add a special character (!@#$%^&*)')
  })

  it('handles empty string', () => {
    const result = validatePassword('')

    expect(result.isValid).toBe(false)
    expect(result.score).toBe(0)
    expect(result.requirements.minLength).toBe(false)
  })

  it('score increments with each requirement met', () => {
    // 0 requirements: empty
    expect(validatePassword('').score).toBe(0)

    // 1 requirement: just lowercase (length < 8)
    expect(validatePassword('abc').score).toBe(1)

    // 2 requirements: lowercase + uppercase (length < 8)
    expect(validatePassword('abcABC').score).toBe(2)

    // 3 requirements: length + lowercase + uppercase
    expect(validatePassword('abcABCde').score).toBe(3)

    // 4 requirements: length + lower + upper + number
    expect(validatePassword('abcABC1e').score).toBe(4)

    // 5 requirements: all
    expect(validatePassword('abcABC1!').score).toBe(5)
  })

  it('recognizes various special characters', () => {
    const specials = ['!', '@', '#', '$', '%', '^', '&', '*', '(', ')', '-', '_', '+', '=', '[', ']', '{', '}', ';', ':', "'", '"', '\\', '|', ',', '.', '<', '>', '/', '?']

    for (const char of specials) {
      const result = validatePassword(`Test123${char}x`)
      expect(result.requirements.hasSpecial).toBe(true)
    }
  })

  it('treats exactly 8 characters as meeting min length', () => {
    const result = validatePassword('Aa1!xxxx') // exactly 8 chars

    expect(result.requirements.minLength).toBe(true)
    expect(result.isValid).toBe(true)
  })
})

describe('getPasswordStrengthColor', () => {
  it('returns red for scores 0-1', () => {
    expect(getPasswordStrengthColor(0)).toBe('bg-red-500')
    expect(getPasswordStrengthColor(1)).toBe('bg-red-500')
  })

  it('returns orange for score 2', () => {
    expect(getPasswordStrengthColor(2)).toBe('bg-orange-500')
  })

  it('returns yellow for score 3', () => {
    expect(getPasswordStrengthColor(3)).toBe('bg-yellow-500')
  })

  it('returns green for scores 4-5', () => {
    expect(getPasswordStrengthColor(4)).toBe('bg-green-500')
    expect(getPasswordStrengthColor(5)).toBe('bg-green-600')
  })

  it('returns gray for out-of-range scores', () => {
    expect(getPasswordStrengthColor(-1)).toBe('bg-gray-300')
    expect(getPasswordStrengthColor(6)).toBe('bg-gray-300')
  })
})

describe('getPasswordStrengthLabel', () => {
  it('returns Weak for scores 0-1', () => {
    expect(getPasswordStrengthLabel(0)).toBe('Weak')
    expect(getPasswordStrengthLabel(1)).toBe('Weak')
  })

  it('returns Fair for score 2', () => {
    expect(getPasswordStrengthLabel(2)).toBe('Fair')
  })

  it('returns Good for score 3', () => {
    expect(getPasswordStrengthLabel(3)).toBe('Good')
  })

  it('returns Strong for scores 4-5', () => {
    expect(getPasswordStrengthLabel(4)).toBe('Strong')
    expect(getPasswordStrengthLabel(5)).toBe('Strong')
  })

  it('returns empty string for out-of-range scores', () => {
    expect(getPasswordStrengthLabel(-1)).toBe('')
    expect(getPasswordStrengthLabel(6)).toBe('')
  })
})
