// Omani Clothing AI Generator - Clean & Simple
class OmaniAI {
    constructor() {
        this.currentLanguage = 'en';
        this.isAuthenticated = false;
        this.userCredits = 0;
        this.init();
    }

    async init() {
        console.log('🚀 Initializing Omani AI Generator...');
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Initialize language
        this.updateLanguage();
        
        // Check authentication status
        await this.checkAuthStatus();
        
        console.log('✅ App initialized successfully');
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
    async checkAuthStatus() {
        try {
            const response = await fetch('/api/auth/check');
            if (response.ok) {
                const data = await response.json();
                this.isAuthenticated = data.authenticated;
                
                if (this.isAuthenticated) {
                    this.updateAuthUI(true);
                    await this.loadUserCredits();
                }
            }
        } catch (error) {
            console.log('Authentication check failed:', error);
            this.isAuthenticated = false;
        }
    }

    handleAuth() {
        if (this.isAuthenticated) {
            this.signOut();
        } else {
            this.signIn();
        }
    }

    signIn() {
        // Redirect to Clerk sign-in
        window.location.href = '/api/auth/signin';
    }

    async signOut() {
        try {
            await fetch('/api/auth/signout', { method: 'POST' });
            this.isAuthenticated = false;
            this.userCredits = 0;
            this.updateAuthUI(false);
            this.showMessage('Signed out successfully', 'success');
        } catch (error) {
            this.showMessage('Sign out failed', 'error');
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
            const response = await fetch('/api/credits');
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

        this.setLoading(true);
        
        try {
            const response = await fetch('/api/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ prompt }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            if (data.success && data.image) {
                this.displayGeneratedImage(data.image);
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
