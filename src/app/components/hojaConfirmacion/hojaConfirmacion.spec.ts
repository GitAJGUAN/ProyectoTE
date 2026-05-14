import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HojaConfirmacion } from './hojaConfirmacion';

describe('HojaConfirmacion', () => {
  let component: HojaConfirmacion;
  let fixture: ComponentFixture<HojaConfirmacion>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HojaConfirmacion],
    }).compileComponents();

    fixture = TestBed.createComponent(HojaConfirmacion);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
