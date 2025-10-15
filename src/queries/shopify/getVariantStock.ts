export const GET_VARIANT_STOCK =`
  query getVariantStock($variantId: ID!) {
    productVariant(id: $variantId) {
      id
      title
      inventoryItem {
        inventoryLevels(first: 10) {
          edges {
            node {
              location {
                name
              }
              quantities(names: ["available"]) {
                name
                quantity
              }
            }
          }
        }
      }
    }
  }
`;
