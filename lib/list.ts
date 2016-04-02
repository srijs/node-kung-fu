import {Option} from './option';

export type ListPattern<T, X> = {
  nil: () => X,
  cons: (t: T, ts: List<T>) => X
}

export class List<T> {
  private _arr: Array<T>;

  constructor(arr: Array<T>, begin?: number, end?: number) {
    this._arr = arr.slice(begin, end);
  }

  static empty<T>(): List<T> {
    return new List([]);
  }

  static singleton<T>(t: T): List<T> {
    return new List([t]);
  }

  static fromArray<T>(arr: Array<T>): List<T> {
    return new List(arr);
  }

  toArray(): Array<T> {
    return this._arr;
  }

  caseOf<X>(pattern: ListPattern<T, X>): X {
    if (this._arr.length === 0) {
      return pattern.nil();
    } else {
      return pattern.cons(this._arr[0], new List(this._arr, 1));
    }
  }

  length(): number {
    return this._arr.length;
  }

  head(): Option<T> {
    return this.caseOf({
      nil: () => Option.none<T>(),
      cons: (t, ts) => Option.some(t)
    });
  }

  tail(): List<T> {
    return this.caseOf({
      nil: () => List.empty<T>(),
      cons: (t, ts) => ts
    });
  }

  prepend(prev: T): List<T> {
    return new List([prev].concat(this._arr));
  }

  append(next: T): List<T> {
    return new List(this._arr.concat([next]));
  }

  concat(other: List<T>): List<T> {
    return new List(this._arr.concat(other._arr));
  }

  foldLeft<X>(step: (x: X, t: T) => X, init: X): X {
    return this._arr.reduce<X>((x, t) => step(x, t), init);
  }

  scanLeft<X>(step: (x: X, t: T) => X, init: X): List<X> {
    return this._arr.reduce<List<X>>((xs, t) => xs.append(step(xs._arr[0], t)), List.singleton(init));
  }

  zip<U, V>(other: List<U>, f: (t: T, u: U) => V): List<V> {
    if (this.length > other.length) {
      return other.zip(this, (u, t) => f(t, u));
    }
    return new List(this._arr.map((t: T, idx: number) => f(t, other._arr[idx])));
  }

  map<U>(f: (t: T) => U): List<U> {
    return new List(this._arr.map(f));
  }

  map2<U, V>(other: List<U>, f: (t: T, u: U) => V): List<V> {
    return this.flatMap(t => other.map(u => f(t, u)));
  }

  flatMap<U>(f: (t: T) => List<U>): List<U> {
    return this.map(f).foldLeft((xs, x) => xs.concat(x), List.empty<U>());
  }
}
