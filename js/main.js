// メインゲームループと初期化

// ゲーム変数
let canvas, ctx
let mode = 'place' // 'place', 'delete', 'levelup'
let selectedMachine = null
let isRunning = false
let machines = new Map()
let connections = new Map()
let items = []
let stats = { 
  cars: 0, 
  revenue: 0, 
  efficiency: 0, 
  itemsProcessing: 0,
  // リソース管理
  materials: 100,
  totalProduced: {
    tire: 0,
    engine: 0,
    body: 0,
    seat: 0
  },
  // 在庫管理
  inventory: {
    tire: 0,
    engine: 0,
    body: 0,
    seat: 0,
    pre_assembled: 0,
    assembled: 0
  }
}
let lastUpdateTime = 0
let animationTime = 0

// 初期化
function init() {
  canvas = document.getElementById('canvas')
  ctx = canvas.getContext('2d')
    
  if (!canvas || !ctx) {
    console.error('キャンバスまたはコンテキストの取得に失敗しました')
    return
  }
    
  // レスポンシブサイズ調整
  resizeCanvas()
    
  // イベント設定
  setupEvents()
    
  // 初期描画
  draw()
    
  console.log('ゲームが初期化されました')
}

// ゲームループ
function gameLoop() {
  if (!isRunning) {return}
    
  const now = Date.now()
  const deltaTime = now - lastUpdateTime
  lastUpdateTime = now
  animationTime += deltaTime
    
  try {
    // 機械の処理
    processMachines(now)
        
    // アイテムの移動
    moveItems(deltaTime)
        
    // 統計更新
    updateStats()
        
    // 描画
    draw()
  } catch (error) {
    console.error('ゲームループでエラーが発生しました:', error)
    isRunning = false
        
    // UI状態をリセット
    const btn = document.getElementById('startBtn')
    btn.textContent = '🚀 生産開始'
    btn.style.background = '#27ae60'
  }
    
  // 次フレーム
  requestAnimationFrame(gameLoop)
}

// エラーハンドリング
window.addEventListener('error', (event) => {
  console.error('グローバルエラー:', event.error)
    
  // 重要な状態をリセット
  if (isRunning) {
    isRunning = false
    const btn = document.getElementById('startBtn')
    if (btn) {
      btn.textContent = '🚀 生産開始'
      btn.style.background = '#27ae60'
    }
  }
})

// デバッグ情報（開発時のみ）
function getDebugInfo() {
  return {
    machines: machines.size,
    connections: connections.size,
    items: items.length,
    isRunning: isRunning,
    mode: mode,
    stats: stats
  }
}

// パフォーマンス監視
let frameCount = 0
let lastFpsUpdate = 0
let fps = 0

function updateFPS() {
  frameCount++
  const now = performance.now()
    
  if (now - lastFpsUpdate >= 1000) {
    fps = Math.round((frameCount * 1000) / (now - lastFpsUpdate))
    frameCount = 0
    lastFpsUpdate = now
        
    // FPSが低い場合の警告（開発時のみ）
    if (fps < 30 && isRunning) {
      console.warn(`FPS低下: ${fps}fps`)
    }
  }
}

// ページロード時の初期化
window.addEventListener('load', () => {
  try {
    init()
    console.log('自動車工場シミュレーションが正常に開始されました')
  } catch (error) {
    console.error('初期化に失敗しました:', error)
  }
})

// ページを離れる前の確認（プレイ中のみ）
window.addEventListener('beforeunload', (event) => {
  if (isRunning && (machines.size > 0 || stats.cars > 0)) {
    event.preventDefault()
    event.returnValue = 'ゲームが進行中です。本当にページを離れますか？'
    return event.returnValue
  }
})

// 開発者向けコンソールコマンド（デバッグ用）
if (typeof window !== 'undefined') {
  window.factoryGame = {
    getDebugInfo,
    addMoney: (amount) => {
      stats.revenue += amount
      updateStats()
      console.log(`¥${amount.toLocaleString()}を追加しました`)
    },
    addMaterials: (amount) => {
      stats.materials += amount
      updateStats()
      console.log(`原材料${amount}個を追加しました`)
    },
    clearAll: () => {
      clearAll()
      console.log('ゲームをリセットしました')
    },
    toggleProduction: () => {
      toggleProduction()
      console.log(`生産を${isRunning ? '開始' : '停止'}しました`)
    },
    getFPS: () => fps
  }
}