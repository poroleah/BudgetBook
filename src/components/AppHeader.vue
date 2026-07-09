<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import DonguramiIcon from '../assets/Dongurami.svg'
import DonguIcon from '../assets/Dongu.svg'

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
      <div class="title-row">
        <div class="title-copy">
          <div ref="bookSwitcher" class="title-heading">
            <button
              class="book-title-button book-title-design"
              type="button"
              :aria-expanded="isBookSwitcherOpen"
              @click="isBookSwitcherOpen = !isBookSwitcherOpen"
            >
              <span class="book-brand-icons" aria-hidden="true">
                <img :src="DonguramiIcon" alt="" />
                <img :src="DonguIcon" alt="" />
              </span>
              <h1>{{ activeBookLabel }}</h1>
              <span class="book-title-chevron" aria-hidden="true"></span>
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
            class="menu-button header-icon-button"
            type="button"
            aria-label="카테고리 페이지 열기"
            :aria-expanded="activeBookPage === 'category'"
            @click="$emit('open-category')"
          >
            <img src="/icons/CateSet.svg" alt="" />
          </button>
          <button
            class="menu-button header-icon-button"
            type="button"
            aria-label="가계부 설정 열기"
            :aria-expanded="activeBookPage === 'settings'"
            @click="$emit('open-settings')"
          >
            <img src="/icons/CalSet.svg" alt="" />
          </button>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.book-switcher-menu {
  font-family: 'EliceDX', sans-serif;
}

.book-title-design {
  display: flex;
  gap: 0;
  min-height: 28px;
  padding: 0;
}

.book-brand-icons {
  display: flex;
  align-items: center;
  margin-right: 12px;
}

.book-brand-icons img {
  width: 20px;
  height: 20px;
}

.book-brand-icons img + img {
  margin-left: 3px;
}

.book-title-design h1 {
  margin: 0;
  font-family: 'EliceDX', sans-serif;
  font-size: 1.25rem;
  font-weight: 500;
  line-height: 20px;
}

.book-title-chevron {
  width: 20px;
  height: 20px;
  margin-left: 1px;
  background: #6c757d;
  -webkit-mask: url("/icons/Chevron.svg") center / contain no-repeat;
  mask: url("/icons/Chevron.svg") center / contain no-repeat;
  transform: rotate(-90deg);
  transition: transform 180ms ease;
}

.book-title-design[aria-expanded='true'] .book-title-chevron {
  transform: rotate(90deg);
}

.book-menu {
  gap: 8px;
  top: 4px;
}

.book-menu .header-icon-button.header-icon-button {
  display: grid;
  width: 32px;
  height: 32px;
  aspect-ratio: 1 / 1;
  place-items: center;
  padding: 0;
  border: 1px solid rgba(223, 229, 236, 0.9) !important;
  border-radius: 10px;
  background: var(--White, #fff) !important;
  color: #212529;
  box-shadow: 0 2px 4px 0 rgba(0, 0, 0, 0.25) !important;
}

.book-menu .header-icon-button.header-icon-button img {
  width: 22px;
  height: 22px;
  display: block;
}
</style>
