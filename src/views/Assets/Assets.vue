<script setup>
defineProps({
  combinedTotalAssets: { type: Number, required: true },
  currency: { type: Object, required: true },
  generalAccountsCount: { type: Number, required: true },
  generalAccountsTotal: { type: Number, required: true },
  investmentTotals: { type: Object, required: true },
  savingsCount: { type: Number, required: true },
  savingsTotals: { type: Object, required: true },
})

const emit = defineEmits(["navigate"])
const openCash = () => emit("navigate", "/assets/cash")
const openSavings = () => emit("navigate", "/assets/savings")
const openInvestments = () => emit("navigate", "/assets/investments")
</script>

<template>
  <section class="screen asset-dashboard">
    <article class="asset-dashboard-total">
      <span>총자산</span>
      <strong>{{ currency.format(combinedTotalAssets) }}</strong>
      <small>일반 계좌 + 예적금 + 투자</small>
    </article>

    <div class="asset-dashboard-grid">
      <article class="asset-dashboard-card" role="button" tabindex="0" @click="openCash" @keydown.enter="openCash">
        <div><span>일반 계좌</span><strong>{{ currency.format(generalAccountsTotal) }}</strong></div>
        <p>계좌 {{ generalAccountsCount }}개</p>
        <button type="button" @click.stop="openCash">관리하기</button>
      </article>

      <article class="asset-dashboard-card" role="button" tabindex="0" @click="openSavings" @keydown.enter="openSavings">
        <div><span>예적금</span><strong>{{ currency.format(savingsTotals.paidPrincipal) }}</strong></div>
        <p>예상 만기금액 {{ currency.format(savingsTotals.expectedMaturityAmount) }}</p>
        <p>상품 {{ savingsCount }}개</p>
        <button type="button" @click.stop="openSavings">관리하기</button>
      </article>

      <article class="asset-dashboard-card" role="button" tabindex="0" @click="openInvestments" @keydown.enter="openInvestments">
        <div><span>투자</span><strong>{{ currency.format(investmentTotals.principal) }}</strong></div>
        <p>현재 평가금액 {{ currency.format(investmentTotals.assetValue) }}</p>
        <p>평가손익 {{ currency.format(investmentTotals.profitLoss) }}</p>
        <button type="button" @click.stop="openInvestments">관리하기</button>
      </article>
    </div>
  </section>
</template>
