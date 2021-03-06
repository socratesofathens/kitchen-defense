import Enemy from './Enemy'
import Scene from './Scene'
import Tower from './Tower'
import { Position, Result } from './types'

export default class Soldier extends Enemy {
  constructor ({
    scene, position, realPosition, radius = 0.015, speed = 0.0000625
  }: {
    scene: Scene
    position?: Position
    realPosition?: Position
    radius?: number
    speed?: number
  }) {
    super({
      scene,
      position,
      realPosition,
      radius,
      speed,
      image: 'soldier'
    })

    this.container.setData('soldier', true)

    this.scene.soldiersGroup.add(this.container)
  }

  getNearest (): Tower | undefined {
    const closest: Result<number, Tower> = { value: Infinity }

    this.scene.towers.forEach((tower) => {
      const distance = Phaser.Math.Distance.Between(
        this.container.x,
        this.container.y,
        tower.realPosition.x,
        tower.realPosition.y
      )

      const closer = distance < closest.value
      if (closer) {
        closest.value = distance
        closest.element = tower
      }
    })

    return closest.element
  }

  update ({ now, delta }: {
    now: number
    delta: number
  }): void {
    const nearest = this.getNearest()

    if (nearest != null) {
      this.target = nearest.realPosition
    }

    super.update({ now, delta })
  }
}
