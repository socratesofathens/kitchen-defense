import Phaser from 'phaser'
import Actor from './Actor'
import AcuBot from './AcuBot'
import Ball from './Ball'

import {
  BLOCK, HALF_HEIGHT, HALF_RATIO, HEIGHT, RATIO, TWO, SEVEN, WIDTH, FOURTEEN, SIX, THREE, MAXIMUM_DIAMETER, MAXIMUM_RADIUS
} from './config'
import Enemy from './Enemy'
import Mob from './Mob'
import Soldier from './Soldier'
import Station from './Station'
import Sugar from './Sugar'
import Tower from './Tower'
import { Position, Size } from './types'
import worker from './worker.png'
import soldier from './soldier.png'
import base from './base.png'
import cannon from './cannon.png'

export default class Scene extends Phaser.Scene {
  public actors: Actor[] = []
  public towers: Tower[] = []
  public acuBots: AcuBot[] = []
  public acuBotsGroup!: Phaser.Physics.Arcade.Group
  public battery = 0
  public collider!: Phaser.Physics.Arcade.Collider
  public enemies!: Phaser.Physics.Arcade.Group
  public firing = 1
  public graphics!: Phaser.GameObjects.Graphics
  public mobs!: Phaser.Physics.Arcade.Group
  public open = false
  public over = false
  public pointerPosition!: Position
  public soldiersGroup!: Phaser.Physics.Arcade.Group
  public start = Date.now()
  public statics!: Phaser.Physics.Arcade.StaticGroup
  public stations!: Phaser.Physics.Arcade.StaticGroup
  public stationPositions!: Position[]
  public sugar!: Sugar
  public workerCounter!: Phaser.GameObjects.Text
  public workerLabel!: Phaser.GameObjects.Text
  public soldierCounter!: Phaser.GameObjects.Text
  public soldierLabel!: Phaser.GameObjects.Text
  public towerCounter!: Phaser.GameObjects.Text
  public antCounter!: Phaser.GameObjects.Text
  public antLabel!: Phaser.GameObjects.Text
  public goalCounter!: Phaser.GameObjects.Text
  public goalLabel!: Phaser.GameObjects.Text
  public plus!: Phaser.GameObjects.Text
  public equals!: Phaser.GameObjects.Text
  public slash!: Phaser.GameObjects.Text
  public resetLabel!: Phaser.GameObjects.Text
  public resetPosition = { x: 0.07, y: 0.08 }
  public continuePosition = { x: HALF_RATIO, y: 0.08 }
  public towersGroup!: Phaser.Physics.Arcade.StaticGroup
  public killTime = Date.now()
  public kills = 0
  public workers = 499
  public soldiers = 0
  public victory = false
  public score = 0
  public continueLabel!: Phaser.GameObjects.Text
  public victoryLabel!: Phaser.GameObjects.Text

  public readonly CENTER: Position = { x: HALF_RATIO, y: 0.5 }
  public readonly ORIGIN: Position = { x: 0, y: 0 }
  public readonly SPACE: number = MAXIMUM_DIAMETER + 0.02

  protected REAL_CENTER!: Position

  private full = false
  private id = 0
  private queen!: Enemy
  private ready = false

  private readonly maximum = 3000

  init (): void {
    this.cameras.main.setBackgroundColor('#FFFFFF')
  }

  preload (): void {
    this.load.image('worker', worker)
    this.load.image('base', base)
    this.load.image('soldier', soldier)
    this.load.image('cannon', cannon)
  }

  create (): void {
    console.log('create test')
    this.actors = []
    this.towers = []
    this.acuBots = []
    this.battery = 0
    this.firing = 1
    this.open = false
    this.over = false
    this.start = Date.now()
    this.killTime = Date.now()
    this.kills = 0
    this.workers = 0
    this.soldiers = 0
    this.victory = false
    this.score = 0
    this.full = false
    this.id = 0
    this.ready = false

    this.graphics = this.add.graphics()
    this.REAL_CENTER = this.getRealPosition(this.CENTER)

    this.mobs = this.physics.add.group()
    this.enemies = this.physics.add.group()
    this.soldiersGroup = this.physics.add.group()

    this.sugar = new Sugar(this)

    const position = { x: 1.25, y: 0.5 }
    this.queen = new Soldier({ scene: this, position })
    this.createWorkers({ position: this.ORIGIN })

    this.statics = this.physics.add.staticGroup()
    this.towersGroup = this.physics.add.staticGroup()

    this.setupTowers()

    this.resetLabel = this.createText({
      position: this.resetPosition,
      fontSize: 0.04,
      color: 'white',
      content: 'Reset'
    })
    this.resetLabel.setInteractive()
    this.resetLabel.on('pointerup', (pointer: any, localX: any, localY: any, event: any) => {
      console.log('reset')
      this.over = false
      // this.events.removeAllListeners()
      // this.registry.reset()
      // this.cameras.resetAll()
      this.actors.forEach(actor => actor.container.destroy())
      // this.scene.stop()
      // this.scene.start()
      this.actors = []
      this.towers = []
      this.acuBots = []
      this.stationPositions = []
      this.scene.restart()

      // event.stopPropagation()
    })
    this.resetLabel.setVisible(false)

    this.continueLabel = this.createText({
      position: this.continuePosition,
      fontSize: 0.04,
      color: 'white',
      content: 'Continue'
    })
    this.continueLabel.setInteractive()
    this.continueLabel.on('pointerdown', (pointer: any, localX: any, localY: any, event: any) => {
      const custom = new CustomEvent('continue', { detail: this.score })
      document.dispatchEvent(custom)

      event.stopPropagation()
    })
    this.continueLabel.setVisible(false)

    this.input.on(
      Phaser.Input.Events.POINTER_DOWN,
      (pointer: Phaser.Input.Pointer) => {
        if (this.ready) {
          const realPosition = { x: pointer.worldX, y: pointer.worldY }

          this.createTower({ realPosition })

          this.battery = 0
          this.full = false
        }
      }
    )

    this.input.on(
      Phaser.Input.Events.POINTER_MOVE,
      (pointer: Phaser.Input.Pointer) => {
        this.pointerPosition = { x: pointer.x, y: pointer.y }
      }
    )

    this.events.on(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.input.off(Phaser.Input.Events.POINTER_UP)
      this.input.off(Phaser.Input.Events.POINTER_MOVE)
    })

    this.stations = this.physics.add.staticGroup()

    const topLeft = {
      x: this.upOrDown({ value: TWO }),
      y: this.upOrDown({ value: TWO })
    }
    const bottomLeft = {
      x: this.upOrDown({ value: BLOCK, up: true }),
      y: this.upOrDown({ value: SEVEN })
    }
    const bottomRight = {
      x: this.upOrDown({ value: SIX }),
      y: this.upOrDown({ value: SEVEN })
    }
    const topRight = {
      x: this.upOrDown({ value: FOURTEEN }),
      y: BLOCK
    }
    const topCenter = {
      x: this.upOrDown({ value: SEVEN }),
      y: this.upOrDown({ value: THREE })
    }
    this.stationPositions = [
      bottomRight, bottomLeft, topLeft, topCenter, topRight
    ]
    const stations = this.stationPositions.map(position => new Station({
      scene: this, position
    }))

    this.acuBotsGroup = this.physics.add.group()

    // this.createAcuBot({ x: this.SPACE * 15, y: this.SPACE * 8 })
    // this.createAcuBot({ x: this.SPACE * 15, y: this.SPACE * 9 })
    // this.createAcuBot({ x: this.SPACE * 15, y: this.SPACE * 10 })
    // this.createAcuBot({ x: this.SPACE * 15, y: this.SPACE * 11 })
    // this.createAcuBot({ x: this.SPACE * 20, y: this.SPACE * 7 })
    // this.createAcuBot({ x: this.SPACE * 20, y: this.SPACE * 8 })
    // this.createAcuBot({ x: this.SPACE * 20, y: this.SPACE * 9 })
    // this.createAcuBot({ x: this.SPACE * 20, y: this.SPACE * 10 })
    // this.createAcuBot({ x: this.SPACE * 20, y: this.SPACE * 11 })
    // this.createAcuBot({ x: this.SPACE * 25, y: this.SPACE * 7 })
    // this.createAcuBot({ x: this.SPACE * 25, y: this.SPACE * 8 })
    // this.createAcuBot({ x: this.SPACE * 25, y: this.SPACE * 9 })
    // this.createAcuBot({ x: this.SPACE * 25, y: this.SPACE * 10 })
    // this.createAcuBot({ x: this.SPACE * 25, y: this.SPACE * 11 })
    // this.createAcuBot({ x: this.SPACE * 30, y: this.SPACE * 7 })
    // this.createAcuBot({ x: this.SPACE * 30, y: this.SPACE * 8 })
    // this.createAcuBot({ x: this.SPACE * 30, y: this.SPACE * 9 })
    // this.createAcuBot({ x: this.SPACE * 30, y: this.SPACE * 10 })
    // this.createAcuBot({ x: this.SPACE * 30, y: this.SPACE * 11 })

    const onNext = (
      stationContainer: Phaser.GameObjects.GameObject,
      botContainer: Phaser.GameObjects.GameObject
    ): void => {
      const stationId = stationContainer.getData('id')
      const station = stations.find(station => {
        const containerId = station.container.getData('id')
        const match = containerId === stationId

        return match
      })
      if (station != null) {
        station._count = station._count + 1
      }

      const last = botContainer.getData('last')
      if (stationContainer.body.position === last) {
        return
      } else {
        botContainer.setData('last', stationContainer.body.position)
      }

      const botId = botContainer.getData('id')

      const bot = this.acuBots.find(bot => {
        const containerId = bot.container.getData('id')
        const match = containerId === botId

        return match
      })

      if (bot == null) {
        throw new Error('Letter not found')
      }

      bot.killTime = 1

      const next = bot.index + 1
      const end = stations.length
      bot.index = next % end
      const target = stations[bot.index]

      bot.time = Date.now()

      bot.target = target.getRealPosition()
    }

    this.collider = this.physics.add.collider(
      this.stations, this.acuBotsGroup, onNext
    )

    const onKill = (
      acuBotContainer: Phaser.GameObjects.GameObject,
      enemyContainer: any
    ): void => {
      const acuBot: AcuBot = acuBotContainer.getData('acuBot')

      if (acuBot.ready) {
        const enemyId = enemyContainer.getData('id')
        this.actors = this.actors.filter(actor => {
          const id = actor.container.getData('id')
          const match = enemyId === id

          return !match
        })
        const isSoldier: boolean = enemyContainer.getData('soldier')

        if (isSoldier) {
          this.soldiers = this.soldiers + 1
        } else {
          this.workers = this.workers + 1
        }

        enemyContainer.destroy()

        const realPosition = { x: enemyContainer.x, y: enemyContainer.y }
        const time = Date.now() - this.killTime
        this.killTime = Date.now()

        this.createWorkers({ realPosition, time })

        acuBot.killTime = Date.now()
      }
    }

    this.physics.add.collider(this.acuBotsGroup, this.enemies, onKill)
    this.physics.add.collider(this.mobs, this.mobs)
    this.physics.add.collider(this.mobs, this.statics)

    // this.createBall({ x: 1, y: 2 })
    // this.createBallColumn(2)
    // this.createBallColumn(5)
    // this.createBallColumn(8)
    // this.createBallColumn(11)
    // this.createBallColumn(14)
    // this.createBallColumn(17)
    // this.createBallColumn(20)

    const goalX = RATIO - 0.05
    const goalPosition = { x: goalX, y: 1 }
    this.goalCounter = this.createText({
      position: goalPosition, content: '500', fontSize: 0.05, color: 'red'
    })
    this.goalCounter.setOrigin(0.5, 1)
    this.goalCounter.alpha = 0.5

    const goalLabelPosition = { x: goalX, y: 1 - 0.06 }
    this.goalLabel = this.createText({
      position: goalLabelPosition, content: 'Goal', fontSize: 0.03, color: 'red'
    })
    this.goalLabel.setOrigin(0.5, 1)
    this.goalLabel.alpha = 0.5

    const slashX = goalX - 0.075
    const slashPosition = { x: slashX, y: 1 }
    this.slash = this.createText({
      position: slashPosition, content: '/', fontSize: 0.05, color: 'red'
    })
    this.slash.setOrigin(0.5, 1)
    this.slash.alpha = 0.5

    const antsX = slashX - 0.075
    const antsCounterPosition = { x: antsX, y: 1 }
    this.antCounter = this.createText({
      position: antsCounterPosition, content: this.kills, fontSize: 0.05, color: 'red'
    })
    this.antCounter.setOrigin(0.5, 1)
    this.antCounter.alpha = 0.5

    const antLabelPosition = { x: antsX, y: 1 - 0.06 }
    this.antLabel = this.createText({
      position: antLabelPosition, content: 'Ants', fontSize: 0.03, color: 'red'
    })
    this.antLabel.setOrigin(0.5, 1)
    this.antLabel.alpha = 0.5

    const equalsX = antsX - 0.075
    const equalsPosition = { x: equalsX, y: 1 }
    this.equals = this.createText({
      position: equalsPosition, content: '=', fontSize: 0.05, color: 'red'
    })
    this.equals.setOrigin(0.5, 1)
    this.equals.alpha = 0.5

    const soldiersX = equalsX - 0.075
    const soldiersCounterPosition = { x: soldiersX, y: 1 }
    this.soldierCounter = this.createText({
      position: soldiersCounterPosition, content: this.kills, fontSize: 0.05, color: 'red'
    })
    this.soldierCounter.setOrigin(0.5, 1)
    this.soldierCounter.alpha = 0.5

    const soldiersLabelPosition = { x: soldiersX, y: 1 - 0.06 }
    this.soldierLabel = this.createText({
      position: soldiersLabelPosition, content: 'Soldiers', fontSize: 0.03, color: 'red'
    })
    this.soldierLabel.setOrigin(0.5, 1)
    this.soldierLabel.alpha = 0.5

    const realSpriteY = this.getReal(1 - 0.12)
    const realSpriteRadius = this.getReal(0.01)

    const realSoldiersX = this.getReal(soldiersX)

    const soldiersSprite = this.add.sprite(realSoldiersX, realSpriteY, 'soldier')
    soldiersSprite.setDisplaySize(realSpriteRadius * 3, realSpriteRadius * 3)
    soldiersSprite.alpha = 0.5

    const plusX = soldiersX - 0.075
    const plusPosition = { x: plusX, y: 1 }
    this.plus = this.createText({
      position: plusPosition, content: '+', fontSize: 0.05, color: 'red'
    })
    this.plus.setOrigin(0.5, 1)
    this.plus.alpha = 0.5

    const workersX = plusX - 0.075
    const workersCounterPosition = { x: workersX, y: 1 }
    this.workerCounter = this.createText({
      position: workersCounterPosition, content: this.kills, fontSize: 0.05, color: 'red'
    })
    this.workerCounter.setOrigin(0.5, 1)
    this.workerCounter.alpha = 0.5

    const workerLabelPosition = { x: workersX, y: 1 - 0.06 }
    this.workerLabel = this.createText({
      position: workerLabelPosition, content: 'Workers', fontSize: 0.03, color: 'red'
    })
    this.workerLabel.setOrigin(0.5, 1)
    this.workerLabel.alpha = 0.5

    const realWorkersX = this.getReal(workersX)

    const workersSprite = this.add.sprite(realWorkersX, realSpriteY, 'worker')
    workersSprite.setDisplaySize(realSpriteRadius * 3, realSpriteRadius * 3)
    workersSprite.alpha = 0.5

    const towersX = goalX
    const towersCounterPosition = { x: towersX, y: 0.14 }
    this.towerCounter = this.createText({
      position: towersCounterPosition, content: this.towers.length, fontSize: 0.05, color: 'red'
    })
    this.towerCounter.setOrigin(0.5, 1)
    this.towerCounter.alpha = 0.5

    const towersLabelPosition = { x: towersX, y: 0.085 }
    const towersLabel = this.createText({
      position: towersLabelPosition, content: 'Towers', fontSize: 0.03, color: 'red'
    })
    towersLabel.setOrigin(0.5, 1)
    towersLabel.alpha = 0.5

    const basePosition = { x: towersX, y: 0.04 }
    const base = this.createCircle({
      position: basePosition, radius: 0.01, color: 0xff0000
    })
    base.setOrigin(0.5, 0.5)
    base.alpha = 0.5

    const origin = { x: 0.5, y: 1 }
    const cannon = this.createRectangle({
      position: basePosition,
      size: { width: 0.003, height: 0.024 },
      color: 0xFF0000,
      origin
    })
    cannon.alpha = 0.5

    this.scale.refresh()
  }

  checkReal <T> ({ value, real, getter }: {
    value?: T
    real?: T
    getter: (value: T) => T
  }): T {
    if (real != null) {
      return real
    }

    if (value == null) {
      throw new Error('Nothing is real')
    }

    real = getter(value)

    return real
  }

  checkRealNumber ({ value, real }: {
    value?: number
    real?: number
  }): number {
    return this.checkReal({ value, real, getter: this.getReal })
  }

  checkRealPosition ({ position, realPosition }: {
    position?: Position
    realPosition?: Position
  }): Position {
    return this.checkReal({
      value: position, real: realPosition, getter: this.getRealPosition
    })
  }

  createAcuBot (position: Position): AcuBot {
    const acuBot = new AcuBot({ scene: this, position })

    return acuBot
  }

  createBall (position: Position): Ball {
    const spacePosition = {
      x: this.SPACE * position.x,
      y: this.SPACE * position.y
    }
    const random = Math.random() * 0.5
    const scale = 0.5 + random
    const ball = new Ball({ scene: this, position: spacePosition, scale })

    return ball
  }

  createBallColumn (x: number): void {
    this.createBall({ x, y: 2 })
    this.createBall({ x, y: 5 })
    this.createBall({ x, y: 8 })
    this.createBall({ x, y: 11 })
    this.createBall({ x, y: 14 })
  }

  createContainer ({ position, realPosition }: {
    position?: Position
    realPosition?: Position
  }): Phaser.GameObjects.Container {
    realPosition = this.checkRealPosition({ position, realPosition })

    const container = this.add.container(realPosition.x, realPosition.y)

    return container
  }

  createCircle ({ position, realPosition, radius, color }: {
    position?: Position
    realPosition?: Position
    radius?: number
    color?: number
  }): Phaser.GameObjects.Arc {
    realPosition = this.checkRealPosition({ position, realPosition })

    if (radius != null) {
      radius = this.getReal(radius)
    }

    const circle = this.add.circle(realPosition.x, realPosition.y, radius, color)

    return circle
  }

  createLine ({ a, b, realA, realB }: {
    a?: Position
    b?: Position
    realA?: Position
    realB?: Position
  } = { realA: this.ORIGIN, realB: this.ORIGIN }): Phaser.Geom.Line {
    realA = this.checkRealPosition({ position: a, realPosition: realA })
    realB = this.checkRealPosition({ position: b, realPosition: realB })

    const line = new Phaser.Geom.Line(realA.x, realA.y, realB.x, realB.y)

    return line
  }

  createRange (step: number, _maximum = 1): number[] {
    const values = []

    let current = step
    let lower = current < _maximum
    while (lower) {
      values.push(current)

      current = current + step
      lower = current < _maximum
    }

    return values
  }

  createRangeRatio (step: number): number[] {
    const values = this.createRange(step, RATIO)

    return values
  }

  createRectangle ({ position, realPosition, size, color, origin }: {
    position?: Position
    realPosition?: Position
    size: Size
    color: number
    origin?: Position
  }): Phaser.GameObjects.Rectangle {
    realPosition = this.checkRealPosition({ position, realPosition })

    const realSize = this.getRealSize(size)

    const rectangle = this.add.rectangle(
      realPosition.x, realPosition.y, realSize.width, realSize.height, color
    )

    if (origin != null) {
      rectangle.setOrigin(origin.x, origin.y)
    }

    return rectangle
  }

  createText ({
    position, realPosition, content, color = 'black', fontSize, fontStyle
  }: {
    position?: Position
    realPosition?: Position
    content: string | number
    color?: string
    fontSize?: number
    fontStyle?: string
  }): Phaser.GameObjects.Text {
    realPosition = this.checkRealPosition({ position, realPosition })

    const style: {
      fontFamily: string
      color?: string
      fontStyle?: string
    } = { fontFamily: 'Arial', fontStyle }

    if (color != null) {
      style.color = color
    }

    const string = content.toString()
    const text = this.add.text(realPosition.x, realPosition.y, string, style)
    if (fontSize != null) {
      const realFontSize = this.getReal(fontSize)

      text.setFontSize(realFontSize)
    }

    text.setOrigin(0.5, 0.5)

    return text
  }

  createTower ({ position, realPosition }: {
    position?: Position
    realPosition?: Position
  }): Tower {
    const tower = new Tower({ scene: this, position, realPosition })

    return tower
  }

  createWorker ({ death = this.ORIGIN, time, enemiesLength, distance }: {
    death?: Position
    time?: number
    enemiesLength: number
    distance: number
  }): Mob | Soldier | Enemy {
    const currentRadians = Phaser.Math.Angle.Between(
      death.x, death.y, this.sugar.realPosition.x, this.sugar.realPosition.y
    )
    const currentDegrees = Phaser.Math.RadToDeg(currentRadians)

    const maximum = 120

    const ratio = distance / WIDTH
    const degrees = maximum * ratio

    const enemiesRemainder = enemiesLength % 2
    const enemiesZero = enemiesRemainder === 0
    const enemiesFactor = enemiesZero
      ? 1
      : -1

    const factoredDegrees = degrees * enemiesFactor
    const combinedDegrees = currentDegrees + factoredDegrees
    const moduloDegrees = combinedDegrees % maximum
    const absoluteDegrees = Math.abs(moduloDegrees)
    const newDegrees = absoluteDegrees - 30
    const radians = Phaser.Math.DegToRad(newDegrees)

    const enemiesLog = enemiesLength > 0
      ? Math.log(enemiesLength)
      : 0

    const newDistance = WIDTH + ((WIDTH / 10) * enemiesLog)

    const base = { x: 0, y: HALF_HEIGHT }
    const rotated = Phaser.Math.RotateAroundDistance(
      base,
      this.sugar.realPosition.x,
      this.sugar.realPosition.y,
      radians,
      newDistance
    )

    const spawn = rotated

    if (this.towers.length > 0 && enemiesLength > 5) {
      const enemiesRatio = (enemiesLength / 2) / this.towers.length
      const enemiesDivisor = (Math.ceil(enemiesRatio) % 15) + 1
      const enemiesRemainder = enemiesLength % enemiesDivisor
      const enemiesZero = enemiesRemainder === 0

      if (enemiesZero) {
        const soldier = new Soldier({ scene: this, realPosition: spawn })

        return soldier
      }
    }

    const worker = new Enemy({ scene: this, realPosition: spawn, radius: 0.01 })

    return worker
  }

  createWorkers ({ position, realPosition, time = 0 }: {
    position?: Position
    realPosition?: Position
    time?: number
  }): void {
    const enemiesLength = this.enemies.getLength()
    if (enemiesLength < 1000) {
      const death = this.checkRealPosition({ position, realPosition })

      const logTime = Math.log(time)
      const fraction = 15
      const fractionTime = logTime > 0
        ? logTime / fraction
        : 0
      const length = Math.ceil(fractionTime) + 1

      const distance = Phaser.Math.Distance.Between(
        death.x, death.y, this.sugar.realPosition.x, this.sugar.realPosition.y
      )

      Array.from(
        { length },
        (_, index) => this.createWorker({
          death, time, enemiesLength: enemiesLength + index, distance
        })
      )
    } else {
      console.warn('Too many enemies')
    }
  }

  fillCircle ({ position, radius = 0.1, realPosition, realRadius }: {
    position?: Position
    realPosition?: Position
    radius?: number
    realRadius?: number
  }): void {
    realPosition = this.checkRealPosition({ position, realPosition })
    realRadius = this.checkRealNumber({ value: radius, real: realRadius })

    this.graphics.fillCircle(realPosition.x, realPosition.y, realRadius)
  }

  fillRounded ({ position, realPosition, size, color, radius = 0.01 }: {
    position?: Position
    realPosition?: Position
    size: Size
    color: number
    radius?: number
  }): void {
    realPosition = this.checkRealPosition({ position, realPosition })

    const realSize = this.getRealSize(size)
    const { width, height } = realSize

    const halfWidth = width / 2
    const halfHeight = height / 2

    const x = realPosition.x - halfWidth
    const y = realPosition.y - halfHeight

    const realRadius = this.getReal(radius)

    this.graphics.fillStyle(color, 1)
    this.graphics.fillRoundedRect(x, y, width, height, realRadius)
  }

  getId (): number {
    this.id = this.id + 1

    return this.id
  }

  getLineToCircle ({ line, circle }: {
    line: Phaser.Geom.Line
    circle: Phaser.Geom.Circle
  }): Position | undefined {
    const out: any = {}
    const intersection = Phaser.Geom.Intersects.LineToCircle(
      line, circle, out
    )

    if (intersection) {
      return out
    }
  }

  getReal = (value: number): number => {
    return value * HEIGHT
  }

  getRealPosition = ({ x, y }: {
    x: number
    y: number
  }): Position => {
    const realX = this.getReal(x)
    const realY = this.getReal(y)
    const position = { x: realX, y: realY }

    return position
  }

  getRealSize = ({ width, height }: {
    width: number
    height: number
  }): Size => {
    const realWidth = this.getReal(width)
    const realHeight = this.getReal(height)
    const size = { width: realWidth, height: realHeight }

    return size
  }

  setupTowers (): void {
    const topLeft = { x: this.SPACE * 21, y: this.SPACE * 6 }
    const topRight = { x: this.SPACE * 25, y: this.SPACE * 6 }
    const bottomLeft = { x: this.SPACE * 19, y: this.SPACE * 8 }
    const bottomRight = { x: this.SPACE * 19, y: this.SPACE * 12 }
    const inside = { x: this.SPACE * 20, y: this.SPACE * 7 }
    const positions = [
      topLeft, topRight, bottomLeft, bottomRight, inside
    ]

    positions.forEach(position => this.createTower({ position }))

    const onBite = (
      towerContainer: Phaser.GameObjects.GameObject,
      soldierContainer: Phaser.GameObjects.GameObject
    ): void => {
      const towerContainerId = towerContainer.getData('id')
      this.towers = this.towers.filter(tower => {
        const id = tower.container.getData('id')
        const match = towerContainerId === id

        return !match
      })

      this.actors = this.actors.filter(tower => {
        const id = tower.container.getData('id')
        const match = towerContainerId === id

        return !match
      })
      towerContainer.destroy()

      const soldierId = soldierContainer.getData('id')
      this.actors = this.actors.filter(tower => {
        const id = tower.container.getData('id')
        const match = soldierId === id

        return !match
      })
      soldierContainer.destroy()
    }

    this.collider = this.physics.add.collider(
      this.towersGroup, this.soldiersGroup, onBite
    )
  }

  spendBattery (value: number): void {
    this.battery = this.battery - value
    if (this.battery < 0) {
      this.battery = 0
    }

    this.full = false
  }

  strokeLine ({ a, b, realA, realB }: {
    a?: Position
    b?: Position
    realA?: Position
    realB?: Position
  }): void {
    const line = this.createLine({ a, b, realA, realB })

    this.graphics.strokeLineShape(line)
  }

  strokeVertical (x: number): void {
    const a = { x, y: 0 }
    const b = { x, y: 1 }

    this.strokeLine({ a, b })
  }

  strokeHorizontal (y: number): void {
    const a = { x: 0, y }
    const b = { x: RATIO, y }

    this.strokeLine({ a, b })
  }

  upOrDown ({ value, offset = MAXIMUM_RADIUS * 5, up = false }: {
    value: number
    offset?: number
    up?: boolean
  }): number {
    const random = Math.random() * offset
    const positive = up || Math.random() > 0.5

    if (positive) {
      return value + random
    } else {
      return value - random
    }
  }

  update (now: number, delta: number): void {
    this.graphics.clear()
    this.firing = 0

    const vertical = this.createRangeRatio(this.SPACE)
    vertical.forEach(x => this.strokeVertical(x))

    const horizontal = this.createRange(this.SPACE)
    horizontal.forEach(y => this.strokeHorizontal(y))

    this.open = true
    this.actors.forEach(actor => {
      actor.update({ now, delta })
      if (actor.container.body != null) {
        if (this.sugar.realPosition == null) {
          console.warn('no sugar')
        }
        const realPosition = actor.getRealPosition()
        if (realPosition == null) {
          console.warn('no actor')
        } else {
          // this.strokeLine({
          //   realA: this.sugar.realPosition, realB: realPosition
          // })
        }
      }
    })

    if (this.pointerPosition != null) {
      const distance = Phaser.Math.Distance.Between(
        this.sugar.realPosition.x,
        this.sugar.realPosition.y,
        this.pointerPosition.x,
        this.pointerPosition.y
      )

      const radius = this.sugar.radius + this.SPACE
      const space = this.sugar.container.scale * radius
      const realSpace = this.getReal(space)
      if (distance < realSpace) {
        this.open = false

        this.graphics.fillStyle(0xFFFF00)
        this.fillCircle({ realPosition: this.sugar.realPosition, radius: space })
      }
    }

    const log = Math.log(this.firing)
    const quotient = log
    const base = 1.5
    const added = base + quotient

    const equal = this.firing === 1
    const greater = this.firing > 1
    const firing = equal
      ? base
      : greater
        ? added
        : 1
    const charge = delta / firing

    this.battery = this.battery + charge
    if (this.battery > this.maximum) {
      this.battery = this.maximum
      this.full = true
    }

    this.ready = this.full && this.open

    if (this.pointerPosition != null) {
      if (this.ready) {
        this.graphics.lineStyle(1, 0x00FF00, 1)

        const tracer = this.createLine()

        const radians = Phaser.Math.Angle.Between(
          this.pointerPosition.x,
          this.pointerPosition.y,
          this.sugar.realPosition.x,
          this.sugar.realPosition.y
        )

        const realRange = this.getReal(this.SPACE * 3)
        Phaser.Geom.Line.SetToAngle(
          tracer,
          this.pointerPosition.x,
          this.pointerPosition.y,
          radians + Math.PI,
          realRange
        )

        this.graphics.strokeLineShape(tracer)

        this.graphics.fillStyle(0x00FF00, 1)
        this.fillCircle({ realPosition: this.pointerPosition, radius: 0.01 })
      } else if (this.open || !this.full) {
        this.graphics.fillStyle(0xFF0000, 0.5)
        const percent = this.battery / this.maximum
        const angle = 360 * percent
        const realRadius = this.getReal(this.SPACE)
        this.graphics.slice(
          this.pointerPosition.x,
          this.pointerPosition.y,
          realRadius,
          Phaser.Math.DegToRad(angle),
          Phaser.Math.DegToRad(0),
          true
        )

        this.graphics.fillPath()
      }
    }

    const killsString = this.kills.toString()
    this.antCounter.setText(killsString)
    if (this.kills >= 500 && !this.over) {
      this.antCounter.setColor('green')
      if (!this.victory) {
        this.victoryLabel = this.createText({
          position: { x: HALF_RATIO, y: 0 },
          content: 'Victory',
          color: 'green',
          fontSize: 0.05
        })
        this.victoryLabel.setOrigin(0.5, 0)
        this.victoryLabel.alpha = 0.5
        this.continueLabel.setVisible(true)
      }
      this.victory = true
      this.score = this.kills

      const victoryLabelText = `Victory (${this.score})`
      if (this.victoryLabel != null) {
        this.victoryLabel.setText(victoryLabelText)
      }
    }

    if (this.score > 0) {
      this.fillRounded({
        position: this.continuePosition,
        size: { width: 0.2, height: 0.05 },
        color: 0x008000
      })
      this.children.bringToTop(this.continueLabel)
    }

    const workersString = this.workers.toString()
    this.workerCounter.setText(workersString)

    const soldiersString = this.soldiers.toString()
    this.soldierCounter.setText(soldiersString)

    this.kills = this.workers + this.soldiers
    this.antCounter.setText(this.kills.toString())

    this.towerCounter.setText(this.towers.length.toString())

    if (this.kills >= 500 && !this.over) {
      this.goalCounter.setColor('green')
      this.slash.setColor('green')
      this.goalLabel.setColor('green')
      this.antCounter.setColor('green')
      this.antLabel.setColor('green')
      this.equals.setColor('green')
      this.soldierCounter.setColor('green')
      this.soldierLabel.setColor('green')
      this.workerCounter.setColor('green')
      this.plus.setColor('green')
      this.workerLabel.setColor('green')

      if (this.acuBots.length < 1) {
        this.createAcuBot({ x: 0, y: 0 })
      }
    }

    if (this.over) {
      const resetBackSize = { width: 0.12, height: 0.05 }
      this.fillRounded({
        position: this.resetPosition,
        size: resetBackSize,
        color: 0xFF0000,
        radius: 0.01
      })

      this.children.bringToTop(this.resetLabel)
    }

    console.log('update test:', this.actors.length)

    this.scale.refresh()
  }
}
