import { twMerge, ClassNameValue } from 'tailwind-merge';

export const tw = (...inputs: ClassNameValue[]) => twMerge(inputs);
