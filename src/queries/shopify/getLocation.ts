export const GET_LOCATION = `
  query getLocations {
    locations(first: 5) {
      nodes {
        id
        name
        legacyResourceId
        address {
          address1
          city
          country
        }
      }
    }
  }
`;