## Southcentral Kentucky Blueways

A modern, interactive web app reviving the Southcentral Kentucky Rivers Blueways project. It provides a digital map of river routes, access points, approximate float times, and current river conditions for paddlers and partners around the Bowling Green area.

### Live App

- **Production**: `https://southcentral-kentucky-blueways.vercel.app/`

When you open the live app, you can:

- Browse an interactive map of regional rivers and blueway routes.
- See put-in and take-out access points for each route.
- View route details such as distance and estimated float time.
- Check current river conditions where data is available.

### Features

- **Interactive blueways map**: Built with `react-leaflet` and `leaflet`, showing rivers, routes, and access points in Southcentral Kentucky.
- **Route selection**: Choose a river, then pick a specific route to see where to put in and take out.
- **Route details panel**: View distance, approximate float time, and key notes in a dedicated info panel.
- **Current conditions**: Surface river/flow conditions (where available) alongside route information to help with trip planning.
- **Mobile-friendly layout**: A responsive layout that uses a sidebar on larger screens and a slide-out panel on mobile for easier use on the water or in the field.

### Using the App (for paddlers and partners)

- **Open the app** in your browser (desktop or mobile) using the Live App URL.
- **Explore the map** to see available rivers and blueway routes.
- **Choose a river** from the sidebar, then select a **route** to highlight it on the map.
- **Review route info** in the details panel, including:
  - Put-in and take-out locations.
  - Approximate distance and float time.
  - Notes or cautions where provided.
- **Always verify conditions** locally and follow all safety guidance. The information in this app is for planning only and does not replace on-the-ground judgment or official advisories.

### Getting Started (for developers)

#### Prerequisites

- Node.js (LTS recommended)
- `npm` (comes with Node) or your preferred package manager

#### Install dependencies

```bash
npm install
```

#### Run the development server

```bash
npm run dev
```

Then open `http://localhost:3000` in your browser.

#### Build and run in production mode

```bash
npm run build
npm start
```

The main application entry point is `src/app/page.tsx`, which wires together:

- `Map` (`src/components/Map.tsx`) for the interactive map.
- `Sidebar` (`src/components/Sidebar.tsx`) for river and route selection.
- `RouteInfoBox` (`src/components/RouteInfoBox.tsx`) for route details.

### Data

- **Blueways data**: River routes and access points are stored in the GeoJSON file `public/blueways.geojson`.
- The app loads this data on the client using:
  - `fetch("/blueways.geojson")` inside `src/app/page.tsx`.
- **Scripts** in the `scripts/` directory (such as `trace-routes.mjs` and `fix-route-endpoints.mjs`) are used to generate and clean up route geometry and endpoints for the GeoJSON file.

If you edit `public/blueways.geojson`, restart the dev server or reload the page to see updates.

### Tech Stack

- **Framework**: Next.js 16 (App Router)
- **UI**: React 19
- **Mapping**: `react-leaflet` and `leaflet`
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4

This project was originally created with `create-next-app` and then customized into a purpose-built blueways mapping tool for Southcentral Kentucky.

### Contributing

If you’d like to contribute:

- Open an issue describing a bug, enhancement, or new feature idea.
- Submit a pull request with a clear description and any relevant screenshots or notes.

### Developer Resources

For developers new to the stack, the following resources may be helpful:

- [Next.js Documentation](https://nextjs.org/docs)
- [Learn Next.js](https://nextjs.org/learn)

