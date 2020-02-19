import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ApiEntityType } from '../../api-drive-views.types';
import { SharedModule } from '../../../shared/shared.module';
import { ApiEntityTypeSelectorComponent } from './api-entity-type-selector.component';
import { ApiDrivenViewsModule } from '../../api-driven-views.module';

describe('ApiEntityTypeSelectorComponent', () => {
  let component: ApiEntityTypeSelectorComponent;
  let fixture: ComponentFixture<ApiEntityTypeSelectorComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [SharedModule, ApiDrivenViewsModule]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ApiEntityTypeSelectorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render endpoint', () => {
    const endpointTypes: ApiEntityType[] = [{
      title: 'Endpoint1',
      imageUrl: 'image1',
      type: 'endpoint1Type'
    },
    {
      title: 'Endpoint2',
      imageUrl: 'image2',
      type: 'endpoint2Type'
    }];
    component.entityTypes = endpointTypes;
    fixture.detectChanges();
    const element: HTMLElement = fixture.nativeElement;
    const tileElements = Array.from(element.getElementsByClassName('tile-selector'));
    expect(tileElements.length).toBe(2);
    expect(tileElements.length).toBe(2);
    tileElements.forEach((tile, index) => {
      expect(tile.getElementsByClassName('tile-selector__content')[0].textContent)
        .toBe(endpointTypes[index].title);
      expect(
        tile.getElementsByClassName('tile-selector__header')[0]
          .getElementsByTagName('img')[0]
          .attributes.getNamedItem('src')
          .value
      )
        .toBe(endpointTypes[index].imageUrl);

    });
  });
});
