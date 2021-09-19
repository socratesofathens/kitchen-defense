import Phaser from 'phaser'
import Actor from './Actor'
import { HEIGHT, WIDTH } from './config'
import Scene from './Scene'
import { Position, Result } from './types'

export default class Tower extends Actor {
  private fireTime!: number
  private fireTarget!: Position
  private fireMuzzle!: Position
  private unfired = true

  private readonly range!: number
  private readonly realRange!: number
  private readonly rechargeTime = 2000
  private readonly muzzle!: Phaser.GameObjects.Arc
  private readonly tempMatrix!: Phaser.GameObjects.Components.TransformMatrix
  private readonly tempParentMatrix!: Phaser.GameObjects.Components.TransformMatrix

  constructor ({ scene, position, realPosition }: {
    scene: Scene
    position?: Position
    realPosition?: Position
  }) {
    super({
      scene, position, realPosition, radius: 0.01, groups: [scene.statics]
    })

    this.range = 0.5
    this.realRange = this.scene.getReal(this.range)
    this.fireTime = Date.now()

    const base = this.scene.createCircle({
      position: this.scene.ORIGIN, radius: this.radius, color: 0xff0000
    })
    this.container.add(base)

    const origin = { x: 0, y: 0.5 }
    const size = { width: 0.024, height: 0.003 }
    const cannon = this.scene.createRectangle({
      position: this.scene.ORIGIN, size, color: 0xFF0000, origin
    })
    this.container.add(cannon)

    const tip = { x: 0.024, y: 0 }
    this.muzzle = this.scene.createCircle({ position: tip })
    this.container.add(this.muzzle)

    this.tempMatrix = new Phaser.GameObjects.Components.TransformMatrix()
    this.tempParentMatrix = new Phaser.GameObjects.Components.TransformMatrix()
  }

  attack ({ now, tracer, enemies }: {
    now: number
    tracer: Phaser.Geom.Line
    enemies: Phaser.GameObjects.Container[]
  }): void {
    const target = this.getTarget({ line: tracer, targets: enemies })

    if (target.element != null) {
      this.fire({
        now,
        target: target.element,
        realPosition: target.value
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

  fire ({ now, target, realPosition }: {
    now: number
    target: Phaser.GameObjects.Container
    realPosition: Position
  }): void {
    const time = now - this.fireTime

    // TODO Let lasers kill multiple units
    this.fireTime = now
    this.fireTarget = realPosition

    this.muzzle.getWorldTransformMatrix(
      this.tempMatrix, this.tempParentMatrix
    )
    const decomposed: any = this.tempMatrix.decomposeMatrix()
    this.fireMuzzle = {
      x: decomposed.translateX, y: decomposed.translateY
    }

    target.destroy()

    this.scene.spendBattery(100)

    this.scene.createWorkers({ realPosition, time })

    this.unfired = false
  }

  getNearest (
    targets: Phaser.GameObjects.Container[]
  ): Phaser.GameObjects.Container | undefined {
    const closest: Result<number> = { value: Infinity }

    targets.forEach((target) => {
      const distance = Phaser.Math.Distance.Between(
        this.container.x, this.container.y, target.x, target.y
      )

      const left = target.x < 0
      const right = target.x > WIDTH
      const top = target.y < 0
      const bottom = target.y > HEIGHT
      if (left || right || top || bottom) {
        return
      }

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
    targets: Phaser.GameObjects.Container[]
  }): Result<Position, Phaser.GameObjects.Container> {
    const target: Result<Position> = {
      value: { x: 0, y: 0 }
    }

    let closest = Infinity
    targets.forEach((container) => {
      const radius = container.width / 2
      const circle = new Phaser.Geom.Circle(
        container.x, container.y, radius
      )

      const intersection = this.scene.getLineToCircle({ line, circle })

      if (intersection == null) {
        return
      }

      const distance = Phaser.Math.Distance.Between(
        this.container.x, this.container.y, container.x, container.y
      )

      const closer = distance < closest
      if (closer) {
        closest = distance

        target.value = intersection
        target.element = container
      }
    })

    return target
  }

  update (): void {
    super.update()

    const now = Date.now()

    const fireDifference = this.unfired
      ? Infinity
      : now - this.fireTime

    const firing = fireDifference < 500
    if (firing) {
      this.scene.graphics.lineStyle(1, 0xFF0000, 1.0)
      this.scene.strokeLine({ realA: this.fireMuzzle, realB: this.fireTarget })

      this.scene.graphics.lineStyle(1, 0xFF0000, 0.1)
      if (this.scene.pointerPosition != null) {
        this.scene.strokeLine({
          realA: this.realPosition, realB: this.scene.pointerPosition
        })
      }
    }
    const mobs = this.scene.mobs.getChildren() as Phaser.GameObjects.Container[]

    this.scene.graphics.fillStyle(0x0000FF)
    const nearest = this.getNearest(mobs)

    const waiting = !firing
    if (waiting && nearest != null) {
      const realPosition = { x: nearest.x, y: nearest.y }
      this.rotateTo({ realPosition })

      const tracer = this.createTracer()
      const recharged = fireDifference > this.rechargeTime
      if (recharged) {
        this.attack({ now, tracer, enemies: mobs })

        this.scene.graphics.lineStyle(1, 0x00FF00, 1.0)
      } else {
        this.scene.graphics.lineStyle(1, 0x00FFFF, 1.0)
      }

      this.scene.graphics.strokeLineShape(tracer)
    }
  }
}
