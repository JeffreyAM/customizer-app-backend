/**
 * Calculates and formats the selling price based on base cost.
 * Applies a 60% margin (divide by 0.4), rounds down, and adds 0.99.
 * 
 * @param baseCost - The base cost of the product
 * @returns Formatted price string like "31.99"
 */
export function selPrice(baseCost: number, margin: number = 0.4): string {
  const rawPrice = baseCost / (1 - margin);
  const sellingPrice = Math.floor(rawPrice) + 0.99;
  return sellingPrice.toFixed(2);
}
