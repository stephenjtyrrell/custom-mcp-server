# Azure DevOps On-Premise MCP Server

A Model Context Protocol (MCP) server that enables interaction with Azure DevOps on-premise instances through the Azure DevOps REST API.

## Features

- **Get Work Item**: Retrieve detailed information about a specific work item by ID
- **Query Work Items**: Execute WIQL (Work Item Query Language) queries to find work items
- **List Projects**: Get all projects in your Azure DevOps organization
- **Get Project Teams**: Retrieve all teams within a specific project

## Prerequisites

- Node.js 18 or higher
- Access to an Azure DevOps on-premise server
- Personal Access Token (PAT) with appropriate permissions

## Installation

1. Clone this repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the project root:
   ```bash
   cp .env.example .env
   ```

4. Edit `.env` and add your Azure DevOps credentials:
   ```
   AZURE_DEVOPS_ORG_URL=https://your-devops-server.com/your-organization
   AZURE_DEVOPS_PAT=your-personal-access-token
   ```

## Building

Compile the TypeScript code:

```bash
npm run build
```

## Running

After building, you can run the server:

```bash
npm start
```

For development with auto-rebuild:

```bash
npm run watch
```

## Configuration in VS Code

To use this MCP server in VS Code, add it to your `.vscode/mcp.json`:

```json
{
  "servers": {
    "azure-devops-onprem": {
      "type": "stdio",
      "command": "node",
      "args": ["/absolute/path/to/custom-mcp-server/dist/index.js"]
    }
  }
}
```

## Available Tools

### get_work_item
Retrieves a work item by its ID.

**Parameters:**
- `id` (number, required): The work item ID

### query_work_items
Queries work items using WIQL.

**Parameters:**
- `wiql` (string, required): The WIQL query
- `project` (string, optional): The project name to query within

**Example WIQL:**
```sql
SELECT [System.Id], [System.Title], [System.State] 
FROM WorkItems 
WHERE [System.TeamProject] = 'MyProject' 
AND [System.State] = 'Active'
```

### list_projects
Lists all projects in the organization.

**Parameters:** None

### get_project_teams
Gets all teams for a specific project.

**Parameters:**
- `projectId` (string, required): The project ID or name

## Security Notes

- Never commit your `.env` file with credentials
- Use a PAT with minimal required permissions
- For on-premise servers, ensure network connectivity and SSL certificates are properly configured

## Troubleshooting

If you encounter SSL certificate issues with self-signed certificates on your on-premise server, you may need to set:

```bash
export NODE_TLS_REJECT_UNAUTHORIZED=0
```

**Warning:** Only use this in development environments with trusted servers.

## License

MIT
