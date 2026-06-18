<script setup>
import { reactive, ref } from "vue"

const props = defineProps({
  accounts: { type: Array, required: true },
  currency: { type: Object, required: true },
  total: { type: Number, required: true },
})

const emit = defineEmits(["add-account", "back", "remove-account", "update-account"])
const accountTypes = ["입출금통장", "파킹통장", "CMA", "현금", "기타"]
const isFormOpen = ref(false)
const form = reactive({ id: null, name: "", institution: "", type: "입출금통장", balance: "" })

function resetForm(account = null) {
  form.id = account?.id ?? null
  form.name = account?.name ?? ""
  form.institution = account?.institution ?? ""
  form.type = accountTypes.includes(account?.type) ? account.type : "기타"
  form.balance = account?.balance ?? ""
}

function openCreateForm() {
  resetForm()
  isFormOpen.value = true
}

function openEditForm(account) {
  resetForm(account)
  isFormOpen.value = true
}

function closeForm() {
  isFormOpen.value = false
  resetForm()
}

function saveAccount() {
  emit(form.id ? "update-account" : "add-account", { ...form })
  closeForm()
}

function back() {
  emit("back")
}

function removeAccount(id) {
  emit("remove-account", id)
}

function accountMeta(account) {
  return account.institution ? account.type + " · " + account.institution : account.type
}
</script>

<template>
  <section class="screen asset-management-page">
    <button class="asset-management-back" type="button" @click="back">← 자산 분석</button>

    <section class="asset-feature-section">
      <div class="asset-feature-heading">
        <div><p>Accounts</p><h2>일반 계좌</h2></div>
        <div class="asset-feature-summary">
          <span v-if="accounts.length">총 잔액 <strong>{{ currency.format(total) }}</strong></span>
          <button v-if="!isFormOpen" type="button" @click="openCreateForm">계좌 추가</button>
        </div>
      </div>

      <form v-if="isFormOpen" class="asset-feature-form" @submit.prevent="saveAccount">
        <h3>{{ form.id ? "일반 계좌 수정" : "일반 계좌 등록" }}</h3>
        <div class="asset-form-grid">
          <label><span>계좌명</span><input v-model.trim="form.name" type="text" required /></label>
          <label><span>금융기관</span><input v-model.trim="form.institution" type="text" /></label>
          <label>
            <span>계좌 유형</span>
            <select v-model="form.type">
              <option v-for="type in accountTypes" :key="type" :value="type">{{ type }}</option>
            </select>
          </label>
          <label><span>현재 잔액</span><input v-model="form.balance" type="number" step="1" required /></label>
        </div>
        <div class="general-account-form-actions">
          <button type="button" @click="closeForm">취소</button>
          <button class="primary-button" type="submit">{{ form.id ? "수정 저장" : "계좌 저장" }}</button>
        </div>
      </form>

      <div class="asset-account-list">
        <article v-for="account in props.accounts" :key="account.id" class="asset-account-card">
          <header>
            <div><span>{{ accountMeta(account) }}</span><h3>{{ account.name }}</h3></div>
            <div class="general-account-card-actions">
              <strong>{{ currency.format(Number(account.balance) || 0) }}</strong>
              <button type="button" @click="openEditForm(account)">수정</button>
              <button type="button" @click="removeAccount(account.id)">삭제</button>
            </div>
          </header>
        </article>
        <p v-if="!accounts.length" class="empty-state">등록된 일반 계좌가 없습니다.</p>
      </div>
    </section>
  </section>
</template>
