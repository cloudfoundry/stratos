import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';

import { TabNavService } from '../../../../../core/src/tab-nav.service';
import { KubeBaseGuidMock, KubernetesBaseTestModules } from '../../kubernetes.testing.module';
import { KubernetesResourceListComponent } from './kubernetes-resource-list.component';

describe('KubernetesResourceListComponent', () => {
  let component: KubernetesResourceListComponent;
  let fixture: ComponentFixture<KubernetesResourceListComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ KubernetesResourceListComponent ],
      imports: [ KubernetesBaseTestModules ],
      providers: [
        KubeBaseGuidMock,
        TabNavService,
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              data: {
                entityCatalogKey: 'test'
              },
              params: {
              },
              queryParams: {}
            }
          }
        }
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(KubernetesResourceListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
