import Actor from './Actor'
import Scene from './Scene'
import { Position } from './types'

export default class Static extends Actor {
  public readonly realPosition!: Position

  constructor ({ scene, position, realPosition, radius }: {
    scene: Scene
    position?: Position
    realPosition?: Position
    radius: number
  }) {
    super({
      scene, position, realPosition, radius, groups: [scene.statics]
    })

    this.realPosition = this.getRealPosition()
  }
}
