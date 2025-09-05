import toast from "react-hot-toast";

export const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};


// capitalizes a string
export const capitalize = (str: string) => {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// clean shopify id return only id
export const cleanShopifyId = (id: string) => {
  return id.replace("gid://shopify/Product/", "");
}


export const fetchUserDetails = async (userId: string, setUser: Function) => {
  try {
    const response = await fetch(`/api/users/${userId}`);
    const data = await response.json();

    if (response.ok) {
      setUser(data.user);
    } else {
      toast.error("Failed to fetch user details");
      setUser(null);
    }
  } catch (error) {
    toast.error("Error fetching user details");
    setUser(null);
  }
};

/**
 * Extracts the numeric ID from a Shopify GID string.
 * Example input: "gid://shopify/ProductVariant/50119401701680"
 * Output: "50119401701680"
 */
export function getNumericId(gid: string): string | null {
  const match = gid.match(/\d+$/);
  return match ? match[0] : null;
}

export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}