# The Giddy List - Chrome Extension

Save gifts from any website to your kids' wishlists on The Giddy List.

## Features

- **One-Click Save**: Click the extension while browsing any product page
- **Auto-Scrape**: Automatically detects product title, image, and price
- **Quick Add**: Select which kid's wishlist to add to and save instantly
- **Works Everywhere**: Amazon, Target, Walmart, and thousands more sites

## Installation (Development)

1. **Generate Icons** (required):
   ```bash
   # Install sharp for image conversion
   npm install sharp

   # Run the icon generator
   node generate-icons.js
   ```

2. **Load in Chrome**:
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top right)
   - Click "Load unpacked"
   - Select the `/extension` folder

3. **Test**:
   - Navigate to any product page (Amazon, Target, etc.)
   - Click the Giddy List extension icon
   - Log in if prompted
   - Select a kid and add to their wishlist

## Files

```
/extension
├── manifest.json      # Extension configuration
├── popup.html         # Popup UI
├── popup.css          # Popup styles
├── popup.js           # Popup logic
├── content.js         # Product scraping script
├── background.js      # Service worker
└── /icons
    ├── icon.svg       # Source icon
    ├── icon16.png     # 16x16 toolbar icon
    ├── icon48.png     # 48x48 extension page icon
    └── icon128.png    # 128x128 Chrome Web Store icon
```

## Publishing to Chrome Web Store

1. Generate production icons
2. Zip the extension folder
3. Upload to [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
4. Fill in listing details:
   - Name: The Giddy List - Gift Saver
   - Description: Save gifts from any website to your kids' wishlists
   - Category: Shopping
   - Screenshots of the extension in action

## API Endpoints

The extension uses these API endpoints:

- `GET /api/extension/auth` - Check auth status and get kids list
- `POST /api/wishlist/add-external` - Add item to wishlist

## Troubleshooting

**"Couldn't find product"**: The extension may not detect products on all sites. It works best on major retailers.

**"Not logged in"**: Make sure you're logged into thegiddylist.com in the same browser.

**Product image not showing**: Some sites block image loading from extensions. The item will still save with the URL.
