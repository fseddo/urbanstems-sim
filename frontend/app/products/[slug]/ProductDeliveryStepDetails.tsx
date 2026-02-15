import Image from 'next/image';

export const DeliveryStepDetail = ({
  imgSrc,
  id,
  description,
}: {
  imgSrc: string;
  id: number;
  description: string;
}) => {
  return (
    <div className='min-w-0 flex-1'>
      <div className='relative'>
        <div className='overflow-hidden rounded-md'>
          <Image
            src={imgSrc}
            alt={`Package delivery step ${id}`}
            width={0}
            height={0}
            sizes='(max-width: 768px) 100vw, 33vw'
            className='h-auto w-full transition-transform duration-300 hover:scale-105'
          />
        </div>
        <div className='border-brand-primary absolute bottom-0 left-1/2 flex h-10 w-10 -translate-x-1/2 translate-y-1/2 items-center justify-center rounded-full border bg-white'>
          <span className='text-lg font-bold'>{id}</span>
        </div>
      </div>
      <div className='mt-8 px-6 text-center'>{description}</div>
    </div>
  );
};
