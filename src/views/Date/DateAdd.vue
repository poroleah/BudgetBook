<script setup>
import { computed, ref, watch } from 'vue'
import PageHeader from '../../components/PageHeader.vue'

const props = defineProps({
  categories: {
    type: Array,
    required: true,
  },
  categoryDetails: {
    type: Object,
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

const emit = defineEmits(['add-transaction', 'open-category-page', 'update-transaction'])

const isEntryModalOpen = ref(false)
const isDatePickerOpen = ref(false)
const openOptionMenu = ref('')
const editingTransactionId = ref(null)
const paymentMethods = ['카드', '현금', '계좌이체']
const pad = (value) => String(value).padStart(2, '0')
const today = new Date()
const todayKey = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`
const dateCalendarMonth = ref(props.transactionForm.date.slice(0, 7) || props.selectedDate.slice(0, 7))

const dateMonthLabel = computed(() => {
  const [year, month] = dateCalendarMonth.value.split('-').map(Number)
  return `${year}년 ${month}월`
})

const subcategoryOptions = computed(() =>
  props.categoryDetails[props.transactionForm.category]?.subcategories || ['기본'],
)

const categorySelectionLabel = computed(() => {
  if (!props.transactionForm.category) return '카테고리'
  if (!props.transactionForm.subcategory) return props.transactionForm.category
  return `${props.transactionForm.category} > ${props.transactionForm.subcategory}`
})

const formattedAmount = computed({
  get() {
    const amount = String(props.transactionForm.amount ?? '').replace(/\D/g, '')
    return amount ? new Intl.NumberFormat('ko-KR').format(Number(amount)) : ''
  },
  set(value) {
    const amount = String(value).replace(/\D/g, '')
    props.transactionForm.amount = amount ? Number(amount) : ''
  },
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

watch(
  () => props.transactionForm.category,
  () => {
    if (props.transactionForm.subcategory && !subcategoryOptions.value.includes(props.transactionForm.subcategory)) {
      props.transactionForm.subcategory = subcategoryOptions.value[0] || ''
    }
  },
  { immediate: true },
)

function submitTransaction() {
  const canSubmit = Number(props.transactionForm.amount) > 0
  if (!canSubmit) return

  if (editingTransactionId.value) {
    emit('update-transaction', {
      id: editingTransactionId.value,
      date: props.transactionForm.date || props.selectedDate,
      type: props.transactionForm.type,
      title: props.transactionForm.subcategory || props.transactionForm.category,
      category: props.transactionForm.category,
      subcategory: props.transactionForm.subcategory,
      amount: Number(props.transactionForm.amount),
      memo: props.transactionForm.memo.trim(),
      paymentMethod: props.transactionForm.paymentMethod,
    })
  } else {
    emit('add-transaction')
  }

  isEntryModalOpen.value = false
  isDatePickerOpen.value = false
  openOptionMenu.value = ''
  editingTransactionId.value = null
  resetTransactionForm()
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

function resetTransactionForm() {
  props.transactionForm.amount = ''
  props.transactionForm.memo = ''
  props.transactionForm.date = props.selectedDate
}

function openAddModal() {
  editingTransactionId.value = null
  props.transactionForm.date = props.selectedDate
  isDatePickerOpen.value = false
  openOptionMenu.value = ''
  isEntryModalOpen.value = true
}

function closeEntryModal() {
  isEntryModalOpen.value = false
  isDatePickerOpen.value = false
  openOptionMenu.value = ''
  editingTransactionId.value = null
}

function openCategoryPage() {
  isDatePickerOpen.value = false
  openOptionMenu.value = ''
  emit('open-category-page')
}

function openTransaction(transaction) {
  editingTransactionId.value = transaction.id
  props.transactionForm.type = transaction.type
  props.transactionForm.amount = transaction.amount
  props.transactionForm.category = transaction.category
  props.transactionForm.subcategory = transaction.subcategory || ''
  props.transactionForm.date = transaction.date
  props.transactionForm.memo = transaction.memo || ''
  props.transactionForm.paymentMethod = transaction.paymentMethod || '카드'
  dateCalendarMonth.value = transaction.date.slice(0, 7)
  isDatePickerOpen.value = false
  openOptionMenu.value = ''
  isEntryModalOpen.value = true
}

defineExpose({
  openTransaction,
})
</script>

<template>
  <button class="floating-add-button" type="button" aria-label="거래 추가" @click="openAddModal">
    <span></span>
    <span></span>
  </button>

  <Transition name="entry-modal-slide">
    <div v-if="isEntryModalOpen" class="entry-modal-layer">
      <section class="entry-modal" role="dialog" aria-modal="true" :aria-label="editingTransactionId ? '거래 수정' : '거래 입력'">
        <form class="entry-form" @submit.prevent="submitTransaction">
          <PageHeader
            class="entry-control-row"
            close
            :title="editingTransactionId ? '거래 수정' : '거래 등록'"
            back-label="취소"
            @back="closeEntryModal"
          >
            <template #right>
              <button class="entry-save-button" type="submit">
                저장
              </button>
            </template>
          </PageHeader>

          <div
            class="segmented"
            :class="{
              'income-selected': transactionForm.type === 'income',
              'transfer-selected': transactionForm.type === 'transfer',
            }"
          >
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
            <button
              type="button"
              :class="{ active: transactionForm.type === 'transfer' }"
              @click="transactionForm.type = 'transfer'"
            >
              이체
            </button>
          </div>

        <label class="entry-field">
          <span>금액</span>
          <input v-model="formattedAmount" type="text" inputmode="numeric" placeholder="0" />
        </label>

        <div class="entry-field">
          <span>카테고리</span>
          <div
            class="entry-link-row"
            role="button"
            tabindex="0"
            @click="openCategoryPage"
            @keydown.enter.prevent="openCategoryPage"
            @keydown.space.prevent="openCategoryPage"
          >
            <span>{{ categorySelectionLabel }}</span>
            <button
              class="entry-link-button"
              type="button"
              aria-label="카테고리 선택 열기"
              @click.stop="openCategoryPage"
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
                    today: day?.date === todayKey,
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

        <label class="entry-field">
          <span>메모</span>
          <input v-model="transactionForm.memo" type="text" placeholder="메모" />
        </label>
        </form>
      </section>
    </div>
  </Transition>
</template>
