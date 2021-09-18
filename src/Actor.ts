import Phaser from 'phaser'
import Scene from './Scene'
import { AnyGroup, Position } from './types'

export default class Actor {
  container: Phaser.GameObjects.Container
  radius: number
  realRadius: number
  scene: Scene

  constructor ({ scene, position, realPosition, radius, groups }: {
    scene: Scene
    position?: Position
    realPosition?: Position
    radius: number
    groups: AnyGroup[]
  }) {
    this.scene = scene
    this.radius = radius
    this.realRadius = this.scene.getReal(this.radius)

    const realDiameter = this.realRadius * 2

    this.container = this.scene.createContainer({ position, realPosition })
    this.container.setSize(realDiameter, realDiameter)

    groups.forEach(group => group.add(this.container))

    if ('setCircle' in this.container.body) {
      this.container.body.setCircle(this.realRadius)
    }
  }
}
