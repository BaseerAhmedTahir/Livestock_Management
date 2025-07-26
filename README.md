# Comprehensive Livestock Management App

A full-stack web application designed to streamline the management of livestock, focusing on goats. This application provides tools for tracking individual animals, managing health records, monitoring financial performance, assigning caretakers, and generating insightful reports. Built with React, TypeScript, Tailwind CSS, and Supabase, it offers a robust and scalable solution for livestock farmers and businesses.

## 🌟 Features

*   **User Authentication:** Secure sign-up and sign-in for owners and caretakers.
*   **Multi-Business Support:** Owners can manage multiple businesses, each with its own set of livestock and data.
*   **Goat Management:**
    *   Add, view, edit, and delete individual goat profiles.
    *   Track key details: tag number, nickname, breed, gender, date of birth, color, current weight, purchase/sale details.
    *   Upload and manage photos for each goat.
    *   Generate and scan QR codes for quick access to goat profiles.
*   **Health Records:**
    *   Log and track various health events (vaccinations, illnesses, injuries, deworming, checkups, reproductive events).
    *   Record treatment details, veterinarian information, costs, and notes.
    *   Set and track next due dates for health interventions.
    *   Filter records by type and status.
*   **Weight Tracking:** Record and monitor weight changes over time for individual goats.
*   **Caretaker Management:**
    *   Add and manage caretaker profiles with contact and payment information.
    *   Assign goats to specific caretakers.
    *   Invite caretakers to the system with granular, role-based access permissions (owner-controlled).
*   **Financial Management:**
    *   Track purchase and sale prices for goats.
    *   Record general and goat-specific expenses (feed, medicine, transport, veterinary, etc.).
    *   Automated profit/loss calculation per goat and overall business.
    *   Profit sharing calculation for caretakers based on defined payment models.
    *   Overview of total investment, revenue, expenses, and net profit.
*   **Reports & Analytics:**
    *   Generate comprehensive inventory reports.
    *   View financial summaries, including expense breakdowns and sales performance.
    *   Monitor caretaker performance and earnings.
    *   Summarize health records and upcoming treatments.
*   **QR Scanner:** Quickly scan QR codes to pull up goat profiles and relevant information.
*   **Responsive Design:** Optimized for various screen sizes, from desktop to mobile.

## 🚀 Technologies Used

*   **Frontend:**
    *   [React](https://react.dev/) (v18.3.1) - JavaScript library for building user interfaces.
    *   [TypeScript](https://www.typescriptlang.org/) (v5.5.3) - Superset of JavaScript that adds static typing.
    *   [Vite](https://vitejs.dev/) (v5.4.2) - Next-generation frontend tooling.
    *   [Tailwind CSS](https://tailwindcss.com/) (v3.4.1) - Utility-first CSS framework for rapid UI development.
    *   [React Hook Form](https://react-hook-form.com/) (v7.60.0) - Performant, flexible and extensible forms with easy-to-use validation.
    *   [Recharts](https://recharts.org/) (v3.1.0) - Composable charting library built on React components.
    *   [Lucide React](https://lucide.dev/) (v0.344.0) - Beautifully simple and customizable open-source icons.
    *   [date-fns](https://date-fns.org/) (v4.1.0) - Modern JavaScript date utility library.
    *   [html5-qrcode](https://github.com/mebjas/html5-qrcode) (v2.3.8) - QR code scanning library.
    *   [qrcode](https://www.npmjs.com/package/qrcode) (v1.5.4) - QR code generation library.
*   **Backend & Database:**
    *   [Supabase](https://supabase.com/) - Open-source Firebase alternative providing PostgreSQL database, authentication, and Edge Functions.
*   **Development Tools:**
    *   [ESLint](https://eslint.org/) (v9.9.1) - Pluggable JavaScript linter.
    *   [Autoprefixer](https://github.com/postcss/autoprefixer) (v10.4.18) - PostCSS plugin to parse CSS and add vendor prefixes.

## 🛠️ Getting Started

Follow these instructions to get a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

Before you begin, ensure you have the following installed:

*   [Node.js](https://nodejs.org/en/) (LTS version recommended)
*   [npm](https://www.npmjs.com/) (comes with Node.js) or [Yarn](https://yarnpkg.com/)
*   [Git](https://git-scm.com/)

### Installation

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd comprehensive-livestock-app
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    # or
    yarn install
    ```

3.  **Set up Supabase:**
    *   Go to [Supabase.com](https://supabase.com/) and create a new project.
    *   Navigate to `Project Settings` > `API` to find your `Project URL` and `anon public` key.
    *   Create a `.env` file in the root of your project and add your Supabase credentials:
        ```
        VITE_SUPABASE_URL="YOUR_SUPABASE_PROJECT_URL"
        VITE_SUPABASE_ANON_KEY="YOUR_SUPABASE_ANON_PUBLIC_KEY"
        ```
    *   **Database Schema:** Apply the provided SQL migrations to your Supabase project. You can find the migration files in the `supabase/migrations` directory. You'll need to use the Supabase CLI or manually run the SQL scripts in your Supabase SQL Editor.
    *   **Edge Functions:** Deploy the Supabase Edge Functions located in the `supabase/functions` directory. These are crucial for features like caretaker invitation.

### Running the App

To start the development server:

```bash
npm run dev
# or
yarn dev
