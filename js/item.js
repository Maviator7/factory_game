// アイテム処理

const ITEM_SPEED = 2

// アイテムの色定義
const itemColors = {
  material: '#8e44ad',
  // 基本加工品
  pressed: '#e74c3c',
  welded: '#f39c12',
  painted: '#9b59b6',
  // パーツ加工品
  tire_pressed: '#2c3e50',
  engine_pressed: '#c0392b',
  body_pressed: '#16a085',
  // 完成パーツ
  tire: '#34495e',
  engine: '#e74c3c',
  body: '#1abc9c',
  seat: '#8e44ad',
  // 高級車パーツ
  leather: '#8b4513',
  luxury_engine: '#e74c3c',
  luxury_body: '#1abc9c',
  leather_seat: '#8e44ad',
  premium_interior: '#9b59b6',
  // 組立品
  pre_assembled: '#3498db',
  assembled: '#27ae60',
  luxury_assembled: '#f1c40f',
  finished: '#2ecc71'
}

// アイテムの絵文字定義
const itemEmojis = {
  material: '🔸',
  // 基本加工品
  pressed: '🔶',
  welded: '⚡',
  painted: '🎨',
  // パーツ加工品
  tire_pressed: '🔵',
  engine_pressed: '🔴',
  body_pressed: '🟢',
  // 完成パーツ
  tire: '🛞',
  engine: '🔧',
  body: '🚗',
  seat: '🪑',
  // 高級車パーツ
  leather: '🐄',
  luxury_engine: '💎',
  luxury_body: '✨',
  leather_seat: '👑',
  premium_interior: '🎭',
  // 組立品
  pre_assembled: '⚙️',
  assembled: '🚙',
  luxury_assembled: '🏆',
  finished: '✨'
}

// アイテム作成
function createItem(fromX, fromY, toX, toY, type) {
  const startX = fromX * GRID_SIZE + GRID_SIZE / 2
  const startY = fromY * GRID_SIZE + GRID_SIZE / 2
  const endX = toX * GRID_SIZE + GRID_SIZE / 2
  const endY = toY * GRID_SIZE + GRID_SIZE / 2
    
  const distance = Math.sqrt((endX - startX) ** 2 + (endY - startY) ** 2)
  const duration = Math.max(800, distance * 2) // より自然な移動時間
    
  items.push({
    x: startX,
    y: startY,
    startX: startX,
    startY: startY,
    targetX: endX,
    targetY: endY,
    targetKey: `${toX}-${toY}`,
    type: type,
    startTime: Date.now(),
    duration: duration,
    active: true,
    scale: 1.0,
    rotation: 0
  })
}

// アイテム移動
function moveItems(deltaTime) {
  const now = Date.now()
    
  items.forEach((item, index) => {
    if (!item.active) {return}
        
    const elapsed = now - item.startTime
    const progress = Math.min(elapsed / item.duration, 1)
        
    // スムーズな位置更新
    const easeProgress = 1 - Math.pow(1 - progress, 3) // easeOut効果
    item.x = item.startX + (item.targetX - item.startX) * easeProgress
    item.y = item.startY + (item.targetY - item.startY) * easeProgress
        
    // 到達判定
    if (progress >= 1) {
      const targetMachine = machines.get(item.targetKey)
            
      // 目標機械が存在し、アイテムを受け入れ可能かチェック
      if (targetMachine && canAcceptItem(targetMachine, item.type)) {
        item.active = false
                
        if (targetMachine.type === 'conveyor') {
          // コンベアは即座に次に送る
          if (connections.has(item.targetKey)) {
            const targets = connections.get(item.targetKey)
            targets.forEach(nextKey => {
              const nextMachine = machines.get(nextKey)
              if (nextMachine && canAcceptItem(nextMachine, item.type)) {
                createItem(targetMachine.x, targetMachine.y, nextMachine.x, nextMachine.y, item.type)
              }
            })
          }
        } else if (targetMachine.type === 'storage_box') {
          // 格納ボックスは在庫に追加
          const storableItems = ['tire', 'engine', 'body', 'seat', 'pre_assembled', 'assembled', 'leather', 'luxury_engine', 'luxury_body', 'leather_seat', 'premium_interior', 'luxury_assembled']
          if (storableItems.includes(item.type)) {
            stats.inventory[item.type]++
          }
        } else {
          // その他の機械は在庫に追加
          targetMachine.inventory.push({ type: item.type })
        }
      } else {
        // 受け入れ不可の場合は逆流防止でアイテム消失
        item.active = false
      }
    }
  })
    
  // 非アクティブなアイテムを削除
  items = items.filter(item => item.active)
}

// アイテムの描画
function drawItems(ctx, animationTime) {
  items.forEach(item => {
    // 移動時の軌跡効果
    const trail = Math.sin(animationTime * 0.01) * 2
        
    ctx.save()
    ctx.translate(item.x, item.y)
        
    // 軽い回転
    ctx.rotate(animationTime * 0.005)
        
    // 影
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)'
    ctx.fillRect(-8, -6, 16, 12)
        
    // アイテム本体
    ctx.fillStyle = itemColors[item.type] || '#f39c12'
    ctx.fillRect(-7, -7, 14, 14)
        
    // ハイライト
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)'
    ctx.fillRect(-7, -7, 14, 3)
        
    // 枠線
    ctx.strokeStyle = '#333'
    ctx.lineWidth = 1
    ctx.strokeRect(-7, -7, 14, 14)
        
    // 絵文字
    ctx.font = '12px Arial'
    ctx.textAlign = 'center'
    ctx.fillStyle = 'white'
    ctx.fillText(itemEmojis[item.type] || '🔩', 0, 4)
        
    ctx.restore()
        
    // 移動パーティクル
    if (Math.random() < 0.3) {
      const px = item.x + (Math.random() - 0.5) * 10
      const py = item.y + (Math.random() - 0.5) * 10
      ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.5})`
      ctx.fillRect(px, py, 1, 1)
    }
  })
}