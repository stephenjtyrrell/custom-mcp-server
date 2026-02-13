# Azure DevOps On-Premise MCP Server

A Model Context Protocol (MCP) server that enables seamless interaction with Azure DevOps on-premise instances through AI assistants like Claude, GitHub Copilot, and other MCP-compatible tools.

## ✨ Features

Comprehensive Azure DevOps integration with 27+ tools across multiple categories:

### 🏢 Core API (2 tools)
- **List Projects** - Browse all projects in your organization
- **List Project Teams** - View teams within specific projects

### 📋 Work Items (9 tools)
- **Get Work Item** - Retrieve detailed information about specific work items
- **Get Work Items Batch** - Retrieve multiple work items by IDs
- **Create Work Item** - Create new work items (tasks, bugs, user stories, etc.)
- **Update Work Item** - Modify existing work items
- **My Work Items** - View all work items assigned to you with filtering
- **Add Comment** - Add comments to work items
- **List Comments** - View all comments on a work item
- **Execute Query** - Run saved work item queries by ID

### 📦 Repositories (7 tools)
- **List Repositories** - Browse all repositories in a project
- **Get Repository** - Get detailed information about a specific repository
- **List Branches** - View all branches in a repository
- **Get Branch** - Get details about a specific branch
- **List Pull Requests** - Browse pull requests with filtering
- **Get Pull Request** - Get detailed information about a specific PR
- **Create Pull Request** - Create new pull requests

### 🚀 Pipelines & Builds (3 tools)
- **List Builds** - Browse builds with status and result filtering
- **Get Build Status** - Check the status of a specific build
- **List Build Definitions** - View available build/pipeline definitions

### 📚 Wiki (3 tools)
- **List Wikis** - Browse wikis in organization or project
- **Get Page Content** - Retrieve wiki page content
- **List Pages** - View all pages in a wiki

### 🔍 Search (3 tools)
- **Search Code** - Search for code across repositories with filtering
- **Search Wiki** - Search wiki pages by keywords and content
- **Search Work Items** - Full-text search across work items

### ⏱️ Work & Iterations (2 tools)
- **List Iterations** - View all iterations/sprints in a project
- **List Team Iterations** - View iterations assigned to a specific team

### 🔒 Security Features
- Built-in WIQL injection prevention and input validation
- Secure credential handling via environment variables
- Result limits to prevent memory exhaustion

## 📋 Prerequisites

- Node.js 18 or higher
- Access to an Azure DevOps on-premise server
- Personal Access Token (PAT) with the following permissions:
  - **Work Items (Read & Write)** - Required for viewing and modifying work items, adding comments
  - **Code (Read & Write)** - Required for repository and pull request operations, code search
  - **Build (Read)** - Required for viewing builds and pipelines
  - **Project and Team (Read)** - Required for listing projects and teams
  - **Wiki (Read)** - Required for wiki search operations
  
  *Note: You can create a PAT with only Read permissions if you only need to query/view data.*

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

### Core API Tools

#### `mcp_ado_core_list_projects`
List all projects in the Azure DevOps organization.

**Parameters:**
- `stateFilter` (string, optional): Filter by state (all, wellFormed, deleting, new)
- `top` (number, optional): Maximum number of projects to return

---

#### `mcp_ado_core_list_project_teams`
List teams within a project.

**Parameters:**
- `project` (string, required): The project name or ID
- `top` (number, optional): Maximum number of teams to return

---

### Work Item Tools

#### `mcp_ado_wit_get_work_item`
Get detailed information about a single work item.

**Parameters:**
- `id` (number, required): The work item ID
- `project` (string, optional): The project name (not required since work item IDs are globally unique)
- `expand` (string, optional): Expand options (None, Relations, Fields, Links, All)

---

#### `mcp_ado_wit_get_work_items_batch_by_ids`
Retrieve multiple work items in a single batch request.

**Parameters:**
- `ids` (array of numbers, required): Array of work item IDs
- `project` (string, required): The project name
- `fields` (array of strings, optional): Specific fields to return

---

#### `mcp_ado_wit_create_work_item`
Create a new work item.

**Parameters:**
- `project` (string, required): The project name
- `workItemType` (string, required): Type (e.g., 'Task', 'Bug', 'User Story')
- `title` (string, required): Work item title
- `description` (string, optional): Work item description
- `assignedTo` (string, optional): User to assign to
- `state` (string, optional): Initial state
- `tags` (string, optional): Semicolon-separated tags

---

#### `mcp_ado_wit_update_work_item`
Update an existing work item.

**Parameters:**
- `id` (number, required): The work item ID
- `project` (string, required): The project name
- `title` (string, optional): Updated title
- `description` (string, optional): Updated description
- `state` (string, optional): Updated state
- `assignedTo` (string, optional): Updated assignee
- `tags` (string, optional): Updated tags

---

#### `mcp_ado_wit_my_work_items`
Get work items assigned to the current user across all projects or filtered by a specific project.

**Parameters:**
- `project` (string, optional): Filter by project name
- `state` (string, optional): State filter (e.g., 'Active', 'New')
- `type` (string, optional): Work item type filter
- `top` (number, optional): Maximum items to return (default: 100)

---

#### `mcp_ado_wit_add_work_item_comment`
Add a comment to a work item.

**Parameters:**
- `project` (string, required): The project name
- `workItemId` (number, required): The work item ID
- `comment` (string, required): Comment text

---

#### `mcp_ado_wit_list_work_item_comments`
List all comments on a work item.

**Parameters:**
- `project` (string, required): The project name
- `workItemId` (number, required): The work item ID
- `top` (number, optional): Maximum comments to return

---

#### `mcp_ado_wit_get_query_results_by_id`
Execute a saved work item query and get results.

**Parameters:**
- `project` (string, required): The project name
- `queryId` (string, required): The query ID (GUID)
- `top` (number, optional): Maximum results to return

---

### Repository Tools

#### `mcp_ado_repo_list_repos_by_project`
List all repositories in a project.

**Parameters:**
- `project` (string, required): The project name or ID

---

#### `mcp_ado_repo_get_repo_by_name_or_id`
Get detailed repository information.

**Parameters:**
- `project` (string, required): The project name
- `repositoryNameOrId` (string, required): Repository name or ID

---

#### `mcp_ado_repo_list_branches_by_repo`
List all branches in a repository.

**Parameters:**
- `repositoryId` (string, required): The repository ID
- `project` (string, required): The project name

---

#### `mcp_ado_repo_get_branch_by_name`
Get details of a specific branch.

**Parameters:**
- `repositoryId` (string, required): The repository ID
- `branchName` (string, required): Branch name (e.g., 'main' or 'refs/heads/main')
- `project` (string, required): The project name

---

#### `mcp_ado_repo_list_pull_requests_by_repo_or_project`
List pull requests for a repository or project.

**Parameters:**
- `project` (string, required): The project name
- `repositoryId` (string, optional): The repository ID
- `status` (string, optional): PR status (active, completed, abandoned, all)
- `targetRefName` (string, optional): Target branch filter
- `top` (number, optional): Maximum PRs to return

---

#### `mcp_ado_repo_get_pull_request_by_id`
Get detailed information about a pull request.

**Parameters:**
- `repositoryId` (string, required): The repository ID
- `pullRequestId` (number, required): The pull request ID
- `project` (string, required): The project name

---

#### `mcp_ado_repo_create_pull_request`
Create a new pull request.

**Parameters:**
- `repositoryId` (string, required): The repository ID
- `project` (string, required): The project name
- `sourceRefName` (string, required): Source branch (e.g., 'refs/heads/feature')
- `targetRefName` (string, required): Target branch (e.g., 'refs/heads/main')
- `title` (string, required): PR title
- `description` (string, optional): PR description
- `isDraft` (boolean, optional): Create as draft PR

---

### Pipeline & Build Tools

#### `mcp_ado_pipelines_get_builds`
List builds for a project.

**Parameters:**
- `project` (string, required): The project name
- `definitions` (array of numbers, optional): Filter by build definition IDs
- `top` (number, optional): Maximum builds to return
- `statusFilter` (string, optional): Status filter (all, cancelling, completed, inProgress, notStarted, postponed)
- `resultFilter` (string, optional): Result filter (succeeded, partiallySucceeded, failed, canceled)

---

#### `mcp_ado_pipelines_get_build_status`
Get status of a specific build.

**Parameters:**
- `project` (string, required): The project name
- `buildId` (number, required): The build ID

---

#### `mcp_ado_pipelines_get_build_definitions`
List build definitions in a project.

**Parameters:**
- `project` (string, required): The project name
- `name` (string, optional): Filter by definition name
- `top` (number, optional): Maximum definitions to return

---

### Wiki Tools

#### `mcp_ado_wiki_list_wikis`
List all wikis in the organization or project.

**Parameters:**
- `project` (string, optional): Filter by project name

---

#### `mcp_ado_wiki_get_page_content`
Get the content of a wiki page.

**Parameters:**
- `wikiIdentifier` (string, required): Wiki ID or name
- `project` (string, required): The project name
- `path` (string, required): Page path (e.g., '/page-name')

---

#### `mcp_ado_wiki_list_pages`
List all pages in a wiki.

**Parameters:**
- `wikiIdentifier` (string, required): Wiki ID or name
- `project` (string, required): The project name

---

### Search Tools

> **⚠️ Important for On-Premise Installations:**  
> Code and Wiki search require the **Code Search** extension to be installed on your Azure DevOps Server.  
> If you encounter 404 or API not found errors, verify that:
> - The Code Search extension is installed in your organization
> - The extension is enabled for your projects
> - Your PAT has the appropriate search permissions
> 
> See [Installing Code Search](https://learn.microsoft.com/en-us/azure/devops/project/search/install-configure-search) for setup instructions.

#### `mcp_ado_search_code`
Search for code across Azure DevOps repositories.

**Parameters:**
- `searchText` (string, required): Keywords to search for in code repositories
- `project` (array of strings, optional): Filter by project names
- `repository` (array of strings, optional): Filter by repository names
- `path` (array of strings, optional): Filter by file paths
- `branch` (array of strings, optional): Filter by branch names
- `includeFacets` (boolean, optional): Include facets in results (default: false)
- `skip` (number, optional): Number of results to skip for pagination (default: 0)
- `top` (number, optional): Maximum results to return (default: 5)

---

#### `mcp_ado_search_wiki`
Search Azure DevOps wiki pages by keywords.

**Parameters:**
- `searchText` (string, required): Keywords to search for in wiki pages
- `project` (array of strings, optional): Filter by project names
- `wiki` (array of strings, optional): Filter by wiki names
- `includeFacets` (boolean, optional): Include facets in results (default: false)
- `skip` (number, optional): Number of results to skip for pagination (default: 0)
- `top` (number, optional): Maximum results to return (default: 10)

---

#### `mcp_ado_search_workitem`
Search work items by text.

**Parameters:**
- `searchText` (string, required): Text to search for
- `project` (string, optional): Filter by project name
- `top` (number, optional): Maximum results (default: 50)

---

### Work & Iteration Tools

#### `mcp_ado_work_list_iterations`
List all iterations in a project.

**Parameters:**
- `project` (string, required): The project name

---

#### `mcp_ado_work_list_team_iterations`
List iterations for a specific team.

**Parameters:**
- `project` (string, required): The project name
- `team` (string, required): The team name or ID

## 🔒 Security Features

This server includes multiple security measures:

- **WIQL Injection Prevention**: All user inputs are properly escaped before being used in WIQL queries
- **Input Validation**: All parameters are validated for type and format
- **Result Limits**: Default limits prevent memory exhaustion from large result sets
- **Secure Credential Handling**: PAT tokens are loaded from environment variables, never hardcoded

### Best Practices

1. **Never commit** your `.env` file or PAT tokens to version control
2. **Use PATs with minimal permissions** - only grant what's needed:
   - Read-only PAT: For querying and viewing data only
   - Read/Write PAT: Required for creating/updating work items, adding comments, creating PRs
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
4. **PAT permissions**: 
   - Read operations: Work Items (Read), Project (Read), Build (Read)
   - Write operations: Work Items (Read & Write), Code (Read & Write)
   - Verify the token has appropriate scopes for the operations you need

### MCP Server Not Appearing

1. **Check the path**: Ensure the path to `dist/index.js` is absolute and correct
2. **Rebuild**: Run `npm run build` to ensure the latest code is compiled
3. **Restart client**: Restart VS Code, Claude Desktop, or your MCP client
4. **Check logs**: Look for error messages in your client's developer console

### Work Items Not Found

1. **Verify work item exists**: Check the ID in Azure DevOps web interface
2. **Check permissions**: Ensure your PAT has access to the project
3. **WIQL syntax**: For custom queries, verify WIQL syntax is correct

### Search API Issues

If code or wiki search fails:

1. **Check extension installation**: 
   - Code Search extension must be installed on your Azure DevOps Server
   - Go to Organization Settings > Extensions to verify installation
   - See [Install Code Search](https://learn.microsoft.com/en-us/azure/devops/project/search/install-configure-search)

2. **Verify API availability**:
   - Test the endpoint manually: `curl -u :YOUR_PAT https://your-server.com/your-org/_apis/search/codesearchresults?api-version=7.1-preview.1`
   - 404 errors typically mean the Search extension is not installed
   - 403 errors indicate permission issues

3. **Check PAT permissions**:
   - Ensure your PAT has "Code (Read)" permissions for code search
   - Ensure your PAT has "Wiki (Read)" permissions for wiki search

4. **API version compatibility**:
   - The search API uses version `7.1-preview.1`
   - Older on-premise servers may require different API versions
   - Check your server version and Azure DevOps API compatibility

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
