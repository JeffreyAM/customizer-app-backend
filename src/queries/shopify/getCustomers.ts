export const GET_CUSTOMERS = `
  query getCustomersWithMetafields {
    customers(first: 50) {
      nodes {
        id
        firstName
        lastName
        email
        metafields(first: 10) {
          edges {
            node {
              namespace
              key
              value
              type
            }
          }
        }
      }
    }
  }
`;
