import { useEffect } from 'react'

interface SEOData {
  title: string
  description: string
  keywords?: string
  ogTitle?: string
  ogDescription?: string
  ogImage?: string
  ogType?: string
  canonicalUrl?: string
  noindex?: boolean
}

export const useSEO = (seoData: SEOData) => {
  useEffect(() => {
    // Update document title
    document.title = seoData.title

    // Update or create meta description
    let metaDescription = document.querySelector('meta[name="description"]')
    if (!metaDescription) {
      metaDescription = document.createElement('meta')
      metaDescription.setAttribute('name', 'description')
      document.head.appendChild(metaDescription)
    }
    metaDescription.setAttribute('content', seoData.description)

    // Update or create meta keywords
    if (seoData.keywords) {
      let metaKeywords = document.querySelector('meta[name="keywords"]')
      if (!metaKeywords) {
        metaKeywords = document.createElement('meta')
        metaKeywords.setAttribute('name', 'keywords')
        document.head.appendChild(metaKeywords)
      }
      metaKeywords.setAttribute('content', seoData.keywords)
    }

    // Open Graph meta tags
    const updateOGTag = (property: string, content: string) => {
      let tag = document.querySelector(`meta[property="${property}"]`)
      if (!tag) {
        tag = document.createElement('meta')
        tag.setAttribute('property', property)
        document.head.appendChild(tag)
      }
      tag.setAttribute('content', content)
    }

    if (seoData.ogTitle) updateOGTag('og:title', seoData.ogTitle)
    if (seoData.ogDescription) updateOGTag('og:description', seoData.ogDescription)
    if (seoData.ogImage) updateOGTag('og:image', seoData.ogImage)
    if (seoData.ogType) updateOGTag('og:type', seoData.ogType)
    updateOGTag('og:url', seoData.canonicalUrl || window.location.href)

    // Twitter Card meta tags
    const updateTwitterTag = (name: string, content: string) => {
      let tag = document.querySelector(`meta[name="${name}"]`)
      if (!tag) {
        tag = document.createElement('meta')
        tag.setAttribute('name', name)
        document.head.appendChild(tag)
      }
      tag.setAttribute('content', content)
    }

    updateTwitterTag('twitter:card', 'summary_large_image')
    if (seoData.ogTitle) updateTwitterTag('twitter:title', seoData.ogTitle)
    if (seoData.ogDescription) updateTwitterTag('twitter:description', seoData.ogDescription)
    if (seoData.ogImage) updateTwitterTag('twitter:image', seoData.ogImage)

    // Canonical URL
    if (seoData.canonicalUrl) {
      let canonical = document.querySelector('link[rel="canonical"]')
      if (!canonical) {
        canonical = document.createElement('link')
        canonical.setAttribute('rel', 'canonical')
        document.head.appendChild(canonical)
      }
      canonical.setAttribute('href', seoData.canonicalUrl)
    }

    // Noindex handling
    if (seoData.noindex !== undefined) {
      let robotsMeta = document.querySelector('meta[name="robots"]')
      if (!robotsMeta) {
        robotsMeta = document.createElement('meta')
        robotsMeta.setAttribute('name', 'robots')
        document.head.appendChild(robotsMeta)
      }
      robotsMeta.setAttribute('content', seoData.noindex ? 'noindex, nofollow' : 'index, follow')
    }

    // Language
    document.documentElement.lang = 'ru'
  }, [seoData])
}
