import { MAXIMUM_RADIUS } from './config'
import Mob from './Mob'
import Scene from './Scene'
import { Position } from './types'

export default class Ball extends Mob {
  constructor ({ scene, position, scale = 1 }: {
    scene: Scene
    position: Position
    scale: number
  }) {
    const radius = MAXIMUM_RADIUS * scale
    super({
      scene,
      position,
      radius,
      target: scene.ORIGIN,
      speed: 0
    })

    if (this.container.body instanceof Phaser.Physics.Arcade.Body) {
      this.container.body.collideWorldBounds = true
    }

    const base = this.scene.createCircle({
      position: this.scene.ORIGIN, radius: this.radius, color: 0x808080
    })
    base.setStrokeStyle(3, 0x000000)
    this.container.add(base)

    const fontSize = 0.0125 * scale
    const label = this.scene.createText({
      position: this.scene.ORIGIN, content: 'Debris', fontSize
    })
    this.container.add(label)

    label.rotation = label.rotation + Math.PI
  }

  update ({ now, delta }: {
    now: number
    delta: number
  }): void {
    super.update({ now, delta })

    const realPosition = this.getRealPosition()

    if (this.scene.pointerPosition != null) {
      const distance = Phaser.Math.Distance.Between(
        realPosition.x,
        realPosition.y,
        this.scene.pointerPosition.x,
        this.scene.pointerPosition.y
      )

      const margin = this.scene.SPACE + this.radius
      const realSpace = this.scene.getReal(margin)
      if (distance < realSpace) {
        this.scene.open = false

        this.scene.graphics.fillStyle(0xFFFF00)
        this.scene.fillCircle({
          realPosition, radius: margin
        })
      }
    }
  }
}
