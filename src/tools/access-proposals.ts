/**
 * Access Proposal Tools
 *
 * MCP tools for managing access proposals (access requests) in Google Drive.
 */

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { GoogleDriveClient } from '../client.js';
import { formatError, formatResponse } from '../utils/formatters.js';

/**
 * Register all access proposal-related tools
 */
export function registerAccessProposalTools(server: McpServer, client: GoogleDriveClient): void {
  // ===========================================================================
  // List Access Proposals
  // ===========================================================================
  server.tool(
    'googledrive_list_access_proposals',
    `List all pending access proposals (requests) for a file.

Args:
  - fileId: ID of the file
  - pageSize: Number of proposals to return (default: 100)
  - pageToken: Token for pagination

Returns list of access proposals.`,
    {
      fileId: z.string().describe('File ID'),
      pageSize: z.number().int().min(1).max(100).default(100).describe('Results per page'),
      pageToken: z.string().optional().describe('Pagination token'),
    },
    async ({ fileId, pageSize, pageToken }) => {
      try {
        const result = await client.listAccessProposals(fileId, { pageSize, pageToken });
        return formatResponse(result, 'json', 'accessProposals');
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Get Access Proposal
  // ===========================================================================
  server.tool(
    'googledrive_get_access_proposal',
    `Get details of a specific access proposal.

Args:
  - fileId: ID of the file
  - proposalId: ID of the access proposal

Returns access proposal details.`,
    {
      fileId: z.string().describe('File ID'),
      proposalId: z.string().describe('Access proposal ID'),
    },
    async ({ fileId, proposalId }) => {
      try {
        const proposal = await client.getAccessProposal(fileId, proposalId);
        return formatResponse(proposal, 'json', 'accessProposal');
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Accept Access Proposal
  // ===========================================================================
  server.tool(
    'googledrive_accept_access_proposal',
    `Accept an access proposal, granting the requested access.

Args:
  - fileId: ID of the file
  - proposalId: ID of the access proposal to accept
  - role: Role to grant (optional, defaults to requested role)
  - sendNotification: Send notification to the requester (default: true)

Returns confirmation of acceptance.`,
    {
      fileId: z.string().describe('File ID'),
      proposalId: z.string().describe('Access proposal ID'),
      role: z
        .enum(['reader', 'commenter', 'writer', 'organizer', 'fileOrganizer'])
        .optional()
        .describe('Role to grant'),
      sendNotification: z.boolean().default(true).describe('Send notification'),
    },
    async ({ fileId, proposalId, role, sendNotification }) => {
      try {
        await client.resolveAccessProposal(
          fileId,
          proposalId,
          'accept',
          role,
          undefined,
          sendNotification
        );
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                { success: true, message: 'Access proposal accepted' },
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
  // Deny Access Proposal
  // ===========================================================================
  server.tool(
    'googledrive_deny_access_proposal',
    `Deny an access proposal, rejecting the access request.

Args:
  - fileId: ID of the file
  - proposalId: ID of the access proposal to deny
  - sendNotification: Send notification to the requester (default: true)

Returns confirmation of denial.`,
    {
      fileId: z.string().describe('File ID'),
      proposalId: z.string().describe('Access proposal ID'),
      sendNotification: z.boolean().default(true).describe('Send notification'),
    },
    async ({ fileId, proposalId, sendNotification }) => {
      try {
        await client.resolveAccessProposal(
          fileId,
          proposalId,
          'deny',
          undefined,
          undefined,
          sendNotification
        );
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                { success: true, message: 'Access proposal denied' },
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
