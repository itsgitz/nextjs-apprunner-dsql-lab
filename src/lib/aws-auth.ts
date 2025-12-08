import { DsqlSigner } from "@aws-sdk/dsql-signer";

export interface DSQLAuthConfig {
    hostname: string;
    region: string;
}

export async function generateAuthToken(
    config: DSQLAuthConfig,
): Promise<string> {
    const signer = new DsqlSigner({
        hostname: config.hostname,
        region: config.region,
        expiresIn: 3600,
    });

    const token = await signer.getDbConnectAdminAuthToken();
    return token;
}

export async function getConnectionConfig() {
    const hostname = process.env.DSQL_HOSTNAME;
    const region = process.env.DSQL_REGION;
    const database = process.env.DSQL_DATABASE || "postgres";

    if (!hostname || !region) {
        throw new Error(
            "DSQL_HOSTNAME and DSQL_REGION must be set in environment variables",
        );
    }

    const token = await generateAuthToken({
        hostname,
        region,
    });

    return {
        host: hostname,
        port: 5432,
        user: "admin",
        password: token,
        database,
    };
}
