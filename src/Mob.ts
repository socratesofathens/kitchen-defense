import Actor from './Actor'
import Scene from './Scene'
import { Position } from './types'

export default class Mob extends Actor {
  private readonly speed = 0.0001

  constructor ({ scene, position, realPosition, radius, color = 0xFFFFFF }: {
    scene: Scene
    position?: Position
    realPosition?: Position
    radius: number
    color?: number
  }) {
    super({
      scene, position, realPosition, radius, groups: [scene.mobs]
    })

    const shape = this.scene.createCircle({
      position: this.scene.ORIGIN, radius, color
    })
    shape.setStrokeStyle(2, 0x000000)
    this.container.add(shape)

    const sprite = this.scene.add.sprite(0, 0, 'worker')
    sprite.setDisplaySize(this.realRadius * 1.4, this.realRadius * 1.4)
    this.container.add(sprite)

    if (this.container.body instanceof Phaser.Physics.Arcade.Body) {
      this.container.body.setBounce(10, 10)
    }
  }

  moveTo ({ position, speed }: {
    position: Position
    speed: number
  }): void {
    if (this.container.body != null) {
      const realPosition = this.scene.getRealPosition(position)
      const realSpeed = this.scene.getReal(speed)

      this.scene.physics.moveTo(
        this.container, realPosition.x, realPosition.y, realSpeed
      )
    }
  }

  setVelocity ({ velocity, realVelocity }: {
    velocity?: Position
    realVelocity?: Position
  }): void {
    if (this.container.body != null) {
      realVelocity = this.scene.checkRealPosition({
        position: velocity, realPosition: realVelocity
      })

      this.container.body.velocity.x = realVelocity.x
      this.container.body.velocity.y = realVelocity.y
    }
  }

  walk (): void {
    const realSpeed = this.scene.getReal(this.speed)
    const velocity = this.scene.physics.velocityFromAngle(
      this.container.angle, realSpeed
    )

    this.setVelocity({ velocity })
  }

  update ({ now, delta }: {
    now: number
    delta: number
  }): void {
    super.update({ now, delta })

    this.rotateTo({ realPosition: this.scene.sugar.realPosition, rate: 0.01 })

    this.walk()
  }
}
