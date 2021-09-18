import Scene from './Scene'

export const WIDTH = 1600
export const HALF_WIDTH = WIDTH / 2

export const HEIGHT = 900
export const HALF_HEIGHT = HEIGHT / 2

export const RATIO = WIDTH / HEIGHT
export const HALF_RATIO = RATIO / 2

const config = {
  type: Phaser.CANVAS,
  width: 1600,
  height: 900,
  physics: {
    default: 'arcade'
  },
  scene: Scene
}

export default config
