import {Option} from './option';

export type EitherPattern<L, R, X, Y> = {
  left: (l: L) => X,
  right: (r: R) => Y
};

interface CaseOf<L, R> {
  run<X, Y>(pattern: EitherPattern<L, R, X, Y>): X | Y;
}

class LeftCaseOf<L, R> implements CaseOf<L, R> {

  constructor(private readonly _left: L) {}

  run<X, Y>(pattern: EitherPattern<L, R, X, Y>): X {
    return pattern.left(this._left);
  }

}

class RightCaseOf<L, R> implements CaseOf<L, R> {

  constructor(private readonly _right: R) {}

  run<X, Y>(pattern: EitherPattern<L, R, X, Y>): Y {
    return pattern.right(this._right);
  }

}

export class Either<L, R> {

  private constructor(private readonly _caseOf: CaseOf<L, R>) {}

  static left<L, R>(l: L): Either<L, R> {
    return new Either(new LeftCaseOf<L, R>(l));
  }

  static right<L, R>(r: R): Either<L, R> {
    return new Either(new RightCaseOf<L, R>(r));
  }

  caseOf<X, Y>(pattern: EitherPattern<L, R, X, Y>): X | Y {
    return this._caseOf.run(pattern);
  }

  isLeft(): boolean {
    return this.caseOf({
      left: () => true,
      right: () => false
    });
  }

  isRight(): boolean {
    return this.caseOf({
      left: () => false,
      right: () => true
    });
  }

  getLeft(): L {
    return this.caseOf({
      left: (l) => l,
      right: (): L => {
        throw new TypeError('left is empty');
      }
    });
  }

  getRight(): R {
    return this.caseOf({
      left: (): R => {
        throw new TypeError('right is empty');
      },
      right: (r) => r
    });
  }

  map<X, Y>(mapL: (l: L) => X, mapR: (r: R) => Y): Either<X, Y> {
    return this.flatMap(l => Either.left<X, Y>(mapL(l)), r => Either.right<X, Y>(mapR(r)));
  }

  mapLeft<X>(mapL: (l: L) => X): Either<X, R> {
    return this.map(mapL, r => r);
  }

  mapRight<X>(mapR: (l: R) => X): Either<L, X> {
    return this.map(l => l, mapR);
  }

  flatMapRight<X>(f: (val: R) => Either<L, X>): Either<L, X> {
    return this.flatMap(l => Either.left<L, X>(l), f);
  }

  flatMapLeft<X>(f: (val: L) => Either<X, R>): Either<X, R> {
    return this.flatMap(f, r => Either.right<X, R>(r));
  }

  flatMap<X, Y>(fl: (val: L) => Either<X, Y>, fr: (val: R) => Either<X, Y>): Either<X, Y> {
    return new Either<X, Y>(new FlatMapCaseOf(this._caseOf, fl, fr));
  }

  toOption(): Option<R> {
    return Option.empty.orElseLazy(() => this.caseOf({
      left: () => Option.empty,
      right: (r) => Option.some(r)
    }));
  }

}

// tslint:disable-next-line:no-any
type WildCardFlatMapCaseOf = FlatMapCaseOf<any, any, any, any>;

class FlatMapCaseOf<L, R, X, Y> implements CaseOf<X, Y> {

  private _memoize: Either<X, Y>;

  constructor(
    private readonly _parentCaseOf: CaseOf<L, R>,
    private readonly _fl: (val: L) => Either<X, Y>,
    private readonly _fr: (val: R) => Either<X, Y>) {
  }

  run<A, B>(pattern: EitherPattern<X, Y, A, B>): A | B {
    if (!this._memoize) {
      if (this._parentCaseOf instanceof FlatMapCaseOf) {
        this._memoize = this._iterate(this._parentCaseOf).caseOf({
          left: (l) => this._fl(l),
          right: (r) => this._fr(r)
        });
      } else {
        this._memoize = this._resolve();
      }
    }
    return this._memoize.caseOf(pattern);
  }

  private _resolve(): Either<X, Y> {
    return this._parentCaseOf.run({
      left: (l) => this._fl(l),
      right: (r) => this._fr(r)
    });
  }

  private _iterate(cataCaseOf: WildCardFlatMapCaseOf): Either<L, R> {
    let arr: Array<WildCardFlatMapCaseOf> = [cataCaseOf];
    let currentCaseOf = cataCaseOf;
    while (currentCaseOf._parentCaseOf instanceof FlatMapCaseOf) {
      currentCaseOf = currentCaseOf._parentCaseOf;
      arr.push(currentCaseOf);
    }
    const last = arr[arr.length - 1];
    let current = last._resolve();
    for (let i = arr.length - 2; i >= 0; i--) {
      current = current.caseOf({
        left: (l) => arr[i]._fl(l),
        right: (r) => arr[i]._fr(r)
      });
    }
    return current;
  }

}
