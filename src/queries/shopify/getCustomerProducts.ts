export const GET_CUSTOMER_PRODUCTS = `
  query GetProducts($query: String!, $after: String, $before: String, $first: Int, $last: Int) {
    products(query: $query, after: $after, before: $before, first: $first, last: $last, sortKey: CREATED_AT, reverse: true) {
      edges {
        cursor
        node {
          id
          title
          tags
          handle
          createdAt
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
              media(first: 5) {
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
