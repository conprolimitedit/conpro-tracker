'use client'
import { useEffect } from 'react'

const LeafletCSS = () => {
  useEffect(() => {
    // Load Leaflet CSS only on client side
    if (typeof window !== 'undefined') {
      const link = document.createElement('link')
      link.rel = 'stylesheet'
      link.href = 'https://unpkg.com/leaflet@1.7.1/dist/leaflet.css'
      link.integrity = 'sha512-xodZBNTC5n17Xt2atTPuE1HxjVMSvLVW9ocqUKLsCC5CXdbqCmblAshOMAS6/keqq/sMZMZ19scR4PsZChSR7A=='
      link.crossOrigin = ''
      document.head.appendChild(link)

      // Fix for default markers in react-leaflet
      const L = require('leaflet')
      delete L.Icon.Default.prototype._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
      })

      return () => {
        // Cleanup: remove the CSS link when component unmounts
        const existingLink = document.querySelector(`link[href="${link.href}"]`)
        if (existingLink) {
          document.head.removeChild(existingLink)
        }
      }
    }
  }, [])

  return null
}

export default LeafletCSS 