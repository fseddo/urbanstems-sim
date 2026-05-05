// Warm the browser's HTTP cache for a batch of image URLs so a subsequent
// <img src=...> renders instantly. Returns a Promise that resolves once
// every image has loaded *or* errored — a single bad URL doesn't reject
// the batch (or break navigation).
//
// Two usage modes by the caller's choice:
//   - Fire-and-forget for ambient warmup: `prefetchImages(urls)` — the
//     Promise floats away, browser caching happens regardless.
//   - Awaitable for route loaders that want to block navigation until
//     images are decoded: `await prefetchImages(urls)`.

export const prefetchImages = async (
  urls: readonly string[]
): Promise<void> => {
  await Promise.all(
    urls.map(
      (url) =>
        new Promise<void>((resolve) => {
          const img = new Image();
          img.onload = () => resolve();
          img.onerror = () => resolve();
          img.src = url;
        })
    )
  );
};
