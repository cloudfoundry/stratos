import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { KubedashConfigurationComponent } from './kubedash-configuration.component';
import { KubernetesBaseTestModules } from '../../kubernetes.testing.module';
import { TabNavService } from '../../../../../tab-nav.service';
import { HttpClient, HttpHandler } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';

describe('KubedashConfigurationComponent', () => {
  let component: KubedashConfigurationComponent;
  let fixture: ComponentFixture<KubedashConfigurationComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [...KubernetesBaseTestModules],
      declarations: [ KubedashConfigurationComponent ],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              params: {
                endpointId: 'anything'
              },
              queryParams: {}
            }
          }
        },
        TabNavService,
        HttpClient,
        HttpHandler,
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(KubedashConfigurationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
