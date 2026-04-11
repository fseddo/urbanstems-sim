export const capitalizeString = (string: string) =>
  string
    .split(' ')
    .map((word) => word[0].toUpperCase().concat(word.slice(1)))
    .join(' ');
