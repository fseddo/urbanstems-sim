import { imageAtWidth } from '../common/utils/imageAtWidth';

const CARDS = [
  {
    imageSrc:
      'https://urbanstems.com/cdn/shop/files/PeonyGoldTegan_PeonyCare_ThreeStep.jpg?v=1728340816',
    headline: 'Modern Designs',
    description:
      "Our bouquets are expertly designed to create on-trend looks you won't find anywhere else.",
  },
  {
    imageSrc:
      'https://urbanstems.com/cdn/shop/files/corp-gift-media-1.jpg?v=1727282847',
    headline: 'Gifting Simplified',
    description:
      'Our curated selection of items and unique packaging means gifting has never been easier.',
  },
  {
    imageSrc:
      'https://urbanstems.com/cdn/shop/files/LocalTote_2_LocalDelivery-1.jpg?v=1728349001',
    headline: 'Fast Delivery',
    description:
      'We deliver same-day in NYC, DC, LA, Chicago, Atlanta, Miami, Dallas, and Boston, and next-day nationwide.',
  },
];

export const WhyWeAreDifferent = () => {
  return (
    <section className='px-page border-t py-12 lg:py-20'>
      <header className='font-crimson text-landing-section-header pb-6 font-medium lg:pb-8'>
        Why We're Different
      </header>
      <div className='flex flex-col gap-10 md:grid md:grid-cols-3 md:gap-4 lg:gap-8'>
        {CARDS.map((card) => (
          <article
            key={card.headline}
            className='flex flex-col gap-4'
          >
            <img
              src={imageAtWidth(card.imageSrc, 800)}
              alt={card.headline}
              loading='lazy'
              className='aspect-[300/340] w-full rounded-lg object-cover'
            />
            <h3 className='font-crimson text-[20px] font-medium lg:text-[24px]'>
              {card.headline}
            </h3>
            <p className='text-foreground/80 max-w-[42ch] text-[14px] leading-[1.75] lg:text-[16px]'>
              {card.description}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
};
