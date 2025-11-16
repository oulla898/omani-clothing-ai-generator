/**
 * Google Ads Conversion Tracking
 * Track when users generate images (main conversion goal)
 */

declare global {
  interface Window {
    gtag?: (...args: any[]) => void
    dataLayer?: any[]
  }
}

export class GoogleAdsTracking {
  /**
   * Track image generation conversion
   */
  static trackImageGeneration() {
    if (typeof window !== 'undefined' && window.gtag) {
      try {
        window.gtag('event', 'conversion', {
          send_to: 'AW-11097953181/XXXXX', // Replace XXXXX with your conversion label
          value: 1.0,
          currency: 'OMR',
        })
        console.log('✅ Google Ads: Image generation tracked')
      } catch (error) {
        console.error('❌ Google Ads tracking error:', error)
      }
    }
  }

  /**
   * Track sign up conversion
   */
  static trackSignUp() {
    if (typeof window !== 'undefined' && window.gtag) {
      try {
        window.gtag('event', 'conversion', {
          send_to: 'AW-11097953181/XXXXX', // Replace with sign-up conversion label
          value: 0.5,
          currency: 'OMR',
        })
        console.log('✅ Google Ads: Sign-up tracked')
      } catch (error) {
        console.error('❌ Google Ads tracking error:', error)
      }
    }
  }

  /**
   * Track credit purchase conversion
   */
  static trackPurchase(amount: number) {
    if (typeof window !== 'undefined' && window.gtag) {
      try {
        window.gtag('event', 'conversion', {
          send_to: 'AW-11097953181/XXXXX', // Replace with purchase conversion label
          value: amount,
          currency: 'OMR',
          transaction_id: `${Date.now()}-${Math.random().toString(36)}`,
        })
        console.log('✅ Google Ads: Purchase tracked:', amount, 'OMR')
      } catch (error) {
        console.error('❌ Google Ads tracking error:', error)
      }
    }
  }

  /**
   * Track page view
   */
  static trackPageView(url: string) {
    if (typeof window !== 'undefined' && window.gtag) {
      try {
        window.gtag('config', 'AW-11097953181', {
          page_path: url,
        })
        console.log('✅ Google Ads: Page view tracked:', url)
      } catch (error) {
        console.error('❌ Google Ads tracking error:', error)
      }
    }
  }

  /**
   * Track custom event
   */
  static trackEvent(eventName: string, params?: Record<string, any>) {
    if (typeof window !== 'undefined' && window.gtag) {
      try {
        window.gtag('event', eventName, params)
        console.log('✅ Google Ads: Custom event tracked:', eventName, params)
      } catch (error) {
        console.error('❌ Google Ads tracking error:', error)
      }
    }
  }
}
