<script setup>
import { computed, ref, watch } from 'vue'

const props = defineProps({
  categories: {
    type: Array,
    required: true,
  },
  selectedDate: {
    type: String,
    required: true,
  },
  transactionForm: {
    type: Object,
    required: true,
  },
})

const emit = defineEmits(['add-transaction', 'open-category-page'])

const isEntryModalOpen = ref(false)
const isDatePickerOpen = ref(false)
const openOptionMenu = ref('')
const paymentMethods = ['카드', '현금', '계좌이체']
const pad = (value) => String(value).padStart(2, '0')
const dateCalendarMonth = ref(props.transactionForm.date.slice(0, 7) || props.selectedDate.slice(0, 7))

const dateMonthLabel = computed(() => {
  const [year, month] = dateCalendarMonth.value.split('-').map(Number)
  return `${year}년 ${month}월`
})

const dateCalendarDays = computed(() => {
  const [year, month] = dateCalendarMonth.value.split('-').map(Number)
  const firstDay = new Date(year, month - 1, 1)
  const lastDate = new Date(year, month, 0).getDate()
  const days = Array.from({ length: firstDay.getDay() }, () => null)

  for (let day = 1; day <= lastDate; day += 1) {
    days.push({
      day,
      date: `${year}-${pad(month)}-${pad(day)}`,
    })
  }

  return days
})

watch(
  () => props.transactionForm.date,
  (date) => {
    if (date) {
      dateCalendarMonth.value = date.slice(0, 7)
    }
  },
)

function submitTransaction() {
  const canSubmit = Number(props.transactionForm.amount) > 0
  emit('add-transaction')
  if (canSubmit) {
    isEntryModalOpen.value = false
    isDatePickerOpen.value = false
    openOptionMenu.value = ''
  }
}

function changeDateMonth(offset) {
  const [year, month] = dateCalendarMonth.value.split('-').map(Number)
  const date = new Date(year, month - 1 + offset, 1)
  dateCalendarMonth.value = `${date.getFullYear()}-${pad(date.getMonth() + 1)}`
}

function selectEntryDate(date) {
  props.transactionForm.date = date
  isDatePickerOpen.value = false
}

function toggleOptionMenu(menu) {
  openOptionMenu.value = openOptionMenu.value === menu ? '' : menu
}

function selectOption(field, value) {
  props.transactionForm[field] = value
  openOptionMenu.value = ''
}
</script>

<template>
  <button class="floating-add-button" type="button" aria-label="거래 추가" @click="isEntryModalOpen = true">
    <span></span>
    <span></span>
  </button>

  <Transition name="entry-modal-slide">
    <div v-if="isEntryModalOpen" class="entry-modal-layer">
      <button
        class="entry-modal-backdrop"
        type="button"
        aria-label="거래 입력 닫기"
        @click="isEntryModalOpen = false"
      ></button>
      <section class="entry-modal" role="dialog" aria-modal="true" aria-label="거래 입력">
        <form class="entry-form" @submit.prevent="submitTransaction">
          <div class="entry-control-row">
            <button
              class="entry-action-button entry-cancel-button"
              type="button"
              aria-label="취소"
              @click="isEntryModalOpen = false"
            >
              <span aria-hidden="true"></span>
            </button>
            <div class="segmented" :class="{ 'income-selected': transactionForm.type === 'income' }">
              <span class="segmented-indicator"></span>
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
            <button class="entry-action-button entry-confirm-button" type="submit" aria-label="추가">
              <span aria-hidden="true"></span>
            </button>
          </div>

        <label class="entry-field">
          <span>금액</span>
          <input v-model="transactionForm.amount" type="number" min="0" placeholder="0" />
        </label>

        <div class="entry-field">
          <span>카테고리</span>
          <div class="entry-link-row">
            <span>{{ transactionForm.category || '카테고리' }}</span>
            <button
              class="entry-link-button"
              type="button"
              aria-label="카테고리 페이지 열기"
              @click="emit('open-category-page')"
            >
              <span aria-hidden="true"></span>
            </button>
          </div>
        </div>

        <div class="entry-field">
          <span>날짜</span>
          <div class="entry-date-row">
            <span class="entry-date-value">{{ transactionForm.date }}</span>
            <button
              class="entry-date-toggle"
              type="button"
              aria-label="달력 열기"
              :aria-expanded="isDatePickerOpen"
              @click="isDatePickerOpen = !isDatePickerOpen"
            >
              <span aria-hidden="true"></span>
            </button>
          </div>
          <Transition name="entry-calendar-slide">
            <div v-if="isDatePickerOpen" class="entry-date-calendar">
              <div class="calendar-toolbar entry-date-toolbar">
                <button type="button" aria-label="이전 달" @click="changeDateMonth(-1)">‹</button>
                <strong>{{ dateMonthLabel }}</strong>
                <button type="button" aria-label="다음 달" @click="changeDateMonth(1)">›</button>
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
                  v-for="(day, index) in dateCalendarDays"
                  :key="day?.date || `entry-blank-${index}`"
                  class="day-cell entry-date-cell"
                  :class="{
                    selected: day?.date === transactionForm.date,
                    empty: !day,
                    sunday: index % 7 === 0,
                    saturday: index % 7 === 6,
                  }"
                  :disabled="!day"
                  type="button"
                  @click="selectEntryDate(day.date)"
                >
                  <span v-if="day" class="day-number">{{ day.day }}</span>
                </button>
              </div>
            </div>
          </Transition>
        </div>

        <label class="entry-field">
          <span>메모</span>
          <input v-model="transactionForm.memo" type="text" placeholder="메모" />
        </label>

        <div class="entry-field">
          <span>결제수단</span>
          <div class="entry-select">
            <button
              class="entry-select-button"
              type="button"
              :aria-expanded="openOptionMenu === 'paymentMethod'"
              @click="toggleOptionMenu('paymentMethod')"
            >
              <span>{{ transactionForm.paymentMethod }}</span>
              <span class="entry-select-chevron" aria-hidden="true"></span>
            </button>
            <Transition name="entry-dropdown-slide">
              <div v-if="openOptionMenu === 'paymentMethod'" class="entry-select-menu">
                <button
                  v-for="method in paymentMethods"
                  :key="method"
                  type="button"
                  :class="{ active: method === transactionForm.paymentMethod }"
                  @click="selectOption('paymentMethod', method)"
                >
                {{ method }}
                </button>
              </div>
            </Transition>
          </div>
        </div>
        </form>
      </section>
    </div>
  </Transition>
</template>
