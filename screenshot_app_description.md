# Screenshot Template Tester App

A React-based web application to test and compare different frontend screenshot capture libraries. Users can view sample templates, capture screenshots using various libraries, and download the results to evaluate each solution's capabilities.

## Features

### Template Gallery
- **Multiple Template Types**: Display 4-5 different template designs including:
  - Business card template with gradients and fonts
  - Invoice/receipt template with tables and borders
  - Social media post template with images and text overlay
  - Certificate template with decorative elements
  - Dashboard widget with charts and data

### Screenshot Capture Methods
Test and compare 4 different frontend screenshot solutions:

1. **html2canvas** - Most popular DOM-to-image library
2. **dom-to-image** - Lightweight alternative with good quality
3. **html2image** - Another DOM conversion library
4. **Canvas API + SVG** - Native browser solution for simple layouts

### Core Functionality
- **Template Preview**: Display templates in a clean, organized grid
- **Live Capture**: Click any template to capture it using all 4 methods
- **Quality Comparison**: Side-by-side comparison of results from each library
- **Download Options**: Save captured images individually or as a zip
- **Performance Metrics**: Display capture time for each method
- **Error Handling**: Graceful handling of capture failures with user feedback

## Technical Requirements

### Dependencies
```json
{
  "html2canvas": "^1.4.1",
  "dom-to-image-more": "^3.0.0",
  "html2image": "^1.0.2",
  "file-saver": "^2.0.5",
  "react": "^18.0.0",
  "react-dom": "^18.0.0"
}
```

### Project Structure
```
src/
├── components/
│   ├── TemplateGallery.jsx      # Main template display
│   ├── TemplateCard.jsx         # Individual template component
│   ├── CaptureControls.jsx      # Screenshot buttons and options
│   ├── ResultsPanel.jsx         # Show captured images
│   └── PerformanceMetrics.jsx   # Timing and error info
├── templates/
│   ├── BusinessCard.jsx
│   ├── Invoice.jsx
│   ├── SocialPost.jsx
│   ├── Certificate.jsx
│   └── Dashboard.jsx
├── utils/
│   ├── html2canvasCapture.js    # html2canvas implementation
│   ├── domToImageCapture.js     # dom-to-image implementation
│   ├── html2imageCapture.js     # html2image implementation
│   └── canvasSvgCapture.js      # Native canvas/SVG solution
└── styles/
    ├── templates.css            # Template-specific styles
    └── app.css                  # Main app styles
```

## User Interface

### Layout
- **Header**: App title and brief description
- **Template Section**: Grid of template previews (2-3 columns)
- **Capture Panel**: Buttons for each screenshot method
- **Results Area**: Display captured images with download buttons
- **Metrics Panel**: Show performance data and any errors

### Interaction Flow
1. User sees template gallery on page load
2. User clicks "Capture All Methods" button for a template
3. App sequentially captures using all 4 libraries
4. Results appear in comparison view with timing data
5. User can download individual results or compare quality
6. User can test different templates to see method differences

## Key Testing Scenarios

### Template Complexity Tests
- **Simple layouts**: Text and basic shapes
- **Complex styling**: Gradients, shadows, transforms
- **External resources**: Web fonts, images, icons
- **Dynamic content**: Charts, data tables, form elements
- **Responsive elements**: Media queries and flexible layouts

### Performance Comparisons
- **Capture speed**: Time each method takes
- **Image quality**: Visual comparison of output
- **File size**: Compare resulting image sizes
- **Error rates**: Track which methods fail on complex templates
- **Browser compatibility**: Note any browser-specific issues

## Implementation Notes

### Error Handling
Each capture method should:
- Handle timeouts gracefully (5-second limit)
- Show user-friendly error messages
- Continue with other methods if one fails
- Log detailed errors to console for debugging

### Performance Optimization
- Lazy load templates to improve initial page load
- Use Web Workers for heavy screenshot processing where possible
- Implement loading states during capture operations
- Cache template HTML to avoid re-rendering

### Styling Considerations
- Use CSS-in-JS or CSS modules to prevent style conflicts
- Ensure templates use web-safe fonts with fallbacks
- Include print media queries for better screenshot quality
- Use absolute positioning where needed for consistent layout

## Success Metrics

The app should help users determine:
- Which library works best for their specific template types
- Performance trade-offs between different solutions
- Quality differences in various scenarios
- Browser compatibility issues with each method

## Deployment
- Build as static React app for easy hosting
- Include comprehensive README with setup instructions
- Provide example templates that showcase different capabilities
- Document known limitations and browser requirements