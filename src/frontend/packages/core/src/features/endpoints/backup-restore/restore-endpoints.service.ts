import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, signal, computed, Injector, inject } from '@angular/core';
import { BrowserStandardEncoder } from '@stratosui/store';
import { Observable } from 'rxjs';
import { toObservable } from '@angular/core/rxjs-interop';

import { AuthSignalService } from '../../../core/signals/auth-signal.service';

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
  private authSignals = inject(AuthSignalService);
  private http = inject(HttpClient);
  private injector = inject(Injector);


  // Step 1
  private _file = signal<{
    name: string | null,
    content: BackupContent | null,
  } | null>(null);
  public file = this._file.asReadonly();

  private _ignoreDbVersion = signal<boolean>(false);
  public ignoreDbVersion = this._ignoreDbVersion.asReadonly();

  unparsableFileContent: string | null = null;

  // Note: currentDbVersionSignal is initialized in constructor to provide injector context
  private currentDbVersionSignal: any;

  // Computed signals for validation
  public validDb = computed(() => {
    const fileValue = this._file();
    const currentDbVersion = this.currentDbVersionSignal();
    return !!fileValue && !!fileValue.content && fileValue.content.dbVersion === currentDbVersion;
  });

  public validFileContent = computed(() => {
    const fileValue = this._file();
    const validDbValue = this.validDb();
    const ignoreDb = this._ignoreDbVersion();
    return !!fileValue && (ignoreDb || validDbValue);
  });

  // Observable versions for template compatibility (deprecated, use signals directly)
  public validFileContent$: Observable<boolean>;
  public file$: Observable<{ name: string | null; content: BackupContent | null } | null>;
  public validDb$: Observable<boolean>;
  public ignoreDbVersion$: Observable<boolean>;
  public currentDbVersion$: Observable<number>;

  // Step 2
  private password!: string;

  constructor() {
    // Sourced from the signal-native auth projection. The legacy
    // implementation gated on `!!sd`; the same null-coalesce here keeps
    // the initial value as 0 until sessionData is populated, matching the
    // `{ initialValue: 0 }` semantics of the original toSignal.
    this.currentDbVersionSignal = computed(
      () => this.authSignals.sessionData()?.version?.database_version ?? 0
    );

    this.validFileContent$ = toObservable(this.validFileContent, { injector: this.injector });
    this.file$ = toObservable(this.file, { injector: this.injector });
    this.validDb$ = toObservable(this.validDb, { injector: this.injector });
    this.ignoreDbVersion$ = toObservable(this.ignoreDbVersion, { injector: this.injector });
    this.currentDbVersion$ = toObservable(this.currentDbVersionSignal, { injector: this.injector });
  }

  setFile(file: any): Promise<string> {
    return new Promise((resolve, _reject) => {
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

    this._file.set({
      name: fileName,
      content: parsedContent
    });
  }

  setIgnoreDbVersion(ignore: boolean) {
    this._ignoreDbVersion.set(ignore);
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

    const fileValue = this._file();
    const ignoreDb = this._ignoreDbVersion();

    const body: RestoreEndpointsData = {
      data: JSON.stringify(fileValue?.content),
      password: this.password,
      ignoreDbVersion: ignoreDb
    };
    return this.http.post(url, body, { params });
  }
}
