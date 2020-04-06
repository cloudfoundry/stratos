import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { BehaviorSubject, Observable } from 'rxjs';

import { GeneralEntityAppState } from '../../../../../store/src/app-state';
import { BrowserStandardEncoder } from '../../../helper';
import { BackupRestoreEndpointService } from './backup-restore-endpoints.service';

interface RestoreEndpointsData {
  data: string;
  password: string;
}

@Injectable()
export class RestoreEndpointsService extends BackupRestoreEndpointService {

  validFile = new BehaviorSubject(false);
  validFile$ = this.validFile.asObservable();
  password: string; // TODO: RC use set password in both services
  fileName: string;
  private fileContent: string;

  constructor(
    private store: Store<GeneralEntityAppState>,
    private http: HttpClient
  ) {
    super();
  }

  setFile(file): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const res = reader.result as string;
        this.setFileResult(res, file.name);
        resolve(res);
      };
      reader.onerror = () => this.setFileResult(null, null);
      reader.onabort = () => this.setFileResult(null, null);
      reader.readAsText(file);
    });
  }

  private setFileResult(content: string, fileName: string) {
    if (!!content) {
      this.validFile.next(true);
      this.fileName = fileName;
      this.fileContent = content;
    } else {
      this.validFile.next(false);
      this.fileName = '';
      this.fileContent = '';
    }
  }


  restoreBackup(): Observable<any> {
    const url = '/pp/v1/endpoints/restore';
    const fromObject = {};
    const params: HttpParams = new HttpParams({
      fromObject,
      encoder: new BrowserStandardEncoder()
    });
    return this.http.post(url, this.createBodyToSend(), {
      params
    });
  }

  createBodyToSend(): RestoreEndpointsData {
    return {
      data: this.fileContent,
      password: this.password
    };
  }
}
