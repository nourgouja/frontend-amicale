import { RoleLabelPipe } from './role-label.pipe';

describe('RoleLabelPipe', () => {
  let pipe: RoleLabelPipe;

  beforeEach(() => {
    pipe = new RoleLabelPipe();
  });

  it('should create an instance', () => {
    expect(pipe).toBeTruthy();
  });

  it('transforms ADMIN to Administrateur', () => {
    expect(pipe.transform('ADMIN')).toBe('Administrateur');
  });

  it('transforms MEMBRE_BUREAU to Membre Bureau', () => {
    expect(pipe.transform('MEMBRE_BUREAU')).toBe('Membre Bureau');
  });

  it('transforms ADHERENT to Adhérent', () => {
    expect(pipe.transform('ADHERENT')).toBe('Adhérent');
  });

  it('returns raw value for unknown role', () => {
    expect(pipe.transform('UNKNOWN_ROLE')).toBe('UNKNOWN_ROLE');
  });

  it('returns empty string for empty input', () => {
    expect(pipe.transform('')).toBe('');
  });
});
