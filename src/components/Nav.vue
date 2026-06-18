<script setup>
import { ref } from 'vue'

defineProps({
  tabs: { type: Array, required: true },
  activeTab: { type: String, required: true },
  activeTabIndex: { type: Number, required: true },
})

const emit = defineEmits(["select-tab"])
const bouncingTab = ref('')

const tabIcons = {
  calendar: "/icons/Date.svg",
  analytics: "/icons/Analysis.svg",
  assets: "/icons/Asset.svg",
  settings: "/icons/Setting.svg",
}

function selectTab(tabId) {
  bouncingTab.value = ''
  requestAnimationFrame(() => {
    bouncingTab.value = tabId
  })
  window.setTimeout(() => {
    if (bouncingTab.value === tabId) bouncingTab.value = ''
  }, 420)
  emit('select-tab', tabId)
}
</script>

<template>
  <nav class="bottom-tabs" aria-label="가계부 메뉴">
    <button
      v-for="tab in tabs"
      :key="tab.id"
      type="button"
      :class="{ active: activeTab === tab.id, bouncing: bouncingTab === tab.id }"
      @click="selectTab(tab.id)"
    >
      <span
        class="bottom-tab-icon"
        :style="{ '--tab-icon': 'url(' + tabIcons[tab.id] + ')' }"
        aria-hidden="true"
      ></span>
      <span class="bottom-tab-label">{{ tab.label }}</span>
    </button>
  </nav>
</template>

<style scoped>
.bottom-tabs {
  position: fixed;
  left: 50%;
  bottom: 20px;
  z-index: 60;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0;
  width: min(353px, calc(100% - 40px));
  height: 57px;
  transform: translateX(-50%);
  overflow: hidden;
  border: 0 !important;
  border-radius: 40px;
  background: #fff !important;
  padding: 0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.25) !important;
  backdrop-filter: none;
  -webkit-backdrop-filter: none;
}

.bottom-tabs button {
  position: relative;
  display: grid;
  grid-template-rows: 24px 14px;
  place-content: center;
  gap: 1px;
  min-width: 0;
  min-height: 57px;
  border: 0;
  background: transparent !important;
  padding: 5px 0 3px;
  color: #212529 !important;
  font-family: "Nanum", sans-serif;
  transform: none !important;
}

.bottom-tab-icon {
  display: block;
  width: 24px;
  height: 24px;
  margin-inline: auto;
  background: currentColor;
  -webkit-mask: var(--tab-icon) center / contain no-repeat;
  mask: var(--tab-icon) center / contain no-repeat;
}

.bottom-tab-label {
  display: block;
  min-width: 26px;
  font-size: 12px;
  font-weight: 400;
  line-height: 14px;
  text-align: center;
}

.bottom-tabs button.active {
  color: #20c997 !important;
}

.bottom-tabs button.bouncing .bottom-tab-icon {
  animation: tab-icon-bounce 420ms cubic-bezier(0.22, 1, 0.36, 1);
}

.bottom-tabs button.bouncing .bottom-tab-label {
  animation: tab-label-bounce 420ms cubic-bezier(0.22, 1, 0.36, 1);
}

@keyframes tab-icon-bounce {
  0% { transform: translateY(0) scale(1); }
  28% { transform: translateY(1.5px) scale(0.91); }
  58% { transform: translateY(-2px) scale(1.07); }
  78% { transform: translateY(0.5px) scale(0.98); }
  100% { transform: translateY(0) scale(1); }
}

@keyframes tab-label-bounce {
  0%, 100% { transform: translateY(0); }
  32% { transform: translateY(1px); }
  62% { transform: translateY(-0.5px); }
}

@media (prefers-reduced-motion: reduce) {
  .bottom-tabs button.bouncing .bottom-tab-icon,
  .bottom-tabs button.bouncing .bottom-tab-label { animation: none; }
}

:global(.app-shell[data-theme="dark"]) .bottom-tabs {
  background: #1f242c !important;
}

:global(.app-shell[data-theme="dark"]) .bottom-tabs button {
  color: #f4f6f8 !important;
}

:global(.app-shell[data-theme="dark"]) .bottom-tabs button.active {
  color: #20c997 !important;
}
</style>
