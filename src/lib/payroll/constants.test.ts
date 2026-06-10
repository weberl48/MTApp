import { describe, it, expect } from 'vitest'
import { UNPAID_PAYROLL_STATUSES } from './constants'

describe('UNPAID_PAYROLL_STATUSES (payroll/earnings parity — regression for #6)', () => {
  it("includes 'approved' so approved-but-unpaid sessions stay visible in the Payroll Hub", () => {
    // Regression: the Payroll Hub previously filtered on 'submitted' only, so
    // approving a session removed it from payroll while the contractor was still owed.
    expect(UNPAID_PAYROLL_STATUSES).toContain('approved')
  })

  it("includes 'submitted'", () => {
    expect(UNPAID_PAYROLL_STATUSES).toContain('submitted')
  })

  it('does not include terminal/non-payable statuses', () => {
    expect(UNPAID_PAYROLL_STATUSES).not.toContain('draft')
    expect(UNPAID_PAYROLL_STATUSES).not.toContain('cancelled')
  })
})
