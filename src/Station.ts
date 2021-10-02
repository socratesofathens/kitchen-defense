import Static from './Static'
import Scene from './Scene'
import { Position } from './types'

export default class Station extends Static {
  public readonly label: Phaser.GameObjects.Text
  public _count = 0
  public goal = 100

  constructor ({ scene, position, realPosition }: {
    scene: Scene
    position?: Position
    realPosition?: Position
  }) {
    super({
      scene, position, realPosition, radius: 0.075
    })

    const base = this.scene.createCircle({
      position: this.scene.ORIGIN, radius: this.radius, color: 0x00FF00
    })
    base.setStrokeStyle(4, 0x000000)
    this.container.add(base)

    this.label = this.scene.createText({
      position: this.scene.ORIGIN, content: this.goal, fontSize: 0.0175, color: 'black'
    })
    this.container.add(this.label)

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

    const remainder = this.goal - this._count

    if (remainder <= 0) {
      if (this.initialPosition != null) {
        this.scene.createAcuBot(this.initialPosition)
      }

      this.goal = this.goal * 10
      this._count = 0

      this.label.setText(this.goal.toString())
    } else {
      this.label.setText(remainder.toString())
    }
  }
}
