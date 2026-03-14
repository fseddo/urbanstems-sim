export const capitalizeString = (string: string | undefined) =>
  string
    ?.split(' ')
    ?.map((word) => word[0].toUpperCase().concat(word.slice(1)))
    ?.join(' ');
