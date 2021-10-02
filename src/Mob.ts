import Actor from './Actor'
import Scene from './Scene'
import { Position } from './types'

export default class Mob extends Actor {
  public target: Position
  public speed: number

  constructor ({
    scene, position, realPosition, radius, target, speed = 0.00015
  }: {
    scene: Scene
    position?: Position
    realPosition?: Position
    radius: number
    target: Position
    speed?: number
  }) {
    super({
      scene, position, realPosition, radius, groups: [scene.mobs]
    })

    this.target = target
    this.speed = speed

    if (this.container.body instanceof Phaser.Physics.Arcade.Body) {
      this.container.body.setBounce(1, 1)
    }
  }

  _moveTo ({ position, speed }: {
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

    this.rotateTo({ realPosition: this.target, rate: 0.01 })

    this.walk()
  }
}
