import Obstacle from './Obstacle'
import Scene from './Scene'
import { Position } from './types'

export default class AcuBot extends Obstacle {
  public base: Phaser.GameObjects.Arc
  public id: number
  public index: number
  public last!: Position
  public ready: boolean
  public killTime: number
  public time?: number

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
      speed: 0.00033
    })

    this.rotateToFully({ realPosition: target })

    this.ready = true
    this.killTime = 0

    this.index = index
    this.id = this.scene.getId()
    this.container.setData('id', this.id)

    this.base = this.scene.createCircle({
      position: this.scene.ORIGIN, radius: this.radius, color: 0x00FF00
    })
    this.base.setStrokeStyle(3, 0x000000)
    this.container.add(this.base)

    const label = this.scene.createText({
      position: this.scene.ORIGIN, content: 'AcuBot', fontSize: 0.01
    })
    this.container.add(label)

    if (this.container.body instanceof Phaser.Physics.Arcade.Body) {
      this.container.body.setMass(10000)
    } else {
      throw new Error('AcuBot has no body')
    }

    this.container.setData('acuBot', this)

    this.scene.acuBots.push(this)
    this.scene.acuBotsGroup.add(this.container)
  }

  update ({ now, delta }: {
    now: number
    delta: number
  }): void {
    super.update({ now, delta })

    if (this.time != null) {
      const difference = Date.now() - this.time
      if (difference > 10000) {
        const next = this.index + 1
        const end = this.scene.stationPositions.length
        this.index = next % end
        const station = this.scene.stationPositions[this.index]

        this.time = Date.now()

        this.target = this.scene.getRealPosition(station)
      }
    }

    if (this.killTime > 0) {
      const now = Date.now()
      const killDifference = now - this.killTime

      const killing = killDifference < 1000
      if (killing) {
        this.base.setFillStyle(0xFF0000)

        this.scene.firing = this.scene.firing + 1

        if (this.scene.pointerPosition != null) {
          this.scene.graphics.lineStyle(1, 0xff0000, 0.5)
          this.scene.strokeLine({
            realA: this.getRealPosition(), realB: this.scene.pointerPosition
          })
        }
      } else {
        this.ready = false

        this.base.setFillStyle(0x00FFFF)
      }

      const waited = killDifference > 10000
      if (waited) {
        this.ready = true

        this.base.setFillStyle(0x00FF00)
      }
    }

    this.scene.graphics.fillStyle(0x00FF00, 0.5)
    this.scene.fillCircle({ realPosition: this.target })
  }
}
