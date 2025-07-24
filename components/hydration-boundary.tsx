'use client'

import { useEffect } from 'react'

/**
 * Custom hook to clean up browser extension attributes that cause hydration mismatches
 * This handles common extensions like ad blockers that add attributes like bis_skin_checked
 */
export function useBrowserExtensionCleanup() {
  useEffect(() => {
    const cleanupAttributes = () => {
      // Remove common browser extension attributes that cause hydration issues
      const extensionAttributes = [
        'bis_skin_checked',
        'data-gramm',
        'data-gramm_editor', 
        'grammarly-extension',
        'data-gt-translate-attributes',
        'data-adblockkey'
      ]
      
      extensionAttributes.forEach(attr => {
        const elements = document.querySelectorAll(`[${attr}]`)
        elements.forEach(el => el.removeAttribute(attr))
      })
    }

    // Clean up immediately after hydration
    cleanupAttributes()
    
    // Set up observer to clean up dynamically added attributes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes') {
          const target = mutation.target as Element
          const attrName = mutation.attributeName
          
          // Remove problematic extension attributes
          if (attrName && [
            'bis_skin_checked',
            'data-gramm',
            'data-gramm_editor',
            'grammarly-extension'
          ].includes(attrName)) {
            target.removeAttribute(attrName)
          }
        }
      })
    })

    observer.observe(document.body, {
      attributes: true,
      subtree: true,
      attributeFilter: ['bis_skin_checked', 'data-gramm', 'data-gramm_editor', 'grammarly-extension']
    })

    return () => {
      observer.disconnect()
    }
  }, [])
}