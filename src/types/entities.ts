/**
 * Google Drive Entity Types
 *
 * Type definitions for Google Drive API v3 entities.
 * Based on: https://developers.google.com/drive/api/reference/rest/v3
 */

// =============================================================================
// Pagination
// =============================================================================

export interface PaginationParams {
  /** Number of items to return */
  pageSize?: number;
  /** Token for pagination */
  pageToken?: string;
}

export interface PaginatedResponse<T> {
  /** Array of items */
  items: T[];
  /** Whether more items are available */
  hasMore: boolean;
  /** Token for next page */
  nextPageToken?: string;
}

// =============================================================================
// File / Folder
// =============================================================================

export interface DriveFile {
  /** The ID of the file */
  id: string;
  /** The name of the file */
  name: string;
  /** The MIME type of the file */
  mimeType: string;
  /** A short description of the file */
  description?: string;
  /** Whether the file has been starred by the user */
  starred?: boolean;
  /** Whether the file has been trashed */
  trashed?: boolean;
  /** Whether the file has been explicitly trashed */
  explicitlyTrashed?: boolean;
  /** The IDs of the parent folders which contain the file */
  parents?: string[];
  /** Additional metadata about image media if available */
  imageMediaMetadata?: ImageMediaMetadata;
  /** Additional metadata about video media if available */
  videoMediaMetadata?: VideoMediaMetadata;
  /** The size of the file in bytes (only for files with binary content) */
  size?: string;
  /** MD5 checksum for the content (only for files with binary content) */
  md5Checksum?: string;
  /** The time at which the file was created */
  createdTime?: string;
  /** The last time the file was modified by anyone */
  modifiedTime?: string;
  /** The last time the file was viewed by the user */
  viewedByMeTime?: string;
  /** The last time the file was shared */
  sharedWithMeTime?: string;
  /** Whether the file is shared */
  shared?: boolean;
  /** Whether the user owns the file */
  ownedByMe?: boolean;
  /** The owner of this file (only populated for items in shared drives) */
  owners?: User[];
  /** The last user to modify the file */
  lastModifyingUser?: User;
  /** Capabilities the current user has on this file */
  capabilities?: FileCapabilities;
  /** A collection of arbitrary key-value pairs */
  appProperties?: Record<string, string>;
  /** Additional information about the content */
  contentHints?: ContentHints;
  /** The full file extension extracted from the name field */
  fileExtension?: string;
  /** The original filename of the uploaded content */
  originalFilename?: string;
  /** A link for downloading the content */
  webContentLink?: string;
  /** A link for viewing the file in a browser */
  webViewLink?: string;
  /** A link only available on public folders for viewing in a browser */
  iconLink?: string;
  /** A thumbnail for the file (read-only) */
  thumbnailLink?: string;
  /** Whether users with writer permission can copy the file */
  writersCanShare?: boolean;
  /** Whether this file has been viewed by this user */
  viewedByMe?: boolean;
  /** A collection of permission IDs for users with access to this file */
  permissionIds?: string[];
  /** The list of permissions for users with access to this file */
  permissions?: Permission[];
  /** The folder color as an RGB hex string (only for folders) */
  folderColorRgb?: string;
  /** A monotonically increasing version number for the file */
  version?: string;
  /** The ID of the file's head revision */
  headRevisionId?: string;
  /** Whether the content of the file is truncated */
  hasThumbnail?: boolean;
  /** A map of the id of each of the user's apps to a link to open this file with that app */
  exportLinks?: Record<string, string>;
  /** Shortcut file details (only for shortcut files) */
  shortcutDetails?: ShortcutDetails;
  /** Contains details about the content restrictions on this item */
  contentRestrictions?: ContentRestriction[];
  /** Information about a Drive resource's direct share policy */
  resourceKey?: string;
  /** Contains details about the link URLs that clients are using to refer to this item */
  linkShareMetadata?: LinkShareMetadata;
  /** Information about a Drive resource's direct-share policy */
  labelInfo?: LabelInfo;
  /** SHA-1 checksum associated with this file */
  sha1Checksum?: string;
  /** SHA-256 checksum associated with this file */
  sha256Checksum?: string;
  /** ID of the shared drive the file resides in (only for items in shared drives) */
  driveId?: string;
  /** Whether the file was created or opened by the requesting app */
  isAppAuthorized?: boolean;
  /** Whether the file has been modified by this user */
  modifiedByMe?: boolean;
  /** The number of storage quota bytes used by the file */
  quotaBytesUsed?: string;
  /** Whether the file was created by this user */
  createdByMe?: boolean;
  /** Whether the options to copy, print, or download this file should be disabled */
  copyRequiresWriterPermission?: boolean;
  /** The thumbnail version for use in thumbnail cache invalidation */
  thumbnailVersion?: string;
}

export interface ImageMediaMetadata {
  width?: number;
  height?: number;
  rotation?: number;
  location?: {
    latitude?: number;
    longitude?: number;
    altitude?: number;
  };
  time?: string;
  cameraMake?: string;
  cameraModel?: string;
  exposureTime?: number;
  aperture?: number;
  flashUsed?: boolean;
  focalLength?: number;
  isoSpeed?: number;
  meteringMode?: string;
  sensor?: string;
  exposureMode?: string;
  colorSpace?: string;
  whiteBalance?: string;
  exposureBias?: number;
  maxApertureValue?: number;
  subjectDistance?: number;
  lens?: string;
}

export interface VideoMediaMetadata {
  width?: number;
  height?: number;
  durationMillis?: string;
}

export interface User {
  /** The user's ID */
  kind?: string;
  /** A plain text displayable name for this user */
  displayName?: string;
  /** A link to the user's profile photo */
  photoLink?: string;
  /** Whether this user is the requesting user */
  me?: boolean;
  /** The user's ID as visible in Permission resources */
  permissionId?: string;
  /** The email address of the user */
  emailAddress?: string;
}

export interface FileCapabilities {
  canAddChildren?: boolean;
  canAddFolderFromAnotherDrive?: boolean;
  canAddMyDriveParent?: boolean;
  canChangeCopyRequiresWriterPermission?: boolean;
  canChangeSecurityUpdateEnabled?: boolean;
  canChangeViewersCanCopyContent?: boolean;
  canComment?: boolean;
  canCopy?: boolean;
  canDelete?: boolean;
  canDeleteChildren?: boolean;
  canDownload?: boolean;
  canEdit?: boolean;
  canListChildren?: boolean;
  canModifyContent?: boolean;
  canModifyContentRestriction?: boolean;
  canModifyEditorContentRestriction?: boolean;
  canModifyLabels?: boolean;
  canModifyOwnerContentRestriction?: boolean;
  canMoveChildrenOutOfDrive?: boolean;
  canMoveChildrenOutOfTeamDrive?: boolean;
  canMoveChildrenWithinDrive?: boolean;
  canMoveChildrenWithinTeamDrive?: boolean;
  canMoveItemIntoTeamDrive?: boolean;
  canMoveItemOutOfDrive?: boolean;
  canMoveItemOutOfTeamDrive?: boolean;
  canMoveItemWithinDrive?: boolean;
  canMoveItemWithinTeamDrive?: boolean;
  canMoveTeamDriveItem?: boolean;
  canReadDrive?: boolean;
  canReadLabels?: boolean;
  canReadRevisions?: boolean;
  canReadTeamDrive?: boolean;
  canRemoveChildren?: boolean;
  canRemoveContentRestriction?: boolean;
  canRemoveMyDriveParent?: boolean;
  canRename?: boolean;
  canShare?: boolean;
  canTrash?: boolean;
  canTrashChildren?: boolean;
  canUntrash?: boolean;
}

export interface ContentHints {
  indexableText?: string;
  thumbnail?: {
    image?: string;
    mimeType?: string;
  };
}

export interface ShortcutDetails {
  targetId?: string;
  targetMimeType?: string;
  targetResourceKey?: string;
}

export interface ContentRestriction {
  readOnly?: boolean;
  reason?: string;
  type?: string;
  restrictingUser?: User;
  restrictionTime?: string;
  ownerRestricted?: boolean;
  systemRestricted?: boolean;
}

export interface LinkShareMetadata {
  securityUpdateEligible?: boolean;
  securityUpdateEnabled?: boolean;
}

export interface LabelInfo {
  labels?: Label[];
}

export interface Label {
  id?: string;
  revisionId?: string;
  kind?: string;
  fields?: Record<string, LabelField>;
}

export interface LabelField {
  kind?: string;
  id?: string;
  valueType?: string;
  dateString?: string[];
  integer?: string[];
  selection?: string[];
  text?: string[];
  user?: User[];
}

// =============================================================================
// Permission
// =============================================================================

export interface Permission {
  /** The ID of the permission */
  id?: string;
  /** Output only: The type of the grantee */
  type: 'user' | 'group' | 'domain' | 'anyone';
  /** The role granted by this permission */
  role: 'owner' | 'organizer' | 'fileOrganizer' | 'writer' | 'commenter' | 'reader';
  /** The email address of the user or group to which this permission refers */
  emailAddress?: string;
  /** The domain to which this permission refers */
  domain?: string;
  /** Whether the permission allows the file to be discovered through search */
  allowFileDiscovery?: boolean;
  /** A displayable name for users, groups, or domains */
  displayName?: string;
  /** A link to the user's profile photo */
  photoLink?: string;
  /** The time at which this permission will expire (RFC 3339) */
  expirationTime?: string;
  /** Whether the account associated with this permission has been deleted */
  deleted?: boolean;
  /** Details of whether the permissions on this shared drive item are inherited */
  permissionDetails?: PermissionDetail[];
  /** Whether this permission is pending */
  pendingOwner?: boolean;
  /** Output only: whether this is view access permission */
  view?: string;
}

export interface PermissionDetail {
  permissionType?: string;
  inheritedFrom?: string;
  role?: string;
  inherited?: boolean;
}

// =============================================================================
// Comment
// =============================================================================

export interface Comment {
  /** The ID of the comment */
  id?: string;
  /** The plain text content of the comment */
  content: string;
  /** The time at which the comment was created */
  createdTime?: string;
  /** The last time the comment or any of its replies was modified */
  modifiedTime?: string;
  /** The author of the comment */
  author?: User;
  /** The file content to which the comment refers, typically within the anchor region */
  quotedFileContent?: {
    mimeType?: string;
    value?: string;
  };
  /** The region of the document to which the comment is anchored */
  anchor?: string;
  /** The list of replies to the comment in chronological order */
  replies?: Reply[];
  /** Whether the comment has been resolved by one of its replies */
  resolved?: boolean;
  /** Whether the comment has been deleted */
  deleted?: boolean;
  /** The full list of HTML-formatted content for the comment */
  htmlContent?: string;
}

// =============================================================================
// Reply
// =============================================================================

export interface Reply {
  /** The ID of the reply */
  id?: string;
  /** The plain text content of the reply */
  content: string;
  /** The time at which the reply was created */
  createdTime?: string;
  /** The last time the reply was modified */
  modifiedTime?: string;
  /** The author of the reply */
  author?: User;
  /** The action the reply performed to the parent comment */
  action?: 'resolve' | 'reopen';
  /** Whether the reply has been deleted */
  deleted?: boolean;
  /** The full HTML-formatted content for the reply */
  htmlContent?: string;
}

// =============================================================================
// Revision
// =============================================================================

export interface Revision {
  /** The ID of the revision */
  id?: string;
  /** The MIME type of the revision */
  mimeType?: string;
  /** The last time the revision was modified */
  modifiedTime?: string;
  /** Whether to keep this revision forever, even if it is no longer the head revision */
  keepForever?: boolean;
  /** Whether this revision is published */
  published?: boolean;
  /** A link to the published revision */
  publishedLink?: string;
  /** Whether this revision is published outside the domain */
  publishedOutsideDomain?: boolean;
  /** Whether subsequent revisions will be automatically republished */
  publishAuto?: boolean;
  /** The size of the revision in bytes */
  size?: string;
  /** The original filename used to create this revision */
  originalFilename?: string;
  /** The last user to modify this revision */
  lastModifyingUser?: User;
  /** Links for exporting Docs Editors files to specific formats */
  exportLinks?: Record<string, string>;
  /** MD5 checksum for the content of this revision */
  md5Checksum?: string;
}

// =============================================================================
// Drive (Shared Drive)
// =============================================================================

export interface Drive {
  /** The ID of this shared drive */
  id?: string;
  /** The name of this shared drive */
  name: string;
  /** The color of this shared drive as an RGB hex string */
  colorRgb?: string;
  /** The time at which the shared drive was created */
  createdTime?: string;
  /** Whether the shared drive is hidden from default view */
  hidden?: boolean;
  /** Capabilities the current user has on this shared drive */
  capabilities?: DriveCapabilities;
  /** The ID of the theme from which the background image is set */
  themeId?: string;
  /** A short-lived link to this shared drive's background image */
  backgroundImageLink?: string;
  /** An image file and cropping parameters from which a background image will be set */
  backgroundImageFile?: {
    id?: string;
    xCoordinate?: number;
    yCoordinate?: number;
    width?: number;
  };
  /** A set of restrictions that apply to this shared drive or items inside */
  restrictions?: DriveRestrictions;
  /** The org unit id of this Shared Drive */
  orgUnitId?: string;
}

export interface DriveCapabilities {
  canAddChildren?: boolean;
  canChangeCopyRequiresWriterPermissionRestriction?: boolean;
  canChangeDomainUsersOnlyRestriction?: boolean;
  canChangeDriveBackground?: boolean;
  canChangeDriveMembersOnlyRestriction?: boolean;
  canChangeSharingFoldersRequiresOrganizerPermissionRestriction?: boolean;
  canComment?: boolean;
  canCopy?: boolean;
  canDeleteChildren?: boolean;
  canDeleteDrive?: boolean;
  canDownload?: boolean;
  canEdit?: boolean;
  canListChildren?: boolean;
  canManageMembers?: boolean;
  canReadRevisions?: boolean;
  canRename?: boolean;
  canRenameDrive?: boolean;
  canResetDriveRestrictions?: boolean;
  canShare?: boolean;
  canTrashChildren?: boolean;
}

export interface DriveRestrictions {
  adminManagedRestrictions?: boolean;
  copyRequiresWriterPermission?: boolean;
  domainUsersOnly?: boolean;
  driveMembersOnly?: boolean;
  sharingFoldersRequiresOrganizerPermission?: boolean;
}

// =============================================================================
// Change
// =============================================================================

export interface Change {
  /** Identifies what kind of resource this is */
  kind?: string;
  /** The type of the change (file or drive) */
  changeType?: 'file' | 'drive';
  /** The time of this change */
  time?: string;
  /** Whether the file or shared drive has been removed from this list of changes */
  removed?: boolean;
  /** The ID of the file which has changed */
  fileId?: string;
  /** The updated state of the file */
  file?: DriveFile;
  /** The ID of the shared drive associated with this change */
  driveId?: string;
  /** The updated state of the shared drive */
  drive?: Drive;
}

// =============================================================================
// Channel (for watching changes)
// =============================================================================

export interface Channel {
  /** A UUID identifying this channel */
  id: string;
  /** An opaque ID that identifies the resource being watched on this channel */
  resourceId?: string;
  /** A version-specific identifier for the watched resource */
  resourceUri?: string;
  /** An arbitrary string delivered to the target address */
  token?: string;
  /** Date and time of notification channel expiration, as a Unix timestamp in milliseconds */
  expiration?: string;
  /** The type of delivery mechanism used for this channel */
  type: 'web_hook';
  /** The address where notifications are delivered for this channel */
  address: string;
  /** Additional parameters controlling delivery channel behavior */
  params?: Record<string, string>;
  /** A Boolean value to indicate whether payload is wanted */
  payload?: boolean;
}

// =============================================================================
// About
// =============================================================================

export interface About {
  /** Identifies what kind of resource this is */
  kind?: string;
  /** The current user */
  user?: User;
  /** The user's storage quota limits and usage */
  storageQuota?: StorageQuota;
  /** A map of source MIME type to possible targets for all supported imports */
  importFormats?: Record<string, string[]>;
  /** A map of source MIME type to possible targets for all supported exports */
  exportFormats?: Record<string, string[]>;
  /** The maximum upload size in bytes */
  maxUploadSize?: string;
  /** The maximum import sizes for each supported format */
  maxImportSizes?: Record<string, string>;
  /** A list of theme from which the background of a shared drive can be set */
  driveThemes?: DriveTheme[];
  /** Whether the user can create shared drives */
  canCreateDrives?: boolean;
  /** Whether the user has installed the requesting app */
  appInstalled?: boolean;
  /** A list of folder IDs that are available to use in the properties of a document */
  folderColorPalette?: string[];
}

export interface StorageQuota {
  limit?: string;
  usage?: string;
  usageInDrive?: string;
  usageInDriveTrash?: string;
}

export interface DriveTheme {
  id?: string;
  colorRgb?: string;
  backgroundImageLink?: string;
}

// =============================================================================
// App
// =============================================================================

export interface App {
  /** The ID of the app */
  id?: string;
  /** The name of the app */
  name?: string;
  /** The template URL for opening files with this app */
  objectType?: string;
  /** Whether this app supports creating objects */
  supportsCreate?: boolean;
  /** Whether this app supports importing from Google Docs */
  supportsImport?: boolean;
  /** Whether the app is installed */
  installed?: boolean;
  /** Whether the app is authorized to access data on the user's Drive */
  authorized?: boolean;
  /** A list of MIME types that this app can open */
  primaryMimeTypes?: string[];
  /** A list of MIME types that this app can create */
  secondaryMimeTypes?: string[];
  /** A list of file extensions that this app can open */
  primaryFileExtensions?: string[];
  /** A list of file extensions that this app can create */
  secondaryFileExtensions?: string[];
  /** The various icons for the app */
  icons?: AppIcon[];
  /** A link to the product listing for this app */
  productUrl?: string;
  /** A short description of the app */
  shortDescription?: string;
  /** A long description of the app */
  longDescription?: string;
  /** The template URL to create a new file with this app */
  createUrl?: string;
  /** The URL for the app */
  createInFolderTemplate?: string;
  /** Whether users can install this app */
  openUrlTemplate?: string;
  /** Whether this app supports multiple file opens */
  supportsMultiOpen?: boolean;
  /** Whether this app supports offline mode */
  supportsOfflineCreate?: boolean;
  /** Whether the user has installed this app */
  hasDriveWideScope?: boolean;
  /** The ID of the product listing for this app */
  productId?: string;
  /** Whether this app only works in a browser */
  useByDefault?: boolean;
  /** The background color of the app icon */
  backgroundColor?: string;
}

export interface AppIcon {
  size?: number;
  category?: string;
  iconUrl?: string;
}

// =============================================================================
// Access Proposal
// =============================================================================

export interface AccessProposal {
  /** The ID of the access proposal */
  proposalId?: string;
  /** The file ID of the file being requested */
  fileId?: string;
  /** The user who is requesting access */
  requesterEmailAddress?: string;
  /** The roles requested */
  rolesAndViews?: RoleAndView[];
  /** The creation time of the request */
  createTime?: string;
  /** The message included with the request */
  requestMessage?: string;
}

export interface RoleAndView {
  role?: string;
  view?: string;
}

// =============================================================================
// Operation (for long-running operations)
// =============================================================================

export interface Operation {
  /** The server-assigned name, which is only unique within the same service that originally returns it */
  name?: string;
  /** Service-specific metadata associated with the operation */
  metadata?: Record<string, unknown>;
  /** If the value is false, it means the operation is still in progress */
  done?: boolean;
  /** The error result of the operation in case of failure or cancellation */
  error?: {
    code?: number;
    message?: string;
    details?: Record<string, unknown>[];
  };
  /** The normal response of the operation in case of success */
  response?: Record<string, unknown>;
}

// =============================================================================
// Response Format
// =============================================================================

export type ResponseFormat = 'json' | 'markdown';
