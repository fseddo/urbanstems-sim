import { VariantType } from '@/api/products/ProductVariant';

export const getDeliveryDate = (
  deliveryLeadTime: number | undefined | null,
  format: 'short' | 'long' = 'long'
) => {
  if (deliveryLeadTime == undefined) return undefined;
  const date = new Date();
  if (deliveryLeadTime > 0) date.setDate(date.getDate() + deliveryLeadTime);
  if (format === 'short') {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
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
