import Actor from './Actor'
import { RATIO } from './config'
import Scene from './Scene'
import { Position } from './types'

export default class Sugar extends Actor {
  public readonly position: Position

  constructor (scene: Scene) {
    const halfRatio = RATIO / 2
    const position = { x: halfRatio, y: 0.5 }
    super({
      scene, position, radius: 0.25
    })
    if (this.container.body instanceof Phaser.Physics.Arcade.Body) {
      this.container.body.setImmovable()
    }

    this.position = position

    const circle = this.scene.createCircle({
      position: this.scene.ORIGIN, radius: this.radius, color: 0xFFFFFF
    })
    circle.setStrokeStyle(5, 0x000000)
    this.container.add(circle)

    const style = { fontFamily: 'Arial', color: 'black' }
    const text = this.scene.add.text(0, 0, 'SUGAR', style)
    text.setFontSize(75)
    text.setOrigin(0.5, 0.5)
    this.container.add(text)

    const onEat = (
      sugar: Phaser.GameObjects.GameObject,
      mob: Phaser.GameObjects.GameObject
    ): void => {
      const newScale = this.container.scale - 0.01
      if (newScale > 0) {
        this.container.setScale(newScale)

        mob.destroy()
        this.scene.createWorker()
      } else {
        console.log('game over')
      }
    }

    this.scene.physics.add.collider(
      this.container, this.scene.mobs, onEat
    )
  }
}
