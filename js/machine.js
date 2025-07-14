// 機械定義と処理ロジック

// 定数
const GRID_SIZE = 40
const LEVELUP_COST = 100000 // ¥100,000
const LEVEL_SPEED_BONUS = 0.5 // レベル2で50%速度向上

// 材料コスト
const materialCosts = {
  material: 1,  // 原材料1個消費
  tire: 2,      // タイヤ製造に材料2個
  engine: 3,    // エンジン製造に材料3個  
  body: 2,      // ボディ製造に材料2個
  seat: 1       // シート製造に材料1個
}

// 回転ヘルパー関数
function rotatePort(port, rotation) {
  const rotations = [
    {dx: port.dx, dy: port.dy}, // 0度
    {dx: -port.dy, dy: port.dx}, // 90度
    {dx: -port.dx, dy: -port.dy}, // 180度
    {dx: port.dy, dy: -port.dx}  // 270度
  ]
  return rotations[rotation]
}

// 機械定義（レシピ情報付き）
const machineTypes = {
  supplier: { 
    name: '原材料供給', 
    emoji: '📦', 
    color: '#8e44ad',
    processTime: 2000,
    outputs: ['material'],
    outputPorts: [{dx: 1, dy: 0}], // 右のみ
    inputPorts: [],
    recipe: '材料を無限生成（材料コスト: 1個/回）'
  },
  conveyor: { 
    name: 'コンベア', 
    emoji: '🟰', 
    color: '#7f8c8d',
    processTime: 0,
    outputs: ['any'],
    inputPorts: [{dx: -1, dy: 0}, {dx: 1, dy: 0}, {dx: 0, dy: -1}, {dx: 0, dy: 1}], // 四方向から入力
    outputPorts: [{dx: 1, dy: 0}], // 右に出力（デフォルト）
    recipe: '任意のアイテムを運搬'
  },
  // 基本加工機械
  press: { 
    name: 'プレス機', 
    emoji: '🔨', 
    color: '#e74c3c',
    processTime: 1500,
    inputs: ['material'],
    outputs: ['pressed'],
    inputPorts: [{dx: -1, dy: 0}], // 左から入力
    outputPorts: [{dx: 1, dy: 0}], // 右に出力
    recipe: '原材料 → プレス済み材料'
  },
  welder: { 
    name: '溶接機', 
    emoji: '⚡', 
    color: '#f39c12',
    processTime: 1500,
    inputs: ['pressed', 'tire_pressed', 'engine_pressed', 'body_pressed'],
    outputs: ['welded'],
    inputPorts: [{dx: -1, dy: 0}], // 左から入力
    outputPorts: [{dx: 1, dy: 0}], // 右に出力
    recipe: 'プレス済み材料 → 溶接済み材料'
  },
  painter: { 
    name: '塗装機', 
    emoji: '🎨', 
    color: '#9b59b6',
    processTime: 1500,
    inputs: ['welded'],
    outputs: ['painted'],
    inputPorts: [{dx: -1, dy: 0}], // 左から入力
    outputPorts: [{dx: 1, dy: 0}], // 右に出力
    recipe: '溶接済み材料 → 塗装済み材料'
  },
  // パーツ専用加工機械
  tire_press: {
    name: 'タイヤプレス',
    emoji: '🛞',
    color: '#2c3e50',
    processTime: 2000,
    inputs: ['material'],
    outputs: ['tire_pressed'],
    inputPorts: [{dx: -1, dy: 0}], // 左から入力
    outputPorts: [{dx: 1, dy: 0}], // 右に出力
    recipe: '原材料 → タイヤ用プレス材料'
  },
  engine_press: {
    name: 'エンジンプレス',
    emoji: '🔧',
    color: '#c0392b',
    processTime: 2500,
    inputs: ['material'],
    outputs: ['engine_pressed'],
    inputPorts: [{dx: -1, dy: 0}], // 左から入力
    outputPorts: [{dx: 1, dy: 0}], // 右に出力
    recipe: '原材料 → エンジン用プレス材料'
  },
  body_press: {
    name: 'ボディプレス',
    emoji: '🚗',
    color: '#16a085',
    processTime: 2000,
    inputs: ['material'],
    outputs: ['body_pressed'],
    inputPorts: [{dx: -1, dy: 0}], // 左から入力
    outputPorts: [{dx: 1, dy: 0}], // 右に出力
    recipe: '原材料 → ボディ用プレス材料'
  },
  // パーツ完成機械
  tire_maker: {
    name: 'タイヤ製造',
    emoji: '🛞',
    color: '#34495e',
    processTime: 1500,
    inputs: ['welded'],
    outputs: ['tire'],
    inputPorts: [{dx: -1, dy: 0}], // 左から入力
    outputPorts: [{dx: 1, dy: 0}], // 右に出力
    recipe: '溶接済み材料 → タイヤ（車1台に4個必要）'
  },
  engine_maker: {
    name: 'エンジン製造',
    emoji: '🔧',
    color: '#e74c3c',
    processTime: 2000,
    inputs: ['welded'],
    outputs: ['engine'],
    inputPorts: [{dx: -1, dy: 0}], // 左から入力
    outputPorts: [{dx: 1, dy: 0}], // 右に出力
    recipe: '溶接済み材料 → エンジン（車1台に1個必要）'
  },
  body_maker: {
    name: 'ボディ製造',
    emoji: '🚗',
    color: '#1abc9c',
    processTime: 1800,
    inputs: ['welded'],
    outputs: ['body'],
    inputPorts: [{dx: -1, dy: 0}], // 左から入力
    outputPorts: [{dx: 1, dy: 0}], // 右に出力
    recipe: '溶接済み材料 → ボディ（車1台に1個必要）'
  },
  seat_maker: {
    name: 'シート製造',
    emoji: '🪑',
    color: '#8e44ad',
    processTime: 1000,
    inputs: ['painted'],
    outputs: ['seat'],
    inputPorts: [{dx: -1, dy: 0}], // 左から入力
    outputPorts: [{dx: 1, dy: 0}], // 右に出力
    recipe: '塗装済み材料 → シート（車1台に4個必要）'
  },
  // 格納ボックス
  storage_box: {
    name: '部品格納ボックス',
    emoji: '📦',
    color: '#7f8c8d',
    processTime: 0,
    inputs: ['tire', 'engine', 'body', 'seat', 'pre_assembled', 'assembled'],
    outputs: [],
    inputPorts: [{dx: -1, dy: 0}, {dx: 1, dy: 0}, {dx: 0, dy: -1}, {dx: 0, dy: 1}], // 四方向から入力
    outputPorts: [], // 出力なし（格納専用）
    recipe: '部品を格納して在庫として保管'
  },
  parts_assembler: {
    name: '部品組立',
    emoji: '🔩',
    color: '#3498db',
    processTime: 3000,
    inputs: ['tire', 'engine', 'body', 'seat'],
    outputs: ['pre_assembled'],
    requiresAll: true,
    requiredCounts: { tire: 4, engine: 1, body: 1, seat: 4 },
    inputPorts: [{dx: -1, dy: 0}, {dx: 0, dy: -1}], // 左、上から入力
    outputPorts: [{dx: 1, dy: 0}], // 右に出力
    recipe: 'タイヤ×4 + エンジン×1 + ボディ×1 + シート×4 → 部品組立品'
  },
  final_assembler: {
    name: '最終組立',
    emoji: '🏭',
    color: '#27ae60',
    processTime: 4000,
    inputs: ['pre_assembled'],
    outputs: ['assembled'],
    requiresAll: false,
    inputPorts: [{dx: -1, dy: 0}], // 左から入力
    outputPorts: [{dx: 1, dy: 0}], // 右に出力
    recipe: '部品組立品 → 組立済み車'
  },
  inspector: { 
    name: '検査機', 
    emoji: '🔍', 
    color: '#2ecc71',
    processTime: 1000,
    inputs: ['assembled'],
    outputs: ['finished'],
    inputPorts: [{dx: -1, dy: 0}], // 左から入力
    outputPorts: [], // 出力なし（終端）
    recipe: '組立済み車 → 完成車（売上: ¥250,000）'
  }
}

// レベルに応じた処理時間を取得
function getProcessTime(machine) {
  const baseTime = machineTypes[machine.type].processTime
  if (machine.level && machine.level >= 2) {
    return Math.round(baseTime * (1 - LEVEL_SPEED_BONUS))
  }
  return baseTime
}

// 自動接続システム（回転対応）
function createAutoConnections(x, y) {
  const currentKey = `${x}-${y}`
  const currentMachine = machines.get(currentKey)
  if (!currentMachine) {return}
    
  const currentType = machineTypes[currentMachine.type]
    
  // 出力ポートから接続先を探す（回転適用）
  if (currentType.outputPorts) {
    currentType.outputPorts.forEach(originalPort => {
      const rotatedPort = rotatePort(originalPort, currentMachine.rotation)
      const {dx, dy} = rotatedPort
            
      const targetKey = `${x + dx}-${y + dy}`
      const targetMachine = machines.get(targetKey)
            
      if (targetMachine) {
        const targetType = machineTypes[targetMachine.type]
                
        // コンベアの場合は特別処理（全方向から受け入れ）
        if (targetMachine.type === 'conveyor') {
          // 接続作成
          if (!connections.has(currentKey)) {
            connections.set(currentKey, [])
          }
          if (!connections.get(currentKey).includes(targetKey)) {
            connections.get(currentKey).push(targetKey)
          }
        } else {
          // その他の機械は通常の入力ポートチェック
          if (targetType.inputPorts) {
            const hasMatchingInputPort = targetType.inputPorts.some(originalInputPort => {
              const rotatedInputPort = rotatePort(originalInputPort, targetMachine.rotation)
              return rotatedInputPort.dx === -dx && rotatedInputPort.dy === -dy
            })
                        
            if (hasMatchingInputPort) {
              // 接続作成
              if (!connections.has(currentKey)) {
                connections.set(currentKey, [])
              }
              if (!connections.get(currentKey).includes(targetKey)) {
                connections.get(currentKey).push(targetKey)
              }
            }
          }
        }
      }
    })
  }
    
  // 入力ポートから逆方向の接続を探す（回転適用）
  if (currentType.inputPorts) {
    currentType.inputPorts.forEach(originalPort => {
      // コンベアの場合は全方向チェック
      if (currentMachine.type === 'conveyor') {
        const {dx, dy} = originalPort
        const sourceKey = `${x + dx}-${y + dy}`
        const sourceMachine = machines.get(sourceKey)
                
        if (sourceMachine) {
          const sourceType = machineTypes[sourceMachine.type]
                    
          if (sourceType.outputPorts) {
            const hasMatchingOutputPort = sourceType.outputPorts.some(originalOutputPort => {
              const rotatedOutputPort = rotatePort(originalOutputPort, sourceMachine.rotation)
              return rotatedOutputPort.dx === -dx && rotatedOutputPort.dy === -dy
            })
                        
            if (hasMatchingOutputPort) {
              // 接続作成
              if (!connections.has(sourceKey)) {
                connections.set(sourceKey, [])
              }
              if (!connections.get(sourceKey).includes(currentKey)) {
                connections.get(sourceKey).push(currentKey)
              }
            }
          }
        }
      } else {
        // その他の機械は通常の回転適用
        const rotatedPort = rotatePort(originalPort, currentMachine.rotation)
        const {dx, dy} = rotatedPort
                
        const sourceKey = `${x + dx}-${y + dy}`
        const sourceMachine = machines.get(sourceKey)
                
        if (sourceMachine) {
          const sourceType = machineTypes[sourceMachine.type]
                    
          if (sourceType.outputPorts) {
            const hasMatchingOutputPort = sourceType.outputPorts.some(originalOutputPort => {
              const rotatedOutputPort = rotatePort(originalOutputPort, sourceMachine.rotation)
              return rotatedOutputPort.dx === -dx && rotatedOutputPort.dy === -dy
            })
                        
            if (hasMatchingOutputPort) {
              // 接続作成
              if (!connections.has(sourceKey)) {
                connections.set(sourceKey, [])
              }
              if (!connections.get(sourceKey).includes(currentKey)) {
                connections.get(sourceKey).push(currentKey)
              }
            }
          }
        }
      }
    })
  }
}

// アイテム受け入れ可能性チェック
function canAcceptItem(machine, itemType) {
  const machineType = machineTypes[machine.type]
    
  // コンベアは常に受け入れ可能（任意の方向から）
  if (machine.type === 'conveyor') {
    return true
  }
    
  // 機械が処理中で在庫が満杯の場合は受け入れ不可
  if (machine.processing && machine.inventory.length >= 5) {
    return false
  }
    
  // 入力タイプをチェック
  if (!machineType.inputs) {
    return false // 入力を受け付けない機械
  }
    
  // 適切な入力タイプかチェック
  return machineType.inputs.includes(itemType)
}

// 複数入力機械の処理可能判定（在庫システム対応）
function canProcessMultipleInputs(machine, machineType) {
  if (!machineType.requiresAll || !machineType.inputs) {return false}
    
  // 在庫から取得する機械の場合
  if (machineType.useInventory && machineType.requiredCounts) {
    return Object.entries(machineType.requiredCounts).every(([partType, requiredCount]) => {
      return stats.inventory[partType] >= requiredCount
    })
  }
    
  // 必要個数が設定されている場合
  if (machineType.requiredCounts) {
    return Object.entries(machineType.requiredCounts).every(([partType, requiredCount]) => {
      const availableCount = machine.inventory.filter(item => item.type === partType).length
      return availableCount >= requiredCount
    })
  }
    
  // 従来の1個ずつシステム
  return machineType.inputs.every(inputType => {
    return machine.inventory.some(item => item.type === inputType)
  })
}

// 機械処理
function processMachines(now) {
  for (const [key, machine] of machines) {
    const machineType = machineTypes[machine.type]
    const processTime = getProcessTime(machine) // レベルに応じた処理時間
        
    // 供給機の特別処理
    if (machine.type === 'supplier') {
      if (now - machine.lastProduced > processTime) {
        // 原材料が足りるかチェック
        if (stats.materials >= materialCosts.material) {
          machine.lastProduced = now
          stats.materials -= materialCosts.material
                    
          // 接続先に材料を送る（受け入れ可能性チェック付き）
          if (connections.has(key)) {
            const targets = connections.get(key)
            targets.forEach(targetKey => {
              const targetMachine = machines.get(targetKey)
              if (targetMachine && canAcceptItem(targetMachine, 'material')) {
                createItem(machine.x, machine.y, targetMachine.x, targetMachine.y, 'material')
              }
            })
          }
        }
      }
    }
        
    // その他の機械の処理
    if (machine.type !== 'supplier' && machine.type !== 'conveyor') {
      // 複数入力が必要な機械の処理
      if (machineType.requiresAll) {
        if (!machine.processing && canProcessMultipleInputs(machine, machineType)) {
          machine.processing = true
          machine.processStart = now
          if (machineType.requiresAll && machineType.requiredCounts) {
            // 在庫システムを使用する場合
            if (machineType.useInventory) {
              Object.entries(machineType.requiredCounts).forEach(([partType, requiredCount]) => {
                stats.inventory[partType] -= requiredCount
              })
            } else {
              // 必要個数分を消費（処理開始時）
              Object.entries(machineType.requiredCounts).forEach(([partType, requiredCount]) => {
                for (let i = 0; i < requiredCount; i++) {
                  const index = machine.inventory.findIndex(item => item.type === partType)
                  if (index !== -1) {
                    machine.inventory.splice(index, 1)
                  }
                }
              })
            }
          } else if (machineType.requiresAll) {
            // 従来の1個ずつシステム
            machineType.inputs.forEach(inputType => {
              const index = machine.inventory.findIndex(item => item.type === inputType)
              if (index !== -1) {
                machine.inventory.splice(index, 1)
              }
            })
          }
        }
      } else {
        // 単一入力の機械の処理
        if (machine.inventory.length > 0 && !machine.processing) {
          const item = machine.inventory[0]
          if (machineType.inputs && machineType.inputs.includes(item.type)) {
            machine.processing = true
            machine.processStart = now
          }
        }
      }
            
      // 処理完了チェック（レベルに応じた処理時間を使用）
      if (machine.processing && now - machine.processStart > processTime) {
        machine.processing = false
                
        if (!machineType.requiresAll) {
          machine.inventory.shift() // 単一入力の場合のみ
        }
        // 複数入力の場合は処理開始時に既に消費済み
                
        if (machineType.outputs) {
          const outputType = machineType.outputs[0]
                    
          // 生産実績を記録
          if (['tire', 'engine', 'body', 'seat'].includes(outputType)) {
            stats.totalProduced[outputType]++
          }
                    
          // 検査機の場合は完成車として処理
          if (machine.type === 'inspector') {
            stats.cars++
            stats.revenue += 250000 // 高価値の完成車
          } else {
            // 接続先に送る
            if (connections.has(key)) {
              const targets = connections.get(key)
              targets.forEach(targetKey => {
                const targetMachine = machines.get(targetKey)
                if (targetMachine) {
                  createItem(machine.x, machine.y, targetMachine.x, targetMachine.y, outputType)
                }
              })
            }
          }
        }
      }
    }
  }
}