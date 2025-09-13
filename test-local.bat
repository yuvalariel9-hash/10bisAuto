@echo off
echo Setting up environment variables for local testing...

set ACCESS_TOKEN=your_access_token_here
set REFRESH_TOKEN=your_refresh_token_here
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