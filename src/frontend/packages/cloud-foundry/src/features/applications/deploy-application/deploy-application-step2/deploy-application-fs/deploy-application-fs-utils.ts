import { BehaviorSubject, Observable } from 'rxjs';

import { DeployApplicationFSScanner, FileScannerInfo } from './deploy-application-fs-scanner';

export const CF_IGNORE_FILE = '.cfignore';
export const CF_DEFAULT_IGNORES = '.cfignore\n_darcs\n.DS_Store\n.git\n.gitignore\n.hg\n.svn\n';
export const CF_MANIFEST_FILE_YML = 'manifest.yml';
export const CF_MANIFEST_FILE_YAML = 'manifest.yaml';

export class DeployApplicationFsUtils {

  constructor() { }

  // File list from a file input form field
  handleFileInputSelection(items): Observable<FileScannerInfo> {
    const obs$ = new BehaviorSubject<DeployApplicationFSScanner>(undefined);
    let scanner = new DeployApplicationFSScanner(CF_DEFAULT_IGNORES);
    let cfIgnoreFile;
    let manifestFile = false;
    let rootFolderName = '';

    if (items.length === 1) {
      if (scanner.isArchiveFile(items[0].name)) {
        scanner.addFile(items[0]);
        scanner.summarize();
        obs$.next(scanner);
      }
    } else {
      // See if we can find the .cfignore file and/or the manifest file
      for (const item of items) {
        const filePath = item.webkitRelativePath.split('/');
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
        scanner.addFile(items.item(index));
      }
      scanner.summarize();
      obs$.next(scanner);
    });

    return obs$;
  }

}
