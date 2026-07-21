export const PRODUCT_NAMES = [
  'Sauce Labs Backpack',
  'Sauce Labs Bike Light',
  'Sauce Labs Bolt T-Shirt',
  'Sauce Labs Fleece Jacket',
  'Sauce Labs Onesie',
  'Test.allTheThings() T-Shirt (Red)',
] as const;

export function getProducts(count: number): string[] {
  if (count < 1 || count > PRODUCT_NAMES.length) {
    throw new Error(`count must be between 1 and ${PRODUCT_NAMES.length}`);
  }
  return PRODUCT_NAMES.slice(0, count);
}
