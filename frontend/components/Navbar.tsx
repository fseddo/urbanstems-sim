import Image from 'next/image';
import { HiOutlineChevronDown } from 'react-icons/hi';
import { PiMagnifyingGlass, PiUser } from 'react-icons/pi';

export const Navbar = () => {
  return (
    <header className='border-b'>
      <div className='bg-brand-primary font-crimson w-full justify-center pt-1.5 pb-[7px] text-center text-base text-white'>
        <div className='mt-[3px]'>
          Fall Florals Have Arrived. Shop New Season Bouquets Today!{' '}
          <span className='underline'>Shop Now</span>
        </div>
      </div>
      <div className='relative mx-auto flex items-center justify-between px-11 py-5.5'>
        {/* Left Navigation - Hidden on mobile, shown as dropdown */}
        <div className='font-crimson text-brand-primary hidden gap-5.5 text-sm lg:flex xl:text-lg'>
          <div className='flex items-center gap-1.5'>
            <div>Shop</div>{' '}
            <div>
              <HiOutlineChevronDown size={13} />
            </div>
          </div>
          <div>Fall</div>
          <div>Flowers</div>
          <div>Plants</div>
          <div>Same-Day Delivery</div>
          <div>Sale</div>
        </div>

        {/* Mobile Menu Button */}
        <div className='lg:hidden'>
          <button className='text-brand-primary'>☰</button>
        </div>

        {/* Centered Logo */}
        <div className='absolute left-1/2 -translate-x-1/2 transform'>
          <Image
            width={167}
            height={100}
            alt='logo'
            src='/logo.svg'
            className='w-[167px] lg:w-[167px] 2xl:w-[214px]'
          />
        </div>

        {/* Right Navigation - Hidden on mobile, shown as dropdown */}
        <div className='font-crimson text-brand-primary hidden items-center gap-4 text-sm lg:flex xl:text-lg'>
          <div>Subscriptions</div>
          <div>Rewards</div>
          <div>
            <PiMagnifyingGlass size={16} />
          </div>
          <div>
            <PiUser size={16} />
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
};

export default function CartIcon() {
  return (
    <svg
      width='15'
      height='16'
      viewBox='0 0 15 16'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
      className='block h-auto'
    >
      <path
        fillRule='evenodd'
        clipRule='evenodd'
        d='M10.1659 3.42857H13.9832H15L14.8159 4.42857L12.6857 16H2.22857L0.177273 4.42857L0 3.42857H1.01559H4.59668V1V0H5.59668H9.16586H10.1659V1V3.42857ZM5.59668 3.42857V1H9.16586V3.42857H5.59668ZM13.7991 4.42857L11.853 15H3.06689L1.19286 4.42857H13.7991Z'
        fill='currentColor'
      ></path>
    </svg>
  );
}
