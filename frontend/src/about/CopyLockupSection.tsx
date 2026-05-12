import { ReactNode } from 'react';
import { imageAtWidth } from '../common/utils/imageAtWidth';
import { tw } from '../common/utils/tw';

type CopyLockupSectionProps = {
  headline: string;
  imageSrc: string;
  imageAlt: string;
  imageSide: 'left' | 'right';
  children: ReactNode;
};

export const CopyLockupSection = ({
  headline,
  imageSrc,
  imageAlt,
  imageSide,
  children,
}: CopyLockupSectionProps) => {
  return (
    <section className='px-page border-t py-10 lg:py-20'>
      <div
        className={tw(
          'flex flex-col gap-10 lg:gap-0',
          imageSide === 'left' ? 'lg:flex-row' : 'lg:flex-row-reverse'
        )}
      >
        <div className='lg:w-1/2'>
          <img
            src={imageAtWidth(imageSrc, 1400)}
            alt={imageAlt}
            loading='lazy'
            className='aspect-[864/915] w-full rounded-lg object-cover'
          />
        </div>
        <div
          className={tw(
            'flex flex-col justify-center lg:w-1/2',
            imageSide === 'left' ? 'lg:pl-[8.7%]' : 'lg:pr-[8.7%]'
          )}
        >
          <h2 className='font-crimson text-about-us-header font-medium leading-tight'>
            {headline}
          </h2>
          <div className='text-foreground/80 mt-4 text-[14px] leading-[1.75] lg:text-[16px]'>
            {children}
          </div>
        </div>
      </div>
    </section>
  );
};
