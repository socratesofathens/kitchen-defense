import { createGlobalStyle } from 'styled-components'

const GlobalStyle = createGlobalStyle`
  body, html, div { 
    margin: 0;
    padding: 0;
    box-sizing: border-box;
    background: black;
  }
  
  canvas {
    object-fit: cover
  }
`

export default GlobalStyle
