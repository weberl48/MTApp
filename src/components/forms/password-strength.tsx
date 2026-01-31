'use client'

import { useMemo } from 'react'
import { validatePassword, getPasswordStrengthColor, getPasswordStrengthLabel } from '@/lib/auth/password'
import { Check, X } from 'lucide-react'

interface PasswordStrengthProps {
  password: string
  showRequirements?: boolean
}

export function PasswordStrength({ password, showRequirements = true }: PasswordStrengthProps) {
  const validation = useMemo(() => validatePassword(password), [password])

  if (!password) return null

  return (
    <div className="space-y-2">
      {/* Strength Bar */}
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${getPasswordStrengthColor(validation.score)}`}
            style={{ width: `${(validation.score / 5) * 100}%` }}
          />
        </div>
        <span className={`text-xs font-medium ${
          validation.score >= 4 ? 'text-green-600' :
          validation.score >= 3 ? 'text-yellow-600' :
          'text-red-600'
        }`}>
          {getPasswordStrengthLabel(validation.score)}
        </span>
      </div>

      {/* Requirements List */}
      {showRequirements && (
        <ul className="text-xs space-y-1">
          <RequirementItem met={validation.requirements.minLength}>
            At least 8 characters
          </RequirementItem>
          <RequirementItem met={validation.requirements.hasUppercase}>
            One uppercase letter
          </RequirementItem>
          <RequirementItem met={validation.requirements.hasLowercase}>
            One lowercase letter
          </RequirementItem>
          <RequirementItem met={validation.requirements.hasNumber}>
            One number
          </RequirementItem>
          <RequirementItem met={validation.requirements.hasSpecial}>
            One special character (!@#$%^&*)
          </RequirementItem>
        </ul>
      )}
    </div>
  )
}

function RequirementItem({ met, children }: { met: boolean; children: React.ReactNode }) {
  return (
    <li className={`flex items-center gap-1.5 ${met ? 'text-green-600' : 'text-gray-500'}`}>
      {met ? (
        <Check className="w-3 h-3" />
      ) : (
        <X className="w-3 h-3" />
      )}
      {children}
    </li>
  )
}
