/**
 * Joins conditional class names together, skipping falsy values.
 * A minimal stand-in for `clsx` so we don't need an extra dependency.
 */
export function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}
