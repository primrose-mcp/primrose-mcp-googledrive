/**
 * Google Drive MCP Server - Main Entry Point
 *
 * This file sets up the MCP server using Cloudflare's Agents SDK.
 * It supports both stateless (McpServer) and stateful (McpAgent) modes.
 *
 * MULTI-TENANT ARCHITECTURE:
 * Tenant credentials (OAuth tokens) are parsed from request headers,
 * allowing a single server deployment to serve multiple customers.
 *
 * Required Headers:
 * - X-Google-Access-Token: OAuth access token for Google Drive API
 *
 * Optional Headers:
 * - X-Google-Base-URL: Override the default Google Drive API base URL
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { McpAgent } from 'agents/mcp';
import { createGoogleDriveClient } from './client.js';
import {
  registerAboutTools,
  registerAccessProposalTools,
  registerAppTools,
  registerChangeTools,
  registerCommentTools,
  registerDriveTools,
  registerFileTools,
  registerFolderTools,
  registerPermissionTools,
  registerRevisionTools,
} from './tools/index.js';
import {
  type Env,
  type TenantCredentials,
  parseTenantCredentials,
  validateCredentials,
} from './types/env.js';

// =============================================================================
// MCP Server Configuration
// =============================================================================

const SERVER_NAME = 'primrose-mcp-googledrive';
const SERVER_VERSION = '1.0.0';

// =============================================================================
// MCP Agent (Stateful - uses Durable Objects)
// =============================================================================

/**
 * McpAgent provides stateful MCP sessions backed by Durable Objects.
 *
 * NOTE: For multi-tenant deployments, use the stateless mode (Option 2) instead.
 * The stateful McpAgent is better suited for single-tenant deployments where
 * credentials can be stored as wrangler secrets.
 *
 * @deprecated For multi-tenant support, use stateless mode with per-request credentials
 */
export class GoogleDriveMcpAgent extends McpAgent<Env> {
  server = new McpServer({
    name: SERVER_NAME,
    version: SERVER_VERSION,
  });

  async init() {
    throw new Error(
      'Stateful mode (McpAgent) is not supported for multi-tenant deployments. ' +
        'Use the stateless /mcp endpoint with X-Google-Access-Token header instead.'
    );
  }
}

// =============================================================================
// Stateless MCP Server (Recommended - no Durable Objects needed)
// =============================================================================

/**
 * Creates a stateless MCP server instance with tenant-specific credentials.
 *
 * MULTI-TENANT: Each request provides credentials via headers, allowing
 * a single server deployment to serve multiple tenants.
 *
 * @param credentials - Tenant credentials parsed from request headers
 */
function createStatelessServer(credentials: TenantCredentials): McpServer {
  const server = new McpServer({
    name: SERVER_NAME,
    version: SERVER_VERSION,
  });

  // Create client with tenant-specific credentials
  const client = createGoogleDriveClient(credentials);

  // Register all tools
  registerAboutTools(server, client);
  registerAccessProposalTools(server, client);
  registerAppTools(server, client);
  registerChangeTools(server, client);
  registerCommentTools(server, client);
  registerDriveTools(server, client);
  registerFileTools(server, client);
  registerFolderTools(server, client);
  registerPermissionTools(server, client);
  registerRevisionTools(server, client);

  // Test connection tool
  server.tool(
    'googledrive_test_connection',
    'Test the connection to Google Drive API',
    {},
    async () => {
      try {
        const result = await client.testConnection();
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  return server;
}

// =============================================================================
// Worker Export
// =============================================================================

export default {
  /**
   * Main fetch handler for the Worker
   */
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    // Health check endpoint
    if (url.pathname === '/health') {
      return new Response(JSON.stringify({ status: 'ok', server: SERVER_NAME }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // ==========================================================================
    // Option 1: Stateful MCP with McpAgent (requires Durable Objects)
    // ==========================================================================
    // Uncomment to use McpAgent for stateful sessions:
    //
    // if (url.pathname === '/sse' || url.pathname === '/mcp') {
    //   return GoogleDriveMcpAgent.serveSSE('/sse').fetch(request, env, ctx);
    // }

    // ==========================================================================
    // Option 2: Stateless MCP with Streamable HTTP (Recommended for multi-tenant)
    // ==========================================================================
    if (url.pathname === '/mcp' && request.method === 'POST') {
      // Parse tenant credentials from request headers
      const credentials = parseTenantCredentials(request);

      // Validate credentials are present
      try {
        validateCredentials(credentials);
      } catch (error) {
        return new Response(
          JSON.stringify({
            error: 'Unauthorized',
            message: error instanceof Error ? error.message : 'Invalid credentials',
            required_headers: ['X-Google-Access-Token'],
          }),
          {
            status: 401,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      // Create server with tenant-specific credentials
      const server = createStatelessServer(credentials);

      // Import and use createMcpHandler for streamable HTTP
      const { createMcpHandler } = await import('agents/mcp');
      const handler = createMcpHandler(server);
      return handler(request, env, ctx);
    }

    // SSE endpoint for legacy clients
    if (url.pathname === '/sse') {
      return new Response('SSE endpoint requires Durable Objects. Enable in wrangler.jsonc.', {
        status: 501,
      });
    }

    // Default response
    return new Response(
      JSON.stringify({
        name: SERVER_NAME,
        version: SERVER_VERSION,
        description: 'Google Drive MCP Server - Multi-tenant',
        endpoints: {
          mcp: '/mcp (POST) - Streamable HTTP MCP endpoint',
          health: '/health - Health check',
        },
        authentication: {
          description: 'Pass tenant credentials via request headers',
          required_headers: {
            'X-Google-Access-Token': 'OAuth access token for Google Drive API',
          },
          optional_headers: {
            'X-Google-Base-URL': 'Override the default Google Drive API base URL',
          },
        },
        tools: [
          // About
          'googledrive_test_connection',
          'googledrive_get_about',
          'googledrive_get_storage_quota',
          'googledrive_get_user_info',
          'googledrive_get_export_formats',
          'googledrive_get_import_formats',
          // Files
          'googledrive_list_files',
          'googledrive_get_file',
          'googledrive_create_file',
          'googledrive_update_file',
          'googledrive_copy_file',
          'googledrive_delete_file',
          'googledrive_empty_trash',
          'googledrive_export_file',
          'googledrive_download_file',
          'googledrive_generate_ids',
          'googledrive_search_files',
          // Folders
          'googledrive_create_folder',
          'googledrive_list_folder',
          'googledrive_move_file',
          // Permissions
          'googledrive_list_permissions',
          'googledrive_get_permission',
          'googledrive_share_with_user',
          'googledrive_share_with_group',
          'googledrive_share_with_domain',
          'googledrive_make_public',
          'googledrive_update_permission',
          'googledrive_remove_permission',
          // Comments
          'googledrive_list_comments',
          'googledrive_get_comment',
          'googledrive_create_comment',
          'googledrive_update_comment',
          'googledrive_delete_comment',
          'googledrive_resolve_comment',
          'googledrive_reopen_comment',
          // Replies
          'googledrive_list_replies',
          'googledrive_get_reply',
          'googledrive_create_reply',
          'googledrive_update_reply',
          'googledrive_delete_reply',
          // Revisions
          'googledrive_list_revisions',
          'googledrive_get_revision',
          'googledrive_update_revision',
          'googledrive_delete_revision',
          'googledrive_keep_revision',
          // Shared Drives
          'googledrive_list_drives',
          'googledrive_get_drive',
          'googledrive_create_drive',
          'googledrive_update_drive',
          'googledrive_delete_drive',
          'googledrive_hide_drive',
          'googledrive_unhide_drive',
          'googledrive_update_drive_restrictions',
          // Changes
          'googledrive_get_changes_start_token',
          'googledrive_list_changes',
          'googledrive_watch_changes',
          'googledrive_watch_file',
          'googledrive_stop_channel',
          // Apps
          'googledrive_list_apps',
          'googledrive_get_app',
          // Access Proposals
          'googledrive_list_access_proposals',
          'googledrive_get_access_proposal',
          'googledrive_accept_access_proposal',
          'googledrive_deny_access_proposal',
        ],
      }),
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );
  },
};
