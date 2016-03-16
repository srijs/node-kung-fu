import {Either} from './either';

export class Option<T> {
  constructor(public fold: <X>(nil: () => X, cons: (t: T) => X) => X) {}

  static some<T>(t: T): Option<T> {
    return new Option(<X>(nil: X, cons: (t: T) => X) => cons(t));
  }

  static none<T>(): Option<T> {
    return new Option(<X>(nil: X, cons: (t: T) => X) => nil);
  }

  isDefined(): boolean {
    return this.fold(() => false, _ => true);
  }

  isEmpty(): boolean {
    return this.fold(() => true, _ => false);
  }

  get(): T {
    return this.fold<T>(function (): T {
      throw new TypeError('option is empty');
    }, t => t);
  }

  map<U>(f: (t: T) => U): Option<U> {
    if (this.isDefined()) {
      return Option.some(f(this.get()));
    } else {
      return Option.none<U>();
    }
  }

  map2<U, X>(other: Option<U>, f: (t: T, u: U) => X): Option<X> {
    if (this.isDefined() && other.isDefined()) {
      return Option.some(f(this.get(), other.get()));
    } else {
      return Option.none<X>();
    }
  }

  flatMap<U>(f: (t: T) => Option<U>): Option<U> {
    if (this.isDefined()) {
      return f(this.get());
    } else {
      return Option.none<U>();
    }
  }

  toEither<L>(l: L): Either<L, T> {
    if (this.isDefined()) {
      return Either.right<L, T>(this.get());
    } else {
      return Either.left<L, T>(l);
    }
  }
}
