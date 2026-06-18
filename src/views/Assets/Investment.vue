<script setup>
import { reactive } from "vue"

const props = defineProps({
  accounts: { type: Array, required: true },
  currency: { type: Object, required: true },
  totals: { type: Object, required: true },
})

const emit = defineEmits(["add-account", "add-transaction", "back", "remove-account", "remove-transaction"])
const accountTypes = ["ISA", "일반 증권계좌", "연금저축", "IRP"]
const accountForm = reactive({ accountName: "", institution: "", accountType: "일반 증권계좌" })
const transactionForms = reactive({})
const transactionLabels = { deposit: "입금", withdrawal: "출금", valuation: "평가 갱신" }

function transactionForm(accountId) {
  if (!transactionForms[accountId]) transactionForms[accountId] = { type: "deposit", transactionDate: new Date().toISOString().slice(0, 10), amount: "" }
  return transactionForms[accountId]
}

function addAccount() {
  emit("add-account", { ...accountForm })
  Object.assign(accountForm, { accountName: "", institution: "", accountType: "일반 증권계좌" })
}

function addTransaction(accountId) {
  const form = transactionForm(accountId)
  emit("add-transaction", { accountId, type: form.type, transactionDate: form.transactionDate, amount: form.amount })
  form.amount = ""
}

function back() {
  emit("back")
}

function removeAccount(id) {
  emit("remove-account", id)
}

function removeTransaction(id) {
  emit("remove-transaction", id)
}

function formatReturn(value) {
  if (value === null) return "미평가"
  return (value >= 0 ? "+" : "") + value.toFixed(2) + "%"
}
</script>

<template>
  <section class="screen asset-management-page">
    <button class="asset-management-back" type="button" @click="back">← 자산 분석</button>

    <section class="asset-feature-section">
      <div class="asset-feature-heading">
        <div><p>Investment</p><h2>투자</h2></div>
        <div class="asset-feature-summary">
          <span>총 투자원금 <strong>{{ currency.format(totals.principal) }}</strong></span>
          <span>총 평가금액 <strong>{{ currency.format(totals.currentValue) }}</strong></span>
          <span>총 평가손익 <strong>{{ currency.format(totals.profitLoss) }}</strong></span>
        </div>
      </div>
      <p v-if="totals.valuedAccountCount < accounts.length" class="asset-helper">평가금액 요약은 직접 평가값을 입력한 계좌 {{ totals.valuedAccountCount }}개만 합산합니다.</p>

      <form class="asset-feature-form" @submit.prevent="addAccount">
        <h3>투자 계좌 등록</h3>
        <div class="asset-form-grid">
          <label><span>계좌명</span><input v-model.trim="accountForm.accountName" type="text" required /></label>
          <label><span>금융기관</span><input v-model.trim="accountForm.institution" type="text" /></label>
          <label><span>계좌 유형</span><select v-model="accountForm.accountType"><option v-for="type in accountTypes" :key="type" :value="type">{{ type }}</option></select></label>
        </div>
        <button class="primary-button" type="submit">투자 계좌 추가</button>
      </form>

      <div class="asset-account-list">
        <article v-for="account in props.accounts" :key="account.id" class="asset-account-card">
          <header><div><span>{{ account.accountType }} · {{ account.institution || "금융기관 미입력" }}</span><h3>{{ account.accountName }}</h3></div><button class="text-danger-button" type="button" @click="removeAccount(account.id)">삭제</button></header>
          <dl class="asset-metric-grid"><div><dt>투자원금</dt><dd>{{ currency.format(account.principal) }}</dd></div><div><dt>현재 평가금액</dt><dd>{{ account.currentValue === null ? "미평가" : currency.format(account.currentValue) }}</dd></div><div><dt>평가손익</dt><dd>{{ account.profitLoss === null ? "미평가" : currency.format(account.profitLoss) }}</dd></div><div><dt>수익률</dt><dd>{{ formatReturn(account.returnRate) }}</dd></div></dl>
          <p v-if="account.lastValuationDate" class="asset-account-period">마지막 평가 갱신: {{ account.lastValuationDate }}</p>
          <form class="asset-record-form investment-record-form" @submit.prevent="addTransaction(account.id)">
            <label><span>기록 유형</span><select v-model="transactionForm(account.id).type"><option value="deposit">입금</option><option value="withdrawal">출금</option><option value="valuation">평가금액 갱신</option></select></label>
            <label><span>기록일</span><input v-model="transactionForm(account.id).transactionDate" type="date" required /></label>
            <label><span>{{ transactionForm(account.id).type === "valuation" ? "평가금액" : "금액" }}</span><input v-model="transactionForm(account.id).amount" type="number" min="0" step="1" required /></label>
            <button type="submit">기록 추가</button>
          </form>
          <div class="asset-record-list"><div v-for="transaction in account.transactions" :key="transaction.id" class="asset-record-item"><span>{{ transaction.transactionDate }}</span><strong>{{ currency.format(transaction.amount) }}</strong><small>{{ transactionLabels[transaction.type] }}</small><button type="button" @click="removeTransaction(transaction.id)">삭제</button></div><p v-if="!account.transactions.length" class="empty-state">거래 기록이 없습니다.</p></div>
        </article>
        <p v-if="!accounts.length" class="empty-state">등록된 투자 계좌가 없습니다.</p>
      </div>
    </section>
  </section>
</template>
