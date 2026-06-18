import { toDateKey } from '../composables/useCalendar'
import { defaultAssetTypes, defaultCategoryDetails } from '../data/defaultBook'

function investmentAccountBalance(account, transactions) {
  const accountTransactions = transactions.filter((transaction) => transaction.accountId === account.id)
  const latestValuation = [...accountTransactions]
    .filter((transaction) => transaction.type === 'valuation')
    .sort((a, b) => {
      const dateComparison = String(b.transactionDate || '').localeCompare(String(a.transactionDate || ''))
      return dateComparison || Number(b.createdAt || 0) - Number(a.createdAt || 0)
    })[0]

  if (latestValuation) return Number(latestValuation.amount) || 0

  return accountTransactions.reduce((balance, transaction) => {
    if (transaction.type === 'deposit') return balance + (Number(transaction.amount) || 0)
    if (transaction.type === 'withdrawal') return balance - (Number(transaction.amount) || 0)
    return balance
  }, 0)
}

const legacyDefaultAssets = [
  { id: 1, name: "생활비 통장", type: "은행", balance: 1450000 },
  { id: 2, name: "비상금", type: "저축", balance: 700000 },
  { id: 3, name: "이번 달 카드값", type: "대출", balance: -320000 },
]

function isLegacyDefaultAsset(asset) {
  return legacyDefaultAssets.some(
    (defaultAsset) =>
      asset.id === defaultAsset.id &&
      asset.name === defaultAsset.name &&
      asset.type === defaultAsset.type &&
      Number(asset.balance) === defaultAsset.balance,
  )
}

export function normalizeBook(book, initialState, today = new Date()) {
  const normalized = {
    ...structuredClone(initialState),
    ...book,
    id: book.id || `book-${Date.now()}`,
    transactions: Array.isArray(book.transactions) ? book.transactions : [],
    assets: Array.isArray(book.assets) ? book.assets : [],
    savingsAccounts: Array.isArray(book.savingsAccounts) ? book.savingsAccounts : [],
    savingPayments: Array.isArray(book.savingPayments) ? book.savingPayments : [],
    investmentAccounts: Array.isArray(book.investmentAccounts) ? book.investmentAccounts : [],
    investmentTransactions: Array.isArray(book.investmentTransactions) ? book.investmentTransactions : [],
    settings: {
      ...structuredClone(initialState.settings),
      ...book.settings,
      categoryDetails: {
        ...structuredClone(initialState.settings.categoryDetails),
        ...book.settings?.categoryDetails,
      },
    },
  }

  normalized.assets = normalized.assets.filter((asset) => !isLegacyDefaultAsset(asset))

  normalized.savingsAccounts = normalized.savingsAccounts.map((account) => ({
    ...account,
    savingsType: account.savingsType || "적금",
  }))

  const subscriptionAccounts = normalized.assets.filter((asset) =>
    asset.type === "청약통장" || asset.type === "저축",
  )
  subscriptionAccounts.forEach((asset) => {
    const alreadyMigrated = normalized.savingsAccounts.some(
      (account) => account.sourceGeneralAccountId === asset.id,
    )
    if (!alreadyMigrated) {
      const migratedAccountId = `saving-subscription-${asset.id}`
      normalized.savingsAccounts.push({
        id: migratedAccountId,
        savingsType: asset.type === "청약통장" ? "청약통장" : "적금",
        productName: asset.name,
        institution: asset.institution || "",
        startDate: asset.startDate || "",
        maturityDate: asset.maturityDate || "",
        monthlyAmount: 0,
        interestRate: 0,
        governmentContributionMode: "total",
        governmentContributionAmount: 0,
        sourceGeneralAccountId: asset.id,
        createdAt: asset.createdAt || Date.now(),
      })
      if ((Number(asset.balance) || 0) > 0) {
        normalized.savingPayments.push({
          id: `saving-payment-subscription-${asset.id}`,
          accountId: migratedAccountId,
          paymentDate: asset.startDate || toDateKey(asset.createdAt ? new Date(asset.createdAt) : today),
          amount: Number(asset.balance) || 0,
          transactionType: "transfer",
          createdAt: asset.createdAt || Date.now(),
        })
      }
    }
  })
  if (subscriptionAccounts.length) {
    const subscriptionIds = new Set(subscriptionAccounts.map((asset) => asset.id))
    normalized.assets = normalized.assets.filter((asset) => !subscriptionIds.has(asset.id))
  }

  const cmaAccounts = normalized.investmentAccounts.filter((account) => account.accountType === 'CMA')
  cmaAccounts.forEach((account) => {
    const alreadyMigrated = normalized.assets.some(
      (asset) => asset.sourceInvestmentAccountId === account.id,
    )
    if (!alreadyMigrated) {
      normalized.assets.push({
        id: `asset-cma-${account.id}`,
        name: account.accountName,
        type: 'CMA',
        balance: investmentAccountBalance(account, normalized.investmentTransactions),
        institution: account.institution || '',
        sourceInvestmentAccountId: account.id,
      })
    }
  })

  if (cmaAccounts.length) {
    const cmaAccountIds = new Set(cmaAccounts.map((account) => account.id))
    normalized.investmentAccounts = normalized.investmentAccounts.filter(
      (account) => !cmaAccountIds.has(account.id),
    )
    normalized.investmentTransactions = normalized.investmentTransactions.filter(
      (transaction) => !cmaAccountIds.has(transaction.accountId),
    )
  }

  Object.entries(defaultCategoryDetails).forEach(([category, details]) => {
    if (!normalized.settings.categories.includes(category)) {
      normalized.settings.categories.push(category)
    }
    normalized.settings.categoryDetails[category] = {
      ...details,
      ...normalized.settings.categoryDetails[category],
    }
  })

  normalized.assets.forEach((asset) => {
    if (asset.type === '은행' || asset.type === '체크카드') {
      asset.type = '입출금통장'
    }
    if (asset.type === '카드' || asset.type === '신용카드') {
      asset.type = '대출'
    }
  })

  normalized.settings.assetTypes = [...defaultAssetTypes]

  normalized.assets.forEach((asset) => {
    if (
      asset.type !== '대출' &&
      asset.type !== '투자' &&
      !defaultAssetTypes.includes(asset.type)
    ) {
      asset.type = '기타'
    }
  })

  if (!Array.isArray(normalized.settings.paymentMethods) || !normalized.settings.paymentMethods.length) {
    normalized.settings.paymentMethods = [...initialState.settings.paymentMethods]
  }

  if (normalized.settings.paymentMethods.includes('카드')) {
    normalized.settings.paymentMethods = normalized.settings.paymentMethods.flatMap((method) =>
      method === '카드' ? ['체크카드', '신용카드'] : method,
    )
  }

  normalized.settings.paymentMethods = [...new Set(normalized.settings.paymentMethods)]

  return normalized
}
