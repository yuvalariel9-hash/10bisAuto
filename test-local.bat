@echo off
echo Setting up environment variables for local testing...

set ACCESS_TOKEN=eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1aWQiOiJxOXZvTll0NWlPaU5lMlJiaTBzVERnPT0iLCJ1dG9rZW4iOiJiOWE0NzJlNC1kZjkzLTQ2MjItYTIxNS0zYjc4OGZkNjY0ZmQiLCJ0b2tlbi1pZCI6IjYyZWIzNWZhLTQyMWYtNGFkOS1iN2U4LThkNTgwYWYyN2I2OCIsImV4cCI6MTc1NzgyODM2OSwiaXNzIjoiVGVuQmlzV2ViQXBwIn0.S4fqx1f0QfR2RHKjCdu2giJWw_m5xu-zQtijrwMQM3-rLfWoOV-UxBK6EzPKIqXqwC8VektHCaotfmdlt1XFOwdivgBgD6Fl2Bj3o4PXbRWtQsNa-tcW_sk-hP99bSnPXpeGY91RpIk2Go4mrHlsm0cgpjLW8M82qsYVf0hk7nQ
set REFRESH_TOKEN=eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbi1pZCI6IjZiZTQ1ZjkxLTNjOTYtNGI1ZC05NTU5LTA0MGZlODI3ZjQ1NyIsImV4cCI6MTc2NTYwMjU3MCwiaXNzIjoiVGVuQmlzV2ViQXBwIn0.KHNjJS0872Ml1DSg5GrLiNTHS9Wntd2QDsj5mg9K-QEQVYDTEDagdr8bPL2TEoN380mWSGs2CDkW8R4C16ARRjAj27xYdsHmFlHwN0_qmJ4WG7d10CU2dkD-9q8T6Ij8s6Apz79eLHMXzO5a6YRWQM86G55oZGpzVihU8H2D0AM
set AMOUNT=50
set MONEYCARD_ID=your_moneycard_id

REM Teams Direct Messaging Configuration
set TEAMS_TENANT_ID=your_azure_tenant_id
set TEAMS_CLIENT_ID=your_app_client_id
set TEAMS_CLIENT_SECRET=your_app_client_secret
set TEAMS_USER_ID=your_teams_user_id

echo Environment variables set!
echo.
echo Available test commands:
echo   node github-refresh-token.js     - Test token refresh
echo   node github-load-credit.js       - Test credit loading + Teams messages
echo   npm run test-teams-connection     - Test Teams direct messages
echo   npm run debug-tokens              - Debug token issues
echo.
echo Note: Teams messages will be sent as direct messages from "10bis Bot"
echo.