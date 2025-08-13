export const GET_PRODUCTS = `
  query GetProducts {
    products(first: 10) {
      nodes {
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
  }
`;
