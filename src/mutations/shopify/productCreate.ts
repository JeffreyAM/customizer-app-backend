export const PRODUCT_CREATE = `
  mutation productCreate($product: ProductCreateInput!, $media: [CreateMediaInput!]) {
    productCreate(product: $product, media: $media) {
      product {
        id title tags
        options { name values }
        variants(first: 10) { edges { node { id title price } } }
        media(first: 10) {
          edges {
            node {
              mediaContentType
              ... on MediaImage {
                image { originalSrc altText }
              }
            }
          }
        }
      }
      userErrors { field message }
    }
  }
`;
