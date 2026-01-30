/**
 * Google Drive API Client
 *
 * Implements the Google Drive REST API v3.
 * Reference: https://developers.google.com/drive/api/reference/rest/v3
 *
 * MULTI-TENANT: This client receives credentials per-request via TenantCredentials,
 * allowing a single server to serve multiple tenants with different OAuth tokens.
 */

import type {
  About,
  AccessProposal,
  App,
  Change,
  Channel,
  Comment,
  Drive,
  DriveFile,
  Operation,
  PaginatedResponse,
  Permission,
  Reply,
  Revision,
} from './types/entities.js';
import type { TenantCredentials } from './types/env.js';
import {
  AuthenticationError,
  ForbiddenError,
  GoogleDriveApiError,
  NotFoundError,
  RateLimitError,
} from './utils/errors.js';

// =============================================================================
// Configuration
// =============================================================================

const API_BASE_URL = 'https://www.googleapis.com/drive/v3';
const UPLOAD_BASE_URL = 'https://www.googleapis.com/upload/drive/v3';

// Default fields to return for file listings
const DEFAULT_FILE_FIELDS =
  'id,name,mimeType,description,starred,trashed,parents,size,createdTime,modifiedTime,webViewLink,webContentLink,iconLink,thumbnailLink,shared,ownedByMe,owners,capabilities';

// =============================================================================
// Google Drive Client Interface
// =============================================================================

export interface GoogleDriveClient {
  // Connection
  testConnection(): Promise<{ connected: boolean; message: string }>;

  // About
  getAbout(fields?: string): Promise<About>;

  // Files
  listFiles(params?: {
    q?: string;
    pageSize?: number;
    pageToken?: string;
    fields?: string;
    orderBy?: string;
    spaces?: string;
    corpora?: string;
    driveId?: string;
    includeItemsFromAllDrives?: boolean;
    supportsAllDrives?: boolean;
  }): Promise<PaginatedResponse<DriveFile>>;
  getFile(fileId: string, fields?: string): Promise<DriveFile>;
  createFile(params: {
    name: string;
    mimeType?: string;
    parents?: string[];
    description?: string;
    content?: string;
  }): Promise<DriveFile>;
  updateFile(
    fileId: string,
    params: {
      name?: string;
      description?: string;
      mimeType?: string;
      content?: string;
      addParents?: string;
      removeParents?: string;
      starred?: boolean;
      trashed?: boolean;
    }
  ): Promise<DriveFile>;
  copyFile(
    fileId: string,
    params?: {
      name?: string;
      parents?: string[];
      description?: string;
    }
  ): Promise<DriveFile>;
  deleteFile(fileId: string): Promise<void>;
  emptyTrash(): Promise<void>;
  exportFile(fileId: string, mimeType: string): Promise<string>;
  downloadFile(fileId: string): Promise<string>;
  generateIds(count?: number, space?: string): Promise<string[]>;
  listLabels(fileId: string): Promise<unknown>;
  modifyLabels(fileId: string, labelModifications: unknown): Promise<unknown>;
  watchFile(
    fileId: string,
    channel: { id: string; type: 'web_hook'; address: string; token?: string; expiration?: string }
  ): Promise<Channel>;

  // Folders
  createFolder(name: string, parents?: string[]): Promise<DriveFile>;
  listFolderContents(
    folderId: string,
    params?: {
      pageSize?: number;
      pageToken?: string;
      orderBy?: string;
    }
  ): Promise<PaginatedResponse<DriveFile>>;

  // Permissions
  listPermissions(
    fileId: string,
    params?: {
      pageSize?: number;
      pageToken?: string;
      supportsAllDrives?: boolean;
    }
  ): Promise<PaginatedResponse<Permission>>;
  getPermission(fileId: string, permissionId: string): Promise<Permission>;
  createPermission(
    fileId: string,
    params: {
      role: 'owner' | 'organizer' | 'fileOrganizer' | 'writer' | 'commenter' | 'reader';
      type: 'user' | 'group' | 'domain' | 'anyone';
      emailAddress?: string;
      domain?: string;
      allowFileDiscovery?: boolean;
      sendNotificationEmail?: boolean;
      emailMessage?: string;
      transferOwnership?: boolean;
      moveToNewOwnersRoot?: boolean;
    }
  ): Promise<Permission>;
  updatePermission(
    fileId: string,
    permissionId: string,
    params: {
      role: 'owner' | 'organizer' | 'fileOrganizer' | 'writer' | 'commenter' | 'reader';
      expirationTime?: string;
    }
  ): Promise<Permission>;
  deletePermission(fileId: string, permissionId: string): Promise<void>;

  // Comments
  listComments(
    fileId: string,
    params?: {
      pageSize?: number;
      pageToken?: string;
      includeDeleted?: boolean;
      startModifiedTime?: string;
    }
  ): Promise<PaginatedResponse<Comment>>;
  getComment(fileId: string, commentId: string, includeDeleted?: boolean): Promise<Comment>;
  createComment(
    fileId: string,
    params: {
      content: string;
      anchor?: string;
      quotedFileContent?: { mimeType?: string; value?: string };
    }
  ): Promise<Comment>;
  updateComment(fileId: string, commentId: string, content: string): Promise<Comment>;
  deleteComment(fileId: string, commentId: string): Promise<void>;

  // Replies
  listReplies(
    fileId: string,
    commentId: string,
    params?: {
      pageSize?: number;
      pageToken?: string;
      includeDeleted?: boolean;
    }
  ): Promise<PaginatedResponse<Reply>>;
  getReply(
    fileId: string,
    commentId: string,
    replyId: string,
    includeDeleted?: boolean
  ): Promise<Reply>;
  createReply(
    fileId: string,
    commentId: string,
    params: {
      content: string;
      action?: 'resolve' | 'reopen';
    }
  ): Promise<Reply>;
  updateReply(fileId: string, commentId: string, replyId: string, content: string): Promise<Reply>;
  deleteReply(fileId: string, commentId: string, replyId: string): Promise<void>;

  // Revisions
  listRevisions(
    fileId: string,
    params?: {
      pageSize?: number;
      pageToken?: string;
    }
  ): Promise<PaginatedResponse<Revision>>;
  getRevision(fileId: string, revisionId: string): Promise<Revision>;
  updateRevision(
    fileId: string,
    revisionId: string,
    params: {
      keepForever?: boolean;
      publishAuto?: boolean;
      published?: boolean;
      publishedOutsideDomain?: boolean;
    }
  ): Promise<Revision>;
  deleteRevision(fileId: string, revisionId: string): Promise<void>;

  // Drives (Shared Drives)
  listDrives(params?: {
    pageSize?: number;
    pageToken?: string;
    q?: string;
    useDomainAdminAccess?: boolean;
  }): Promise<PaginatedResponse<Drive>>;
  getDrive(driveId: string, useDomainAdminAccess?: boolean): Promise<Drive>;
  createDrive(
    requestId: string,
    params: {
      name: string;
      themeId?: string;
    }
  ): Promise<Drive>;
  updateDrive(
    driveId: string,
    params: {
      name?: string;
      colorRgb?: string;
      themeId?: string;
      restrictions?: {
        adminManagedRestrictions?: boolean;
        copyRequiresWriterPermission?: boolean;
        domainUsersOnly?: boolean;
        driveMembersOnly?: boolean;
        sharingFoldersRequiresOrganizerPermission?: boolean;
      };
    }
  ): Promise<Drive>;
  deleteDrive(driveId: string): Promise<void>;
  hideDrive(driveId: string): Promise<Drive>;
  unhideDrive(driveId: string): Promise<Drive>;

  // Changes
  getStartPageToken(params?: {
    driveId?: string;
    supportsAllDrives?: boolean;
  }): Promise<string>;
  listChanges(
    pageToken: string,
    params?: {
      driveId?: string;
      pageSize?: number;
      spaces?: string;
      includeItemsFromAllDrives?: boolean;
      supportsAllDrives?: boolean;
      includeRemoved?: boolean;
      restrictToMyDrive?: boolean;
    }
  ): Promise<{ changes: Change[]; newStartPageToken?: string; nextPageToken?: string }>;
  watchChanges(
    pageToken: string,
    channel: { id: string; type: 'web_hook'; address: string; token?: string; expiration?: string },
    params?: {
      driveId?: string;
      includeItemsFromAllDrives?: boolean;
      supportsAllDrives?: boolean;
    }
  ): Promise<Channel>;

  // Channels
  stopChannel(channelId: string, resourceId: string): Promise<void>;

  // Apps
  listApps(params?: {
    appFilterExtensions?: string;
    appFilterMimeTypes?: string;
    languageCode?: string;
  }): Promise<App[]>;
  getApp(appId: string): Promise<App>;

  // Access Proposals
  listAccessProposals(
    fileId: string,
    params?: { pageSize?: number; pageToken?: string }
  ): Promise<PaginatedResponse<AccessProposal>>;
  getAccessProposal(fileId: string, proposalId: string): Promise<AccessProposal>;
  resolveAccessProposal(
    fileId: string,
    proposalId: string,
    action: 'accept' | 'deny',
    role?: string,
    view?: string,
    sendNotification?: boolean
  ): Promise<void>;

  // Operations (for long-running operations)
  getOperation(operationName: string): Promise<Operation>;
}

// =============================================================================
// Google Drive Client Implementation
// =============================================================================

class GoogleDriveClientImpl implements GoogleDriveClient {
  private credentials: TenantCredentials;
  private baseUrl: string;
  private uploadUrl: string;

  constructor(credentials: TenantCredentials) {
    this.credentials = credentials;
    this.baseUrl = credentials.baseUrl || API_BASE_URL;
    this.uploadUrl = UPLOAD_BASE_URL;
  }

  // ===========================================================================
  // HTTP Request Helper
  // ===========================================================================

  private getAuthHeaders(): Record<string, string> {
    if (!this.credentials.accessToken) {
      throw new AuthenticationError(
        'No credentials provided. Include X-Google-Access-Token header.'
      );
    }
    return {
      Authorization: `Bearer ${this.credentials.accessToken}`,
      'Content-Type': 'application/json',
    };
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    useUploadUrl = false
  ): Promise<T> {
    const baseUrl = useUploadUrl ? this.uploadUrl : this.baseUrl;
    const url = `${baseUrl}${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        ...this.getAuthHeaders(),
        ...(options.headers || {}),
      },
    });

    // Handle rate limiting
    if (response.status === 429) {
      const retryAfter = response.headers.get('Retry-After');
      throw new RateLimitError(
        'Rate limit exceeded',
        retryAfter ? Number.parseInt(retryAfter, 10) : 60
      );
    }

    // Handle authentication errors
    if (response.status === 401) {
      throw new AuthenticationError('Authentication failed. Check your OAuth access token.');
    }

    // Handle forbidden
    if (response.status === 403) {
      const errorBody = await response.text();
      let message = 'Access denied';
      try {
        const errorJson = JSON.parse(errorBody);
        message = errorJson.error?.message || message;
      } catch {
        // Use default message
      }
      throw new ForbiddenError(message);
    }

    // Handle not found
    if (response.status === 404) {
      throw new NotFoundError('Resource', endpoint);
    }

    // Handle other errors
    if (!response.ok) {
      const errorBody = await response.text();
      let message = `API error: ${response.status}`;
      try {
        const errorJson = JSON.parse(errorBody);
        message = errorJson.error?.message || errorJson.message || message;
      } catch {
        // Use default message
      }
      throw new GoogleDriveApiError(message, response.status);
    }

    // Handle 204 No Content
    if (response.status === 204) {
      return undefined as T;
    }

    // Check if response is JSON
    const contentType = response.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      return response.json() as Promise<T>;
    }

    // Return text for non-JSON responses (exports, downloads)
    return response.text() as unknown as T;
  }

  // ===========================================================================
  // Connection
  // ===========================================================================

  async testConnection(): Promise<{ connected: boolean; message: string }> {
    try {
      const about = await this.getAbout('user');
      return {
        connected: true,
        message: `Connected to Google Drive as ${about.user?.displayName || about.user?.emailAddress || 'unknown user'}`,
      };
    } catch (error) {
      return {
        connected: false,
        message: error instanceof Error ? error.message : 'Connection failed',
      };
    }
  }

  // ===========================================================================
  // About
  // ===========================================================================

  async getAbout(fields = '*'): Promise<About> {
    return this.request<About>(`/about?fields=${encodeURIComponent(fields)}`);
  }

  // ===========================================================================
  // Files
  // ===========================================================================

  async listFiles(
    params: {
      q?: string;
      pageSize?: number;
      pageToken?: string;
      fields?: string;
      orderBy?: string;
      spaces?: string;
      corpora?: string;
      driveId?: string;
      includeItemsFromAllDrives?: boolean;
      supportsAllDrives?: boolean;
    } = {}
  ): Promise<PaginatedResponse<DriveFile>> {
    const queryParams = new URLSearchParams();
    if (params.q) queryParams.set('q', params.q);
    if (params.pageSize) queryParams.set('pageSize', String(params.pageSize));
    if (params.pageToken) queryParams.set('pageToken', params.pageToken);
    queryParams.set('fields', `nextPageToken,files(${params.fields || DEFAULT_FILE_FIELDS})`);
    if (params.orderBy) queryParams.set('orderBy', params.orderBy);
    if (params.spaces) queryParams.set('spaces', params.spaces);
    if (params.corpora) queryParams.set('corpora', params.corpora);
    if (params.driveId) queryParams.set('driveId', params.driveId);
    if (params.includeItemsFromAllDrives)
      queryParams.set('includeItemsFromAllDrives', String(params.includeItemsFromAllDrives));
    if (params.supportsAllDrives)
      queryParams.set('supportsAllDrives', String(params.supportsAllDrives));

    const response = await this.request<{ files: DriveFile[]; nextPageToken?: string }>(
      `/files?${queryParams.toString()}`
    );

    return {
      items: response.files || [],
      hasMore: !!response.nextPageToken,
      nextPageToken: response.nextPageToken,
    };
  }

  async getFile(fileId: string, fields?: string): Promise<DriveFile> {
    const queryParams = new URLSearchParams();
    queryParams.set('fields', fields || DEFAULT_FILE_FIELDS);
    queryParams.set('supportsAllDrives', 'true');
    return this.request<DriveFile>(`/files/${fileId}?${queryParams.toString()}`);
  }

  async createFile(params: {
    name: string;
    mimeType?: string;
    parents?: string[];
    description?: string;
    content?: string;
  }): Promise<DriveFile> {
    const metadata: Record<string, unknown> = {
      name: params.name,
    };
    if (params.mimeType) metadata.mimeType = params.mimeType;
    if (params.parents) metadata.parents = params.parents;
    if (params.description) metadata.description = params.description;

    // If content is provided, use multipart upload
    if (params.content) {
      const boundary = '-------314159265358979323846';
      const delimiter = `\r\n--${boundary}\r\n`;
      const closeDelim = `\r\n--${boundary}--`;

      const multipartBody =
        delimiter +
        'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
        JSON.stringify(metadata) +
        delimiter +
        `Content-Type: ${params.mimeType || 'text/plain'}\r\n\r\n` +
        params.content +
        closeDelim;

      return this.request<DriveFile>(
        `/files?uploadType=multipart&fields=${DEFAULT_FILE_FIELDS}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': `multipart/related; boundary="${boundary}"`,
          },
          body: multipartBody,
        },
        true
      );
    }

    // Metadata-only upload
    return this.request<DriveFile>(`/files?fields=${DEFAULT_FILE_FIELDS}`, {
      method: 'POST',
      body: JSON.stringify(metadata),
    });
  }

  async updateFile(
    fileId: string,
    params: {
      name?: string;
      description?: string;
      mimeType?: string;
      content?: string;
      addParents?: string;
      removeParents?: string;
      starred?: boolean;
      trashed?: boolean;
    }
  ): Promise<DriveFile> {
    const queryParams = new URLSearchParams();
    queryParams.set('fields', DEFAULT_FILE_FIELDS);
    queryParams.set('supportsAllDrives', 'true');
    if (params.addParents) queryParams.set('addParents', params.addParents);
    if (params.removeParents) queryParams.set('removeParents', params.removeParents);

    const metadata: Record<string, unknown> = {};
    if (params.name !== undefined) metadata.name = params.name;
    if (params.description !== undefined) metadata.description = params.description;
    if (params.mimeType !== undefined) metadata.mimeType = params.mimeType;
    if (params.starred !== undefined) metadata.starred = params.starred;
    if (params.trashed !== undefined) metadata.trashed = params.trashed;

    // If content is provided, use multipart upload
    if (params.content) {
      const boundary = '-------314159265358979323846';
      const delimiter = `\r\n--${boundary}\r\n`;
      const closeDelim = `\r\n--${boundary}--`;

      const multipartBody =
        delimiter +
        'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
        JSON.stringify(metadata) +
        delimiter +
        `Content-Type: ${params.mimeType || 'text/plain'}\r\n\r\n` +
        params.content +
        closeDelim;

      return this.request<DriveFile>(
        `/files/${fileId}?uploadType=multipart&${queryParams.toString()}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': `multipart/related; boundary="${boundary}"`,
          },
          body: multipartBody,
        },
        true
      );
    }

    return this.request<DriveFile>(`/files/${fileId}?${queryParams.toString()}`, {
      method: 'PATCH',
      body: JSON.stringify(metadata),
    });
  }

  async copyFile(
    fileId: string,
    params: {
      name?: string;
      parents?: string[];
      description?: string;
    } = {}
  ): Promise<DriveFile> {
    const queryParams = new URLSearchParams();
    queryParams.set('fields', DEFAULT_FILE_FIELDS);
    queryParams.set('supportsAllDrives', 'true');

    return this.request<DriveFile>(`/files/${fileId}/copy?${queryParams.toString()}`, {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  async deleteFile(fileId: string): Promise<void> {
    await this.request<void>(`/files/${fileId}?supportsAllDrives=true`, {
      method: 'DELETE',
    });
  }

  async emptyTrash(): Promise<void> {
    await this.request<void>('/files/trash', {
      method: 'DELETE',
    });
  }

  async exportFile(fileId: string, mimeType: string): Promise<string> {
    return this.request<string>(
      `/files/${fileId}/export?mimeType=${encodeURIComponent(mimeType)}`
    );
  }

  async downloadFile(fileId: string): Promise<string> {
    return this.request<string>(`/files/${fileId}?alt=media&supportsAllDrives=true`);
  }

  async generateIds(count = 10, space = 'drive'): Promise<string[]> {
    const response = await this.request<{ ids: string[] }>(
      `/files/generateIds?count=${count}&space=${space}`
    );
    return response.ids;
  }

  async listLabels(fileId: string): Promise<unknown> {
    return this.request<unknown>(`/files/${fileId}/listLabels`);
  }

  async modifyLabels(fileId: string, labelModifications: unknown): Promise<unknown> {
    return this.request<unknown>(`/files/${fileId}/modifyLabels`, {
      method: 'POST',
      body: JSON.stringify({ labelModifications }),
    });
  }

  async watchFile(
    fileId: string,
    channel: { id: string; type: 'web_hook'; address: string; token?: string; expiration?: string }
  ): Promise<Channel> {
    return this.request<Channel>(`/files/${fileId}/watch?supportsAllDrives=true`, {
      method: 'POST',
      body: JSON.stringify(channel),
    });
  }

  // ===========================================================================
  // Folders
  // ===========================================================================

  async createFolder(name: string, parents?: string[]): Promise<DriveFile> {
    return this.createFile({
      name,
      mimeType: 'application/vnd.google-apps.folder',
      parents,
    });
  }

  async listFolderContents(
    folderId: string,
    params: {
      pageSize?: number;
      pageToken?: string;
      orderBy?: string;
    } = {}
  ): Promise<PaginatedResponse<DriveFile>> {
    return this.listFiles({
      q: `'${folderId}' in parents and trashed = false`,
      pageSize: params.pageSize,
      pageToken: params.pageToken,
      orderBy: params.orderBy,
    });
  }

  // ===========================================================================
  // Permissions
  // ===========================================================================

  async listPermissions(
    fileId: string,
    params: {
      pageSize?: number;
      pageToken?: string;
      supportsAllDrives?: boolean;
    } = {}
  ): Promise<PaginatedResponse<Permission>> {
    const queryParams = new URLSearchParams();
    if (params.pageSize) queryParams.set('pageSize', String(params.pageSize));
    if (params.pageToken) queryParams.set('pageToken', params.pageToken);
    queryParams.set('supportsAllDrives', String(params.supportsAllDrives ?? true));
    queryParams.set('fields', 'nextPageToken,permissions(*)');

    const response = await this.request<{
      permissions: Permission[];
      nextPageToken?: string;
    }>(`/files/${fileId}/permissions?${queryParams.toString()}`);

    return {
      items: response.permissions || [],
      hasMore: !!response.nextPageToken,
      nextPageToken: response.nextPageToken,
    };
  }

  async getPermission(fileId: string, permissionId: string): Promise<Permission> {
    return this.request<Permission>(
      `/files/${fileId}/permissions/${permissionId}?supportsAllDrives=true&fields=*`
    );
  }

  async createPermission(
    fileId: string,
    params: {
      role: 'owner' | 'organizer' | 'fileOrganizer' | 'writer' | 'commenter' | 'reader';
      type: 'user' | 'group' | 'domain' | 'anyone';
      emailAddress?: string;
      domain?: string;
      allowFileDiscovery?: boolean;
      sendNotificationEmail?: boolean;
      emailMessage?: string;
      transferOwnership?: boolean;
      moveToNewOwnersRoot?: boolean;
    }
  ): Promise<Permission> {
    const queryParams = new URLSearchParams();
    queryParams.set('supportsAllDrives', 'true');
    queryParams.set('fields', '*');
    if (params.sendNotificationEmail !== undefined) {
      queryParams.set('sendNotificationEmail', String(params.sendNotificationEmail));
    }
    if (params.emailMessage) queryParams.set('emailMessage', params.emailMessage);
    if (params.transferOwnership) queryParams.set('transferOwnership', 'true');
    if (params.moveToNewOwnersRoot) queryParams.set('moveToNewOwnersRoot', 'true');

    const body: Record<string, unknown> = {
      role: params.role,
      type: params.type,
    };
    if (params.emailAddress) body.emailAddress = params.emailAddress;
    if (params.domain) body.domain = params.domain;
    if (params.allowFileDiscovery !== undefined) body.allowFileDiscovery = params.allowFileDiscovery;

    return this.request<Permission>(
      `/files/${fileId}/permissions?${queryParams.toString()}`,
      {
        method: 'POST',
        body: JSON.stringify(body),
      }
    );
  }

  async updatePermission(
    fileId: string,
    permissionId: string,
    params: {
      role: 'owner' | 'organizer' | 'fileOrganizer' | 'writer' | 'commenter' | 'reader';
      expirationTime?: string;
    }
  ): Promise<Permission> {
    return this.request<Permission>(
      `/files/${fileId}/permissions/${permissionId}?supportsAllDrives=true&fields=*`,
      {
        method: 'PATCH',
        body: JSON.stringify(params),
      }
    );
  }

  async deletePermission(fileId: string, permissionId: string): Promise<void> {
    await this.request<void>(
      `/files/${fileId}/permissions/${permissionId}?supportsAllDrives=true`,
      {
        method: 'DELETE',
      }
    );
  }

  // ===========================================================================
  // Comments
  // ===========================================================================

  async listComments(
    fileId: string,
    params: {
      pageSize?: number;
      pageToken?: string;
      includeDeleted?: boolean;
      startModifiedTime?: string;
    } = {}
  ): Promise<PaginatedResponse<Comment>> {
    const queryParams = new URLSearchParams();
    if (params.pageSize) queryParams.set('pageSize', String(params.pageSize));
    if (params.pageToken) queryParams.set('pageToken', params.pageToken);
    if (params.includeDeleted) queryParams.set('includeDeleted', 'true');
    if (params.startModifiedTime) queryParams.set('startModifiedTime', params.startModifiedTime);
    queryParams.set('fields', 'nextPageToken,comments(*)');

    const response = await this.request<{ comments: Comment[]; nextPageToken?: string }>(
      `/files/${fileId}/comments?${queryParams.toString()}`
    );

    return {
      items: response.comments || [],
      hasMore: !!response.nextPageToken,
      nextPageToken: response.nextPageToken,
    };
  }

  async getComment(fileId: string, commentId: string, includeDeleted = false): Promise<Comment> {
    const queryParams = new URLSearchParams();
    queryParams.set('fields', '*');
    if (includeDeleted) queryParams.set('includeDeleted', 'true');
    return this.request<Comment>(
      `/files/${fileId}/comments/${commentId}?${queryParams.toString()}`
    );
  }

  async createComment(
    fileId: string,
    params: {
      content: string;
      anchor?: string;
      quotedFileContent?: { mimeType?: string; value?: string };
    }
  ): Promise<Comment> {
    return this.request<Comment>(`/files/${fileId}/comments?fields=*`, {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  async updateComment(fileId: string, commentId: string, content: string): Promise<Comment> {
    return this.request<Comment>(`/files/${fileId}/comments/${commentId}?fields=*`, {
      method: 'PATCH',
      body: JSON.stringify({ content }),
    });
  }

  async deleteComment(fileId: string, commentId: string): Promise<void> {
    await this.request<void>(`/files/${fileId}/comments/${commentId}`, {
      method: 'DELETE',
    });
  }

  // ===========================================================================
  // Replies
  // ===========================================================================

  async listReplies(
    fileId: string,
    commentId: string,
    params: {
      pageSize?: number;
      pageToken?: string;
      includeDeleted?: boolean;
    } = {}
  ): Promise<PaginatedResponse<Reply>> {
    const queryParams = new URLSearchParams();
    if (params.pageSize) queryParams.set('pageSize', String(params.pageSize));
    if (params.pageToken) queryParams.set('pageToken', params.pageToken);
    if (params.includeDeleted) queryParams.set('includeDeleted', 'true');
    queryParams.set('fields', 'nextPageToken,replies(*)');

    const response = await this.request<{ replies: Reply[]; nextPageToken?: string }>(
      `/files/${fileId}/comments/${commentId}/replies?${queryParams.toString()}`
    );

    return {
      items: response.replies || [],
      hasMore: !!response.nextPageToken,
      nextPageToken: response.nextPageToken,
    };
  }

  async getReply(
    fileId: string,
    commentId: string,
    replyId: string,
    includeDeleted = false
  ): Promise<Reply> {
    const queryParams = new URLSearchParams();
    queryParams.set('fields', '*');
    if (includeDeleted) queryParams.set('includeDeleted', 'true');
    return this.request<Reply>(
      `/files/${fileId}/comments/${commentId}/replies/${replyId}?${queryParams.toString()}`
    );
  }

  async createReply(
    fileId: string,
    commentId: string,
    params: {
      content: string;
      action?: 'resolve' | 'reopen';
    }
  ): Promise<Reply> {
    return this.request<Reply>(`/files/${fileId}/comments/${commentId}/replies?fields=*`, {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  async updateReply(
    fileId: string,
    commentId: string,
    replyId: string,
    content: string
  ): Promise<Reply> {
    return this.request<Reply>(
      `/files/${fileId}/comments/${commentId}/replies/${replyId}?fields=*`,
      {
        method: 'PATCH',
        body: JSON.stringify({ content }),
      }
    );
  }

  async deleteReply(fileId: string, commentId: string, replyId: string): Promise<void> {
    await this.request<void>(`/files/${fileId}/comments/${commentId}/replies/${replyId}`, {
      method: 'DELETE',
    });
  }

  // ===========================================================================
  // Revisions
  // ===========================================================================

  async listRevisions(
    fileId: string,
    params: {
      pageSize?: number;
      pageToken?: string;
    } = {}
  ): Promise<PaginatedResponse<Revision>> {
    const queryParams = new URLSearchParams();
    if (params.pageSize) queryParams.set('pageSize', String(params.pageSize));
    if (params.pageToken) queryParams.set('pageToken', params.pageToken);
    queryParams.set('fields', 'nextPageToken,revisions(*)');

    const response = await this.request<{ revisions: Revision[]; nextPageToken?: string }>(
      `/files/${fileId}/revisions?${queryParams.toString()}`
    );

    return {
      items: response.revisions || [],
      hasMore: !!response.nextPageToken,
      nextPageToken: response.nextPageToken,
    };
  }

  async getRevision(fileId: string, revisionId: string): Promise<Revision> {
    return this.request<Revision>(`/files/${fileId}/revisions/${revisionId}?fields=*`);
  }

  async updateRevision(
    fileId: string,
    revisionId: string,
    params: {
      keepForever?: boolean;
      publishAuto?: boolean;
      published?: boolean;
      publishedOutsideDomain?: boolean;
    }
  ): Promise<Revision> {
    return this.request<Revision>(`/files/${fileId}/revisions/${revisionId}?fields=*`, {
      method: 'PATCH',
      body: JSON.stringify(params),
    });
  }

  async deleteRevision(fileId: string, revisionId: string): Promise<void> {
    await this.request<void>(`/files/${fileId}/revisions/${revisionId}`, {
      method: 'DELETE',
    });
  }

  // ===========================================================================
  // Drives (Shared Drives)
  // ===========================================================================

  async listDrives(
    params: {
      pageSize?: number;
      pageToken?: string;
      q?: string;
      useDomainAdminAccess?: boolean;
    } = {}
  ): Promise<PaginatedResponse<Drive>> {
    const queryParams = new URLSearchParams();
    if (params.pageSize) queryParams.set('pageSize', String(params.pageSize));
    if (params.pageToken) queryParams.set('pageToken', params.pageToken);
    if (params.q) queryParams.set('q', params.q);
    if (params.useDomainAdminAccess) queryParams.set('useDomainAdminAccess', 'true');
    queryParams.set('fields', 'nextPageToken,drives(*)');

    const response = await this.request<{ drives: Drive[]; nextPageToken?: string }>(
      `/drives?${queryParams.toString()}`
    );

    return {
      items: response.drives || [],
      hasMore: !!response.nextPageToken,
      nextPageToken: response.nextPageToken,
    };
  }

  async getDrive(driveId: string, useDomainAdminAccess = false): Promise<Drive> {
    const queryParams = new URLSearchParams();
    queryParams.set('fields', '*');
    if (useDomainAdminAccess) queryParams.set('useDomainAdminAccess', 'true');
    return this.request<Drive>(`/drives/${driveId}?${queryParams.toString()}`);
  }

  async createDrive(
    requestId: string,
    params: {
      name: string;
      themeId?: string;
    }
  ): Promise<Drive> {
    return this.request<Drive>(`/drives?requestId=${encodeURIComponent(requestId)}&fields=*`, {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  async updateDrive(
    driveId: string,
    params: {
      name?: string;
      colorRgb?: string;
      themeId?: string;
      restrictions?: {
        adminManagedRestrictions?: boolean;
        copyRequiresWriterPermission?: boolean;
        domainUsersOnly?: boolean;
        driveMembersOnly?: boolean;
        sharingFoldersRequiresOrganizerPermission?: boolean;
      };
    }
  ): Promise<Drive> {
    return this.request<Drive>(`/drives/${driveId}?fields=*`, {
      method: 'PATCH',
      body: JSON.stringify(params),
    });
  }

  async deleteDrive(driveId: string): Promise<void> {
    await this.request<void>(`/drives/${driveId}`, {
      method: 'DELETE',
    });
  }

  async hideDrive(driveId: string): Promise<Drive> {
    return this.request<Drive>(`/drives/${driveId}/hide?fields=*`, {
      method: 'POST',
    });
  }

  async unhideDrive(driveId: string): Promise<Drive> {
    return this.request<Drive>(`/drives/${driveId}/unhide?fields=*`, {
      method: 'POST',
    });
  }

  // ===========================================================================
  // Changes
  // ===========================================================================

  async getStartPageToken(
    params: {
      driveId?: string;
      supportsAllDrives?: boolean;
    } = {}
  ): Promise<string> {
    const queryParams = new URLSearchParams();
    if (params.driveId) queryParams.set('driveId', params.driveId);
    if (params.supportsAllDrives) queryParams.set('supportsAllDrives', 'true');

    const response = await this.request<{ startPageToken: string }>(
      `/changes/startPageToken?${queryParams.toString()}`
    );
    return response.startPageToken;
  }

  async listChanges(
    pageToken: string,
    params: {
      driveId?: string;
      pageSize?: number;
      spaces?: string;
      includeItemsFromAllDrives?: boolean;
      supportsAllDrives?: boolean;
      includeRemoved?: boolean;
      restrictToMyDrive?: boolean;
    } = {}
  ): Promise<{ changes: Change[]; newStartPageToken?: string; nextPageToken?: string }> {
    const queryParams = new URLSearchParams();
    queryParams.set('pageToken', pageToken);
    if (params.driveId) queryParams.set('driveId', params.driveId);
    if (params.pageSize) queryParams.set('pageSize', String(params.pageSize));
    if (params.spaces) queryParams.set('spaces', params.spaces);
    if (params.includeItemsFromAllDrives)
      queryParams.set('includeItemsFromAllDrives', String(params.includeItemsFromAllDrives));
    if (params.supportsAllDrives)
      queryParams.set('supportsAllDrives', String(params.supportsAllDrives));
    if (params.includeRemoved !== undefined)
      queryParams.set('includeRemoved', String(params.includeRemoved));
    if (params.restrictToMyDrive)
      queryParams.set('restrictToMyDrive', String(params.restrictToMyDrive));
    queryParams.set('fields', 'nextPageToken,newStartPageToken,changes(*)');

    return this.request<{
      changes: Change[];
      newStartPageToken?: string;
      nextPageToken?: string;
    }>(`/changes?${queryParams.toString()}`);
  }

  async watchChanges(
    pageToken: string,
    channel: { id: string; type: 'web_hook'; address: string; token?: string; expiration?: string },
    params: {
      driveId?: string;
      includeItemsFromAllDrives?: boolean;
      supportsAllDrives?: boolean;
    } = {}
  ): Promise<Channel> {
    const queryParams = new URLSearchParams();
    queryParams.set('pageToken', pageToken);
    if (params.driveId) queryParams.set('driveId', params.driveId);
    if (params.includeItemsFromAllDrives)
      queryParams.set('includeItemsFromAllDrives', String(params.includeItemsFromAllDrives));
    if (params.supportsAllDrives)
      queryParams.set('supportsAllDrives', String(params.supportsAllDrives));

    return this.request<Channel>(`/changes/watch?${queryParams.toString()}`, {
      method: 'POST',
      body: JSON.stringify(channel),
    });
  }

  // ===========================================================================
  // Channels
  // ===========================================================================

  async stopChannel(channelId: string, resourceId: string): Promise<void> {
    await this.request<void>('/channels/stop', {
      method: 'POST',
      body: JSON.stringify({ id: channelId, resourceId }),
    });
  }

  // ===========================================================================
  // Apps
  // ===========================================================================

  async listApps(
    params: {
      appFilterExtensions?: string;
      appFilterMimeTypes?: string;
      languageCode?: string;
    } = {}
  ): Promise<App[]> {
    const queryParams = new URLSearchParams();
    if (params.appFilterExtensions)
      queryParams.set('appFilterExtensions', params.appFilterExtensions);
    if (params.appFilterMimeTypes) queryParams.set('appFilterMimeTypes', params.appFilterMimeTypes);
    if (params.languageCode) queryParams.set('languageCode', params.languageCode);
    queryParams.set('fields', 'items(*)');

    const response = await this.request<{ items: App[] }>(`/apps?${queryParams.toString()}`);
    return response.items || [];
  }

  async getApp(appId: string): Promise<App> {
    return this.request<App>(`/apps/${appId}?fields=*`);
  }

  // ===========================================================================
  // Access Proposals
  // ===========================================================================

  async listAccessProposals(
    fileId: string,
    params: { pageSize?: number; pageToken?: string } = {}
  ): Promise<PaginatedResponse<AccessProposal>> {
    const queryParams = new URLSearchParams();
    if (params.pageSize) queryParams.set('pageSize', String(params.pageSize));
    if (params.pageToken) queryParams.set('pageToken', params.pageToken);

    const response = await this.request<{
      accessProposals: AccessProposal[];
      nextPageToken?: string;
    }>(`/files/${fileId}/accessproposals?${queryParams.toString()}`);

    return {
      items: response.accessProposals || [],
      hasMore: !!response.nextPageToken,
      nextPageToken: response.nextPageToken,
    };
  }

  async getAccessProposal(fileId: string, proposalId: string): Promise<AccessProposal> {
    return this.request<AccessProposal>(`/files/${fileId}/accessproposals/${proposalId}`);
  }

  async resolveAccessProposal(
    fileId: string,
    proposalId: string,
    action: 'accept' | 'deny',
    role?: string,
    view?: string,
    sendNotification?: boolean
  ): Promise<void> {
    const queryParams = new URLSearchParams();
    queryParams.set('action', action);
    if (role) queryParams.set('role', role);
    if (view) queryParams.set('view', view);
    if (sendNotification !== undefined) queryParams.set('sendNotification', String(sendNotification));

    await this.request<void>(
      `/files/${fileId}/accessproposals/${proposalId}:resolve?${queryParams.toString()}`,
      {
        method: 'POST',
      }
    );
  }

  // ===========================================================================
  // Operations (for long-running operations)
  // ===========================================================================

  async getOperation(operationName: string): Promise<Operation> {
    // Operations use a different base URL
    return this.request<Operation>(`/operations/${operationName}`);
  }
}

// =============================================================================
// Factory Function
// =============================================================================

/**
 * Create a Google Drive client instance with tenant-specific credentials.
 *
 * MULTI-TENANT: Each request provides its own credentials via headers,
 * allowing a single server deployment to serve multiple tenants.
 *
 * @param credentials - Tenant credentials parsed from request headers
 */
export function createGoogleDriveClient(credentials: TenantCredentials): GoogleDriveClient {
  return new GoogleDriveClientImpl(credentials);
}
