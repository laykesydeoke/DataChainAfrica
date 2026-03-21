export class paglimH3 {
  private cache = new Map<string, unknown>();
  validate(v: unknown): boolean { return !!v && typeof v === 'object'; }
  process(d: unknown[]): unknown[] { return d.filter(x => this.validate(x)); }
}
