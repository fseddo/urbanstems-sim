import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { FiChevronLeft, FiChevronRight, FiX } from 'react-icons/fi';
import { PiMagnifyingGlass } from 'react-icons/pi';
import { tagQueries } from '@/api/tags/tagQueries';
import { capitalizeString } from '../common/utils/capitalizeString';
import { imageAtWidth } from '../common/utils/imageAtWidth';
import { withViewTransition } from '../common/withViewTransition';
import { AccordionSection } from '../filters/FilterSidebarParts';
import { NavLink } from './NavLink';
import { useNavbarPanel } from './navbarAtoms';

// Mobile menu panel — opened by the navbar's burger button. Hangs off the
// navbar via the same `absolute top-full` shape as <ShopDropdown> /
// <MobileSearchOverlay>; fills the rest of the viewport via
// `100dvh - var(--navbar-height)`.
//
// Two views:
//   - root: search field + Shop drilldown + top-level nav links
//   - shop: header (back + SHOP ALL) + categories grid + accordions
//          (Featured / Delivery / Occasions) + highlighted-collections row
//
// Tapping the search field switches the active panel to 'search', which
// clears 'mobileMenu' via navbarPanelAtom's single-active-panel encoding.
// The footer-style utility section from the reference (Subscriptions /
// Rewards / Blog / Help / Account) is intentionally omitted — those routes
// don't exist yet, and shipping dead links violates the dynamic-sizing
// doc's "don't ship dead UI" rule.

const NAV_ITEMS = [
  { slug: 'new-the-spring-collection', label: 'Spring' },
  { slug: 'flowers', label: 'Flowers' },
  { slug: 'plants', label: 'Plants' },
  { slug: 'same-day', label: 'Same-Day Delivery' },
  { slug: 'sale', label: 'Sale' },
];

const HIGHLIGHTED_COLLECTIONS = [
  {
    slug: 'new-the-spring-collection',
    title: 'The Spring Collection',
    description:
      'Fresh florals in lighter palettes, designed to welcome the season.',
  },
  {
    slug: 'the-easter-collection',
    title: 'Easter',
    description:
      'Elegant blooms and soft spring stems for Easter tables and gatherings.',
  },
];

const isDeliveryCollection = (slug: string) =>
  slug.includes('day') || slug.includes('delivery');
const isHiddenCollection = (slug: string) =>
  slug.includes('gift') || slug.includes('vogue');

export const MobileMenuPanel = () => {
  const [, setOpen] = useNavbarPanel('mobileMenu');
  const [, setSearchOpen] = useNavbarPanel('search');
  const [view, setView] = useState<'root' | 'shop'>('root');

  // Direct close (used by NavLink clicks where navigation is the primary
  // action). The X button uses `closeWithTransition` so the panel cross-fades
  // out via the View Transitions API instead of snapping.
  const close = () => setOpen(false);
  const closeWithTransition = () => withViewTransition(close);

  return (
    <div
      className='font-mulish bg-background border-brand-primary absolute top-full left-0 flex w-full flex-col overflow-y-auto border-y'
      style={{ height: 'calc(100dvh - var(--navbar-height))' }}
    >
      <div className='flex items-center gap-3 px-4 pt-4 pb-3'>
        <button
          onClick={() => withViewTransition(() => setSearchOpen(true))}
          style={{ viewTransitionName: 'search-bar' }}
          className='border-brand-primary/20 flex flex-1 items-center gap-3 rounded-md border bg-white px-4 py-3 text-left'
        >
          <PiMagnifyingGlass
            size={18}
            className='text-brand-primary shrink-0'
          />
          <span className='font-mulish text-base text-gray-400'>
            Search Here
          </span>
        </button>
        <button
          onClick={closeWithTransition}
          className='border-brand-primary text-brand-primary flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full border transition-opacity hover:opacity-60'
          aria-label='Close menu'
        >
          <FiX size={18} />
        </button>
      </div>

      <div className='flex-1 overflow-y-auto'>
        {view === 'root' ? (
          <RootView onShop={() => setView('shop')} onClose={close} />
        ) : (
          <ShopView onBack={() => setView('root')} onClose={close} />
        )}
      </div>
    </div>
  );
};

const RootView = ({
  onShop,
  onClose,
}: {
  onShop: () => void;
  onClose: () => void;
}) => (
  <div className='flex flex-col'>
    <button
      onClick={onShop}
      className='font-crimson text-brand-primary flex items-center justify-between px-5 py-4 text-left text-3xl'
    >
      <span>Shop</span>
      <FiChevronRight size={20} />
    </button>
    {NAV_ITEMS.map((item) => (
      <NavLink
        key={item.slug}
        slug={item.slug}
        onClick={() => setTimeout(onClose, 80)}
        className='font-crimson text-brand-primary px-5 py-4 text-3xl hover:opacity-100'
      >
        {item.label}
      </NavLink>
    ))}
  </div>
);

const ShopView = ({
  onBack,
  onClose,
}: {
  onBack: () => void;
  onClose: () => void;
}) => {
  const { data: categories = [] } = useQuery(tagQueries.list('category'));
  const { data: collections = [] } = useQuery(tagQueries.list('collection'));
  const { data: occasions = [] } = useQuery(tagQueries.list('occasion'));

  const [openSections, setOpenSections] = useState<Set<string>>(new Set());
  const toggleSection = (id: string) => {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const featuredCollections = collections.filter(
    (c) => !isDeliveryCollection(c.slug) && !isHiddenCollection(c.slug)
  );
  const deliveryCollections = collections.filter((c) =>
    isDeliveryCollection(c.slug)
  );

  return (
    <div className='flex flex-col gap-4'>
      <div className='border-background-alt flex items-center justify-between border-b px-5 py-3'>
        <button
          onClick={onBack}
          className='font-crimson text-brand-primary flex items-center gap-1 text-3xl'
        >
          <FiChevronLeft size={24} />
          <span>Shop</span>
        </button>
        <Link
          to='/collections/$slug'
          params={{ slug: 'all' }}
          onClick={() => setTimeout(onClose, 80)}
          className='border-brand-primary rounded-sm border px-5 py-2.5 text-xs font-bold tracking-[0.2em]'
        >
          SHOP ALL
        </Link>
      </div>

      <div className='grid grid-cols-4 gap-3 px-5'>
        {categories.map((cat) => (
          <NavLink
            key={cat.slug}
            slug={cat.slug}
            onClick={() => setTimeout(onClose, 80)}
            className='flex flex-col items-center gap-2 hover:opacity-100'
          >
            {cat.nav_img_src && (
              <div className='aspect-square w-full overflow-hidden rounded-md'>
                <img
                  src={imageAtWidth(cat.nav_img_src, 200)}
                  alt={cat.name}
                  className='h-full w-full object-cover'
                />
              </div>
            )}
            <span className='font-crimson text-brand-primary text-base'>
              {capitalizeString(cat.name)}
            </span>
          </NavLink>
        ))}
      </div>

      <div className='px-5'>
        <AccordionSection
          title='Featured'
          isOpen={openSections.has('featured')}
          onToggle={() => toggleSection('featured')}
        >
          <div className='flex flex-col gap-3 pl-1'>
            {featuredCollections.map((col) => (
              <NavLink
                key={col.slug}
                slug={col.slug}
                onClick={() => setTimeout(onClose, 80)}
                className='font-mulish text-brand-primary text-base hover:opacity-100'
              >
                {capitalizeString(col.name)}
              </NavLink>
            ))}
          </div>
        </AccordionSection>
        <AccordionSection
          title='Delivery'
          isOpen={openSections.has('delivery')}
          onToggle={() => toggleSection('delivery')}
        >
          <div className='flex flex-col gap-3 pl-1'>
            {deliveryCollections.map((col) => (
              <NavLink
                key={col.slug}
                slug={col.slug}
                onClick={() => setTimeout(onClose, 80)}
                className='font-mulish text-brand-primary text-base hover:opacity-100'
              >
                {capitalizeString(col.name)}
              </NavLink>
            ))}
          </div>
        </AccordionSection>
        <AccordionSection
          title='Occasions'
          isOpen={openSections.has('occasions')}
          onToggle={() => toggleSection('occasions')}
        >
          <div className='flex flex-col gap-3 pl-1'>
            {occasions.slice(0, 9).map((occ) => (
              <NavLink
                key={occ.slug}
                slug={occ.slug}
                onClick={() => setTimeout(onClose, 80)}
                className='font-mulish text-brand-primary text-base hover:opacity-100'
              >
                {capitalizeString(occ.name)}
              </NavLink>
            ))}
          </div>
        </AccordionSection>
      </div>

      <div className='hide-scrollbar flex gap-4 overflow-x-auto px-5 py-6'>
        {HIGHLIGHTED_COLLECTIONS.map((col) => {
          const collection = collections.find((c) => c.slug === col.slug);
          return (
            <NavLink
              key={col.slug}
              slug={col.slug}
              onClick={() => setTimeout(onClose, 80)}
              className='flex w-[60%] min-w-[220px] shrink-0 flex-col gap-3 hover:opacity-100'
            >
              {collection?.nav_img_src && (
                <div className='aspect-square overflow-hidden rounded-md'>
                  <img
                    src={imageAtWidth(collection.nav_img_src, 500)}
                    alt={col.title}
                    className='h-full w-full object-cover'
                  />
                </div>
              )}
              <div className='flex flex-col gap-2 text-center'>
                <div className='font-crimson text-brand-primary text-xl'>
                  {col.title}
                </div>
                <div className='text-brand-primary/90 text-xs'>
                  {collection?.nav_description || col.description}
                </div>
              </div>
            </NavLink>
          );
        })}
      </div>
    </div>
  );
};
