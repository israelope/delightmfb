Delight MFB - Cooperative Society Digital Ledger 🚀

Delight MFB is a specialized, ultra-secure CRM and digital ledger system built for traditional Thrift and Credit Cooperative Societies.

It replaces physical passbooks, manual calculations, and physical guarantor signatures with a secure, automated digital dashboard, providing absolute transparency for members and powerful batch-management tools for administrators.

🧠 Core Philosophy & Security Architecture

To eliminate the massive liabilities of PCI compliance, webhook failures, and financial theft, this platform processes zero real-world currency.

Air-Gapped Transactions: The app acts as a "digital twin" to the cooperative's physical bank account. Members make offline deposits; Admins log them digitally.

$0 Authentication: Instead of paid SMS/Email OTPs, the system uses an Invite Code + Admin Approval workflow. New users must use an Admin-generated code to register and remain in a "Pending" locked state until an Admin physically verifies their identity and activates their account.

🛠 Tech Stack

Framework: Next.js (App Router)

Language: Standard JavaScript (.jsx)

Styling: Tailwind CSS

Icons: Lucide React

Database & Auth: Supabase (PostgreSQL)

Performance: Native Next.js SWC + React Compiler (enabled via next.config.mjs)

Utilities: browser-image-compression (for client-side avatar/receipt compression)

✨ Key Features

👨‍💼 Super Admin Command Center

Global Overview: Aggregate statistics tracking Total Cooperative Liquidity, Active Loans, and Expected Monthly Influx.

Invite Code Generator: Create single-use registration keys for new offline members.

Member Management: Approve pending accounts, suspend defaulters, and edit profiles.

Batch Contribution Logger: Spreadsheet-like UI to rapidly input monthly savings for multiple members.

Loan Pipeline: Review requested loans, verify guarantor status, and manually mark funds as "Disbursed".

👤 Member Transparency Portal

Wallet / Balance Card: Real-time display of total logged contributions.

Digital Passbook: Immutable table showing exact contribution history.

Smart Loan Requests: Client-side eligibility rules engine (e.g., 2x savings limit) that automatically calculates borrowing power.

Upcoming Deadlines: Visual alerts for upcoming monthly contribution dates or loan repayments.

📂 Project Architecture

The application utilizes Next.js Route Groups to separate authentication, member, and admin layouts while maintaining clean URLs.

├── app/
│   ├── (auth)/              # Public login & register (requires invite code)
│   ├── (admin)/             # Protected admin portal & management tools
│   ├── (member)/            # Protected user transparency dashboard
│   ├── pending/             # Locked waiting room for unapproved users
│   ├── layout.jsx           # Global layout & Context Providers
│   └── page.jsx             # Public Landing Page
├── components/
│   ├── ui/                  # Reusable, dumb components (Buttons, Inputs, Modals)
│   └── features/            # Complex, domain-specific widgets (TransactionTable, StatCard)
├── lib/                     # Supabase client & utility functions
└── middleware.js            # Route protection firewall (Intercepts unauthorized access)


🚀 Getting Started (Local Development)

1. Clone the repository

git clone https://github.com/your-username/delightmfb.git
cd delightmfb


2. Install dependencies

npm install


3. Set up Supabase

Create a new project on Supabase and create the following tables:

profiles (id, full_name, cooperative_id, role, status, avatar_url)

invite_codes (code, is_used, created_at)

contributions (id, user_id, amount, date, month_logged)

loans (id, user_id, principal, status, due_date)

Note: Manually insert your first 'Admin' user directly into the profiles table to bypass the waiting room.

4. Configure Environment Variables

Create a .env.local file in the root directory and add your Supabase keys:

NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key


5. Run the development server

npm run dev


Open http://localhost:3000 with your browser to see the result.

🚢 Deployment

The easiest way to deploy your Next.js app is to use the Vercel Platform.

Push your code to a GitHub repository.

Import the repository into Vercel.

Add your NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to the Vercel Environment Variables settings.

Deploy!

Built with 💡 and ☕ for Delight MFB by Oloyede Israel.