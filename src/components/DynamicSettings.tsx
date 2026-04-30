import { useEffect } from 'react'
import apiClient from '../api/axios'

export default function DynamicSettings() {
  useEffect(() => {
    const updateSettings = async () => {
      try {
        // Fetch public settings for title and logo
        const { data } = await apiClient.get('/public/settings/hotel')
        if (data) {
          // Update Favicon
          const logoUrl = data.logo_url
          if (logoUrl) {
            updateFavicon(logoUrl)
          }
        }
      } catch (err) {
        console.error('Failed to update dynamic settings', err)
      }
    }

    const updateFavicon = (url: string) => {
      // Find or create favicon links
      const linkTypes = ['icon', 'shortcut icon', 'apple-touch-icon']
      
      linkTypes.forEach(rel => {
        let link = document.querySelector(`link[rel*="${rel}"]`) as HTMLLinkElement
        if (!link) {
          link = document.createElement('link')
          link.rel = rel
          document.getElementsByTagName('head')[0].appendChild(link)
        }
        link.href = url
      })
    }

    updateSettings()
  }, [])

  return null
}
