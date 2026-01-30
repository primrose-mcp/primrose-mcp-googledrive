/**
 * Permission Tools
 *
 * MCP tools for Google Drive permission (sharing) management.
 */

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { GoogleDriveClient } from '../client.js';
import { formatError, formatResponse } from '../utils/formatters.js';

/**
 * Register all permission-related tools
 */
export function registerPermissionTools(server: McpServer, client: GoogleDriveClient): void {
  // ===========================================================================
  // List Permissions
  // ===========================================================================
  server.tool(
    'googledrive_list_permissions',
    `List all permissions (sharing settings) for a file or folder.

Args:
  - fileId: ID of the file or folder
  - pageSize: Number of permissions to return (default: 100)
  - pageToken: Token for pagination

Returns list of permissions with details.`,
    {
      fileId: z.string().describe('File or folder ID'),
      pageSize: z.number().int().min(1).max(100).default(100).describe('Results per page'),
      pageToken: z.string().optional().describe('Pagination token'),
    },
    async ({ fileId, pageSize, pageToken }) => {
      try {
        const result = await client.listPermissions(fileId, { pageSize, pageToken });
        return formatResponse(result, 'json', 'permissions');
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Get Permission
  // ===========================================================================
  server.tool(
    'googledrive_get_permission',
    `Get details of a specific permission.

Args:
  - fileId: ID of the file or folder
  - permissionId: ID of the permission

Returns permission details.`,
    {
      fileId: z.string().describe('File or folder ID'),
      permissionId: z.string().describe('Permission ID'),
    },
    async ({ fileId, permissionId }) => {
      try {
        const permission = await client.getPermission(fileId, permissionId);
        return formatResponse(permission, 'json', 'permission');
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Share with User
  // ===========================================================================
  server.tool(
    'googledrive_share_with_user',
    `Share a file or folder with a specific user.

Args:
  - fileId: ID of the file or folder
  - email: Email address of the user
  - role: Permission role (reader, commenter, writer, owner)
  - sendNotification: Whether to send notification email (default: true)
  - emailMessage: Custom message for notification email
  - transferOwnership: Transfer ownership (required when role is owner)

Roles:
  - reader: Can view
  - commenter: Can view and comment
  - writer: Can view, comment, and edit
  - owner: Full ownership (use with transferOwnership)

Returns the created permission.`,
    {
      fileId: z.string().describe('File or folder ID'),
      email: z.string().email().describe('User email address'),
      role: z
        .enum(['reader', 'commenter', 'writer', 'owner'])
        .describe('Permission role'),
      sendNotification: z.boolean().default(true).describe('Send notification'),
      emailMessage: z.string().optional().describe('Custom email message'),
      transferOwnership: z.boolean().optional().describe('Transfer ownership'),
    },
    async ({ fileId, email, role, sendNotification, emailMessage, transferOwnership }) => {
      try {
        const permission = await client.createPermission(fileId, {
          type: 'user',
          role,
          emailAddress: email,
          sendNotificationEmail: sendNotification,
          emailMessage,
          transferOwnership,
        });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                { success: true, message: `Shared with ${email}`, permission },
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
  // Share with Group
  // ===========================================================================
  server.tool(
    'googledrive_share_with_group',
    `Share a file or folder with a Google Group.

Args:
  - fileId: ID of the file or folder
  - email: Email address of the Google Group
  - role: Permission role (reader, commenter, writer, organizer, fileOrganizer)
  - sendNotification: Whether to send notification email

Returns the created permission.`,
    {
      fileId: z.string().describe('File or folder ID'),
      email: z.string().email().describe('Group email address'),
      role: z
        .enum(['reader', 'commenter', 'writer', 'organizer', 'fileOrganizer'])
        .describe('Permission role'),
      sendNotification: z.boolean().default(true).describe('Send notification'),
    },
    async ({ fileId, email, role, sendNotification }) => {
      try {
        const permission = await client.createPermission(fileId, {
          type: 'group',
          role,
          emailAddress: email,
          sendNotificationEmail: sendNotification,
        });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                { success: true, message: `Shared with group ${email}`, permission },
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
  // Share with Domain
  // ===========================================================================
  server.tool(
    'googledrive_share_with_domain',
    `Share a file or folder with an entire domain.

Args:
  - fileId: ID of the file or folder
  - domain: Domain name (e.g., "example.com")
  - role: Permission role (reader, commenter, writer)
  - allowFileDiscovery: Whether file can be discovered via search

Returns the created permission.`,
    {
      fileId: z.string().describe('File or folder ID'),
      domain: z.string().describe('Domain name'),
      role: z.enum(['reader', 'commenter', 'writer']).describe('Permission role'),
      allowFileDiscovery: z.boolean().default(false).describe('Allow file discovery'),
    },
    async ({ fileId, domain, role, allowFileDiscovery }) => {
      try {
        const permission = await client.createPermission(fileId, {
          type: 'domain',
          role,
          domain,
          allowFileDiscovery,
        });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                { success: true, message: `Shared with domain ${domain}`, permission },
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
  // Make Public
  // ===========================================================================
  server.tool(
    'googledrive_make_public',
    `Make a file or folder publicly accessible to anyone.

Args:
  - fileId: ID of the file or folder
  - role: Permission role (reader, commenter, writer)
  - allowFileDiscovery: Whether file can be found via search engines

Warning: This makes the file accessible to anyone with the link.

Returns the created permission.`,
    {
      fileId: z.string().describe('File or folder ID'),
      role: z.enum(['reader', 'commenter', 'writer']).default('reader').describe('Permission role'),
      allowFileDiscovery: z.boolean().default(false).describe('Allow search engine indexing'),
    },
    async ({ fileId, role, allowFileDiscovery }) => {
      try {
        const permission = await client.createPermission(fileId, {
          type: 'anyone',
          role,
          allowFileDiscovery,
        });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                { success: true, message: 'File is now publicly accessible', permission },
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
  // Update Permission
  // ===========================================================================
  server.tool(
    'googledrive_update_permission',
    `Update an existing permission (change role or expiration).

Args:
  - fileId: ID of the file or folder
  - permissionId: ID of the permission to update
  - role: New role
  - expirationTime: Expiration date (RFC 3339 format, e.g., "2024-12-31T23:59:59Z")

Returns the updated permission.`,
    {
      fileId: z.string().describe('File or folder ID'),
      permissionId: z.string().describe('Permission ID'),
      role: z
        .enum(['reader', 'commenter', 'writer', 'organizer', 'fileOrganizer', 'owner'])
        .describe('New role'),
      expirationTime: z.string().optional().describe('Expiration date (RFC 3339)'),
    },
    async ({ fileId, permissionId, role, expirationTime }) => {
      try {
        const permission = await client.updatePermission(fileId, permissionId, {
          role,
          expirationTime,
        });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                { success: true, message: 'Permission updated', permission },
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
  // Remove Permission
  // ===========================================================================
  server.tool(
    'googledrive_remove_permission',
    `Remove a permission (revoke sharing).

Args:
  - fileId: ID of the file or folder
  - permissionId: ID of the permission to remove

Returns confirmation of removal.`,
    {
      fileId: z.string().describe('File or folder ID'),
      permissionId: z.string().describe('Permission ID'),
    },
    async ({ fileId, permissionId }) => {
      try {
        await client.deletePermission(fileId, permissionId);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                { success: true, message: 'Permission removed' },
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
