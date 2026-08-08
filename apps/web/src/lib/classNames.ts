/**
 * CSS Modules class lookups are typed `string | undefined` under
 * noUncheckedIndexedAccess — this avoids the friction of building
 * classNames via template-literal interpolation at every call site.
 */
export function classNames(...values: (string | false | null | undefined)[]): string {
  return values.filter((v): v is string => Boolean(v)).join(" ");
}
