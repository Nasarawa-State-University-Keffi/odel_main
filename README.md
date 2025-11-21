# ODEL Application Portal

A modern, responsive web application for Open Distance and eLearning (ODEL) student applications. Built with React, TypeScript, and Tailwind CSS.

## 🚀 Features

- **Multi-step Application Form**:
  - Personal Details
  - Contact Information
  - Next of Kin Details
  - Programme Selection
  - Payment Integration
- **Student Dashboard**: View application status and history.
- **Authentication**: Secure Login and Registration pages.
- **Responsive Design**: Optimized for all screen sizes (Mobile, Tablet, Desktop).
- **Form Validation**: Robust validation using Zod and React Hook Form.
- **Modern UI**: Clean, accessible interface built with Shadcn UI and Tailwind CSS.

## 🛠️ Tech Stack

- **Frontend Framework**: [React](https://reactjs.org/) (Vite)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **UI Components**: [Shadcn UI](https://ui.shadcn.com/)
- **State Management**: [TanStack Query](https://tanstack.com/query/latest)
- **Routing**: [React Router](https://reactrouter.com/)
- **Form Handling**: [React Hook Form](https://react-hook-form.com/)
- **Validation**: [Zod](https://zod.dev/)
- **Icons**: [Lucide React](https://lucide.dev/)

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ODEL
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Build for production**
   ```bash
   npm run build
   ```

## 📂 Project Structure

```
src/
├── components/         # Reusable UI components
│   ├── application/    # Application form steps
│   ├── dashboard/      # Dashboard widgets
│   └── ui/             # Shadcn UI primitives
├── pages/              # Application pages (Login, Register, Dashboard, etc.)
├── hooks/              # Custom React hooks
├── lib/                # Utilities and helper functions
└── App.tsx             # Main application component with routing
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License.
