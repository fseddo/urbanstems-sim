import { tw } from '@/src/common/utils/tw';

/* Frame is `w-review-card` + `aspect-[9/8]` (the 450×400 reference shape).
 * All image sizes/positions/hover offsets are percentages of that frame, so
 * the entire overlap composition scales with `--review-card-w` without
 * warping. Each percentage is derived from the original pixel value over
 * 450 (horizontal) or 400 (vertical) and rounded to the nearest whole. */
export const ReviewCard = ({
  name,
  location,
  rating,
  description,
  imgSrc1,
  imgSrc2,
  imgSrc3,
}: {
  rating: number;
  location: string;
  name: string;
  description: string;
  imgSrc1: string;
  imgSrc2: string;
  imgSrc3: string;
}) => {
  return (
    <div className='flex flex-shrink-0 flex-col items-center'>
      <div className={tw('group relative', 'w-review-card aspect-[9/8]')}>
        {/* Front image — upright, centered. The three-photo composition
         * shows the same delivery from different angles, so only the
         * front carries a descriptive alt; the other two are marked
         * decorative to avoid screen readers reading the same thing 3x. */}
        <img
          className={tw(
            'absolute z-30 rounded-lg object-cover shadow-lg',
            'h-[85%] w-[51%]',
            'top-[10%] left-[25%] transition-all duration-800 group-hover:top-[5%]'
          )}
          src={imgSrc1}
          alt={`Flowers from ${name}'s review`}
        />

        {/* Middle image — tilted left, slides further left on hover. */}
        <img
          className={tw(
            'absolute z-20 rounded-lg object-cover shadow-lg',
            'h-[85%] w-[51%]',
            'top-[6%] left-[16%] transition-all duration-800',
            'group-hover:top-[10%] group-hover:left-[7%]'
          )}
          src={imgSrc2}
          alt=''
          style={{ transform: 'rotate(-10deg)' }}
        />

        {/* Back image — tilted right, slides further right on hover. */}
        <img
          className={tw(
            'absolute z-10 rounded-lg object-cover shadow-lg',
            'h-[85%] w-[51%]',
            'top-[6%] left-[34%] transition-all duration-800',
            'group-hover:top-[10%] group-hover:left-[43%]'
          )}
          src={imgSrc3}
          alt=''
          style={{ transform: 'rotate(10deg)' }}
        />
      </div>
      <div className='font-crimson text-review-name text-center'>{name}</div>
      <div className='gap-review-card flex flex-col items-center'>
        <div className='text-foreground/60 text-review-caption'>
          {`Verified Buyer - ${location}`}
        </div>

        <div
          className='flex gap-1'
          role='img'
          aria-label={`${rating} out of 5 stars`}
        >
          {new Array(rating).fill(null).map((_, i) => (
            <img key={i} src='/full_star.svg' alt='' width={15} height={15} />
          ))}
        </div>
        <div className='font-crimson w-review-card text-review-description flex text-center italic'>
          {description}
        </div>
      </div>
    </div>
  );
};
