# TestMyEnglish

A frontend-only English proficiency assessment built with plain HTML, CSS, and JavaScript. No build step, framework, dependencies, backend, or external API is required.

## Files

- `index.html` — the application page
- `style.css` — all application styling
- `app.js` — assessment flow, scoring, results, and review
- `questions.js` — the assessment question bank
- `favicon.svg` — site icon

## Run locally

Serve the repository root with any static file server, then open its local URL. JavaScript modules require a local or hosted web server; opening `index.html` directly as a `file://` URL is not supported.

## Deploy to GitHub Pages

The GitHub Actions workflow in `.github/workflows/deploy.yml` copies the static site files and deploys them whenever changes are pushed to `main` (or when manually triggered). Relative asset paths support the `/testmyenglish/` project-site base path.

In the repository settings, open **Pages** and set the build and deployment source to **GitHub Actions**. After the first successful workflow, the site will be available at:

https://mio384.github.io/testmyenglish/
