import { computed } from 'vue'
import { pad } from './useCalendar'

export function useAnalysis(state, currentMonth, monthTransactions, monthExpense) {
  const categorySummary = computed(() => {
    const totals = monthTransactions.value
      .filter((item) => item.type === 'expense')
      .reduce((result, item) => {
        result[item.category] = (result[item.category] || 0) + Number(item.amount)
        return result
      }, {})

    return Object.entries(totals)
      .map(([category, amount]) => ({
        category,
        amount,
        percent: monthExpense.value ? Math.round((amount / monthExpense.value) * 100) : 0,
      }))
      .sort((a, b) => b.amount - a.amount)
  })

  const monthlyTrend = computed(() => {
    const base = new Date(`${currentMonth.value}-01`)
    return Array.from({ length: 6 }, (_, index) => {
      const date = new Date(base.getFullYear(), base.getMonth() - 5 + index, 1)
      const key = `${date.getFullYear()}-${pad(date.getMonth() + 1)}`
      const items = state.transactions.filter((item) => item.date.startsWith(key))
      return {
        label: `${date.getMonth() + 1}월`,
        income: items
          .filter((item) => item.type === 'income')
          .reduce((sum, item) => sum + Number(item.amount), 0),
        expense: items
          .filter((item) => item.type === 'expense')
          .reduce((sum, item) => sum + Number(item.amount), 0),
      }
    })
  })

  const trendMax = computed(() =>
    Math.max(1, ...monthlyTrend.value.flatMap((item) => [item.income, item.expense])),
  )

  return {
    categorySummary,
    monthlyTrend,
    trendMax,
  }
}
