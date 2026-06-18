import { computed, reactive, watch } from 'vue'

export function useTransactions(state, selectedDate, currentMonth) {
  const defaultAssetName = () => state.assets?.[0]?.name || ''
  const defaultPaymentMethod = () => state.settings.paymentMethods?.[0] || ''

  const transactionForm = reactive({
    type: 'expense',
    amount: '',
    category: '식비',
    date: selectedDate.value,
    subcategory: '외식',
    assetName: defaultAssetName(),
    memo: '',
    paymentMethod: defaultPaymentMethod(),
    repeatEnabled: false,
    repeatFrequency: 'monthly',
    repeatEndDate: '',
  })

  watch(selectedDate, (date) => {
    transactionForm.date = date
  })

  const monthTransactions = computed(() =>
    state.transactions.filter((item) => item.date.startsWith(currentMonth.value)),
  )

  const selectedTransactions = computed(() =>
    state.transactions
      .filter((item) => item.date === selectedDate.value)
      .sort((a, b) => b.id - a.id),
  )

  const transactionAmount = (item) => {
    const amount = Number(item.amount)
    return Number.isFinite(amount) ? amount : 0
  }

  const transactionMonth = (item) => String(item.date || '').slice(0, 7)

  const monthExpense = computed(() =>
    monthTransactions.value
      .filter((item) => item.type === 'expense')
      .reduce((sum, item) => sum + transactionAmount(item), 0),
  )

  const incomeTransactions = computed(() => {
    if (!state.settings.carryOverIncome) return monthTransactions.value

    return state.transactions.filter((item) => {
      const monthKey = transactionMonth(item)
      return monthKey && monthKey <= currentMonth.value
    })
  })

  const monthIncome = computed(() =>
    incomeTransactions.value
      .filter((item) => item.type === 'income')
      .reduce((sum, item) => sum + transactionAmount(item), 0),
  )

  const monthTransfer = computed(() =>
    monthTransactions.value
      .filter((item) => item.type === 'transfer')
      .reduce((sum, item) => sum + transactionAmount(item), 0),
  )

  const monthBalance = computed(() => monthIncome.value - monthExpense.value)
  const budgetLeft = computed(() => state.settings.monthlyBudget - monthExpense.value)

  const dateFromKey = (dateKey) => {
    const [year, month, day] = String(dateKey).split('-').map(Number)
    return new Date(year, month - 1, day)
  }

  const dateToKey = (date) =>
    date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0') + '-' + String(date.getDate()).padStart(2, '0')

  const lastDateOfMonth = (year, monthIndex) => new Date(year, monthIndex + 1, 0).getDate()

  const addMonths = (date, offset) => {
    const nextDate = new Date(date)
    const day = nextDate.getDate()
    nextDate.setDate(1)
    nextDate.setMonth(nextDate.getMonth() + offset)
    nextDate.setDate(Math.min(day, lastDateOfMonth(nextDate.getFullYear(), nextDate.getMonth())))
    return nextDate
  }

  const monthEndDate = (date) =>
    new Date(date.getFullYear(), date.getMonth(), lastDateOfMonth(date.getFullYear(), date.getMonth()))

  const recurringDates = (startDateKey, frequency, endDateKey) => {
    if (!endDateKey || endDateKey < startDateKey) return [startDateKey]

    const dates = []
    const startDate = dateFromKey(startDateKey)
    const endDate = dateFromKey(endDateKey)
    let cursor = frequency === 'monthEnd' ? monthEndDate(startDate) : startDate

    if (frequency === 'monthEnd' && cursor < startDate) {
      cursor = monthEndDate(addMonths(startDate, 1))
    }

    while (cursor <= endDate && dates.length < 120) {
      dates.push(dateToKey(cursor))

      if (frequency === 'daily') {
        cursor = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate() + 1)
      } else if (frequency === 'weekly') {
        cursor = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate() + 7)
      } else if (frequency === 'monthEnd') {
        cursor = monthEndDate(addMonths(cursor, 1))
      } else {
        cursor = addMonths(cursor, 1)
      }
    }

    return dates
  }

  function addTransaction() {
    const amount = Number(String(transactionForm.amount ?? '').replace(/\D/g, ''))
    if (amount <= 0) return

    const startDate = transactionForm.date || selectedDate.value
    const isRecurringExpense = transactionForm.type === 'expense' && transactionForm.repeatEnabled
    const dates = isRecurringExpense
      ? recurringDates(startDate, transactionForm.repeatFrequency, transactionForm.repeatEndDate)
      : [startDate]
    const recurringGroupId = isRecurringExpense ? 'repeat-' + Date.now() : ''
    const createdAt = Date.now()

    dates.forEach((date, index) => {
      state.transactions.push({
        id: createdAt + index,
        date,
        type: transactionForm.type,
        title: transactionForm.subcategory || transactionForm.category,
        category: transactionForm.category,
        subcategory: transactionForm.subcategory,
        assetName: transactionForm.assetName || defaultAssetName(),
        amount,
        memo: transactionForm.memo.trim(),
        paymentMethod: transactionForm.type === 'expense' ? transactionForm.paymentMethod || defaultPaymentMethod() : '',
        recurringGroupId,
        repeatFrequency: isRecurringExpense ? transactionForm.repeatFrequency : '',
      })
    })

    transactionForm.amount = ''
    transactionForm.memo = ''
    transactionForm.date = selectedDate.value
    transactionForm.repeatEnabled = false
    transactionForm.repeatEndDate = ''
    transactionForm.assetName = transactionForm.assetName || defaultAssetName()
    transactionForm.paymentMethod = transactionForm.paymentMethod || defaultPaymentMethod()
  }

  function removeTransaction(id) {
    state.transactions = state.transactions.filter((item) => item.id !== id)
  }

  function updateTransaction(updatedTransaction) {
    const transactionIndex = state.transactions.findIndex((item) => item.id === updatedTransaction.id)
    if (transactionIndex === -1) return

    state.transactions[transactionIndex] = updatedTransaction
    selectedDate.value = updatedTransaction.date
    currentMonth.value = updatedTransaction.date.slice(0, 7)
  }

  return {
    addTransaction,
    budgetLeft,
    monthBalance,
    monthExpense,
    monthIncome,
    monthTransactions,
    monthTransfer,
    removeTransaction,
    selectedTransactions,
    transactionForm,
    updateTransaction,
  }
}
