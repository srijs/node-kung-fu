export class Pair<A, B> {

  constructor(private readonly _first: A, private readonly _second: B) {}

  get first(): A {
    return this._first;
  }

  get second(): B {
    return this._second;
  }

  mapFirst<C>(f: (first: A) => C): Pair<C, B> {
    return new Pair(f(this._first), this._second);
  }

  mapSecond<C>(f: (second: B) => C): Pair<A, C> {
    return new Pair(this._first, f(this._second));
  }

  map<C, D>(f: (first: A) => C, g: (second: B) => D): Pair<C, D> {
    return new Pair(f(this._first), g(this._second));
  }
}
