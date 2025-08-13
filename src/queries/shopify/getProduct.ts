export const GET_PRODUCT = `
  query ProductMetafields($ownerId: ID!, $variantsAfter: String) {
    product(id: $ownerId) {
      id
      title
      metafields(first: 3) {
        nodes { 
          namespace
          key
          value 
        }
      }
      variantsCount{
        count
      }
      variants(first: 100, after: $variantsAfter) {
        pageInfo {
          hasNextPage
          endCursor
        }
        nodes { 
          id
          title
          price
          barcode
          selectedOptions {
            name
            value
          }
          sku
          metafields(first: 10) {
            nodes {
              id
              key
              value
            }
          }
        }
      }
      mediaCount{
        count
      }
      media(first: 10) {
        nodes {
          id
          alt
          preview {
            image {
              id
              url
            }
          }
        }
      }
    }
  }
`;
