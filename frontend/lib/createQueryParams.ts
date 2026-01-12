export const createQueryParams = <T extends Record<string, unknown>>(
  params: T
) => {
  const searchParams = new URLSearchParams();
  const key: Record<string, unknown> = {};

  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null) {
      searchParams.append(k, String(v));
      key[k] = v;
    }
  });

  return {
    queryString: searchParams.toString() ? `?${searchParams.toString()}` : '',
    key,
  };
};
