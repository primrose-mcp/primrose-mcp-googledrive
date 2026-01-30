/**
 * Changes Tools
 *
 * MCP tools for tracking changes in Google Drive.
 */

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { GoogleDriveClient } from '../client.js';
import { formatError } from '../utils/formatters.js';

/**
 * Register all change-related tools
 */
export function registerChangeTools(server: McpServer, client: GoogleDriveClient): void {
  // ===========================================================================
  // Get Start Page Token
  // ===========================================================================
  server.tool(
    'googledrive_get_changes_start_token',
    `Get a starting page token for tracking future changes.

Use this to get the initial token, then use googledrive_list_changes to track changes from that point.

Args:
  - driveId: ID of shared drive to track (optional)

Returns a page token to use with googledrive_list_changes.`,
    {
      driveId: z.string().optional().describe('Shared drive ID (optional)'),
    },
    async ({ driveId }) => {
      try {
        const token = await client.getStartPageToken({
          driveId,
          supportsAllDrives: true,
        });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  startPageToken: token,
                  message: 'Use this token with googledrive_list_changes to track future changes',
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
  // List Changes
  // ===========================================================================
  server.tool(
    'googledrive_list_changes',
    `List changes since a specific page token.

Use googledrive_get_changes_start_token to get the initial token.

Args:
  - pageToken: Page token from previous call or start token
  - pageSize: Number of changes to return (default: 100)
  - driveId: ID of shared drive to track (optional)
  - includeRemoved: Include removed files (default: true)
  - restrictToMyDrive: Only track My Drive changes

Returns list of changes and a new page token for the next call.`,
    {
      pageToken: z.string().describe('Page token'),
      pageSize: z.number().int().min(1).max(1000).default(100).describe('Results per page'),
      driveId: z.string().optional().describe('Shared drive ID'),
      includeRemoved: z.boolean().default(true).describe('Include removed files'),
      restrictToMyDrive: z.boolean().default(false).describe('Only My Drive changes'),
    },
    async ({ pageToken, pageSize, driveId, includeRemoved, restrictToMyDrive }) => {
      try {
        const result = await client.listChanges(pageToken, {
          pageSize,
          driveId,
          includeRemoved,
          restrictToMyDrive,
          includeItemsFromAllDrives: true,
          supportsAllDrives: true,
        });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  changes: result.changes,
                  newStartPageToken: result.newStartPageToken,
                  nextPageToken: result.nextPageToken,
                  hasMore: !!result.nextPageToken,
                  message: result.newStartPageToken
                    ? 'No more changes. Save newStartPageToken for future polling.'
                    : 'More changes available. Use nextPageToken to continue.',
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
  // Watch Changes
  // ===========================================================================
  server.tool(
    'googledrive_watch_changes',
    `Set up a webhook to receive change notifications.

Args:
  - pageToken: Starting page token
  - channelId: Unique ID for this watch channel (UUID recommended)
  - webhookUrl: URL to receive notifications
  - token: Optional token to include in notifications
  - expirationTime: When the watch expires (RFC 3339, max 24 hours)
  - driveId: Shared drive to watch (optional)

Returns the created channel info.`,
    {
      pageToken: z.string().describe('Starting page token'),
      channelId: z.string().describe('Unique channel ID'),
      webhookUrl: z.string().url().describe('Webhook URL'),
      token: z.string().optional().describe('Optional verification token'),
      expirationTime: z.string().optional().describe('Expiration time (RFC 3339)'),
      driveId: z.string().optional().describe('Shared drive ID'),
    },
    async ({ pageToken, channelId, webhookUrl, token, expirationTime, driveId }) => {
      try {
        const channel = await client.watchChanges(
          pageToken,
          {
            id: channelId,
            type: 'web_hook',
            address: webhookUrl,
            token,
            expiration: expirationTime,
          },
          {
            driveId,
            includeItemsFromAllDrives: true,
            supportsAllDrives: true,
          }
        );
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                { success: true, message: 'Watch channel created', channel },
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
  // Watch File
  // ===========================================================================
  server.tool(
    'googledrive_watch_file',
    `Set up a webhook to receive notifications when a specific file changes.

Args:
  - fileId: ID of the file to watch
  - channelId: Unique ID for this watch channel (UUID recommended)
  - webhookUrl: URL to receive notifications
  - token: Optional token to include in notifications
  - expirationTime: When the watch expires (RFC 3339, max 24 hours)

Returns the created channel info.`,
    {
      fileId: z.string().describe('File ID to watch'),
      channelId: z.string().describe('Unique channel ID'),
      webhookUrl: z.string().url().describe('Webhook URL'),
      token: z.string().optional().describe('Optional verification token'),
      expirationTime: z.string().optional().describe('Expiration time (RFC 3339)'),
    },
    async ({ fileId, channelId, webhookUrl, token, expirationTime }) => {
      try {
        const channel = await client.watchFile(fileId, {
          id: channelId,
          type: 'web_hook',
          address: webhookUrl,
          token,
          expiration: expirationTime,
        });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                { success: true, message: 'File watch channel created', channel },
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
  // Stop Watch Channel
  // ===========================================================================
  server.tool(
    'googledrive_stop_channel',
    `Stop receiving notifications for a watch channel.

Args:
  - channelId: ID of the channel to stop
  - resourceId: Resource ID from the channel creation response

Returns confirmation of channel stopped.`,
    {
      channelId: z.string().describe('Channel ID'),
      resourceId: z.string().describe('Resource ID'),
    },
    async ({ channelId, resourceId }) => {
      try {
        await client.stopChannel(channelId, resourceId);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ success: true, message: 'Watch channel stopped' }, null, 2),
            },
          ],
        };
      } catch (error) {
        return formatError(error);
      }
    }
  );
}
