<script setup>
import { computed, ref } from 'vue'
import PageHeader from '../../components/PageHeader.vue'

const props = defineProps({
  assetTypes: {
    type: Array,
    required: true,
  },
  assets: {
    type: Array,
    required: true,
  },
  paymentMethods: {
    type: Array,
    required: true,
  },
  settings: {
    type: Object,
    required: true,
  },
})

const emit = defineEmits(['add-asset', 'add-asset-type', 'add-payment-method', 'closePage'])

const isBookNameEditing = ref(!props.settings.bookName)
const isBudgetEditing = ref(props.settings.monthlyBudget === '')
const openSettingList = ref('')
const isAssetNameEditing = ref(false)
const isAssetTypeMenuOpen = ref(false)
const newAsset = ref({
  name: '',
  type: '은행',
})
const newAssetType = ref('')
const newPaymentMethod = ref('')

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

function toggleSettingList(list) {
  openSettingList.value = openSettingList.value === list ? '' : list
}

function addAsset() {
  if (!newAsset.value.name.trim()) return
  emit('add-asset', { ...newAsset.value, balance: 0 })
  isAssetTypeMenuOpen.value = false
  isAssetNameEditing.value = true
  newAsset.value = {
    name: '',
    type: '은행',
  }
}

function addAssetType() {
  const type = newAssetType.value.trim()
  if (!type) return
  emit('add-asset-type', type)
  newAsset.value.type = type
  newAssetType.value = ''
  isAssetTypeMenuOpen.value = false
}

function closeAssetNameInput() {
  if (newAsset.value.name.trim()) {
    isAssetNameEditing.value = false
  }
}

function selectAssetType(type) {
  newAsset.value.type = type
  isAssetTypeMenuOpen.value = false
}

function addPaymentMethod() {
  const method = newPaymentMethod.value.trim()
  if (!method) return
  emit('add-payment-method', method)
  newPaymentMethod.value = ''
}
</script>

<template>
  <section class="book-menu-panel" @click="closeEditableFieldsOnOutsideControl">
    <PageHeader
      title="가계부 설정"
      back-label="달력으로 돌아가기"
      @back="$emit('closePage')"
    />
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
      <span>전월 수입 이월</span>
      <button
        class="toggle-button"
        type="button"
        aria-label="전월 수입 이월"
        :aria-pressed="settings.carryOverIncome"
        @click="settings.carryOverIncome = !settings.carryOverIncome"
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
    <div class="setting-section-divider" aria-hidden="true"></div>
    <div class="setting-asset-section">
      <form class="setting-asset-form" @submit.prevent="addAsset">
        <div class="setting-value-row">
          <span>자산 등록하기</span>
          <input
            v-if="isAssetNameEditing"
            v-model.trim="newAsset.name"
            type="text"
            placeholder="자산 이름"
            @blur="closeAssetNameInput"
            @keyup.enter="closeAssetNameInput"
          />
          <button v-else class="setting-value-display" type="button" @click="isAssetNameEditing = true">
            <span>{{ newAsset.name || '자산 이름' }}</span>
            <span class="setting-edit-icon" aria-hidden="true"></span>
          </button>
        </div>
        <div class="setting-value-row">
          <span>자산 종류</span>
          <div class="setting-type-select">
            <button
              class="setting-type-button"
              type="button"
              :aria-expanded="isAssetTypeMenuOpen"
              @click="isAssetTypeMenuOpen = !isAssetTypeMenuOpen"
            >
              <span>{{ newAsset.type }}</span>
              <span class="entry-select-chevron" aria-hidden="true"></span>
            </button>
            <Transition name="entry-dropdown-slide">
              <div v-if="isAssetTypeMenuOpen" class="setting-type-menu">
                <button
                  v-for="type in props.assetTypes"
                  :key="type"
                  type="button"
                  :class="{ active: type === newAsset.type }"
                  @click="selectAssetType(type)"
                >
                  {{ type }}
                </button>
              </div>
            </Transition>
          </div>
        </div>
        <div class="setting-inline-form setting-asset-type-form">
          <input
            v-model.trim="newAssetType"
            type="text"
            placeholder="자산 종류 추가"
            @keyup.enter.prevent="addAssetType"
          />
          <button type="button" @click="addAssetType">추가</button>
        </div>
        <button class="setting-add-button" type="submit">추가</button>
      </form>
      <span v-for="asset in assets" :key="asset.id" class="setting-list-chip">
        {{ asset.name }}
      </span>
      <span v-if="!assets.length" class="setting-list-empty">등록된 자산이 없습니다.</span>
    </div>
    <div class="setting-section-divider" aria-hidden="true"></div>
    <div class="setting-dropdown-row">
      <button
        class="setting-dropdown-toggle"
        type="button"
        :aria-expanded="openSettingList === 'paymentMethods'"
        @click="toggleSettingList('paymentMethods')"
      >
        <span>결제수단 보기</span>
        <span class="entry-select-chevron" aria-hidden="true"></span>
      </button>
      <Transition name="entry-dropdown-slide">
        <div v-if="openSettingList === 'paymentMethods'" class="setting-dropdown-panel">
          <form class="setting-inline-form" @submit.prevent="addPaymentMethod">
            <input v-model.trim="newPaymentMethod" type="text" placeholder="결제수단 이름" />
            <button type="submit">추가</button>
          </form>
          <span v-for="method in paymentMethods" :key="method" class="setting-list-chip">
            {{ method }}
          </span>
          <span v-if="!paymentMethods.length" class="setting-list-empty">등록된 결제수단이 없습니다.</span>
        </div>
      </Transition>
    </div>
  </section>
</template>
