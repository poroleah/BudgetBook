<script setup>
import { computed, ref } from 'vue'

const props = defineProps({
  categories: {
    type: Array,
    required: true,
  },
  settings: {
    type: Object,
    required: true,
  },
})

defineEmits(['add-category'])

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
  <section class="screen settings-screen">
    <article class="settings-panel" @click="closeEditableFieldsOnOutsideControl">
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
          {{ settings.bookName || '내 가계부' }}
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
          {{ formattedMonthlyBudget }}
        </button>
      </div>
      <div class="toggle-row">
        <span>다크모드</span>
        <button
          class="toggle-button"
          type="button"
          aria-label="다크모드"
          :aria-pressed="settings.theme === 'dark'"
          @click="settings.theme = settings.theme === 'dark' ? 'light' : 'dark'"
        >
          <span class="toggle-switch" aria-hidden="true"></span>
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
      <div class="chip-list">
        <span v-for="category in categories" :key="category">{{ category }}</span>
      </div>
    </article>
  </section>
</template>
