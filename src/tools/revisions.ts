/**
 * Revision Tools
 *
 * MCP tools for Google Drive revision (version history) management.
 */

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { GoogleDriveClient } from '../client.js';
import { formatError, formatResponse } from '../utils/formatters.js';

/**
 * Register all revision-related tools
 */
export function registerRevisionTools(server: McpServer, client: GoogleDriveClient): void {
  // ===========================================================================
  // List Revisions
  // ===========================================================================
  server.tool(
    'googledrive_list_revisions',
    `List all revisions (version history) of a file.

Args:
  - fileId: ID of the file
  - pageSize: Number of revisions to return (default: 100)
  - pageToken: Token for pagination

Returns paginated list of revisions.`,
    {
      fileId: z.string().describe('File ID'),
      pageSize: z.number().int().min(1).max(1000).default(100).describe('Results per page'),
      pageToken: z.string().optional().describe('Pagination token'),
    },
    async ({ fileId, pageSize, pageToken }) => {
      try {
        const result = await client.listRevisions(fileId, { pageSize, pageToken });
        return formatResponse(result, 'json', 'revisions');
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Get Revision
  // ===========================================================================
  server.tool(
    'googledrive_get_revision',
    `Get details of a specific revision.

Args:
  - fileId: ID of the file
  - revisionId: ID of the revision

Returns revision details.`,
    {
      fileId: z.string().describe('File ID'),
      revisionId: z.string().describe('Revision ID'),
    },
    async ({ fileId, revisionId }) => {
      try {
        const revision = await client.getRevision(fileId, revisionId);
        return formatResponse(revision, 'json', 'revision');
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Update Revision
  // ===========================================================================
  server.tool(
    'googledrive_update_revision',
    `Update revision properties (e.g., keep forever).

Args:
  - fileId: ID of the file
  - revisionId: ID of the revision
  - keepForever: Whether to keep this revision permanently
  - published: Whether this revision is published
  - publishAuto: Whether to auto-publish future revisions
  - publishedOutsideDomain: Whether published outside domain

Returns the updated revision.`,
    {
      fileId: z.string().describe('File ID'),
      revisionId: z.string().describe('Revision ID'),
      keepForever: z.boolean().optional().describe('Keep this revision permanently'),
      published: z.boolean().optional().describe('Publish this revision'),
      publishAuto: z.boolean().optional().describe('Auto-publish future revisions'),
      publishedOutsideDomain: z.boolean().optional().describe('Publish outside domain'),
    },
    async ({ fileId, revisionId, keepForever, published, publishAuto, publishedOutsideDomain }) => {
      try {
        const revision = await client.updateRevision(fileId, revisionId, {
          keepForever,
          published,
          publishAuto,
          publishedOutsideDomain,
        });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                { success: true, message: 'Revision updated', revision },
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
  // Delete Revision
  // ===========================================================================
  server.tool(
    'googledrive_delete_revision',
    `Delete a revision (cannot delete the current/head revision).

Args:
  - fileId: ID of the file
  - revisionId: ID of the revision to delete

Note: Cannot delete the most recent revision.

Returns confirmation of deletion.`,
    {
      fileId: z.string().describe('File ID'),
      revisionId: z.string().describe('Revision ID'),
    },
    async ({ fileId, revisionId }) => {
      try {
        await client.deleteRevision(fileId, revisionId);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ success: true, message: 'Revision deleted' }, null, 2),
            },
          ],
        };
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Keep Revision Forever
  // ===========================================================================
  server.tool(
    'googledrive_keep_revision',
    `Mark a revision to be kept forever (won't be auto-deleted).

Args:
  - fileId: ID of the file
  - revisionId: ID of the revision

Returns the updated revision.`,
    {
      fileId: z.string().describe('File ID'),
      revisionId: z.string().describe('Revision ID'),
    },
    async ({ fileId, revisionId }) => {
      try {
        const revision = await client.updateRevision(fileId, revisionId, {
          keepForever: true,
        });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                { success: true, message: 'Revision marked to keep forever', revision },
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
