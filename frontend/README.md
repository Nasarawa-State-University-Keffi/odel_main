# ODEL Management Architecture - Frontend

A premium, enterprise-grade administrative portal for **Open Distance and e-Learning (ODEL)** systems. Built with a focus on modern aesthetics, modular architecture, and high-performance React patterns.

## 🚀 Tech Stack

- **Core**: [React 18](https://reactjs.org/) + [TypeScript](https://www.typescriptlang.org/)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **State & Data Fetching**: [TanStack Query (React Query) v5](https://tanstack.com/query/latest)
- **UI Components**: [Shadcn UI](https://ui.shadcn.com/) (Radix UI primitives)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **Form Handling**: [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/) validation
- **Routing**: [React Router DOM v6](https://reactrouter.com/)
- **HTTP Client**: [Axios](https://axios-http.com/) with centralized interceptors

## 📂 Project Structure

```text
src/
├── components/          # Reusable UI components (shadcn + custom)
├── contexts/            # React Contexts (Auth, Theme, etc.)
├── features/            # Feature-based modules (Admin, Staff, Student)
│   ├── admin/
│   │   ├── components/  # Feature-specific components
│   │   ├── services/    # API service layers
│   │   └── types/       # TypeScript interfaces/types
├── hooks/               # Custom reusable React hooks
├── layouts/             # Page layouts (AdminLayout, MainLayout)
├── lib/                 # Utility libraries (API instance, tailwind merge)
├── pages/               # Page entry points
└── services/            # Global API services
```

## 🛠 Features

### 1. Programme Settings
- Comprehensive configuration for academic programmes.
- Dynamic filtering for Levels, Semesters, and Programme Types.
- **Bulk Course Registration**: Intelligent available-course discovery and assignment.
- Semester parameter management (Credit units, pass marks, electives).

### 2. Staff & Faculty Management
- Centralized staff directory with faculty-specific filtering (ODEL focus).
- Role-based access control for Dean, Officer, and Admin roles.
- Modern CRUD interfaces with robust status-code error handling.

### 3. Student & Admission Services
- Global student search and identification.
- Admission statistics tracking and category filtering.
- Bulk admission processing and level management.

### 4. Advanced Reporting
- Date-range filtered reporting for various social and academic metrics.
- Visual data representation using Recharts.

## 💅 Design Language
The system follows a **Premium Administrative UI** pattern:
- **Aesthetics**: Glassmorphism effects, vibrant primary colors (#01402c), and professional typography (Inter).
- **Interactivity**: Smooth micro-animations powered by Framer Motion and contextual loading states.
- **Responsiveness**: Fully fluid grid systems for seamless mobile and desktop experiences.

## 🛠 Development

### Setup
```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

### Environment Config
Create a `.env` file based on `.env.example`:
```env
VITE_API_BASE_URL=https://api.example.com
```

---
*Maintained by the ODEL Development Team*
