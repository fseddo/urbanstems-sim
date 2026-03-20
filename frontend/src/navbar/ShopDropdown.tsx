import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { categoryQueries } from '@/api/cateogries/categoryQueries';
import { collectionQueries } from '@/api/collections/collectionQueries';
import { occasionQueries } from '@/api/occasions/queries';
import { useShopDropdown } from './NavbarContext';
import { capitalizeString } from '../common/utils/capitalizeString';

const isDeliveryCollection = (slug: string) =>
  slug.includes('day') || slug.includes('delivery');

const isHiddenCollection = (slug: string) =>
  slug.includes('gift') || slug.includes('vogue');

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
    <div className='font-mulish absolute top-full left-0 w-full border-b bg-white shadow-md'>
      <div className='mx-auto flex max-w-6xl gap-16 px-10 py-10'>
        {/* Categories */}
        <div className='flex flex-col gap-2'>
          <h3 className='text-brand-primary text-sm font-bold'>Categories</h3>
          <div className='mt-1 flex flex-col gap-4'>
            {categories.map((cat) => (
              <Link
                key={cat.slug}
                to='/collections/$slug'
                params={{ slug: cat.slug }}
                onClick={close}
                className='flex items-center gap-3'
              >
                {cat.image_src && (
                  <img
                    src={`${cat.image_src}&width=120`}
                    alt={cat.name}
                    className='h-14 w-14 rounded object-cover'
                  />
                )}
                <div>
                  <div className='text-brand-primary text-sm font-bold'>
                    {capitalizeString(cat.name)}
                  </div>
                  <div className='text-brand-primary/60 max-w-48 text-xs'>
                    {cat.header_subtitle?.split('.')[0]}.
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Featured */}
        <div className='flex flex-col gap-2'>
          <h3 className='text-brand-primary text-sm font-bold'>Featured</h3>
          <div className='mt-1 flex flex-col gap-2'>
            {featuredCollections.map((col) => (
              <Link
                key={col.slug}
                to='/collections/$slug'
                params={{ slug: col.slug }}
                onClick={close}
                className='text-brand-primary/80 hover:text-brand-primary text-sm'
              >
                {capitalizeString(col.name)}
              </Link>
            ))}
          </div>

          <h3 className='text-brand-primary mt-4 text-sm font-bold'>
            Delivery
          </h3>
          <div className='mt-1 flex flex-col gap-2'>
            {deliveryCollections.map((col) => (
              <Link
                key={col.slug}
                to='/collections/$slug'
                params={{ slug: col.slug }}
                onClick={close}
                className='text-brand-primary/80 hover:text-brand-primary text-sm'
              >
                {capitalizeString(col.name)}
              </Link>
            ))}
          </div>

          <Link
            to='/collections/$slug'
            params={{ slug: 'all' }}
            onClick={close}
            className='text-brand-primary/80 hover:text-brand-primary mt-2 text-sm'
          >
            Shop All
          </Link>
        </div>

        {/* Occasions */}
        <div className='flex flex-col gap-2'>
          <h3 className='text-brand-primary text-sm font-bold'>Occasions</h3>
          <div className='mt-1 flex flex-col gap-2'>
            {occasions.map((occ) => (
              <Link
                key={occ.slug}
                to='/collections/$slug'
                params={{ slug: occ.slug }}
                onClick={close}
                className='text-brand-primary/80 hover:text-brand-primary text-sm'
              >
                {capitalizeString(occ.name)}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
