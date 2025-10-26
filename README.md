# Industrial Automation Control UI

A touchscreen kiosk-optimized web application for controlling industrial automation equipment via MQTT and REST APIs. Designed for easy operation on industrial touchscreen terminals with ATM-style large buttons and simple navigation.

## Features

- **Touchscreen Kiosk Interface** - Large buttons and simple navigation optimized for touch input
- **Real-time Equipment Monitoring** - Live telemetry via MQTT
- **Simple Equipment Control** - Start/Stop/Reset/Emergency Stop with visual feedback
- **Parameter Adjustment** - Easy +/- buttons for equipment parameter control
- **Equipment Filtering** - Filter by equipment type with large tap-friendly buttons
- **Visual Status Indicators** - Color-coded equipment status (Running/Stopped/Error/Maintenance)
- **Fullscreen Kiosk Mode** - Prevents user from exiting to system
- **No Text Selection** - Optimized for kiosk/public terminal use
- **REST API Integration** - Equipment management via backend API
- **Container-ready** - Kubernetes deployment with Docker

## Tech Stack

- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **State Management**: Zustand
- **Styling**: Tailwind CSS
- **MQTT Client**: MQTT.js
- **HTTP Client**: Axios
- **Icons**: Lucide React
- **Charts**: Recharts
- **Routing**: React Router

## Project Structure

```
frontend/
├── src/
│   ├── components/        # React components
│   │   ├── KioskDashboard.tsx      # Main kiosk interface
│   │   ├── KioskEquipmentCard.tsx  # Large touch-friendly equipment cards
│   │   ├── KioskControlPanel.tsx   # Equipment control panel
│   │   ├── Button.tsx              # Reusable large button component
│   │   ├── Dashboard.tsx           # (Legacy desktop interface)
│   │   ├── EquipmentCard.tsx       # (Legacy)
│   │   └── EquipmentControl.tsx    # (Legacy)
│   ├── services/          # Service layer
│   │   ├── mqttService.ts          # MQTT client service
│   │   └── apiService.ts           # REST API client
│   ├── store/             # State management
│   │   └── equipmentStore.ts       # Zustand equipment store
│   ├── hooks/             # Custom React hooks
│   │   └── useMQTT.ts              # MQTT connection hook
│   ├── types/             # TypeScript type definitions
│   │   └── equipment.ts            # Equipment interfaces
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── public/
│   └── kiosk.html         # Fullscreen kiosk mode entry point
├── k8s/                   # Kubernetes manifests
│   ├── deployment.yaml
│   └── ingress.yaml
├── Dockerfile
├── nginx.conf
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Access to MQTT broker (e.g., Mosquitto)
- Backend API endpoint

### Installation

1. Clone the repository and navigate to the frontend directory:

```bash
cd /POOL01/software/projects/frontend
```

2. Install dependencies:

```bash
npm install
```

3. Create environment file:

```bash
cp .env.example .env
```

4. Update the `.env` file with your configuration:

```env
VITE_API_URL=http://your-api-server:8080/api
VITE_MQTT_BROKER_URL=ws://your-mqtt-broker:9001
```

### Development

Start the development server:

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

### Kiosk Mode

For full kiosk mode with locked-down browser features, use the kiosk HTML entry point:

```bash
npm run dev
# Then navigate to: http://localhost:3000/kiosk.html
```

**Kiosk Mode Features:**
- Fullscreen on first touch
- Disabled right-click context menu
- Disabled text selection
- Disabled F12/DevTools keyboard shortcuts
- Prevents accidental zoom on touch devices
- No pull-to-refresh
- Loading screen with branding

**Recommended Kiosk Browser Settings:**

For Chrome/Chromium in true kiosk mode:
```bash
chromium-browser --kiosk --app=http://localhost:3000/kiosk.html --start-fullscreen --incognito
```

For production deployment on touchscreen terminals:
```bash
chromium-browser --kiosk --app=https://your-domain.com/kiosk.html --start-fullscreen --incognito --disable-pinch --overscroll-history-navigation=0 --noerrdialogs
```

### Building for Production

Build the application:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

## Docker Deployment

### Build Docker Image

```bash
docker build -t industrial-automation-ui:latest .
```

### Run Container

```bash
docker run -p 80:80 \
  -e API_URL=http://your-api-server:8080 \
  -e MQTT_WS_URL=ws://your-mqtt-broker:9001 \
  industrial-automation-ui:latest
```

## Kubernetes Deployment

### Deploy to Kubernetes

1. Update the ConfigMap in `k8s/deployment.yaml` with your API and MQTT URLs

2. Apply the Kubernetes manifests:

```bash
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/ingress.yaml
```

3. Update the Ingress hostname in `k8s/ingress.yaml` to match your domain

### Check Deployment Status

```bash
kubectl get pods -l app=industrial-automation-ui
kubectl get svc industrial-automation-ui
kubectl get ingress industrial-automation-ui
```

### View Logs

```bash
kubectl logs -l app=industrial-automation-ui -f
```

## MQTT Topics

The application uses the following MQTT topic structure:

- `equipment/{equipmentId}/telemetry` - Receives real-time telemetry data
- `equipment/{equipmentId}/status` - Receives status updates
- `equipment/{equipmentId}/commands` - Sends control commands

### Example Telemetry Message

```json
{
  "equipmentId": "motor-001",
  "timestamp": "2024-01-15T10:30:00Z",
  "data": {
    "speed": 1500,
    "temperature": 45.2,
    "power": 75.5
  }
}
```

### Example Command Message

```json
{
  "equipmentId": "motor-001",
  "command": "start",
  "parameters": {
    "speed": 1200
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

## API Endpoints

The application expects the following REST API endpoints:

- `GET /api/equipment` - Get all equipment
- `GET /api/equipment/{id}` - Get specific equipment
- `GET /api/equipment/type/{type}` - Get equipment by type
- `POST /api/equipment/{id}/commands` - Send command to equipment
- `PATCH /api/equipment/{id}` - Update equipment
- `GET /api/equipment/{id}/history` - Get equipment history
- `POST /api/auth/login` - User authentication
- `POST /api/auth/logout` - User logout
- `GET /api/system/status` - System status
- `GET /api/alerts` - Get active alerts

## Configuration

### Environment Variables

- `VITE_API_URL` - Backend API base URL (default: `/api`)
- `VITE_MQTT_BROKER_URL` - MQTT broker WebSocket URL (default: `ws://localhost:9001`)

### Nginx Configuration

The `nginx.conf` file includes:

- SPA routing support
- API proxy configuration
- WebSocket proxy for MQTT
- Security headers
- Static asset caching
- Gzip compression
- Health check endpoint at `/health`

## Development Guidelines

### Adding New Equipment Types

1. Update `src/types/equipment.ts` with new equipment type
2. Create component in `src/components/`
3. Add to routing if needed
4. Update store actions in `src/store/equipmentStore.ts`

### Adding New API Endpoints

1. Add method to `src/services/apiService.ts`
2. Update TypeScript types in `src/types/`
3. Use in components via the service layer

### MQTT Message Handling

1. Subscribe to topics using `useMQTTSubscription` hook
2. Handle messages in component callbacks
3. Update store state for UI reactivity

## Kiosk UI Design Principles

The kiosk interface follows ATM-style design principles:

### Button Sizes
- **Primary action buttons**: 8rem padding (128px height minimum)
- **Text size**: 2xl-5xl (24px-48px) for easy reading from standing position
- **Touch targets**: Minimum 44x44px, typically much larger (128x128px+)
- **Spacing**: Large gaps (2rem/32px) between interactive elements

### Visual Feedback
- **Active state**: Scale down to 95% on press (`active:scale-95`)
- **Loading states**: Visual feedback with 2-second confirmation messages
- **Color coding**:
  - Green = Running/Start
  - Red = Stopped/Error/Stop
  - Orange = Warning/Emergency Stop
  - Blue = Normal actions/Info
  - Gray = Secondary/Back

### Navigation
- **Maximum 2 levels deep**: Equipment List → Control Panel → Back
- **Large back buttons**: Always visible, top-left position
- **No nested menus**: Flat hierarchy for simplicity

### Typography
- **Headings**: 4xl-6xl (36px-60px)
- **Body text**: 2xl-3xl (24px-30px)
- **Parameters**: 3xl-5xl (30px-48px) for critical values
- **All caps for buttons**: Enhanced readability

## Troubleshooting

### Touchscreen Not Responding Properly

1. **Enable touch events in browser**:
```bash
# For Chrome on Linux
chromium-browser --touch-events=enabled
```

2. **Check CSS touch-action**: Ensure `touch-action: manipulation` is set
3. **Disable zoom**: Add viewport meta tag with `user-scalable=no`

### Kiosk Mode Not Going Fullscreen

- **Check browser permissions**: Some browsers require user gesture for fullscreen
- **Use kiosk flags**: Launch browser with `--kiosk` flag
- **Test on actual hardware**: Touch behavior differs from mouse clicks

### MQTT Connection Issues

- Verify MQTT broker is accessible via WebSocket
- Check MQTT broker URL in `.env`
- Ensure MQTT broker allows WebSocket connections (usually port 9001)
- Check browser console for connection errors

### API Connection Issues

- Verify backend API is running and accessible
- Check API URL in `.env`
- Review CORS settings on the backend
- Check browser network tab for failed requests

### Text Selection Still Enabled

Ensure CSS in [src/index.css](src/index.css:19-23) has:
```css
-webkit-user-select: none;
user-select: none;
```

### Build Issues

```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear Vite cache
rm -rf node_modules/.vite
npm run dev
```

## License

Proprietary - Internal Use Only

## Support

For issues and questions, contact the development team.
