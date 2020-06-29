import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { BehaviorSubject, combineLatest, Observable } from 'rxjs';
import { filter, map, switchMap } from 'rxjs/operators';

import { GeneralEntityAppState } from '../../../../../store/src/app-state';
import { BrowserStandardEncoder } from '../../../../../store/src/browser-encoder';
import { selectSessionData } from '../../../../../store/src/reducers/auth.reducer';
import { SessionData } from '../../../../../store/src/types/auth.types';
import { LoggerService } from '../../../core/logger.service';

interface BackupContent {
  payload: string;
  dbVersion: number;
}

interface RestoreEndpointsData {
  data: string;
  password: string;
  ignoreDbVersion: boolean;
}

@Injectable()
export class RestoreEndpointsService {

  // Step 1
  validFileContent = new BehaviorSubject(false);
  validFileContent$: Observable<boolean> = this.validFileContent.asObservable();

  file = new BehaviorSubject<{
    name: string,
    content: BackupContent
  }>(null);
  file$ = this.file.asObservable();

  validDb = new BehaviorSubject(false);
  validDb$: Observable<boolean>;
  unparsableFileContent: string = null;
  currentDbVersion$: Observable<number>;
  ignoreDbVersion = new BehaviorSubject(false);
  ignoreDbVersion$ = this.ignoreDbVersion.asObservable();

  // Step 2
  private password: string;

  constructor(
    private store: Store<GeneralEntityAppState>,
    private http: HttpClient,
    private logger: LoggerService
  ) {
    this.setupStep1();
  }

  private setupStep1() {
    this.currentDbVersion$ = this.store.select(selectSessionData()).pipe(
      filter(sd => !!sd),
      map((sd: SessionData) => sd.version.database_version)
    );

    this.validDb$ = combineLatest([
      this.file$,
      this.currentDbVersion$
    ]).pipe(
      filter(([file,]) => !!file && !!file.content),
      map(([file, currentDbVersion]) => {
        return file && file.content && file.content.dbVersion === currentDbVersion;
      })
    );

    this.validFileContent$ = combineLatest([
      this.file$,
      this.validDb$,
      this.ignoreDbVersion$
    ]).pipe(
      map(([file, validDb, ignoreDb]) => !!file && (ignoreDb || validDb))
    );
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
    let parsedContent: BackupContent;
    try {
      parsedContent = JSON.parse(content);
      this.unparsableFileContent = null;
    } catch (err) {
      this.logger.warn('Failed to parse file contents: ', err);
      parsedContent = null;
      this.unparsableFileContent = `${err instanceof Error ? err.message : String(err)}`;
    }

    this.file.next({
      name: fileName,
      content: parsedContent
    });
  }

  setIgnoreDbVersion(ignore: boolean) {
    this.ignoreDbVersion.next(ignore);
  }

  setPassword(password: string) {
    this.password = password;
  }

  restoreBackup(): Observable<any> {
    const url = '/pp/v1/endpoints/restore';
    const fromObject = {};
    const params: HttpParams = new HttpParams({
      fromObject,
      encoder: new BrowserStandardEncoder()
    });

    return combineLatest([
      this.file$,
      this.ignoreDbVersion$
    ]).pipe(
      switchMap(([file, ignoreDb]) => {
        const body: RestoreEndpointsData = {
          data: JSON.stringify(file.content),
          password: this.password,
          ignoreDbVersion: ignoreDb
        };
        return this.http.post(url, body, { params });
      })
    );
  }
}
