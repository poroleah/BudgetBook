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

  function addTransaction() {
    const amount = Number(String(transactionForm.amount ?? '').replace(/\D/g, ''))
    if (amount <= 0) return

    state.transactions.push({
      id: Date.now(),
      date: transactionForm.date || selectedDate.value,
      type: transactionForm.type,
      title: transactionForm.subcategory || transactionForm.category,
      category: transactionForm.category,
      subcategory: transactionForm.subcategory,
      assetName: transactionForm.assetName || defaultAssetName(),
      amount,
      memo: transactionForm.memo.trim(),
      paymentMethod: transactionForm.type === 'expense' ? transactionForm.paymentMethod || defaultPaymentMethod() : '',
    })

    transactionForm.amount = ''
    transactionForm.memo = ''
    transactionForm.date = selectedDate.value
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
