# AWS App Runner Deployment Guide

This guide explains how to deploy the Next.js Aurora DSQL application to AWS App Runner using the repository source with the `apprunner.yaml` configuration file.

## Prerequisites

1. **AWS Account** with access to:
   - AWS App Runner
   - Amazon Aurora DSQL
   - IAM (for creating roles and policies)

2. **Amazon Aurora DSQL Cluster** already created and available

3. **GitHub Repository** (or other Git provider) with this code

## Step 1: Create IAM Role for App Runner

Your App Runner service needs an IAM role with permissions to connect to Aurora DSQL.

### Create IAM Policy

Create a policy named `AppRunnerDSQLAccess` with the following permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "dsql:DbConnect",
        "dsql:DbConnectAdmin"
      ],
      "Resource": "arn:aws:dsql:REGION:ACCOUNT_ID:cluster/CLUSTER_ID"
    }
  ]
}
```

**Replace:**
- `REGION` with your Aurora DSQL region (e.g., `us-east-1`)
- `ACCOUNT_ID` with your AWS account ID
- `CLUSTER_ID` with your Aurora DSQL cluster ID

### Create IAM Role

1. Create an IAM role named `AppRunnerInstanceRole`
2. Trust relationship should allow `tasks.apprunner.amazonaws.com`:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "tasks.apprunner.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
```

3. Attach the `AppRunnerDSQLAccess` policy to this role

## Step 2: Configure App Runner Service

### Using AWS Console

1. Go to **AWS App Runner** in the AWS Console
2. Click **Create service**

### Source Configuration

1. **Source type**: Repository
2. **Repository provider**: GitHub (or your Git provider)
3. **Connect to GitHub**: Connect your GitHub account if not already connected
4. **Repository**: Select your repository
5. **Branch**: Select your main branch (e.g., `master` or `main`)
6. **Configuration file**: Select "Use a configuration file"
7. **Configuration file path**: `apprunner.yaml` (default)

### Build Configuration

The build configuration is defined in `apprunner.yaml`, so no additional settings are needed here.

### Service Configuration

1. **Service name**: `nextjs-dsql-blog` (or your preferred name)
2. **Virtual CPU**: 1 vCPU (minimum, adjust based on your needs)
3. **Memory**: 2 GB (minimum, adjust based on your needs)
4. **Port**: 3000 (defined in apprunner.yaml)

### Environment Variables

Add the following environment variables:

| Name | Value | Description |
|------|-------|-------------|
| `DSQL_HOSTNAME` | `your-cluster.dsql.region.on.aws` | Your Aurora DSQL cluster endpoint |
| `DSQL_REGION` | `us-east-1` | AWS region of your DSQL cluster |
| `DSQL_DATABASE` | `postgres` | Database name (typically 'postgres') |
| `NODE_ENV` | `production` | Already set in apprunner.yaml |

**Important**: Do NOT set AWS credentials as environment variables. The IAM role will provide credentials automatically.

### Security Configuration

1. **Instance role**: Select the `AppRunnerInstanceRole` created in Step 1
2. This role allows the application to authenticate with Aurora DSQL using IAM

### Auto Scaling

Configure based on your needs:
- **Min instances**: 1
- **Max instances**: 5 (adjust based on expected traffic)
- **Concurrency**: 100 (requests per instance)

### Health Check (Optional)

The default health check uses `HTTP` on port `3000` at path `/`. This works for Next.js applications.

If you want a custom health check endpoint, uncomment the `healthcheck` section in `apprunner.yaml` and create a health check API route.

### Networking (Optional)

If your Aurora DSQL cluster is in a VPC:
1. Enable **VPC connector**
2. Select the VPC where your DSQL cluster is located
3. Select appropriate subnets and security groups

## Step 3: Deploy

1. Click **Create & deploy**
2. App Runner will:
   - Clone your repository
   - Install dependencies (`npm ci`)
   - Build the Next.js application (`npm run build`)
   - Initialize the database (`npm run db:init`)
   - Run migrations (`npm run migrate`)
   - Start the application (`npm start`)

## Step 4: Verify Deployment

1. Wait for the service status to show **Running**
2. Copy the **Default domain** URL provided by App Runner
3. Open the URL in your browser
4. You should see the blog application

## Deployment Workflow

The `apprunner.yaml` configuration defines the following build and deployment workflow:

### Build Phase

1. **Pre-build**: Install dependencies with `npm ci`
2. **Build**: Build the Next.js application with `npm run build`
3. **Post-build**:
   - Initialize database with `npm run db:init` (creates migration table if needed)
   - Run migrations with `npm run migrate` (applies database schema)

### Run Phase

- Starts the Next.js production server on port 3000
- Uses Node.js 20 runtime
- Sets `NODE_ENV=production`

## Troubleshooting

### Build Failures

**Issue**: Build fails during `npm ci`
- Check that `package.json` and `package-lock.json` are committed to the repository
- Ensure Node.js 20 is compatible with all dependencies

**Issue**: Build fails during `npm run build`
- Check App Runner build logs for TypeScript or build errors
- Verify that the application builds successfully locally

### Database Connection Issues

**Issue**: Application can't connect to Aurora DSQL
- Verify the IAM role has `dsql:DbConnect` and `dsql:DbConnectAdmin` permissions
- Check that `DSQL_HOSTNAME`, `DSQL_REGION`, and `DSQL_DATABASE` environment variables are set correctly
- Ensure the Aurora DSQL cluster endpoint is accessible from App Runner
- If DSQL is in a VPC, ensure App Runner has a VPC connector configured

**Issue**: Migration errors during deployment
- Check that the migration SQL is compatible with Aurora DSQL limitations
- Verify that indexes use `CREATE INDEX ASYNC` without sort order
- Ensure no SERIAL, ENUM, or JSONB types are used

### Runtime Issues

**Issue**: Application crashes or restarts
- Check App Runner logs for errors
- Verify that the IAM role is correctly attached
- Check memory and CPU settings (increase if needed)

**Issue**: 503 Service Unavailable
- Check that the application is listening on port 3000
- Verify health check settings
- Check App Runner logs for startup errors

## Continuous Deployment

Once configured, App Runner will automatically:
- Detect new commits to your branch
- Rebuild and redeploy the application
- Apply any new database migrations

You can also manually trigger deployments from the App Runner console.

## Monitoring

Monitor your application using:

1. **App Runner Console**:
   - View deployment status
   - Check application logs
   - Monitor metrics (CPU, memory, requests)

2. **CloudWatch**:
   - View detailed application logs
   - Set up custom alarms
   - Create dashboards

3. **Aurora DSQL Console**:
   - Monitor database connections
   - View query performance
   - Check cluster metrics

## Updating the Application

To update your application:

1. Make code changes locally
2. Commit and push to your repository
3. App Runner automatically detects the change and redeploys

To manually deploy:
1. Go to App Runner console
2. Select your service
3. Click **Deploy** > **New deployment**

## Rollback

If a deployment fails or introduces issues:

1. Go to App Runner console
2. Select your service
3. Click **Deployments** tab
4. Find a previous successful deployment
5. Click **Rollback**

## Cost Optimization

To optimize costs:

1. **Right-size resources**: Start with minimum CPU/memory and scale up if needed
2. **Auto-scaling**: Set appropriate min/max instances based on traffic patterns
3. **Pause unused services**: Pause development/staging services when not in use
4. **Monitor usage**: Use CloudWatch to track resource utilization

## Security Best Practices

1. **Use IAM roles**: Never hardcode AWS credentials
2. **Least privilege**: Grant only necessary permissions to the IAM role
3. **Environment variables**: Store sensitive configuration in App Runner environment variables
4. **HTTPS**: App Runner provides automatic HTTPS for your domain
5. **Private networking**: Use VPC connector if your DSQL cluster is in a VPC
6. **Regular updates**: Keep dependencies updated to patch security vulnerabilities

## Advanced Configuration

### Custom Domain

To use a custom domain:

1. Go to **Custom domains** in your App Runner service
2. Click **Link domain**
3. Enter your domain name
4. Add the provided CNAME records to your DNS provider
5. Wait for validation (may take up to 48 hours)

### Environment-Specific Configuration

For multiple environments (dev, staging, production):

1. Create separate App Runner services for each environment
2. Use different branches (e.g., `develop`, `staging`, `main`)
3. Configure different DSQL clusters for each environment
4. Use environment-specific environment variables

### Secrets Management

For sensitive data beyond environment variables:

1. Store secrets in AWS Secrets Manager or Parameter Store
2. Grant the IAM role permissions to read secrets
3. Update your application to fetch secrets at runtime

## References

- [AWS App Runner Documentation](https://docs.aws.amazon.com/apprunner/)
- [App Runner Configuration File Reference](https://docs.aws.amazon.com/apprunner/latest/dg/config-file.html)
- [Amazon Aurora DSQL Documentation](https://docs.aws.amazon.com/aurora-dsql/)
- [Aurora DSQL IAM Authentication](https://docs.aws.amazon.com/aurora-dsql/latest/userguide/SECTION_authentication-token.html)

## Support

For issues or questions:
- Check App Runner logs in the AWS Console
- Review CloudWatch logs for detailed error messages
- Consult the Aurora DSQL documentation for database-specific issues
- Open an issue in the GitHub repository
