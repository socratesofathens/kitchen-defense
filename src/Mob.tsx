import Actor from './Actor'
import Scene from './Scene'
import { Position } from './types'

export default class Mob extends Actor {
  constructor ({ scene, position, radius, color = 0xFFFFFF }: {
    scene: Scene
    position: Position
    radius: number
    color?: number
  }) {
    super({
      scene, position, radius, groups: [scene.mobs]
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
      this.container.body.setBounce(1, 1)
      this.container.body.collideWorldBounds = true
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

  setVelocity ({ x, y }: {
    x: number
    y: number
  }): void {
    const realX = this.scene.getReal(x)
    const realY = this.scene.getReal(y)

    this.container.body.velocity.x = realX
    this.container.body.velocity.y = realY
  }
}
