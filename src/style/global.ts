import { createGlobalStyle } from 'styled-components'

const GlobalStyle = createGlobalStyle`
  body, html, div { 
    margin: 0;
    padding: 0;
    box-sizing: border-box;
    background: black;
  }
  
  ion-phaser { 
    width: 100vw !important;
    height: 100vh !important;
  }  

  canvas {
    object-fit: cover
  }
`

export default GlobalStyle
