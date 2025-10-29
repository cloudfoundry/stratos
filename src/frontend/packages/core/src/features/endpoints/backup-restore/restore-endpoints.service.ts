import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { selectSessionData, GeneralEntityAppState, BrowserStandardEncoder, SessionData } from '@stratosui/store';
import { BehaviorSubject, combineLatest, Observable } from 'rxjs';
import { filter, map, switchMap } from 'rxjs/operators';

interface BackupContent {
  payload: string;
  dbVersion: number;
}

interface RestoreEndpointsData {
  data: string;
  password: string;
  ignoreDbVersion: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class RestoreEndpointsService {

  // Step 1
  validFileContent = new BehaviorSubject<boolean>(false);
  validFileContent$: Observable<boolean> = this.validFileContent.asObservable();

  file = new BehaviorSubject<{
    name: string,
    content: BackupContent,
  } | null>(null);
  file$ = this.file.asObservable();

  validDb = new BehaviorSubject<boolean>(false);
  validDb$: Observable<boolean>;
  unparsableFileContent: string | null = null;
  currentDbVersion$: Observable<number>;
  ignoreDbVersion = new BehaviorSubject<boolean>(false);
  ignoreDbVersion$ = this.ignoreDbVersion.asObservable();

  // Step 2
  private password: string;

  constructor(
    private store: Store<GeneralEntityAppState>,
    private http: HttpClient,
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
      filter(([file]: [any, number]) => !!file && !!file.content),
      map(([file, currentDbVersion]: [any, number]) => {
        return file && file.content && file.content.dbVersion === currentDbVersion;
      })
    );

    this.validFileContent$ = combineLatest([
      this.file$,
      this.validDb$,
      this.ignoreDbVersion$
    ]).pipe(
      map(([file, validDb, ignoreDb]: [any, boolean, boolean]) => !!file && (ignoreDb || validDb))
    );
  }

  setFile(file: any): Promise<string> {
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

  private setFileResult(content: string | null, fileName: string | null) {
    let parsedContent: BackupContent | null;
    try {
      parsedContent = content ? JSON.parse(content) : null;
      this.unparsableFileContent = null;
    } catch (err) {
      console.warn('Failed to parse file contents: ', err);
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
      switchMap(([file, ignoreDb]: [any, boolean]) => {
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
