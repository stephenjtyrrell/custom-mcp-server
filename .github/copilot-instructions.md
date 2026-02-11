# Azure DevOps On-Premise MCP Server Project

This project is an MCP (Model Context Protocol) server that connects to Azure DevOps on-premise servers and provides tools for retrieving work items, projects, and other resources.

## Project Checklist

- [x] Verify that the copilot-instructions.md file in the .github directory is created.
- [x] Clarify Project Requirements
- [x] Scaffold the Project
- [x] Customize the Project
- [x] Install Required Extensions
- [x] Compile the Project
- [x] Create and Run Task
- [x] Launch the Project
- [x] Ensure Documentation is Complete

## Project Details
- **Type**: MCP Server (Model Context Protocol)
- **Language**: TypeScript
- **Target**: Azure DevOps on-premise server integration
- **Features**: 
  - Connect to on-premise Azure DevOps server
  - Retrieve work items
  - Query projects and teams
  - Execute API commands

## SDK References
- [Model Context Protocol SDK](https://github.com/modelcontextprotocol/typescript-sdk)
- [Azure DevOps Node API](https://github.com/microsoft/azure-devops-node-api)
- [MCP Documentation](https://modelcontextprotocol.io/)

## Environment Setup
Create a `.env` file with:
- `AZURE_DEVOPS_ORG_URL`: Your on-premise Azure DevOps server URL
- `AZURE_DEVOPS_PAT`: Personal Access Token with required permissions
