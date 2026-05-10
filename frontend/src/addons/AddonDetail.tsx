import { useQuery } from '@tanstack/react-query';
import { CgSpinner } from 'react-icons/cg';
import { FiArrowLeft, FiX } from 'react-icons/fi';
import { Product } from '@/api/products/Product';
import { productQueries } from '@/api/products/productQueries';
import { imageAtWidth } from '@/src/common/utils/imageAtWidth';

// Owns its own close+back chrome (absolute on the wrapper, not in the
// scroll container) so they stay pinned to the pane top during scroll.
// `min-h-0` on the scroll wrapper lets it shrink below image height —
// without it the image would push the ADD footer past the viewport.

type Props = {
  slug: string;
  onAdd: (product: Product) => void;
  onClose: () => void;
  onBack: () => void;
};

export const AddonDetail = ({ slug, onAdd, onClose, onBack }: Props) => {
  const { data: product, isPending } = useQuery(productQueries.detail(slug));

  if (isPending || !product) {
    return (
      <div className='flex flex-1 items-center justify-center'>
        <CgSpinner className='animate-spin opacity-60' size={28} />
      </div>
    );
  }

  return (
    <div className='relative flex min-h-0 flex-1 flex-col'>
      <div className='min-h-0 flex-1 overflow-y-auto'>
        {product.main_image && (
          <img
            src={imageAtWidth(product.main_image, 1200)}
            alt={product.name}
            className='aspect-square w-full object-cover'
          />
        )}
        <div className='flex flex-col items-center gap-3 px-10 py-8 text-center'>
          <h2 className='font-crimson text-4xl'>{product.name}</h2>
          {product.subtitle && (
            <div className='text-sm'>{product.subtitle}</div>
          )}
          {product.description && (
            <p className='pt-2 text-sm leading-relaxed opacity-70'>
              {product.description}
            </p>
          )}
        </div>
      </div>

      <button
        onClick={onBack}
        aria-label='Back to list'
        className='border-brand-primary hover:bg-brand-primary absolute top-4 left-4 z-10 rounded-full border bg-white p-1.5 transition-colors duration-300 hover:text-white'
      >
        <FiArrowLeft size={18} />
      </button>
      <button
        onClick={onClose}
        aria-label='Close'
        className='border-brand-primary hover:bg-brand-primary absolute top-4 right-4 z-10 rounded-full border bg-white p-1.5 transition-colors duration-300 hover:text-white'
      >
        <FiX size={18} />
      </button>

      <div className='bg-white px-10 pt-6 pb-8 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.03)] min-[1020px]:rounded-b-md'>
        <button
          onClick={() => onAdd(product)}
          className='bg-brand-primary hover:border-brand-primary hover:text-brand-primary w-full rounded-md border py-5 text-xs font-black tracking-action text-white/90 transition-colors duration-300 hover:bg-white active:scale-[0.99]'
        >
          {`ADD - $${product.price_dollars}`}
        </button>
      </div>
    </div>
  );
};
