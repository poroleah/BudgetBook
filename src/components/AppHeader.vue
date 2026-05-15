<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'

const props = defineProps({
  activeBookId: {
    type: String,
    required: true,
  },
  activeBookPage: {
    type: String,
    default: '',
  },
  activeTab: {
    type: String,
    required: true,
  },
  bookName: {
    type: String,
    default: '',
  },
  books: {
    type: Array,
    required: true,
  },
  currency: {
    type: Object,
    required: true,
  },
  expense: {
    type: Number,
    required: true,
  },
  income: {
    type: Number,
    required: true,
  },
  transfer: {
    type: Number,
    required: true,
  },
})

const emit = defineEmits(['add-book', 'open-category', 'open-settings', 'select-book'])
const isBookSwitcherOpen = ref(false)
const bookSwitcher = ref(null)

const activeBookLabel = computed(() => props.bookName || '내 가계부')

function selectBook(bookId) {
  emit('select-book', bookId)
  isBookSwitcherOpen.value = false
}

function addBook() {
  emit('add-book')
  isBookSwitcherOpen.value = false
}

function closeBookSwitcherOnOutsideClick(event) {
  if (!bookSwitcher.value || bookSwitcher.value.contains(event.target)) return
  isBookSwitcherOpen.value = false
}

watch(
  () => [props.activeTab, props.activeBookPage],
  () => {
    isBookSwitcherOpen.value = false
  },
)

onMounted(() => {
  document.addEventListener('click', closeBookSwitcherOnOutsideClick)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', closeBookSwitcherOnOutsideClick)
})
</script>

<template>
  <section class="topbar">
    <div class="title-area">
      <p class="eyebrow">Moneybook</p>
      <div class="title-row">
        <div class="title-copy">
          <div ref="bookSwitcher" class="title-heading">
            <button
              class="book-title-button"
              type="button"
              :aria-expanded="isBookSwitcherOpen"
              @click="isBookSwitcherOpen = !isBookSwitcherOpen"
            >
              <h1>{{ activeBookLabel }}</h1>
              <span class="entry-select-chevron" aria-hidden="true"></span>
            </button>
            <Transition name="entry-dropdown-slide">
              <div v-if="isBookSwitcherOpen" class="book-switcher-menu">
                <button
                  v-for="book in books"
                  :key="book.id"
                  class="book-switcher-item"
                  type="button"
                  :class="{ active: book.id === activeBookId }"
                  @click="selectBook(book.id)"
                >
                  {{ book.settings?.bookName || '내 가계부' }}
                </button>
                <button class="book-switcher-add" type="button" @click="addBook">
                  새 가계부 추가
                </button>
              </div>
            </Transition>
          </div>
          <div class="compact-summary" aria-label="이번 달 요약">
            <span>수입 {{ currency.format(income) }}</span>
            <span>지출 {{ currency.format(expense) }}</span>
            <span>이체 {{ currency.format(transfer) }}</span>
          </div>
        </div>
        <div v-if="activeTab === 'calendar'" class="book-menu">
          <button
            class="menu-button category-menu-button"
            type="button"
            aria-label="카테고리 페이지 열기"
            :aria-expanded="activeBookPage === 'category'"
            @click="$emit('open-category')"
          >
            <span></span>
            <span></span>
            <span></span>
            <span></span>
          </button>
          <button
            class="menu-button"
            type="button"
            aria-label="가계부 설정 열기"
            :aria-expanded="activeBookPage === 'settings'"
            @click="$emit('open-settings')"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
      </div>
    </div>
  </section>
</template>
