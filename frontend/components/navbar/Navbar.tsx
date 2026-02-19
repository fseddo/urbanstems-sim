import Image from 'next/image';
import { forwardRef } from 'react';
import { HiOutlineChevronDown } from 'react-icons/hi';
import { PiMagnifyingGlass, PiUser } from 'react-icons/pi';
import { CartIcon } from '../icons/CartIcon';
import { NavNotificationBanner } from './NavNotificationBanner';
import { IconType } from 'react-icons';
import Link from 'next/link';
import { PrefetchLink } from '../PrefetchLink';

export type NavSectionItem = { label: string; Icon?: IconType };

const LEFT_SECTION_ITEMS: NavSectionItem[] = [
  { label: 'Shop', Icon: HiOutlineChevronDown },
  { label: 'Fall' },
  { label: 'Flowers' },
  { label: 'Plants' },
  { label: 'Same-Day Delivery' },
  { label: 'Sale' },
];

export const Navbar = forwardRef<HTMLElement>((props, ref) => {
  return (
    <header ref={ref} className='border-b'>
      <NavNotificationBanner />
      <div className='relative mx-auto flex items-center justify-between px-[clamp(34px,15.3vw,40px)] py-[19px]'>
        {/* Left Navigation - Hidden on mobile, shown as dropdown */}
        <div className='font-crimson text-brand-primary hidden gap-[clamp(18px,15.3vw,19px)] text-sm text-[clamp(13px,1.2vw,18px)] lg:flex'>
          <div className='flex items-center gap-1.5'>
            <div>Shop</div>{' '}
            <div>
              <HiOutlineChevronDown size={13} />
            </div>
          </div>
          <div>Fall</div>
          <PrefetchLink
            className='hover:opacity-60'
            href='/collections/flowers'
          >
            Flowers
          </PrefetchLink>
          <PrefetchLink className='hover:opacity-60' href='/collections/plants'>
            Plants
          </PrefetchLink>
          <div>Same-Day Delivery</div>
          <div>Sale</div>
        </div>

        {/* Mobile Menu Button */}
        <div className='lg:hidden'>
          <button className='text-brand-primary'>☰</button>
        </div>

        {/* Centered Logo */}
        <div className='absolute left-1/2 -translate-x-1/2 transform'>
          <Link href='/'>
            <Image
              width={167}
              height={100}
              alt='logo'
              src='/logo.svg'
              className='w-[clamp(167px,15.3vw,214px)]'
            />
          </Link>
        </div>

        {/* Right Navigation - Hidden on mobile, shown as dropdown */}
        <div className='font-crimson text-brand-primary hidden items-center gap-4.5 text-[clamp(13px,1.2vw,18px)] lg:flex'>
          <div>Subscriptions</div>
          <div>Rewards</div>
          <div>
            <PiMagnifyingGlass size={19} />
          </div>
          <div>
            <PiUser size={19} />
          </div>
          <div>
            <CartIcon />
          </div>
        </div>

        {/* Mobile Right Placeholder */}
        <div className='w-6 md:hidden'></div>
      </div>
    </header>
  );
});

Navbar.displayName = 'Navbar';
