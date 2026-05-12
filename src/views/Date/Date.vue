<script setup>
import { computed, ref, watch } from 'vue'
import DateAdd from './Date_Add.vue'

const props = defineProps({
  calendarDays: {
    type: Array,
    required: true,
  },
  categories: {
    type: Array,
    required: true,
  },
  currentMonth: {
    type: String,
    required: true,
  },
  currency: {
    type: Object,
    required: true,
  },
  selectedDate: {
    type: String,
    required: true,
  },
  selectedTransactions: {
    type: Array,
    required: true,
  },
  transactionForm: {
    type: Object,
    required: true,
  },
  weekStartsOn: {
    type: String,
    required: true,
  },
})

const emit = defineEmits([
  'add-transaction',
  'change-month',
  'open-category-page',
  'remove-transaction',
  'select-date',
  'select-month',
])

const isMonthPickerOpen = ref(false)
const pickerYear = ref(Number(props.currentMonth.split('-')[0]))

const monthLabel = computed(() => {
  const [year, month] = props.currentMonth.split('-').map(Number)
  return `${year}년 ${month}월`
})

const monthOptions = computed(() =>
  Array.from({ length: 12 }, (_, index) => ({
    label: `${index + 1}월`,
    value: `${pickerYear.value}-${String(index + 1).padStart(2, '0')}`,
  })),
)

const weekdayLabels = computed(() =>
  props.weekStartsOn === 'monday'
    ? ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']
    : ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'],
)

watch(
  () => props.currentMonth,
  (monthKey) => {
    pickerYear.value = Number(monthKey.split('-')[0])
  },
)

function selectMonth(monthKey) {
  emit('select-month', monthKey)
  isMonthPickerOpen.value = false
}

</script>

<template>
  <section class="screen calendar-screen">
    <button
      v-if="isMonthPickerOpen"
      class="month-picker-backdrop"
      type="button"
      aria-label="월 선택 닫기"
      @click="isMonthPickerOpen = false"
    ></button>

    <div class="calendar-panel">
      <div class="calendar-toolbar">
        <button type="button" aria-label="이전 달" @click="$emit('change-month', -1)">‹</button>
        <div class="month-selector">
          <button
            class="month-title-button"
            type="button"
            :aria-expanded="isMonthPickerOpen"
            @click="isMonthPickerOpen = !isMonthPickerOpen"
          >
            {{ monthLabel }}
          </button>
          <section v-if="isMonthPickerOpen" class="month-picker-panel">
            <div class="year-stepper">
              <button type="button" aria-label="이전 년도" @click="pickerYear -= 1">‹</button>
              <strong>{{ pickerYear }}년</strong>
              <button type="button" aria-label="다음 년도" @click="pickerYear += 1">›</button>
            </div>
            <div class="month-option-grid">
              <button
                v-for="month in monthOptions"
                :key="month.value"
                type="button"
                :class="{ active: month.value === currentMonth }"
                @click="selectMonth(month.value)"
              >
                {{ month.label }}
              </button>
            </div>
          </section>
        </div>
        <button type="button" aria-label="다음 달" @click="$emit('change-month', 1)">›</button>
      </div>
      <div class="weekday-row">
        <span v-for="weekday in weekdayLabels" :key="weekday">{{ weekday }}</span>
      </div>
      <div class="calendar-grid">
        <button
          v-for="(day, index) in calendarDays"
          :key="day?.date || `blank-${index}`"
          class="day-cell"
          :class="{
            selected: day?.date === selectedDate,
            empty: !day,
            sunday: day?.weekday === 0,
            saturday: day?.weekday === 6,
            'has-transaction': day?.income || day?.expense,
          }"
          :disabled="!day"
          @click="$emit('select-date', day.date)"
        >
          <span v-if="day" class="day-number">{{ day.day }}</span>
        </button>
      </div>
    </div>

    <section class="transaction-section">
      <div class="panel-heading">
        <p>{{ selectedDate }}</p>
        <h2>거래 기록</h2>
      </div>

      <div class="transaction-list">
        <article v-for="item in selectedTransactions" :key="item.id" class="transaction-item">
          <div>
            <strong>{{ item.title }}</strong>
            <span>{{ item.category }}</span>
          </div>
          <div class="amount-line">
            <b :class="item.type">
              {{ item.type === 'income' ? '+' : '-' }}{{ currency.format(item.amount) }}
            </b>
            <button type="button" @click="$emit('remove-transaction', item.id)">삭제</button>
          </div>
        </article>
        <p v-if="!selectedTransactions.length" class="empty-state">기록이 없습니다.</p>
      </div>
    </section>

    <DateAdd
      :categories="categories"
      :selected-date="selectedDate"
      :transaction-form="transactionForm"
      @add-transaction="$emit('add-transaction')"
      @open-category-page="$emit('open-category-page')"
    />
  </section>
</template>
