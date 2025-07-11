import { google, drive_v3 } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import type { CloudDriveConfig } from '../shared/schema';
import { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } from './config';

export class GoogleDriveFolderExplorer {
  private oauth2Client: OAuth2Client;
  private googleDrive: drive_v3.Drive | null = null;

  constructor() {
    this.oauth2Client = new google.auth.OAuth2(
      GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET,
      undefined // Will be set dynamically per request
    );
  }

  async setupDrive(accessToken: string, refreshToken?: string): Promise<void> {
    this.oauth2Client.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken
    });

    this.googleDrive = google.drive({ version: 'v3', auth: this.oauth2Client });
  }

  async listAllFolders(config: CloudDriveConfig): Promise<any[]> {
    if (!this.googleDrive) {
      await this.setupDrive(config.accessToken, config.refreshToken || '');
    }

    try {
      const folders = [];
      let pageToken: string | undefined;

      do {
        const response = await this.googleDrive!.files.list({
          q: "mimeType='application/vnd.google-apps.folder' and trashed=false",
          fields: 'nextPageToken, files(id, name, parents)',
          pageSize: 100,
          pageToken
        });

        if (response.data.files) {
          folders.push(...response.data.files);
        }

        pageToken = response.data.nextPageToken || undefined;
      } while (pageToken);

      return folders;
    } catch (error) {
      console.error('Error listing folders:', error);
      return [];
    }
  }

  async findFoldersContaining(config: CloudDriveConfig, searchTerm: string): Promise<any[]> {
    const allFolders = await this.listAllFolders(config);
    return allFolders.filter(folder => 
      folder.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }

  async listFolderContents(config: CloudDriveConfig, folderId: string): Promise<any[]> {
    if (!this.googleDrive) {
      await this.setupDrive(config.accessToken, config.refreshToken || '');
    }

    try {
      const response = await this.googleDrive!.files.list({
        q: `'${folderId}' in parents and trashed=false`,
        fields: 'files(id, name, mimeType, size, modifiedTime)',
        pageSize: 100
      });

      return response.data.files || [];
    } catch (error) {
      console.error('Error listing folder contents:', error);
      return [];
    }
  }

  async searchDocuments(config: CloudDriveConfig, folderId?: string): Promise<any[]> {
    if (!this.googleDrive) {
      await this.setupDrive(config.accessToken, config.refreshToken || '');
    }

    try {
      const documentTypes = [
        'application/pdf',
        'image/jpeg',
        'image/png',
        'image/jpg'
      ];

      const typeQuery = documentTypes.map(type => `mimeType='${type}'`).join(' or ');
      const parentQuery = folderId ? ` and '${folderId}' in parents` : '';
      const query = `(${typeQuery})${parentQuery} and trashed=false`;

      const response = await this.googleDrive!.files.list({
        q: query,
        fields: 'files(id, name, mimeType, size, modifiedTime, parents)',
        pageSize: 100
      });

      return response.data.files || [];
    } catch (error) {
      console.error('Error searching documents:', error);
      return [];
    }
  }
}

export const googleDriveFolderExplorer = new GoogleDriveFolderExplorer();