export type SelectedOption = {
  name: string;
  value: string;
};

export type Metafield = {
  id: string;
  key: string;
  value: string;
};

export type MetafieldWithNamespace = Metafield & {
  namespace: string;
};

export type MediaPreview = {
  image: {
    id: string;
    url: string;
  };
};

export type MediaNode = {
  id: string;
  alt: string;
  preview: MediaPreview;
};

export type PageInfo = {
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  endCursor: string | null;
};

export type UserError = {
  field: string[];
  message: string;
};
