<script setup>
import { reactive } from "vue"

const props = defineProps({
  accounts: { type: Array, required: true },
  currency: { type: Object, required: true },
  totals: { type: Object, required: true },
})

const emit = defineEmits(["add-account", "add-payment", "back", "remove-account", "remove-payment"])
const savingsTypes = ["적금", "예금", "청약통장", "청년미래적금", "청년도약계좌", "기타"]
const accountForm = reactive({ savingsType: "적금", productName: "", institution: "", startDate: "", maturityDate: "", monthlyAmount: "", interestRate: "", governmentContributionMode: "monthly", governmentContributionAmount: "" })
const paymentForms = reactive({})

function paymentForm(accountId) {
  if (!paymentForms[accountId]) paymentForms[accountId] = { paymentDate: new Date().toISOString().slice(0, 10), amount: "" }
  return paymentForms[accountId]
}

function resetAccountForm() {
  Object.assign(accountForm, { savingsType: "적금", productName: "", institution: "", startDate: "", maturityDate: "", monthlyAmount: "", interestRate: "", governmentContributionMode: "monthly", governmentContributionAmount: "" })
}

function addAccount() {
  emit("add-account", { ...accountForm })
  resetAccountForm()
}

function addPayment(accountId) {
  const form = paymentForm(accountId)
  emit("add-payment", { accountId, paymentDate: form.paymentDate, amount: form.amount })
  form.amount = ""
}

function back() {
  emit("back")
}

function removeAccount(id) {
  emit("remove-account", id)
}

function removePayment(id) {
  emit("remove-payment", id)
}

function formatRate(value) {
  return Number(value || 0).toFixed(2) + "%"
}
</script>

<template>
  <section class="screen asset-management-page">
    <button class="asset-management-back" type="button" @click="back">← 자산 분석</button>

    <section class="asset-feature-section">
      <div class="asset-feature-heading">
        <div><p>Savings & Deposits</p><h2>예적금</h2></div>
        <div class="asset-feature-summary">
          <span>총 납입원금 <strong>{{ currency.format(totals.paidPrincipal) }}</strong></span>
          <span>예상 만기금액 <strong>{{ currency.format(totals.expectedMaturityAmount) }}</strong></span>
        </div>
      </div>

      <form class="asset-feature-form" @submit.prevent="addAccount">
        <h3>예적금 등록</h3>
        <div class="asset-form-grid">
          <label><span>예적금 유형</span><select v-model="accountForm.savingsType"><option v-for="type in savingsTypes" :key="type" :value="type">{{ type }}</option></select></label>
          <label><span>상품명</span><input v-model.trim="accountForm.productName" type="text" required /></label>
          <label><span>금융기관</span><input v-model.trim="accountForm.institution" type="text" /></label>
          <label><span>가입일</span><input v-model="accountForm.startDate" type="date" required /></label>
          <label><span>만기일</span><input v-model="accountForm.maturityDate" type="date" :min="accountForm.startDate" required /></label>
          <label><span>월 납입 예정액</span><input v-model="accountForm.monthlyAmount" type="number" min="0" step="1" required /></label>
          <label><span>은행 이자율(연 %)</span><input v-model="accountForm.interestRate" type="number" min="0" step="0.01" required /></label>
          <label><span>정부기여금 방식</span><select v-model="accountForm.governmentContributionMode"><option value="monthly">월 기여금</option><option value="total">총 기여금</option></select></label>
          <label><span>{{ accountForm.governmentContributionMode === "monthly" ? "월 기여금" : "총 기여금" }}</span><input v-model="accountForm.governmentContributionAmount" type="number" min="0" step="1" /></label>
        </div>
        <button class="primary-button" type="submit">예적금 추가</button>
      </form>

      <div class="asset-account-list">
        <article v-for="account in props.accounts" :key="account.id" class="asset-account-card">
          <header><div><span>{{ account.savingsType || "적금" }} · {{ account.institution || "금융기관 미입력" }}</span><h3>{{ account.productName }}</h3></div><button class="text-danger-button" type="button" @click="removeAccount(account.id)">삭제</button></header>
          <dl class="asset-metric-grid">
            <div><dt>현재 납입원금</dt><dd>{{ currency.format(account.paidPrincipal) }}</dd></div><div><dt>남은 납입 개월</dt><dd>{{ account.remainingPaymentMonths }}개월</dd></div><div><dt>예상 총 납입원금</dt><dd>{{ currency.format(account.expectedPrincipal) }}</dd></div><div><dt>예상 은행이자</dt><dd>{{ currency.format(account.expectedInterest) }}</dd></div><div><dt>예상 정부기여금</dt><dd>{{ currency.format(account.expectedContribution) }}</dd></div><div><dt>예상 만기금액</dt><dd>{{ currency.format(account.expectedMaturityAmount) }}</dd></div><div><dt>만기까지</dt><dd>{{ account.daysRemaining }}일</dd></div><div><dt>이자율</dt><dd>{{ formatRate(account.interestRate) }}</dd></div>
          </dl>
          <p class="asset-account-period">{{ account.startDate }} ~ {{ account.maturityDate }}</p>
          <form class="asset-record-form" @submit.prevent="addPayment(account.id)">
            <label><span>납입일</span><input v-model="paymentForm(account.id).paymentDate" type="date" required /></label>
            <label><span>납입금액</span><input v-model="paymentForm(account.id).amount" type="number" min="1" step="1" required /></label>
            <button type="submit">납입 기록 추가</button>
          </form>
          <div class="asset-record-list"><div v-for="payment in account.payments" :key="payment.id" class="asset-record-item"><span>{{ payment.paymentDate }}</span><strong>{{ currency.format(payment.amount) }}</strong><small>자산 이동</small><button type="button" @click="removePayment(payment.id)">삭제</button></div><p v-if="!account.payments.length" class="empty-state">납입 기록이 없습니다.</p></div>
        </article>
        <p v-if="!accounts.length" class="empty-state">등록된 예적금이 없습니다.</p>
      </div>
    </section>
  </section>
</template>
