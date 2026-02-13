# Azure DevOps On-Premise MCP Server

A Model Context Protocol (MCP) server that enables seamless interaction with Azure DevOps on-premise instances through AI assistants like Claude, GitHub Copilot, and other MCP-compatible tools.

## ✨ Features

- 🔍 **Get Work Item** - Retrieve detailed information about specific work items
- 📋 **Get My Work Items** - View all work items assigned to you with filtering options
- 🔎 **Query Work Items** - Execute custom WIQL queries to find work items
- 📁 **List Projects** - Browse all projects in your organization
- 👥 **Get Project Teams** - View teams within specific projects
- 🔒 **Security First** - Built-in WIQL injection prevention and input validation

## 📋 Prerequisites

- Node.js 18 or higher
- Access to an Azure DevOps on-premise server
- Personal Access Token (PAT) with the following permissions:
  - Work Items (Read)
  - Project and Team (Read)

## 🚀 Installation

### Option 1: Local Development

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd custom-mcp-server
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   
   Create a `.env` file in the project root:
   ```bash
   AZURE_DEVOPS_ORG_URL=https://your-devops-server.com/your-organization
   AZURE_DEVOPS_PAT=your-personal-access-token-here
   ```

4. **Build the project**
   ```bash
   npm run build
   ```

### Option 2: Global Installation

Install the package globally to use it from anywhere:

```bash
npm install -g .
```

Then run it with environment variables:

```bash
AZURE_DEVOPS_ORG_URL=https://your-server.com AZURE_DEVOPS_PAT=your-pat azure-devops-onprem-mcp-server
```

## ⚙️ Configuration

### VS Code (GitHub Copilot)

Add to your VS Code settings file (`.vscode/mcp.json` or user settings):

```json
{
  "mcpServers": {
    "azure-devops-onprem": {
      "command": "node",
      "args": ["/absolute/path/to/custom-mcp-server/dist/index.js"],
      "env": {
        "AZURE_DEVOPS_ORG_URL": "https://your-devops-server.com/your-org",
        "AZURE_DEVOPS_PAT": "your-personal-access-token"
      }
    }
  }
}
```

### Claude Desktop

Add to your Claude Desktop configuration (`~/Library/Application Support/Claude/claude_desktop_config.json` on macOS):

```json
{
  "mcpServers": {
    "azure-devops-onprem": {
      "command": "node",
      "args": ["/absolute/path/to/custom-mcp-server/dist/index.js"],
      "env": {
        "AZURE_DEVOPS_ORG_URL": "https://your-devops-server.com/your-org",
        "AZURE_DEVOPS_PAT": "your-personal-access-token"
      }
    }
  }
}
```

### Other MCP Clients

For any MCP-compatible client, use:
- **Command**: `node`
- **Args**: `["/path/to/dist/index.js"]`
- **Transport**: stdio
- **Environment**: Set `AZURE_DEVOPS_ORG_URL` and `AZURE_DEVOPS_PAT`

## 🛠️ Available Tools

### `get_work_item`
Retrieves detailed information about a specific work item.

**Parameters:**
- `id` (number, required): The work item ID

**Example Response:**
- Work item type, title, state, assigned to
- Priority, creation date, change date
- Description and tags
- Direct link to work item

---

### `get_my_work_items`
Get all work items assigned to the authenticated user (you).

**Parameters:**
- `project` (string, optional): Filter by project name
- `state` (string, optional): Filter by state (e.g., 'Active', 'New', 'Resolved', 'Closed')
- `limit` (number, optional): Maximum items to return (default: 100, max: 200)

**Example Usage:**
```
Get all my work items: {} (no parameters)
Get active work items: {"state": "Active"}
Get work in specific project: {"project": "MyProject"}
Get top 50 recent items: {"limit": 50}
```

**Returns:** Markdown table with ID, Type, Title, State, Project, and Changed Date

---

### `query_work_items`
Execute custom WIQL (Work Item Query Language) queries.

**Parameters:**
- `wiql` (string, required): The WIQL query
- `project` (string, optional): Project context for the query

**Example WIQL Queries:**
```sql
-- Get all active bugs
SELECT [System.Id], [System.Title] 
FROM WorkItems 
WHERE [System.State] = 'Active' 
AND [System.WorkItemType] = 'Bug'

-- Get high priority items in a project
SELECT [System.Id], [System.Title], [System.Priority]
FROM WorkItems 
WHERE [System.TeamProject] = 'MyProject'
AND [Microsoft.VSTS.Common.Priority] <= 2
ORDER BY [Microsoft.VSTS.Common.Priority] ASC

-- Get work items changed in last 7 days
SELECT [System.Id], [System.Title], [System.ChangedDate]
FROM WorkItems
WHERE [System.ChangedDate] >= @Today - 7
```

**Returns:** Markdown table with ID, Type, Title, State, and Assigned To

---

### `list_projects`
Lists all projects in your Azure DevOps organization.

**Parameters:** None

**Returns:** List of projects with ID, description, state, visibility, and URL

---

### `get_project_teams`
Gets all teams within a specific project.

**Parameters:**
- `projectId` (string, required): The project ID or name

**Returns:** List of teams with ID, description, and URL

## 🔒 Security Features

This server includes multiple security measures:

- **WIQL Injection Prevention**: All user inputs are properly escaped before being used in WIQL queries
- **Input Validation**: All parameters are validated for type and format
- **Result Limits**: Default limits prevent memory exhaustion from large result sets
- **Secure Credential Handling**: PAT tokens are loaded from environment variables, never hardcoded

### Best Practices

1. **Never commit** your `.env` file or PAT tokens to version control
2. **Use PATs with minimal permissions** - only grant what's needed (Work Items: Read, Project: Read)
3. **Rotate PATs regularly** according to your organization's security policy
4. **For production**, consider using Azure Key Vault or similar secret management
5. **Network Security**: Ensure your on-premise server has proper SSL/TLS certificates

## 🔧 Development

### Available Scripts

```bash
# Install dependencies
npm install

# Build the TypeScript project
npm run build

# Watch mode (auto-rebuild on changes)
npm run watch

# Run the server (after building)
npm start

# Development mode (build and run)
npm run dev
```

### Project Structure

```
custom-mcp-server/
├── src/
│   └── index.ts          # Main server implementation
├── dist/                 # Compiled JavaScript output
├── .env                  # Environment variables (create this)
├── package.json          # Project configuration
├── tsconfig.json         # TypeScript configuration
└── README.md            # This file
```

## 🐛 Troubleshooting

### SSL Certificate Issues

If you encounter SSL certificate errors with self-signed certificates on your on-premise server:

**For Development Only:**
```bash
export NODE_TLS_REJECT_UNAUTHORIZED=0
```

⚠️ **Warning**: Only use this in development environments with trusted servers. Never use in production.

**Better Solution**: Install the proper certificate chain or add your organization's CA certificate to Node.js trusted certificates.

### Connection Failures

1. **Verify your PAT**: Test it using Azure DevOps web interface or REST API directly
2. **Check URL format**: Should be `https://your-server.com/your-organization`
3. **Network access**: Ensure you can reach the server (try `curl` or browser)
4. **PAT permissions**: Verify the token has Work Items (Read) and Project (Read) permissions

### MCP Server Not Appearing

1. **Check the path**: Ensure the path to `dist/index.js` is absolute and correct
2. **Rebuild**: Run `npm run build` to ensure the latest code is compiled
3. **Restart client**: Restart VS Code, Claude Desktop, or your MCP client
4. **Check logs**: Look for error messages in your client's developer console

### Work Items Not Found

1. **Verify work item exists**: Check the ID in Azure DevOps web interface
2. **Check permissions**: Ensure your PAT has access to the project
3. **WIQL syntax**: For custom queries, verify WIQL syntax is correct

## 📚 Resources

- [Model Context Protocol Documentation](https://modelcontextprotocol.io/)
- [Azure DevOps REST API Reference](https://learn.microsoft.com/en-us/rest/api/azure/devops/)
- [WIQL Syntax Reference](https://learn.microsoft.com/en-us/azure/devops/boards/queries/wiql-syntax)
- [Azure DevOps Node API](https://github.com/microsoft/azure-devops-node-api)

## 🤝 Contributing

Contributions are welcome! Here are some ways you can help:

- 🐛 Report bugs
- 💡 Suggest new features
- 📝 Improve documentation
- 🔧 Submit pull requests

## 📝 License

MIT

## 🙏 Acknowledgments

Built with:
- [Model Context Protocol SDK](https://github.com/modelcontextprotocol/typescript-sdk)
- [Azure DevOps Node API](https://github.com/microsoft/azure-devops-node-api)

---

**Note**: This server is designed for Azure DevOps on-premise instances. For Azure DevOps Services (cloud), similar configuration applies but ensure your organization URL is in the format `https://dev.azure.com/your-organization`.
