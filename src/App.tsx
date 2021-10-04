import { IonPhaser } from '@ion-phaser/react'

import GlobalStyle from './style/global'

import { useEffect, useState } from 'react'
import Scene from './Scene'

export default function App ({ next }: {
  next?: (score: any) => any
}): JSX.Element {
  function onContinue (): () => void {
    const listener = (e: any): void => {
      console.log('detail test:', e.detail)
      next?.(e.detail)

      hide()
    }
    document.addEventListener('continue', listener)

    // cleanup function
    return () => {
      document.removeEventListener('continue', listener)
    }
  }

  useEffect(onContinue)

  const [showing, setShowing] = useState(true)

  function hide (): void {
    setShowing(false)
  }

  function show (): void {
    setShowing(true)
  }

  if (showing) {
    const config = {
      type: Phaser.CANVAS,
      width: '100%',
      height: '100%',
      physics: {
        default: 'arcade'
      },
      scale: {
        mode: Phaser.Scale.FIT,
        height: 900,
        width: 1600,
        autoCenter: Phaser.Scale.CENTER_BOTH
      },
      scene: Scene
    }

    return (
      <>
        <GlobalStyle />

        <button onClick={hide}>
          hide
        </button>

        <IonPhaser game={config} initialize />
      </>
    )
  } else {
    return (
      <button onClick={show}>
        show
      </button>
    )
  }
}
