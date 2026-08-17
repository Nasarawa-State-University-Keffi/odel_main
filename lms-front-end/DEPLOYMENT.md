# Dokploy deployment

Deploy this directory as a Dokploy **Application** using the **Nixpacks** build type.
Nixpacks detects the Vite + React SPA, runs the `build` script, and serves the generated files through Caddy with SPA route fallback.

| Dokploy field | Value |
| --- | --- |
| Branch | `lms-frontend-branch` |
| Root directory | `lms-front-end` |
| Build type | `Nixpacks` |
| Application port | `80` |

Set the following Dokploy **environment variable** before deploying. Vite embeds it in the generated JavaScript bundle at build time, so changing it requires a new deployment.

| Name | Value |
| --- | --- |
| `VITE_API_BASE_URL` | `https://odel-lms-api.nsuk.edu.ng` |

The included `.nvmrc` selects Node.js 22, which is required by the current Vite toolchain. Attach the application's domain to port `80` in Dokploy.

Do not put credentials in `VITE_API_BASE_URL` or any other `VITE_*` variable: all such values are public in the browser bundle.
