'use client'

import { useState } from 'react'
import { useUser, SignInButton, SignOutButton } from '@clerk/nextjs'
import Image from 'next/image'
import { useCredits } from '../hooks/useCredits'
import { useGenerations } from '../hooks/useGenerations'
import ImageHistory from '../components/ImageHistory'

export default function Home() {
  const { isSignedIn } = useUser()
  const { credits, loading: creditsLoading, hasCredits, deductCredit } = useCredits()
  const { saveGeneration } = useGenerations()
  const [prompt, setPrompt] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedImage, setGeneratedImage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'gallery' | 'history'>('gallery')
  const [currentLang, setCurrentLang] = useState('en')
  const [showSignInPrompt, setShowSignInPrompt] = useState(false)

  const toggleLanguage = () => {
    setCurrentLang(currentLang === 'en' ? 'ar' : 'en')
  }

  const handleGenerateAttempt = () => {
    if (!isSignedIn) {
      setShowSignInPrompt(true)
      return
    }
    generateImage()
  }

  const generateImage = async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt')
      return
    }

    if (!hasCredits) {
      setError('You have no credits remaining. Please purchase more credits to continue.')
      return
    }

    setIsGenerating(true)
    setError(null)
    setGeneratedImage(null)

    // Deduct credit first
    const creditDeducted = await deductCredit()
    if (!creditDeducted) {
      setError('Failed to deduct credit. Please try again.')
      setIsGenerating(false)
      return
    }

    try {
      const response = await fetch('/api/predictions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: prompt,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate image')
      }

      const data = await response.json()
      
      if (data.error) {
        throw new Error(data.error)
      }

      const imageUrl = data.output?.[0]
      setGeneratedImage(imageUrl)

      // Save the generation to database
      if (imageUrl) {
        await saveGeneration(prompt, imageUrl)
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setIsGenerating(false)
    }
  }

  const getText = (enText: string, arText: string) => {
    return currentLang === 'ar' ? arText : enText
  }

  return (
    <div className={`min-h-screen ${currentLang === 'ar' ? 'font-arabic' : ''}`} dir={currentLang === 'ar' ? 'rtl' : 'ltr'}>
      {/* Header */}
      <header className="fixed top-0 w-full bg-white/95 backdrop-blur-md z-50 border-b border-gray-200">
        <nav className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className={`text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent ${currentLang === 'ar' ? 'logo-font-arabic' : 'logo-font-arabic'}`}>
            هيبة
          </div>
          
          <div className="hidden md:flex items-center space-x-6">
            <a href="#home" className="text-gray-700 hover:text-purple-600 transition-colors">
              {getText('Home', 'الرئيسية')}
            </a>
            <a href="#gallery" className="text-gray-700 hover:text-purple-600 transition-colors">
              {getText('Gallery', 'المعرض')}
            </a>
            <a href="#features" className="text-gray-700 hover:text-purple-600 transition-colors">
              {getText('Features', 'المزايا')}
            </a>
          </div>

          <div className={`flex items-center space-x-4 ${currentLang === 'ar' ? 'flex-row-reverse' : ''}`}>
            <button
              onClick={toggleLanguage}
              className="px-3 py-1 border-2 border-purple-600 text-purple-600 rounded-full hover:bg-purple-600 hover:text-white transition-colors"
            >
              {currentLang === 'en' ? 'ع' : 'EN'}
            </button>
            
            {isSignedIn ? (
              <div className="flex items-center space-x-4">
                <div className="bg-gray-100 px-3 py-1 rounded-lg text-sm">
                  {getText('Credits:', 'النقاط:')} {creditsLoading ? '...' : credits ?? 0}
                </div>
                <SignOutButton>
                  <button className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors">
                    {getText('Sign Out', 'تسجيل خروج')}
                  </button>
                </SignOutButton>
              </div>
            ) : (
              <SignInButton mode="modal">
                <button className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors">
                  {getText('Sign In', 'تسجيل دخول')}
                </button>
              </SignInButton>
            )}
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section id="home" className="min-h-screen flex items-center justify-center pt-20 px-4 bg-gradient-to-br from-purple-600 to-blue-600 text-white">
        <div className="max-w-2xl text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
            {getText(
              'Create Traditional Omani Portraits with AI',
              'ذكاء اصطناعي عماني يضبط لفة المِصر وهيبة البشت ولمعة الخنجر'
            )}
          </h1>
          <p className="text-xl mb-8 opacity-95">
            {getText(
              'Describe what you want and let AI bring your vision to life with authentic Omani heritage.',
              'اكتب ما تريده ودع الذكاء الاصطناعي يصنع حلمك بلمسة عُمانية أصيلة.'
            )}
          </p>

          {/* Generation Form */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-8 text-left">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={getText(
                'Describe the traditional Omani portrait you want to create...',
                'اكتب وصف الصورة العُمانية التقليدية التي تريد إنشاءها...'
              )}
              className="w-full p-4 border border-white/30 rounded-2xl bg-white/15 text-white placeholder-white/80 focus:outline-none focus:border-white/60 resize-none"
              rows={3}
            />
            
            {error && (
              <div className="mt-4 p-3 bg-red-500/20 border border-red-400/50 text-red-100 rounded-lg">
                {error}
              </div>
            )}

            <button
              onClick={handleGenerateAttempt}
              disabled={isGenerating || (isSignedIn && !hasCredits)}
              className="w-full mt-6 bg-white text-purple-600 py-4 rounded-2xl font-bold hover:bg-gray-100 disabled:bg-gray-400 disabled:text-gray-600 transition-all transform hover:scale-105"
            >
              {isGenerating 
                ? getText('Generating...', 'جاري الإنشاء...')
                : !isSignedIn
                ? getText('Generate Image', 'أنشئ الصورة')
                : !hasCredits 
                ? getText('No Credits Remaining', 'لا توجد نقاط متبقية')
                : getText('Generate Image', 'أنشئ الصورة')
              }
            </button>

            {/* Generated Image Display */}
            {isGenerating && (
              <div className="mt-6 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                <p className="text-white/80">{getText('Generating your image...', 'جاري إنشاء صورتك...')}</p>
              </div>
            )}

            {generatedImage && (
              <div className="mt-6">
                <Image
                  src={generatedImage}
                  alt="Generated Omani traditional clothing"
                  width={400}
                  height={400}
                  className="rounded-2xl mx-auto"
                />
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Tab Navigation */}
      <nav className="bg-white border-b border-gray-200 sticky top-[73px] z-40">
        <div className="max-w-6xl mx-auto flex justify-center">
          <button
            onClick={() => setActiveTab('gallery')}
            className={`px-8 py-4 font-semibold border-b-3 transition-colors ${
              activeTab === 'gallery'
                ? 'text-purple-600 border-purple-600'
                : 'text-gray-600 border-transparent hover:text-purple-600'
            }`}
          >
            {getText('Gallery', 'المعرض')}
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-8 py-4 font-semibold border-b-3 transition-colors ${
              activeTab === 'history'
                ? 'text-purple-600 border-purple-600'
                : 'text-gray-600 border-transparent hover:text-purple-600'
            }`}
          >
            {getText('Your History', 'تاريخك')}
          </button>
        </div>
      </nav>

      {/* Tab Content */}
      {activeTab === 'gallery' ? (
        <section id="gallery" className="py-16 px-4 bg-white">
          <div className="max-w-6xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-12 text-gray-800">
              {getText('Beautiful Examples', 'نماذج جميلة')}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { src: '/رجل.jpg', title: getText('Traditional Man', 'رجل تقليدي'), desc: getText('Classic dishdasha and kuma styling', 'دشداشة وكِمّة بأسلوب كلاسيكي') },
                { src: '/طفل.jpg', title: getText('Young Heritage', 'تراث الصغار'), desc: getText('Traditional children\'s attire', 'ملابس الأطفال التقليدية') },
                { src: '/عائلة.jpg', title: getText('Family Portrait', 'صورة عائلية'), desc: getText('Coordinated family traditional wear', 'إطلالات عائلية تقليدية متناسقة') },
                { src: '/معرس.jpg', title: getText('Wedding Celebration', 'احتفال الزفاف'), desc: getText('Elegant ceremonial clothing', 'ملابس احتفالية أنيقة') }
              ].map((item, index) => (
                <div key={index} className="group relative overflow-hidden rounded-2xl shadow-lg hover:shadow-xl transition-all transform hover:scale-105">
                  <Image
                    src={item.src}
                    alt={item.title}
                    width={300}
                    height={400}
                    className="w-full h-80 object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="absolute bottom-4 left-4 right-4 text-white">
                      <h3 className="font-semibold text-lg mb-1">{item.title}</h3>
                      <p className="text-sm opacity-90">{item.desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : (
        <section className="py-16 px-4 bg-gray-50 min-h-[60vh]">
          {isSignedIn ? (
            <ImageHistory />
          ) : (
            <div className="max-w-2xl mx-auto text-center">
              <div className="text-6xl mb-6">🔒</div>
              <h2 className="text-2xl font-bold mb-4 text-gray-800">
                {getText('Sign in to view your history', 'سجل دخولك لمشاهدة تاريخك')}
              </h2>
              <p className="text-gray-600 mb-8">
                {getText('Your generated images will be saved and accessible here once you sign in.', 'صورك المُنشأة ستُحفظ وتكون متاحة هنا بعد تسجيل الدخول.')}
              </p>
              <SignInButton mode="modal">
                <button className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors">
                  {getText('Sign In Now', 'سجل دخولك الآن')}
                </button>
              </SignInButton>
            </div>
          )}
        </section>
      )}

      {/* Features Section */}
      <section id="features" className="py-16 px-4 bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-12 text-gray-800">
            {getText('Carefully Designed Features', 'مزايا صُمِّمت بعناية')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: '🎨',
                title: getText('Authentic Details', 'تفاصيل أصيلة'),
                desc: getText('Model fine-tuned for traditional Omani clothing with attention to patterns, colors, and Omani features.', 'النموذج مُهيأ للأزياء العُمانية التقليدية مع اهتمام بالنقوش والألوان والملامح العمانية.')
              },
              {
                icon: '🇴🇲',
                title: getText('Made in Oman', 'تراثنا في أيدٍ أمينة'),
                desc: getText('Developed by an Omani team passionate about preserving the beauty of our traditional attire with cutting-edge technology', 'فريق عُماني يعمل بشغف للحفاظ على رونق لبسنا وتطويره بأحدث التقنيات')
              },
              {
                icon: '⏱️',
                title: getText('Fast and Reliable', 'سريع وموثوق'),
                desc: getText('Most results are completed within seconds to under a minute, depending on service load.', 'غالبية النتائج تُنجز خلال ثوانٍ إلى أقل من دقيقة، بحسب الضغط على الخدمة.')
              },
              {
                icon: '🔒',
                title: getText('Your Personal Space', 'مساحتك الخاصة'),
                desc: getText('Generated images are saved to your account to view, manage, and download whenever you want.', 'الصور المُولدة تُحفظ في حسابك لتستعرضها وتديرها وتحملها وقتما تشاء.')
              }
            ].map((feature, index) => (
              <div key={index} className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all transform hover:scale-105">
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold mb-4 text-gray-800">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 bg-gradient-to-br from-purple-600 to-blue-600 text-white text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            {getText('Ready to Try Something Fun?', 'مستعد لتجربة شيء ممتع؟')}
          </h2>
          <p className="text-xl mb-8 opacity-95">
            {getText(
              'Join people who are creating beautiful traditional portraits with just a simple description. It\'s easier than you think!',
              'انضم للناس اللي يصنعون صور تقليدية حلوة بوصف بسيط بس. أسهل مما تتخيل!'
            )}
          </p>
          <a href="#home" className="inline-block bg-white text-purple-600 px-8 py-4 rounded-2xl font-bold hover:bg-gray-100 transition-all transform hover:scale-105">
            {getText('Try It Now', 'جربه الحين')}
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 px-4 text-center">
        <p className="opacity-80">
          {getText('© 2025 Heiba — Made with care for our heritage', '© 2025 هيبة — صُنع بحب لتراثنا')}
        </p>
      </footer>

      {/* Sign In Prompt Modal */}
      {showSignInPrompt && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center">
            <div className="text-4xl mb-4">🔐</div>
            <h3 className="text-2xl font-bold mb-4 text-gray-800">
              {getText('Sign in to generate', 'سجل دخولك للإنشاء')}
            </h3>
            <p className="text-gray-600 mb-6">
              {getText('Please sign in to start creating your traditional Omani portraits.', 'يرجى تسجيل الدخول لبدء إنشاء صورك العُمانية التقليدية.')}
            </p>
            <div className="flex space-x-4">
              <button
                onClick={() => setShowSignInPrompt(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                {getText('Cancel', 'إلغاء')}
              </button>
              <SignInButton mode="modal">
                <button 
                  onClick={() => setShowSignInPrompt(false)}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  {getText('Sign In', 'تسجيل دخول')}
                </button>
              </SignInButton>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
