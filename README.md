# Flow Actions Marketplace

**A comprehensive directory for discovering and browsing Flow Actions from the [FlowActions repository](https://github.com/onflow/FlowActions)**

## Overview

Flow Actions Marketplace is a modern web application that provides an automatically updated directory of Flow Actions—composable DeFi primitives for building sophisticated financial workflows on the Flow blockchain.

The marketplace dynamically fetches the latest actions from the FlowActions GitHub repository, extracts meaningful metadata from Cadence smart contracts, and presents them in an intuitive, filterable interface. Each action is displayed with human-friendly titles, descriptions, action types, and tags, making it easy for developers to discover and explore available DeFi connectors.

Built with modern web technologies and designed to match Flow.com's visual identity, the marketplace serves as a central hub for the Flow Actions ecosystem.

## Key Features

### Dynamic Data Fetching

The marketplace automatically fetches the latest Flow Actions from GitHub on each page load, ensuring users always see the most up-to-date information without manual updates.

### Intelligent Metadata Extraction

For each action, the marketplace extracts:
- **Human-friendly titles** from file names with acronym preservation
- **Descriptions** from Cadence documentation comments
- **Action types** (Source, Sink, Swapper, PriceOracle, Flasher)
- **Categories and tags** for filtering and organization

### Advanced Filtering

Interactive tag-based filtering allows users to quickly find actions by:
- Action type (Source, Sink, Swapper, etc.)
- Protocol integration (EVM, ERC4626, IncrementFi, etc.)
- Category classification

### Modern UI/UX

- **Flow.com Design Language**: Matches Flow's official branding and visual identity
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Fast Performance**: Optimized for quick loading and smooth interactions
- **Accessible**: Built with accessibility best practices

## Quick Start

### Prerequisites

- A modern web browser with JavaScript enabled
- A local web server (for local development)

### Local Development

1. **Clone or download this repository**

   ```bash
   git clone <repository-url>
   cd actions
   ```

2. **Serve the files using a local web server**

   Since the site uses JavaScript to fetch from GitHub's API, you'll need to serve it through a web server to avoid CORS issues.

   **Option 1: Using Python**
   ```bash
   python3 -m http.server 8000
   ```
   Then open `http://localhost:8000` in your browser.

   **Option 2: Using Node.js (http-server)**
   ```bash
   npx http-server -p 8000
   ```
   Then open `http://localhost:8000` in your browser.

   **Option 3: Using PHP**
   ```bash
   php -S localhost:8000
   ```
   Then open `http://localhost:8000` in your browser.

### Deployment

The marketplace can be deployed to any static hosting service:

- **Netlify**: Drag and drop the folder or connect to a Git repository
- **Vercel**: Deploy via CLI or connect to Git repository  
- **GitHub Pages**: Push to a repository and enable GitHub Pages
- **Cloudflare Pages**: Connect to Git repository
- **Any static hosting**: Upload the files to your hosting provider

#### Recommended: Netlify

1. Create a new site on [Netlify](https://netlify.com)
2. Drag and drop the project folder, or
3. Connect your Git repository and set:
   - Build command: `echo "No build needed"`
   - Publish directory: `/`

## How It Works

### Data Fetching

On each page load, the application:

1. **Fetches connector files** from the FlowActions GitHub repository using the GitHub REST API
2. **Recursively scans** the `cadence/contracts/connectors` directory structure
3. **Retrieves file contents** for metadata extraction

### Metadata Extraction

For each connector file, the system:

1. **Parses Cadence files** to extract documentation comments
2. **Identifies struct definitions** and their associated documentation
3. **Detects action types** from struct names (Source, Sink, Swapper, etc.)
4. **Extracts tags** from file content and metadata
5. **Generates human-friendly titles** with proper acronym handling (EVM, FLOW, ERC4626, etc.)

### Display & Filtering

Actions are presented in a responsive grid with:

- **Action cards** showing title, description, type, and tags
- **Filter buttons** for each unique tag
- **Dynamic filtering** that shows/hides cards based on selected tags
- **Results counter** that updates based on active filters
- **Direct links** to view actions on GitHub

## File Structure

```
actions/
├── index.html          # Main HTML structure
├── styles.css          # Styling and layout (Flow.com design system)
├── app.js              # JavaScript for fetching, parsing, and displaying actions
├── flow-icon.svg       # Flow brand icon
└── README.md           # This file
```

## Customization

### Changing Colors

Edit the CSS variables in `styles.css`:

```css
:root {
    --primary-color: #00ef8b;      /* Flow green */
    --primary-dark: #02d87e;       /* Flow green dark */
    --background: #000000;          /* Black background */
    --text-primary: #ffffff;        /* White text */
    /* ... */
}
```

### Modifying Action Display

Edit the `renderActions()` function in `app.js` to change how actions are displayed in the grid.

### Extending Metadata Extraction

Extend the `extractMetadata()` function in `app.js` to extract additional information from Cadence files or add new tag detection logic.

### Adding New Filter Options

Modify the `renderFilters()` and `initializeFilters()` functions in `app.js` to add custom filtering logic beyond tag-based filtering.

## Browser Support

- **Modern browsers**: Chrome, Firefox, Safari, Edge (latest versions)
- **JavaScript**: Required for all functionality
- **Responsive design**: Works on mobile and desktop devices
- **SVG support**: Required for logo and favicon display

## Technical Details

### API Usage

The marketplace uses the GitHub REST API to fetch repository contents. No authentication is required for public repositories, but be mindful of GitHub's rate limits (60 requests per hour for unauthenticated requests).

### Performance Considerations

- Actions are fetched in batches to avoid overwhelming the GitHub API
- Metadata extraction includes error handling for graceful degradation
- Filtering is performed client-side for instant results

## Contributing

Contributions are welcome! Areas for improvement include:

- Enhanced metadata extraction from Cadence files
- Additional filtering options
- Performance optimizations
- Accessibility improvements
- UI/UX enhancements

Please feel free to submit issues or pull requests to improve the marketplace.

## License

This project is open source and available for use.

## Resources

- **FlowActions Repository**: [https://github.com/onflow/FlowActions](https://github.com/onflow/FlowActions)
- **Flow Documentation**: [https://docs.onflow.org](https://docs.onflow.org)
- **Flow.com**: [https://flow.com](https://flow.com)
