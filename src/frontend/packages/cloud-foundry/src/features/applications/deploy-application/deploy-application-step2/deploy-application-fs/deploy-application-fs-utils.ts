import { Observable, ReplaySubject } from 'rxjs';

import { DeployApplicationFSScanner, FileScannerInfo } from './deploy-application-fs-scanner';

export const CF_IGNORE_FILE = '.cfignore';
export const CF_DEFAULT_IGNORES = '.cfignore\n_darcs\n.DS_Store\n.git\n.gitignore\n.hg\n.svn\n';
export const CF_MANIFEST_FILE_YML = 'manifest.yml';
export const CF_MANIFEST_FILE_YAML = 'manifest.yaml';

export class DeployApplicationFsUtils {

  constructor() { }

  // File list from a file input form field.
  //
  // Produces a single-value Observable that emits once the scanner has
  // summarized the selection. Uses ReplaySubject(1) rather than
  // signal + toObservable because this utility is a plain class invoked
  // from an event handler — there is no injection context available,
  // and `toObservable()` requires one. The old `toObservable()` path
  // threw NG0203 synchronously at every file/folder pick after the
  // Angular 20 migration, silently aborting the upload flow.
  handleFileInputSelection(items: any): Observable<FileScannerInfo> {
    const subject = new ReplaySubject<FileScannerInfo>(1);
    let scanner = new DeployApplicationFSScanner(CF_DEFAULT_IGNORES);
    let cfIgnoreFile: any;
    let manifestFile: any = false;
    let rootFolderName = '';

    if (items.length === 1) {
      if (scanner.isArchiveFile(items[0].name)) {
        scanner.addFile(items[0]);
        scanner.summarize();
        subject.next(scanner);
        subject.complete();
        return subject.asObservable();
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
    const readIgnoresFile: Promise<string> = cfIgnoreFile
      ? scanner.readFileContents(cfIgnoreFile)
      : Promise.resolve('');

    readIgnoresFile.then((ignores) => {
      scanner = new DeployApplicationFSScanner(CF_DEFAULT_IGNORES + ignores, rootFolderName);
      scanner.cfIgnoreFile = cfIgnoreFile;
      scanner.manifestFile = manifestFile;
      for (let index = 0; index < items.length; index++) {
        scanner.addFile(items.item(index));
      }
      scanner.summarize();
      subject.next(scanner);
      subject.complete();
    }).catch(err => subject.error(err));

    return subject.asObservable();
  }

}
