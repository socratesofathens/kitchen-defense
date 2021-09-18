import Phaser from 'phaser'
import Actor from './Actor'

import { HALF_RATIO, HEIGHT, RATIO } from './config'
import Mob from './Mob'
import Sugar from './Sugar'
import Tower from './Tower'
import { Position, Size } from './types'
import worker from './worker.png'

export default class Scene extends Phaser.Scene {
  public CENTER: Position = { x: HALF_RATIO, y: 0.5 }
  public graphics!: Phaser.GameObjects.Graphics
  public mobs!: Phaser.Physics.Arcade.Group
  public ORIGIN: Position = { x: 0, y: 0 }
  public REAL_CENTER!: Position
  public statics!: Phaser.Physics.Arcade.StaticGroup
  public sugar!: Sugar
  public over = false

  public readonly actors: Actor[] = []

  private queen!: Mob

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
    const position = { x: 0.1, y: 0.1 }
    this.queen = new Mob({ scene: this, position, radius: 0.05 })
    this.createWorker()

    this.physics.add.collider(this.mobs, this.mobs)

    this.statics = this.physics.add.staticGroup()

    this.setupTowers()

    this.input.on(
      Phaser.Input.Events.POINTER_UP,
      (pointer: Phaser.Input.Pointer) => {
        if (!this.over) {
          const realPosition = { x: pointer.worldX, y: pointer.worldY }

          this.createTower({ realPosition })
        }
      }
    )

    this.events.on(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.input.off(Phaser.Input.Events.POINTER_UP)
    })

    this.sugar = new Sugar(this)
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

  createText ({ position, realPosition, content, color, fontSize }: {
    position?: Position
    realPosition?: Position
    content: string
    color: string
    fontSize: number
  }): Phaser.GameObjects.Text {
    realPosition = this.checkRealPosition({ position, realPosition })
    const realFontSize = this.getReal(fontSize)

    const style = { fontFamily: 'Arial', color }
    const text = this.add.text(realPosition.x, realPosition.y, content, style)
    text.setFontSize(realFontSize)
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

  createWorker (): Mob {
    const x = Math.random() * RATIO
    const y = Math.random()

    const position = { x, y }
    const worker = new Mob({ scene: this, position, radius: 0.01 })

    return worker
  }

  fillCircle ({ position, radius, realPosition, realRadius }: {
    position?: Position
    realPosition?: Position
    radius?: number
    realRadius?: number
  }): void {
    realPosition = this.checkRealPosition({ position, realPosition })
    realRadius = this.checkRealNumber({ value: radius, real: realRadius })

    this.graphics.fillCircle(realPosition.x, realPosition.y, realRadius)
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
    const right = RATIO - 0.5

    const topLeft = { x: 0.5, y: 0.1 }
    const topRight = { x: right, y: 0.1 }
    const bottomLeft = { x: 0.5, y: 0.9 }
    const bottomRight = { x: right, y: 0.9 }
    const positions = [topLeft, topRight, bottomLeft, bottomRight]

    positions.forEach(position => this.createTower({ position }))
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

  update (): void {
    this.graphics.clear()

    const vertical = this.createRangeRatio(0.2)
    vertical.forEach(x => this.strokeVertical(x))

    const horizontal = this.createRange(0.2)
    horizontal.forEach(y => this.strokeHorizontal(y))

    this.actors.forEach(actor => {
      actor.update()
    })
  }
}
