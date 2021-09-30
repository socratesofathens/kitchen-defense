import { IonPhaser } from '@ion-phaser/react'

import GlobalStyle from './style/global'

import config from './config'
import { useEffect } from 'react'

export default function App ({ next }: {
  next?: (score: any) => any
}): JSX.Element {
  function onContinue (): () => void {
    const listener = (e: any): void => {
      console.log('detail test:', e.detail)
      next?.(e.detail)
    }
    document.addEventListener('continue', listener)

    // cleanup function
    return () => {
      document.removeEventListener('continue', listener)
    }
  }

  useEffect(onContinue)

  return (
    <>
      <GlobalStyle />

      <IonPhaser game={config} id='ion-phaser' />
    </>
  )
}
