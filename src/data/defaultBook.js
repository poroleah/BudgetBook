import { pad, toDateKey } from '../composables/useCalendar'

export const defaultCategoryDetails = {
  식비: { type: 'expense', icon: '', subcategories: ['외식', '장보기', '간식'] },
  교통: { type: 'expense', icon: '', subcategories: ['버스', '지하철', '택시'] },
  주거: { type: 'expense', icon: '', subcategories: ['월세', '관리비', '수리'] },
  쇼핑: { type: 'expense', icon: '', subcategories: ['의류', '생활용품', '선물'] },
  월급: { type: 'income', icon: '', subcategories: ['기본급', '상여', '수당'] },
  이체: { type: 'transfer', icon: '', subcategories: ['계좌이체', '저축', '현금이동'] },
  기타: { type: 'expense', icon: '', subcategories: ['취미', '구독', '기타'] },
}

export const defaultAssetTypes = ['입출금통장', '파킹통장', 'CMA', '현금', '기타']


export function createInitialBook(today = new Date()) {
  return {
  id: 'book-default',
  transactions: [
    {
      id: 1,
      date: toDateKey(today),
      type: 'expense',
      category: '식비',
      subcategory: '외식',
      title: '외식',
      amount: 12000,
    },
    {
      id: 2,
      date: `${today.getFullYear()}-${pad(today.getMonth() + 1)}-05`,
      type: 'income',
      category: '월급',
      subcategory: '기본급',
      title: '기본급',
      amount: 2800000,
    },
    {
      id: 3,
      date: `${today.getFullYear()}-${pad(today.getMonth() + 1)}-09`,
      type: 'expense',
      category: '교통',
      subcategory: '버스',
      title: '버스',
      amount: 50000,
    },
  ],
  assets: [],
  savingsAccounts: [],
  savingPayments: [],
  investmentAccounts: [],
  investmentTransactions: [],
  settings: {
    bookName: '내 가계부',
    assetTypes: defaultAssetTypes,
    carryOverIncome: false,
    monthlyBudget: 1200000,
    paymentMethods: ['체크카드', '신용카드', '현금', '계좌이체', '기타'],
    theme: 'light',
    fontSize: 'medium',
    notificationsEnabled: false,
    weekStartsOn: 'sunday',
    categories: ['식비', '교통', '주거', '쇼핑', '월급', '이체', '기타'],
    categoryDetails: defaultCategoryDetails,
  },
}
}

export function createBook(initialState, id = `book-${Date.now()}`, bookName = '새 가계부') {
  return {
    ...structuredClone(initialState),
    id,
    transactions: [],
    assets: [],
    savingsAccounts: [],
    savingPayments: [],
    investmentAccounts: [],
    investmentTransactions: [],
    settings: {
      ...structuredClone(initialState.settings),
      bookName,
      monthlyBudget: 0,
    },
  }
}
