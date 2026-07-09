<script setup>
import { computed, ref, watch } from 'vue'
import DateAdd from './DateAdd.vue'
import DateRecord from './DateRecord.vue'

const props = defineProps({
  assets: {
    type: Array,
    required: true,
  },
  calendarDays: {
    type: Array,
    required: true,
  },
  categories: {
    type: Array,
    required: true,
  },
  categoryDetails: {
    type: Object,
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
  paymentMethods: {
    type: Array,
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
  'update-transaction',
])

const isMonthPickerOpen = ref(false)
const dateAdd = ref(null)
const pickerYear = ref(Number(props.currentMonth.split('-')[0]))
const pad = (value) => String(value).padStart(2, '0')
const today = new Date()
const todayKey = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`

const monthLabel = computed(() => {
  const month = Number(props.currentMonth.split('-')[1])
  return month + '월'
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

function openTransactionEditor(transaction) {
  dateAdd.value?.openTransaction(transaction)
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

    <div class="calendar-panel calendar-design">
      <div class="calendar-toolbar calendar-design-toolbar">
        <button class="calendar-chevron" type="button" aria-label="이전 달" @click="$emit('change-month', -1)"><img src="/icons/Chevron.svg" alt="" /></button>
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
        <button class="calendar-chevron next" type="button" aria-label="다음 달" @click="$emit('change-month', 1)"><img src="/icons/Chevron.svg" alt="" /></button>
      </div>
      <div class="calendar-design-divider"></div>
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
            today: day?.date === todayKey,
            empty: !day,
            sunday: day?.weekday === 0,
            saturday: day?.weekday === 6,
            'has-transaction': day?.income || day?.expense,
          }"
          :disabled="!day"
          @click="$emit('select-date', day.date)"
        >
          <span v-if="day" class="day-number">
            {{ day.day }}
            <span
              v-if="day.expense > day.income || day.income > 0"
              class="calendar-status-dot"
              :class="day.expense > day.income ? 'expense-alert-dot' : 'income-alert-dot'"
              :aria-label="day.expense > day.income ? '수입보다 지출이 많은 날' : '수입이 있는 날'"
            ></span>
          </span>
        </button>
      </div>
    </div>

    <DateRecord
      :category-details="categoryDetails"
      :selected-date="selectedDate"
      :selected-transactions="selectedTransactions"
      @edit-transaction="openTransactionEditor"
    />

    <DateAdd
      ref="dateAdd"
      :assets="assets"
      :categories="categories"
      :category-details="categoryDetails"
      :payment-methods="paymentMethods"
      :selected-date="selectedDate"
      :transaction-form="transactionForm"
      @add-transaction="$emit('add-transaction')"
      @open-category-page="$emit('open-category-page')"
      @update-transaction="$emit('update-transaction', $event)"
    />
  </section>
</template>
<style scoped>
.calendar-design {
  width: min(100%, 370px);
  min-height: 292px;
  margin-inline: auto;
  border: 0 !important;
  border-radius: 10px;
  background: #fff !important;
  padding: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.25) !important;
}

.calendar-design-toolbar {
  display: grid;
  grid-template-columns: 22px minmax(0, 1fr) 22px;
  align-items: center;
  gap: 9px;
  min-height: 58px;
  margin: 0;
  border-bottom: 0;
  padding: 11px 26px 8px;
}

.calendar-design-toolbar .month-selector { display: flex; justify-content: center; }
.calendar-design-toolbar .month-title-button {
  min-height: 38px; border: 0; background: transparent !important; padding: 0 12px;
  color: #212529; font-family: 'Elice', sans-serif; font-size: 1.15rem; font-weight: 500; box-shadow: none;
}

.calendar-chevron {
  display: grid; width: 22px; height: 22px; place-items: center;
  border: 0; background: transparent !important; padding: 0;
}
.calendar-chevron img { width: 23px; height: 23px; display: block; }
.calendar-chevron.next img { transform: rotate(180deg); }
.calendar-design-divider { height: 1px; margin: 0 25px; background: #dee2e6; }

.calendar-design .weekday-row, .calendar-design .calendar-grid {
  grid-template-columns: repeat(7, minmax(0, 1fr)); padding-inline: 25px;
}
.calendar-design .weekday-row {
  gap: 9px; min-height: 42px; padding-top: 12px; padding-bottom: 8px; color: #212529;
}
.calendar-design .weekday-row span {
  font-family: 'Nanum', sans-serif;
  font-size: 0.72rem; font-weight: 400; letter-spacing: 0.03em; line-height: 1;
}
.calendar-design .calendar-grid { gap: 7px 9px; padding-bottom: 12px; }
.calendar-design .day-cell {
  min-width: 0; min-height: 32px; aspect-ratio: 1; border: 0; border-radius: 50%;
  background: transparent !important; padding: 0; color: #212529; box-shadow: none;
}
.calendar-design .day-cell.sunday { color: #f43f5e; }
.calendar-design .day-cell.saturday { color: #6c757d; }
.calendar-design .day-number {
  position: relative;
  display: grid; width: 34px; height: 34px; margin: auto; place-items: center;
  border: 0 !important; border-radius: 50%; background: transparent !important; color: inherit;
  font-family: 'Elice', sans-serif;
  font-size: 0.97rem; font-weight: 400; line-height: 1;
}
.calendar-design .calendar-status-dot {
  position: absolute;
  top: 1px;
  right: 1px;
  width: 7.2px;
  height: 7.2px;
  border-radius: 50%;
}
.calendar-design .expense-alert-dot {
  background: #f43f5e;
}
.calendar-design .income-alert-dot {
  background: #20c997;
}
.calendar-design .day-cell.selected .day-number {
  border: 2px solid #f8f9fa !important;
  background: transparent !important;
  color: inherit;
}
.calendar-design .day-cell.today:not(.selected) .day-number {
  border: 0 !important;
  background: #f8f9fa !important;
}
.calendar-design .month-picker-panel { top: 44px; }

.calendar-screen .transaction-section {
  border: 0 !important;
  border-radius: 10px;
  background: #fff !important;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.25) !important;
  filter: drop-shadow(0 2px 2px rgba(0, 0, 0, 0.2));
}

:global(.app-shell[data-theme="dark"]) .calendar-design { background: #1f242c !important; border: 0 !important; }
:global(.app-shell[data-theme="dark"]) .calendar-design-divider { background: #303743; }
:global(.app-shell[data-theme="dark"]) .calendar-design .month-title-button,
:global(.app-shell[data-theme="dark"]) .calendar-design .weekday-row,
:global(.app-shell[data-theme="dark"]) .calendar-design .day-cell { color: #f4f6f8; }

:global(.app-shell[data-theme="dark"]) .calendar-design .day-cell.sunday { color: #fb7185; }
:global(.app-shell[data-theme="dark"]) .calendar-design .day-cell.saturday { color: #9da8b5; }

@media (max-width: 420px) {
  .calendar-design .weekday-row, .calendar-design .calendar-grid { padding-inline: 14px; }
  .calendar-design .calendar-grid { gap-inline: 6px; }
}
</style>
