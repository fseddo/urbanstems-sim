import { VideoActionButton } from './VideoActionButton';

export const LandingVideo = () => {
  return (
    <section
      className='relative w-full'
      style={{ height: 'calc(100dvh - var(--navbar-height))' }}
    >
      <img
        src='https://urbanstems.com/cdn/shop/files/3.16_HERO.jpg?v=1772491026&width=1800'
        className='h-full w-full object-cover'
        fetchPriority='high'
        loading='eager'
      />
      <div className='absolute inset-0 bg-black/70 md:bg-black/30' />

      <img
        src='/2025_NYT_WIRECUTTER_OUR-PICK_LOGO_BLACK_RGB.png'
        alt='NY Times Wirecutter Our Pick'
        width={140}
        height={140}
        className='absolute top-10 left-10'
      />
      <div className='absolute bottom-20 left-20 flex flex-col gap-6 text-white'>
        <div className='flex flex-col gap-3'>
          <div className='font-crimson text-shadow text-6xl'>
            Spring In Full Bloom
          </div>
        </div>

        <div className='text-shadow w-[37ch] text-lg'>
          Fresh seasonal bouquets, thoughtfully arranged for spring hosting,
          celebrating, and effortless gifting.
        </div>
        <div className='flex gap-3'>
          <VideoActionButton label='ORDER NOW' href='/collections/flowers' />
        </div>
      </div>
    </section>
  );
};
