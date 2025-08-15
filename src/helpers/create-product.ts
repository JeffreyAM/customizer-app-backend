export async function createShopifyProduct(
    url: string,
    product_id: number,
    images: string[],
    edmTemplateId: number,
    availableVariantIds: number[]
  ) {
    const payload = {
      product_id,
      images,
      edmTemplateId,
      availableVariantIds
    };
  
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });
  
    if (!res.ok) {
      throw new Error(`Request failed with status ${res.status}`);
    }
  
    return res.json();
  }
  