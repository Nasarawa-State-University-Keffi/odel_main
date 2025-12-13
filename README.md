# ODEL Application Portal

A modern, responsive web application for Open Distance and eLearning (ODEL) student applications. Built with React, TypeScript, Tailwind CSS, and powered by Supabase.

## 🚀 Features

- **Multi-step Application Form**:
  - Personal Details
  - Contact Information
  - Next of Kin Details
  - Programme Selection
  - Payment Integration
- **Student Dashboard**: View application status and history.
- **Admin Dashboard**:
  - **Staff Management**: Create and manage staff accounts/roles.
  - **Sidebar Navigation**: Efficient navigation for admin tasks.
- **Authentication**: Secure Login and Registration for Students and Admins.
- **Responsive Design**: Optimized for all screen sizes (Mobile, Tablet, Desktop).
- **Form Validation**: Robust validation using Zod and React Hook Form.
- **Modern UI**: Clean, accessible interface built with Shadcn UI and Tailwind CSS.

## 🛠️ Tech Stack

- **Frontend Framework**: [React](https://reactjs.org/) (Vite)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **UI Components**: [Shadcn UI](https://ui.shadcn.com/)
- **Backend & Auth**: [Supabase](https://supabase.com/)
- **State Management**: [TanStack Query](https://tanstack.com/query/latest)
- **Routing**: [React Router](https://reactrouter.com/)
- **Form Handling**: [React Hook Form](https://react-hook-form.com/)
- **Validation**: [Zod](https://zod.dev/)
- **Icons**: [Lucide React](https://lucide.dev/)

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd odel_main
   ```

2. **Navigate to the frontend directory**
   ```bash
   cd frontend
   ```

3. **Install dependencies**
   ```bash
   npm install
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Build for production**
   ```bash
   npm run build
   ```

## 📂 Project Structure

```
frontend/
├── src/
│   ├── components/         # Reusable UI components
│   │   ├── ui/             # Shadcn UI primitives
│   ├── features/           # Feature-based groupings
│   │   ├── admin/          # Admin dashboard & components
│   │   ├── auth/           # Authentication flows
│   │   ├── application/    # Application form logic
│   │   ├── dashboard/      # Student dashboard
│   ├── pages/              # Route components
│   ├── hooks/              # Custom React hooks
│   ├── contexts/           # React Context providers (Auth, etc.)
│   ├── lib/                # Utilities (utils.ts, etc.)
│   └── App.tsx             # Main application component
└── ...
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License.
