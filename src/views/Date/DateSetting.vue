<script setup>
import { computed, ref } from 'vue'
import PageHeader from '../../components/PageHeader.vue'

const props = defineProps({
  settings: {
    type: Object,
    required: true,
  },
})

defineEmits(['add-category', 'closePage'])

const isBookNameEditing = ref(!props.settings.bookName)
const isBudgetEditing = ref(props.settings.monthlyBudget === '')

const formattedMonthlyBudget = computed(() =>
  `${new Intl.NumberFormat('ko-KR').format(Number(props.settings.monthlyBudget || 0))}원`,
)

function closeBudgetInput() {
  if (props.settings.monthlyBudget !== '' && props.settings.monthlyBudget !== null) {
    isBudgetEditing.value = false
  }
}

function closeBookNameInput() {
  if (props.settings.bookName.trim()) {
    isBookNameEditing.value = false
  }
}

function closeEditableFields() {
  closeBookNameInput()
  closeBudgetInput()
}

function closeEditableFieldsOnOutsideControl(event) {
  if (event.target.closest('input, button, select, textarea')) return
  closeEditableFields()
}
</script>

<template>
  <section class="book-menu-panel" @click="closeEditableFieldsOnOutsideControl">
    <PageHeader title="가계부 설정" back-label="달력으로 돌아가기" @back="$emit('closePage')" />
    <div class="setting-value-row">
      <span>가계부 이름</span>
      <input
        v-if="isBookNameEditing"
        v-model.trim="settings.bookName"
        type="text"
        placeholder="내 가계부"
        @blur="closeBookNameInput"
        @keyup.enter="closeBookNameInput"
      />
      <button v-else class="setting-value-display" type="button" @click="isBookNameEditing = true">
        <span>{{ settings.bookName || '내 가계부' }}</span>
        <span class="setting-edit-icon" aria-hidden="true"></span>
      </button>
    </div>
    <div class="budget-row">
      <span>월 예산</span>
      <input
        v-if="isBudgetEditing"
        v-model.number="settings.monthlyBudget"
        type="number"
        min="0"
        @blur="closeBudgetInput"
        @keyup.enter="closeBudgetInput"
      />
      <button v-else class="setting-value-display" type="button" @click="isBudgetEditing = true">
        <span>{{ formattedMonthlyBudget }}</span>
        <span class="setting-edit-icon" aria-hidden="true"></span>
      </button>
    </div>
    <div class="week-start-row">
      <span>주 시작 요일</span>
      <div class="week-start-options" :class="{ 'monday-selected': settings.weekStartsOn === 'monday' }">
        <span class="week-start-indicator"></span>
        <button
          type="button"
          :class="{ active: settings.weekStartsOn === 'sunday' }"
          @click="settings.weekStartsOn = 'sunday'"
        >
          일요일
        </button>
        <button
          type="button"
          :class="{ active: settings.weekStartsOn === 'monday' }"
          @click="settings.weekStartsOn = 'monday'"
        >
          월요일
        </button>
      </div>
    </div>
    <label>
      <span>카테고리 추가</span>
      <input type="text" placeholder="새 카테고리" @keyup.enter="$emit('add-category', $event)" />
    </label>
  </section>
</template>
