import { computed } from 'vue'

export function useGeneralAccounts(state, savingsTotals, investmentTotals) {
  const generalAccounts = computed(() =>
    state.assets.filter((asset) => asset.type !== '대출' && asset.type !== '투자'),
  )
  const generalAccountsTotal = computed(() =>
    generalAccounts.value.reduce((sum, asset) => sum + (Number(asset.balance) || 0), 0),
  )
  const combinedTotalAssets = computed(() =>
    generalAccountsTotal.value + savingsTotals.value.paidPrincipal + investmentTotals.value.assetValue,
  )

  function addGeneralAccount(form) {
    const name = form.name?.trim()
    if (!name || form.balance === '') return
    const accountType = form.type || '입출금통장'
    if (!state.settings.assetTypes.includes(accountType)) state.settings.assetTypes.push(accountType)
    state.assets.push({
      id: typeof crypto !== 'undefined' && crypto.randomUUID
        ? 'asset-' + crypto.randomUUID()
        : 'asset-' + Date.now(),
      name,
      institution: form.institution?.trim() || '',
      type: accountType,
      balance: Number(form.balance) || 0,
    })
  }

  function updateGeneralAccount(form) {
    const account = state.assets.find((asset) => asset.id === form.id)
    if (!account || !form.name?.trim() || form.balance === '') return
    account.name = form.name.trim()
    account.institution = form.institution?.trim() || ''
    account.type = form.type || '입출금통장'
    account.balance = Number(form.balance) || 0
  }

  function removeGeneralAccount(id) {
    state.assets = state.assets.filter((asset) => asset.id !== id)
  }

  return {
    addGeneralAccount,
    combinedTotalAssets,
    generalAccounts,
    generalAccountsTotal,
    removeGeneralAccount,
    updateGeneralAccount,
  }
}
