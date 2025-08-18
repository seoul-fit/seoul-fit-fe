# Seoul Fit Frontend 🏙️

> **AI-powered Seoul Public Facilities Navigator**  
> Discover, navigate, and optimize your experience with Seoul's public facilities through real-time data and intelligent recommendations.

[![Next.js](https://img.shields.io/badge/Next.js-15.4.4-black)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.1.0-blue)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4.17-38B2AC)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

---

## 🌟 Features

### 🗺️ **Interactive Map Experience**
- **Real-time facility visualization** with clustering for performance
- **Multi-category filtering** (Parks, Libraries, Cultural Spaces, Restaurants, etc.)
- **Smart location-based search** with auto-suggestions
- **Personalized facility recommendations**

### 📊 **Live Data Integration**
- **Real-time congestion levels** for popular facilities
- **Current weather conditions** with location-specific forecasts
- **Public transportation integration** (Seoul Subway stations)
- **Bike sharing stations** (Seoul Bike "Ttareungyi")

### 🎯 **Smart Features**
- **AI-powered recommendations** based on user preferences
- **Notification system** for facility updates and alerts
- **Dark/Light mode support** with system preference detection
- **Responsive design** optimized for all devices

### 🔐 **User Experience**
- **Kakao Login integration** for personalized experience
- **Preference management** with persistent storage
- **Accessibility-first design** following WCAG guidelines
- **Progressive Web App** capabilities

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18.0 or higher
- **npm** 9.0 or higher
- **Git** for version control

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/seoul-fit-fe.git
   cd seoul-fit-fe
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env.local` file in the root directory:
   ```bash
   touch .env.local
   ```
   
   Add the following environment variables:
   ```env
   # Kakao Map API Key (Required)
   NEXT_PUBLIC_KAKAO_MAP_API_KEY=your_kakao_map_api_key
   
   # Seoul Open Data API Key (Required)
   SEOUL_API_KEY=your_seoul_open_data_key
   
   # Backend API URL (Optional - defaults to localhost)
   NEXT_PUBLIC_API_BASE_URL=http://localhost:8080/
   
   # Environment
   NODE_ENV=development
   ```
   
   ### 🔑 How to Get API Keys:
   
   #### **Kakao Map API Key**
   1. Visit [Kakao Developers Console](https://developers.kakao.com/)
   2. Create a new application or select existing one
   3. Go to **"Platforms"** → **"Web"** → Add your domain
   4. Go to **"APIs"** → Enable **"Maps"** service
   5. Copy your **JavaScript Key** from **"App Settings"** → **"App Keys"**
   
   #### **Seoul Open Data API Key**
   1. Visit [Seoul Open Data Portal](https://data.seoul.go.kr/)
   2. Sign up for a free account
   3. Go to **"Data Application"** → **"My Applications"**
   4. Click **"Request API Key"**
   5. Fill out the application form (usually approved instantly)
   6. Copy your **Authentication Key**

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

---

## 🛠️ Development

### Available Scripts

```bash
# Development
npm run dev          # Start development server with Turbopack
npm run build        # Build for production
npm run start        # Start production server

# Code Quality
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint issues automatically
npm run type-check   # Run TypeScript type checking
npm run format       # Format code with Prettier
npm run validate     # Run all quality checks

# Maintenance
npm run clean        # Clean build artifacts
```

### Project Structure

```
seoul-fit-fe/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes
│   ├── auth/              # Authentication pages
│   └── globals.css        # Global styles
├── components/            # React components
│   ├── auth/             # Authentication components
│   ├── layout/           # Layout components
│   ├── map/              # Map-related components
│   └── ui/               # Reusable UI components
├── hooks/                # Custom React hooks
├── lib/                  # Utility libraries
├── services/             # API services
├── store/                # State management (Zustand)
├── styles/               # Additional stylesheets
└── utils/                # Utility functions
```

### Tech Stack

#### **Frontend Core**
- **[Next.js 15.4.4](https://nextjs.org/)** - React framework with App Router
- **[React 19.1.0](https://reactjs.org/)** - UI library with latest features
- **[TypeScript 5](https://www.typescriptlang.org/)** - Type-safe JavaScript

#### **Styling & UI**
- **[TailwindCSS 3.4.17](https://tailwindcss.com/)** - Utility-first CSS framework
- **[Radix UI](https://www.radix-ui.com/)** - Accessible component primitives
- **[Lucide React](https://lucide.dev/)** - Beautiful icon library

#### **State Management**
- **[Zustand](https://zustand-demo.pmnd.rs/)** - Lightweight state management
- **React Context** - For user authentication and preferences

#### **Maps & Location**
- **[Kakao Map API](https://apis.map.kakao.com/)** - Interactive maps
- **Geolocation API** - User location services
- **Real-time data** - Seoul Open Data Portal integration

#### **Development Tools**
- **[ESLint](https://eslint.org/)** - Code linting with strict rules
- **[Prettier](https://prettier.io/)** - Code formatting
- **[Turbopack](https://turbo.build/pack)** - Ultra-fast bundler

---

## 🗺️ Data Sources

This application integrates with multiple Seoul metropolitan government APIs:

- **Seoul Open Data Portal** - Public facility information
- **Seoul Transportation Corporation** - Subway real-time data
- **Seoul Bike (Ttareungyi)** - Bike sharing station data
- **Korea Meteorological Administration** - Weather data
- **Seoul Traffic Information** - Real-time congestion data

---

## 🤝 Contributing

We welcome contributions from the community! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Quick Contribution Steps

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Make your changes** following our [Code Style Guide](docs/guides/code-style.md)
4. **Run quality checks** (`npm run validate`)
5. **Commit your changes** (`git commit -m 'Add amazing feature'`)
6. **Push to the branch** (`git push origin feature/amazing-feature`)
7. **Open a Pull Request**

### Development Guidelines

- **Follow TypeScript best practices**
- **Write comprehensive tests** (coming soon)
- **Maintain 100% accessibility compliance**
- **Document your code** with clear comments
- **Follow semantic commit conventions**

---

## 📚 Documentation

- 📖 **[Getting Started Guide](docs/guides/getting-started.md)**
- 🏗️ **[Architecture Overview](ARCHITECTURE.md)**
- 🎨 **[Component Documentation](docs/components/)**
- 🔧 **[API Reference](docs/api/)**
- 🚀 **[Deployment Guide](docs/setup/deployment.md)**

---

## 🌍 Browser Support

| Browser | Version |
|---------|---------|
| Chrome | ≥ 88 |
| Firefox | ≥ 85 |
| Safari | ≥ 14 |
| Edge | ≥ 88 |

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Seoul Metropolitan Government** for providing open data APIs
- **Kakao** for the excellent map services
- **The React Community** for amazing open-source tools
- **Contributors** who help make this project better

---

## 🔗 Links

- **[Live Demo](https://seoul-fit-fe.vercel.app)** - Try it now!
- **[Issue Tracker](https://github.com/your-username/seoul-fit-fe/issues)** - Report bugs
- **[Discussions](https://github.com/your-username/seoul-fit-fe/discussions)** - Community chat
- **[Roadmap](docs/community/roadmap.md)** - Future plans

---

<div align="center">
  <sub>Built with ❤️ for Seoul citizens and visitors</sub>
</div>