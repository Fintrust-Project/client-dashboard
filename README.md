# CMS Website

A comprehensive Client Management System built with React and Supabase, featuring authentication, income tracking, client management, and user administration.

## Features

- **Authentication System**
  - Secure login via Supabase Auth (Email/Password)
  - Admin and user roles handled via `profiles` table
  - Persistent sessions

- **Dashboard**
  - Income chart with weekly/monthly views
  - Visual representation of income trends
  - Total income summary

- **Client Management**
  - Add clients with complete information
  - Client fields: Serial number, Name, Mobile number, Date, Status, Payment, Message
  - Status dropdown (Trader, Not Trader, Waiting)
  - Multiple payment tracking per client
  - Click on client row to view full profile with payment history
  - Add new payments to existing clients
  - **Import Clients (Admin Only)**
    - Import clients via Excel (.xlsx, .xls) or CSV files
    - Import from existing admin client data
    - Assign imported clients to specific users
    - Preview data before import
    - See `sample-clients.csv` for file format reference

- **Side Panel Navigation**
  - Dashboard
  - Client Data
  - Attendance
  - Profile
  - User Management (Admin only)

- **User Management (Admin Only)**
  - Add new users
  - Assign roles (Admin/User)
  - View all users

- **Attendance Tracking**
  - Mark daily attendance
  - View attendance statistics
  - Monthly attendance rate

## Installation

1. Install dependencies:
```bash
npm install
```

2. Configure Environment Variables:
   Ensure you have a `.env` file in the root directory with your Supabase credentials:
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to the local URL (typically `http://localhost:5173`)

## Database Setup

The database schema is managed by Prisma (`prisma/schema.prisma`) and is provider-agnostic —
any standard PostgreSQL connection string works (Supabase, Railway, etc.). Set `DATABASE_URL`
in `.env` (see `.env.example`), then apply the schema:

```bash
npx prisma migrate deploy
```

Authentication (sign-up/sign-in/OTP) is handled separately via Supabase Auth
(`NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`), independent of which Postgres
provider `DATABASE_URL` points to.

## Default Credentials

You need to create users in your Supabase project (Authentication > Users) or use the sign-up flow if enabled.
- **Admin**: Ensure the user has `role = 'admin'` in the `public.profiles` table.
- **User**: Standard users have `role = 'user'`.

## Tech Stack

- React 18
- React Router DOM
- Supabase (Backend & Auth)
- Recharts (for charts)
- date-fns (for date formatting)
- PapaParse (for CSV parsing)
- xlsx (for Excel file parsing)
- Vite (build tool)

## Project Structure

```
src/
  ├── components/        # Reusable components
  │   ├── SidePanel.jsx
  │   ├── IncomeChart.jsx
  │   ├── ClientData.jsx
  │   ├── ClientProfile.jsx
  │   ├── Profile.jsx
  │   ├── Attendance.jsx
  │   └── UserManagement.jsx
  ├── pages/            # Page components
  │   ├── Login.jsx
  │   └── Dashboard.jsx
  ├── context/          # React context
  │   └── AuthContext.jsx
  ├── App.jsx
  └── main.jsx
```

## Usage

1. **View Dashboard**: See income charts and statistics
2. **Manage Clients**: Add clients and track their payments
3. **Import Clients** (Admin): 
   - Click "Import Clients" button in Client Data page
   - Choose to upload CSV/Excel file or select from existing admin data
   - Select target user to assign clients to
   - Preview and import
   - See `sample-clients.csv` for file format reference
4. **Track Attendance**: Mark your daily attendance
5. **Manage Users** (Admin): Add new users to the system

## Import File Format

When importing clients via CSV or Excel, use the following columns:
- **Name** (required): Client's full name
- **Mobile** or **Phone** (required): Mobile/phone number
- **Date**: Date in YYYY-MM-DD format or any standard date format
- **Status**: trader, not-trader, or waiting
- **Payment** or **Amount**: Payment amount (numeric)
- **Message** or **Note**: Message from client

See `sample-clients.csv` for an example file format.

## Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

