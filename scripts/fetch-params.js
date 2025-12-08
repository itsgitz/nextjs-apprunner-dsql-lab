#!/usr/bin/env node

/**
 * Fetch parameters from AWS Systems Manager Parameter Store
 * and generate a .env file for the application
 */

const { SSMClient, GetParametersCommand } = require("@aws-sdk/client-ssm");
const fs = require("fs");
const path = require("path");

const REGION = "us-east-1";
const PARAMETER_PREFIX = "/demo/smkn1cimahi/dsql";

const PARAMETERS = [
    { name: `${PARAMETER_PREFIX}/hostname`, envKey: "DSQL_HOSTNAME" },
    { name: `${PARAMETER_PREFIX}/region`, envKey: "DSQL_REGION" },
    { name: `${PARAMETER_PREFIX}/username`, envKey: "DSQL_USERNAME" },
    { name: `${PARAMETER_PREFIX}/database`, envKey: "DSQL_DATABASE" },
];

async function fetchParameters() {
    console.log("Fetching parameters from AWS Parameter Store...");

    const client = new SSMClient({ region: REGION });

    try {
        const command = new GetParametersCommand({
            Names: PARAMETERS.map((p) => p.name),
            WithDecryption: true,
        });

        const response = await client.send(command);

        if (!response.Parameters || response.Parameters.length === 0) {
            throw new Error("No parameters found in Parameter Store");
        }

        // Check for invalid parameters
        if (
            response.InvalidParameters &&
            response.InvalidParameters.length > 0
        ) {
            console.error(
                "Invalid parameters:",
                response.InvalidParameters.join(", "),
            );
            throw new Error("Some parameters could not be found");
        }

        // Map parameters to environment variables
        const envVars = {};
        response.Parameters.forEach((param) => {
            const paramConfig = PARAMETERS.find((p) => p.name === param.Name);
            if (paramConfig) {
                envVars[paramConfig.envKey] = param.Value;
                console.log(`✓ Fetched ${paramConfig.envKey}`);
            }
        });

        // Verify all parameters were found
        const missingParams = PARAMETERS.filter(
            (p) => !envVars[p.envKey],
        ).map((p) => p.name);

        if (missingParams.length > 0) {
            throw new Error(
                `Missing parameters: ${missingParams.join(", ")}`,
            );
        }

        return envVars;
    } catch (error) {
        console.error("Error fetching parameters:", error.message);
        throw error;
    }
}

async function generateEnvFile(envVars) {
    const envFilePath = path.join(process.cwd(), ".env");

    console.log(`\nGenerating .env file at ${envFilePath}...`);

    // Create .env content
    const envContent = Object.entries(envVars)
        .map(([key, value]) => `${key}=${value}`)
        .join("\n");

    // Write to .env file
    fs.writeFileSync(envFilePath, envContent + "\n", "utf8");

    console.log("✓ .env file generated successfully\n");
    console.log("Environment variables:");
    Object.keys(envVars).forEach((key) => {
        console.log(`  - ${key}`);
    });
}

async function main() {
    try {
        const envVars = await fetchParameters();
        await generateEnvFile(envVars);
        console.log("\n✓ Parameter Store fetch completed successfully");
        process.exit(0);
    } catch (error) {
        console.error("\n✗ Failed to fetch parameters:", error.message);
        process.exit(1);
    }
}

main();
