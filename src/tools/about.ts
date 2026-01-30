/**
 * About Tools
 *
 * MCP tools for Google Drive user and account info.
 */

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { GoogleDriveClient } from '../client.js';
import { formatError, formatResponse } from '../utils/formatters.js';

/**
 * Register all about-related tools
 */
export function registerAboutTools(server: McpServer, client: GoogleDriveClient): void {
  // ===========================================================================
  // Get About
  // ===========================================================================
  server.tool(
    'googledrive_get_about',
    `Get information about the current user and Drive settings.

Args:
  - fields: Specific fields to return (optional, returns all by default)

Available fields:
  - user: Current user info (displayName, email, photoLink)
  - storageQuota: Storage limits and usage
  - importFormats: Supported import formats
  - exportFormats: Supported export formats
  - maxUploadSize: Maximum file upload size
  - appInstalled: Whether app is installed
  - folderColorPalette: Available folder colors
  - driveThemes: Available drive themes
  - canCreateDrives: Whether user can create shared drives

Returns user and Drive information.`,
    {
      fields: z.string().optional().describe('Fields to return (comma-separated)'),
    },
    async ({ fields }) => {
      try {
        const about = await client.getAbout(fields || '*');
        return formatResponse(about, 'json', 'about');
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Get Storage Quota
  // ===========================================================================
  server.tool(
    'googledrive_get_storage_quota',
    `Get the current storage quota and usage.

Returns storage quota details including:
  - limit: Total storage limit (in bytes)
  - usage: Current total usage
  - usageInDrive: Usage in Drive (excluding trash)
  - usageInDriveTrash: Usage in trash`,
    {},
    async () => {
      try {
        const about = await client.getAbout('storageQuota');
        const quota = about.storageQuota;

        // Format bytes to human-readable
        const formatBytes = (bytes: string | undefined): string => {
          if (!bytes) return 'Unknown';
          const b = Number.parseInt(bytes, 10);
          const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
          if (b === 0) return '0 B';
          const i = Math.floor(Math.log(b) / Math.log(1024));
          return `${(b / 1024 ** i).toFixed(2)} ${sizes[i]}`;
        };

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  storageQuota: {
                    limit: formatBytes(quota?.limit),
                    usage: formatBytes(quota?.usage),
                    usageInDrive: formatBytes(quota?.usageInDrive),
                    usageInDriveTrash: formatBytes(quota?.usageInDriveTrash),
                    percentUsed: quota?.limit && quota?.usage
                      ? `${((Number.parseInt(quota.usage, 10) / Number.parseInt(quota.limit, 10)) * 100).toFixed(2)}%`
                      : 'Unknown',
                  },
                  raw: quota,
                },
                null,
                2
              ),
            },
          ],
        };
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Get User Info
  // ===========================================================================
  server.tool(
    'googledrive_get_user_info',
    `Get information about the current authenticated user.

Returns user details including:
  - displayName: User's display name
  - emailAddress: User's email address
  - photoLink: Link to user's profile photo
  - permissionId: User's permission ID`,
    {},
    async () => {
      try {
        const about = await client.getAbout('user');
        return formatResponse(about.user, 'json', 'user');
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Get Export Formats
  // ===========================================================================
  server.tool(
    'googledrive_get_export_formats',
    `Get available export formats for Google Workspace files.

Returns a map of source MIME types to available export formats.

Useful for knowing which formats you can use with googledrive_export_file.`,
    {},
    async () => {
      try {
        const about = await client.getAbout('exportFormats');
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  exportFormats: about.exportFormats,
                  description: 'Map of Google Workspace MIME types to available export formats',
                },
                null,
                2
              ),
            },
          ],
        };
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Get Import Formats
  // ===========================================================================
  server.tool(
    'googledrive_get_import_formats',
    `Get available import formats for Google Workspace files.

Returns a map of source MIME types that can be imported to Google Workspace formats.

Useful for knowing which file types can be converted to Google Docs/Sheets/Slides.`,
    {},
    async () => {
      try {
        const about = await client.getAbout('importFormats');
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  importFormats: about.importFormats,
                  description: 'Map of MIME types to Google Workspace formats they can be converted to',
                },
                null,
                2
              ),
            },
          ],
        };
      } catch (error) {
        return formatError(error);
      }
    }
  );
}
