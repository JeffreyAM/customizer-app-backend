export const PRODUCT_CREATE = `
  mutation productCreate($product: ProductCreateInput!, $media: [CreateMediaInput!]) {
    productCreate(product: $product, media: $media) {
      product {
        id
        title
        handle
        onlineStoreUrl
        tags
        options { name values }
        variants(first: 10) {
          nodes {
            id
            title
            price
            metafields(first: 10) {
              nodes {
                id
                namespace
                key
                value
              }
            }
          }
        }
        media(first: 10) {
          nodes { 
            mediaContentType
            ... on MediaImage {
              image { originalSrc altText }
            } 
          }
        }
      }
      userErrors { field message }
    }
  }
`;
