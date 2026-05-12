import { Link } from '@tanstack/react-router';
import { tw } from '../common/utils/tw';

export const AboutUs = () => {
  return (
    <section className='py-about-us flex w-full flex-col items-center gap-10 border-t px-4'>
      <header className='font-crimson text-about-us-header w-2/3 text-center leading-tight font-medium'>
        Curated for those with an eye for luxury, our bouquets are designed with{' '}
        <span className='italic'>style and sophistication</span> in the heart of{' '}
        <span className='whitespace-nowrap'>New York</span> and delivered
        nationwide.
      </header>
      <Link
        to='/about'
        className={tw(
          'hover:text-foreground/60 tracking-action flex font-extrabold underline underline-offset-6',
          'text-[12px] lg:text-[16px]'
        )}
      >
        LEARN MORE
      </Link>
    </section>
  );
};
