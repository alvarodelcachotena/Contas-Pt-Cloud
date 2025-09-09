import { DROPBOX_CLIENT_ID, DROPBOX_CLIENT_SECRET } from './config';
import type { CloudDriveConfig } from '@shared/schema';

export interface DropboxFile {
  '.tag': 'file' | 'folder';
  id: string;
  name: string;
  path_display: string;
  path_lower: string;
  server_modified?: string;
  client_modified?: string;
  size?: number;
  rev?: string;
  content_hash?: string;
}

export interface DropboxListFolderResult {
  entries: DropboxFile[];
  cursor: string;
  has_more: boolean;
}

export interface DropboxTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  scope?: string;
}

export class DropboxApiClient {
  private accessToken: string;
  private refreshToken?: string;
  private tokenExpiresAt?: Date;

  constructor(accessToken: string, refreshToken?: string) {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    // Assume token expires in 4 hours (14400 seconds) if not specified
    this.tokenExpiresAt = new Date(Date.now() + 14400 * 1000);
  }

  /**
   * Check if the current access token is expired or will expire soon
   */
  private isTokenExpired(): boolean {
    if (!this.tokenExpiresAt) return false;
    // Consider token expired if it expires within 5 minutes
    return this.tokenExpiresAt.getTime() - Date.now() < 5 * 60 * 1000;
  }

  /**
   * Refresh the access token using the refresh token
   */
  private async refreshAccessToken(): Promise<void> {
    if (!this.refreshToken) {
      throw new Error('No refresh token available');
    }

    console.log('🔄 Refreshing Dropbox access token...');

    const response = await fetch('https://api.dropboxapi.com/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: this.refreshToken,
        client_id: DROPBOX_CLIENT_ID!,
        client_secret: DROPBOX_CLIENT_SECRET!,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Token refresh failed: ${response.status} ${errorText}`);
    }

    const tokenData: DropboxTokenResponse = await response.json();

    this.accessToken = tokenData.access_token;
    this.tokenExpiresAt = new Date(Date.now() + tokenData.expires_in * 1000);

    console.log('✅ Dropbox access token refreshed successfully');
  }

  /**
   * Ensure we have a valid access token, refreshing if necessary
   */
  async ensureValidToken(): Promise<void> {
    if (this.isTokenExpired()) {
      await this.refreshAccessToken();
    }
  }

  /**
   * Make an authenticated API request to Dropbox
   */
  private async makeRequest(url: string, options: RequestInit = {}): Promise<Response> {
    await this.ensureValidToken();

    // Use proper content type for different endpoint types
    const defaultHeaders: Record<string, string> = {
      'Authorization': `Bearer ${this.accessToken}`,
    };

    // For content endpoints, don't set JSON content type
    if (!url.includes('content.dropboxapi.com')) {
      defaultHeaders['Content-Type'] = 'application/json';
    }

    const response = await fetch(url, {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    });

    // If we get a 401, try refreshing the token once
    if (response.status === 401 && this.refreshToken) {
      console.log('🔄 Got 401, attempting token refresh...');
      await this.refreshAccessToken();

      // Update headers with new token
      const retryHeaders = {
        ...defaultHeaders,
        'Authorization': `Bearer ${this.accessToken}`,
        ...options.headers,
      };

      // Retry the request with the new token
      return fetch(url, {
        ...options,
        headers: retryHeaders,
      });
    }

    return response;
  }

  /**
   * List files in a folder
   */
  async listFolder(path: string, recursive: boolean = false): Promise<DropboxListFolderResult> {
    const response = await this.makeRequest('https://api.dropboxapi.com/2/files/list_folder', {
      method: 'POST',
      body: JSON.stringify({
        path: path === '/' ? '' : path,
        recursive,
        include_media_info: false,
        include_deleted: false,
        include_has_explicit_shared_members: false,
        include_mounted_folders: true,
        include_non_downloadable_files: false,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`List folder failed: ${response.status} ${errorText}`);
    }

    return response.json();
  }

  /**
   * Continue listing folder contents using a cursor
   */
  async listFolderContinue(cursor: string): Promise<DropboxListFolderResult> {
    const response = await this.makeRequest('https://api.dropboxapi.com/2/files/list_folder/continue', {
      method: 'POST',
      body: JSON.stringify({ cursor }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`List folder continue failed: ${response.status} ${errorText}`);
    }

    return response.json();
  }

  /**
   * Get the latest cursor for a folder without listing files
   */
  async getLatestCursor(path: string): Promise<string> {
    const response = await this.makeRequest('https://api.dropboxapi.com/2/files/list_folder/get_latest_cursor', {
      method: 'POST',
      body: JSON.stringify({
        path: path === '/' ? '' : path,
        recursive: false,
        include_media_info: false,
        include_deleted: false,
        include_has_explicit_shared_members: false,
        include_mounted_folders: true,
        include_non_downloadable_files: false,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Get latest cursor failed: ${response.status} ${errorText}`);
    }

    const result = await response.json();
    return result.cursor;
  }
  /**
     * Download a file from Dropbox
     */
  async downloadFile(path: string): Promise<Buffer> {
    // Use makeRequest to handle token validation and refresh
    const response = await this.makeRequest('https://content.dropboxapi.com/2/files/download', {
      method: 'POST',
      headers: {
        'Dropbox-API-Arg': JSON.stringify({ path }),
        'Content-Type': 'application/octet-stream',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Download file failed: ${response.status} ${errorText}`);
    }

    return Buffer.from(await response.arrayBuffer());
  }

  /**
   * Upload a file to Dropbox
   */
  async uploadFile(filePath: string, fileBuffer: Buffer, mode: 'add' | 'overwrite' | 'update' = 'overwrite'): Promise<DropboxFile> {
    const response = await this.makeRequest('https://content.dropboxapi.com/2/files/upload', {
      method: 'POST',
      headers: {
        'Dropbox-API-Arg': JSON.stringify({
          path: filePath,
          mode: mode,
          autorename: false,
          mute: false,
          strict_conflict: false
        }),
        'Content-Type': 'application/octet-stream',
      },
      body: fileBuffer,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Upload file failed: ${response.status} ${errorText}`);
    }

    return await response.json();
  }

  /**
   * Create a folder in Dropbox
   */
  async createFolder(path: string): Promise<DropboxFile> {
    const response = await this.makeRequest('https://api.dropboxapi.com/2/files/create_folder_v2', {
      method: 'POST',
      body: JSON.stringify({
        path,
        autorename: false,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Create folder failed: ${response.status} ${errorText}`);
    }

    return await response.json();
  }

  /**
   * Get file metadata
   */
  async getMetadata(path: string): Promise<DropboxFile> {
    const response = await this.makeRequest('https://api.dropboxapi.com/2/files/get_metadata', {
      method: 'POST',
      body: JSON.stringify({
        path,
        include_media_info: false,
        include_deleted: false,
        include_has_explicit_shared_members: false,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Get metadata failed: ${response.status} ${errorText}`);
    }

    return response.json();
  }

  /**
   * Get current access token (for updating stored credentials)
   */
  getCurrentAccessToken(): string {
    return this.accessToken;
  }

  /**
   * Get token expiration time
   */
  getTokenExpiresAt(): Date | undefined {
    return this.tokenExpiresAt;
  }
}