# velixir-xray

A VLESS + WebSocket + TLS node for the Velixir free plan.

- The Velixir edge terminates HTTPS and forwards to this app's `$PORT`.
- Xray listens on `$PORT` and answers the WebSocket path itself, so plain
  HTTP requests get a 404/400 from Xray, exactly like any WS endpoint.
- All credentials come from environment variables set in the Velixir
  dashboard (`UUID`, `WS_PATH`); nothing secret is committed here.
- The Xray binary is downloaded at build time (`postinstall`) and baked
  into the release image, because free-plan disk is scratch space that
  disappears when the app sleeps.

## Deploy

Paste this public repo at velixir.net/new, pick the Free plan, set the
`UUID` and `WS_PATH` secrets, deploy. The app address will be
`https://<app-name>.velixir.run`.
