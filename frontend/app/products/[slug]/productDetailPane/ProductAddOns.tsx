import Image from 'next/image';

export const AddOns = () => {
  return (
    <div className='flex w-full flex-col gap-1 pb-4'>
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
