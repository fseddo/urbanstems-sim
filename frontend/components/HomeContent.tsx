'use client';

import Image from 'next/image';
import { RefObject, useState } from 'react';
import { useSpring, animated } from '@react-spring/web';
import { useElementHeight } from '@/hooks/useElementHeight';

interface HomeContentProps {
  navbarRef: RefObject<HTMLElement | null>;
}

export const HomeContent = ({ navbarRef }: HomeContentProps) => {
  const navbarHeight = useElementHeight(navbarRef);
  const videoHeight =
    navbarHeight > 0 ? `calc(100vh - ${navbarHeight}px)` : '100vh';

  return (
    <div className='relative w-full' style={{ height: videoHeight }}>
      <video
        src='/main_page.mp4'
        autoPlay
        loop
        muted
        preload='auto'
        playsInline
        className='h-full w-full object-cover'
      />
      <Image
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
          <MovieNavButton label='SHOP FLOWERLORE' onClick={() => {}} />
          <MovieNavButton label='SHOP ALL FLOWERS' onClick={() => {}} />
        </div>
      </div>
    </div>
  );
};

const MovieNavButton = (props: { onClick: () => void; label: string }) => {
  const [isHovered, setIsHovered] = useState(false);

  const springProps = useSpring({
    backgroundColor: isHovered ? 'transparent' : 'white',
    borderColor: isHovered ? 'white' : 'transparent',
    color: isHovered ? 'white' : 'black',
    config: { tension: 100, friction: 10 },
  });

  return (
    <animated.button
      onClick={props.onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={springProps}
      className='rounded-sm border px-8 py-5 text-base font-extrabold tracking-[2px] opacity-90 shadow-lg'
    >
      {props.label}
    </animated.button>
  );
};
