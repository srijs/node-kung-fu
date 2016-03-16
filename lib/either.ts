import {Option} from './option';

export class Either<L, R> {
  constructor(public choose: <X>(lf: (l: L) => X, rf: (r: R) => X) => X) {}

  static left<L, R>(l: L): Either<L, R> {
    return new Either(<X>(lf: (l: L) => X, rf: (r: R) => X) => lf(l));
  }

  static right<L, R>(r: R): Either<L, R> {
    return new Either(<X>(lf: (l: L) => X, rf: (r: R) => X) => rf(r));
  }

  isLeft(): boolean {
    return this.choose(() => true, () => false);
  }

  isRight(): boolean {
    return this.choose(() => false, () => true);
  }

  getLeft(): L {
    return this.choose(l => l, function (): L {
      throw new TypeError('left is empty');
    });
  }

  getRight(): R {
    return this.choose(function (): R {
      throw new TypeError('right is empty');
    }, r => r);
  }

  map<X, Y>(mapL: (l: L) => X, mapR: (r: R) => Y): Either<X, Y> {
    if (this.isLeft()) {
      return Either.left<X, Y>(mapL(this.getLeft()));
    } else {
      return Either.right<X, Y>(mapR(this.getRight()));
    }
  }

  mapLeft<X>(mapL: (l: L) => X): Either<X, R> {
    return this.map(mapL, r => r);
  }

  mapRight<X>(mapR: (l: R) => X): Either<L, X> {
    return this.map(l => l, mapR);
  }

  toOption(): Option<R> {
    if (this.isRight()) {
      return Option.some(this.getRight());
    } else {
      return Option.none<R>();
    }
  }
}
