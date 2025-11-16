# Google Ads Conversion Tracking Setup Guide

## ✅ تم التثبيت (Installed)

تم تثبيت Google Ads tag في الموقع بنجاح! 🎉

### What's Already Configured:

1. **Global Site Tag (gtag.js)** ✅
   - Account ID: `AW-11097953181`
   - Location: `src/app/layout.tsx` (in `<head>`)
   - Loads on every page automatically

2. **Event Tracking** ✅
   - ✅ **Image Generation** - Tracks when user creates an image
   - ✅ **Sign Up/Login** - Tracks when user authenticates
   - ✅ **Image Download** - Tracks when user downloads an image

---

## 🎯 Next Steps in Google Ads Dashboard

### 1. Create Conversion Actions

Go to: **Google Ads → Tools & Settings → Conversions**

#### Conversion 1: Image Generation (Primary Goal)
```
Name: Image Generated
Category: Purchase/Conversion
Value: 1 OMR (or set to actual value)
Count: Every conversion
Conversion window: 30 days
```

**Copy the Conversion Label** (looks like: `AW-11097953181/AbC123XyZ`)

Then update in code:
- File: `public/index.html` 
- Line: ~1396
- Change: `'send_to': 'AW-11097953181'` 
- To: `'send_to': 'AW-11097953181/YOUR_CONVERSION_LABEL'`

#### Conversion 2: Sign Up (Secondary Goal)
```
Name: User Sign Up
Category: Sign-up
Value: 0.5 OMR
Count: One per user
Conversion window: 90 days
```

Update in code:
- File: `public/index.html`
- Line: ~992
- Add the sign-up conversion label

#### Conversion 3: Image Download (Engagement)
```
Name: Image Download
Category: Other
Value: 0.1 OMR
Count: Every conversion
Conversion window: 7 days
```

Update in code:
- File: `public/index.html`
- Line: ~2132
- Add the download conversion label

---

## 📊 Verify Tracking Works

### Method 1: Google Tag Assistant (Chrome Extension)

1. Install: [Google Tag Assistant](https://chrome.google.com/webstore/detail/tag-assistant-legacy-by-g/kejbdjndbnbjgmefkgdddjlbokphdefk)
2. Visit: https://haiba.store
3. Click extension icon
4. Check: `Google Ads Remarketing` tag fires ✅

### Method 2: Real-Time Tracking

1. Go to: **Google Ads → Tools → Google Ads Conversions**
2. Click: **Check Tag**
3. Enter: `https://haiba.store`
4. Verify: Tag found ✅

### Method 3: Test Conversion

1. Visit: https://haiba.store
2. Generate an image
3. Wait 15 minutes
4. Check: **Google Ads → Conversions → Recent conversions**

---

## 🔥 Pro Tips

### Enhanced Conversion Tracking

Add to `layout.tsx` for better data:

```typescript
// Add after existing gtag config
gtag('config', 'AW-11097953181', {
  'allow_enhanced_conversions': true
});
```

### Track Revenue (if you add paid plans)

Update conversion tracking to include actual revenue:

```javascript
gtag('event', 'conversion', {
  'send_to': 'AW-11097953181/YOUR_LABEL',
  'value': actualPrice,  // e.g., 5.0 OMR
  'currency': 'OMR',
  'transaction_id': transactionId  // Unique order ID
});
```

### Remarketing Lists

Create audiences in Google Ads:

1. **Visitors who generated images** → Target with upgrade ads
2. **Visitors who signed up but didn't generate** → Re-engagement ads
3. **Visitors who downloaded images** → High-intent users

---

## 📈 Expected Performance

### First 7 Days (Testing Phase):

| Metric | Target |
|--------|--------|
| Impressions | 1,000+ |
| Clicks | 50-80 |
| CTR | 5-8% |
| Conversions (Images) | 10-20 |
| Cost per Conversion | 0.50-1.00 OMR |

### After 30 Days (Optimized):

| Metric | Target |
|--------|--------|
| Impressions | 10,000+ |
| Clicks | 500-800 |
| CTR | 8-12% |
| Conversions | 100-150 |
| Cost per Conversion | 0.20-0.50 OMR |

---

## 🚀 Campaign Structure Recommendation

### Campaign 1: Search - Arabic Keywords
```
Budget: 5-10 OMR/day
Keywords: ذكاء اصطناعي عماني، مولد صور الأزياء العمانية
Location: Oman only
Language: Arabic
```

### Campaign 2: Search - English Keywords
```
Budget: 3-5 OMR/day
Keywords: omani ai generator, omani clothing creator
Location: Oman + GCC countries
Language: English
```

### Campaign 3: Display - Remarketing
```
Budget: 2-3 OMR/day
Audience: Visited but didn't convert
Creative: Show sample images
```

---

## 🔍 Troubleshooting

### Tag Not Firing?

**Check 1:** View page source, find:
```html
<script async src="https://www.googletagmanager.com/gtag/js?id=AW-11097953181"></script>
```

**Check 2:** Open browser console, type:
```javascript
gtag
```
Should return: `function gtag(){...}`

**Check 3:** Generate an image, check console for:
```
✅ Google Ads: Image generation tracked
```

### Conversions Not Showing?

1. Wait 3-24 hours (Google Ads has delay)
2. Check conversion action is "Active"
3. Verify conversion label is correct
4. Test with Google Tag Assistant

### Low Conversion Rate?

**Optimize:**
- ✅ Add more ad extensions (sitelinks, callouts)
- ✅ Improve landing page (faster load time)
- ✅ Test different ad copy
- ✅ Adjust bidding strategy to "Maximize Conversions"

---

## 📞 Support

**Email:** haiba.auth@gmail.com  
**Phone:** +968 77310987

---

## 📝 Changelog

- **2024-11-16**: Initial Google Ads tag installation
  - Global site tag added to layout.tsx
  - Conversion tracking for image generation
  - Sign-up event tracking
  - Download event tracking
