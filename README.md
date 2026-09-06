<div align="center">
  <img src="public/assets/images/logo.png" alt="MyNextAnime Logo" width="250" />
  <h1>✨ MyNextAnime AI</h1>
  <p>Your Personal AI-Powered Anime Concierge.</p>
  
  [![Live Demo](https://img.shields.io/badge/Live_Demo-mynextanime--ai.vercel.app-blue?style=for-the-badge&logo=vercel)](https://mynextanime-ai.vercel.app/)
</div>

<br />

## 🌟 About The Project

Stop scrolling endlessly through generic lists. **MyNextAnime AI** is a hyper-personalized, conversational AI chatbot designed specifically for otakus and anime enthusiasts. Built by **[Shashank](https://github.com/mehangman)**, this platform acts as your personal anime guide. 

Tell the AI exactly what you're in the mood for—whether it's a dark psychological thriller, a relaxing slice of life, or an epic fantasy—and receive instantly tailored recommendations complete with beautiful posters, community ratings, and synopses. 

**[🔗 Try it live here!](https://mynextanime-ai.vercel.app/)**

---

## 🚀 Key Features

- **🧠 Conversational AI Guide:** Powered by the blazing-fast Groq API and Qwen model, the chatbot understands complex genres, specific tropes, and mood-based requests, interacting with you just like a real anime companion.
- **⚡ Real-Time Metadata Verification:** Automatically verifies AI-generated recommendations against top anime databases (**Jikan/MyAnimeList, AniList, Kitsu**) to ensure 100% real titles with high-quality posters and accurate scores.
- **📋 Personal Watchlist:** Found something you like? Click a button to instantly save it to your personal "My List" for tracking your next binge-watch.
- **🎨 Sleek, Modern UI:** A highly aesthetic, Claude-like interface featuring seamless animations, glassmorphism elements, and fully responsive design across desktop and mobile devices.
- **🔐 Secure Authentication:** Seamless user login and data persistence handled securely by Supabase.

---

## 🛠️ Built With

* **Frontend:** [Next.js 14](https://nextjs.org/) (App Router), React, Tailwind CSS
* **Backend:** Next.js API Routes, [Supabase](https://supabase.com/) (Auth & PostgreSQL)
* **AI Engine:** [Groq API](https://groq.com/) (running `qwen3.8-27b`)
* **Anime APIs:** Jikan (MAL), AniList GraphQL, Kitsu
* **Deployment:** [Vercel](https://vercel.com/)

---

## 💻 Running it Locally

If you'd like to spin up the project locally:

1. **Clone the repo**
   ```sh
   git clone https://github.com/mehangman/mynextanime.git
   cd mynextanime
   ```
2. **Install NPM packages**
   ```sh
   npm install
   ```
3. **Set up Environment Variables**
   Rename `.env.example` to `.env.local` and enter your API keys for Groq and Supabase:
   ```env
   GROQ_API_KEY=your_groq_api_key_here
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url_here
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
   ```
4. **Run the development server**
   ```sh
   npm run dev
   ```
   Open `http://localhost:3000` to view the app!

---

## 👨‍💻 Author

**Shashank**
- GitHub: [@mehangman](https://github.com/mehangman)
- Instagram: [@shashxnk_verma](https://www.instagram.com/shashxnk_verma)

If you find this project useful or interesting, please consider giving it a ⭐ on GitHub!

---
*MyNextAnime AI — Find your next favorite anime in seconds.*
