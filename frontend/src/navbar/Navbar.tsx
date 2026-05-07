import { Ref } from 'react';
import { HiOutlineChevronDown, HiOutlineMenu } from 'react-icons/hi';
import { PiMagnifyingGlass } from 'react-icons/pi';
import { IoClose } from 'react-icons/io5';
import { NavNotificationBanner } from './NavNotificationBanner';
import { ShopDropdown, useShopDropdownPrefetch } from './ShopDropdown';
import { SearchDropdown } from './SearchDropdown';
import { MobileSearchOverlay } from './MobileSearchOverlay';
import { MobileMenuPanel } from './MobileMenuPanel';
import { searchTermAtom, useNavbarPanel } from './navbarAtoms';
import { Link } from '@tanstack/react-router';
import { CartIcon } from '../common/icons/CartIcon';
import { useIsDesktop } from '../common/useIsDesktop';
import { withViewTransition } from '../common/withViewTransition';
import { NavLink } from './NavLink';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { cartCountAtom, cartOpenAtom } from '../cart/cartAtoms';

type NavItem = { slug: string; label: string };

const NAV_ITEMS: NavItem[] = [
  { slug: 'new-the-spring-collection', label: 'Spring' },
  { slug: 'flowers', label: 'Flowers' },
  { slug: 'plants', label: 'Plants' },
  { slug: 'same-day', label: 'Same-Day Delivery' },
  { slug: 'sale', label: 'Sale' },
];

export const Navbar = ({ ref }: { ref?: Ref<HTMLElement> }) => {
  const [shopOpen, setShopOpen] = useNavbarPanel('shop');
  const [searchOpen, setSearchOpen] = useNavbarPanel('search');
  const [mobileMenuOpen, setMobileMenuOpen] = useNavbarPanel('mobileMenu');
  const [searchTerm, setSearchTerm] = useAtom(searchTermAtom);
  const isDesktop = useIsDesktop();

  useShopDropdownPrefetch();

  // Opening search implicitly closes the shop dropdown via navbarPanelAtom's
  // single-active-panel encoding. Closing clears the term so the next open
  // starts fresh; focusing on open is handled by `autoFocus` on the input
  // (the input only mounts inside the searchOpen branch, so each open is
  // a fresh mount that fires autoFocus).
  const toggleSearch = () =>
    withViewTransition(() => {
      if (searchOpen) setSearchTerm('');
      setSearchOpen(!searchOpen);
    });

  const toggleMobileMenu = () =>
    withViewTransition(() => setMobileMenuOpen(!mobileMenuOpen));

  return (
    <header
      ref={ref}
      className='bg-background border-brand-primary fixed top-0 right-0 left-0 z-50 border-b shadow-xs transition-transform duration-300'
    >
      <NavNotificationBanner />
      <div onMouseLeave={() => setShopOpen(false)}>
        {searchOpen ? (
          /* Replace normal navbar content with the search input. Same shape
           * across viewports — only the dropdown panel below differs (see the
           * <SearchDropdown> vs <MobileSearchOverlay> branch further down).
           *
           * `viewTransitionName: 'search-bar'` pairs with the menu's search
           * button so opening search from the mobile menu morphs between
           * the two via the View Transitions API. */
          <div
            className='flex items-center gap-4 py-4.75 px-navbar'
            style={{ viewTransitionName: 'search-bar' }}
          >
            <PiMagnifyingGlass
              size={20}
              className='text-brand-primary shrink-0'
            />
            <input
              type='text'
              autoFocus
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder='Search Here'
              className='text-brand-primary font-mulish flex-1 bg-transparent text-xl outline-none placeholder:text-gray-400'
            />
            <button
              onClick={toggleSearch}
              className='border-brand-primary text-brand-primary flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full border transition-opacity hover:opacity-60'
              aria-label='Close search'
            >
              <IoClose size={18} />
            </button>
          </div>
        ) : (
          <div className='relative mx-auto flex items-center justify-between py-4.75 px-navbar'>
            {/* Left Navigation */}
            <div className='font-crimson text-brand-primary hidden gap-[clamp(18px,15.3vw,19px)] text-sm text-[clamp(13px,1.2vw,18px)] lg:flex'>
              <div
                className='flex cursor-pointer items-center gap-1.5'
                onMouseEnter={() => setShopOpen(true)}
              >
                <div>Shop</div>
                <div>
                  <HiOutlineChevronDown size={13} />
                </div>
              </div>
              {NAV_ITEMS.map((item) => (
                <NavLink
                  key={item.slug}
                  slug={item.slug}
                  label={item.label}
                  onMouseEnter={() => setShopOpen(false)}
                />
              ))}
            </div>

            {/* Mobile-only left cluster: menu + search. */}
            <div className='flex items-center gap-3 lg:hidden'>
              <button
                onClick={toggleMobileMenu}
                className='text-brand-primary cursor-pointer transition-opacity hover:opacity-60'
                aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
              >
                <HiOutlineMenu size={22} />
              </button>
              <button
                onClick={toggleSearch}
                className='text-brand-primary cursor-pointer transition-opacity hover:opacity-60'
                aria-label='Open search'
              >
                <PiMagnifyingGlass size={20} />
              </button>
            </div>

            {/* Centered Logo */}
            <div
              className='absolute left-1/2 -translate-x-1/2 transform'
              onMouseEnter={() => setShopOpen(false)}
            >
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

            {/* Right Navigation */}
            <div className='font-crimson text-brand-primary hidden items-center gap-4.5 text-[clamp(13px,1.2vw,18px)] lg:flex'>
              <button
                onClick={toggleSearch}
                onMouseEnter={() => setShopOpen(false)}
                className='text-brand-primary cursor-pointer transition-opacity hover:opacity-60'
                aria-label='Open search'
              >
                <PiMagnifyingGlass size={19} />
              </button>
              <CartButton onMouseEnter={() => setShopOpen(false)} />
            </div>

            {/* Mobile-only right cluster: cart only for now. Account icon
              * deferred until there's a route to link to. */}
            <div className='flex items-center lg:hidden'>
              <CartButton onMouseEnter={() => setShopOpen(false)} />
            </div>
          </div>
        )}

        {/* Shop Dropdown */}
        {shopOpen && <ShopDropdown />}

        {/* Search experience: desktop dropdown vs mobile fullscreen overlay */}
        {searchOpen &&
          (isDesktop ? <SearchDropdown /> : <MobileSearchOverlay />)}

        {/* Mobile menu (burger) — same `absolute top-full` shape as the
         * search and shop dropdowns; covers the rest of the viewport. */}
        {mobileMenuOpen && <MobileMenuPanel />}
      </div>
    </header>
  );
};

const CartButton = ({ onMouseEnter }: { onMouseEnter: () => void }) => {
  const setCartOpen = useSetAtom(cartOpenAtom);
  const count = useAtomValue(cartCountAtom);
  return (
    <button
      onClick={() => setCartOpen(true)}
      onMouseEnter={onMouseEnter}
      aria-label={`Open cart${count > 0 ? `, ${count} item${count === 1 ? '' : 's'}` : ''}`}
      className='text-brand-primary relative cursor-pointer transition-opacity hover:opacity-60'
    >
      <CartIcon />
      {count > 0 && (
        <span className='bg-brand-primary font-mulish absolute -top-1.5 -right-2 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold text-white'>
          {count}
        </span>
      )}
    </button>
  );
};
