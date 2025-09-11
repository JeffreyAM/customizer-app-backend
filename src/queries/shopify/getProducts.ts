export const GET_PRODUCTS = `
  query GetProducts($after: String, $before: String, $first: Int, $last: Int) {
    products(after: $after, before: $before, first: $first, last: $last) {
      edges {
        cursor
        node {
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
          variantsCount {
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
          mediaCount {
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
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
    }
  }
`;
