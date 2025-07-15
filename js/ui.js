// 格納ボックスの在庫表示
function drawStorageInventory(machine, x, y) {
  if (machine.type !== 'storage_box' || !machine.storage) {return}
    
  const storage = machine.storage
  const totalItems = Object.values(storage).reduce((sum, count) => sum + count, 0)
    
  if (totalItems > 0) {
    const bounce = Math.sin(animationTime * 0.005) * 2
        
    // 総在庫数表示
    ctx.fillStyle = '#3498db'
    ctx.fillRect(x + GRID_SIZE - 12, y + 2 + bounce, 10, 10)
    ctx.fillStyle = 'white'
    ctx.font = '8px Arial'
    ctx.textAlign = 'center'
    ctx.fillText(totalItems, x + GRID_SIZE - 7, y + 9 + bounce)
        
    // クリック可能であることを示すカーソルアイコン
    ctx.fillStyle = 'rgba(52, 152, 219, 0.3)'
    ctx.fillRect(x + 2, y + GRID_SIZE - 8, GRID_SIZE - 4, 6)
    ctx.fillStyle = '#3498db'
    ctx.font = '6px Arial'
    ctx.textAlign = 'center'
    ctx.fillText('クリックで詳細', x + GRID_SIZE/2, y + GRID_SIZE - 4)
  }
}// UI処理と描画

// ヘルパー関数：Hexカラーをrgbに変換
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : {r: 255, g: 255, b: 255}
}

// キャンバスサイズ調整
function resizeCanvas() {
  const container = document.getElementById('container')
  const sidebar = document.getElementById('sidebar')
    
  const availableWidth = window.innerWidth - sidebar.offsetWidth
  const availableHeight = container.offsetHeight // ヘッダー分を引いた高さ
    
  // アスペクト比を保持しつつ、利用可能なスペースに合わせる
  const targetRatio = 4/3 // 800:600の比率
  let canvasWidth, canvasHeight
    
  if (availableWidth / availableHeight > targetRatio) {
    // 高さ基準でサイズ決定
    canvasHeight = Math.min(availableHeight - 20, 600)
    canvasWidth = canvasHeight * targetRatio
  } else {
    // 幅基準でサイズ決定
    canvasWidth = Math.min(availableWidth - 20, 800)
    canvasHeight = canvasWidth / targetRatio
  }
    
  // キャンバスの内部解像度は固定
  canvas.width = 800
  canvas.height = 600
    
  // 表示サイズをレスポンシブに
  canvas.style.width = canvasWidth + 'px'
  canvas.style.height = canvasHeight + 'px'
}

// イベント設定
function setupEvents() {
  // キャンバスクリック（左クリック）
  canvas.addEventListener('click', handleCanvasClick)
    
  // キャンバス右クリック（回転）
  canvas.addEventListener('contextmenu', handleCanvasRightClick)
    
  // ウィンドウリサイズ
  window.addEventListener('resize', () => {
    resizeCanvas()
    draw()
  })
    
  // 機械選択ボタン
  document.querySelectorAll('[data-machine]').forEach(btn => {
    btn.addEventListener('click', () => {
      mode = 'place'
      // 前の選択を解除
      document.querySelectorAll('.btn').forEach(b => b.classList.remove('active'))
      // 新しい選択
      btn.classList.add('active')
      selectedMachine = btn.dataset.machine
    })
  })
    
  // 削除ボタン
  document.getElementById('deleteBtn').addEventListener('click', () => {
    mode = 'delete'
    selectedMachine = null
    document.querySelectorAll('.btn').forEach(b => b.classList.remove('active'))
    document.getElementById('deleteBtn').classList.add('active')
  })
    
  // レベルアップボタン
  document.getElementById('levelupBtn').addEventListener('click', () => {
    mode = 'levelup'
    selectedMachine = null
    document.querySelectorAll('.btn').forEach(b => b.classList.remove('active'))
    document.getElementById('levelupBtn').classList.add('active')
  })
    
  // レシピボタン
  document.getElementById('recipeBtn').addEventListener('click', () => {
    document.getElementById('recipeModal').style.display = 'block'
  })
    
  // 制御ボタン
  document.getElementById('startBtn').addEventListener('click', toggleProduction)
  document.getElementById('clearBtn').addEventListener('click', clearAll)
  document.getElementById('buyMaterialsBtn').addEventListener('click', buyMaterials)
    
  // 格納ボックスモーダル関連
  document.getElementById('closeStorageModal').addEventListener('click', closeStorageModal)
  document.getElementById('closeRecipeModal').addEventListener('click', closeRecipeModal)
    
  // モーダル背景クリックで閉じる
  document.getElementById('storageModal').addEventListener('click', (e) => {
    if (e.target.id === 'storageModal') {
      closeStorageModal()
    }
  })
    
  document.getElementById('recipeModal').addEventListener('click', (e) => {
    if (e.target.id === 'recipeModal') {
      closeRecipeModal()
    }
  })
    
  // ESCキーでモーダルを閉じる
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeStorageModal()
      closeRecipeModal()
    }
  })
}

// キャンバス右クリック処理（回転）
function handleCanvasRightClick(e) {
  e.preventDefault()
    
  const rect = canvas.getBoundingClientRect()
  const scaleX = canvas.width / rect.width
  const scaleY = canvas.height / rect.height
    
  const x = (e.clientX - rect.left) * scaleX
  const y = (e.clientY - rect.top) * scaleY
    
  if (x < 0 || y < 0 || x >= canvas.width || y >= canvas.height) {
    return
  }
    
  const gridX = Math.floor(x / GRID_SIZE)
  const gridY = Math.floor(y / GRID_SIZE)
  const key = `${gridX}-${gridY}`
    
  const machine = machines.get(key)
  if (machine) {
    // 接続をクリア（回転後に再接続）
    connections.delete(key)
    for (const [from, targets] of connections) {
      const index = targets.indexOf(key)
      if (index > -1) {
        targets.splice(index, 1)
      }
    }
        
    // 回転
    machine.rotation = (machine.rotation + 1) % 4
        
    // 再接続
    createAutoConnections(gridX, gridY)
        
    draw()
  }
}

// 材料購入
function buyMaterials() {
  const cost = 50000
  if (stats.revenue >= cost) {
    stats.revenue -= cost
    stats.materials += 100
    updateStats()
  }
}

// キャンバスクリック処理
function handleCanvasClick(e) {
  e.preventDefault()
    
  const rect = canvas.getBoundingClientRect()
  const scaleX = canvas.width / rect.width
  const scaleY = canvas.height / rect.height
    
  const x = (e.clientX - rect.left) * scaleX
  const y = (e.clientY - rect.top) * scaleY
    
  // グリッド境界内かチェック
  if (x < 0 || y < 0 || x >= canvas.width || y >= canvas.height) {
    return
  }
    
  const gridX = Math.floor(x / GRID_SIZE)
  const gridY = Math.floor(y / GRID_SIZE)
  const key = `${gridX}-${gridY}`
    
  // まず機械をクリックしたかチェック（格納ボックスの場合）
  const clickedMachine = machines.get(key)
  if (clickedMachine && clickedMachine.type === 'storage_box' && mode !== 'delete' && mode !== 'levelup') {
    // 格納ボックスをクリックした場合、在庫表示
    showStorageInventory(clickedMachine)
    return
  }
    
  if (mode === 'place') {
    if (selectedMachine && !machines.has(key)) {
      const newMachine = {
        type: selectedMachine,
        x: gridX,
        y: gridY,
        inventory: [],
        lastProduced: 0,
        processing: false,
        processStart: 0,
        rotation: 0, // 回転状態（0-3: 0°, 90°, 180°, 270°）
        level: 1 // 初期レベル
      }
            
      // 格納ボックスの場合は個別在庫を初期化
      if (selectedMachine === 'storage_box') {
        newMachine.storage = {}
      }
            
      machines.set(key, newMachine)
            
      // 隣接する機械と自動接続
      createAutoConnections(gridX, gridY)
    }
  } else if (mode === 'delete') {
    if (machines.has(key)) {
      machines.delete(key)
      // 関連する接続も削除
      connections.delete(key)
      for (const [from, targets] of connections) {
        const index = targets.indexOf(key)
        if (index > -1) {
          targets.splice(index, 1)
        }
      }
    }
  } else if (mode === 'levelup') {
    const machine = machines.get(key)
    if (machine && machine.level === 1 && stats.revenue >= LEVELUP_COST) {
      // レベルアップ実行
      stats.revenue -= LEVELUP_COST
      machine.level = 2
      updateStats()
            
      // レベルアップエフェクト用の一時的なプロパティ
      machine.levelUpEffect = Date.now()
    }
  }
    
  draw()
}

// 全クリア
function clearAll() {
  machines.clear()
  connections.clear()
  items = []
  stats = { 
    cars: 0, 
    revenue: 0, 
    efficiency: 0, 
    itemsProcessing: 0,
    materials: 100,
    rotation: 0,
    materials: 100,
    totalProduced: {
      tire: 0,
      engine: 0,
      body: 0,
      seat: 0,
      standard_cars: 0,
      luxury_cars: 0
    }
  }
  updateStats()
  draw()
}

// 生産開始/停止
function toggleProduction() {
  isRunning = !isRunning
  const btn = document.getElementById('startBtn')
    
  if (isRunning) {
    btn.textContent = '⏹️ 生産停止'
    btn.style.background = '#e74c3c'
    lastUpdateTime = Date.now()
    animationTime = 0
    gameLoop()
  } else {
    btn.textContent = '🚀 生産開始'
    btn.style.background = '#27ae60'
  }
}

// 統計更新
function updateStats() {
  stats.itemsProcessing = items.length
    
  // 効率計算（稼働中の機械の割合）
  let activeMachines = 0
  let totalMachines = 0
    
  for (const [key, machine] of machines) {
    if (machine.type !== 'conveyor') {
      totalMachines++
      if (machine.processing || machine.inventory.length > 0) {
        activeMachines++
      }
    }
  }
    
  stats.efficiency = totalMachines > 0 ? Math.round((activeMachines / totalMachines) * 100) : 0
    
  // UI更新
  document.getElementById('cars').textContent = stats.cars
  document.getElementById('revenue').textContent = `¥${stats.revenue.toLocaleString()}`
  document.getElementById('efficiency').textContent = `${stats.efficiency}%`
  document.getElementById('items').textContent = stats.itemsProcessing
    
  // 車種別統計更新
  document.getElementById('standardCars').textContent = stats.totalProduced.standard_cars || 0
  document.getElementById('luxuryCars').textContent = stats.totalProduced.luxury_cars || 0
    
  // リソース更新
  const materialsElement = document.getElementById('materials')
  materialsElement.textContent = stats.materials
  materialsElement.className = stats.materials < 10 ? 'stat-value warning' : 'stat-value'
}

// 格納ボックス在庫表示
function showStorageInventory(machine) {
  console.log('格納ボックスクリック:', machine) // デバッグ用
    
  const modal = document.getElementById('storageModal')
  const inventoryDiv = document.getElementById('storageInventory')
    
  if (!modal || !inventoryDiv) {
    console.error('モーダル要素が見つかりません')
    return
  }
    
  // アイテムの絵文字と名前
  const itemInfo = {
    tire: { emoji: '🛞', name: 'タイヤ' },
    engine: { emoji: '🔧', name: 'エンジン' },
    body: { emoji: '🚗', name: 'ボディ' },
    seat: { emoji: '🪑', name: 'シート' },
    pre_assembled: { emoji: '⚙️', name: '部品組立品' },
    assembled: { emoji: '🚙', name: '組立済み車' },
    leather: { emoji: '🐄', name: '革材料' },
    luxury_engine: { emoji: '💎', name: '高級エンジン' },
    luxury_body: { emoji: '✨', name: '高級ボディ' },
    leather_seat: { emoji: '👑', name: 'レザーシート' },
    premium_interior: { emoji: '🎭', name: 'プレミアム内装' },
    luxury_assembled: { emoji: '🏆', name: '高級車組立品' }
  }
    
  // 在庫内容を表示
  let inventoryHTML = ''
  const storage = machine.storage || {}
    
  console.log('格納ボックス在庫:', storage) // デバッグ用
    
  // 在庫がある場合
  const hasItems = Object.keys(storage).length > 0 && Object.values(storage).some(count => count > 0)
    
  if (hasItems) {
    Object.entries(storage).forEach(([itemType, count]) => {
      const info = itemInfo[itemType]
      if (info && count > 0) {
        inventoryHTML += `
                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px; margin: 5px 0; background: rgba(255,255,255,0.1); border-radius: 5px;">
                        <span style="font-size: 16px;">${info.emoji} ${info.name}</span>
                        <span style="font-weight: bold; color: #2ecc71; font-size: 18px;">${count}</span>
                    </div>
                `
      }
    })
  }
    
  if (!inventoryHTML) {
    inventoryHTML = `
            <div style="text-align: center; padding: 20px; color: #bdc3c7;">
                <span style="font-size: 24px;">📦</span><br>
                <p style="margin: 10px 0;">この格納ボックスは空です</p>
                <p style="font-size: 12px; color: #7f8c8d;">部品を接続して格納してください</p>
            </div>
        `
  }
    
  inventoryDiv.innerHTML = inventoryHTML
  modal.style.display = 'block'
}

// 格納ボックスモーダルを閉じる
function closeStorageModal() {
  document.getElementById('storageModal').style.display = 'none'
}

// レシピモーダルを閉じる
function closeRecipeModal() {
  document.getElementById('recipeModal').style.display = 'none'
}

// 描画
function draw() {
  if (!ctx) {return}
    
  // 背景クリア
  ctx.clearRect(0, 0, canvas.width, canvas.height)
    
  // グリッド描画
  drawGrid()
    
  // 接続線描画
  drawConnections()
    
  // 機械描画
  drawMachines()
    
  // アイテム描画
  drawItems(ctx, animationTime)
    
  // ステータス表示
  drawStatus()
}

// グリッド描画
function drawGrid() {
  ctx.strokeStyle = '#4a5f7a'
  ctx.lineWidth = 1
  for (let x = 0; x <= canvas.width; x += GRID_SIZE) {
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, canvas.height)
    ctx.stroke()
  }
  for (let y = 0; y <= canvas.height; y += GRID_SIZE) {
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(canvas.width, y)
    ctx.stroke()
  }
}

// 接続線描画
function drawConnections() {
  ctx.strokeStyle = '#f39c12'
  ctx.lineWidth = 3
  for (const [from, targets] of connections) {
    const fromMachine = machines.get(from)
    if (fromMachine) {
      const fromX = fromMachine.x * GRID_SIZE + GRID_SIZE / 2
      const fromY = fromMachine.y * GRID_SIZE + GRID_SIZE / 2
            
      targets.forEach(to => {
        const toMachine = machines.get(to)
        if (toMachine) {
          const toX = toMachine.x * GRID_SIZE + GRID_SIZE / 2
          const toY = toMachine.y * GRID_SIZE + GRID_SIZE / 2
                    
          // 接続線
          ctx.beginPath()
          ctx.moveTo(fromX, fromY)
          ctx.lineTo(toX, toY)
          ctx.stroke()
                    
          // より明確な矢印（一方向性を強調）
          const angle = Math.atan2(toY - fromY, toX - fromX)
          const arrowX = toX - Math.cos(angle) * 15
          const arrowY = toY - Math.sin(angle) * 15
                    
          // 矢印の頭
          ctx.fillStyle = '#f39c12'
          ctx.beginPath()
          ctx.moveTo(toX, toY)
          ctx.lineTo(arrowX - Math.cos(angle - Math.PI/6) * 8, arrowY - Math.sin(angle - Math.PI/6) * 8)
          ctx.lineTo(arrowX - Math.cos(angle + Math.PI/6) * 8, arrowY - Math.sin(angle + Math.PI/6) * 8)
          ctx.closePath()
          ctx.fill()
        }
      })
    }
  }
}

// 機械描画
function drawMachines() {
  for (const [key, machine] of machines) {
    drawSingleMachine(machine)
  }
}

// 単一機械の描画
function drawSingleMachine(machine) {
  const machineType = machineTypes[machine.type]
  const x = machine.x * GRID_SIZE
  const y = machine.y * GRID_SIZE
    
  // 機械のアニメーション効果
  let scaleOffset = 0
  let colorIntensity = 1
    
  // レベルアップエフェクト
  const isLevelingUp = machine.levelUpEffect && (Date.now() - machine.levelUpEffect < 1000)
    
  if (machine.processing) {
    // 処理中の機械は脈動効果
    const pulseSpeed = 3
    scaleOffset = Math.sin(animationTime * pulseSpeed / 1000) * 1
    colorIntensity = 0.8 + Math.sin(animationTime * pulseSpeed / 1000) * 0.2
  } else if (machine.inventory.length > 0) {
    // 在庫がある機械は軽く光る
    colorIntensity = 0.9 + Math.sin(animationTime * 2 / 1000) * 0.1
  }
    
  if (isLevelingUp) {
    // レベルアップ時の特別エフェクト
    scaleOffset += Math.sin(animationTime * 0.01) * 3
    colorIntensity = 1.2
  }
    
  // 機械背景（アニメーション付き）
  const margin = 3
  const bgX = x + margin - scaleOffset
  const bgY = y + margin - scaleOffset
  const bgSize = GRID_SIZE - margin * 2 + scaleOffset * 2
    
  // 色の調整（レベル2は金色のハイライト）
  let baseColor = machineType.color
  if (machine.level >= 2) {
    // レベル2の機械は金色の縁取り
    ctx.fillStyle = '#f1c40f'
    ctx.fillRect(bgX - 2, bgY - 2, bgSize + 4, bgSize + 4)
  }
    
  if (machine.processing) {
    // 処理中は少し明るく
    ctx.fillStyle = `rgba(231, 76, 60, ${colorIntensity})`
  } else {
    // 通常色にアルファ調整
    const rgb = hexToRgb(baseColor)
    ctx.fillStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${colorIntensity})`
  }
    
  ctx.fillRect(bgX, bgY, bgSize, bgSize)
    
  // レベルアップエフェクト
  if (isLevelingUp) {
    for (let i = 0; i < 5; i++) {
      const sparkX = x + GRID_SIZE/2 + (Math.random() - 0.5) * 30
      const sparkY = y + GRID_SIZE/2 + (Math.random() - 0.5) * 30
      const sparkSize = Math.random() * 4
            
      ctx.fillStyle = `rgba(241, 196, 15, ${Math.random()})`
      ctx.fillRect(sparkX, sparkY, sparkSize, sparkSize)
    }
  }
    
  // 処理中の機械にスパーク効果
  if (machine.processing) {
    for (let i = 0; i < 3; i++) {
      const sparkX = x + GRID_SIZE/2 + (Math.random() - 0.5) * 20
      const sparkY = y + GRID_SIZE/2 + (Math.random() - 0.5) * 20
      const sparkSize = Math.random() * 3
            
      ctx.fillStyle = `rgba(255, 255, 255, ${Math.random()})`
      ctx.fillRect(sparkX, sparkY, sparkSize, sparkSize)
    }
  }
    
  // 枠線
  ctx.strokeStyle = '#333'
  ctx.lineWidth = 2
  if (machine.processing) {
    ctx.strokeStyle = '#fff'
    ctx.lineWidth = 3
  }
  ctx.strokeRect(bgX, bgY, bgSize, bgSize)
    
  // 絵文字（回転効果付き）
  drawMachineEmoji(machine, x, y)
    
  // レベル表示（レベル2以上の機械）
  if (machine.level >= 2) {
    drawLevelIndicator(machine, x, y)
  }
    
  // 在庫表示
  drawInventoryIndicator(machine, x, y, machineType)
    
  // 格納ボックスの場合は専用の在庫表示
  if (machine.type === 'storage_box') {
    drawStorageInventory(machine, x, y)
  }
    
  // 入出力ポート表示
  drawPorts(machine, x, y, machineType)
    
  // 進捗バー（処理中の機械）
  if (machine.processing) {
    drawProgressBar(machine, x, y)
  }
}

// 機械絵文字描画
function drawMachineEmoji(machine, x, y) {
  const machineType = machineTypes[machine.type]
    
  ctx.save()
  ctx.translate(x + GRID_SIZE/2, y + GRID_SIZE/2)
    
  // 機械の回転を適用
  if (machine.rotation > 0) {
    ctx.rotate(machine.rotation * Math.PI / 2)
  }
    
  if (machine.processing && ['press', 'welder', 'painter', 'tire_press', 'engine_press', 'body_press', 'tire_maker', 'engine_maker', 'body_maker', 'seat_maker'].includes(machine.type)) {
    // 処理中の機械は追加回転
    ctx.rotate(animationTime * 0.01)
  }
    
  ctx.font = '18px Arial'
  ctx.textAlign = 'center'
  ctx.fillStyle = 'white'
  ctx.fillText(machineType.emoji, 0, 6)
  ctx.restore()
}

// レベル表示
function drawLevelIndicator(machine, x, y) {
  ctx.fillStyle = '#f1c40f'
  ctx.fillRect(x + 2, y + 2, 12, 12)
  ctx.strokeStyle = '#f39c12'
  ctx.lineWidth = 1
  ctx.strokeRect(x + 2, y + 2, 12, 12)
    
  ctx.fillStyle = 'white'
  ctx.font = 'bold 8px Arial'
  ctx.textAlign = 'center'
  ctx.fillText(machine.level, x + 8, y + 10)
}

// 在庫表示
function drawInventoryIndicator(machine, x, y, machineType) {
  if (machine.inventory.length > 0) {
    const bounce = Math.sin(animationTime * 0.005) * 2
        
    // 複数種類の在庫がある場合は色分け表示
    if (machineType.requiresAll) {
      const inventoryTypes = [...new Set(machine.inventory.map(item => item.type))]
      inventoryTypes.forEach((type, index) => {
        const count = machine.inventory.filter(item => item.type === type).length
        const colors = {
          tire: '#34495e',
          engine: '#e74c3c',
          body: '#1abc9c',
          seat: '#8e44ad',
          pre_assembled: '#3498db'
        }
                
        ctx.fillStyle = colors[type] || '#e74c3c'
        ctx.fillRect(x + GRID_SIZE - 15 - (index * 8), y + 2 + bounce, 6, 8)
        ctx.fillStyle = 'white'
        ctx.font = '6px Arial'
        ctx.fillText(count, x + GRID_SIZE - 12 - (index * 8), y + 8 + bounce)
      })
    } else {
      // 通常の在庫表示
      ctx.fillStyle = '#e74c3c'
      ctx.fillRect(x + GRID_SIZE - 12, y + 2 + bounce, 10, 10)
      ctx.fillStyle = 'white'
      ctx.font = '8px Arial'
      ctx.fillText(machine.inventory.length, x + GRID_SIZE - 7, y + 9 + bounce)
    }
  }
}

// ポート表示
function drawPorts(machine, x, y, machineType) {
  // 入力ポート表示
  if (machineType.inputPorts) {
    machineType.inputPorts.forEach(originalPort => {
      // コンベアの場合は回転に関係なく全方向に入力ポート表示
      if (machine.type === 'conveyor') {
        const portX = x + (originalPort.dx + 1) * GRID_SIZE / 2
        const portY = y + (originalPort.dy + 1) * GRID_SIZE / 2
                
        ctx.fillStyle = '#3498db'
        ctx.fillRect(portX - 3, portY - 3, 6, 6)
        ctx.strokeStyle = '#2980b9'
        ctx.lineWidth = 1
        ctx.strokeRect(portX - 3, portY - 3, 6, 6)
      } else {
        // その他の機械は通常の回転適用
        const port = rotatePort(originalPort, machine.rotation)
        const portX = x + (port.dx + 1) * GRID_SIZE / 2
        const portY = y + (port.dy + 1) * GRID_SIZE / 2
                
        ctx.fillStyle = '#3498db'
        ctx.fillRect(portX - 4, portY - 4, 8, 8)
        ctx.strokeStyle = '#2980b9'
        ctx.lineWidth = 2
        ctx.strokeRect(portX - 4, portY - 4, 8, 8)
      }
    })
  }
    
  // 出力ポート表示
  if (machineType.outputPorts) {
    machineType.outputPorts.forEach(originalPort => {
      const port = rotatePort(originalPort, machine.rotation)
      const portX = x + (port.dx + 1) * GRID_SIZE / 2
      const portY = y + (port.dy + 1) * GRID_SIZE / 2
            
      ctx.fillStyle = '#e74c3c'
      ctx.fillRect(portX - 4, portY - 4, 8, 8)
      ctx.strokeStyle = '#c0392b'
      ctx.lineWidth = 2
      ctx.strokeRect(portX - 4, portY - 4, 8, 8)
            
      // 出力方向を示す矢印（回転対応）
      ctx.save()
      ctx.translate(portX, portY)
      ctx.rotate(Math.atan2(port.dy, port.dx))
      ctx.fillStyle = '#fff'
      ctx.font = '10px Arial'
      ctx.textAlign = 'center'
      ctx.fillText('▶', 0, 3)
      ctx.restore()
    })
  }
}

// 進捗バー描画
function drawProgressBar(machine, x, y) {
  const processTime = getProcessTime(machine)
  const progress = Math.min((Date.now() - machine.processStart) / processTime, 1)
  const barWidth = GRID_SIZE - 8
  const barHeight = 4
  const barX = x + 4
  const barY = y + GRID_SIZE - 8
    
  // 背景
  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
  ctx.fillRect(barX, barY, barWidth, barHeight)
    
  // 進捗（レベル2は金色）
  ctx.fillStyle = machine.level >= 2 ? '#f1c40f' : '#2ecc71'
  ctx.fillRect(barX, barY, barWidth * progress, barHeight)
}

// ステータス表示
function drawStatus() {
  // 運転状態表示
  if (isRunning) {
    ctx.fillStyle = 'rgba(46, 204, 113, 0.8)'
    ctx.fillRect(canvas.width - 100, 10, 90, 25)
    ctx.fillStyle = 'white'
    ctx.font = '14px Arial'
    ctx.textAlign = 'center'
    ctx.fillText('🏃 運転中', canvas.width - 55, 27)
  }
    
  // モード表示
  if (mode === 'levelup') {
    ctx.fillStyle = 'rgba(243, 156, 18, 0.8)'
    ctx.fillRect(canvas.width - 120, 40, 110, 25)
    ctx.fillStyle = 'white'
    ctx.font = '14px Arial'
    ctx.textAlign = 'center'
    ctx.fillText('⭐ レベルアップ', canvas.width - 65, 57)
  }
}