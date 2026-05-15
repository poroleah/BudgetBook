<script setup>
import { computed, ref } from 'vue'

const props = defineProps({
  activeBookId: {
    type: String,
    required: true,
  },
  books: {
    type: Array,
    required: true,
  },
  categories: {
    type: Array,
    required: true,
  },
  settings: {
    type: Object,
    required: true,
  },
})

defineEmits(['add-category', 'delete-book'])

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
      <div class="book-delete-section">
        <div class="panel-heading">
          <p>Books</p>
          <h2>가계부 목록</h2>
        </div>
        <div class="book-delete-list">
          <article v-for="book in books" :key="book.id" class="book-delete-item">
            <div>
              <span>{{ book.id === activeBookId ? '현재 가계부' : '가계부' }}</span>
              <strong>{{ book.settings?.bookName || '내 가계부' }}</strong>
            </div>
            <button
              type="button"
              :disabled="books.length <= 1"
              @click="$emit('delete-book', book.id)"
            >
              삭제
            </button>
          </article>
        </div>
      </div>
    </article>
  </section>
</template>
