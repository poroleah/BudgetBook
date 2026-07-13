<script setup>
import { computed, ref } from 'vue'

const props = defineProps({
  assets: { type: Array, default: () => [] },
  categoryDetails: { type: Object, required: true },
  transactionForm: { type: Object, required: true },
  weekStartsOn: { type: String, default: 'sunday' },
})

const emit = defineEmits(['close', 'save', 'open-category-page'])
const isRepeatMenuOpen = ref(false)
const activeDatePicker = ref('')
const pickerMonth = ref('')
const pad = (value) => String(value).padStart(2, '0')
const today = new Date()
const todayKey = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`

const pickerMonthLabel = computed(() => {
  const [year, month] = pickerMonth.value.split('-').map(Number)
  return `${year}년 ${month}월`
})

const pickerWeekdays = computed(() =>
  props.weekStartsOn === 'monday'
    ? ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']
    : ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'],
)

const pickerDays = computed(() => {
  const [year, month] = pickerMonth.value.split('-').map(Number)
  if (!year || !month) return []
  const firstWeekday = new Date(year, month - 1, 1).getDay()
  const weekOffset = props.weekStartsOn === 'monday' ? 1 : 0
  const prefix = (firstWeekday - weekOffset + 7) % 7
  const days = Array.from({ length: prefix }, () => null)
  const lastDate = new Date(year, month, 0).getDate()
  for (let day = 1; day <= lastDate; day += 1) {
    days.push({ day, date: `${year}-${pad(month)}-${pad(day)}` })
  }
  return days
})

const categoryName = computed(() => props.transactionForm.category || '카테고리')
const subcategoryName = computed(() => props.transactionForm.subcategory || '')
const categoryIcon = computed(() =>
  props.categoryDetails[categoryName.value]?.icon
  || categoryName.value.trim().slice(0, 1)
  || '?',
)

const paymentMethodName = computed(() => props.transactionForm.paymentMethod || '결제수단 없음')
const paymentMethodIcon = computed(() =>
  props.transactionForm.paymentMethodIcon
  || paymentMethodName.value.trim().slice(0, 1)
  || '?',
)

const repeatFrequencyOptions = [
  { label: '매일', value: 'daily' },
  { label: '매주', value: 'weekly' },
  { label: '매월', value: 'monthly' },
  { label: '말일', value: 'monthEnd' },
  { label: '매년', value: 'yearly' },
]

const repeatFrequencyLabel = computed(() =>
  repeatFrequencyOptions.find((option) => option.value === props.transactionForm.repeatFrequency)?.label || '매월',
)

const assetName = computed(() => props.transactionForm.assetName || props.assets[0]?.name || '자산없음')
const selectedAsset = computed(() =>
  props.assets.find((asset) => asset?.name === assetName.value) || props.assets[0] || null,
)
const incomeInstitution = computed(() => selectedAsset.value?.institution || assetName.value)
const incomeAccountName = computed(() => {
  const name = selectedAsset.value?.name || assetName.value
  return name === incomeInstitution.value ? '' : name
})
const incomeAssetIcon = computed(() =>
  (incomeInstitution.value || assetName.value).trim().slice(0, 1) || '?',
)
const formattedAmount = computed(() => {
  const amount = String(props.transactionForm.amount ?? '').replace(/\D/g, '')
  return amount ? new Intl.NumberFormat('ko-KR').format(Number(amount)) : ''
})

function selectType(type) {
  props.transactionForm.type = type
  isRepeatMenuOpen.value = false
}

function toggleRepeat() {
  props.transactionForm.repeatEnabled = !props.transactionForm.repeatEnabled
  if (!props.transactionForm.repeatEnabled) isRepeatMenuOpen.value = false
}

function updateAmount(event) {
  const digits = event.target.value.replace(/\D/g, '')
  props.transactionForm.amount = digits ? Number(digits) : ''
  event.target.value = digits ? new Intl.NumberFormat('ko-KR').format(Number(digits)) : ''
}

function selectRepeatFrequency(value) {
  props.transactionForm.repeatFrequency = value
  isRepeatMenuOpen.value = false
}

function openDatePicker(field) {
  const value = props.transactionForm[field] || props.transactionForm.date || todayKey
  pickerMonth.value = value.slice(0, 7)
  activeDatePicker.value = field
}

function changePickerMonth(offset) {
  const [year, month] = pickerMonth.value.split('-').map(Number)
  const next = new Date(year, month - 1 + offset, 1)
  pickerMonth.value = `${next.getFullYear()}-${pad(next.getMonth() + 1)}`
}

function selectPickerDate(date) {
  if (activeDatePicker.value === 'repeatEndDate' && date < props.transactionForm.date) return
  props.transactionForm[activeDatePicker.value] = date
  if (activeDatePicker.value === 'date' && props.transactionForm.repeatEndDate < date) {
    props.transactionForm.repeatEndDate = ''
  }
  activeDatePicker.value = ''
}
</script>

<template>
  <section class="pay-logbook" role="dialog" aria-modal="true" aria-label="거래 등록">
    <header class="add-header">
      <button class="close-button" type="button" aria-label="닫기" @click="emit('close')">
        <img src="/icons/Close.svg" alt="" />
      </button>
      <h1>거래 등록</h1>
      <button class="save-button" type="button" @click="emit('save')">저장</button>
    </header>

    <div class="type-tabs" :class="`selected-${transactionForm.type}`">
      <span class="type-indicator" aria-hidden="true"></span>
      <button type="button" :class="{ active: transactionForm.type === 'expense' }" @click="selectType('expense')">지출</button>
      <button type="button" :class="{ active: transactionForm.type === 'income' }" @click="selectType('income')">수입</button>
      <button type="button" :class="{ active: transactionForm.type === 'transfer' }" @click="selectType('transfer')">이체</button>
    </div>

    <label class="field amount-field">
      <span class="field-label">금액</span>
      <input
        :value="formattedAmount"
        type="text"
        inputmode="numeric"
        placeholder="금액을 입력하세요."
        @input="updateAmount"
      />
    </label>

    <div class="field category-field">
      <span class="field-label">카테고리</span>
      <button class="record-row" type="button" @click="emit('open-category-page')">
        <span
          class="emoji-circle category-circle"
          :class="`category-circle-${transactionForm.type}`"
          aria-hidden="true"
        >{{ categoryIcon }}</span>
        <span class="category-name">{{ categoryName }}</span>
        <img v-if="subcategoryName" class="next-icon" src="/icons/Next.svg" alt="" />
        <span v-if="subcategoryName" class="subcategory-name">{{ subcategoryName }}</span>
        <img class="chevron-icon" src="/icons/Chevron.svg" alt="" />
      </button>
    </div>

    <div class="field date-field">
      <span class="field-label">날짜</span>
      <div
        class="record-row date-record-row"
        role="button"
        tabindex="0"
        @click="openDatePicker('date')"
        @keydown.enter.prevent="openDatePicker('date')"
      >
        <span class="date-value">{{ transactionForm.date }}</span>
        <img class="calendar-icon" src="/icons/DateLine.svg" alt="달력" />
      </div>
    </div>

    <div v-if="transactionForm.type === 'expense'" class="field payment-field">
      <span class="field-label">결제수단</span>
      <div class="record-row">
        <span class="emoji-circle" aria-hidden="true">{{ paymentMethodIcon }}</span>
        <span class="payment-name">{{ paymentMethodName }}</span>
        <img class="payment-chevron" src="/icons/Chevron.svg" alt="" />
      </div>
    </div>

    <div
      v-if="transactionForm.type === 'income' || transactionForm.type === 'transfer'"
      class="field asset-method-field"
      :class="{ 'transfer-method-field': transactionForm.type === 'transfer' }"
    >
      <span class="field-label">{{ transactionForm.type === 'transfer' ? '이체수단' : '수입수단' }}</span>
      <button class="record-row asset-method-row" type="button">
        <span class="asset-method-circle" aria-hidden="true">{{ incomeAssetIcon }}</span>
        <span class="asset-institution">{{ incomeInstitution }}</span>
        <template v-if="incomeAccountName">
          <img class="asset-method-next" src="/icons/Next.svg" alt="" />
          <span class="asset-account-name">{{ incomeAccountName }}</span>
        </template>
        <img class="payment-chevron" src="/icons/Chevron.svg" alt="" />
      </button>
    </div>

    <div v-if="transactionForm.type === 'expense'" class="repeat-row">
      <span>반복 지출</span>
      <button
        class="repeat-toggle"
        :class="{ enabled: transactionForm.repeatEnabled }"
        type="button"
        role="switch"
        :aria-checked="transactionForm.repeatEnabled"
        @click="toggleRepeat"
      >
        <span></span>
      </button>
    </div>

    <Transition name="repeat-details">
      <div v-if="transactionForm.type === 'expense' && transactionForm.repeatEnabled" class="repeat-detail-fields">
        <div class="compact-field">
          <span class="field-label">주기</span>
          <button
            class="compact-row"
            type="button"
            :aria-expanded="isRepeatMenuOpen"
            @click="isRepeatMenuOpen = !isRepeatMenuOpen"
          >
            <span>{{ repeatFrequencyLabel }}</span>
            <img class="compact-chevron" :class="{ open: isRepeatMenuOpen }" src="/icons/Chevron.svg" alt="" />
          </button>
          <Transition name="repeat-menu">
            <div v-if="isRepeatMenuOpen" class="repeat-menu">
              <button
                v-for="option in repeatFrequencyOptions"
                :key="option.value"
                type="button"
                :class="{ active: option.value === transactionForm.repeatFrequency }"
                @click="selectRepeatFrequency(option.value)"
              >
                {{ option.label }}
              </button>
            </div>
          </Transition>
        </div>

        <div class="compact-field">
          <span class="field-label">종료일</span>
          <button class="compact-row end-date-row" type="button" @click="openDatePicker('repeatEndDate')">
            <span>{{ transactionForm.repeatEndDate || 'yyyy-mm-dd' }}</span>
            <img src="/icons/DateLine.svg" alt="" />
          </button>
        </div>
      </div>
    </Transition>

    <div
      v-if="transactionForm.type === 'expense'"
      class="field asset-field"
      :class="{ 'repeat-expanded': transactionForm.type === 'expense' && transactionForm.repeatEnabled }"
    >
      <span class="field-label">사용 자산</span>
      <button class="record-row" type="button">
        <span>{{ assetName }}</span>
        <img class="chevron-icon asset-chevron" src="/icons/Chevron.svg" alt="" />
      </button>
    </div>

    <label
      class="field memo-field"
      :class="{
        'repeat-expanded': transactionForm.type === 'expense' && transactionForm.repeatEnabled,
        'compact-memo-field': transactionForm.type !== 'expense',
      }"
    >
      <span class="field-label">메모</span>
      <input v-model="transactionForm.memo" type="text" placeholder="메모를 입력하세요." />
    </label>

    <div v-if="activeDatePicker" class="calendar-dropdown-layer">
      <button class="calendar-dismiss" type="button" aria-label="달력 닫기" @click="activeDatePicker = ''"></button>
        <section
          class="home-calendar-picker"
          :class="{ 'end-picker': activeDatePicker === 'repeatEndDate' }"
          aria-label="날짜 선택"
        >
          <div class="picker-toolbar">
            <button type="button" aria-label="이전 달" @click="changePickerMonth(-1)">
              <img src="/icons/Chevron.svg" alt="" />
            </button>
            <strong>{{ pickerMonthLabel }}</strong>
            <button class="next" type="button" aria-label="다음 달" @click="changePickerMonth(1)">
              <img src="/icons/Chevron.svg" alt="" />
            </button>
          </div>
          <div class="picker-divider"></div>
          <div class="picker-weekdays">
            <span v-for="weekday in pickerWeekdays" :key="weekday">{{ weekday }}</span>
          </div>
          <div class="picker-grid">
            <button
              v-for="(day, index) in pickerDays"
              :key="day?.date || `picker-blank-${index}`"
              type="button"
              :disabled="!day || (activeDatePicker === 'repeatEndDate' && day.date < transactionForm.date)"
              :class="{
                empty: !day,
                selected: day?.date === transactionForm[activeDatePicker],
                today: day?.date === todayKey,
                sunday: (index + (weekStartsOn === 'monday' ? 1 : 0)) % 7 === 0,
                saturday: (index + (weekStartsOn === 'monday' ? 1 : 0)) % 7 === 6,
              }"
              @click="day && selectPickerDate(day.date)"
            >
              <span v-if="day">{{ day.day }}</span>
            </button>
          </div>
        </section>
    </div>
  </section>
</template>

<style scoped>
.pay-logbook {
  position: relative;
  width: 100%;
  height: 100dvh;
  min-height: 100%;
  overflow-x: hidden;
  overflow-y: auto;
  border-radius: 20px;
  background: #fff;
  color: #212529;
  font-family: 'EliceDX', sans-serif;
  font-size: 12px;
  text-align: left;
}

.add-header {
  position: absolute;
  top: 20px;
  left: 20px;
  display: grid;
  grid-template-columns: 32px 1fr 32px;
  align-items: center;
  width: calc(100% - 40px);
  height: 32px;
}

.add-header h1 {
  margin: 0;
  font-size: 24px;
  font-weight: 500;
  line-height: 24px;
  text-align: center;
}

.close-button,
.save-button {
  border: 0;
  background: transparent;
  padding: 0;
}

.close-button {
  display: grid;
  width: 32px;
  height: 32px;
  place-items: center;
}

.close-button img {
  width: 32px;
  height: 32px;
}

.save-button {
  color: #20c997;
  font-size: 15px;
  font-weight: 300;
  line-height: 20px;
  white-space: nowrap;
}

.type-tabs {
  position: absolute;
  top: 70px;
  left: 20px;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  width: calc(100% - 40px);
  height: 38px;
  overflow: hidden;
  border: 0.5px solid #d0d7de;
  border-radius: 40px;
  background: #fff;
  padding: 4px;
  font-family: 'Nanum', sans-serif;
}

.type-indicator {
  position: absolute;
  top: 4px;
  left: 4px;
  width: calc((100% - 8px) / 3);
  height: 30px;
  border-radius: 40px;
  background: #fbdce2;
  transform: translateX(0);
  transition: transform 420ms cubic-bezier(0.34, 1.35, 0.64, 1), background-color 180ms ease;
}

.selected-income .type-indicator {
  background: #e2f5ed;
  transform: translateX(100%);
}

.selected-transfer .type-indicator {
  background: #f5f6f8;
  transform: translateX(200%);
}

.type-tabs button {
  position: relative;
  z-index: 1;
  display: grid;
  height: 30px;
  place-items: center;
  border: 0;
  background: transparent;
  padding: 0;
  color: #212529;
  font: inherit;
  line-height: 14px;
}

.type-tabs .active { color: #f43f5e; }
.selected-income .active { color: #20c997; }
.selected-transfer .active { color: #6c757d; }

.field {
  position: absolute;
  left: 20px;
  width: calc(100% - 40px);
}

.amount-field { top: 123px; }
.category-field { top: 210px; }
.date-field { top: 297px; }
.payment-field,
.asset-method-field { top: 384px; }

.field-label {
  display: block;
  height: 21px;
  color: #6c757d;
  font-weight: 300;
  line-height: 20.25px;
}

.amount-field input,
.record-row {
  width: 100%;
  height: 42px;
  border: 1px solid #ebf0f5;
  border-radius: 10px;
  background: #fff;
  color: #212529;
  font: inherit;
}

.amount-field input {
  display: block;
  padding: 0 7px;
  font-weight: 300;
}

.amount-field input::placeholder { color: #6c757d; }

.record-row {
  position: relative;
  display: flex;
  align-items: center;
  overflow: hidden;
  padding: 0 40px 0 7px;
  text-align: left;
}

button.record-row { cursor: pointer; }

.emoji-circle {
  display: grid;
  width: 28px;
  height: 28px;
  flex: 0 0 28px;
  place-items: center;
  border-radius: 50%;
  background: #fbdce2;
  color: #f43f5e;
  font-size: 17px;
  line-height: 1;
}

.category-circle-income {
  background: #e2f5ed;
  color: #20c997;
}

.category-circle-transfer {
  background: #f5f6f8;
  color: #6c757d;
}

.category-name,
.subcategory-name,
.payment-name,
.asset-institution,
.asset-account-name,
.date-value {
  display: inline-flex;
  align-items: center;
  height: 20px;
  font-weight: 300;
  line-height: 20.25px;
}

.category-name,
.payment-name { margin-left: 7px; }

.asset-method-row { gap: 7px; }

.asset-method-circle {
  display: grid;
  width: 28px;
  height: 28px;
  flex: 0 0 28px;
  place-items: center;
  border-radius: 50%;
  background: #e2f5ed;
  color: #20c997;
  font-size: 15px;
  line-height: 1;
}

.transfer-method-field .asset-method-circle {
  background: #f5f6f8;
  color: #6c757d;
}

.asset-institution,
.asset-account-name {
  flex: 0 1 auto;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.asset-method-next {
  width: 20px;
  height: 20px;
  flex: 0 0 20px;
  margin-inline: -5px;
}

.asset-account-name { color: #6c757d; }

.next-icon {
  width: 20px;
  height: 20px;
  margin-left: -3px;
}

.chevron-icon {
  position: absolute;
  top: 9px;
  right: 5px;
  width: 24px;
  height: 24px;
  transform: rotate(180deg);
}

.asset-chevron { transform: rotate(-90deg); }

.calendar-icon {
  position: absolute;
  top: 9px;
  right: 6px;
  width: 24px;
  height: 24px;
}

.date-record-row { cursor: pointer; }

.payment-chevron {
  position: absolute;
  top: 9px;
  right: 5px;
  width: 24px;
  height: 24px;
  transform: rotate(-90deg);
}

.repeat-row {
  position: absolute;
  top: 645px;
  left: 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: calc(100% - 40px);
  height: 21px;
  color: #6c757d;
  font-weight: 300;
  line-height: 20.25px;
}

.repeat-toggle {
  position: relative;
  width: 36.8px;
  height: 21px;
  overflow: hidden;
  border: 0;
  border-radius: 66px;
  background: #6c757d;
  padding: 1.3px;
  transition: background-color 180ms ease;
}

.repeat-toggle span {
  display: block;
  width: 18.4px;
  height: 18.4px;
  border-radius: 50%;
  background: #f8f9fa;
  transition: transform 220ms cubic-bezier(0.34, 1.56, 0.64, 1);
}

.repeat-toggle.enabled { background: #20c997; }
.repeat-toggle.enabled span { transform: translateX(15.8px); }

.repeat-detail-fields {
  position: absolute;
  top: 690px;
  left: 20px;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 13px;
  width: calc(100% - 40px);
}

.compact-field {
  position: relative;
  min-width: 0;
}

.compact-row {
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
  height: 42px;
  overflow: hidden;
  border: 1px solid #ebf0f5;
  border-radius: 10px;
  background: #fff;
  padding: 0 38px 0 7px;
  color: #212529;
  font: inherit;
  font-weight: 300;
  line-height: 20.25px;
  text-align: left;
}

.compact-chevron {
  position: absolute;
  top: 9px;
  right: 6px;
  width: 24px;
  height: 24px;
  transform: rotate(-90deg);
  transition: transform 180ms ease;
}

.compact-chevron.open { transform: rotate(90deg); }

.repeat-menu {
  position: absolute;
  top: 66px;
  left: 0;
  z-index: 30;
  display: grid;
  width: 100%;
  overflow: hidden;
  border: 1px solid #ebf0f5;
  border-radius: 10px;
  background: #fff;
}

.repeat-menu button {
  height: 38px;
  border: 0;
  border-bottom: 1px solid #ebf0f5;
  background: #fff;
  padding: 0 10px;
  color: #212529;
  font: inherit;
  text-align: left;
}

.repeat-menu button:last-child { border-bottom: 0; }
.repeat-menu button.active { color: #20c997; }

.repeat-menu-enter-active,
.repeat-menu-leave-active {
  transform-origin: top;
  transition: opacity 160ms ease, transform 200ms cubic-bezier(0.22, 1, 0.36, 1);
}

.repeat-menu-enter-from,
.repeat-menu-leave-to {
  opacity: 0;
  transform: translateY(-6px) scaleY(0.96);
}

.end-date-row { padding-right: 36px; }

.end-date-row input {
  width: 100%;
  min-width: 0;
  border: 0;
  background: transparent;
  padding: 0;
  color: #212529;
  font: inherit;
}

.end-date-row input::-webkit-calendar-picker-indicator {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: pointer;
}

.end-date-row img {
  position: absolute;
  top: 9px;
  right: 6px;
  width: 24px;
  height: 24px;
  pointer-events: none;
}

.asset-field { top: 471px; }
.memo-field { top: 558px; }
.memo-field.compact-memo-field { top: 471px; }

.repeat-details-enter-active,
.repeat-details-leave-active {
  transition: opacity 260ms ease, transform 320ms cubic-bezier(0.22, 1, 0.36, 1);
}

.repeat-details-enter-from,
.repeat-details-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

.repeat-details-enter-to,
.repeat-details-leave-from {
  opacity: 1;
  transform: translateY(0);
}

.memo-field input {
  display: block;
  width: 100%;
  height: 42px;
  border: 1px solid #ebf0f5;
  border-radius: 10px;
  background: #fff;
  padding: 0 7px;
  color: #212529;
  font: inherit;
  font-weight: 300;
}

.memo-field input::placeholder { color: #6c757d; }

.calendar-dropdown-layer {
  position: absolute;
  inset: 0;
  z-index: 100;
  pointer-events: none;
}

.calendar-dismiss {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  border: 0;
  background: transparent;
  padding: 0;
  pointer-events: auto;
}

.home-calendar-picker {
  position: absolute;
  top: 366px;
  left: 20px;
  z-index: 1;
  width: calc(100% - 40px);
  min-height: 292px;
  overflow: hidden;
  border: 1px solid #ebf0f5;
  border-radius: 10px;
  background: #fff;
  padding: 4px;
  color: #212529;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.25));
  pointer-events: auto;
  transform-origin: top;
  animation: calendar-dropdown-in 240ms cubic-bezier(0.22, 1, 0.36, 1);
}

.home-calendar-picker.end-picker { top: 757px; }

.picker-toolbar {
  display: grid;
  grid-template-columns: 22px minmax(0, 1fr) 22px;
  align-items: center;
  gap: 9px;
  min-height: 58px;
  padding: 11px 26px 8px;
}

.picker-toolbar button {
  display: grid;
  width: 22px;
  height: 22px;
  place-items: center;
  border: 0;
  background: transparent;
  padding: 0;
}

.picker-toolbar img { width: 23px; height: 23px; }
.picker-toolbar .next img { transform: rotate(180deg); }

.picker-toolbar strong {
  color: #212529;
  font-family: 'Elice', sans-serif;
  font-size: 1.15rem;
  font-weight: 500;
  text-align: center;
}

.picker-divider {
  height: 1px;
  margin: 0 25px;
  background: #dee2e6;
}

.picker-weekdays,
.picker-grid {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  padding-inline: 25px;
}

.picker-weekdays {
  gap: 9px;
  min-height: 42px;
  align-items: center;
  padding-top: 12px;
  padding-bottom: 8px;
  font-family: 'Nanum', sans-serif;
  font-size: 0.72rem;
  text-align: center;
}

.picker-grid {
  gap: 7px 9px;
  padding-bottom: 12px;
}

.picker-grid button {
  display: grid;
  min-width: 0;
  min-height: 32px;
  aspect-ratio: 1;
  place-items: center;
  border: 0;
  border-radius: 50%;
  background: transparent;
  padding: 0;
  color: #212529;
}

.picker-grid button span {
  display: grid;
  width: 34px;
  height: 34px;
  place-items: center;
  border-radius: 50%;
  font-family: 'Elice', sans-serif;
  font-size: 0.97rem;
}

.picker-grid button.sunday { color: #f43f5e; }
.picker-grid button.saturday { color: #6c757d; }
.picker-grid button.today:not(.selected) span { background: #f8f9fa; }
.picker-grid button.selected span { border: 2px solid #d0d7de; }
.picker-grid button:disabled:not(.empty) { opacity: 0.28; }

@keyframes calendar-dropdown-in {
  from { opacity: 0; transform: translateY(-8px) scaleY(0.96); }
  to { opacity: 1; transform: translateY(0) scaleY(1); }
}

</style>
