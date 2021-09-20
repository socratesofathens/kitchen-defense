import Mob from './Mob'
import Scene from './Scene'
import { Position } from './types'

export default class Enemy extends Mob {
  constructor ({ scene, position, realPosition, radius, speed }: {
    scene: Scene
    position?: Position
    realPosition?: Position
    radius: number
    color?: number
    speed?: number
  }) {
    super({
      scene,
      position,
      realPosition,
      radius,
      target: scene.sugar.realPosition,
      speed
    })

    const sprite = this.scene.add.sprite(0, 0, 'worker')
    sprite.setDisplaySize(this.realRadius * 1.65, this.realRadius * 1.65)
    this.container.add(sprite)

    this.scene.enemies.add(this.container)
  }
}
