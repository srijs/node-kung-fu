import {Either} from './either';

export type OptionPattern<T, S, N> = {
  none: () => N,
  some: (t: T) => S
};

interface CaseOf<T> {
  run<S, N>(pattern: OptionPattern<T, S, N>): S | N;
}

class SomeCaseOf<T> implements CaseOf<T> {

  constructor(private readonly _t: T) {}

  run<S, N>(pattern: OptionPattern<T, S, N>): S {
    return pattern.some(this._t);
  }
}

class NoneCaseOf<T> implements CaseOf<T> {

  constructor() {}

  run<S, N>(pattern: OptionPattern<T, S, N>): N {
    return pattern.none();
  }
}

export class Option<T> implements Iterable<T> {

  private constructor(private readonly _caseOf: CaseOf<T>) {}

  static some<T>(t: T): Option<T> {
    return new Option<T>(new SomeCaseOf(t));
  }

  static someLazy<T>(f: () => T): Option<T> {
    return Option.none<T>().orElseLazy(() => Option.some(f()));
  }

  static none<T>(): Option<T> {
    return new Option(new NoneCaseOf<T>());
  }

  static readonly empty: Option<never> = Option.none<never>();

  static option<T>(t: T | null | undefined): Option<T> {
    return t ? Option.some(t) : Option.empty;
  }

  static optionLazy<T>(f: () => T | null | undefined): Option<T> {
    return Option.someLazy<T>(f as () => T).truthy();
  }

  static all<T>(arr: Iterable<Option<T> | T>): Option<Array<T>> {
    return Option.empty.orElseLazy<Array<T>>((() => {
      const values: Array<T> = [];
      for (let elem of arr) {
        if (elem instanceof Option) {
          if (elem.isDefined()) {
            values.push(elem.get());
          }
        } else {
          values.push(elem);
        }
      }
      if (values.length > 0) {
        return Option.some(values);
      }
      return Option.empty;
    }));
  }

  caseOf<U, V>(pattern: OptionPattern<T, U, V>): U | V {
    return this._caseOf.run(pattern);
  }

  isDefined(): boolean {
    return this.caseOf({
      none: () => false,
      some: () => true
    });
  }

  isEmpty(): boolean {
    return this.caseOf({
      none: () => true,
      some: () => false
    });
  }

  getOr<U>(def: U): T | U {
    return this.caseOf<T, U>({
      none: () => def,
      some: (t) => t
    });
  }

  getOrLazy<U>(def: () => U): T | U {
    return this.caseOf<T, U>({
      none: () => def(),
      some: (t) => t
    });
  }

  get(): T {
    return this.caseOf({
      none: (): T => {
        throw new TypeError('option is empty');
      },
      some: (t) => t
    });
  }

  map<U>(f: (t: T) => U): Option<U> {
    return this.flatMap(t => Option.some(f(t)));
  }

  map2<U, X>(other: Option<U>, f: (t: T, u: U) => X): Option<X> {
    return this.flatMap(t => other.map(u => f(t, u)));
  }

  flatMap<U>(f: (t: T) => Option<U>): Option<U> {
    return this.cataOption<U, never>(f, Option.empty);
  }

  filter(pred: (t: T) => boolean): Option<T> {
    return this.flatMap(t => pred(t) ? this : Option.empty);
  }

  keep(pred: boolean): Option<T> {
    return pred ? this : Option.empty;
  }

  truthy(): Option<T> {
    return this.filter(v => !!v);
  }

  reduce<U>(f: (u: U, t: T) => U, init: U): U {
    return this.caseOf({
      none: () => init,
      some: (t) => f(init, t)
    });
  }

  orElse<U>(other: Option<U>): Option<T | U> {
    return this.cataOption<T, U>(Option.some, other);
  }

  orElseLazy<U>(other: () => Option<U>): Option<T | U> {
    return this.cataOption<T, U>(Option.some, Option.some(undefined).flatMap(other));
  }

  forEach(f: (t: T) => void): void {
    this.caseOf({
      none: () => {},
      some: (t) => f(t)
    });
  }

  cataOption<U, V>(f: (t: T) => Option<U>, other: Option<V>): Option<U | V> {
    return new Option<U | V>(new CataCaseOf<T, U, V>(this._caseOf, f, other));
  }

  cata<U, V>(f: (t: T) => U, def: V): U | V {
    return this.caseOf({
      none: () => def,
      some: (t) => f(t)
    });
  }

  cataLazy<U, V>(f: (t: T) => U, def: () => V): U | V {
    return this.caseOf({
      none: () => def(),
      some: (t) => f(t)
    });
  }

  toEither<L>(l: L): Either<L, T> {
    return this.caseOf({
      none: () => Either.left<L, T>(l),
      some: (t) => Either.right<L, T>(t)
    });
  }

  toArray(): Array<T> {
    return this.caseOf({
      none: () => [],
      some: (t) => [t]
    });
  }

  [Symbol.iterator](): Iterator<T> {
    return new OptionIterator(this);
  }

  static flatten<T>(op: Option<T | Option<T>>): Option<T> {
    return op.flatMap(ot => {
      if (ot instanceof Option) {
        return ot;
      } else {
        return Option.some(ot);
      }
    });
  }

}

class OptionIterator<T> implements Iterator<T> {

  private _consumed = false;

  constructor(private readonly _op: Option<T>) {}

  next(): IteratorResult<T> {
    if (this._consumed || this._op.isEmpty()) {
      return {done: true} as IteratorResult<T>;
    } else {
      this._consumed = true;
      return {value: this._op.get(), done: false};
    }
  }

}

// tslint:disable-next-line:no-any
type WildCardCataCaseOf = CataCaseOf<any, any, any>;

class CataCaseOf<T, U, V> implements CaseOf<U | V> {

  private _memoize: Option<U | V>;

  constructor(
    private readonly _parentCaseOf: CaseOf<T>,
    private readonly _f: (t: T) => Option<U>,
    private readonly _other: Option<V>) {
  }

  run<S, N>(pattern: OptionPattern<U, S, N>): S | N {
    if (!this._memoize) {
      if (this._parentCaseOf instanceof CataCaseOf) {
        this._memoize = this._iterate(this._parentCaseOf).caseOf({
          none: () => this._other,
          some: (t) => this._f(t)
        });
      } else {
        this._memoize = this._resolve();
      }
    }
    return this._memoize.caseOf(pattern);
  }

  private _resolve(): Option<U | V> {
    return this._parentCaseOf.run({
      none: () => this._other,
      some: (t) => this._f(t)
    });
  }

  private _iterate(cataCaseOf: WildCardCataCaseOf): Option<T> {
    let arr: Array<WildCardCataCaseOf> = [cataCaseOf];
    let currentCaseOf = cataCaseOf;
    while (currentCaseOf._parentCaseOf instanceof CataCaseOf) {
      currentCaseOf = currentCaseOf._parentCaseOf;
      arr.push(currentCaseOf);
    }
    const last = arr[arr.length - 1];
    let current = last._resolve();
    for (let i = arr.length - 2; i >= 0; i--) {
      current = current.caseOf({
        none: () => arr[i]._other,
        some: (t) => arr[i]._f(t)
      });
    }
    return current;
  }

}
