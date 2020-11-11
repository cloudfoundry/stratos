import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';

import { KubernetesResourceListComponent } from './kubernetes-resource-list.component';

describe('KubernetesResourceListComponent', () => {
  let component: KubernetesResourceListComponent;
  let fixture: ComponentFixture<KubernetesResourceListComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ KubernetesResourceListComponent ],
      imports: [ RouterTestingModule ],
      providers: [
      {
        provide: ActivatedRoute,
        useValue: {
          snapshot: {
            data: {
              entityCatalogKey: 'test'
            },
            params: {
              endpointId: 'anything'
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
