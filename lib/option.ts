import {Either} from './either';

export type OptionPattern<T, X> = {
  none: () => X,
  some: (t: T) => X
}

export class Option<T> {
  constructor(public caseOf: <X>(pattern: OptionPattern<T, X>) => X) {}

  static some<T>(t: T): Option<T> {
    return new Option<T>(<X>(pattern: OptionPattern<T, X>) => pattern.some(t));
  }

  static none<T>(): Option<T> {
    return new Option(<X>(pattern: OptionPattern<T, X>) => pattern.none());
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

  get(): T {
    return this.caseOf({
      none: (): T => {
        throw new TypeError('option is empty');
      },
      some: (t) => t
    });
  }

  map<U>(f: (t: T) => U): Option<U> {
    return this.caseOf({
      some: (t) => Option.some(f(t)),
      none: () => Option.none<U>()
    });
  }

  map2<U, X>(other: Option<U>, f: (t: T, u: U) => X): Option<X> {
    return this.caseOf({
      none: () => Option.none<X>(),
      some: (t) => other.caseOf({
        none: () => Option.none<X>(),
        some: (u) => Option.some(f(t, u))
      })
    });
  }

  flatMap<U>(f: (t: T) => Option<U>): Option<U> {
    return this.caseOf({
      none: () => Option.none<U>(),
      some: (t) => f(t)
    });
  }

  toEither<L>(l: L): Either<L, T> {
    return this.caseOf({
      none: () => Either.left<L, T>(l),
      some: (t) => Either.right<L, T>(t)
    });
  }
}
