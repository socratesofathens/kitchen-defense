import Scene from './Scene'
import { Position } from './types'

export default class Mob {
  readonly scene: Scene
  readonly shape: Phaser.GameObjects.Arc

  constructor ({ scene, position, radius, color }: {
    scene: Scene
    position: Position
    radius: number
    color: number
  }) {
    this.scene = scene

    this.shape = this.scene.createCircle({ position, radius, color })
    this.shape.setStrokeStyle(2, 0x000000)
    this.scene.mobs.add(this.shape)

    if (this.shape.body instanceof Phaser.Physics.Arcade.Body) {
      const realRadius = this.scene.getReal(radius)
      this.shape.body.setBounce(1, 1)
      this.shape.body.setCircle(realRadius)
      this.shape.body.collideWorldBounds = true
    }
  }

  moveTo ({ position, speed }: {
    position: Position
    speed: number
  }): void {
    if (this.shape.body != null) {
      const realPosition = this.scene.getRealPosition(position)
      const realSpeed = this.scene.getReal(speed)

      this.scene.physics.moveTo(
        this.shape, realPosition.x, realPosition.y, realSpeed
      )
    }
  }

  setVelocity ({ x, y }: {
    x: number
    y: number
  }): void {
    const realX = this.scene.getReal(x)
    const realY = this.scene.getReal(y)

    this.shape.body.velocity.x = realX
    this.shape.body.velocity.y = realY
  }
}
