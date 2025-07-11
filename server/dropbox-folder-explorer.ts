import { DropboxApiClient } from './dropbox-api-client';
import type { CloudDriveConfig } from '@shared/schema';

export class DropboxFolderExplorer {
  private apiClient: DropboxApiClient | null = null;

  constructor() {}

  async setupDropbox(accessToken: string, refreshToken?: string): Promise<void> {
    this.apiClient = new DropboxApiClient(accessToken, refreshToken);
  }

  async listAllFolders(config: CloudDriveConfig): Promise<any[]> {
    if (!this.apiClient) {
      throw new Error('Dropbox not configured');
    }

    try {
      const result = await this.apiClient.listFolder('', true); // List all folders recursively
      
      // Filter for folders only and add document count
      const folders = result.entries.filter(entry => entry['.tag'] === 'folder');
      
      // Add document count for each folder
      const foldersWithCounts = await Promise.all(
        folders.map(async (folder) => {
          const documentCount = await this.countDocumentsInFolder(folder.path_display);
          return {
            id: folder.id,
            name: folder.name,
            path: folder.path_display,
            documentCount
          };
        })
      );

      return foldersWithCounts;
    } catch (error) {
      console.error('Error listing Dropbox folders:', error);
      throw error;
    }
  }

  private async countDocumentsInFolder(folderPath: string): Promise<number> {
    if (!this.apiClient) return 0;

    try {
      const result = await this.apiClient.listFolder(folderPath);
      return result.entries.filter(entry => 
        entry['.tag'] === 'file' && this.isDocumentFile(entry.name)
      ).length;
    } catch (error) {
      console.error(`Error counting documents in ${folderPath}:`, error);
      return 0;
    }
  }

  async findFoldersContaining(config: CloudDriveConfig, searchTerm: string): Promise<any[]> {
    if (!this.apiClient) {
      throw new Error('Dropbox not configured');
    }

    try {
      const allFolders = await this.listAllFolders(config);
      return allFolders.filter(folder => 
        folder.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        folder.path.toLowerCase().includes(searchTerm.toLowerCase())
      );
    } catch (error) {
      console.error('Error searching Dropbox folders:', error);
      throw error;
    }
  }

  async listFolderContents(config: CloudDriveConfig, folderId: string): Promise<any[]> {
    if (!this.apiClient) {
      throw new Error('Dropbox not configured');
    }

    try {
      // For Dropbox, folderId is actually the folder path
      const result = await this.apiClient.listFolder(folderId);
      
      return result.entries.map(entry => ({
        id: entry.id,
        name: entry.name,
        type: entry['.tag'],
        path: entry.path_display,
        size: entry.size || 0,
        modified: entry.server_modified || entry.client_modified,
        isDocument: entry['.tag'] === 'file' && this.isDocumentFile(entry.name)
      }));
    } catch (error) {
      console.error('Error listing folder contents:', error);
      throw error;
    }
  }

  async searchDocuments(config: CloudDriveConfig, folderId?: string): Promise<any[]> {
    if (!this.apiClient) {
      throw new Error('Dropbox not configured');
    }

    try {
      const searchPath = folderId || '';
      const result = await this.apiClient.listFolder(searchPath, true); // Recursive search
      
      // Filter for document files only
      const documents = result.entries.filter(entry => 
        entry['.tag'] === 'file' && this.isDocumentFile(entry.name)
      );

      return documents.map(file => ({
        id: file.id,
        name: file.name,
        path: file.path_display,
        size: file.size || 0,
        modified: file.server_modified || file.client_modified,
        mimeType: this.getMimeTypeFromExtension(file.name)
      }));
    } catch (error) {
      console.error('Error searching documents:', error);
      throw error;
    }
  }

  private isDocumentFile(fileName: string): boolean {
    const extension = fileName.toLowerCase().split('.').pop();
    return ['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx', 'xls', 'xlsx'].includes(extension || '');
  }

  private getMimeTypeFromExtension(fileName: string): string {
    const extension = fileName.toLowerCase().split('.').pop();
    switch (extension) {
      case 'pdf':
        return 'application/pdf';
      case 'jpg':
      case 'jpeg':
        return 'image/jpeg';
      case 'png':
        return 'image/png';
      case 'doc':
        return 'application/msword';
      case 'docx':
        return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      case 'xls':
        return 'application/vnd.ms-excel';
      case 'xlsx':
        return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      default:
        return 'application/octet-stream';
    }
  }
}

export const dropboxFolderExplorer = new DropboxFolderExplorer();