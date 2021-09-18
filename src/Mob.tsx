import Scene from './Scene'

export default class Mob {
  readonly scene: Scene
  readonly shape: Phaser.GameObjects.Arc
  readonly x: number
  readonly y: number

  constructor ({ scene, x, y, radius, color }: {
    scene: Scene
    x: number
    y: number
    radius: number
    color: number
  }) {
    this.scene = scene
    this.x = x
    this.y = y

    this.shape = this.scene.createCircle({ x, y, radius, color })
    this.shape.setStrokeStyle(2, 0x000000)
    this.scene.mobs.add(this.shape)

    if (this.shape.body instanceof Phaser.Physics.Arcade.Body) {
      const realRadius = this.scene.getReal(radius)
      this.shape.body.setBounce(1, 1)
      this.shape.body.setCircle(realRadius)
      this.shape.body.collideWorldBounds = true
    }
  }

  moveTo ({ x, y, speed }: {
    x: number
    y: number
    speed: number
  }): void {
    if (this.shape.body != null) {
      const realX = this.scene.getReal(x)
      const realY = this.scene.getReal(y)
      const realSpeed = this.scene.getReal(speed)

      this.scene.physics.moveTo(this.shape, realX, realY, realSpeed)
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
