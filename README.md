# Google Drive MCP Server

[![Primrose MCP](https://img.shields.io/badge/Primrose-MCP-blue)](https://primrose.dev/mcp/googledrive)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A Model Context Protocol (MCP) server for Google Drive, enabling AI assistants to manage files, folders, permissions, and collaborate on documents.

## Features

- **About** - Drive storage and user information
- **Access Proposals** - Access request management
- **Apps** - Connected apps information
- **Changes** - File change tracking
- **Comments** - File comments management
- **Drives** - Shared drives management
- **Files** - File operations (upload, download, copy, move)
- **Folders** - Folder creation and organization
- **Permissions** - Sharing and access control
- **Revisions** - File version history

## Quick Start

The recommended way to use this MCP server is through the Primrose SDK:

```bash
npm install primrose-mcp
```

```typescript
import { PrimroseMCP } from 'primrose-mcp';

const primrose = new PrimroseMCP({
  service: 'googledrive',
  headers: {
    'X-Google-Access-Token': 'your-oauth-access-token'
  }
});
```

## Manual Installation

If you prefer to run the MCP server directly:

```bash
# Clone the repository
git clone https://github.com/primrose-ai/primrose-mcp-googledrive.git
cd primrose-mcp-googledrive

# Install dependencies
npm install

# Run locally
npm run dev
```

## Configuration

### Required Headers

| Header | Description |
|--------|-------------|
| `X-Google-Access-Token` | OAuth access token for Google Drive API |

### Optional Headers

| Header | Description |
|--------|-------------|
| `X-Google-Base-URL` | Override the default Google Drive API base URL |

## Available Tools

### About Tools
- Get storage quota information
- Get user information
- Get supported export formats

### Access Proposal Tools
- List access proposals
- Resolve access proposals

### App Tools
- List connected apps
- Get app details

### Change Tools
- List file changes
- Get change start page token
- Watch for changes

### Comment Tools
- List comments
- Create comments
- Update comments
- Delete comments
- Reply to comments

### Drive Tools
- List shared drives
- Create shared drives
- Update drive properties
- Delete drives
- Hide/unhide drives

### File Tools
- List files with search
- Get file metadata
- Create files
- Update files
- Copy files
- Delete files
- Download files
- Export Google Docs formats
- Empty trash

### Folder Tools
- Create folders
- List folder contents
- Move items to folders

### Permission Tools
- List permissions
- Create permissions
- Update permissions
- Delete permissions
- Transfer ownership

### Revision Tools
- List file revisions
- Get revision details
- Update revision properties
- Delete revisions

## Development

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Build for production
npm run build

# Run tests
npm test

# Type checking
npm run typecheck

# Linting
npm run lint
```

## Related Resources

- [Primrose SDK Documentation](https://primrose.dev/docs)
- [Google Drive API Documentation](https://developers.google.com/drive/api)
- [Google Drive API Reference](https://developers.google.com/drive/api/reference/rest/v3)
- [Model Context Protocol](https://modelcontextprotocol.io)

## License

MIT
