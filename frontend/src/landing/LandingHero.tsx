import { AnimatedButton } from '../common/AnimatedButton';
import { imageAtWidth } from '../common/utils/imageAtWidth';
import { tw } from '../common/utils/tw';

const DESKTOP_HERO =
  'https://urbanstems.com/cdn/shop/files/5.4_homepage.jpg?v=1774048366';
const MOBILE_HERO =
  'https://urbanstems.com/cdn/shop/files/Subscribe_and_Save_aca06fc5-b077-4a18-9a02-793d059baf8e.jpg?v=1774969105';

export const LandingHero = () => {
  return (
    <section
      className={tw(
        'relative flex flex-col justify-end',
        'h-[503px] w-full min-[1020px]:h-[585px]'
      )}
    >
      <picture>
        <source
          media='(min-width: 1020px)'
          srcSet={imageAtWidth(DESKTOP_HERO, 1800)}
        />
        <img
          src={imageAtWidth(MOBILE_HERO, 832)}
          className='absolute inset-0 h-full w-full object-cover'
          fetchPriority='high'
          loading='eager'
        />
      </picture>
      <div className='bg-hero-overlay absolute inset-0' />

      <img
        src='/2025_NYT_WIRECUTTER_OUR-PICK_LOGO_BLACK_RGB.png'
        alt='NY Times Wirecutter Our Pick'
        className={tw(
          'absolute top-[3%] left-[6%] min-[1020px]:left-[4%]',
          'h-auto w-[96px] min-[1020px]:w-[116px]',
          'transition-[width,left] duration-300'
        )}
      />
      <div className='px-page relative flex flex-col gap-2 pb-16 text-white'>
        <div className='font-crimson text-shadow text-hero-headline'>
          Spring In Full Bloom
        </div>

        <div className='text-shadow text-hero-subtext w-[37ch]'>
          Fresh seasonal bouquets, thoughtfully arranged for spring hosting,
          celebrating, and effortless gifting.
        </div>
        <AnimatedButton
          to='/collections/$slug'
          params={{ slug: 'new-the-spring-collection' }}
          label='SHOP SPRING FLOWERS'
          className='mt-3'
        />
      </div>
    </section>
  );
};
