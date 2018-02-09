import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { CloudFoundryBaseComponent } from './cloud-foundry-base.component';
import { CloudFoundryEndpointService } from './cloud-foundry-endpoint.service';
import { generateTestCfEndpointServiceProvider } from '../../../test-framework/cloud-foundry-endpoint-service.helper';

describe('CloudFoundryBaseComponent', () => {
  let component: CloudFoundryBaseComponent;
  let fixture: ComponentFixture<CloudFoundryBaseComponent>;
  const cfId = '1';
  beforeEach(
    async(() => {
      TestBed.configureTestingModule({
        declarations: [CloudFoundryBaseComponent],
        imports: [RouterTestingModule],
        providers: [CloudFoundryEndpointService]
      }).compileComponents();
    })
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(CloudFoundryBaseComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
