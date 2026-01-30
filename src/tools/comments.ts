/**
 * Comment Tools
 *
 * MCP tools for Google Drive comment management.
 */

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { GoogleDriveClient } from '../client.js';
import { formatError, formatResponse } from '../utils/formatters.js';

/**
 * Register all comment-related tools
 */
export function registerCommentTools(server: McpServer, client: GoogleDriveClient): void {
  // ===========================================================================
  // List Comments
  // ===========================================================================
  server.tool(
    'googledrive_list_comments',
    `List all comments on a file.

Args:
  - fileId: ID of the file
  - pageSize: Number of comments to return (default: 100)
  - pageToken: Token for pagination
  - includeDeleted: Include deleted comments
  - startModifiedTime: Filter by modification time (RFC 3339)

Returns paginated list of comments.`,
    {
      fileId: z.string().describe('File ID'),
      pageSize: z.number().int().min(1).max(100).default(100).describe('Results per page'),
      pageToken: z.string().optional().describe('Pagination token'),
      includeDeleted: z.boolean().default(false).describe('Include deleted comments'),
      startModifiedTime: z.string().optional().describe('Filter by modification time'),
    },
    async ({ fileId, pageSize, pageToken, includeDeleted, startModifiedTime }) => {
      try {
        const result = await client.listComments(fileId, {
          pageSize,
          pageToken,
          includeDeleted,
          startModifiedTime,
        });
        return formatResponse(result, 'json', 'comments');
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Get Comment
  // ===========================================================================
  server.tool(
    'googledrive_get_comment',
    `Get a specific comment by ID.

Args:
  - fileId: ID of the file
  - commentId: ID of the comment
  - includeDeleted: Include if deleted

Returns comment details.`,
    {
      fileId: z.string().describe('File ID'),
      commentId: z.string().describe('Comment ID'),
      includeDeleted: z.boolean().default(false).describe('Include if deleted'),
    },
    async ({ fileId, commentId, includeDeleted }) => {
      try {
        const comment = await client.getComment(fileId, commentId, includeDeleted);
        return formatResponse(comment, 'json', 'comment');
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Create Comment
  // ===========================================================================
  server.tool(
    'googledrive_create_comment',
    `Add a comment to a file.

Args:
  - fileId: ID of the file
  - content: Comment text
  - anchor: JSON anchor for specific location (optional, advanced)

Returns the created comment.`,
    {
      fileId: z.string().describe('File ID'),
      content: z.string().describe('Comment text'),
      anchor: z.string().optional().describe('Location anchor (JSON)'),
    },
    async ({ fileId, content, anchor }) => {
      try {
        const comment = await client.createComment(fileId, { content, anchor });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ success: true, message: 'Comment created', comment }, null, 2),
            },
          ],
        };
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Update Comment
  // ===========================================================================
  server.tool(
    'googledrive_update_comment',
    `Update an existing comment.

Args:
  - fileId: ID of the file
  - commentId: ID of the comment
  - content: New comment text

Returns the updated comment.`,
    {
      fileId: z.string().describe('File ID'),
      commentId: z.string().describe('Comment ID'),
      content: z.string().describe('New comment text'),
    },
    async ({ fileId, commentId, content }) => {
      try {
        const comment = await client.updateComment(fileId, commentId, content);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ success: true, message: 'Comment updated', comment }, null, 2),
            },
          ],
        };
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Delete Comment
  // ===========================================================================
  server.tool(
    'googledrive_delete_comment',
    `Delete a comment.

Args:
  - fileId: ID of the file
  - commentId: ID of the comment to delete

Returns confirmation of deletion.`,
    {
      fileId: z.string().describe('File ID'),
      commentId: z.string().describe('Comment ID'),
    },
    async ({ fileId, commentId }) => {
      try {
        await client.deleteComment(fileId, commentId);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ success: true, message: 'Comment deleted' }, null, 2),
            },
          ],
        };
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // List Replies
  // ===========================================================================
  server.tool(
    'googledrive_list_replies',
    `List all replies to a comment.

Args:
  - fileId: ID of the file
  - commentId: ID of the comment
  - pageSize: Number of replies to return (default: 100)
  - pageToken: Token for pagination
  - includeDeleted: Include deleted replies

Returns paginated list of replies.`,
    {
      fileId: z.string().describe('File ID'),
      commentId: z.string().describe('Comment ID'),
      pageSize: z.number().int().min(1).max(100).default(100).describe('Results per page'),
      pageToken: z.string().optional().describe('Pagination token'),
      includeDeleted: z.boolean().default(false).describe('Include deleted replies'),
    },
    async ({ fileId, commentId, pageSize, pageToken, includeDeleted }) => {
      try {
        const result = await client.listReplies(fileId, commentId, {
          pageSize,
          pageToken,
          includeDeleted,
        });
        return formatResponse(result, 'json', 'replies');
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Get Reply
  // ===========================================================================
  server.tool(
    'googledrive_get_reply',
    `Get a specific reply by ID.

Args:
  - fileId: ID of the file
  - commentId: ID of the comment
  - replyId: ID of the reply
  - includeDeleted: Include if deleted

Returns reply details.`,
    {
      fileId: z.string().describe('File ID'),
      commentId: z.string().describe('Comment ID'),
      replyId: z.string().describe('Reply ID'),
      includeDeleted: z.boolean().default(false).describe('Include if deleted'),
    },
    async ({ fileId, commentId, replyId, includeDeleted }) => {
      try {
        const reply = await client.getReply(fileId, commentId, replyId, includeDeleted);
        return formatResponse(reply, 'json', 'reply');
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Create Reply
  // ===========================================================================
  server.tool(
    'googledrive_create_reply',
    `Add a reply to a comment.

Args:
  - fileId: ID of the file
  - commentId: ID of the comment
  - content: Reply text
  - action: Optional action (resolve or reopen)

Returns the created reply.`,
    {
      fileId: z.string().describe('File ID'),
      commentId: z.string().describe('Comment ID'),
      content: z.string().describe('Reply text'),
      action: z.enum(['resolve', 'reopen']).optional().describe('Action to perform'),
    },
    async ({ fileId, commentId, content, action }) => {
      try {
        const reply = await client.createReply(fileId, commentId, { content, action });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ success: true, message: 'Reply created', reply }, null, 2),
            },
          ],
        };
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Update Reply
  // ===========================================================================
  server.tool(
    'googledrive_update_reply',
    `Update an existing reply.

Args:
  - fileId: ID of the file
  - commentId: ID of the comment
  - replyId: ID of the reply
  - content: New reply text

Returns the updated reply.`,
    {
      fileId: z.string().describe('File ID'),
      commentId: z.string().describe('Comment ID'),
      replyId: z.string().describe('Reply ID'),
      content: z.string().describe('New reply text'),
    },
    async ({ fileId, commentId, replyId, content }) => {
      try {
        const reply = await client.updateReply(fileId, commentId, replyId, content);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ success: true, message: 'Reply updated', reply }, null, 2),
            },
          ],
        };
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Delete Reply
  // ===========================================================================
  server.tool(
    'googledrive_delete_reply',
    `Delete a reply.

Args:
  - fileId: ID of the file
  - commentId: ID of the comment
  - replyId: ID of the reply to delete

Returns confirmation of deletion.`,
    {
      fileId: z.string().describe('File ID'),
      commentId: z.string().describe('Comment ID'),
      replyId: z.string().describe('Reply ID'),
    },
    async ({ fileId, commentId, replyId }) => {
      try {
        await client.deleteReply(fileId, commentId, replyId);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ success: true, message: 'Reply deleted' }, null, 2),
            },
          ],
        };
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Resolve Comment
  // ===========================================================================
  server.tool(
    'googledrive_resolve_comment',
    `Resolve a comment by adding a reply with resolve action.

Args:
  - fileId: ID of the file
  - commentId: ID of the comment to resolve
  - content: Optional resolution message

Returns the created reply.`,
    {
      fileId: z.string().describe('File ID'),
      commentId: z.string().describe('Comment ID'),
      content: z.string().default('Resolved').describe('Resolution message'),
    },
    async ({ fileId, commentId, content }) => {
      try {
        const reply = await client.createReply(fileId, commentId, {
          content,
          action: 'resolve',
        });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ success: true, message: 'Comment resolved', reply }, null, 2),
            },
          ],
        };
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Reopen Comment
  // ===========================================================================
  server.tool(
    'googledrive_reopen_comment',
    `Reopen a resolved comment by adding a reply with reopen action.

Args:
  - fileId: ID of the file
  - commentId: ID of the comment to reopen
  - content: Optional reopen message

Returns the created reply.`,
    {
      fileId: z.string().describe('File ID'),
      commentId: z.string().describe('Comment ID'),
      content: z.string().default('Reopened').describe('Reopen message'),
    },
    async ({ fileId, commentId, content }) => {
      try {
        const reply = await client.createReply(fileId, commentId, {
          content,
          action: 'reopen',
        });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ success: true, message: 'Comment reopened', reply }, null, 2),
            },
          ],
        };
      } catch (error) {
        return formatError(error);
      }
    }
  );
}
