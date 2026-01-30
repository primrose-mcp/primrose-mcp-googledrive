/**
 * Apps Tools
 *
 * MCP tools for Google Drive apps management.
 */

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { GoogleDriveClient } from '../client.js';
import { formatError, formatResponse } from '../utils/formatters.js';

/**
 * Register all apps-related tools
 */
export function registerAppTools(server: McpServer, client: GoogleDriveClient): void {
  // ===========================================================================
  // List Apps
  // ===========================================================================
  server.tool(
    'googledrive_list_apps',
    `List all apps that the user has installed or authorized.

Args:
  - appFilterExtensions: Filter by file extension (e.g., "pdf,doc")
  - appFilterMimeTypes: Filter by MIME type (e.g., "application/pdf")
  - languageCode: Language code for app descriptions (e.g., "en")

Returns list of installed/authorized apps.`,
    {
      appFilterExtensions: z.string().optional().describe('Filter by extensions'),
      appFilterMimeTypes: z.string().optional().describe('Filter by MIME types'),
      languageCode: z.string().optional().describe('Language code'),
    },
    async ({ appFilterExtensions, appFilterMimeTypes, languageCode }) => {
      try {
        const apps = await client.listApps({
          appFilterExtensions,
          appFilterMimeTypes,
          languageCode,
        });
        return formatResponse({ items: apps, hasMore: false }, 'json', 'apps');
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Get App
  // ===========================================================================
  server.tool(
    'googledrive_get_app',
    `Get details of a specific app.

Args:
  - appId: ID of the app

Returns app details.`,
    {
      appId: z.string().describe('App ID'),
    },
    async ({ appId }) => {
      try {
        const app = await client.getApp(appId);
        return formatResponse(app, 'json', 'app');
      } catch (error) {
        return formatError(error);
      }
    }
  );
}
