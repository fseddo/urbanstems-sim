// Strip a trailing "| UrbanStems" off scraped page_title strings. Stopgap
// until the source data has the brand removed.
export const stripBrandSuffix = (title: string) =>
  title.replace(/\s*\|\s*UrbanStems\s*$/i, '');
