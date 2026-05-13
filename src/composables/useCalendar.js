import { computed, ref } from 'vue'

export const pad = (value) => String(value).padStart(2, '0')

export const toDateKey = (date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`

export function useCalendar(state, today = new Date()) {
  const currentMonth = ref(`${today.getFullYear()}-${pad(today.getMonth() + 1)}`)
  const selectedDate = ref(toDateKey(today))

  const calendarDays = computed(() => {
    const [year, month] = currentMonth.value.split('-').map(Number)
    const firstDay = new Date(year, month - 1, 1)
    const lastDate = new Date(year, month, 0).getDate()
    const weekStartOffset = state.settings.weekStartsOn === 'monday' ? 1 : 0
    const prefix = (firstDay.getDay() - weekStartOffset + 7) % 7
    const days = Array.from({ length: prefix }, () => null)

    for (let day = 1; day <= lastDate; day += 1) {
      const date = `${year}-${pad(month)}-${pad(day)}`
      const weekday = new Date(year, month - 1, day).getDay()
      const dailyItems = state.transactions.filter((item) => item.date === date)
      const income = dailyItems
        .filter((item) => item.type === 'income')
        .reduce((sum, item) => sum + Number(item.amount), 0)
      const expense = dailyItems
        .filter((item) => item.type === 'expense')
        .reduce((sum, item) => sum + Number(item.amount), 0)

      days.push({ day, date, weekday, income, expense })
    }

    return days
  })

  function changeMonth(offset) {
    const [year, month] = currentMonth.value.split('-').map(Number)
    const date = new Date(year, month - 1 + offset, 1)
    currentMonth.value = `${date.getFullYear()}-${pad(date.getMonth() + 1)}`
    selectedDate.value = toDateKey(date)
  }

  function selectMonth(monthKey) {
    const [year, month] = monthKey.split('-').map(Number)
    const date = new Date(year, month - 1, 1)
    currentMonth.value = monthKey
    selectedDate.value = toDateKey(date)
  }

  return {
    calendarDays,
    changeMonth,
    currentMonth,
    selectMonth,
    selectedDate,
  }
}
