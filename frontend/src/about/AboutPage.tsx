import { OccasionCarousel } from '../landing/occasionCarousel/OccasionCarousel';
import { AboutHero } from './AboutHero';
import { CopyLockupSection } from './CopyLockupSection';
import { WhyWeAreDifferent } from './WhyWeAreDifferent';

export const AboutPage = () => {
  return (
    <div className='flex w-full flex-col'>
      <AboutHero />
      <CopyLockupSection
        headline='A Modern Approach'
        imageSrc='https://urbanstems.com/cdn/shop/files/UrbanStems_Illustration_Row_Houses.svg?v=1730222341'
        imageAlt='Illustration of a row of houses'
        imageSide='left'
      >
        Our co-founders launched UrbanStems on Valentine's Day in 2014 in
        Washington, D.C. Their focus; freshness, sustainability, and outstanding
        customer service, aiming to transform the flower delivery industry with
        a fully integrated supply chain. From our coast-to-coast next-day
        delivery, to our same-day delivery in NYC, DC, LA, Chicago, Atlanta,
        Miami, Dallas, and Boston, we make gifting quick and easy. By courier or
        truck, the end result is always a gift that was carefully prepped with
        your happiness in mind.
      </CopyLockupSection>
      <WhyWeAreDifferent />
      <CopyLockupSection
        headline='Sourced At The Farm'
        imageSrc='https://urbanstems.com/cdn/shop/files/PeonyClouds_Lifestyle_3.jpg?v=1728948119'
        imageAlt='Fresh peonies sourced from the farm'
        imageSide='left'
      >
        We make it a priority to work directly with our Rainforest Alliance
        Certified&trade; farms and invest in the people who work there. We
        believe our hands-on approach is the best way to guarantee only the
        freshest flowers are picked every day. No middlemen. No cutting corners.
        Just happiness.
      </CopyLockupSection>
      <CopyLockupSection
        headline='Freshness Guaranteed'
        imageSrc='https://urbanstems.com/cdn/shop/files/Sourced-Farm.webp?v=1729052226'
        imageAlt='Flowers being prepared at the farm'
        imageSide='right'
      >
        If your bouquet or plant isn't up to par, we would be happy to make
        things right. Please reach out to our Care Team at{' '}
        <strong>care@urbanstems.com</strong> with your order number and the
        quality issues you encountered — we promise our team will work with you
        to find a solution!
      </CopyLockupSection>
      <div className='border-t'>
        <OccasionCarousel />
      </div>
    </div>
  );
};
