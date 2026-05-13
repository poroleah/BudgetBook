import { computed, reactive, watch } from 'vue'

export function useTransactions(state, selectedDate, currentMonth) {
  const transactionForm = reactive({
    type: 'expense',
    amount: '',
    category: '식비',
    date: selectedDate.value,
    subcategory: '외식',
    memo: '',
    paymentMethod: '카드',
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

  const monthIncome = computed(() =>
    monthTransactions.value
      .filter((item) => item.type === 'income')
      .reduce((sum, item) => sum + Number(item.amount), 0),
  )

  const monthExpense = computed(() =>
    monthTransactions.value
      .filter((item) => item.type === 'expense')
      .reduce((sum, item) => sum + Number(item.amount), 0),
  )

  const monthBalance = computed(() => monthIncome.value - monthExpense.value)
  const budgetLeft = computed(() => state.settings.monthlyBudget - monthExpense.value)

  function addTransaction() {
    const amount = Number(transactionForm.amount)
    if (amount <= 0) return

    state.transactions.push({
      id: Date.now(),
      date: transactionForm.date || selectedDate.value,
      type: transactionForm.type,
      title: transactionForm.subcategory || transactionForm.category,
      category: transactionForm.category,
      subcategory: transactionForm.subcategory,
      amount,
      memo: transactionForm.memo.trim(),
      paymentMethod: transactionForm.paymentMethod,
    })

    transactionForm.amount = ''
    transactionForm.memo = ''
    transactionForm.date = selectedDate.value
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
    removeTransaction,
    selectedTransactions,
    transactionForm,
    updateTransaction,
  }
}
