import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

const assetPaths = ['/assets/analysis', '/assets/cash', '/assets/savings', '/assets/investments']

export function useNavigation(closeBookPage) {
  const initialAssetPath = assetPaths.includes(window.location.pathname) ? window.location.pathname : ''
  const assetRoute = ref(initialAssetPath)
  const activeTab = ref(initialAssetPath ? 'assets' : 'calendar')
  const tabs = [
    { id: 'calendar', label: '달력' },
    { id: 'analytics', label: '분석' },
    { id: 'assets', label: '자산' },
    { id: 'settings', label: '설정' },
  ]
  const activeTabIndex = computed(() => tabs.findIndex((tab) => tab.id === activeTab.value))

  function navigateAsset(path, replace = false) {
    const nextPath = assetPaths.includes(path) ? path : '/assets/analysis'
    assetRoute.value = nextPath
    activeTab.value = 'assets'
    closeBookPage()
    window.history[replace ? 'replaceState' : 'pushState']({}, '', nextPath)
  }

  function selectTab(tabId) {
    if (tabId === 'assets') {
      navigateAsset('/assets/analysis')
      return
    }
    activeTab.value = tabId
    assetRoute.value = ''
    closeBookPage()
    if (window.location.pathname.startsWith('/assets/')) {
      window.history.pushState({}, '', '/')
    }
  }

  function syncRouteFromLocation() {
    if (assetPaths.includes(window.location.pathname)) {
      assetRoute.value = window.location.pathname
      activeTab.value = 'assets'
    } else {
      assetRoute.value = ''
      if (activeTab.value === 'assets') activeTab.value = 'calendar'
    }
  }

  onMounted(() => {
    window.addEventListener('popstate', syncRouteFromLocation)
    if (activeTab.value === 'assets' && !assetRoute.value) navigateAsset('/assets/analysis', true)
  })

  onBeforeUnmount(() => window.removeEventListener('popstate', syncRouteFromLocation))

  return { activeTab, activeTabIndex, assetRoute, navigateAsset, selectTab, tabs }
}
