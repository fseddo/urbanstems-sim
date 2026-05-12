import { imageAtWidth } from '../common/utils/imageAtWidth';
import { tw } from '../common/utils/tw';

const HERO_IMAGE = 'https://urbanstems.com/cdn/shop/files/About.jpg?v=1728402058';

export const AboutHero = () => {
  return (
    <section className='flex w-full flex-col-reverse lg:flex-row'>
      <div
        className={tw(
          'flex flex-col justify-end',
          'px-page lg:w-1/3',
          'pt-10 pb-12 lg:py-20'
        )}
      >
        <h1 className='font-crimson text-about-us-header font-medium leading-tight'>
          About <span className='italic'>Us</span>
        </h1>
        <p className='text-foreground/80 mt-4 text-[14px] leading-[1.75] lg:text-[16px]'>
          We're making sending flowers a personalized, modern experience.
          UrbanStems is a seamless, one-of-a-kind flower delivery service that
          is helping to make anyone's day from coast to coast.
        </p>
      </div>
      <div className='lg:w-2/3'>
        <img
          src={imageAtWidth(HERO_IMAGE, 1800)}
          alt='UrbanStems delivery van and a bouquet'
          className='aspect-[500/280] w-full object-cover lg:aspect-[1152/607]'
          fetchPriority='high'
          loading='eager'
        />
      </div>
    </section>
  );
};
