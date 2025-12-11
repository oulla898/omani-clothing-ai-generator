// Omani Clothing AI Generator - Clean & Simple
class OmaniAI {
    constructor() {
        this.currentLanguage = 'en';
        this.isAuthenticated = false;
        this.sessionReady = false;
        this.userCredits = 0;
        this.clerk = null;
        this.generationHistory = []; // Track generation timestamps for rate limiting
        this.maxGenerationsPerMinute = 10;
        this.isGenerating = false; // Prevent concurrent generations
        this.init();
    }

    async init() {
        console.log('🚀 Initializing Omani AI Generator...');

        // Initialize Clerk first
        await this.initializeClerk();

        // Setup event listeners
        this.setupEventListeners();

        // Initialize language
        this.updateLanguage();

        console.log('✅ App initialized successfully');
    }

    async initializeClerk() {
        try {
            // Wait for Clerk to be loaded
            while (!window.Clerk) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }

            this.clerk = window.Clerk;
            await this.clerk.load();

            // Check initial auth state
            const session = this.clerk.session;
            this.isAuthenticated = !!session;
            this.sessionReady = !!session;
            this.updateAuthUI(this.isAuthenticated);

            if (this.isAuthenticated) {
                // Wait for session to be fully ready before loading credits
                await this.waitForSessionReady();
                await this.loadUserCredits();
            }

            // Listen for auth changes
            this.clerk.addListener(({ session }) => {
                const wasAuthenticated = this.isAuthenticated;
                this.isAuthenticated = !!session;

                if (this.isAuthenticated !== wasAuthenticated) {
                    this.updateAuthUI(this.isAuthenticated);
                    if (this.isAuthenticated) {
                        // Mark session as not ready until fully established
                        this.sessionReady = false;
                        this.updateDebugInfo();

                        // Force a session refresh to avoid stuck state
                        await this.refreshSession();
                        await this.waitForSessionReady();
                        await this.loadUserCredits();
                    } else {
                        this.sessionReady = false;
                        this.userCredits = 0;
                        this.updateCreditsDisplay();
                    }
                }
            });

        } catch (error) {
            console.error('Failed to initialize Clerk:', error);
        }
    }

    async waitForSessionReady() {
        // Wait for session to be fully established on both client and server
        let attempts = 0;
        const maxAttempts = 15; // Increased attempts

        this.logDebug('Starting session readiness check...', 'info');

        while (attempts < maxAttempts) {
            try {
                // Test if session is ready by making a test API call
                const response = await fetch('/api/auth/check', {
                    method: 'GET',
                    credentials: 'include'
                });

                this.logDebug(`Session check attempt ${attempts + 1}: ${response.status}`, 'info');

                if (response.ok) {
                    const data = await response.json();
                    this.logDebug(`Session check response: ${JSON.stringify(data)}`, 'info');
                    this.sessionReady = true;
                    console.log('✅ Session is ready');
                    this.updateDebugInfo();
                    return;
                }
            } catch (error) {
                this.logDebug(`Session check attempt ${attempts + 1} failed: ${error.message}`, 'error');
            }

            // Wait before retry (increased delay)
            await new Promise(resolve => setTimeout(resolve, 300));
            attempts++;
        }

        // If all attempts failed, still mark as ready but log warning
        console.warn('Session readiness check failed, proceeding anyway');
        this.sessionReady = true;
        this.updateDebugInfo();
    }

    setupEventListeners() {
        // Language toggle
        document.getElementById('languageToggle')?.addEventListener('click', () => {
            this.toggleLanguage();
        });

        // Auth button
        document.getElementById('authButton')?.addEventListener('click', () => {
            this.handleAuth();
        });

        // Generate form
        document.getElementById('generateForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleGenerate();
        });

        // Generate another button
        document.getElementById('generateAnotherButton')?.addEventListener('click', () => {
            this.resetForm();
        });

        // Download button
        document.getElementById('downloadButton')?.addEventListener('click', () => {
            this.downloadImage();
        });
    }

    // Language Management
    toggleLanguage() {
        this.currentLanguage = this.currentLanguage === 'en' ? 'ar' : 'en';
        this.updateLanguage();
    }

    updateLanguage() {
        const html = document.documentElement;
        const languageText = document.getElementById('languageText');
        const description = document.getElementById('description');

        if (this.currentLanguage === 'ar') {
            html.setAttribute('dir', 'rtl');
            html.setAttribute('lang', 'ar');
            html.classList.add('font-arabic');
            html.classList.remove('font-english');
            if (languageText) languageText.textContent = 'English';

            // Update placeholder
            if (description) {
                description.placeholder = description.getAttribute('data-placeholder-ar');
            }
        } else {
            html.setAttribute('dir', 'ltr');
            html.setAttribute('lang', 'en');
            html.classList.add('font-english');
            html.classList.remove('font-arabic');
            if (languageText) languageText.textContent = 'عربي';

            // Update placeholder
            if (description) {
                description.placeholder = description.getAttribute('data-placeholder-en');
            }
        }

        // Update all translatable elements
        document.querySelectorAll('[data-en][data-ar]').forEach(element => {
            const text = this.currentLanguage === 'ar'
                ? element.getAttribute('data-ar')
                : element.getAttribute('data-en');
            element.textContent = text;
        });

        console.log(`🌐 Language updated to: ${this.currentLanguage}`);
    }

    // Authentication
    handleAuth() {
        if (this.isAuthenticated) {
            this.signOut();
        } else {
            this.signIn();
        }
    }

    async signIn() {
        try {
            if (this.clerk) {
                await this.clerk.openSignIn();
            }
        } catch (error) {
            console.error('Sign in failed:', error);
            this.showMessage('Sign in failed', 'error');
        }
    }

    async signOut() {
        try {
            if (this.clerk) {
                await this.clerk.signOut();
                this.showMessage(
                    this.currentLanguage === 'ar' ? 'تم تسجيل الخروج بنجاح' : 'Signed out successfully',
                    'success'
                );
            }
        } catch (error) {
            console.error('Sign out failed:', error);
            this.showMessage(
                this.currentLanguage === 'ar' ? 'فشل تسجيل الخروج' : 'Sign out failed',
                'error'
            );
        }
    }

    updateAuthUI(authenticated) {
        const authButton = document.getElementById('authButton');
        const creditsDisplay = document.getElementById('creditsDisplay');

        if (authenticated) {
            authButton.innerHTML = this.currentLanguage === 'ar'
                ? 'تسجيل الخروج'
                : 'Sign Out';
            creditsDisplay?.classList.remove('hidden');
        } else {
            authButton.innerHTML = this.currentLanguage === 'ar'
                ? 'تسجيل الدخول'
                : 'Sign In';
            creditsDisplay?.classList.add('hidden');
        }
    }

    // Credits Management
    async loadUserCredits() {
        try {
            const token = await this.clerk?.session?.getToken();
            const response = await fetch('/api/credits', {
                headers: token ? {
                    'Authorization': `Bearer ${token}`
                } : {}
            });
            if (response.ok) {
                const data = await response.json();
                this.userCredits = data.credits;
                this.updateCreditsDisplay();
            }
        } catch (error) {
            console.error('Failed to load credits:', error);
        }
    }

    updateCreditsDisplay() {
        const creditsCount = document.getElementById('creditsCount');
        if (creditsCount) {
            creditsCount.textContent = this.userCredits;
        }
    }

    // Rate Limiting
    checkRateLimit() {
        const now = Date.now();
        const oneMinuteAgo = now - 60000;

        // Clean up old timestamps (older than 60 seconds)
        this.generationHistory = this.generationHistory.filter(timestamp => timestamp > oneMinuteAgo);

        // Check if user exceeded rate limit
        if (this.generationHistory.length >= this.maxGenerationsPerMinute) {
            const oldestTimestamp = this.generationHistory[0];
            const waitTime = Math.ceil((oldestTimestamp + 60000 - now) / 1000);
            return {
                allowed: false,
                waitTime: waitTime
            };
        }

        return { allowed: true, waitTime: 0 };
    }

    recordGeneration() {
        this.generationHistory.push(Date.now());
    }

    // Image Generation
    async handleGenerate() {
        if (!this.isAuthenticated) {
            this.showMessage(
                this.currentLanguage === 'ar'
                    ? 'يرجى تسجيل الدخول أولاً'
                    : 'Please sign in first',
                'warning'
            );
            return;
        }

        if (!this.sessionReady) {
            this.logDebug('Session not ready, attempting recovery...', 'warning');

            // Try to recover the session
            await this.attemptSessionRecovery();

            if (!this.sessionReady) {
                this.logDebug('Session recovery failed, showing user message', 'error');
                this.showMessage(
                    this.currentLanguage === 'ar'
                        ? 'جاري تحميل الحساب... يرجى المحاولة مرة أخرى'
                        : 'Loading account... Please try again',
                    'warning'
                );
                return;
            }
        }

        // Check if already generating
        if (this.isGenerating) {
            this.showMessage(
                this.currentLanguage === 'ar'
                    ? 'جاري التوليد... يرجى الانتظار'
                    : 'Generation in progress... Please wait',
                'warning'
            );
            return;
        }

        // Check rate limit
        const rateCheck = this.checkRateLimit();
        if (!rateCheck.allowed) {
            this.showMessage(
                this.currentLanguage === 'ar'
                    ? `لقد تجاوزت الحد الأقصى. يرجى الانتظار ${rateCheck.waitTime} ثانية`
                    : `Rate limit exceeded. Please wait ${rateCheck.waitTime} seconds`,
                'warning'
            );
            return;
        }

        if (this.userCredits <= 0) {
            this.showMessage(
                this.currentLanguage === 'ar'
                    ? 'رصيدك منتهي'
                    : 'No credits remaining',
                'warning'
            );
            return;
        }

        const formData = new FormData(document.getElementById('generateForm'));
        const personType = formData.get('personType');
        const description = formData.get('description')?.trim();

        if (!description) {
            this.showMessage(
                this.currentLanguage === 'ar'
                    ? 'يرجى كتابة وصف'
                    : 'Please enter a description',
                'warning'
            );
            return;
        }

        // Create prompt
        const prompt = `${personType} wearing ${description}`;

        // Mark generation as in progress
        this.isGenerating = true;
        this.setLoading(true);

        try {
            const token = await this.clerk?.session?.getToken();
            const response = await fetch('/api/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token && { 'Authorization': `Bearer ${token}` })
                },
                body: JSON.stringify({ prompt }),
            });

            const data = await response.json();

            // Handle session not ready error with retry
            if (response.status === 401 && data.code === 'AUTH_PENDING' && data.retry) {
                this.logDebug('Session not ready, retrying in 1 second...', 'warning');
                this.showMessage(
                    this.currentLanguage === 'ar'
                        ? 'جاري تحضير الحساب...'
                        : 'Preparing account...',
                    'info'
                );

                // Wait and retry once
                await new Promise(resolve => setTimeout(resolve, 1000));
                return this.handleGenerate();
            }

            // Handle rate limit from server
            if (response.status === 429 || data.rateLimitExceeded) {
                const waitTime = data.waitTime || 60;
                this.showMessage(
                    this.currentLanguage === 'ar'
                        ? `لقد تجاوزت الحد الأقصى. يرجى الانتظار ${waitTime} ثانية`
                        : `Rate limit exceeded. Please wait ${waitTime} seconds`,
                    'warning'
                );
                return;
            }

            if (!response.ok) {
                throw new Error(data.error || `HTTP error! status: ${response.status}`);
            }

            if (data.success && data.imageUrl) {
                // Record successful generation for rate limiting
                this.recordGeneration();

                this.displayGeneratedImage(data.imageUrl);
                this.userCredits = data.remainingCredits;
                this.updateCreditsDisplay();
                this.showMessage(
                    this.currentLanguage === 'ar'
                        ? 'تم توليد الصورة بنجاح!'
                        : 'Image generated successfully!',
                    'success'
                );
            } else {
                throw new Error(data.error || 'Generation failed');
            }

        } catch (error) {
            console.error('Generation error:', error);
            this.showMessage(
                this.currentLanguage === 'ar'
                    ? 'فشل في توليد الصورة'
                    : 'Failed to generate image',
                'error'
            );
        } finally {
            this.isGenerating = false;
            this.setLoading(false);
        }
    }

    setLoading(loading) {
        const button = document.getElementById('generateButton');
        const buttonText = document.getElementById('generateButtonText');
        const buttonLoading = document.getElementById('generateButtonLoading');

        if (loading) {
            button.disabled = true;
            buttonText?.classList.add('hidden');
            buttonLoading?.classList.remove('hidden');
        } else {
            button.disabled = false;
            buttonText?.classList.remove('hidden');
            buttonLoading?.classList.add('hidden');
        }
    }

    displayGeneratedImage(imageUrl) {
        const imageResult = document.getElementById('imageResult');
        const generatedImage = document.getElementById('generatedImage');

        if (generatedImage && imageResult) {
            generatedImage.src = imageUrl;
            generatedImage.alt = 'Generated Omani clothing';
            imageResult.classList.remove('hidden');

            // Scroll to image
            imageResult.scrollIntoView({ behavior: 'smooth' });
        }
    }

    resetForm() {
        const imageResult = document.getElementById('imageResult');
        const form = document.getElementById('generateForm');

        imageResult?.classList.add('hidden');
        form?.reset();

        // Scroll back to form
        form?.scrollIntoView({ behavior: 'smooth' });
    }

    downloadImage() {
        const generatedImage = document.getElementById('generatedImage');
        if (generatedImage && generatedImage.src) {
            const link = document.createElement('a');
            link.href = generatedImage.src;
            link.download = `omani-clothing-${Date.now()}.jpg`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }

    // UI Helpers
    showMessage(message, type = 'info') {
        const container = document.getElementById('statusContainer');
        if (!container) return;

        const messageDiv = document.createElement('div');
        messageDiv.className = `status-${type}`;
        messageDiv.textContent = message;

        container.innerHTML = '';
        container.appendChild(messageDiv);

        // Auto hide after 5 seconds
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.remove();
            }
        }, 5000);
    }

    clearMessages() {
        const container = document.getElementById('statusContainer');
        if (container) {
            container.innerHTML = '';
        }
    }
}

// Initialize the app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.omaniAI = new OmaniAI();
});

// Make it available globally for debugging
window.OmaniAI = OmaniAI;
