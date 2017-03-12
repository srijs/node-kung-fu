import {Either} from './either';

export type OptionPattern<T, X> = {
  none: () => X,
  some: (t: T) => X
};

export class Option<T> {

  constructor(private readonly _caseOf: <X>(pattern: OptionPattern<T, X>) => X) {}

  static some<T>(t: T): Option<T> {
    return new Option<T>(<X>(pattern: OptionPattern<T, X>) => {
      return pattern.some(t);
    });
  }

  static someLazy<T>(f: () => T): Option<T> {
    let memoize: T;
    return new Option<T>(<X>(pattern: OptionPattern<T, X>) => {
      if (!memoize) {
        memoize = f();
      }
      return pattern.some(memoize);
    });
  }

  static none<T>(): Option<T> {
    return new Option(<X>(pattern: OptionPattern<T, X>) => pattern.none());
  }

  static empty: Option<never> = Option.none<never>();

  static option<T>(t: T): Option<T> {
    return t ? Option.some(t) : Option.empty;
  }

  static optionLazy<T>(f: () => T): Option<T> {
    return Option.some(undefined).flatMap(() => {
      const t = f();
      if (t) {
        return Option.some(t);
      } else {
        return Option.empty;
      }
    });
  }

  caseOf<X>(pattern: OptionPattern<T, X>): X {
    return this._caseOf(pattern);
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
    return this.caseOf<T | U>({
      none: () => def,
      some: (t) => t
    });
  }

  getOrLazy<U>(def: () => U): T | U {
    return this.caseOf<T | U>({
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
    return this.cataOption<U>(f, () => Option.empty);
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

  orElse<U extends T>(other: Option<U>): Option<T> {
    return this.orElseLazy(() => other);
  }

  orElseLazy<U extends T>(other: () => Option<U>): Option<T> {
    return this.cataOption<T>(Option.some, other);
  }

  forEach(f: (t: T) => void): void {
    this.caseOf({
      none: () => {},
      some: (t) => f(t)
    });
  }

  cataOption<U>(f: (t: T) => Option<U>, other: () => Option<U>): Option<U> {
    let memoize: Option<U>;
    return new Option<U>(<X>(newpattern: OptionPattern<U, X>) => {
      if (!memoize) {
        memoize = this.caseOf({
          none: () => other(),
          some: (t) => f(t)
        });
      }
      return memoize.caseOf({
        some: (val: U) => newpattern.some(val),
        none: () => newpattern.none()
      });
    });
  }

  cata<U>(f: (t: T) => U, def: U): U {
    return this.caseOf({
      none: () => def,
      some: (t) => f(t)
    });
  }

  cataLazy<U>(f: (t: T) => U, def: () => U): U {
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
