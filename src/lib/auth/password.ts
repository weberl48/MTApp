/**
 * Password validation utilities for HIPAA compliance
 */

export interface PasswordValidation {
  isValid: boolean
  score: number // 0-4
  requirements: {
    minLength: boolean
    hasUppercase: boolean
    hasLowercase: boolean
    hasNumber: boolean
    hasSpecial: boolean
  }
  message: string
}

const MIN_LENGTH = 8
const SPECIAL_CHARS = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/

export function validatePassword(password: string): PasswordValidation {
  const requirements = {
    minLength: password.length >= MIN_LENGTH,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecial: SPECIAL_CHARS.test(password),
  }

  // Count how many requirements are met
  const score = Object.values(requirements).filter(Boolean).length

  // All requirements must be met for valid password
  const isValid = Object.values(requirements).every(Boolean)

  // Generate helpful message
  let message = ''
  if (!requirements.minLength) {
    message = `At least ${MIN_LENGTH} characters required`
  } else if (!requirements.hasUppercase) {
    message = 'Add an uppercase letter'
  } else if (!requirements.hasLowercase) {
    message = 'Add a lowercase letter'
  } else if (!requirements.hasNumber) {
    message = 'Add a number'
  } else if (!requirements.hasSpecial) {
    message = 'Add a special character (!@#$%^&*)'
  } else {
    message = 'Strong password'
  }

  return {
    isValid,
    score,
    requirements,
    message,
  }
}

export function getPasswordStrengthColor(score: number): string {
  switch (score) {
    case 0:
    case 1:
      return 'bg-red-500'
    case 2:
      return 'bg-orange-500'
    case 3:
      return 'bg-yellow-500'
    case 4:
      return 'bg-green-500'
    case 5:
      return 'bg-green-600'
    default:
      return 'bg-gray-300'
  }
}

export function getPasswordStrengthLabel(score: number): string {
  switch (score) {
    case 0:
    case 1:
      return 'Weak'
    case 2:
      return 'Fair'
    case 3:
      return 'Good'
    case 4:
    case 5:
      return 'Strong'
    default:
      return ''
  }
}
