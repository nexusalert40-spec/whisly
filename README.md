# Whisly

System Role & Objective:

Act as an expert Full-Stack Developer and UI/UX Specialist. Your task is to build a highly secure, mobile-first web application named "Whisly". This web app is designed to be easily wrapped into a native mobile application later. I have attached the UI mockups for the design. You must replicate the UI flawlessly using Tailwind CSS and React/Next.js, paying strict attention to the purple/pink gradient branding.

1. Authentication & User Management:

Method: Implement both Email/Password and Google OAuth authentication. Ensure the "Continue with Google" and "Continue with email" buttons shown in the mockups (e.g., 1000003882.jpg and 1000003047.png) are fully functional.

Registration: During sign-up (referencing 1000003116.jpg), users must provide their Full Name, Email, Password, and Country. For Google sign-ins, prompt the user for their Country if it's not automatically retrieved.

Security: Ensure strict validation for passwords and secure token handling.

2. Backend & Database (Supabase Integration):

Service: Use Supabase for the backend, database, and authentication (configure the Google Auth provider).

Account Reference: The database is associated with nexusalert40@gmail.com. Please set up the .env structure for me to plug in my Supabase URL, Anon Key, and Google OAuth credentials.

Database Schema Requirements:

Users: ID, Name, Email, Country, Subscription_Expiry_Date, Account_Level.

Stories: ID, User_ID, Title, Audio_URL, Category, Country, Likes_Count, Support_Amount.

Security (CRITICAL): You must implement strict Row Level Security (RLS) policies in Supabase. Only authenticated users can read/write. Users can only delete their own stories.

3. Core Functionality & Logic:

Audio Recording (referencing 1000003050.png): Build an in-browser audio recording interface with a timer (max 5:00 minutes). It must have Play, Stop, Delete, Re-record, and Publish buttons. Upload published audio files securely to Supabase Storage.

Geo-Targeted Feed (referencing 1000003049.png): The main feed must automatically filter and fetch stories based on the user's registered Country. It should highlight unspoken feelings, love stories, and emotional experiences from their region.

Categories: Implement functional filter tabs on the feed (All, Love, Life, Other).

4. Monetization & Payments (PayPal Integration):

Gateway: Integrate the PayPal API (associated with the merchant email: jhonberoti@gmail.com). Prepare the .env variables for the PayPal Client ID and Secret.

Payment Flow 1 (Account Upgrades/Registration Extension): Users must be able to purchase extensions for their registration duration and upgrade their accounts directly within the app.

Payment Flow 2 (Creator Support): On the feed (referencing 1000003049.png), there is a "Support" (Gift) button on each story card. Clicking this must trigger a micro-transaction flow via PayPal allowing users to send financial support/donations to the creator of that specific story.

Security: Ensure all payment confirmations are handled securely via backend webhooks to prevent frontend manipulation of subscription dates or support amounts.

Execution Constraints:

Please generate the project structure, write clean, modular, and well-commented code. Start by building the UI components exactly as shown in the attached images, then connect the state management, Supabase Auth/DB, and finally the PayPal logic. Be highly cautious with error handling and loading states.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://whisly.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/b44532a3-67c4-449f-8613-3f6b7bfbe43a).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
