import { VideoActionButton } from './VideoActionButton';

export const LandingVideo = () => {
  return (
    <section
      className='relative w-full bg-brand-primary'
      style={{ height: 'calc(100dvh - var(--navbar-height))' }}
    >
      <video
        src='/main_page.mp4'
        autoPlay
        loop
        muted
        preload='auto'
        playsInline
        className='h-full w-full object-cover opacity-0 transition-opacity duration-500'
        onCanPlay={(e) => e.currentTarget.classList.remove('opacity-0')}
      />
      <img
        src='/2025_NYT_WIRECUTTER_OUR-PICK_LOGO_BLACK_RGB.png'
        alt='NY Times Wirecutter Our Pick'
        width={140}
        height={140}
        className='absolute top-10 left-10'
      />
      <div className='absolute bottom-20 left-20 flex flex-col gap-6 text-white'>
        <div className='flex flex-col gap-3'>
          <div className='text-sm font-bold'>EMRBACE THE MAGIC</div>
          <div className='font-crimson text-6xl'>The Flowerlore World</div>
        </div>

        <div className='w-[37ch] text-lg'>
          Our newest limited-edition collection is designed to be more than
          flowers, it's energy, gifted. Every bouquet comes with a custom tarot
          card to guide and set intention.
        </div>
        <div className='flex gap-3'>
          <VideoActionButton
            label='SHOP FLOWERLORE'
            href='/collections/flowerlore'
          />
          <VideoActionButton label='SHOP ALL FLOWERS' href='/collections/all' />
        </div>
      </div>
    </section>
  );
};
