export type AnyBody = Phaser.Physics.Arcade.Body | Phaser.Physics.Arcade.StaticBody

export type AnyGroup = Phaser.Physics.Arcade.Group | Phaser.Physics.Arcade.StaticGroup

export interface Position {
  x: number
  y: number
}

export interface Result <T, U = Phaser.GameObjects.Container> {
  value: T
  element?: U
}

export interface Size {
  width: number
  height: number
}
