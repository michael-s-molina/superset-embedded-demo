# Superset Embedded Demo

An application showing how to embed Apache Superset dashboards using the `@superset-ui/embedded-sdk`.

![Superset Embedded Demo](docs/screenshot.png)

## Features

- **Three-panel resizable layout**: Configuration panel, embedded dashboard, and event log
- **SDK version resilience**: Automatically detects available SDK features and gracefully handles missing methods
- **Monaco Editor**: JSON editors for RLS rules and UI configuration with syntax highlighting
- **Real-time event logging**: Monitor SDK events and method responses
- **Guest token authentication**: Securely authenticate with Superset using admin credentials
- **Tooltips**: Comprehensive help text for all configuration options

## Prerequisites

- Node.js 18+ and npm
- A running Superset instance with:
  - Embedded dashboard configuration enabled
  - A dashboard configured for embedding
  - Admin user credentials

## Installation

```bash
# Install all dependencies (root, client, and server)
npm install
```

## Running the Application

### Development Mode

Run both frontend and backend concurrently:

```bash
npm run dev
```

Or run them separately:

```bash
# Terminal 1: Run frontend (http://localhost:3000)
npm run dev:client

# Terminal 2: Run backend (http://localhost:3001)
npm run dev:server
```

### Production Build

```bash
npm run build
```

## Configuration

### Backend Environment Variables

Create a `.env` file in the root directory (optional):

```bash
PORT=3001
NODE_ENV=development
```

### Superset Setup

1. Enable embedded dashboards in your Superset instance
2. Configure a dashboard for embedding (get the embed ID)
3. Ensure your user has `can_grant_guest_token` permission
4. Note your dashboard's UUID

## Usage

1. **Start the application**: Run `npm run dev`
2. **Open your browser**: Navigate to http://localhost:3000
3. **Configure connection**:
   - Enter your Superset domain (e.g., http://localhost:8088)
   - Enter username and password
   - Enter dashboard embed ID and UUID
4. **Configure options** (optional):
   - Add RLS rules as JSON array
   - Customize UI config as JSON object
   - Enable debug mode for console logs
5. **Click "Apply Configuration"** to embed the dashboard
6. **Monitor events**: View SDK events and responses in the right panel
7. **Test SDK methods**: Use the buttons in the event panel to call SDK methods

## Project Structure

````
superset-embedded-demo/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── services/      # API client
│   │   ├── styles/        # CSS styles
│   │   ├── types/         # TypeScript types
│   │   ├── App.tsx        # Main app component
│   │   └── main.tsx       # Entry point
│   └── package.json
├── server/                # Express backend
│   ├── src/
│   │   ├── middleware/   # Express middleware
│   │   ├── routes/       # API routes
│   │   ├── services/     # Business logic
│   │   └── index.ts      # Entry point
│   └── package.json
└── package.json          # Workspace root

## SDK Methods Demonstrated

- `embedDashboard()`: Embed a dashboard in an iframe
- `observeDataMask()`: Listen for filter changes
- `getDataMask()`: Get current filter state
- `getChartStates()`: Get state of all charts
- `getActiveTabs()`: Get currently active tabs
- `getScrollSize()`: Get dashboard dimensions
- `getDashboardPermalink()`: Get permalink URL
- `unmount()`: Remove the embedded dashboard


## Development

### Using a Local SDK

To test with a local version of `@superset-ui/embedded-sdk`:

```bash
# In client/package.json, replace:
"@superset-ui/embedded-sdk": "^0.3.0"

# With the path to your local SDK:
"@superset-ui/embedded-sdk": "file:../../superset/superset-embedded-sdk"

# Then reinstall dependencies
npm install
````

## License

MIT
