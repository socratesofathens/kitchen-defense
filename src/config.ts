import Scene from './Scene'

export const WIDTH = 1600
export const HEIGHT = 900
export const RATIO = WIDTH / HEIGHT

const config = {
  type: Phaser.CANVAS,
  width: 1600,
  height: 900,
  physics: {
    default: 'arcade',
    arcade: {
      debug: true
    }
  },
  scene: Scene
}

export default config
