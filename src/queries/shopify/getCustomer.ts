export const GET_CUSTOMER = `
query getCustomerWithMetafields($id: ID!) {
  customer(id: $id) {
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
`;
