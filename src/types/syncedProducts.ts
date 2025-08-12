export interface Product {
    id: string;
    external_id: string;
    name: string;
    variants: number;
    synced: number;
    thumbnail_url: string;
    is_ignored: boolean;
    edmTemplateId?: string;
    printfulId?: string;
}
