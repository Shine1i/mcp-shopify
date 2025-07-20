export function formatGid(type: string, id: string): string {
  if (id.startsWith("gid://")) {
    return id;
  }
  return `gid://shopify/${type}/${id}`;
}

export function extractIdFromGid(gid: string): string {
  const parts = gid.split("/");
  return parts[parts.length - 1];
}

export function formatMoney(amount: string, currencyCode: string): string {
  const numAmount = parseFloat(amount);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currencyCode,
  }).format(numAmount);
}

export function mapEdgesToNodes<T>(edges: Array<{ node: T }>): T[] {
  return edges.map(edge => edge.node);
}