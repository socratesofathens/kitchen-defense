import { createGlobalStyle } from 'styled-components'

import { RATIO } from '../config'

import { Size } from '../types'

function getSize (): Size {
  if (RATIO > 1) {
    const width = 98
    const height = width / RATIO

    const wideSize = { width, height }

    return wideSize
  }

  const height = 90
  const width = height / RATIO

  const highSize = { width, height }

  return highSize
}

const size = getSize()

const GlobalStyle = createGlobalStyle`
  body, html, div, ion-phaser { 
    margin: 0;
    padding: 0;
    box-sizing: border-box;
    background: black;
  }

  canvas {
    margin: 1vmin auto;
    width: ${size.width}vmax;
    height: ${size.height}vmax;
    display: block;
  }
`

export default GlobalStyle
