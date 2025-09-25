export const PRODUCT_VARIANT_APPEND_MEDIA = `
  mutation productVariantAppendMedia(
    $productId: ID!
    $variantMedia: [ProductVariantAppendMediaInput!]!
  ) {
    productVariantAppendMedia(productId: $productId, variantMedia: $variantMedia) {
      productVariants {
        id
        media(first: 10) {
          nodes {
            id
            alt
            mediaContentType
            ... on MediaImage {
              image {
                originalSrc
              }
            }
          }
        }
      }
      userErrors {
        field
        message
      }
    }
  }
`;
