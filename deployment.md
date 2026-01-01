# AWS Deployment Guide

This guide explains how to deploy and host the **MCP Workbench** on AWS using **AWS Amplify Hosting**.

## 1. AWS Amplify Setup

AWS Amplify is the recommended service for hosting this React application. It provides managed CI/CD, SSL, and custom domain support.

### Step 1: Create the Amplify App
1. Log in to the [AWS Management Console](https://console.aws.amazon.com/amplify/home).
2. Click **Create new app**.
3. Select **GitHub** as your source provider.
4. Authorize AWS Amplify to access your GitHub account and select the `mcp-workbench` repository.
5. Choose the `main` branch.

### Step 2: Build Settings
Amplify should automatically detect the settings from `package.json`. Ensure the following are set:
- **Build Command**: `npm run build`
- **Base Directory**: `dist`

### Step 3: Deployment
1. Click **Save and Deploy**.
2. Once the build is finished, you will receive a default `*.amplifyapp.com` URL.

---

## 2. DNS & Custom Domain

To use a custom domain (e.g., `workbench.orkes.io`):

1. In the Amplify Console, go to **Domain management**.
2. Click **Add domain**.
3. Enter your domain name.
4. Amplify will automatically provision an **SSL certificate** via Amazon Certificate Manager (ACM).
5. If your DNS is managed by **Route 53**, the records will be added automatically. Otherwise, you must manually add the `CNAME` records provided by Amplify to your DNS provider.

---

## 3. GitHub Actions (CI/CD)

The project includes a `.github/workflows/deploy.yml` file. This is useful if you want to use a specific IAM user for deployment rather than the managed Amplify connection.

### Required GitHub Secrets:
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_REGION`
- `AWS_AMPLIFY_APP_ID`

---

## 4. Local Manual Deployment

If you need to deploy directly from your terminal (for debugging or rapid testing):

1. Ensure you have the [AWS CLI](https://aws.amazon.com/cli/) installed and configured.
2. Set your App ID and run the script:
   ```bash
   export AWS_AMPLIFY_APP_ID="your_amplify_app_id"
   ./deploy.sh
   ```

### Troubleshooting:
- **Routing**: If you encounter 404s on page refresh, ensure Amplify has a **Redirect** rule:
    - **Source**: `</^[^.]+$|\.(?!(css|gif|ico|jpg|js|png|txt|svg|woff|woff2|ttf|map|json)$)([^.]+$)/>`
    - **Target**: `/index.html`
    - **Type**: `200 (Rewrite)`
