import { Store } from '@ngrx/store';
import { AppState } from '../../store/app-state';
import { ApplicationSchema, GetApplication } from '../../store/actions/application.actions';
import { it } from '@angular/cli/lib/ast-tools/spec-utils';
import { EntityService } from '../../core/entity-service';
import { inject, TestBed } from '@angular/core/testing';

import { AppStoreModule } from '../../store/store.module';
import { ApplicationService } from './application.service';
import { ApplicationsModule } from './applications.module';
import { RouterTestingModule } from '@angular/router/testing';

const appId = '1';
const cfId = '2';
const entityServiceFactory = (
  store: Store<AppState>
) => {
  return new EntityService(
    store,
    ApplicationSchema.key,
    ApplicationSchema,
    appId,
    new GetApplication(appId, cfId)
  );
};


describe('ApplicationService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        AppStoreModule,
        ApplicationsModule,
        RouterTestingModule,
      ],
      providers: [
        {
          provide: EntityService,
          useFactory: entityServiceFactory,
          deps: [Store]
        }
      ]
    });
  });

  it('should be created', inject([ApplicationService], (service: ApplicationService) => {
    expect(service).toBeTruthy();
  }));
});
