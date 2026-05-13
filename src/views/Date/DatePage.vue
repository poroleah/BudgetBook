<script setup>
import DateCategory from './DateCategory.vue'
import DateSetting from './DateSetting.vue'
import DateCalendar from './DateCalendar.vue'

defineProps({
  activeBookPage: {
    type: String,
    required: true,
  },
  calendarDays: {
    type: Array,
    required: true,
  },
  categories: {
    type: Array,
    required: true,
  },
  categoryDetails: {
    type: Object,
    required: true,
  },
  categoryPageMode: {
    type: String,
    required: true,
  },
  currency: {
    type: Object,
    required: true,
  },
  currentMonth: {
    type: String,
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
  settings: {
    type: Object,
    required: true,
  },
  transactionForm: {
    type: Object,
    required: true,
  },
  weekStartsOn: {
    type: String,
    required: true,
  },
})

defineEmits([
  'add-category',
  'add-transaction',
  'change-month',
  'close-page',
  'delete-category',
  'open-category-page',
  'remove-transaction',
  'select-date',
  'select-month',
  'select-subcategory',
  'update-category',
  'update-category-details',
  'update-transaction',
])
</script>

<template>
  <section
    v-if="!activeBookPage"
    class="calendar-page-shell"
  >
    <DateCalendar
      :calendar-days="calendarDays"
      :categories="categories"
      :category-details="categoryDetails"
      :current-month="currentMonth"
      :currency="currency"
      :selected-date="selectedDate"
      :selected-transactions="selectedTransactions"
      :transaction-form="transactionForm"
      :week-starts-on="weekStartsOn"
      @add-transaction="$emit('add-transaction')"
      @change-month="$emit('change-month', $event)"
      @open-category-page="$emit('open-category-page')"
      @remove-transaction="$emit('remove-transaction', $event)"
      @select-date="$emit('select-date', $event)"
      @select-month="$emit('select-month', $event)"
      @update-transaction="$emit('update-transaction', $event)"
    />
  </section>

  <Transition name="calendar-settings-drawer" mode="out-in">
    <section
      v-if="activeBookPage === 'category'"
      key="calendar-category-page"
      class="calendar-standalone-page"
    >
      <DateCategory
        class="calendar-settings-page"
        :categories="categories"
        :category-details="categoryDetails"
        :selection-mode="categoryPageMode === 'select'"
        :selection-type="transactionForm.type"
        @add-category="$emit('add-category', $event)"
        @close-page="$emit('close-page')"
        @delete-category="$emit('delete-category', $event)"
        @select-subcategory="$emit('select-subcategory', $event)"
        @update-category-details="$emit('update-category-details', $event)"
        @update-category="$emit('update-category', $event)"
      />
    </section>

    <section
      v-else-if="activeBookPage === 'settings'"
      key="calendar-settings-page"
      class="calendar-standalone-page"
    >
      <DateSetting
        class="calendar-settings-page"
        :settings="settings"
        @add-category="$emit('add-category', $event)"
        @close-page="$emit('close-page')"
      />
    </section>
  </Transition>
</template>
