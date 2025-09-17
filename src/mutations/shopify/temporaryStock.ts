export const SET_TEMP_STOCK = `
  mutation AdjustVariantQuantity($input: InventoryAdjustQuantitiesInput!) { 
    inventoryAdjustQuantities(input: $input) {
      userErrors { 
        field message
      }
      inventoryAdjustmentGroup {
        createdAt
        reason 
        referenceDocumentUri 
        changes { 
          name 
          delta 
          quantityAfterChange 
          item {
            id 
            sku 
          } 
          location { 
            id 
            name 
          } 
        } 
      }
    } 
  }`;