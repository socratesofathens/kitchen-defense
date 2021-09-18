export interface Position {
  x: number
  y: number
}

export interface Result <T> {
  value: T
  element?: Phaser.GameObjects.Arc
}

export interface Size {
  width: number
  height: number
}
