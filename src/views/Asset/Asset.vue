<script setup>
defineProps({
  assetForm: {
    type: Object,
    required: true,
  },
  assetTypes: {
    type: Array,
    required: true,
  },
  assets: {
    type: Array,
    required: true,
  },
  currency: {
    type: Object,
    required: true,
  },
  netWorth: {
    type: Number,
    required: true,
  },
  paymentMethods: {
    type: Array,
    required: true,
  },
  totalAssets: {
    type: Number,
    required: true,
  },
  totalDebt: {
    type: Number,
    required: true,
  },
})

defineEmits(['add-asset', 'remove-asset', 'update-asset-balance'])
</script>

<template>
  <section class="screen assets-screen">
    <article class="asset-summary">
      <div>
        <span>총자산</span>
        <strong>{{ currency.format(totalAssets) }}</strong>
      </div>
      <div>
        <span>부채</span>
        <strong>{{ currency.format(totalDebt) }}</strong>
      </div>
      <div>
        <span>순자산</span>
        <strong>{{ currency.format(netWorth) }}</strong>
      </div>
    </article>

    <div class="asset-layout">
      <form class="side-panel entry-form" @submit.prevent="$emit('add-asset')">
        <div class="panel-heading">
          <p>Asset</p>
          <h2>자산 추가</h2>
        </div>
        <input v-model="assetForm.name" type="text" placeholder="자산 이름" />
        <div class="form-row">
          <select v-model="assetForm.type">
            <option v-for="type in assetTypes" :key="type" :value="type">{{ type }}</option>
          </select>
          <input v-model="assetForm.balance" type="number" placeholder="잔액" />
        </div>
        <button class="primary-button" type="submit">추가</button>
      </form>

      <div class="asset-list-panel">
        <section class="payment-method-panel">
          <div class="panel-heading">
            <p>Payment</p>
            <h2>결제수단 목록</h2>
          </div>
          <div class="payment-method-list">
            <span v-for="method in paymentMethods" :key="method" class="payment-method-chip">
              {{ method }}
            </span>
          </div>
        </section>

        <div class="asset-list">
          <article v-for="asset in assets" :key="asset.id" class="asset-card">
            <div>
              <span>{{ asset.type }}</span>
              <strong>{{ asset.name }}</strong>
            </div>
            <input
              :value="asset.balance"
              type="number"
              @input="$emit('update-asset-balance', asset.id, $event.target.value)"
            />
            <button type="button" @click="$emit('remove-asset', asset.id)">삭제</button>
          </article>
        </div>
      </div>
    </div>
  </section>
</template>
