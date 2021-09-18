import Phaser from 'phaser'
import Scene from './Scene'
import { AnyGroup, Position } from './types'

export default class Actor {
  container: Phaser.GameObjects.Container
  radius: number
  realRadius: number
  realPosition: Position
  scene: Scene

  constructor ({ scene, position, realPosition, radius, groups }: {
    scene: Scene
    position?: Position
    realPosition?: Position
    radius: number
    groups?: AnyGroup[]
  }) {
    this.scene = scene
    this.radius = radius
    this.realPosition = this.scene.checkRealPosition({ position, realPosition })
    this.realRadius = this.scene.getReal(this.radius)

    const realDiameter = this.realRadius * 2

    this.container = this.scene.createContainer({ position, realPosition })
    this.container.setSize(realDiameter, realDiameter)

    if (groups != null) {
      groups.forEach(group => group.add(this.container))
    } else {
      this.scene.physics.add.existing(this.container)
    }

    if ('setCircle' in this.container.body) {
      this.container.body.setCircle(this.realRadius)
    }

    this.scene.actors.push(this)
  }

  rotateTo ({ position, realPosition, rate = 0.001 }: {
    position?: Position
    realPosition?: Position
    rate?: number
  }): number {
    realPosition = this.scene.checkRealPosition({ position, realPosition })

    const radians = Phaser.Math.Angle.Between(
      this.container.x, this.container.y, realPosition.x, realPosition.y
    )
    const rotated = Phaser.Math.Angle.RotateTo(
      this.container.rotation,
      radians,
      rate * Math.PI
    )

    this.container.rotation = rotated

    return rotated
  }

  getRealPosition (): Position {
    if ('x' in this.container.body && 'y' in this.container.body) {
      const position = { x: this.container.x, y: this.container.y }

      return position
    }

    throw new Error('Actor has no body position')
  }

  update (): void {}
}
