'use client'
import NextNProgress from 'nextjs-progressbar'

const ProgressBar = () => {
  return (
    <NextNProgress
      color="#29166F"
      startPosition={0.3}
      stopDelayMs={200}
      height={4}
      showOnShallow={true}
      options={{ 
        showSpinner: false,
        easing: 'ease',
        speed: 500,
        minimum: 0.1,
        template: '<div class="bar" role="bar"><div class="peg"></div></div><div class="spinner" role="spinner"><div class="spinner-icon"></div></div>'
      }}
    />
  )
}

export default ProgressBar
