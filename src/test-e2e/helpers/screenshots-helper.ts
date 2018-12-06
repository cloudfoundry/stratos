import { existsSync, mkdirSync, writeFile } from 'fs';
import { join } from 'path';
import { browser } from 'protractor';

export class E2eScreenshot {
  constructor(private screenshotsFolder = join('src', 'test-e2e', 'tmp')) {
    this.screenshotsFolder = join(__dirname, '..', '..', '..', screenshotsFolder);

    if (!existsSync(this.screenshotsFolder)) {
      mkdirSync(this.screenshotsFolder);
    }
  }

  takeScreenshot(fileName: string) {
    browser.driver.sleep(1000);
    const filePath = join(this.screenshotsFolder, fileName + '.png');
    browser.takeScreenshot().then(function (data) {
      const base64Data = data.replace(/^data:image\/png;base64,/, '');
      writeFile(filePath, base64Data, 'base64', function (err) {
        /* tslint:disable */
        if (err) {
          console.log(`Failed to save screenshot '${filePath}'`, err);
        } else {
          console.log('Wrote screenshot to ', filePath);
        }
        /* tslint:enable */
      });
    });
  }
}


