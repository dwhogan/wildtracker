# WildTracker Web - Wildlife Telemetry Visualization

A modern Next.js web application for real-time wildlife tracking and telemetry data visualization using Leaflet maps and interactive dashboards.

## Features

- **Interactive Map View**: Real-time wildlife tracking with Leaflet maps
- **Marker Clustering**: Efficient display of multiple wildlife locations
- **Species-Specific Markers**: Color-coded markers for different wildlife species
- **Live Dashboard**: Statistics and telemetry data overview
- **Real-time Updates**: Auto-refresh data every 30 seconds
- **Advanced Filtering**: Filter by species, activity, and health status
- **Responsive Design**: Works on desktop and mobile devices
- **Modern UI**: Built with Tailwind CSS and Lucide icons

## Prerequisites

- Node.js 18+ 
- npm or yarn
- WildTracker API running on `http://localhost:3000`

## Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open [http://localhost:3001](http://localhost:3001) in your browser

## Project Structure

```
wildtracker-web/
├── app/                    # Next.js app directory
│   ├── globals.css        # Global styles with Tailwind
│   ├── layout.tsx         # Root layout component
│   └── page.tsx           # Main page component
├── components/            # React components
│   ├── Header.tsx         # Application header
│   ├── Sidebar.tsx        # Navigation and filters sidebar
│   ├── WildlifeMap.tsx    # Leaflet map component
│   └── Dashboard.tsx      # Statistics dashboard
├── types/                 # TypeScript type definitions
│   └── telemetry.ts       # Telemetry data types
├── package.json           # Dependencies and scripts
├── tailwind.config.js     # Tailwind CSS configuration
├── next.config.js         # Next.js configuration
└── tsconfig.json          # TypeScript configuration
```

## API Integration

The application integrates with the WildTracker API endpoints:

- **Map Data**: `/api/v1/telemetry/map` - Get wildlife locations for map display
- **Wildlife Summary**: `/api/v1/telemetry/wildlife` - Get statistics and summary data
- **Individual Tracking**: `/api/v1/telemetry/individual/:id` - Get specific animal data
- **Telemetry Data**: `/api/v1/telemetry/data` - Get filtered telemetry data

## Map Features

### Wildlife Markers
- **Gray Wolf**: Brown markers (#8B4513)
- **Brown Bear**: Dark brown markers (#654321)
- **White-tailed Deer**: Light brown markers (#DEB887)
- **Bald Eagle**: Blue markers (#4169E1)

### Interactive Features
- **Popup Information**: Click markers to see detailed wildlife information
- **Marker Clustering**: Groups nearby markers for better performance
- **Real-time Updates**: Markers update automatically with new data
- **Filter Integration**: Markers respond to sidebar filters

## Dashboard Features

### Summary Cards
- Total individuals tracked
- Active devices count
- Data points received
- Recent alerts

### Species Distribution
- Visual breakdown of tracked species
- Real-time counts and statistics

### Telemetry Table
- Recent telemetry data
- Activity and health status indicators
- Location coordinates
- Timestamp information

## Filtering Options

### Species Filter
- All Species
- Gray Wolf
- Brown Bear
- White-tailed Deer
- Bald Eagle

### Activity Filter
- All Activities
- Active
- Resting
- Hunting
- Migrating

### Health Filter
- All Health
- Healthy
- Injured
- Sick

## Development

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

### Environment Variables

The application uses Next.js rewrites to proxy API calls to the backend. The API is expected to run on `http://localhost:3000`.

### Customization

#### Adding New Species
1. Update the species filter options in `components/Sidebar.tsx`
2. Add species color mapping in `components/WildlifeMap.tsx`
3. Update Tailwind config with new species colors

#### Styling
- Global styles are in `app/globals.css`
- Component-specific styles use Tailwind CSS classes
- Custom CSS variables for wildlife colors

## Deployment

### Vercel (Recommended)
1. Push code to GitHub
2. Connect repository to Vercel
3. Deploy automatically

### Docker
```bash
# Build the application
docker build -t wildtracker-web .

# Run the container
docker run -p 3001:3000 wildtracker-web
```

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT 