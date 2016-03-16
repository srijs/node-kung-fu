export class Pair<X, Y> {
  constructor(public first: X, public second: Y) {}

  mapFirst<Z>(f: (x: X) => Z): Pair<Z, Y> {
    return new Pair(f(this.first), this.second);
  }

  mapSecond<Z>(f: (x: Y) => Z): Pair<X, Z> {
    return new Pair(this.first, f(this.second));
  }
}
