import Phaser from 'phaser'
import Actor from './Actor'
import AcuBot from './AcuBot'
import Ball from './Ball'

import {
  BLOCK, HALF_HEIGHT, HALF_RATIO, HEIGHT, RATIO, TWO, SEVEN, WIDTH, FOURTEEN, SIX, THREE, TEN, FOUR, ELEVEN, MAXIMUM_DIAMETER
} from './config'
import Enemy from './Enemy'
import Mob from './Mob'
import Soldier from './Soldier'
import Station from './Station'
import Sugar from './Sugar'
import Tower from './Tower'
import { Position, Size } from './types'
import worker from './worker.png'

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
  public towersGroup!: Phaser.Physics.Arcade.StaticGroup
  public killTime = Date.now()

  public readonly CENTER: Position = { x: HALF_RATIO, y: 0.5 }
  public readonly ORIGIN: Position = { x: 0, y: 0 }
  public readonly SPACE: number = MAXIMUM_DIAMETER + 0.02

  protected REAL_CENTER!: Position

  private full = false
  private id = 0
  private queen!: Enemy
  private ready = false

  private readonly maximum = 5000

  init (): void {
    this.cameras.main.setBackgroundColor('#FFFFFF')
  }

  preload (): void {
    this.load.image('worker', worker)
  }

  create (): void {
    this.graphics = this.add.graphics()
    this.REAL_CENTER = this.getRealPosition(this.CENTER)

    this.mobs = this.physics.add.group()
    this.enemies = this.physics.add.group()
    this.soldiersGroup = this.physics.add.group()
    this.sugar = new Sugar(this)

    const position = { x: 1.3, y: 0.5 }
    this.queen = new Soldier({ scene: this, position })
    this.createWorkers({ position: this.ORIGIN })

    this.statics = this.physics.add.staticGroup()
    this.towersGroup = this.physics.add.staticGroup()

    this.setupTowers()

    this.input.on(
      Phaser.Input.Events.POINTER_UP,
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
    this.stationPositions = [bottomRight, bottomLeft, topLeft, topRight]
    const stations = this.stationPositions.map(position => new Station({
      scene: this, position
    }))

    this.acuBotsGroup = this.physics.add.group()

    const start = BLOCK * 9
    const west = BLOCK * 10
    const east = BLOCK * 11

    const top = BLOCK * 5
    const middle = BLOCK * 6
    const third = BLOCK * 7
    const base = BLOCK * 8

    this.createAcuBot({ x: start, y: top })
    this.createAcuBot({ x: start, y: middle })
    this.createAcuBot({ x: start, y: third })
    this.createAcuBot({ x: start, y: base })

    this.createAcuBot({ x: west, y: top })
    this.createAcuBot({ x: west, y: middle })
    this.createAcuBot({ x: west, y: base })

    this.createAcuBot({ x: east, y: top })
    this.createAcuBot({ x: east, y: middle })
    this.createAcuBot({ x: east, y: third })
    this.createAcuBot({ x: east, y: base })

    // const c = { x: east, y: BLOCK * 7 }
    // new AcuBot({ scene: this, position: c, letter: 'c' })

    const onNext = (
      stationContainer: Phaser.GameObjects.GameObject,
      botContainer: Phaser.GameObjects.GameObject
    ): void => {
      const last = botContainer.getData('last')
      if (stationContainer.body.position === last) {
        return
      } else {
        botContainer.setData('last', stationContainer.body.position)
      }

      const id = botContainer.getData('id')

      const bot = this.acuBots.find(bot => {
        const botId = bot.container.getData('id')
        const match = botId === id

        return match
      })

      if (bot == null) {
        throw new Error('Letter not found')
      }

      const next = bot.index + 1
      const end = stations.length
      bot.index = next % end
      const station = stations[bot.index]

      bot.target = station.getRealPosition()
    }

    this.collider = this.physics.add.collider(
      this.stations, this.acuBotsGroup, onNext
    )
    this.physics.add.collider(this.mobs, this.mobs)
    this.physics.add.collider(this.mobs, this.statics)

    new Ball({ scene: this, position: { x: 0.1, y: 0.5 } })
    new Ball({ scene: this, position: { x: 0.2, y: 0.5 } })
    new Ball({ scene: this, position: { x: 0.3, y: 0.5 } })
    new Ball({ scene: this, position: { x: 0.4, y: 0.5 } })
    new Ball({ scene: this, position: { x: 0.5, y: 0.5 } })
    new Ball({ scene: this, position: { x: 0.6, y: 0.5 } })
    new Ball({ scene: this, position: { x: 0.7, y: 0.5 } })
    new Ball({ scene: this, position: { x: 0.8, y: 0.5 } })
    new Ball({ scene: this, position: { x: 0.9, y: 0.5 } })
    new Ball({ scene: this, position: { x: 1, y: 0.5 } })
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

  createText ({ position, realPosition, content, color = 'black', fontSize }: {
    position?: Position
    realPosition?: Position
    content: string | number
    color?: string
    fontSize?: number
  }): Phaser.GameObjects.Text {
    realPosition = this.checkRealPosition({ position, realPosition })

    const style: { fontFamily: string, color?: string } = { fontFamily: 'Arial' }
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
  }): Mob {
    const currentRadians = Phaser.Math.Angle.Between(
      death.x, death.y, this.sugar.realPosition.x, this.sugar.realPosition.y
    )
    const currentDegrees = Phaser.Math.RadToDeg(currentRadians)

    const maximum = 120

    const ratio = distance / WIDTH
    const degrees = maximum * ratio

    const combinedDegrees = currentDegrees + degrees
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
      const enemiesDivisor = Math.ceil(enemiesRatio)
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
    if (enemiesLength < 100) {
      const death = this.checkRealPosition({ position, realPosition })

      const logTime = Math.log(time)
      const fraction = 3
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
    const topLeft = { x: ELEVEN, y: THREE }
    const topRight = { x: FOURTEEN, y: THREE }
    const bottomLeft = { x: TEN, y: FOUR }
    const bottomRight = { x: TEN, y: SEVEN }
    const inside = { x: ELEVEN, y: FOUR }
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

  upOrDown ({ value, offset = BLOCK, up = false }: {
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

    const vertical = this.createRangeRatio(BLOCK)
    vertical.forEach(x => this.strokeVertical(x))

    const horizontal = this.createRange(BLOCK)
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

    // console.log('delta test:', delta)
    // console.log('sum test:', sum)
    // console.log('quotient test:', quotient)
    const log = Math.log(this.firing)
    const quotient = log / 2
    // console.log('ceiling test:', ceiling)
    const base = 1.5
    const added = base + quotient

    const equal = this.firing === 1
    const greater = this.firing > 1
    const firing = equal
      ? base
      : greater
        ? added
        : 1
    console.log('firing test:', firing)
    const charge = delta / firing

    this.battery = this.battery + charge
    if (this.battery > this.maximum) {
      this.battery = this.maximum
      this.full = true
    }

    this.ready = this.full && this.open

    // this.graphics.fillStyle(0x00FFFF, 1)
    // this.fillCircle({ realPosition: this.sugar.realPosition, radius: 0.3 })

    // this.graphics.fillStyle(0xFF00FF, 1)
    // const fake = { x: 0, y: HEIGHT }
    // this.fillCircle({ realPosition: fake, radius: 0.3 })

    // this.graphics.fillStyle(0x0000FF, 1)
    // const radians = Phaser.Math.DegToRad(120)
    // const rotated = Phaser.Math.RotateAroundDistance(
    //   fake, this.sugar.realPosition.x, this.sugar.realPosition.y, radians, 400
    // )

    // this.fillCircle({ realPosition: rotated, radius: 0.1 })

    if (this.ready) {
      this.graphics.fillStyle(0x00FF00, 0.5)
    } else {
      this.graphics.fillStyle(0xFF0000, 0.5)
    }

    if (this.pointerPosition != null) {
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
    }

    this.graphics.fillPath()
  }
}
