export const PRODUCT_VARIANTS_BULK_CREATE = `
  mutation productVariantsBulkCreate($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
      productVariantsBulkCreate(productId: $productId, variants: $variants) {
        productVariants { id title price barcode }
        userErrors { field message }
      }
    }
`;
