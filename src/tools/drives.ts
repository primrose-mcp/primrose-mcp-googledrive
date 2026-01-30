/**
 * Shared Drive Tools
 *
 * MCP tools for Google Shared Drives management.
 */

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { GoogleDriveClient } from '../client.js';
import { formatError, formatResponse } from '../utils/formatters.js';

/**
 * Register all shared drive-related tools
 */
export function registerDriveTools(server: McpServer, client: GoogleDriveClient): void {
  // ===========================================================================
  // List Shared Drives
  // ===========================================================================
  server.tool(
    'googledrive_list_drives',
    `List all shared drives the user has access to.

Args:
  - pageSize: Number of drives to return (default: 100)
  - pageToken: Token for pagination
  - query: Search query for filtering drives

Returns paginated list of shared drives.`,
    {
      pageSize: z.number().int().min(1).max(100).default(100).describe('Results per page'),
      pageToken: z.string().optional().describe('Pagination token'),
      query: z.string().optional().describe('Search query'),
    },
    async ({ pageSize, pageToken, query }) => {
      try {
        const result = await client.listDrives({ pageSize, pageToken, q: query });
        return formatResponse(result, 'json', 'drives');
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Get Shared Drive
  // ===========================================================================
  server.tool(
    'googledrive_get_drive',
    `Get details of a specific shared drive.

Args:
  - driveId: ID of the shared drive

Returns shared drive details.`,
    {
      driveId: z.string().describe('Shared drive ID'),
    },
    async ({ driveId }) => {
      try {
        const drive = await client.getDrive(driveId);
        return formatResponse(drive, 'json', 'drive');
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Create Shared Drive
  // ===========================================================================
  server.tool(
    'googledrive_create_drive',
    `Create a new shared drive.

Args:
  - name: Name of the shared drive
  - requestId: Unique request ID for idempotency
  - themeId: Theme ID for the drive background (optional)

Note: Requires Google Workspace account with shared drive enabled.

Returns the created shared drive.`,
    {
      name: z.string().describe('Shared drive name'),
      requestId: z.string().describe('Unique request ID'),
      themeId: z.string().optional().describe('Theme ID'),
    },
    async ({ name, requestId, themeId }) => {
      try {
        const drive = await client.createDrive(requestId, { name, themeId });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                { success: true, message: 'Shared drive created', drive },
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
  // Update Shared Drive
  // ===========================================================================
  server.tool(
    'googledrive_update_drive',
    `Update a shared drive's properties.

Args:
  - driveId: ID of the shared drive
  - name: New name (optional)
  - colorRgb: Theme color in RGB hex format (optional)
  - themeId: Theme ID (optional)

Returns the updated shared drive.`,
    {
      driveId: z.string().describe('Shared drive ID'),
      name: z.string().optional().describe('New name'),
      colorRgb: z.string().optional().describe('Theme color (hex)'),
      themeId: z.string().optional().describe('Theme ID'),
    },
    async ({ driveId, name, colorRgb, themeId }) => {
      try {
        const drive = await client.updateDrive(driveId, { name, colorRgb, themeId });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                { success: true, message: 'Shared drive updated', drive },
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
  // Delete Shared Drive
  // ===========================================================================
  server.tool(
    'googledrive_delete_drive',
    `Permanently delete a shared drive.

Args:
  - driveId: ID of the shared drive to delete

Warning: This permanently deletes the shared drive. The drive must be empty.

Returns confirmation of deletion.`,
    {
      driveId: z.string().describe('Shared drive ID'),
    },
    async ({ driveId }) => {
      try {
        await client.deleteDrive(driveId);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ success: true, message: 'Shared drive deleted' }, null, 2),
            },
          ],
        };
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Hide Shared Drive
  // ===========================================================================
  server.tool(
    'googledrive_hide_drive',
    `Hide a shared drive from the default view.

Args:
  - driveId: ID of the shared drive to hide

Returns the updated shared drive.`,
    {
      driveId: z.string().describe('Shared drive ID'),
    },
    async ({ driveId }) => {
      try {
        const drive = await client.hideDrive(driveId);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ success: true, message: 'Shared drive hidden', drive }, null, 2),
            },
          ],
        };
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Unhide Shared Drive
  // ===========================================================================
  server.tool(
    'googledrive_unhide_drive',
    `Restore a hidden shared drive to the default view.

Args:
  - driveId: ID of the shared drive to unhide

Returns the updated shared drive.`,
    {
      driveId: z.string().describe('Shared drive ID'),
    },
    async ({ driveId }) => {
      try {
        const drive = await client.unhideDrive(driveId);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                { success: true, message: 'Shared drive unhidden', drive },
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
  // Update Shared Drive Restrictions
  // ===========================================================================
  server.tool(
    'googledrive_update_drive_restrictions',
    `Update sharing restrictions for a shared drive.

Args:
  - driveId: ID of the shared drive
  - adminManagedRestrictions: Restrict modifications to admins
  - copyRequiresWriterPermission: Restrict copying to writers only
  - domainUsersOnly: Restrict to domain users only
  - driveMembersOnly: Restrict to drive members only
  - sharingFoldersRequiresOrganizerPermission: Require organizer to share folders

Returns the updated shared drive.`,
    {
      driveId: z.string().describe('Shared drive ID'),
      adminManagedRestrictions: z.boolean().optional().describe('Admin-managed restrictions'),
      copyRequiresWriterPermission: z.boolean().optional().describe('Copy requires writer'),
      domainUsersOnly: z.boolean().optional().describe('Domain users only'),
      driveMembersOnly: z.boolean().optional().describe('Drive members only'),
      sharingFoldersRequiresOrganizerPermission: z
        .boolean()
        .optional()
        .describe('Sharing folders requires organizer'),
    },
    async ({
      driveId,
      adminManagedRestrictions,
      copyRequiresWriterPermission,
      domainUsersOnly,
      driveMembersOnly,
      sharingFoldersRequiresOrganizerPermission,
    }) => {
      try {
        const drive = await client.updateDrive(driveId, {
          restrictions: {
            adminManagedRestrictions,
            copyRequiresWriterPermission,
            domainUsersOnly,
            driveMembersOnly,
            sharingFoldersRequiresOrganizerPermission,
          },
        });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                { success: true, message: 'Drive restrictions updated', drive },
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
