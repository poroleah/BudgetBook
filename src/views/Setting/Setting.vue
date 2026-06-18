<script setup>
const props = defineProps({
  books: { type: Array, required: true },
  settings: { type: Object, required: true },
})

const fontSizes = [
  { value: "small", label: "작게" },
  { value: "medium", label: "보통" },
  { value: "large", label: "크게" },
]

function escapeXml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;")
    .replaceAll(String.fromCharCode(39), "&apos;")
}

function worksheet(name, headers, rows) {
  const rowXml = [headers, ...rows]
    .map((row) => `<Row>${row.map((value) => `<Cell><Data ss:Type="String">${escapeXml(value)}</Data></Cell>`).join("")}</Row>`)
    .join("")
  return `<Worksheet ss:Name="${escapeXml(name)}"><Table>${rowXml}</Table></Worksheet>`
}

function downloadBackup() {
  const bookRows = props.books.map((book) => [
    book.settings?.bookName || "내 가계부",
    book.settings?.monthlyBudget || 0,
    book.settings?.theme || "light",
  ])
  const transactionRows = props.books.flatMap((book) =>
    (book.transactions || []).map((item) => [
      book.settings?.bookName || "내 가계부",
      item.date,
      item.type,
      item.category,
      item.subcategory,
      item.title,
      item.amount,
      item.paymentMethod,
    ]),
  )
  const assetRows = props.books.flatMap((book) =>
    (book.assets || []).map((item) => [
      book.settings?.bookName || "내 가계부",
      item.name,
      item.type,
      item.institution,
      item.balance,
    ]),
  )
  const workbook = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
  ${worksheet("가계부", ["가계부 이름", "월 예산", "테마"], bookRows)}
  ${worksheet("거래내역", ["가계부", "날짜", "유형", "카테고리", "하위 카테고리", "내용", "금액", "결제수단"], transactionRows)}
  ${worksheet("자산", ["가계부", "자산명", "유형", "금융기관", "잔액"], assetRows)}
</Workbook>`
  const blob = new Blob([workbook], { type: "application/vnd.ms-excel;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  const date = new Date().toISOString().slice(0, 10)
  link.href = url
  link.download = `돈구라미-백업-${date}.xls`
  link.click()
  URL.revokeObjectURL(url)
}
</script>

<template>
  <section class="screen settings-screen">
    <div class="settings-page-title"><h1>설정</h1></div>

    <section class="settings-group" aria-labelledby="preferences-title">
      <h2 id="preferences-title">환경설정</h2>
      <div class="settings-list">
        <div class="settings-list-row font-size-row">
          <span>글씨 크기</span>
          <div class="font-size-options" aria-label="글씨 크기">
            <button v-for="option in fontSizes" :key="option.value" type="button" :class="{ active: (settings.fontSize || 'medium') === option.value }" :aria-pressed="(settings.fontSize || 'medium') === option.value" @click="settings.fontSize = option.value">{{ option.label }}</button>
          </div>
        </div>
        <div class="settings-list-row">
          <span>알람 설정</span>
          <button class="toggle-button" type="button" aria-label="알람 설정" :aria-pressed="settings.notificationsEnabled" @click="settings.notificationsEnabled = !settings.notificationsEnabled"><span class="toggle-switch" aria-hidden="true"></span></button>
        </div>
        <div class="settings-list-row">
          <span>다크모드</span>
          <button class="toggle-button" type="button" aria-label="다크모드" :aria-pressed="settings.theme === 'dark'" @click="settings.theme = settings.theme === 'dark' ? 'light' : 'dark'"><span class="toggle-switch" aria-hidden="true"></span></button>
        </div>
      </div>
    </section>

    <section class="settings-group" aria-labelledby="backup-title">
      <h2 id="backup-title">데이터 백업</h2>
      <div class="settings-list">
        <button class="settings-action-row" type="button" @click="downloadBackup">
          <span><strong>엑셀 파일로 보내기</strong><small>가계부 데이터를 엑셀 파일로 저장해요</small></span>
          <span class="settings-chevron" aria-hidden="true"></span>
        </button>
      </div>
    </section>

    <section class="settings-group" aria-labelledby="more-title">
      <h2 id="more-title">더보기</h2>
      <div class="settings-list">
        <div class="settings-list-row"><span>앱 정보</span><span class="settings-row-value">돈구라미 1.0.0</span></div>
      </div>
    </section>
  </section>
</template>
