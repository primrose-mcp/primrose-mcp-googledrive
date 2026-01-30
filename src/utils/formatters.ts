/**
 * Response Formatting Utilities
 *
 * Helpers for formatting tool responses in JSON or Markdown.
 */

import type {
  Comment,
  Drive,
  DriveFile,
  PaginatedResponse,
  Permission,
  Reply,
  ResponseFormat,
  Revision,
} from '../types/entities.js';
import { GoogleDriveApiError, formatErrorForLogging } from './errors.js';

/**
 * MCP tool response type
 * Note: Index signature required for MCP SDK 1.25+ compatibility
 */
export interface ToolResponse {
  [key: string]: unknown;
  content: Array<{ type: 'text'; text: string }>;
  isError?: boolean;
}

/**
 * Format a successful response
 */
export function formatResponse(
  data: unknown,
  format: ResponseFormat,
  entityType: string
): ToolResponse {
  if (format === 'markdown') {
    return {
      content: [{ type: 'text', text: formatAsMarkdown(data, entityType) }],
    };
  }
  return {
    content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
  };
}

/**
 * Format an error response
 */
export function formatError(error: unknown): ToolResponse {
  const errorInfo = formatErrorForLogging(error);

  let message: string;
  if (error instanceof GoogleDriveApiError) {
    message = `Error: ${error.message}`;
    if (error.retryable) {
      message += ' (retryable)';
    }
  } else if (error instanceof Error) {
    message = `Error: ${error.message}`;
  } else {
    message = `Error: ${String(error)}`;
  }

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify({ error: message, details: errorInfo }, null, 2),
      },
    ],
    isError: true,
  };
}

/**
 * Format data as Markdown
 */
function formatAsMarkdown(data: unknown, entityType: string): string {
  if (isPaginatedResponse(data)) {
    return formatPaginatedAsMarkdown(data, entityType);
  }

  if (Array.isArray(data)) {
    return formatArrayAsMarkdown(data, entityType);
  }

  if (typeof data === 'object' && data !== null) {
    return formatObjectAsMarkdown(data as Record<string, unknown>, entityType);
  }

  return String(data);
}

/**
 * Type guard for paginated response
 */
function isPaginatedResponse(data: unknown): data is PaginatedResponse<unknown> {
  return (
    typeof data === 'object' &&
    data !== null &&
    'items' in data &&
    Array.isArray((data as PaginatedResponse<unknown>).items)
  );
}

/**
 * Format paginated response as Markdown
 */
function formatPaginatedAsMarkdown(data: PaginatedResponse<unknown>, entityType: string): string {
  const lines: string[] = [];

  lines.push(`## ${capitalize(entityType)}`);
  lines.push('');
  lines.push(`**Showing:** ${data.items.length}`);

  if (data.hasMore) {
    lines.push(`**More available:** Yes (nextPageToken: \`${data.nextPageToken}\`)`);
  }
  lines.push('');

  if (data.items.length === 0) {
    lines.push('_No items found._');
    return lines.join('\n');
  }

  // Format items based on entity type
  switch (entityType) {
    case 'files':
      lines.push(formatFilesTable(data.items as DriveFile[]));
      break;
    case 'permissions':
      lines.push(formatPermissionsTable(data.items as Permission[]));
      break;
    case 'comments':
      lines.push(formatCommentsTable(data.items as Comment[]));
      break;
    case 'replies':
      lines.push(formatRepliesTable(data.items as Reply[]));
      break;
    case 'revisions':
      lines.push(formatRevisionsTable(data.items as Revision[]));
      break;
    case 'drives':
      lines.push(formatDrivesTable(data.items as Drive[]));
      break;
    default:
      lines.push(formatGenericTable(data.items));
  }

  return lines.join('\n');
}

/**
 * Format files as Markdown table
 */
function formatFilesTable(files: DriveFile[]): string {
  const lines: string[] = [];
  lines.push('| ID | Name | Type | Size | Modified |');
  lines.push('|---|---|---|---|---|');

  for (const file of files) {
    const size = file.size ? formatBytes(Number(file.size)) : '-';
    const modified = file.modifiedTime ? formatDate(file.modifiedTime) : '-';
    const type = file.mimeType === 'application/vnd.google-apps.folder' ? '📁 Folder' : file.mimeType;
    lines.push(`| ${file.id} | ${file.name} | ${type} | ${size} | ${modified} |`);
  }

  return lines.join('\n');
}

/**
 * Format permissions as Markdown table
 */
function formatPermissionsTable(permissions: Permission[]): string {
  const lines: string[] = [];
  lines.push('| ID | Type | Role | Email/Domain |');
  lines.push('|---|---|---|---|');

  for (const permission of permissions) {
    const target = permission.emailAddress || permission.domain || '-';
    lines.push(`| ${permission.id || '-'} | ${permission.type} | ${permission.role} | ${target} |`);
  }

  return lines.join('\n');
}

/**
 * Format comments as Markdown table
 */
function formatCommentsTable(comments: Comment[]): string {
  const lines: string[] = [];
  lines.push('| ID | Content | Author | Created | Resolved |');
  lines.push('|---|---|---|---|---|');

  for (const comment of comments) {
    const author = comment.author?.displayName || '-';
    const created = comment.createdTime ? formatDate(comment.createdTime) : '-';
    const resolved = comment.resolved ? 'Yes' : 'No';
    const content = truncate(comment.content, 50);
    lines.push(`| ${comment.id || '-'} | ${content} | ${author} | ${created} | ${resolved} |`);
  }

  return lines.join('\n');
}

/**
 * Format replies as Markdown table
 */
function formatRepliesTable(replies: Reply[]): string {
  const lines: string[] = [];
  lines.push('| ID | Content | Author | Created |');
  lines.push('|---|---|---|---|');

  for (const reply of replies) {
    const author = reply.author?.displayName || '-';
    const created = reply.createdTime ? formatDate(reply.createdTime) : '-';
    const content = truncate(reply.content, 50);
    lines.push(`| ${reply.id || '-'} | ${content} | ${author} | ${created} |`);
  }

  return lines.join('\n');
}

/**
 * Format revisions as Markdown table
 */
function formatRevisionsTable(revisions: Revision[]): string {
  const lines: string[] = [];
  lines.push('| ID | Modified | Size | Keep Forever |');
  lines.push('|---|---|---|---|');

  for (const revision of revisions) {
    const modified = revision.modifiedTime ? formatDate(revision.modifiedTime) : '-';
    const size = revision.size ? formatBytes(Number(revision.size)) : '-';
    const keepForever = revision.keepForever ? 'Yes' : 'No';
    lines.push(`| ${revision.id || '-'} | ${modified} | ${size} | ${keepForever} |`);
  }

  return lines.join('\n');
}

/**
 * Format shared drives as Markdown table
 */
function formatDrivesTable(drives: Drive[]): string {
  const lines: string[] = [];
  lines.push('| ID | Name | Created | Hidden |');
  lines.push('|---|---|---|---|');

  for (const drive of drives) {
    const created = drive.createdTime ? formatDate(drive.createdTime) : '-';
    const hidden = drive.hidden ? 'Yes' : 'No';
    lines.push(`| ${drive.id || '-'} | ${drive.name} | ${created} | ${hidden} |`);
  }

  return lines.join('\n');
}

/**
 * Format a generic array as Markdown table
 */
function formatGenericTable(items: unknown[]): string {
  if (items.length === 0) return '_No items_';

  const first = items[0] as Record<string, unknown>;
  const keys = Object.keys(first).slice(0, 5); // Limit columns

  const lines: string[] = [];
  lines.push(`| ${keys.join(' | ')} |`);
  lines.push(`|${keys.map(() => '---').join('|')}|`);

  for (const item of items) {
    const record = item as Record<string, unknown>;
    const values = keys.map((k) => String(record[k] ?? '-'));
    lines.push(`| ${values.join(' | ')} |`);
  }

  return lines.join('\n');
}

/**
 * Format an array as Markdown
 */
function formatArrayAsMarkdown(data: unknown[], entityType: string): string {
  switch (entityType) {
    case 'files':
      return formatFilesTable(data as DriveFile[]);
    case 'permissions':
      return formatPermissionsTable(data as Permission[]);
    case 'comments':
      return formatCommentsTable(data as Comment[]);
    case 'replies':
      return formatRepliesTable(data as Reply[]);
    case 'revisions':
      return formatRevisionsTable(data as Revision[]);
    case 'drives':
      return formatDrivesTable(data as Drive[]);
    default:
      return formatGenericTable(data);
  }
}

/**
 * Format a single object as Markdown
 */
function formatObjectAsMarkdown(data: Record<string, unknown>, entityType: string): string {
  const lines: string[] = [];
  lines.push(`## ${capitalize(entityType.replace(/s$/, ''))}`);
  lines.push('');

  for (const [key, value] of Object.entries(data)) {
    if (value === null || value === undefined) continue;

    if (typeof value === 'object') {
      lines.push(`**${formatKey(key)}:**`);
      lines.push('```json');
      lines.push(JSON.stringify(value, null, 2));
      lines.push('```');
    } else {
      lines.push(`**${formatKey(key)}:** ${value}`);
    }
  }

  return lines.join('\n');
}

/**
 * Capitalize first letter
 */
function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Format a key for display (camelCase to Title Case)
 */
function formatKey(key: string): string {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (str) => str.toUpperCase())
    .trim();
}

/**
 * Format bytes to human-readable string
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${Number.parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
}

/**
 * Format date string
 */
function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Truncate string
 */
function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return `${str.slice(0, maxLength)}...`;
}
