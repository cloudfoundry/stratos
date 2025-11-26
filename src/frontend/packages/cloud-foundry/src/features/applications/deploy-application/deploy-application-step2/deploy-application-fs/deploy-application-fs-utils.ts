import { signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { filter, type Observable } from 'rxjs';

import { DeployApplicationFSScanner, type FileScannerInfo } from './deploy-application-fs-scanner';

export const CF_IGNORE_FILE = '.cfignore';
export const CF_DEFAULT_IGNORES = '.cfignore\n_darcs\n.DS_Store\n.git\n.gitignore\n.hg\n.svn\n';
export const CF_MANIFEST_FILE_YML = 'manifest.yml';
export const CF_MANIFEST_FILE_YAML = 'manifest.yaml';

export class DeployApplicationFsUtils {

  // File list from a file input form field
  handleFileInputSelection(items: FileList): Observable<FileScannerInfo> {
    // Use signal with initialValue to avoid undefined type issues
    const scannerSignal = signal<FileScannerInfo | undefined>(undefined);
    let scanner = new DeployApplicationFSScanner(CF_DEFAULT_IGNORES);
    let cfIgnoreFile: File | null = null;
    let manifestFile: File | null = null;
    let rootFolderName = '';

    if (items.length === 1) {
      if (scanner.isArchiveFile(items[0].name)) {
        scanner.addFile(items[0] as File & { webkitRelativePath: string });
        scanner.summarize();
        scannerSignal.set(scanner);
      }
    } else {
      // See if we can find the .cfignore file and/or the manifest file
      for (let i = 0; i < items.length; i++) {
        const item = items.item(i);
        if (!item) {
          continue;
        }
        const fileItem = item as File & { webkitRelativePath: string };
        const filePath = fileItem.webkitRelativePath.split('/');
        // First part is the root folder name
        if (filePath.length > 1 && !rootFolderName) {
          rootFolderName = filePath[0];
        }

        if (!cfIgnoreFile && filePath.length === 2 && filePath[1] === CF_IGNORE_FILE) {
          cfIgnoreFile = item;
        }

        // Support either manifest.yml or manifest.yaml
        if (filePath.length === 2 && (filePath[1] === CF_MANIFEST_FILE_YML || filePath[1] === CF_MANIFEST_FILE_YAML)) {
          manifestFile = item;
        }
      }
    }

    // If we found the Cloud Foundry ignore file, read the ignores file
    let readIgnoresFile = Promise.resolve('');
    if (cfIgnoreFile) {
      readIgnoresFile = scanner.readFileContents(cfIgnoreFile);
    }

    readIgnoresFile.then((ignores) => {
      scanner = new DeployApplicationFSScanner(CF_DEFAULT_IGNORES + ignores, rootFolderName);
      scanner.cfIgnoreFile = cfIgnoreFile;
      scanner.manifestFile = manifestFile;
      for (let index = 0; index < items.length; index++) {
        const fileItem = items.item(index);
        if (fileItem) {
          scanner.addFile(fileItem as File & { webkitRelativePath: string });
        }
      }
      scanner.summarize();
      scannerSignal.set(scanner);
    });

    // Convert signal to Observable, filtering out undefined values
    return toObservable(scannerSignal).pipe(
      filter((scanner): scanner is FileScannerInfo => scanner !== undefined)
    );
  }

}
