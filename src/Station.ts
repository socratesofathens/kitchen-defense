import Static from './Static'
import Scene from './Scene'
import { Position } from './types'

export default class Station extends Static {
  constructor ({ scene, position, realPosition }: {
    scene: Scene
    position?: Position
    realPosition?: Position
  }) {
    super({
      scene, position, realPosition, radius: 0.1
    })

    const base = this.scene.createCircle({
      position: this.scene.ORIGIN, radius: this.radius, color: 0x0000FF
    })
    base.setStrokeStyle(5, 0x000000)
    this.container.add(base)

    this.scene.stations.add(this.container)
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

      const margin = this.scene.SPACE + this.radius
      const realSpace = this.scene.getReal(margin)
      if (distance < realSpace) {
        this.scene.open = false

        this.scene.graphics.fillStyle(0xFFFF00)
        this.scene.fillCircle({
          realPosition: this.realPosition, radius: margin
        })
      }
    }
  }
}
