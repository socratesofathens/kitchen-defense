import { IonPhaser } from '@ion-phaser/react'

import GlobalStyle from './style/global'

import config from './config'
import { useEffect, useState } from 'react'

export default function App ({ next }: {
  next?: (score: any) => any
}): JSX.Element {
  const [show, setShow] = useState(true)

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

  if (show) {
    return (
      <>
        <GlobalStyle />

        <button onClick={() => setShow(false)}>Hide</button>

        <IonPhaser game={config} initialize />
      </>
    )
  } else {
    return <button onClick={() => setShow(true)}>Show</button>
  }
}
