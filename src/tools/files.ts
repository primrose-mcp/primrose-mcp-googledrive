/**
 * File Tools
 *
 * MCP tools for Google Drive file management.
 */

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { GoogleDriveClient } from '../client.js';
import { formatError, formatResponse } from '../utils/formatters.js';

/**
 * Register all file-related tools
 */
export function registerFileTools(server: McpServer, client: GoogleDriveClient): void {
  // ===========================================================================
  // List Files
  // ===========================================================================
  server.tool(
    'googledrive_list_files',
    `List files in Google Drive with optional filtering.

Args:
  - query: Search query (Google Drive query format, e.g., "name contains 'report'" or "mimeType='application/pdf'")
  - pageSize: Number of files to return (1-1000, default: 100)
  - pageToken: Token for pagination
  - orderBy: Sort order (e.g., "modifiedTime desc", "name")
  - spaces: Comma-separated list of spaces to query (drive, appDataFolder)
  - includeSharedDrives: Whether to include shared drive items

Returns paginated list of files with metadata.`,
    {
      query: z.string().optional().describe('Search query in Google Drive query format'),
      pageSize: z.number().int().min(1).max(1000).default(100).describe('Number of files'),
      pageToken: z.string().optional().describe('Pagination token'),
      orderBy: z.string().optional().describe('Sort order (e.g., "modifiedTime desc")'),
      spaces: z.string().optional().describe('Spaces to query (drive, appDataFolder)'),
      includeSharedDrives: z.boolean().default(true).describe('Include shared drive items'),
    },
    async ({ query, pageSize, pageToken, orderBy, spaces, includeSharedDrives }) => {
      try {
        const result = await client.listFiles({
          q: query,
          pageSize,
          pageToken,
          orderBy,
          spaces,
          includeItemsFromAllDrives: includeSharedDrives,
          supportsAllDrives: includeSharedDrives,
        });
        return formatResponse(result, 'json', 'files');
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Get File
  // ===========================================================================
  server.tool(
    'googledrive_get_file',
    `Get metadata for a specific file.

Args:
  - fileId: The ID of the file
  - fields: Comma-separated list of fields to return (optional)

Returns detailed file metadata.`,
    {
      fileId: z.string().describe('File ID'),
      fields: z.string().optional().describe('Fields to return'),
    },
    async ({ fileId, fields }) => {
      try {
        const file = await client.getFile(fileId, fields);
        return formatResponse(file, 'json', 'file');
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Create File
  // ===========================================================================
  server.tool(
    'googledrive_create_file',
    `Create a new file in Google Drive.

Args:
  - name: Name of the file
  - mimeType: MIME type (e.g., "text/plain", "application/json")
  - parentId: ID of parent folder (optional, defaults to root)
  - description: File description (optional)
  - content: File content as text (optional)

Returns the created file metadata.`,
    {
      name: z.string().describe('File name'),
      mimeType: z.string().optional().describe('MIME type'),
      parentId: z.string().optional().describe('Parent folder ID'),
      description: z.string().optional().describe('File description'),
      content: z.string().optional().describe('File content (text)'),
    },
    async ({ name, mimeType, parentId, description, content }) => {
      try {
        const file = await client.createFile({
          name,
          mimeType,
          parents: parentId ? [parentId] : undefined,
          description,
          content,
        });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ success: true, message: 'File created', file }, null, 2),
            },
          ],
        };
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Update File
  // ===========================================================================
  server.tool(
    'googledrive_update_file',
    `Update a file's metadata or content.

Args:
  - fileId: ID of the file to update
  - name: New name (optional)
  - description: New description (optional)
  - content: New content (optional)
  - addParents: Parent folder IDs to add (comma-separated)
  - removeParents: Parent folder IDs to remove (comma-separated)
  - starred: Whether the file is starred
  - trashed: Whether to move to trash

Returns the updated file metadata.`,
    {
      fileId: z.string().describe('File ID'),
      name: z.string().optional().describe('New name'),
      description: z.string().optional().describe('New description'),
      content: z.string().optional().describe('New content'),
      addParents: z.string().optional().describe('Parent IDs to add'),
      removeParents: z.string().optional().describe('Parent IDs to remove'),
      starred: z.boolean().optional().describe('Starred status'),
      trashed: z.boolean().optional().describe('Move to trash'),
    },
    async ({ fileId, name, description, content, addParents, removeParents, starred, trashed }) => {
      try {
        const file = await client.updateFile(fileId, {
          name,
          description,
          content,
          addParents,
          removeParents,
          starred,
          trashed,
        });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ success: true, message: 'File updated', file }, null, 2),
            },
          ],
        };
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Copy File
  // ===========================================================================
  server.tool(
    'googledrive_copy_file',
    `Create a copy of a file.

Args:
  - fileId: ID of the file to copy
  - name: Name for the copy (optional)
  - parentId: Parent folder ID for the copy (optional)
  - description: Description for the copy (optional)

Returns the copied file metadata.`,
    {
      fileId: z.string().describe('File ID to copy'),
      name: z.string().optional().describe('Name for the copy'),
      parentId: z.string().optional().describe('Parent folder ID'),
      description: z.string().optional().describe('Description'),
    },
    async ({ fileId, name, parentId, description }) => {
      try {
        const file = await client.copyFile(fileId, {
          name,
          parents: parentId ? [parentId] : undefined,
          description,
        });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ success: true, message: 'File copied', file }, null, 2),
            },
          ],
        };
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Delete File
  // ===========================================================================
  server.tool(
    'googledrive_delete_file',
    `Permanently delete a file (bypasses trash).

Args:
  - fileId: ID of the file to delete

Returns confirmation of deletion.`,
    {
      fileId: z.string().describe('File ID to delete'),
    },
    async ({ fileId }) => {
      try {
        await client.deleteFile(fileId);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ success: true, message: `File ${fileId} deleted` }, null, 2),
            },
          ],
        };
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Empty Trash
  // ===========================================================================
  server.tool(
    'googledrive_empty_trash',
    `Permanently delete all files in the trash.

Returns confirmation of trash emptied.`,
    {},
    async () => {
      try {
        await client.emptyTrash();
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ success: true, message: 'Trash emptied' }, null, 2),
            },
          ],
        };
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Export File
  // ===========================================================================
  server.tool(
    'googledrive_export_file',
    `Export a Google Workspace document to a different format.

Args:
  - fileId: ID of the Google Workspace file
  - mimeType: Target MIME type (e.g., "application/pdf", "text/plain", "text/html")

Common export formats:
  - Google Docs: application/pdf, text/plain, text/html, application/rtf, application/vnd.oasis.opendocument.text, application/vnd.openxmlformats-officedocument.wordprocessingml.document
  - Google Sheets: application/pdf, text/csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
  - Google Slides: application/pdf, application/vnd.openxmlformats-officedocument.presentationml.presentation

Returns the exported content.`,
    {
      fileId: z.string().describe('File ID to export'),
      mimeType: z.string().describe('Target MIME type'),
    },
    async ({ fileId, mimeType }) => {
      try {
        const content = await client.exportFile(fileId, mimeType);
        return {
          content: [
            {
              type: 'text',
              text: content,
            },
          ],
        };
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Download File
  // ===========================================================================
  server.tool(
    'googledrive_download_file',
    `Download a file's content.

Args:
  - fileId: ID of the file to download

Note: For Google Workspace files (Docs, Sheets, Slides), use googledrive_export_file instead.

Returns the file content.`,
    {
      fileId: z.string().describe('File ID to download'),
    },
    async ({ fileId }) => {
      try {
        const content = await client.downloadFile(fileId);
        return {
          content: [
            {
              type: 'text',
              text: content,
            },
          ],
        };
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Generate IDs
  // ===========================================================================
  server.tool(
    'googledrive_generate_ids',
    `Generate file IDs for use with create requests.

Args:
  - count: Number of IDs to generate (1-1000, default: 10)
  - space: Space for the IDs (drive or appDataFolder)

Returns array of generated IDs.`,
    {
      count: z.number().int().min(1).max(1000).default(10).describe('Number of IDs'),
      space: z.enum(['drive', 'appDataFolder']).default('drive').describe('Space'),
    },
    async ({ count, space }) => {
      try {
        const ids = await client.generateIds(count, space);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ ids }, null, 2),
            },
          ],
        };
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Search Files
  // ===========================================================================
  server.tool(
    'googledrive_search_files',
    `Search for files with advanced query options.

Common query examples:
  - name contains 'report': Files with "report" in the name
  - mimeType = 'application/pdf': PDF files only
  - 'folderId' in parents: Files in a specific folder
  - trashed = true: Files in trash
  - starred = true: Starred files
  - sharedWithMe = true: Files shared with you
  - modifiedTime > '2024-01-01': Modified after date
  - fullText contains 'keyword': Full text search

Combine with 'and', 'or', 'not'.

Args:
  - query: Search query
  - pageSize: Results per page (default: 100)
  - pageToken: Pagination token

Returns matching files.`,
    {
      query: z.string().describe('Search query'),
      pageSize: z.number().int().min(1).max(1000).default(100).describe('Results per page'),
      pageToken: z.string().optional().describe('Pagination token'),
    },
    async ({ query, pageSize, pageToken }) => {
      try {
        const result = await client.listFiles({
          q: query,
          pageSize,
          pageToken,
          includeItemsFromAllDrives: true,
          supportsAllDrives: true,
        });
        return formatResponse(result, 'json', 'files');
      } catch (error) {
        return formatError(error);
      }
    }
  );
}
