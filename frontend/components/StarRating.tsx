import Image from 'next/image';

interface StarRatingProps {
  rating?: number | string | null;
  maxStars?: number;
  size?: number;
}

export const StarRating = ({
  rating,
  maxStars = 5,
  size = 14,
}: StarRatingProps) => {
  if (!rating) return null;

  const numericRating =
    typeof rating === 'string' ? parseFloat(rating) : rating;

  const stars = [];

  for (let i = 1; i <= maxStars; i++) {
    const difference = numericRating - (i - 1);

    let starType: 'full' | 'half' | 'empty';
    if (difference >= 1) {
      starType = 'full';
    } else if (difference >= 0.5) {
      starType = 'half';
    } else {
      starType = 'empty';
    }

    stars.push(
      <Image
        key={i}
        src={`/${starType}_star.svg`}
        alt={`${starType} star`}
        width={size}
        height={size}
        className='inline-block'
      />
    );
  }

  return <div className='flex items-center gap-1'>{stars}</div>;
};
