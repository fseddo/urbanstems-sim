'use client';

import { StarRating } from '@/components/StarRating';
import { useNavbar } from '@/contexts/NavbarContext';
import { useElementHeight } from '@/hooks/useElementHeight';
import { productQuery } from '@/lib/products/queries';
import { Product, ProductVariant, VariantType } from '@/types/api';
import { capitalizeString } from '@/utils/capitalizeString';
import { useQuery } from '@tanstack/react-query';
import Image from 'next/image';
import Link from 'next/link';
import { use } from 'react';
import { FaCheck } from 'react-icons/fa';

const getDeliveryDate = (deliveryLeadTime: number | undefined | null) => {
  if (!deliveryLeadTime) return undefined;
  const date = new Date();
  date.setDate(date.getDate() + deliveryLeadTime);

  return date.toLocaleDateString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric',
  });
};

const VARIANT_TYPE_TO_PRODUCT_SIZE: Record<VariantType, string> = {
  single: 'Standard',
  double: '2x The Stems',
  triple: '3x The Stems',
};

const getFirstSentence = (html: string | null | undefined): string => {
  if (!html) return '';

  // Create a temporary DOM element to parse HTML
  const temp = document.createElement('div');
  temp.innerHTML = html;

  // Get text content (strips all HTML)
  const text = temp.textContent || temp.innerText || '';

  // Get first sentence
  const firstSentence = text.trim().split(/[.!?]/)[0];

  return firstSentence ? `${firstSentence}.` : '';
};

export default function ProductDetail({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const resolvedParams = use(params);
  const {
    data: product,
    isLoading,
    isError,
    error,
  } = useQuery(productQuery(resolvedParams.slug));

  const navbarRef = useNavbar();

  const navbarHeight = useElementHeight(navbarRef);
  const imageHeight =
    navbarHeight > 0 ? `calc(100vh - ${navbarHeight}px)` : '100vh';

  if (isLoading) {
    return (
      <div className='flex h-screen items-center justify-center'>
        <div className='text-lg'>Loading product...</div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className='flex h-screen items-center justify-center'>
        <div className='text-lg text-red-600'>
          Error: {error instanceof Error ? error.message : 'Unknown error'}
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className='flex h-screen items-center justify-center'>
        <div className='text-lg'>Product not found</div>
      </div>
    );
  }

  return (
    <div>
      <section className='relative'>
        <div className='relative p-8 py-4' style={{ height: imageHeight }}>
          <ProductBackgroundImages product={product} />
          <ProductHeader product={product} />
        </div>

        <ProductDetailPane product={product} navbarHeight={navbarHeight} />
        {/* Product detail images grid */}
        {product.main_detail_src && <ProductImageGrid product={product} />}
        {/* description and care instructions expandable menus */}
        <div className='flex flex-col gap-6'>
          <div>Description</div>
          <div>Care Instructions</div>
        </div>
      </section>

      {/* reviews */}
      <div className='bg-background-alt/30 h-[500px]'>Reviews</div>
      {/* you may also like */}
      {/* how your package will arrive at your door */}
      {/* footer */}
    </div>
  );
}

const ProductBackgroundImages = ({ product }: { product: Product }) => {
  return (
    <div className='absolute inset-0 flex'>
      {product.main_image && (
        <div className='w-[50%]'>
          <img
            src={product.main_image}
            alt={product.name}
            className='h-full w-full object-cover'
          />
        </div>
      )}
      {product.hover_image && (
        <div className='w-[50%] overflow-hidden'>
          <img
            src={product.hover_image}
            alt={`${product.name} - hover`}
            className='h-full w-full translate-x-[20%] scale-140 object-cover'
          />
        </div>
      )}
    </div>
  );
};

const ProductHeader = ({ product }: { product: Product }) => {
  return (
    <header className='relative z-10 flex gap-4 text-xs'>
      <Link href={'/'}>
        <div className='underline'>Home</div>
      </Link>
      <Link href={'/collections'}>
        <div className='underline'>Shop All</div>
      </Link>
      <div className='opacity-80'>{product.name}</div>
    </header>
  );
};

const ProductDetailPane = ({
  product,
  navbarHeight,
}: {
  product: Product;
  navbarHeight: number;
}) => {
  return (
    <div className='absolute top-0 right-[90px] z-10 h-full pb-10'>
      <div
        className='sticky flex w-[37vw] flex-col items-center gap-3 rounded-lg bg-white p-10 shadow-xl'
        style={{ top: navbarHeight + 40 }}
      >
        {/* review rating */}
        <div className='flex items-center gap-2'>
          <StarRating rating={product.reviews_rating} />
          {product.reviews_count && (
            <span className='text-brand-primary text-xs underline'>
              {product.reviews_count} Reviews
            </span>
          )}
        </div>
        {/* name */}
        <div className='font-crimson text-5xl'>{product.name}</div>
        <div className='text-center text-sm'>
          {getFirstSentence(product.description)}
        </div>
        {/* price */}
        <div className='flex gap-2 text-lg'>
          <div>{`$${product.price_dollars}`}</div>
          <div className='line-through opacity-60'>
            {product.discounted_price_dollars != null &&
              `$${product.discounted_price_dollars}`}
          </div>
        </div>
        {/* variants */}
        <ProductDetailVariantOptions product={product} />

        {/* delivery options */}
        <DeliveryInformation product={product} />

        {/* add ons */}
        <AddOns />

        <button className='bg-brand-primary hover:border-brand-primary hover:text-brand-primary w-full rounded-md border py-4 text-sm font-bold tracking-wider text-white transition-colors duration-300 hover:bg-white active:scale-95'>
          {`ADD TO BAG - $${product.price_dollars}`}
        </button>
      </div>
    </div>
  );
};

const ProductImageGrid = ({ product }: { product: Product }) => {
  return (
    <div
      className='grid gap-4 p-20'
      style={{
        gridTemplateColumns: '460px 460px',
        gridTemplateRows: '2fr 4fr',
        height: '1100px',
      }}
    >
      {/* Left column - spans 2 rows */}
      {product.main_detail_src && (
        <div className='row-span-2'>
          {product.is_main_detail_video ? (
            <video
              className='h-full w-full rounded-md object-cover'
              autoPlay
              muted
              loop
              src={product.main_detail_src}
            />
          ) : (
            <div className='relative h-full w-full'>
              <Image
                className='rounded-md object-cover'
                alt={`${product.name} detail`}
                src={product.main_detail_src}
                fill
                sizes='(max-width: 768px) 100vw, 50vw'
              />
            </div>
          )}
        </div>
      )}

      {/* Right column - top row (smaller) */}
      {product.detail_image_1_src && (
        <div className='relative h-full w-full'>
          <Image
            className='rounded-md object-cover'
            alt={`${product.name} detail 1`}
            src={product.detail_image_1_src}
            fill
            sizes='(max-width: 768px) 100vw, 50vw'
          />
        </div>
      )}

      {/* Right column - bottom row (2x taller) */}
      {product.detail_image_2_src && (
        <div className='relative h-full w-full'>
          <Image
            className='rounded-md object-cover'
            alt={`${product.name} detail 2`}
            src={product.detail_image_2_src}
            fill
            sizes='(max-width: 768px) 100vw, 50vw'
          />
        </div>
      )}
    </div>
  );
};

const ProductDetailVariantOptions = ({ product }: { product: Product }) => {
  return (
    product.variants &&
    product.variants.length > 1 && (
      <div className='flex w-full gap-4 py-4'>
        {product.variants.map((variant) => {
          return (
            variant.main_image && (
              <Link
                href={`/products/${variant.id}`}
                className={`relative flex grow flex-col items-center justify-center gap-2 rounded-sm p-4 ${variant.variant_type === product?.variant_type ? 'border-brand-primary cursor-default border-2' : 'border-background-alt cursor-pointer border'}`}
                key={variant.id}
              >
                {variant.variant_type === product?.variant_type && (
                  <div className='bg-brand-primary absolute top-0 left-0 rounded-br-sm p-2'>
                    <FaCheck color='white' size={12} />
                  </div>
                )}
                <Image
                  className='aspect-square rounded-full'
                  alt={variant.variant_type}
                  src={variant.main_image}
                  height={80}
                  width={80}
                />
                {/* variant text info */}
                <div className='flex flex-col items-center gap-0.5'>
                  <div
                    className={`text-base font-bold ${variant.variant_type === product?.variant_type ? 'text-brand-primary' : 'opacity-60'}`}
                  >
                    {capitalizeString(variant.variant_type)}
                  </div>
                  <div className='text-brand-primary text-xs'>
                    {VARIANT_TYPE_TO_PRODUCT_SIZE[variant.variant_type]}
                  </div>
                  <div className='text-xs italic opacity-60'>
                    {variant.discounted_price_dollars && variant.price_dollars
                      ? `Save ${Math.round(((variant.discounted_price_dollars - variant.price_dollars) / variant.discounted_price_dollars) * 100)}%`
                      : 'Classic Size'}
                  </div>
                </div>
              </Link>
            )
          );
        })}
      </div>
    )
  );
};

const DeliveryInformation = ({ product }: { product: Product }) => {
  return (
    <div className='flex w-full flex-col gap-2 pb-4'>
      <div className='font-bold'>Delivery Information</div>
      <div className='border-background-alt flex gap-2 rounded-md border'>
        <div className='border-background-alt flex flex-1 flex-col gap-0.5 border-r px-2 py-4 text-sm'>
          <div className='text-brand-primary font-bold'>Receive on:</div>
          <div className='text-foreground/60'>
            {getDeliveryDate(product.delivery_lead_time)}
          </div>
        </div>
        <div className='flex flex-3 flex-col gap-0.5 px-2 py-4 text-sm'>
          <div className='text-brand-primary font-bold'>Send to:</div>
          <div className='text-foreground/60'>New York City, NY</div>
        </div>
      </div>
    </div>
  );
};

const AddOns = () => {
  return (
    <div className='flex w-full flex-col gap-4 pb-4'>
      <div className='font-bold'>Make It Extra Special</div>
      <div className='flex flex-col gap-1'>
        {/* first row */}
        <div className='border-b-background-alt flex cursor-pointer items-center justify-between border-b border-dashed py-3'>
          <div className='flex items-center gap-3'>
            <Image
              alt='vase'
              width={40}
              height={80}
              src='https://urbanstems.com/cdn/shop/files/RoseQuartzVase_MainImage_PDP.jpg'
            />
            <div className='text-xs'>
              Enhance Your Bouquet With The Perfect Vase
            </div>
          </div>
          <div className='text-brand-primary text-xs font-bold underline'>
            Add A Vase
          </div>
        </div>
        {/* second row */}
        <div className='border-b-background-alt flex cursor-pointer items-center justify-between border-b border-dashed py-3'>
          <div className='flex items-center gap-3'>
            <Image
              alt='vase'
              width={40}
              height={80}
              src='https://urbanstems.com/cdn/shop/files/LovePotion_BrooklynCandle_MainImage_PDP.jpg'
            />
            <div className='text-xs'>Include A Thoughtful Addition</div>
          </div>
          <div className='text-brand-primary text-xs font-bold underline'>
            Add Something Extra
          </div>
        </div>
      </div>
    </div>
  );
};
