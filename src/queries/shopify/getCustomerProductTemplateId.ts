export const GET_CUSTOMER_PRODUCT_TEMPLATE = `
query GetCustomerProducts($query: String!, $after: String) {
  products(first: 250, after: $after, query: $query) {
    edges {
      cursor
      node {
        handle
      }
    }
    pageInfo {
      hasNextPage
      endCursor
    }
  }
}
`;