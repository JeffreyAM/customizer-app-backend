export const GET_PRODUCT = `
  query ProductMetafields($ownerId: ID!) {
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
      variants(first: 10) {
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
