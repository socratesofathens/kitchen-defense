import Actor from './Actor'
import { RATIO } from './config'
import Scene from './Scene'
import { Position } from './types'

export default class Sugar extends Actor {
  public readonly position: Position
  public readonly realPosition: Position

  constructor (scene: Scene) {
    const radius = 0.25
    const position = { x: RATIO - radius, y: 1 - radius }
    super({
      scene, position, radius
    })
    if (this.container.body instanceof Phaser.Physics.Arcade.Body) {
      this.container.body.setImmovable()
    }

    this.position = position
    this.realPosition = this.scene.getRealPosition(position)

    const circle = this.scene.createCircle({
      position: this.scene.ORIGIN, radius: this.radius, color: 0xFFFFFF
    })
    circle.setStrokeStyle(5, 0x000000)
    this.container.add(circle)

    const text = this.scene.createText({
      position: this.scene.ORIGIN,
      content: 'SUGAR',
      color: 'black',
      fontSize: 0.1
    })
    this.container.add(text)

    const onEat = (
      sugar: Phaser.GameObjects.GameObject,
      enemy: Phaser.GameObjects.GameObject
    ): void => {
      if (!this.scene.over) {
        const newScale = this.container.scale - 0.01
        if (newScale > 0 && !this.scene.over) {
          this.container.setScale(newScale)
        } else {
          this.scene.over = true
          this.scene.createText({
            position: this.scene.CENTER,
            content: `GAME OVER\n${this.scene.kills} ANTS`,
            color: 'red',
            fontSize: 0.25
          })
        }
      }

      if (enemy instanceof Phaser.GameObjects.Container) {
        const death = { x: enemy.x, y: enemy.y }
        this.scene.createWorkers({ realPosition: death })
      } else {
        console.warn({ enemy })
        const type = typeof enemy
        console.warn({ type })

        throw new Error('Enemy is not container')
      }

      const enemyId = enemy.getData('id')
      this.scene.actors = this.scene.actors.filter(actor => {
        const id = actor.container.getData('id')
        const match = enemyId === id

        return !match
      })
      enemy.destroy()
    }

    // TODO Why does order matter?
    this.scene.physics.add.collider(this.container, this.scene.enemies, onEat)
    this.scene.physics.add.collider(this.container, this.scene.mobs)
  }
}
