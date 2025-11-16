/**
 * Instant IndexNow Submission Script
 * Run this immediately after deployment to notify search engines
 * 
 * Usage: node scripts/submit-to-indexnow.js
 */

const INDEXNOW_KEY = '93125272a29fe8537127a434fcc624bfa96874a263db5a55ba75e764bf321f6d12c511109026e656d8093899f9926dc9643a89e249de20e41f71a36baafbcb84'
const SITE_URL = 'https://haiba.store'

const SEARCH_ENGINES = [
  'https://api.indexnow.org/indexnow',  // Shared endpoint (Google, Bing, Yandex)
  'https://www.bing.com/indexnow',      // Bing directly
  'https://yandex.com/indexnow',        // Yandex directly
]

// All URLs to submit
const urls = [
  `${SITE_URL}/`,
  `${SITE_URL}/history`,
  `${SITE_URL}/pricing`,
]

async function submitToIndexNow() {
  console.log('🚀 Starting IndexNow submission...')
  console.log(`📍 Site: ${SITE_URL}`)
  console.log(`📄 URLs: ${urls.length}`)
  console.log('')

  // Method 1: Submit all URLs in one batch (recommended)
  console.log('📦 Submitting batch request...')
  
  for (const engine of SEARCH_ENGINES) {
    try {
      const response = await fetch(engine, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'User-Agent': 'Haiba-Store-IndexNow/1.0',
        },
        body: JSON.stringify({
          host: 'haiba.store',
          key: INDEXNOW_KEY,
          urlList: urls,
        }),
      })

      if (response.status === 200) {
        console.log(`✅ ${engine}: Success!`)
      } else if (response.status === 202) {
        console.log(`⏳ ${engine}: Accepted (validation pending)`)
      } else {
        const text = await response.text()
        console.log(`⚠️ ${engine}: Status ${response.status}`)
        console.log(`   Response: ${text}`)
      }
    } catch (error) {
      console.error(`❌ ${engine}: Error -`, error.message)
    }
  }

  console.log('')
  console.log('🎉 IndexNow submission complete!')
  console.log('')
  console.log('📊 Next steps:')
  console.log('1. Verify key file is accessible: https://haiba.store/93125272a29fe8537127a434fcc624bfa96874a263db5a55ba75e764bf321f6d12c511109026e656d8093899f9926dc9643a89e249de20e41f71a36baafbcb84.txt')
  console.log('2. Check Google Search Console in 24-48 hours')
  console.log('3. Check Bing Webmaster Tools (usually faster)')
  console.log('4. Every new image generation will auto-submit via API')
}

// Run immediately
submitToIndexNow().catch(console.error)
