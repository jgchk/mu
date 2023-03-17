import { error } from '@sveltejs/kit';

export const paramNumber = (val: string, errorMessage: string) => {
  const parsed = parseInt(val);
  if (isNaN(parsed)) {
    throw error(400, errorMessage);
  }
  return parsed;
};
