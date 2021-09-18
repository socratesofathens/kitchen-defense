import Phaser from 'phaser'
import Scene from './Scene'
import { Position, Result } from './types'

export default class Tower {
  private fireTime!: number
  private fireTarget!: Position
  private fireMuzzle!: Position
  private readonly range!: number
  private readonly realRange!: number
  private readonly REAL_SIZE!: number
  private readonly scene: Scene
  private readonly muzzle!: Phaser.GameObjects.Arc
  private container!: Phaser.GameObjects.Container
  private readonly tempMatrix!: Phaser.GameObjects.Components.TransformMatrix
  private readonly tempParentMatrix!: Phaser.GameObjects.Components.TransformMatrix

  readonly SIZE = 0.01

  constructor ({ scene, position, realPosition }: {
    scene: Scene
    position?: Position
    realPosition?: Position
  }) {
    this.scene = scene

    this.range = 0.5
    this.realRange = this.scene.getReal(this.range)

    this.REAL_SIZE = this.scene.getReal(this.SIZE)
    const doubleSize = this.REAL_SIZE * 2

    this.container = this.scene.createContainer({ position, realPosition })
    this.container.setSize(doubleSize, doubleSize)

    this.scene.statics.add(this.container)

    if (this.container.body instanceof Phaser.Physics.Arcade.StaticBody) {
      this.container.body.setCircle(this.REAL_SIZE)
    }

    const center = { x: 0, y: 0 }
    const base = this.scene.createCircle({
      position: center, radius: this.SIZE, color: 0xff0000
    })
    this.container.add(base)

    const origin = { x: 0, y: 0.5 }
    const size = { width: 0.024, height: 0.003 }
    const cannon = this.scene.createRectangle({
      position: center, size, color: 0xFF0000, origin
    })
    this.container.add(cannon)

    const tip = { x: 0.024, y: 0 }
    this.muzzle = this.scene.createCircle({ position: tip })
    this.container.add(this.muzzle)

    this.tempMatrix = new Phaser.GameObjects.Components.TransformMatrix()
    this.tempParentMatrix = new Phaser.GameObjects.Components.TransformMatrix()

    this.scene.towers.push(this)
  }

  attack ({ now, tracer, enemies }: {
    now: number
    tracer: Phaser.Geom.Line
    enemies: Phaser.GameObjects.Arc[]
  }): void {
    const target = this.getTarget({ line: tracer, targets: enemies })

    if (target.element != null) {
      this.fire({
        now,
        target: target.element,
        position: target.value
      })
    }
  }

  createTracer (): Phaser.Geom.Line {
    const tracer = this.scene.createLine()

    Phaser.Geom.Line.SetToAngle(
      tracer,
      this.container.x,
      this.container.y,
      this.container.rotation,
      this.realRange
    )

    return tracer
  }

  fire ({ now, target, position }: {
    now: number
    target: Phaser.GameObjects.Arc
    position: Position
  }): void {
    // TODO Let lasers kill multiple units
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

    this.scene.createWorker()

    const length = this.scene.mobs.getLength()
    if (length < 10) {
      this.scene.createWorker()
    }
  }

  getNearest (
    targets: Phaser.GameObjects.Arc[]
  ): Phaser.GameObjects.Arc | undefined {
    const closest: Result<number> = { value: Infinity }

    targets.forEach((target) => {
      const distance = Phaser.Math.Distance.Between(
        this.container.x, this.container.y, target.x, target.y
      )

      const far = distance > this.realRange
      if (far) {
        return
      }

      const radians = Phaser.Math.Angle.Between(
        this.container.x, this.container.y, target.x, target.y
      )
      const degrees = Phaser.Math.RadToDeg(radians)
      const difference = Phaser.Math.Angle.ShortestBetween(
        degrees, this.container.angle
      )
      const absolute = Math.abs(difference)

      const closer = absolute < closest.value
      if (closer) {
        closest.value = absolute
        closest.element = target
      }
    })

    return closest.element
  }

  getTarget ({ line, targets }: {
    line: Phaser.Geom.Line
    targets: Phaser.GameObjects.Arc[]
  }): Result<Position> {
    const target: Result<Position> = { value: { x: 0, y: 0 } }

    let closest = Infinity
    targets.forEach((mob) => {
      const circle = new Phaser.Geom.Circle(
        mob.x, mob.y, mob.radius
      )

      const intersection = this.scene.getLineToCircle({ line, circle })

      if (intersection == null) {
        return
      }

      const distance = Phaser.Math.Distance.Between(
        this.container.x, this.container.y, mob.x, mob.y
      )

      const closer = distance < closest
      if (closer) {
        closest = distance

        target.value = intersection
        target.element = mob
      }
    })

    return target
  }

  update (): void {
    const now = Date.now()

    const unfired = isNaN(this.fireTime)
    const fireDifference = unfired
      ? Infinity
      : now - this.fireTime

    const firing = fireDifference < 500
    if (firing) {
      this.scene.graphics.lineStyle(1, 0xFF0000, 1.0)
      this.scene.strokeLine({ realA: this.fireMuzzle, realB: this.fireTarget })
    }
    const mobs = this.scene.mobs.getChildren() as Phaser.GameObjects.Arc[]

    this.scene.graphics.fillStyle(0x0000FF)
    const nearest = this.getNearest(mobs)

    if (nearest != null) {
      const tracer = this.createTracer()
      const recharged = fireDifference > 2000
      if (recharged) {
        this.attack({ now, tracer, enemies: mobs })

        this.scene.graphics.lineStyle(1, 0x00FF00, 1.0)
      } else {
        this.scene.graphics.lineStyle(1, 0x00FFFF, 1.0)
      }

      if (!firing) {
        this.scene.graphics.strokeLineShape(tracer)

        const radians = Phaser.Math.Angle.Between(
          this.container.x, this.container.y, nearest.x, nearest.y
        )

        const rotated = Phaser.Math.Angle.RotateTo(
          this.container.rotation,
          radians,
          0.001 * Math.PI
        )

        this.container.rotation = rotated
      }
    }
  }
}
