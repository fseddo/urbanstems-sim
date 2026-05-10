import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';
import { Review } from '@/api/reviews/Review';

// Locally-submitted reviews. <ReviewModal> writes here on a successful
// submit; <ProductReviews> filters by product_slug and prepends to the
// server list. Never round-trips to the backend — the sim's review
// submission is intentionally chaos-isolated to the user's device.
export type LocalReview = Omit<Review, 'id'> & { id: string };

// Render-target type for <ReviewCard>: every displayed field is shared with
// the server `Review`; only `id` widens (number → number | string) because
// local reviews use uuids.
export type DisplayReview = Review | LocalReview;

export const localReviewsAtom = atomWithStorage<LocalReview[]>(
  'urbanstems-local-reviews',
  [],
  undefined,
  { getOnInit: true }
);

export const addLocalReviewAtom = atom(
  null,
  (get, set, review: LocalReview) => {
    set(localReviewsAtom, [review, ...get(localReviewsAtom)]);
  }
);

export const removeLocalReviewAtom = atom(null, (get, set, id: string) => {
  set(
    localReviewsAtom,
    get(localReviewsAtom).filter((r) => r.id !== id)
  );
});
