import { IonPhaser } from '@ion-phaser/react'

import GlobalStyle from './style/global'

import config from './config'

export default function App (): JSX.Element {
  return (
    <>
      <GlobalStyle />

      <IonPhaser game={config} initialize />
    </>
  )
}
