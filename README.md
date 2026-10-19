# LorryLink 

A fleet management website for Indian truck and lorry businesses. Pure HTML, CSS and JavaScript.

## Features
- **Live map of India** with moving trucks that follow national highway routes (demo tracking), zoom and pan, and layers for NH, link roads and cities
- **National highways** NH 44, 48, 19, 16, 53 and 65, with route signs, highlight and approximate length
- **Fleet manager**: truck number (Indian plate validation), type, wheels, capacity, tyre size/brand/km/life, driver, insurance, fitness and permit dates, with alerts
- **Rate calculator**: distance along highways, travel time, freight, toll, loading, total, cost per tonne and matching trucks from your fleet
- Light and dark theme, responsive layout, data saved in the browser (localStorage)

## Run locally (VS Code)
1. Open this folder in VS Code (File > Open Folder)
2. Install the recommended **Live Server** extension
3. Right-click `index.html` > **Open with Live Server** (or just double-click `index.html`)

## Publish on GitHub Pages
```bash
git init
git add .
git commit -m "LorryLink: truck fleet manager"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/lorrylink.git
git push -u origin main
```
Then go to **Settings > Pages**, choose **Deploy from a branch**, branch `main`, folder `/ (root)`. Your site goes live at `https://YOUR-USERNAME.github.io/lorrylink/`.

## Project structure
```
index.html      page layout
css/style.css   design (light/dark themes, responsive)
js/app.js       data, highway routing, map, fleet, rate calculator
```

## Customise
- Truck types and rates (Rs/km): `RATES` at the top of `js/app.js`
- Cities: `CITIES`; highways: `NH` and `LINK`

## Notes
- Truck tracking is simulated. Real GPS tracking needs a backend and devices.
- Rates and highway data are approximate. Confirm NH numbers with NHAI/MoRTH and rates with transporters.

## Author
Saksham Jain .  [GitHub](https://github.com/saksham-s1-03)

## LICENSE
 PROPRIETARY SOFTWARE LICENSE.
