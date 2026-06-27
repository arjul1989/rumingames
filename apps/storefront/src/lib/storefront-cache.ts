/** Default ISR window for Medusa catalog data (products, variants, prices). */
export const CATALOG_REVALIDATE_SECONDS = 30

export const PRODUCT_LIST_FIELDS =
  "*variants,*variants.calculated_price,*variants.options,+variants.inventory_quantity,*variants.images,*options,*options.values,+metadata,+tags"
