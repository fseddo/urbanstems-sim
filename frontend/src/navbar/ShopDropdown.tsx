import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { categoryQueries } from '@/api/cateogries/categoryQueries';
import { collectionQueries } from '@/api/collections/collectionQueries';
import { occasionQueries } from '@/api/occasions/queries';
import { useShopDropdown } from './NavbarContext';
import { capitalizeString } from '../common/utils/capitalizeString';
import { NavLink } from './NavLink';
import { AnimatedButton } from '../common/AnimatedButton';

const isDeliveryCollection = (slug: string) =>
  slug.includes('day') || slug.includes('delivery');

const isHiddenCollection = (slug: string) =>
  slug.includes('gift') || slug.includes('vogue');

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

const NAV_DESCRIPTIONS: Record<string, string> = {
  peonies: 'Coveted blooms makes its distinguished return.',
  flowers: 'Modern bouquets for every occasion.',
  plants: 'Leafy greenery and sophisticated orchids.',
  gifts: 'Make it special with gifts designed to make their day.',
};

// Warm the browser cache for the dropdown's images so they're rendered
// instantly when the user opens the menu. Call from an always-mounted
// component (the Navbar) — calling it from inside ShopDropdown would defeat
// the purpose since the dropdown only mounts on first open.
export const useShopDropdownPrefetch = () => {
  const { data: categories = [] } = useQuery(categoryQueries.list());
  const { data: collections = [] } = useQuery(collectionQueries.list());

  useEffect(() => {
    const urls: string[] = [];
    for (const cat of categories) {
      if (cat.nav_img_src) urls.push(`${cat.nav_img_src}&width=120`);
    }
    for (const col of HIGHLIGHTED_COLLECTIONS) {
      const c = collections.find((x) => x.slug === col.slug);
      if (c?.nav_img_src) urls.push(`${c.nav_img_src}&width=500`);
    }
    for (const url of urls) {
      const img = new Image();
      img.src = url;
    }
  }, [categories, collections]);
};

export const ShopDropdown = () => {
  const { setShopOpen } = useShopDropdown();
  //TODO: this is hard coded to an 80ms delay to allow the click event to register on the Link before the dropdown unmounts.
  // This is a bit hacky and should be refactored in the future to be more robust.
  const close = () => setTimeout(() => setShopOpen(false), 80);

  const { data: categories = [] } = useQuery(categoryQueries.list());
  const { data: collections = [] } = useQuery(collectionQueries.list());
  const { data: occasions = [] } = useQuery(occasionQueries.list());

  const featuredCollections = collections.filter(
    (c) => !isDeliveryCollection(c.slug) && !isHiddenCollection(c.slug)
  );
  const deliveryCollections = collections.filter((c) =>
    isDeliveryCollection(c.slug)
  );

  return (
    <div className='font-mulish border-brand-primary absolute top-full left-0 w-full border-y bg-white shadow-md'>
      <div className='flex px-20'>
        {/* Left: Shop header + link columns */}
        <div className='flex flex-8 flex-col px-6'>
          <div className='flex items-center justify-between py-6 pb-10'>
            <h2 className='font-crimson text-brand-primary text-4xl'>Shop</h2>
            <AnimatedButton
              href='/collections/all'
              label='SHOP ALL'
              onClick={close}
              className='hover:bg-brand-primary hover:border-brand-primary px-7 py-3 text-xs opacity-100 shadow-none'
            />
          </div>
          <hr className='border-brand-primary' />

          <div className='flex justify-between py-10 pr-8'>
            {/* Categories */}
            <div className='flex flex-col gap-2'>
              <h3 className='text-brand-primary text-base font-bold'>
                Categories
              </h3>
              <div className='mt-1 flex flex-col gap-4'>
                {categories.map((cat) => (
                  <NavLink
                    key={cat.slug}
                    slug={cat.slug}
                    onClick={close}
                    className='font-mulish group flex items-center gap-3 hover:opacity-100'
                  >
                    {cat.nav_img_src && (
                      <div className='overflow-hidden rounded'>
                        <img
                          src={`${cat.nav_img_src}&width=120`}
                          alt={cat.name}
                          className='h-14 w-14 object-cover transition-transform duration-300 group-hover:scale-105'
                        />
                      </div>
                    )}
                    <div className='flex flex-col gap-0.5'>
                      <div className='text-brand-primary group-hover:text-brand-primary/60 text-sm font-bold transition-colors duration-300'>
                        {capitalizeString(cat.name)}
                      </div>
                      <div className='text-brand-primary/80 group-hover:text-brand-primary/60 max-w-40 text-xs transition-colors duration-300'>
                        {NAV_DESCRIPTIONS[cat.slug]}
                      </div>
                    </div>
                  </NavLink>
                ))}
              </div>
            </div>

            {/* Featured */}
            <div className='flex flex-col gap-2'>
              <h3 className='text-brand-primary text-base font-bold'>
                Featured
              </h3>
              <div className='mt-1 flex flex-col gap-2'>
                {featuredCollections.map((col) => (
                  <NavLink
                    key={col.slug}
                    slug={col.slug}
                    label={capitalizeString(col.name)}
                    onClick={close}
                    className='text-base'
                  />
                ))}
              </div>

              <h3 className='text-brand-primary mt-4 text-base font-bold'>
                Delivery
              </h3>
              <div className='mt-1 flex flex-col gap-2'>
                {deliveryCollections.map((col) => (
                  <NavLink
                    key={col.slug}
                    slug={col.slug}
                    label={capitalizeString(col.name)}
                    onClick={close}
                    className='text-base'
                  />
                ))}
              </div>

              <NavLink
                slug='all'
                label='Shop All'
                onClick={close}
                className='mt-2 text-base'
              />
            </div>

            {/* Occasions */}
            <div className='flex flex-col gap-2'>
              <h3 className='text-brand-primary text-base font-bold'>
                Occasions
              </h3>
              <div className='mt-1 flex flex-col gap-2'>
                {occasions.map(
                  (occ, idx) =>
                    idx <= 8 && (
                      <NavLink
                        key={occ.slug}
                        slug={occ.slug}
                        label={capitalizeString(occ.name)}
                        onClick={close}
                        className='text-base'
                      />
                    )
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right: highlighted collections — full height, no top bar */}
        <div className='flex flex-7 gap-4 p-6'>
          {HIGHLIGHTED_COLLECTIONS.map((col) => {
            const collection = collections.find((c) => c.slug === col.slug);
            return (
              <NavLink
                key={col.slug}
                slug={col.slug}
                onClick={close}
                className='font-mulish group flex flex-col gap-3 hover:opacity-100'
              >
                {collection?.nav_img_src ? (
                  <div className='overflow-hidden rounded-md'>
                    <img
                      src={`${collection.nav_img_src}&width=500`}
                      alt={col.title}
                      className='aspect-square w-full object-cover transition-transform duration-300 group-hover:scale-105'
                    />
                  </div>
                ) : (
                  <div className='flex-1 bg-gray-100' />
                )}
                <div className='flex flex-col gap-3 text-center'>
                  <div className='font-crimson text-brand-primary text-xl'>
                    {col.title}
                  </div>
                  <div className='text-brand-primary/90 text-xs'>
                    {collection?.nav_description || col.description}
                  </div>
                  <span className='text-brand-primary group-hover:text-brand-primary/80 mt-1 text-xs font-bold tracking-wider underline underline-offset-4 transition-colors duration-300'>
                    SHOP NOW
                  </span>
                </div>
              </NavLink>
            );
          })}
        </div>
      </div>
    </div>
  );
};
