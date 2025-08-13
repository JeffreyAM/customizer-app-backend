export const PRODUCT_PUBLISH = `mutation PublishablePublish($collectionId: ID!, $publicationId: ID!) {
  publishablePublish(id: $collectionId, input: {publicationId: $publicationId}) {
    shop {
      id
      name
      email
    }
    userErrors {
      field
      message
    }
  }
}`;
