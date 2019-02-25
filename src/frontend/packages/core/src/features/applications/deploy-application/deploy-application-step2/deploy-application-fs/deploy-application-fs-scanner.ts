import { GitIgnoreFilter } from '../../deploy-application-ignorefiles';

const archiveRegex = /\.(tar|zip|tar.gz)$/i;

export interface FileScannerFolderContext {
  files: string[];
  folders: {
    [key: string]: FileScannerFolderContext
  };
}

export type FileScannerInfoType = 'file' | 'folder';

export interface FileScannerInfo {
  total: number;
  files: number;
  folders: number;
  excludes: string[];
  root: FileScannerFolderContext;
  summaryType: FileScannerInfoType;
  summaryItem: any;
  manifestFile: any;
  cfIgnoreFile: any;
}

export class DeployApplicationFSScanner implements FileScannerInfo {

  private filter;
  public total = 0;
  public files = 0;
  public folders = 0;
  public excludes = [];
  public root = {
    files: [],
    folders: {}
  };
  public summaryType: FileScannerInfoType = 'file';
  public summaryItem;

  public manifestFile: any;
  public cfIgnoreFile: any;

  constructor(public fileExcludes: string, public rootFolderName?: string) {
    if (fileExcludes) {
      this.filter = new GitIgnoreFilter(fileExcludes);
    }
  }

  isArchiveFile(fileName: string): boolean {
    return archiveRegex.test(name);
  }

  file(context: FileScannerFolderContext, file, path) {
    let fullName = path + '/' + file.name;
    if (fullName.indexOf('/') === 0) {
      fullName = fullName.substr(1);
    }
    let skip = false;
    if (this.filter) {
      skip = skip || !this.filter.accepts(fullName);
      skip = skip || !this.filter.accepts(file.name);
    }
    if (!skip) {
      this.files++;
      this.total += file.size;
      context.files.push(file);
    } else {
      this.excludes.push(fullName);
    }
  }

  folder(context: FileScannerFolderContext, name: string, fullName: string): FileScannerFolderContext {
    if (context.folders[name]) {
      return context.folders[name];
    }

    if (fullName.indexOf('/') === 0) {
      fullName = fullName.substr(1);
    }
    fullName += '/';
    if (this.filter && !this.filter.accepts(fullName)) {
      this.excludes.push(fullName);
      return undefined;
    }
    this.folders++;
    const newContext = {
      folders: {},
      files: []
    };
    context.folders[name] = newContext;
    return newContext;
  }

  /**
   * Add a file to the list - will add necessary folders and check to see if the file should be excluded
   */
  addFile(file) {
    // Make the folder for the file
    const fileParts = file.webkitRelativePath.split('/');
    let context = this.root;
    let fullPath = '';
    if (fileParts.length > 1) {
      for (let i = 0; i < fileParts.length - 1; i++) {
        if (!(this.rootFolderName && i === 0 && fileParts[i] === this.rootFolderName)) {
          fullPath += '/' + fileParts[i];
          context = this.folder(context, fileParts[i], fullPath);
          if (!context) {
            // Ignored folder
            return this;
          }
        }
      }
    }
    this.file(context, file, fullPath);
    return this;
  }

  /**
   * When all files added, call summarize to populate summary fields that cab be used in the UI
   */
  summarize() {
    if (this.folders === 0 && this.files === 0) {
      this.summaryType = 'folder';
    } else if (this.folders === 0 && this.files === 1) {
      this.summaryItem = this.root.files[0];
      this.summaryType = 'file';
    } else {
      this.summaryType = 'folder';
    }
  }

  readItemContents(item): Promise<string> {
    const scanner = this;
    return new Promise((resolve, reject) => {
      item.file(file => {
        scanner.readFileContents(file).then((data: string) => {
          resolve(data);
        }).catch(() => {
          reject();
        });
      });
    });
  }

  readFileContents(file): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject();
      reader.onabort = () => reject();
      reader.readAsText(file);
    });
  }

}
