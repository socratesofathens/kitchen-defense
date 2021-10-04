import Mob from './Mob'
import Scene from './Scene'
import { Position } from './types'

export default class Enemy extends Mob {
  constructor ({
    scene, position, realPosition, radius, speed = 0.000125, image = 'worker'
  }: {
    scene: Scene
    position?: Position
    realPosition?: Position
    radius: number
    color?: number
    speed?: number
    image?: string
  }) {
    super({
      scene,
      position,
      realPosition,
      radius,
      target: scene.sugar.realPosition,
      speed
    })

    const sprite = this.scene.add.sprite(0, 0, image)
    sprite.setDisplaySize(this.realRadius * 2, this.realRadius * 2)
    this.container.add(sprite)

    this.scene.enemies.add(this.container)
  }

  update ({ now, delta }: {
    now: number
    delta: number
  }): void {
    super.update({ now, delta })
  }
}
