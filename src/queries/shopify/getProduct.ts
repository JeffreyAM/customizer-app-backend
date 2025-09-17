export const GET_PRODUCT = `
  query ProductMetafields($ownerId: ID!, $variantsAfter: String) {
    product(id: $ownerId) {
      id
      title
      tags
      handle
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
          sku
          selectedOptions {
            name
            value
          }
          metafields(first: 10) {
            nodes {
              id
              key
              value
            }
          }
          inventoryItem {
            id
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
