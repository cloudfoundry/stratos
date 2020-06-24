import * as fs from 'fs';
import * as path from 'path';

const GIT_METADATA_FILE = '.stratos-git-metadata.json';

/**
 * Represents the Git Metadata read from the metadata file or the
 * environment variables.
 *
 * This is embedded in the index.html file for diagnostic purposes
 */
export class GitMetadata {

  public project: string;
  public branch: string;
  public commit: string;

  public exists = false;

  constructor(dir: string) {

    this.project = process.env.project || process.env.STRATOS_PROJECT || '';
    this.branch = process.env.branch || process.env.STRATOS_BRANCH || '';
    this.commit = process.env.commit || process.env.STRATOS_COMMIT || '';

    // Try and read the git metadata file
    const gitMetadataFile = path.join(dir, GIT_METADATA_FILE);
    if (fs.existsSync(gitMetadataFile)) {
      const gitMetadata = JSON.parse(fs.readFileSync(gitMetadataFile).toString());
      this.project = gitMetadata.project;
      this.branch = gitMetadata.branch;
      this.commit = gitMetadata.commit;
      this.exists = true;
    }
  }

}
