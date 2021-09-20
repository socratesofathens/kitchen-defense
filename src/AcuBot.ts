import { MAXIMUM_RADIUS } from './config'
import Mob from './Mob'
import Scene from './Scene'
import { Position } from './types'

export default class AcuBot extends Mob {
  public id: number
  public index: number
  public last!: Position

  constructor ({ scene, position }: {
    scene: Scene
    position: Position
  }) {
    const index = 0
    const station = scene.stationPositions[index]
    const target = scene.getRealPosition(station)

    super({
      scene,
      position,
      radius: MAXIMUM_RADIUS,
      target,
      speed: 0.00025
    })

    this.index = index
    this.id = this.scene.getId()
    this.container.setData('id', this.id)

    const base = this.scene.createCircle({
      position: this.scene.ORIGIN, radius: this.radius, color: 0x00FFFF
    })
    base.setStrokeStyle(3, 0x000000)
    this.container.add(base)

    const label = this.scene.createText({
      position: this.scene.ORIGIN, content: 'AcuBot'
    })
    this.container.add(label)

    if (this.container.body instanceof Phaser.Physics.Arcade.Body) {
      this.container.body.setMass(10000)
    } else {
      throw new Error('AcuBot has no body')
    }

    this.scene.acuBots.push(this)
    this.scene.acuBotsGroup.add(this.container)
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
