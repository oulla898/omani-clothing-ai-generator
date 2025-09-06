This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.


for now its only trained on men clothing. 

- rethink the ui for something easy and appealing (mobile firist, using best design princepales)
- top section shown is just the generation section and the account stuff, once user scrolls he sees the rest of the details
- the logo now is not visable, fix
- sample images are now not visable, fix, refer to (C:\Users\oulla\Desktop\web\website5\sample images\رجل لابس مصر وبشت.jpg
C:\Users\oulla\Desktop\web\website5\sample images\طفل لابس مصر وبشت.jpg
C:\Users\oulla\Desktop\web\website5\sample images\عائلة رحال لابس مصر وبشت والللطفل لابس بس مصر.jpg
C:\Users\oulla\Desktop\web\website5\sample images\معرس بشت وخنجر.jpg)
- view refined prompt from gimini api (user can click something little bit hidden to view the refined prompt), later on, we will add section sending message from gemini to user, for ex (الذكاء الاصطناعي مدرب على الملابس الرجالية فقط في الوقت الحالي. ترقب التحديث) if the user asked for non men stuff (for now just put place holder in the ui proposal, we will do it later)
- history of old images generated (its alredy there on the current sql structure) place it in the ui in somewhere intuitive and clean
clicking generate image leads to the sign in pop up. keep the user prompt so after signing in he has the prompt in the box


markiting sentences to keep
- data-ar="ذكاء اصطناعي عماني يضبط لفة المِصر وهيبة البشت ولمعة الخنجر">
-  <h2 class="text-3xl md:text-4xl font-bold mb-12 text-gray-800" data-en="Carefully Designed Features" data-ar="مزايا صُمِّمت بعناية">Carefully Designed Features</h2>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                <div class="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all transform hover:scale-105">
                    <div class="text-4xl mb-4">🎨</div>
                    <h3 class="text-xl font-semibold mb-4 text-gray-800" data-en="Authentic Details" data-ar="تفاصيل أصيلة">Authentic Details</h3>
                    <p class="text-gray-600 leading-relaxed" data-en="Model fine-tuned for traditional Omani clothing with attention to patterns, colors, and Omani features." data-ar="النموذج صنع للأزياء العُمانية الرجالية مع اهتمام بالنقوش والألوان والملامح العمانية.">Model fine-tuned for traditional Omani clothing with attention to patterns, colors, and Omani features.</p>
                </div>
                
                <div class="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all transform hover:scale-105">
                    <div class="text-4xl mb-4">🇴🇲</div>
                    <h3 class="text-xl font-semibold mb-4 text-gray-800" data-en="Made in Oman" data-ar="تراثنا في أيدٍ أمينة">Made in Oman</h3>
                    <p class="text-gray-600 leading-relaxed" data-en="Developed by an Omani team passionate about preserving the beauty of our traditional attire with cutting-edge technology" data-ar="فريق عُماني يعمل بشغف للحفاظ على رونق لبسنا وتطويره بأحدث التقنيات">Developed by an Omani team passionate about preserving the beauty of our traditional attire with cutting-edge technology</p>
                </div>
                
                <div class="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all transform hover:scale-105">
                    <div class="text-4xl mb-4">⏱️</div>
                    <h3 class="text-xl font-semibold mb-4 text-gray-800" data-en="Fast" data-ar="سريع ">Fast and Reliable</h3>
                    <p class="text-gray-600 leading-relaxed" data-en="Most results are completed within seconds to under a minute, depending on service load." data-ar="غالبية النتائج تُنجز خلال ثوانٍ إلى أقل من دقيقة، بحسب الضغط على الخدمة.">Most results are completed within seconds to under a minute, depending on service load.</p>
                </div>
- © 2025 هيبة — صُنع بحب لتراثنا"  


running 
-- 3. Sample user_generations data to understand the structure
SELECT * FROM user_generations 
ORDER BY created_at DESC 
LIMIT 5;
returns
[
  {
    "id": "935fa395-94bc-4e33-b43c-081f8d434f8f",
    "user_id": "user_31scHw8tkavIDQY80bEiAZrSIri",
    "prompt": "omani girl wearing a modest, traditional Omani swimsuit, designed for modesty and comfort, possibly with flowing fabric elements or a full-coverage style, set against a serene Omani beach backdrop.",
    "image_url": "https://replicate.delivery/xezq/bffe1EOXRpIHfThySF5fdkw6A6tl4PciMwTrfZaeZvVBHmtoKA/out-0.webp",
    "created_at": "2025-09-03 08:49:19.989009+00",
    "updated_at": "2025-09-03 08:49:19.989009+00"
  },
  {
    "id": "e32c2c38-27a6-47e0-9a68-6d46cc2eb532",
    "user_id": "user_31scHw8tkavIDQY80bEiAZrSIri",
    "prompt": "omani girl wearing a modest, traditional Omani swimsuit, covering most of her body with flowing fabric, perhaps with intricate embroidery, set against a beautiful Omani coastal backdrop.",
    "image_url": "https://replicate.delivery/xezq/TDYepAwBlL2DJi7mZYtvEOHf2haG501wtafWnjucQ4HfrsFVB/out-0.webp",
    "created_at": "2025-09-03 08:48:00.895872+00",
    "updated_at": "2025-09-03 08:48:00.895872+00"
  },
  {
    "id": "b9f77250-e15e-4104-8638-52a9dc1bc3f8",
    "user_id": "user_31scHw8tkavIDQY80bEiAZrSIri",
    "prompt": "omani girl wearing a modest, culturally appropriate Omani dress, perhaps a simple dishdasha or a traditional headscarf.",
    "image_url": "https://replicate.delivery/xezq/VvcOFlZOEZ6SIRBfFBxDXe7NvFofTKHqsXEqbufLSbrOmsFVB/out-0.webp",
    "created_at": "2025-09-03 08:46:28.684059+00",
    "updated_at": "2025-09-03 08:46:28.684059+00"
  },
  {
    "id": "89c9eb74-b864-4e55-bfcd-1d1159bdac46",
    "user_id": "user_31scHw8tkavIDQY80bEiAZrSIri",
    "prompt": "omani woman in a stylish, modest one-piece swimsuit, perhaps with traditional Omani patterns subtly incorporated into the fabric, standing on a pristine Omani beach at sunset.",
    "image_url": "https://replicate.delivery/xezq/CgxDbReh1oSPNqSi1Y1Z77l7PmWxcd9gQLOSWZbO6k7titoKA/out-0.webp",
    "created_at": "2025-09-03 08:42:04.527674+00",
    "updated_at": "2025-09-03 08:42:04.527674+00"
  },
  {
    "id": "97eaf0c7-48d3-4516-a5b1-a0e00f135e17",
    "user_id": "user_31scHw8tkavIDQY80bEiAZrSIri",
    "prompt": "omani young Omani woman wearing a modest, knee-length swimming dress in a traditional Omani pattern, standing on a sandy beach at sunset.",
    "image_url": "https://replicate.delivery/xezq/XKNwKI3cUi7HDVYfkam3Kyf2eJtYsgw350yAjrIWWad0J2iqA/out-0.webp",
    "created_at": "2025-09-03 08:41:31.591313+00",
    "updated_at": "2025-09-03 08:41:31.591313+00"
  }
]

propose layout and design 


            
