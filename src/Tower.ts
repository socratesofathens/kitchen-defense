import Phaser from 'phaser'
import Static from './Static'
import { HEIGHT, WIDTH } from './config'
import Scene from './Scene'
import { Position, Result } from './types'

export default class Tower extends Static {
  private fireTime!: number
  private unfired = true

  private readonly laserTime = 5000
  private readonly muzzle!: Phaser.GameObjects.Arc
  private readonly range!: number
  private readonly realRange!: number
  private readonly rechargeTime = 10000
  private readonly tempMatrix!: Phaser.GameObjects.Components.TransformMatrix
  private readonly tempParentMatrix!: Phaser.GameObjects.Components.TransformMatrix

  constructor ({ scene, position, realPosition }: {
    scene: Scene
    position?: Position
    realPosition?: Position
  }) {
    super({
      scene, position, realPosition, radius: 0.01
    })

    const id = this.scene.getId()
    this.container.setData('id', id)

    this.range = this.scene.SPACE * 3
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

    this.rotateToFullyBack({ realPosition: this.scene.sugar.realPosition })

    this.scene.towers.push(this)
    this.scene.towersGroup.add(this.container)
  }

  attack ({ now, tracer, enemies }: {
    now: number
    tracer: Phaser.Geom.Line
    enemies: Phaser.GameObjects.Container[]
  }): void {
    const target = this.getTarget({ line: tracer, targets: enemies })

    if (target.element != null) {
      this.fire({ now, tracer })
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

  fire ({ now, tracer }: {
    now: number
    tracer: Phaser.Geom.Line
  }): void {
    this.fireTime = now

    this.unfired = false
  }

  getMuzzle (): Position {
    this.muzzle.getWorldTransformMatrix(
      this.tempMatrix, this.tempParentMatrix
    )
    const decomposed: any = this.tempMatrix.decomposeMatrix()
    const position = {
      x: decomposed.translateX, y: decomposed.translateY
    }

    return position
  }

  getIntersection ({ line, container }: {
    line: Phaser.Geom.Line
    container: Phaser.GameObjects.Container
  }): Position | undefined {
    const radius = container.width / 2
    const circle = new Phaser.Geom.Circle(
      container.x, container.y, radius
    )

    const intersection = this.scene.getLineToCircle({ line, circle })

    return intersection
  }

  getNearest (
    targets: Phaser.GameObjects.Container[]
  ): Phaser.GameObjects.Container | undefined {
    const closest: Result<number> = { value: Infinity }

    targets.forEach((target) => {
      const left = target.x < 0
      const right = target.x > WIDTH
      const top = target.y < 0
      const bottom = target.y > HEIGHT
      if (left || right || top || bottom) {
        return
      }

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
    targets: Phaser.GameObjects.Container[]
  }): Result<Position, Phaser.GameObjects.Container> {
    const target: Result<Position> = {
      value: { x: 0, y: 0 }
    }

    let closest = Infinity
    targets.forEach((container) => {
      const left = container.x < 0
      const right = container.x > WIDTH
      const top = container.y < 0
      const bottom = container.y > HEIGHT
      if (left || right || top || bottom) {
        return
      }
      const intersection = this.getIntersection({ line, container })
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

  kill ({ tracer, enemies, now }: {
    tracer: Phaser.Geom.Line
    enemies: Phaser.GameObjects.Container[]
    now: number
  }): void {
    enemies.forEach((container) => {
      const intersection = this.getIntersection({ line: tracer, container })
      if (intersection == null) {
        return
      }

      const realPosition = { x: container.x, y: container.y }
      const time = now - this.scene.killTime
      this.scene.killTime = now

      this.scene.createWorkers({ realPosition, time })

      const containerId = container.getData('id')
      this.scene.actors = this.scene.actors.filter(actor => {
        const id = actor.container.getData('id')
        const match = containerId === id

        return !match
      })
      const isSoldier: boolean = container.getData('solider')
      console.log('isSoldier test:', isSoldier)

      if (isSoldier) {
        this.scene.soldiers = this.scene.soldiers + 1
      } else {
        this.scene.workers = this.scene.workers + 1
      }
      container.destroy()
    })
  }

  update ({ now, delta }: {
    now: number
    delta: number
  }): void {
    super.update({ now, delta })

    if (this.scene.pointerPosition != null) {
      const distance = Phaser.Math.Distance.Between(
        this.realPosition.x,
        this.realPosition.y,
        this.scene.pointerPosition.x,
        this.scene.pointerPosition.y
      )

      const realSpace = this.scene.getReal(this.scene.SPACE)
      if (distance < realSpace) {
        this.scene.open = false

        this.scene.graphics.fillStyle(0xFFFF00)
        this.scene.fillCircle({
          realPosition: this.realPosition, radius: this.scene.SPACE
        })
      }
    }

    const fireDifference = this.unfired
      ? Infinity
      : now - this.fireTime

    const tracer = this.createTracer()
    const enemies = this
      .scene
      .enemies
      .getChildren() as Phaser.GameObjects.Container[]

    if (this.scene.pointerPosition != null) {
      const distance = Phaser.Math.Distance.Between(
        this.realPosition.x,
        this.realPosition.y,
        this.scene.pointerPosition.x,
        this.scene.pointerPosition.y
      )

      const realSpace = this.scene.getReal(this.scene.SPACE)
      if (distance < realSpace) {
        this.scene.open = false

        this.scene.graphics.fillStyle(0xFFFF00)
        this.scene.fillCircle({
          realPosition: this.realPosition, radius: this.scene.SPACE
        })
      }
    }

    this.scene.graphics.fillStyle(0x0000FF)
    const nearest = this.getNearest(enemies)

    if (nearest != null) {
      const realPosition = { x: nearest.x, y: nearest.y }
      this.rotateTo({ realPosition, rate: 0.005 })
    }

    const firing = fireDifference < this.laserTime
    if (firing) {
      this.scene.firing = this.scene.firing + 1
      this.kill({ tracer, enemies, now })

      this.scene.graphics.lineStyle(1, 0xFF0000, 1.0)
      this.scene.graphics.strokeLineShape(tracer)

      this.scene.graphics.lineStyle(1, 0xFF0000, 0.25)
      if (this.realPosition == null) {
        throw new Error('Tower has no real position')
      }
      if (this.scene.pointerPosition != null) {
        this.scene.strokeLine({
          realA: this.realPosition, realB: this.scene.pointerPosition
        })
      }
    } else if (nearest != null) {
      const recharged = fireDifference > this.rechargeTime
      if (recharged) {
        this.attack({ now, tracer, enemies })

        this.scene.graphics.lineStyle(1, 0x00FF00, 1.0)
      } else {
        this.scene.graphics.lineStyle(1, 0x00FFFF, 1.0)
      }

      this.scene.graphics.strokeLineShape(tracer)
    }
  }
}
