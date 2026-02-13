import * as dotenv from "dotenv";

// Load environment variables
dotenv.config();

export const AZURE_DEVOPS_ORG_URL = process.env.AZURE_DEVOPS_ORG_URL;
export const AZURE_DEVOPS_PAT = process.env.AZURE_DEVOPS_PAT;

/**
 * Validate that required environment variables are set
 */
export function validateConfig(): void {
  if (!AZURE_DEVOPS_ORG_URL || !AZURE_DEVOPS_PAT) {
    console.error(
      "Error: AZURE_DEVOPS_ORG_URL and AZURE_DEVOPS_PAT must be set in environment variables"
    );
    process.exit(1);
  }
}
