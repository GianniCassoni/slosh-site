# Interactive capillary-slosh viewer (web / three.js)

A GPU-rendered, phone-friendly version of the spacecraft rigid-body + capillary
slosh reduced-order model. Built for a live IAC demo: put the page online, show
a QR code, and let people perturb the tank on their own phones.

## What is here

- `export_web_data.py` — runs the (expensive) eigen-solve in Python over a grid
  of presets and bakes the reduced matrices + modal shapes into
  `data/models.json`. Run this once, offline.
- `index.html` — self-contained three.js app. Loads `data/models.json`, then
  re-implements only the cheap RK4 time stepping and the surface rendering, so
  it runs at 60 fps in the browser. three.js is loaded from a CDN.
- `data/models.json` — generated data (gravity × propellant × fill presets).

The physics in `index.html` is a faithful port of `InteractiveSimulator` in
`../satellite_tank_interactive_control.py` (same coupled block solve, RK4,
substeps and modal-damping matrix).

## Regenerate the data

```bash
cd Implementation/IAC
MPLBACKEND=Agg python web/export_web_data.py
```

Presets whose Young–Laplace static profile does not converge (extreme
low-contact-angle + high-Bond corners) are skipped and their buttons are shown
disabled in the page.

## Try it locally

The page fetches `data/models.json`, so it must be served over HTTP (opening the
file directly will be blocked by the browser):

```bash
cd Implementation/IAC/web
python -m http.server 8000
# open http://localhost:8000
```

## Publish + QR code

1. Copy this `web/` folder (including `data/models.json`) to any static host —
   e.g. a GitHub Pages repo, or `gh-pages` branch.
2. Take the public URL (e.g. `https://<user>.github.io/<repo>/`).
3. Generate a QR code for that URL (any QR generator, or
   `python -m qrcode "<url>" > qr.png` after `pip install "qrcode[pil]"`).
4. Put the QR on your slide. Phones that scan it load the page and can drive the
   simulation with the on-screen thruster pads.

## Controls

- **Thruster pads** (bottom-left): hold to apply lateral (◀ ▶) or axial (▲ ▼)
  force. Arrow keys work on desktop.
- **Gravity** buttons set the Bond number; **Propellant** buttons set the
  contact angle; **Fill h/R**, **Damping ζ** and **Time ×** are sliders.
- **Reset** / **Pause**, and orbit/zoom by dragging (one finger) / pinching.
