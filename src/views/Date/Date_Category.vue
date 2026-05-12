<script setup>
import { computed, nextTick, reactive, ref, watch } from 'vue'

const props = defineProps({
  categories: {
    type: Array,
    required: true,
  },
})

const emit = defineEmits(['add-category', 'delete-category', 'update-category'])

const activeType = ref('expense')
const selectedCategory = ref(null)
const newCategoryName = ref('')
const newSubcategoryName = ref('')
const isEmojiEditing = ref(false)
const previousIcon = ref('')
const emojiInput = ref(null)

const defaultDetails = {
  식비: { type: 'expense', subcategories: ['외식', '장보기', '간식'] },
  교통: { type: 'expense', subcategories: ['버스', '지하철', '택시'] },
  주거: { type: 'expense', subcategories: ['월세', '관리비', '수리'] },
  쇼핑: { type: 'expense', subcategories: ['의류', '생활용품', '선물'] },
  월급: { type: 'income', subcategories: ['기본급', '상여', '수당'] },
  기타: { type: 'expense', subcategories: ['취미', '구독', '기타'] },
}

const categoryDetails = reactive({})
const categoryMark = (name) => name.trim().slice(0, 1) || '+'
const emojiPattern = /\p{Extended_Pictographic}/u

function syncCategories() {
  props.categories.forEach((category) => {
    if (!categoryDetails[category]) {
      categoryDetails[category] = {
        type: defaultDetails[category]?.type || 'expense',
        icon: '',
        subcategories: [...(defaultDetails[category]?.subcategories || ['기본'])],
      }
    }
  })
}

watch(() => props.categories, syncCategories, { immediate: true, deep: true })

const visibleCategories = computed(() =>
  props.categories
    .filter((category) => categoryDetails[category]?.type === activeType.value)
    .map((category) => ({
      name: category,
      ...categoryDetails[category],
    })),
)

const pageTitle = computed(() => {
  if (!selectedCategory.value) return '카테고리 설정'
  return `${selectedCategory.value.type === 'income' ? '수입' : '지출'} 카테고리`
})

function openNewCategory() {
  const name = activeType.value === 'income' ? '새 수입' : '새 지출'
  selectedCategory.value = {
    name,
    type: activeType.value,
    icon: '',
    subcategories: [],
    isNew: true,
  }
  newCategoryName.value = name
  newSubcategoryName.value = ''
  isEmojiEditing.value = false
  previousIcon.value = ''
}

function openCategory(category) {
  selectedCategory.value = {
    name: category.name,
    type: category.type,
    icon: category.icon,
    subcategories: [...category.subcategories],
    isNew: false,
  }
  newCategoryName.value = category.name
  newSubcategoryName.value = ''
  isEmojiEditing.value = false
  previousIcon.value = ''
}

function closeDetail() {
  selectedCategory.value = null
  newCategoryName.value = ''
  newSubcategoryName.value = ''
  isEmojiEditing.value = false
  previousIcon.value = ''
}

function saveCategory() {
  if (!selectedCategory.value) return
  const name = newCategoryName.value.trim()
  if (!name) return

  if (selectedCategory.value.isNew) {
    emit('add-category', name)
  } else {
    emit('update-category', {
      oldName: selectedCategory.value.name,
      newName: name,
    })
  }

  categoryDetails[name] = {
    type: selectedCategory.value.type,
    icon: selectedCategory.value.icon,
    subcategories: [...selectedCategory.value.subcategories],
  }
  closeDetail()
}

function deleteCategory() {
  if (!selectedCategory.value || selectedCategory.value.isNew) return
  emit('delete-category', selectedCategory.value.name)
  closeDetail()
}

function addSubcategory() {
  const name = newSubcategoryName.value.trim()
  if (!name || !selectedCategory.value) return
  if (!selectedCategory.value.subcategories.includes(name)) {
    selectedCategory.value.subcategories.push(name)
  }
  newSubcategoryName.value = ''
}

function removeSubcategory(name) {
  selectedCategory.value.subcategories = selectedCategory.value.subcategories.filter((item) => item !== name)
}

function getFirstGrapheme(value) {
  const text = value.trim()
  if (!text) return ''
  const segments = Intl?.Segmenter
    ? [...new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(text)].map((item) => item.segment)
    : Array.from(text)
  return segments.find((segment) => emojiPattern.test(segment)) || ''
}

function updateIcon(event) {
  selectedCategory.value.icon = getFirstGrapheme(event.target.value)
  event.target.value = selectedCategory.value.icon
  if (selectedCategory.value.icon) {
    isEmojiEditing.value = false
    previousIcon.value = ''
    event.target.blur()
  }
}

async function focusEmojiInput() {
  previousIcon.value = selectedCategory.value.icon
  selectedCategory.value.icon = ''
  isEmojiEditing.value = true
  await nextTick()
  if (emojiInput.value) emojiInput.value.value = ''
  emojiInput.value?.focus()
}

function finishEmojiEditing() {
  if (!selectedCategory.value.icon) {
    selectedCategory.value.icon = previousIcon.value
  }
  previousIcon.value = ''
  isEmojiEditing.value = false
}

</script>

<template>
  <section class="book-menu-panel category-page-panel">
    <div class="category-page-header">
      <button
        v-if="selectedCategory"
        class="category-icon-button back-button"
        type="button"
        aria-label="카테고리 저장 후 목록으로 돌아가기"
        @click="saveCategory"
      >
        <span aria-hidden="true"></span>
      </button>
      <span v-else></span>
      <h2>{{ pageTitle }}</h2>
      <div class="category-header-actions">
        <button
          v-if="selectedCategory && !selectedCategory.isNew"
          class="category-icon-button muted trash-button"
          type="button"
          aria-label="카테고리 삭제"
          @click="deleteCategory"
        >
          <span aria-hidden="true"></span>
        </button>
      </div>
    </div>

    <Transition name="category-page-switch" mode="out-in">
      <div v-if="!selectedCategory" key="category-list" class="category-list-view">
        <div class="category-type-tabs" :class="{ 'income-selected': activeType === 'income' }">
          <span class="category-type-indicator"></span>
          <button type="button" :class="{ active: activeType === 'expense' }" @click="activeType = 'expense'">
            지출 카테고리
          </button>
          <button type="button" :class="{ active: activeType === 'income' }" @click="activeType = 'income'">
            수입 카테고리
          </button>
        </div>

        <div class="category-grid">
          <button
            v-for="category in visibleCategories"
            :key="category.name"
            class="category-grid-item"
            type="button"
            @click="openCategory(category)"
          >
            <span class="category-icon-bubble">{{ category.icon || categoryMark(category.name) }}</span>
            <strong>{{ category.name }}</strong>
            <span>소분류 {{ category.subcategories.length }}개</span>
          </button>
          <button class="category-grid-item add-category-tile" type="button" @click="openNewCategory">
            <span class="category-icon-bubble add-category-icon" aria-hidden="true"></span>
            <strong>카테고리</strong>
            <span>추가</span>
          </button>
        </div>
      </div>

      <div v-else key="category-detail" class="category-detail-view">
        <div class="category-icon-editor">
          <input
            ref="emojiInput"
            class="category-emoji-input"
            :value="selectedCategory.icon"
            type="text"
            inputmode="text"
            autocomplete="off"
            :readonly="!isEmojiEditing"
            :placeholder="isEmojiEditing ? '' : categoryMark(newCategoryName)"
            aria-label="카테고리 이모지 입력"
            @input="updateIcon"
            @blur="finishEmojiEditing"
          />
          <button
            class="category-pencil-button"
            type="button"
            aria-label="카테고리 이모지 입력"
            @click="focusEmojiInput"
          >
            <span aria-hidden="true"></span>
          </button>
        </div>

        <label class="category-name-field">
          <span>카테고리 이름</span>
          <input v-model.trim="newCategoryName" type="text" placeholder="카테고리 이름" />
        </label>

        <div class="subcategory-section">
          <div class="subcategory-title-row">
            <strong>소분류</strong>
            <button type="button" aria-label="소분류 추가" @click="addSubcategory">＋</button>
          </div>
          <div class="subcategory-input-row">
            <input
              v-model.trim="newSubcategoryName"
              type="text"
              placeholder="소분류 추가"
              @keyup.enter="addSubcategory"
            />
          </div>
          <div class="subcategory-chips">
            <button
              v-for="subcategory in selectedCategory.subcategories"
              :key="subcategory"
              type="button"
              @click="removeSubcategory(subcategory)"
            >
              {{ subcategory }}
              <span>−</span>
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </section>
</template>
