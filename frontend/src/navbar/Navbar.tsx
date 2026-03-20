import { forwardRef } from 'react';
import { HiOutlineChevronDown } from 'react-icons/hi';
import { PiMagnifyingGlass } from 'react-icons/pi';
import { NavNotificationBanner } from './NavNotificationBanner';
import { Link } from '@tanstack/react-router';
import { IconType } from 'react-icons';
import { CartIcon } from '../common/icons/CartIcon';

export type NavSectionItem = { label: string; Icon?: IconType };

export const Navbar = forwardRef<HTMLElement>((props, ref) => {
  return (
    <header
      ref={ref}
      className='bg-background fixed top-0 right-0 left-0 z-50 border-b shadow-xs transition-transform duration-300'
    >
      <NavNotificationBanner />
      <div className='relative mx-auto flex items-center justify-between px-[clamp(34px,15.3vw,40px)] py-4.75'>
        {/* Left Navigation - Hidden on mobile, shown as dropdown */}
        <div className='font-crimson text-brand-primary hidden gap-[clamp(18px,15.3vw,19px)] text-sm text-[clamp(13px,1.2vw,18px)] lg:flex'>
          <div className='flex items-center gap-1.5'>
            <div>Shop</div>
            <div>
              <HiOutlineChevronDown size={13} />
            </div>
          </div>
          <Link
            className='hover:opacity-60'
            to='/collections/$slug'
            params={{ slug: 'new-the-spring-collection' }}
          >
            Spring
          </Link>
          <Link
            className='hover:opacity-60'
            to='/collections/$slug'
            params={{ slug: 'flowers' }}
          >
            Flowers
          </Link>
          <Link
            className='hover:opacity-60'
            to='/collections/$slug'
            params={{ slug: 'plants' }}
          >
            Plants
          </Link>
          <Link
            className='hover:opacity-60'
            to='/collections/$slug'
            params={{ slug: 'same-day' }}
          >
            Same-Day Delivery
          </Link>
          <Link
            className='hover:opacity-60'
            to='/collections/$slug'
            params={{ slug: 'sale' }}
          >
            Sale
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <div className='lg:hidden'>
          <button className='text-brand-primary'>☰</button>
        </div>

        {/* Centered Logo */}
        <div className='absolute left-1/2 -translate-x-1/2 transform'>
          <Link to='/'>
            <img
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
          <div>
            <PiMagnifyingGlass size={19} />
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
