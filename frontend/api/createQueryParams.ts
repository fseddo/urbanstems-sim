export const createQueryParams = <T extends Record<string, unknown>>(
  params: T
) => {
  const searchParams = new URLSearchParams();
  const key: Record<string, unknown> = {};

  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null) return;
    if (Array.isArray(v)) {
      if (v.length === 0) return;
      v.forEach((item) => searchParams.append(k, String(item)));
      key[k] = v;
    } else {
      searchParams.append(k, String(v));
      key[k] = v;
    }
  });

  return {
    queryString: searchParams.toString() ? `?${searchParams.toString()}` : '',
    key,
  };
};
