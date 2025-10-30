# cBioPortal Data Contribution Dashboard

A modern, interactive web application for tracking and managing data contributions to [cBioPortal](https://www.cbioportal.org/), a leading platform for exploring and visualizing cancer genomics data.

## 🌟 Overview

This dashboard provides a centralized platform for researchers and clinicians to:
- Submit cancer genomics datasets and suggest publications for curation
- Track the status of submissions through a transparent curation pipeline
- View comprehensive analytics on cBioPortal's growing collection of cancer studies
- Monitor community contributions and data release timelines

## ✨ Features

### 🏠 Home Page
- Welcome interface with clear call-to-action for data submission and status tracking
- Quick access to analytics preview showing key statistics
- Community impact messaging to encourage participation

### 📊 Analytics Dashboard
Real-time visualization of cBioPortal data including:
- **Statistics Cards**: Total studies, samples, and cancer types
- **Cumulative Growth Chart**: Historical growth of studies over time
- **New Data Release Chart**: Upcoming data releases
- **Samples by Cancer Type**: Distribution of samples across different cancer types
- **Sample Counts by Data Type**: Breakdown by genomic data types (e.g., mutation, CNA, RNA-seq)
- **Tracker Status Chart**: Current status of submissions in the curation pipeline

### 🔍 Track Status
- **Published Studies Tab**: Track papers suggested for curation from published literature
- **Pre-publication Data Tab**: Monitor datasets submitted before publication
- Real-time status updates with visual progress indicators
- Search functionality to find specific submissions
- Interactive grid with sortable and filterable columns
- Detailed submission flow tracker showing:
  - Initial submission
  - Review stages
  - Data validation
  - Final approval and release

### 📝 Submit Content
Form-based interface for:
- Submitting new cancer genomics datasets
- Suggesting published papers for curation
- Providing all necessary metadata for successful data integration

## 🛠️ Technology Stack

### Frontend Framework
- **React 18.3.1** with TypeScript
- **Vite 5.4.1** for fast development and optimized builds
- **React Router DOM 6.26.2** for client-side routing

### UI Components
- **Radix UI** primitives for accessible, unstyled components
- **Tailwind CSS 3.4.11** for utility-first styling
- **shadcn/ui** component library
- **Lucide React** for icons

### Data Visualization
- **Recharts 2.12.7** for interactive charts and graphs
- **AG Grid 31.2.0** for advanced data tables with sorting, filtering, and custom rendering

### State Management & Data Fetching
- **TanStack Query (React Query) 5.56.2** for server state management
- **React Hook Form 7.53.0** for form handling
- **Zod 3.23.8** for schema validation

### Styling & Theming
- **next-themes** for dark/light mode support
- **Tailwind Animate** for smooth animations
- **class-variance-authority** for component variants

## 📁 Project Structure

```
portal-dashboard-44644/
├── public/
│   ├── favicon.ico
│   ├── lovable-uploads/          # Project assets and images
│   └── placeholder.svg
├── src/
│   ├── components/
│   │   ├── analytics/            # Analytics chart components
│   │   │   ├── CancerSubtypesChart.tsx
│   │   │   ├── CumulativeGrowthChart.tsx
│   │   │   ├── NewDataReleaseChart.tsx
│   │   │   ├── SamplesByCancerTypeChart.tsx
│   │   │   ├── StatisticsCards.tsx
│   │   │   └── ...
│   │   ├── home/                 # Home page components
│   │   │   ├── AnalyticsPreview.tsx
│   │   │   └── AtAGlanceSection.tsx
│   │   ├── track-status/         # Status tracking components
│   │   │   ├── GridConfig.tsx
│   │   │   ├── SubmissionFlowTracker.tsx
│   │   │   ├── SubmissionGrid.tsx
│   │   │   └── SubmissionProgressKey.tsx
│   │   ├── ui/                   # Reusable UI components (shadcn/ui)
│   │   ├── Footer.tsx
│   │   ├── Header.tsx
│   │   └── SharedLayout.tsx
│   ├── data/                     # Data files and mock data
│   │   ├── Sample_count_by_Data_Type.csv
│   │   ├── Sample_count_cancer_type.csv
│   │   ├── issues.txt
│   │   ├── pull_requests.txt
│   │   └── mockSubmissions.ts
│   ├── hooks/                    # Custom React hooks
│   │   ├── use-mobile.tsx
│   │   └── use-toast.ts
│   ├── lib/
│   │   └── utils.ts              # Utility functions
│   ├── pages/                    # Page components
│   │   ├── Analytics.tsx
│   │   ├── Index.tsx
│   │   ├── Login.tsx
│   │   ├── NotFound.tsx
│   │   ├── SubmitContent.tsx
│   │   └── TrackStatus.tsx
│   ├── services/                 # API service layers
│   │   ├── api.ts
│   │   └── cbioportalApi.ts
│   ├── types/                    # TypeScript type definitions
│   │   └── submission.tsx
│   ├── utils/                    # Utility functions
│   │   ├── analyticsDataProcessors.ts
│   │   └── dataParser.ts
│   ├── App.tsx                   # Main application component
│   ├── index.css                 # Global styles
│   └── main.tsx                  # Application entry point
├── index.html
├── package.json
├── tailwind.config.ts
├── tsconfig.json
├── vite.config.ts
└── README.md
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher recommended)
- npm or bun package manager

### Installation

1. Clone the repository:
```bash
git clone https://github.com/rmadupuri/portal-dashboard.git
cd portal-dashboard-44644
```

2. Install dependencies:
```bash
npm install
# or
bun install
```

3. Start the development server:
```bash
npm run dev
# or
bun dev
```

4. Open your browser and navigate to:
```
http://localhost:8080
```

### Available Scripts

- `npm run dev` - Start development server on port 8080
- `npm run build` - Build for production
- `npm run build:dev` - Build in development mode
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint for code quality

## 🔌 API Integration

The dashboard integrates with the cBioPortal API to fetch real-time data:

### Key API Endpoints Used:
- `/api/studies` - Fetch all cancer studies
- `/api/cancer-types` - Get cancer type definitions
- `/api/patients` - Retrieve patient data
- `/api/samples` - Get sample information
- `/api/sample-lists` - Fetch sample groupings

API calls are managed through:
- `src/services/cbioportalApi.ts` - cBioPortal-specific API functions
- `src/services/api.ts` - General API utilities

## 📊 Data Processing

The application includes sophisticated data processing utilities:

### `analyticsDataProcessors.ts`
- `processCumulativeGrowthData()` - Aggregates study data by year
- `processTrackerStatusData()` - Categorizes submission statuses
- `processSubmissionTimeline()` - Creates timeline visualizations
- `processSampleCountsByDataType()` - Organizes data by genomic type

### `dataParser.ts`
- `parseIssuesData()` - Parses GitHub issue data
- `parsePullRequestsData()` - Processes pull request information
- `parseSampleCountData()` - Handles CSV sample data

## 🎨 Styling

The project uses a modern styling approach:

- **Tailwind CSS** for utility-first styling
- **CSS Variables** for theme customization
- **Responsive Design** with mobile-first approach
- **Dark Mode** support through next-themes

### Theme Configuration
Colors and design tokens are defined in:
- `src/index.css` - CSS custom properties
- `tailwind.config.ts` - Tailwind theme extensions

## 🔒 Authentication

The dashboard includes a login page (`src/pages/Login.tsx`) for future authentication implementation. Currently serves as a placeholder for secured routes.

## 📱 Responsive Design

The application is fully responsive and optimized for:
- Desktop (1920px+)
- Laptop (1024px - 1919px)
- Tablet (768px - 1023px)
- Mobile (320px - 767px)

## 🧪 Testing

The project structure supports testing with:
- Unit tests for utility functions
- Component tests for UI elements
- Integration tests for API calls

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the ISC License.

## 👥 Authors

- Repository: [rmadupuri/portal-dashboard](https://github.com/rmadupuri/portal-dashboard)

## 🐛 Issues

Report issues at: [GitHub Issues](https://github.com/rmadupuri/portal-dashboard/issues)

## 🙏 Acknowledgments

- **cBioPortal** team for providing the API and platform
- **Lovable** for project generation tools
- **shadcn/ui** for excellent component library
- The cancer genomics research community

## 📞 Support

For questions or support, please:
1. Check the [cBioPortal documentation](https://docs.cbioportal.org/)
2. Open an issue on GitHub
3. Contact the development team

---

Built with ❤️ for the cancer genomics research community
