import Mob from './Mob'
import Tower from './Tower'
import { Position } from './types'
import Phaser from 'phaser'
import { HEIGHT, RATIO } from './config'

export default class Scene extends Phaser.Scene {
  public graphics!: Phaser.GameObjects.Graphics
  public mobs!: Phaser.Physics.Arcade.Group
  public ORIGIN: Position = { x: 0, y: 0 }
  public statics!: Phaser.Physics.Arcade.StaticGroup
  public readonly towers: Tower[] = []

  private readonly building!: Phaser.GameObjects.Arc
  private fireTime!: number
  private fireTarget!: Position
  private fireMuzzle!: Position
  private readonly gun!: Phaser.GameObjects.Rectangle
  private queen!: Mob
  private range!: number
  private realRange!: number
  private REAL_SIZE!: number
  private readonly muzzle!: Phaser.GameObjects.Arc
  private tower!: Tower
  private readonly tempMatrix!: Phaser.GameObjects.Components.TransformMatrix
  private readonly tempParentMatrix!: Phaser.GameObjects.Components.TransformMatrix

  readonly SIZE = 0.01

  init (): void {
    this.cameras.main.setBackgroundColor('#FFFFFF')
  }

  create (): void {
    this.graphics = this.add.graphics()
    this.range = 0.5
    this.realRange = this.getReal(this.range)

    this.mobs = this.physics.add.group()
    this.queen = new Mob({
      scene: this, x: 0.150, y: 0.4, radius: 0.05, color: 0x000000
    })
    const worker = this.createWorker()
    worker.setVelocity({ x: -0.175, y: 0.1 })

    this.physics.add.collider(this.mobs, this.mobs)

    this.REAL_SIZE = this.getReal(this.SIZE)

    this.statics = this.physics.add.staticGroup()
    this.physics.add.collider(this.statics, this.mobs)

    this.tower = new Tower({ scene: this, x: 0.5, y: 0.5 })

    this.input.on(
      Phaser.Input.Events.POINTER_UP,
      (pointer: Phaser.Input.Pointer) => {
        const { worldX, worldY } = pointer

        new Tower({ scene: this, realX: worldX, realY: worldY })
      })

    this.events.on(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.input.off(Phaser.Input.Events.POINTER_UP)
    })
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

  checkRealPosition ({ value, real }: {
    value?: Position
    real?: Position
  }): Position {
    return this.checkReal({ value, real, getter: this.getRealPosition })
  }

  createContainer ({ x, y, realX, realY }: {
    x?: number
    y?: number
    realX?: number
    realY?: number
  }): Phaser.GameObjects.Container {
    realX = this.checkRealNumber({ value: x, real: realX })
    realY = this.checkRealNumber({ value: y, real: realY })

    const container = this.add.container(realX, realY)

    return container
  }

  createCircle ({ x, y, radius, color, realX, realY }: {
    x: number
    y: number
    realX?: number
    realY?: number
    radius?: number
    color?: number
  }): Phaser.GameObjects.Arc {
    realX = this.checkRealNumber({ value: x, real: realX })
    realY = this.checkRealNumber({ value: y, real: realY })

    if (radius != null) {
      radius = this.getReal(radius)
    }

    const circle = this.add.circle(realX, realY, radius, color)

    return circle
  }

  createLine ({ a, b, realA, realB }: {
    a?: Position
    b?: Position
    realA?: Position
    realB?: Position
  } = { realA: this.ORIGIN, realB: this.ORIGIN }): Phaser.Geom.Line {
    realA = this.checkRealPosition({ value: a, real: realA })
    realB = this.checkRealPosition({ value: b, real: realB })

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

  createRectangle ({ x, y, width, height, color, realX, realY }: {
    x: number
    y: number
    width: number
    height: number
    color: number
    realX?: number
    realY?: number
  }): Phaser.GameObjects.Rectangle {
    realX = this.checkRealNumber({ value: x, real: realX })
    realY = this.checkRealNumber({ value: y, real: realY })

    const realWidth = this.getReal(width)
    const realHeight = this.getReal(height)

    const rectangle = this.add.rectangle(
      realX, realY, realWidth, realHeight, color
    )

    return rectangle
  }

  createWorker (): Mob {
    const x = Math.random()
    const y = Math.random()

    const worker = new Mob({
      scene: this, x, y, radius: 0.01, color: 0x000000
    })

    const dX = Math.random()
    const vX = (dX / 3) + 0.1

    const dY = Math.random()
    const vY = (dY / 3) + 0.1

    worker.setVelocity({ x: vX, y: vY })

    return worker
  }

  fillCircle ({ x, y, radius, realX, realY, realRadius }: {
    x?: number
    y?: number
    radius?: number
    realX?: number
    realY?: number
    realRadius?: number
  }): void {
    realX = this.checkRealNumber({ value: x, real: realX })
    realY = this.checkRealNumber({ value: y, real: realY })
    realRadius = this.checkRealNumber({ value: radius, real: realRadius })

    this.graphics.fillCircle(realX, realY, realRadius)
  }

  fire ({ now, target, position }: {
    now: number
    target: Phaser.GameObjects.Arc
    position: Position
  }): void {
    this.fireTime = now
    this.fireTarget = position

    this.muzzle.getWorldTransformMatrix(
      this.tempMatrix, this.tempParentMatrix
    )
    const decomposed: any = this.tempMatrix.decomposeMatrix()
    this.fireMuzzle = {
      x: decomposed.translateX, y: decomposed.translateY
    }

    target.destroy()

    this.createWorker()

    const length = this.mobs.getLength()
    if (length < 10) {
      this.createWorker()
    }
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

    this.queen.moveTo({ x: 0.5, y: 0.5, speed: 0.01 })

    this.towers.forEach(tower => {
      tower.update()
    })
  }
}
