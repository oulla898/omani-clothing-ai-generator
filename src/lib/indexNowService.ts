/**
 * IndexNow Service - Instant search engine indexing
 * Notifies Google, Bing, Yandex when URLs are created/updated
 */

const INDEXNOW_KEY = '93125272a29fe8537127a434fcc624bfa96874a263db5a55ba75e764bf321f6d12c511109026e656d8093899f9926dc9643a89e249de20e41f71a36baafbcb84'
const SITE_URL = 'https://haiba.store'

// Search engines that support IndexNow
const SEARCH_ENGINES = [
  'https://api.indexnow.org/indexnow',  // Shared endpoint (notifies all)
  'https://www.bing.com/indexnow',      // Bing
  'https://yandex.com/indexnow',        // Yandex
]

export class IndexNowService {
  /**
   * Submit a single URL for instant indexing
   */
  static async submitUrl(url: string): Promise<void> {
    try {
      console.log('🚀 IndexNow: Submitting URL:', url)

      // Validate URL
      if (!url.startsWith(SITE_URL)) {
        console.warn('⚠️ IndexNow: URL must start with', SITE_URL)
        return
      }

      // Submit to all search engines in parallel
      const promises = SEARCH_ENGINES.map(async (engine) => {
        try {
          const response = await fetch(
            `${engine}?url=${encodeURIComponent(url)}&key=${INDEXNOW_KEY}`,
            {
              method: 'GET',
              headers: {
                'User-Agent': 'Haiba-Store-IndexNow/1.0',
              },
            }
          )

          if (response.status === 200) {
            console.log(`✅ IndexNow: Success on ${engine}`)
          } else if (response.status === 202) {
            console.log(`⏳ IndexNow: Accepted (validation pending) on ${engine}`)
          } else {
            console.warn(`⚠️ IndexNow: Status ${response.status} from ${engine}`)
          }
        } catch (error) {
          console.error(`❌ IndexNow: Error with ${engine}:`, error)
        }
      })

      await Promise.all(promises)
      console.log('🎉 IndexNow: Submission complete')
    } catch (error) {
      console.error('❌ IndexNow: Failed to submit URL:', error)
    }
  }

  /**
   * Submit multiple URLs in batch (up to 10,000)
   */
  static async submitBatch(urls: string[]): Promise<void> {
    try {
      console.log(`🚀 IndexNow: Submitting ${urls.length} URLs in batch`)

      // Validate all URLs
      const validUrls = urls.filter((url) => url.startsWith(SITE_URL))
      if (validUrls.length === 0) {
        console.warn('⚠️ IndexNow: No valid URLs to submit')
        return
      }

      // Limit to 10,000 URLs per request
      const urlsToSubmit = validUrls.slice(0, 10000)

      const body = JSON.stringify({
        host: 'haiba.store',
        key: INDEXNOW_KEY,
        urlList: urlsToSubmit,
      })

      // Submit to all search engines
      const promises = SEARCH_ENGINES.map(async (engine) => {
        try {
          const response = await fetch(engine, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json; charset=utf-8',
              'User-Agent': 'Haiba-Store-IndexNow/1.0',
            },
            body,
          })

          if (response.status === 200) {
            console.log(`✅ IndexNow: Batch success on ${engine}`)
          } else if (response.status === 202) {
            console.log(`⏳ IndexNow: Batch accepted on ${engine}`)
          } else {
            console.warn(`⚠️ IndexNow: Batch status ${response.status} from ${engine}`)
          }
        } catch (error) {
          console.error(`❌ IndexNow: Batch error with ${engine}:`, error)
        }
      })

      await Promise.all(promises)
      console.log('🎉 IndexNow: Batch submission complete')
    } catch (error) {
      console.error('❌ IndexNow: Failed to submit batch:', error)
    }
  }

  /**
   * Submit homepage + common pages immediately
   */
  static async submitSitemap(): Promise<void> {
    const urls = [
      `${SITE_URL}/`,
      `${SITE_URL}/history`,
      `${SITE_URL}/pricing`,
    ]

    await this.submitBatch(urls)
  }
}
