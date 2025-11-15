# REST API Testing MCP Server Setup Guide

## Overview

This guide sets up the `rest-api-mcp-server` for Claude Code, enabling powerful REST API testing capabilities directly within your development workflow.

## Features

- **Universal API Support**: REST & GraphQL APIs
- **All HTTP Methods**: GET, POST, PUT, DELETE, PATCH, etc.
- **File Operations**: Upload and download capabilities
- **Auto Content-Type Detection**: Automatic handling of different content types
- **Form Data Support**: Multipart form submissions
- **Built on Official MCP SDK**: Uses `@modelcontextprotocol/sdk`

## Installation Steps

### 1. Install the MCP Server
```bash
npm install -g rest-api-mcp-server
```

### 2. Configure Claude Code
Create the configuration directory and MCP server configuration:

```bash
mkdir -p ~/.config/claude-code
```

Create `~/.config/claude-code/mcp_servers.json`:
```json
{
  "rest-api": {
    "command": "rest-api-mcp-server",
    "args": [],
    "env": {
      "NODE_ENV": "development"
    }
  }
}
```

### 3. Restart Claude Code
Restart Claude Code to load the new MCP server configuration.

## Usage Examples

Once configured, you'll have access to REST API testing tools directly in Claude Code:

### Basic API Testing
- Make HTTP requests to any endpoint
- Test different HTTP methods (GET, POST, PUT, DELETE)
- Send JSON payloads and form data
- Handle authentication headers
- Upload and download files

### Integration with Your Development Workflow
- Test your local APIs (like http://localhost:3000)
- Validate API responses during development
- Debug API integration issues
- Test external API integrations

## Available Tools

The MCP server provides two main tools:
1. **REST API Client**: For making HTTP requests
2. **GraphQL Client**: For GraphQL queries and mutations

## Configuration Options

You can customize the MCP server by adding arguments to the `args` array in the configuration:

```json
{
  "rest-api": {
    "command": "rest-api-mcp-server",
    "args": ["--timeout", "30000", "--max-redirects", "5"],
    "env": {
      "NODE_ENV": "development",
      "DEBUG": "rest-api-mcp:*"
    }
  }
}
```

## Troubleshooting

### Server Not Loading
- Ensure `rest-api-mcp-server` is installed globally
- Check that the configuration file is in the correct location
- Restart Claude Code after configuration changes

### Permission Issues
- Make sure the global npm directory is in your PATH
- Check file permissions on the configuration directory

## Security Considerations

- The MCP server can make requests to any URL
- Be cautious when testing with sensitive credentials
- Consider using environment variables for API keys
- Use HTTPS endpoints when possible

## Dependencies

- `@modelcontextprotocol/sdk`: ^1.20.2
- `axios`: ^1.13.1
- `form-data`: ^4.0.1
- `zod`: ^3.25.76

## Version Information

- Package: `rest-api-mcp-server@1.3.0`
- License: MIT
- Maintainer: sngodzilla
- GitHub: https://github.com/Godzilla675/rest-api-mcp-server

## Next Steps

1. Restart Claude Code to activate the MCP server
2. Try making a simple API call to test functionality
3. Integrate API testing into your development workflow
4. Explore advanced features like file uploads and GraphQL queries