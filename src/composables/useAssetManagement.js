import { computed } from 'vue'

const DAY_MS = 24 * 60 * 60 * 1000

function numberValue(value) {
  const number = Number(value)
  return Number.isFinite(number) ? number : 0
}

function createId(prefix) {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return `${prefix}-${crypto.randomUUID()}`
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function parseDate(value) {
  if (!value) return null
  const [year, month, day] = String(value).split('-').map(Number)
  if (!year || !month || !day) return null
  return new Date(year, month - 1, day)
}

function dateKey(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function monthKey(value) {
  return String(value || '').slice(0, 7)
}

function monthsBetween(startValue, endValue) {
  const start = parseDate(startValue)
  const end = parseDate(endValue)
  if (!start || !end || end <= start) return 0

  const rawMonths = (end.getFullYear() - start.getFullYear()) * 12 + end.getMonth() - start.getMonth()
  const monthFraction = (end.getDate() - start.getDate()) / 31
  return Math.max(0, rawMonths + monthFraction)
}

function daysUntil(value) {
  const target = parseDate(value)
  if (!target) return 0
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Math.max(0, Math.ceil((target.getTime() - today.getTime()) / DAY_MS))
}

function plannedPaymentDates(account, payments) {
  const start = parseDate(account.startDate)
  const maturity = parseDate(account.maturityDate)
  if (!start || !maturity || maturity < start) return []

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const paidMonths = new Set(payments.map((payment) => monthKey(payment.paymentDate)))
  const dates = []
  const cursor = new Date(start)
  const paymentDay = start.getDate()

  while (cursor <= maturity) {
    const year = cursor.getFullYear()
    const month = cursor.getMonth()
    const lastDay = new Date(year, month + 1, 0).getDate()
    const scheduled = new Date(year, month, Math.min(paymentDay, lastDay))

    if (scheduled >= today && scheduled < maturity && !paidMonths.has(monthKey(dateKey(scheduled)))) {
      dates.push(dateKey(scheduled))
    }

    cursor.setDate(1)
    cursor.setMonth(cursor.getMonth() + 1)
    cursor.setDate(Math.min(paymentDay, new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate()))
  }

  return dates
}

function savingsSummary(account, allPayments) {
  const payments = allPayments.filter((payment) => payment.accountId === account.id)
  const paidPrincipal = payments.reduce((sum, payment) => sum + numberValue(payment.amount), 0)
  const plannedDates = plannedPaymentDates(account, payments)
  const monthlyAmount = numberValue(account.monthlyAmount)
  const expectedPrincipal = paidPrincipal + plannedDates.length * monthlyAmount
  const annualRate = numberValue(account.interestRate) / 100

  const actualInterest = payments.reduce(
    (sum, payment) =>
      sum + numberValue(payment.amount) * annualRate * (monthsBetween(payment.paymentDate, account.maturityDate) / 12),
    0,
  )
  const plannedInterest = plannedDates.reduce(
    (sum, paymentDate) =>
      sum + monthlyAmount * annualRate * (monthsBetween(paymentDate, account.maturityDate) / 12),
    0,
  )
  const expectedInterest = actualInterest + plannedInterest
  const contributionMode = account.governmentContributionMode || 'monthly'
  const paidMonthCount = new Set(payments.map((payment) => monthKey(payment.paymentDate))).size
  const expectedContribution =
    contributionMode === 'total'
      ? numberValue(account.governmentContributionAmount)
      : numberValue(account.governmentContributionAmount) * (paidMonthCount + plannedDates.length)

  return {
    ...account,
    payments: [...payments].sort((a, b) => b.paymentDate.localeCompare(a.paymentDate)),
    paidPrincipal,
    remainingPaymentMonths: plannedDates.length,
    expectedPrincipal,
    expectedInterest,
    expectedContribution,
    expectedMaturityAmount: expectedPrincipal + expectedInterest + expectedContribution,
    daysRemaining: daysUntil(account.maturityDate),
  }
}

function investmentSummary(account, allTransactions) {
  const transactions = allTransactions.filter((transaction) => transaction.accountId === account.id)
  const deposits = transactions
    .filter((transaction) => transaction.type === 'deposit')
    .reduce((sum, transaction) => sum + numberValue(transaction.amount), 0)
  const withdrawals = transactions
    .filter((transaction) => transaction.type === 'withdrawal')
    .reduce((sum, transaction) => sum + numberValue(transaction.amount), 0)
  const principal = deposits - withdrawals
  const valuation = [...transactions]
    .filter((transaction) => transaction.type === 'valuation')
    .sort((a, b) => {
      const dateComparison = b.transactionDate.localeCompare(a.transactionDate)
      return dateComparison || numberValue(b.createdAt) - numberValue(a.createdAt)
    })[0]
  const currentValue = valuation ? numberValue(valuation.amount) : null
  const profitLoss = currentValue === null ? null : currentValue - principal
  const returnRate = currentValue === null || principal === 0 ? null : (profitLoss / principal) * 100

  return {
    ...account,
    transactions: [...transactions].sort((a, b) => b.transactionDate.localeCompare(a.transactionDate)),
    principal,
    currentValue,
    profitLoss,
    returnRate,
    lastValuationDate: valuation?.transactionDate || '',
  }
}

export function useAssetManagement(state) {
  const savingsAccounts = computed(() =>
    state.savingsAccounts.map((account) => savingsSummary(account, state.savingPayments)),
  )
  const investmentAccounts = computed(() =>
    state.investmentAccounts
      .filter((account) => account.accountType !== 'CMA')
      .map((account) => investmentSummary(account, state.investmentTransactions)),
  )

  const savingsTotals = computed(() =>
    savingsAccounts.value.reduce(
      (totals, account) => {
        totals.paidPrincipal += account.paidPrincipal
        totals.expectedMaturityAmount += account.expectedMaturityAmount
        return totals
      },
      { paidPrincipal: 0, expectedMaturityAmount: 0 },
    ),
  )

  const investmentTotals = computed(() =>
    investmentAccounts.value.reduce(
      (totals, account) => {
        totals.principal += account.principal
        totals.assetValue += account.currentValue === null ? account.principal : account.currentValue
        if (account.currentValue !== null) {
          totals.currentValue += account.currentValue
          totals.profitLoss += account.profitLoss
          totals.valuedAccountCount += 1
        }
        return totals
      },
      { principal: 0, currentValue: 0, assetValue: 0, profitLoss: 0, valuedAccountCount: 0 },
    ),
  )

  function addSavingsAccount(form) {
    const startDate = parseDate(form.startDate)
    const maturityDate = parseDate(form.maturityDate)
    if (
      !form.productName?.trim() ||
      !startDate ||
      !maturityDate ||
      maturityDate <= startDate ||
      numberValue(form.monthlyAmount) <= 0
    ) {
      return false
    }
    state.savingsAccounts.push({
      id: createId('saving'),
      productName: form.productName.trim(),
      institution: form.institution?.trim() || '',
      startDate: form.startDate,
      maturityDate: form.maturityDate,
      monthlyAmount: numberValue(form.monthlyAmount),
      interestRate: numberValue(form.interestRate),
      governmentContributionMode: form.governmentContributionMode || 'monthly',
      governmentContributionAmount: numberValue(form.governmentContributionAmount),
      savingsType: form.savingsType || '적금',
      createdAt: Date.now(),
    })
    return true
  }

  function removeSavingsAccount(accountId) {
    state.savingsAccounts = state.savingsAccounts.filter((account) => account.id !== accountId)
    state.savingPayments = state.savingPayments.filter((payment) => payment.accountId !== accountId)
  }

  function addSavingPayment(form) {
    if (!form.accountId || !form.paymentDate || numberValue(form.amount) <= 0) return false
    state.savingPayments.push({
      id: createId('saving-payment'),
      accountId: form.accountId,
      paymentDate: form.paymentDate,
      amount: numberValue(form.amount),
      transactionType: 'transfer',
      createdAt: Date.now(),
    })
    return true
  }

  function removeSavingPayment(paymentId) {
    state.savingPayments = state.savingPayments.filter((payment) => payment.id !== paymentId)
  }

  function addInvestmentAccount(form) {
    if (!form.accountName?.trim() || form.accountType === 'CMA') return false
    state.investmentAccounts.push({
      id: createId('investment'),
      accountName: form.accountName.trim(),
      institution: form.institution?.trim() || '',
      accountType: form.accountType || '일반 증권계좌',
      createdAt: Date.now(),
    })
    return true
  }

  function removeInvestmentAccount(accountId) {
    state.investmentAccounts = state.investmentAccounts.filter((account) => account.id !== accountId)
    state.investmentTransactions = state.investmentTransactions.filter(
      (transaction) => transaction.accountId !== accountId,
    )
  }

  function addInvestmentTransaction(form) {
    if (!form.accountId || !form.transactionDate || numberValue(form.amount) < 0) return false
    state.investmentTransactions.push({
      id: createId('investment-transaction'),
      accountId: form.accountId,
      type: form.type,
      transactionDate: form.transactionDate,
      amount: numberValue(form.amount),
      createdAt: Date.now(),
    })
    return true
  }

  function removeInvestmentTransaction(transactionId) {
    state.investmentTransactions = state.investmentTransactions.filter(
      (transaction) => transaction.id !== transactionId,
    )
  }

  return {
    addInvestmentAccount,
    addInvestmentTransaction,
    addSavingPayment,
    addSavingsAccount,
    investmentAccounts,
    investmentTotals,
    removeInvestmentAccount,
    removeInvestmentTransaction,
    removeSavingPayment,
    removeSavingsAccount,
    savingsAccounts,
    savingsTotals,
  }
}
