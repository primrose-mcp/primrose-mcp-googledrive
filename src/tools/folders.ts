/**
 * Folder Tools
 *
 * MCP tools for Google Drive folder management.
 */

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { GoogleDriveClient } from '../client.js';
import { formatError, formatResponse } from '../utils/formatters.js';

/**
 * Register all folder-related tools
 */
export function registerFolderTools(server: McpServer, client: GoogleDriveClient): void {
  // ===========================================================================
  // Create Folder
  // ===========================================================================
  server.tool(
    'googledrive_create_folder',
    `Create a new folder in Google Drive.

Args:
  - name: Name of the folder
  - parentId: ID of parent folder (optional, defaults to root)

Returns the created folder metadata.`,
    {
      name: z.string().describe('Folder name'),
      parentId: z.string().optional().describe('Parent folder ID'),
    },
    async ({ name, parentId }) => {
      try {
        const folder = await client.createFolder(name, parentId ? [parentId] : undefined);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ success: true, message: 'Folder created', folder }, null, 2),
            },
          ],
        };
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // List Folder Contents
  // ===========================================================================
  server.tool(
    'googledrive_list_folder',
    `List the contents of a folder.

Args:
  - folderId: ID of the folder (use 'root' for root folder)
  - pageSize: Number of items to return (1-1000, default: 100)
  - pageToken: Token for pagination
  - orderBy: Sort order (e.g., "name", "modifiedTime desc")

Returns paginated list of files and folders.`,
    {
      folderId: z.string().describe('Folder ID (use "root" for root folder)'),
      pageSize: z.number().int().min(1).max(1000).default(100).describe('Number of items'),
      pageToken: z.string().optional().describe('Pagination token'),
      orderBy: z.string().optional().describe('Sort order'),
    },
    async ({ folderId, pageSize, pageToken, orderBy }) => {
      try {
        const result = await client.listFolderContents(folderId, {
          pageSize,
          pageToken,
          orderBy,
        });
        return formatResponse(result, 'json', 'files');
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Move to Folder
  // ===========================================================================
  server.tool(
    'googledrive_move_file',
    `Move a file to a different folder.

Args:
  - fileId: ID of the file to move
  - newParentId: ID of the destination folder
  - removeFromCurrentParent: Whether to remove from current parent (default: true)

Returns the updated file metadata.`,
    {
      fileId: z.string().describe('File ID to move'),
      newParentId: z.string().describe('Destination folder ID'),
      removeFromCurrentParent: z.boolean().default(true).describe('Remove from current parent'),
    },
    async ({ fileId, newParentId, removeFromCurrentParent }) => {
      try {
        // First get the file to find current parents
        const currentFile = await client.getFile(fileId);
        const currentParents = currentFile.parents?.join(',');

        const file = await client.updateFile(fileId, {
          addParents: newParentId,
          removeParents: removeFromCurrentParent ? currentParents : undefined,
        });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ success: true, message: 'File moved', file }, null, 2),
            },
          ],
        };
      } catch (error) {
        return formatError(error);
      }
    }
  );
}
