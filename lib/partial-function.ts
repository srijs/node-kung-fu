import {Option} from './option';

export type PartialFunction<From, To> = (from: From) => Option<To>;

export module PartialFunction {
  export function empty<From, To>(from: From) {
    return Option.none<To>();
  }

  export function compose<From, To>(
    f: PartialFunction<From, To>,
    g: PartialFunction<From, To>
  ): PartialFunction<From, To> {
    return (from: From) => f(from).caseOf<Option<To>>({
      some: (to) => Option.some(to),
      none: () => g(from)
    });
  }

  export function concat<From, To>(
    fs: Array<PartialFunction<From, To>>
  ): PartialFunction<From, To> {
    return fs.reduce<PartialFunction<From, To>>(PartialFunction.compose, PartialFunction.empty);
  }
}
