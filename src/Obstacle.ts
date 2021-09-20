import { MAXIMUM_RADIUS } from './config'
import Mob from './Mob'
import Scene from './Scene'
import { Position } from './types'

export default class Obstacle extends Mob {
  constructor ({ scene, position, target, speed = 0.00025 }: {
    scene: Scene
    position: Position
    target: Position
    speed: number
  }) {
    super({
      scene,
      position,
      radius: MAXIMUM_RADIUS,
      target,
      speed
    })
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
