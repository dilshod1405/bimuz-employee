# 🎯 BIMUZ Dashboard

<div align="center">

![React](https://img.shields.io/badge/React-19.2.0-61DAFB?style=for-the-badge&logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-7.2-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4.1-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)

Modern, responsive admin dashboard for BIMUZ education management system.

[Features](#-features) • [Installation](#-installation) • [Development](#-development) • [Deployment](#-deployment)

</div>

---

## 📋 Table of Contents

- [About](#-about)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Prerequisites](#-prerequisites)
- [Installation](#-installation)
- [Development](#-development)
- [Building](#-building)
- [Deployment](#-deployment)
- [Project Structure](#-project-structure)
- [Configuration](#-configuration)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🎨 About

BIMUZ Dashboard is a modern, feature-rich admin panel built with React and TypeScript. It provides a comprehensive interface for managing employees, students, groups, and payments in the BIMUZ education management system.

### Key Highlights

- ✨ **Modern UI/UX** - Beautiful, responsive design with shadcn/ui components
- 🔐 **Authentication** - JWT-based authentication with automatic token refresh
- 📊 **Real-time Data** - Interactive tables with search, filter, and pagination
- 🎯 **Role-based Access** - Different permissions for different user roles
- 📱 **Mobile Responsive** - Works seamlessly on all devices
- 🚀 **Fast Performance** - Optimized with Vite and code splitting

---

## ✨ Features

### 🏢 Employee Management
- View, create, edit, and delete employees
- Role-based filtering (Developer, Director, Administrator, Mentor, Sales Agent)
- Search functionality with real-time filtering
- Avatar upload and profile management

### 👨‍🎓 Student Management
- Complete student CRUD operations
- Status management (active/inactive)
- Source tracking (Instagram, Website, etc.)
- Contract management and verification

### 📚 Group Management
- Group creation and management
- Mentor assignment
- Starting date tracking with countdown
- Speciality and schedule management
- Seat availability tracking

### 💰 Payment Management
- Invoice viewing and filtering
- Status-based filtering (Created, Pending, Paid, Overdue, Cancelled)
- Search by name, phone, group, or invoice ID
- Detailed invoice view with all information
- Payment history tracking

### 🔐 Authentication & Authorization
- Secure login system
- JWT token management
- Automatic token refresh
- Role-based access control
- Session management

---

## 🛠 Tech Stack

### Core
- **[React 19.2](https://react.dev/)** - UI library
- **[TypeScript 5.9](https://www.typescriptlang.org/)** - Type safety
- **[Vite 7.2](https://vitejs.dev/)** - Build tool and dev server
- **[React Router 7.12](https://reactrouter.com/)** - Client-side routing

### UI Components & Styling
- **[shadcn/ui](https://ui.shadcn.com/)** - Component library
- **[Radix UI](https://www.radix-ui.com/)** - Accessible component primitives
- **[TailwindCSS 4.1](https://tailwindcss.com/)** - Utility-first CSS
- **[Lucide React](https://lucide.dev/)** - Icon library

### State Management & Data Fetching
- **[Zustand 5.0](https://zustand-demo.pmnd.rs/)** - Lightweight state management
- **[Axios 1.13](https://axios-http.com/)** - HTTP client
- **[React Context](https://react.dev/reference/react/useContext)** - Auth context

### Development Tools
- **[ESLint](https://eslint.org/)** - Code linting
- **[TypeScript ESLint](https://typescript-eslint.io/)** - TypeScript linting
- **[pnpm](https://pnpm.io/)** - Package manager

### Deployment
- **[Docker](https://www.docker.com/)** - Containerization
- **[Nginx](https://nginx.org/)** - Web server
- **[GitLab CI/CD](https://docs.gitlab.com/ee/ci/)** - Continuous integration

---

## 📦 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** >= 20.x
- **pnpm** >= 8.x (recommended) or npm/yarn
- **Docker** >= 24.x (for containerized deployment)
- **Git** (for version control)

---

## 🚀 Installation

### Clone the Repository

```bash
git clone <repository-url>
cd bimuz-dashboard
```

### Install Dependencies

```bash
# Using pnpm (recommended)
pnpm install

# Or using npm
npm install

# Or using yarn
yarn install
```

### Environment Variables

Create a `.env` file in the root directory (optional for development):

```env
VITE_API_BASE_URL=http://localhost:8000
```

For production, the API base URL should be set during the Docker build process.

---

## 💻 Development

### Start Development Server

```bash
pnpm dev
```

The application will be available at `http://localhost:5173`

### Available Scripts

```bash
# Start development server
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm preview

# Run linter
pnpm lint
```

### Development Features

- ⚡ **Hot Module Replacement (HMR)** - Instant updates during development
- 🔍 **TypeScript** - Full type checking and IntelliSense
- 🎨 **TailwindCSS** - Utility-first styling with JIT compilation
- 🧹 **ESLint** - Code quality and consistency

---

## 🏗 Building

### Production Build

```bash
pnpm build
```

The production build will be generated in the `dist/` directory.

### Build Output

```
dist/
├── index.html
├── assets/
│   ├── index-[hash].js
│   └── index-[hash].css
└── ...
```

---

## 🐳 Deployment

### Docker Deployment

#### Build Docker Image

```bash
docker build \
  --build-arg VITE_API_BASE_URL=https://api.yourdomain.com \
  -t bimuz-dashboard:latest .
```

#### Run with Docker Compose

```bash
docker-compose up -d
```

The dashboard will be available at `http://localhost:3000`

#### Docker Compose Configuration

```yaml
services:
  dashboard:
    build:
      context: .
      args:
        VITE_API_BASE_URL: ${VITE_API_BASE_URL:-http://localhost:8000}
    ports:
      - "3000:80"
    restart: unless-stopped
```

### GitLab CI/CD

The project includes GitLab CI/CD configuration for automatic builds and deployments.

#### Build Configuration

The `.gitlab-ci.yml` file automatically:
- Builds Docker images on push
- Pushes images to GitLab Container Registry
- Uses build cache for faster builds

#### Environment Variables

Set the following in GitLab CI/CD Variables:

- `VITE_API_BASE_URL` - API base URL for the frontend

### Production Deployment Steps

1. **Build the image** (or pull from registry):
   ```bash
   docker pull registry.gitlab.com/your-group/bimuz-dashboard:latest
   ```

2. **Run the container**:
   ```bash
   docker run -d \
     -p 3000:80 \
     --name bimuz-dashboard \
     --restart unless-stopped \
     registry.gitlab.com/your-group/bimuz-dashboard:latest
   ```

3. **Or use Docker Compose**:
   ```bash
   docker-compose up -d
   ```

---

## 📁 Project Structure

```
bimuz-dashboard/
├── public/                 # Static assets
├── src/
│   ├── components/         # React components
│   │   ├── ui/            # shadcn/ui components
│   │   ├── employees/     # Employee-related components
│   │   ├── students/      # Student-related components
│   │   ├── groups/        # Group-related components
│   │   └── ...
│   ├── contexts/          # React contexts
│   │   └── AuthContext.tsx
│   ├── hooks/             # Custom React hooks
│   ├── lib/               # Utility functions
│   │   ├── api.ts        # API client configuration
│   │   └── utils.ts      # Helper functions
│   ├── pages/             # Page components
│   │   ├── Employees.tsx
│   │   ├── Students.tsx
│   │   ├── Groups.tsx
│   │   ├── Payments.tsx
│   │   └── Login.tsx
│   ├── stores/            # Zustand stores
│   │   └── authStore.ts
│   ├── App.tsx            # Main app component
│   └── main.tsx           # Entry point
├── .dockerignore          # Docker ignore file
├── .gitignore            # Git ignore file
├── .gitlab-ci.yml        # GitLab CI/CD configuration
├── Dockerfile            # Docker image definition
├── docker-compose.yml    # Docker Compose configuration
├── index.html            # HTML template
├── package.json          # Dependencies and scripts
├── pnpm-lock.yaml        # Lock file
├── tsconfig.json         # TypeScript configuration
├── vite.config.ts        # Vite configuration
└── README.md             # This file
```

---

## ⚙️ Configuration

### API Configuration

The API base URL can be configured in several ways:

1. **Environment Variable** (development):
   ```env
   VITE_API_BASE_URL=http://localhost:8000
   ```

2. **Build Argument** (Docker):
   ```bash
   docker build --build-arg VITE_API_BASE_URL=https://api.example.com .
   ```

3. **Docker Compose**:
   ```yaml
   environment:
     - VITE_API_BASE_URL=https://api.example.com
   ```

### Authentication

The dashboard uses JWT-based authentication:
- Access tokens are stored in memory (Zustand store)
- Refresh tokens are stored in localStorage
- Automatic token refresh on 401 errors
- Automatic logout on refresh failure

---

## 🔧 Troubleshooting

### Common Issues

#### Build Fails
- Ensure Node.js >= 20.x is installed
- Clear node_modules and reinstall: `rm -rf node_modules pnpm-lock.yaml && pnpm install`

#### Docker Build Fails
- Check Docker version: `docker --version`
- Ensure Dockerfile syntax is correct
- Verify build arguments are set correctly

#### API Connection Issues
- Verify `VITE_API_BASE_URL` is set correctly
- Check CORS settings on the API server
- Ensure API server is running and accessible

#### Port Already in Use
- Change the port in `docker-compose.yml`
- Or stop the process using the port: `lsof -ti:3000 | xargs kill`

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Style

- Follow TypeScript best practices
- Use ESLint configuration
- Write meaningful commit messages
- Add comments for complex logic

---

## 📄 License

This project is private and proprietary. All rights reserved.

---

## 📞 Support

For support, please contact the development team or open an issue in the repository.

---

<div align="center">

**Built with ❤️ by the BIMUZ Team**

[⬆ Back to Top](#-bimuz-dashboard)

</div>