<script setup>
import { computed, ref, watch } from 'vue'

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
})

const emit = defineEmits([
  'add-transaction',
  'change-month',
  'remove-transaction',
  'select-date',
  'select-month',
])

const isMonthPickerOpen = ref(false)
const isEntryModalOpen = ref(false)
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

function submitTransaction() {
  const canSubmit = props.transactionForm.title.trim() && Number(props.transactionForm.amount) > 0
  emit('add-transaction')
  if (canSubmit) {
    isEntryModalOpen.value = false
  }
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
        <span>SUN</span>
        <span>MON</span>
        <span>TUE</span>
        <span>WED</span>
        <span>THU</span>
        <span>FRI</span>
        <span>SAT</span>
      </div>
      <div class="calendar-grid">
        <button
          v-for="(day, index) in calendarDays"
          :key="day?.date || `blank-${index}`"
          class="day-cell"
          :class="{
            selected: day?.date === selectedDate,
            empty: !day,
            sunday: index % 7 === 0,
            saturday: index % 7 === 6,
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

    <button class="floating-add-button" type="button" aria-label="거래 추가" @click="isEntryModalOpen = true">
      <span></span>
      <span></span>
    </button>

    <div v-if="isEntryModalOpen" class="entry-modal-layer">
      <button
        class="entry-modal-backdrop"
        type="button"
        aria-label="거래 입력 닫기"
        @click="isEntryModalOpen = false"
      ></button>
      <section class="entry-modal" role="dialog" aria-modal="true" aria-labelledby="entry-modal-title">
        <div class="panel-heading">
          <p>{{ selectedDate }}</p>
          <h2 id="entry-modal-title">거래 추가</h2>
        </div>

        <form class="entry-form" @submit.prevent="submitTransaction">
          <div class="segmented">
            <button
              type="button"
              :class="{ active: transactionForm.type === 'expense' }"
              @click="transactionForm.type = 'expense'"
            >
              지출
            </button>
            <button
              type="button"
              :class="{ active: transactionForm.type === 'income' }"
              @click="transactionForm.type = 'income'"
            >
              수입
            </button>
          </div>
          <input v-model="transactionForm.title" type="text" placeholder="내용" />
          <div class="form-row">
            <select v-model="transactionForm.category">
              <option v-for="category in categories" :key="category">
                {{ category }}
              </option>
            </select>
            <input v-model="transactionForm.amount" type="number" min="0" placeholder="금액" />
          </div>
          <div class="modal-actions">
            <button type="button" @click="isEntryModalOpen = false">취소</button>
            <button class="primary-button" type="submit">추가</button>
          </div>
        </form>
      </section>
    </div>
  </section>
</template>
