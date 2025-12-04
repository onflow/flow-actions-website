# Flow Actions Marketplace

A modern marketplace website for discovering and browsing Flow Actions from the [FlowActions repository](https://github.com/onflow/FlowActions).

## Features

- **Live Data**: Automatically fetches the latest actions from GitHub on each page load
- **Beautiful UI**: Modern, responsive design inspired by claudemarketplaces.com
- **Rich Metadata**: Displays human-friendly titles, descriptions, and tags for each action
- **Direct Links**: Quick access to view actions on GitHub
- **Categorized Display**: Actions are organized by category for easy browsing

## Setup

### Local Development

1. **Clone or download this repository**

2. **Serve the files using a local web server**

   Since the site uses JavaScript to fetch from GitHub's API, you'll need to serve it through a web server (not just open the HTML file directly) to avoid CORS issues.

   **Option 1: Using Python**
   ```bash
   # Python 3
   python3 -m http.server 8000
   
   # Then open http://localhost:8000 in your browser
   ```

   **Option 2: Using Node.js (http-server)**
   ```bash
   npx http-server -p 8000
   
   # Then open http://localhost:8000 in your browser
   ```

   **Option 3: Using PHP**
   ```bash
   php -S localhost:8000
   
   # Then open http://localhost:8000 in your browser
   ```

### Deployment

The site can be deployed to any static hosting service:

- **Netlify**: Drag and drop the folder or connect to a Git repository
- **Vercel**: Deploy via CLI or connect to Git repository
- **GitHub Pages**: Push to a repository and enable GitHub Pages
- **Cloudflare Pages**: Connect to Git repository
- **Any static hosting**: Upload the files to your hosting provider

#### Recommended: Netlify

1. Create a new site on [Netlify](https://netlify.com)
2. Drag and drop the `actions` folder, or
3. Connect your Git repository and set the build command to: `echo "No build needed"` and publish directory to `/`

## How It Works

1. **Data Fetching**: On page load, the JavaScript fetches connector files from the FlowActions GitHub repository using the GitHub API
2. **Metadata Extraction**: For each connector file, the code extracts metadata including:
   - Human-friendly titles
   - Descriptions from code comments
   - Action types (Source, Sink, Swapper, etc.)
   - Categories and tags
3. **Display**: Actions are displayed in a responsive grid with cards showing:
   - Title and file path
   - Description
   - Action type badge
   - Tags
   - Link to GitHub

## File Structure

```
actions/
├── index.html      # Main HTML structure
├── styles.css      # Styling and layout
├── app.js          # JavaScript for fetching and displaying actions
└── README.md       # This file
```

## Customization

### Changing Colors

Edit the CSS variables in `styles.css`:

```css
:root {
    --primary-color: #00d4ff;
    --secondary-color: #6366f1;
    --background: #0a0a0a;
    /* ... */
}
```

### Modifying Action Display

Edit the `renderActions()` function in `app.js` to change how actions are displayed.

### Adding More Metadata

Extend the `extractMetadata()` function in `app.js` to extract additional information from the Cadence files.

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Requires JavaScript enabled
- Responsive design works on mobile and desktop

## License

This project is open source and available for use.

## Contributing

Feel free to submit issues or pull requests to improve the marketplace!

