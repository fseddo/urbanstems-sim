import { VariantType } from '@/types/api';

export const getDeliveryDate = (
  deliveryLeadTime: number | undefined | null
) => {
  if (!deliveryLeadTime) return undefined;
  const date = new Date();
  date.setDate(date.getDate() + deliveryLeadTime);

  return date.toLocaleDateString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric',
  });
};

export const VARIANT_TYPE_TO_PRODUCT_SIZE: Record<VariantType, string> = {
  single: 'Standard',
  double: '2x The Stems',
  triple: '3x The Stems',
};

export const getFirstSentence = (html: string | null | undefined): string => {
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

export const DELIVERY_STEP_INFO = [
  {
    id: 1,
    imgSrc:
      'https://urbanstems.com/cdn/shop/files/NationwideBox_1_NationwideDelivery.jpg',
    description:
      'Your package will arrive in an UrbanStems branded box with all products tightly secured.',
  },
  {
    id: 2,
    imgSrc:
      'https://urbanstems.com/cdn/shop/files/NationwideBox_3_NationwideDelivery.jpg',
    description:
      'Bouquets will arrive wrapped and with a personalized notecard from the sender inside.',
  },
  {
    id: 3,
    imgSrc:
      'https://urbanstems.com/cdn/shop/files/NationwideBox_2_NationwideDelivery.jpg',
    description:
      'Bouquets are shipped without water, which is actually beneficial for your flowers.',
  },
];
