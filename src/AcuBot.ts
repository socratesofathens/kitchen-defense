import Obstacle from './Obstacle'
import Scene from './Scene'
import { Position } from './types'

export default class AcuBot extends Obstacle {
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
      position: this.scene.ORIGIN, content: 'AcuBot', fontSize: 0.0125
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
}
