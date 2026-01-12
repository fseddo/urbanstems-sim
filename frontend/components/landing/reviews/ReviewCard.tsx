import { Occasion } from '@/types/api';
import Image from 'next/image';

export const ReviewCard = ({
  occasion,
  imgSrc1,
  imgSrc2,
  imgSrc3,
}: {
  occasion: Occasion;
  imgSrc1: string;
  imgSrc2: string;
  imgSrc3: string;
}) => {
  const imgSrc = occasion.image_src;
  return (
    <div className='flex flex-shrink-0 flex-col gap-4'>
      <div className='group relative h-[400px] w-[450px]'>
        {/* Front image - upright */}
        <img
          className='absolute top-10 left-28 z-30 h-[340px] w-[230px] rounded-lg object-cover shadow-lg transition-all duration-800 group-hover:top-5'
          src={imgSrc1}
        />

        {/* Middle image - tilted behind */}
        <img
          className='absolute top-6 left-18 z-20 h-[340px] w-[230px] rounded-lg object-cover shadow-lg transition-all duration-800 group-hover:top-10 group-hover:left-8'
          src={imgSrc2}
          style={{ transform: 'rotate(-10deg)' }}
        />

        {/* Back image - tilted behind */}
        <img
          className='absolute top-6 left-38 z-10 h-[340px] w-[230px] rounded-lg object-cover shadow-lg transition-all duration-800 group-hover:top-10 group-hover:left-48'
          src={imgSrc3}
          style={{ transform: 'rotate(10deg)' }}
        />
      </div>

      <div className='flex flex-col items-center gap-4'>
        <div className='flex flex-col items-center gap-2'>
          <div className='font-crimson flex items-center justify-center text-3xl'>
            Janna
          </div>
          <div className='text-foreground/60 text-sm'>
            Verified Buyer - New York, NY
          </div>
        </div>

        <div className='flex flex-col items-center gap-2'>
          <div className='flex gap-1'>
            {new Array(5).fill(null).map((_, i) => (
              <Image
                key={i}
                src='/full_star.svg'
                alt='Full star rating'
                width={15}
                height={15}
              />
            ))}
          </div>
          <div className='font-crimson flex w-[450px] text-center text-lg italic'>
            “Finally an online florist with product that you aren't going to see
            the exact same thing at a dozen other online florists. UrbanStems by
            far offered the best selection, most reasonable pricing and their
            customer service is impeccable!!!”
          </div>
        </div>
      </div>
    </div>
  );
};
