export function regexLastIndexOf(str: string, regex: RegExp) {
  const matches = str.match(regex);
  if (!matches) {
    return -1;
  }
  const lastMatch = matches[matches.length - 1];
  return str.lastIndexOf(lastMatch);
}
