# Road Trip — Pittsburg, KS → Fremont, CA

A single-page static site documenting a westbound road trip from Pittsburg, Kansas to Fremont, California.

## Stack

Pure static HTML/CSS/JS. No build step, no framework. Uses [Leaflet](https://leafletjs.com/) for the map and Google Fonts for type.

## Local preview

Open `index.html` in a browser, or serve the folder:

```sh
python3 -m http.server 8000
```

## Deploy

Deployed on Vercel as a static site (framework: Other, root: `./`, no build command).

```sh
vercel --prod
```
