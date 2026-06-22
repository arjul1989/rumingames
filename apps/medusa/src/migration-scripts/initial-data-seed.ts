import { MedusaContainer } from "@medusajs/framework";
import {
  ContainerRegistrationKeys,
  ModuleRegistrationName,
  Modules,
  ProductStatus,
} from "@medusajs/framework/utils";
import {
  createApiKeysWorkflow,
  createInventoryLevelsWorkflow,
  createProductCategoriesWorkflow,
  createProductsWorkflow,
  createProductTypesWorkflow,
  createRegionsWorkflow,
  createSalesChannelsWorkflow,
  createShippingOptionsWorkflow,
  createStockLocationsWorkflow,
  createStoresWorkflow,
  createTaxRegionsWorkflow,
  linkSalesChannelsToApiKeyWorkflow,
  linkSalesChannelsToStockLocationWorkflow,
} from "@medusajs/medusa/core-flows";
import { CATALOG, PLATFORM_LABELS, PRODUCT_TYPES } from "../data/catalog";

// Gorumin — Colombia (RUM-10 / US-1.1). Single launch market: COP, country "co".
export default async function initial_data_seed({
  container,
}: {
  container: MedusaContainer;
}) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const link = container.resolve(ContainerRegistrationKeys.LINK);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);
  const fulfillmentModuleService = container.resolve(
    ModuleRegistrationName.FULFILLMENT
  );

  const countries = ["co"];

  logger.info("Seeding Gorumin store data (Colombia)...");
  const {
    result: [defaultSalesChannel],
  } = await createSalesChannelsWorkflow(container).run({
    input: {
      salesChannelsData: [
        {
          name: "Gorumin Colombia",
          description: "Canal de ventas principal para gorumin.com/co",
        },
      ],
    },
  });

  const {
    result: [publishableApiKey],
  } = await createApiKeysWorkflow(container).run({
    input: {
      api_keys: [
        {
          title: "Gorumin Storefront (CO)",
          type: "publishable",
          created_by: "",
        },
      ],
    },
  });

  await linkSalesChannelsToApiKeyWorkflow(container).run({
    input: {
      id: publishableApiKey.id,
      add: [defaultSalesChannel.id],
    },
  });

  await createStoresWorkflow(container).run({
    input: {
      stores: [
        {
          name: "Gorumin",
          supported_currencies: [
            {
              currency_code: "cop",
              is_default: true,
            },
            {
              // USD kept for reference against Fazer Cards wholesale prices.
              currency_code: "usd",
              is_default: false,
            },
          ],
          default_sales_channel_id: defaultSalesChannel.id,
        },
      ],
    },
  });

  logger.info("Seeding region data (Colombia)...");
  const { result: regionResult } = await createRegionsWorkflow(container).run({
    input: {
      regions: [
        {
          name: "Colombia",
          currency_code: "cop",
          countries,
          // Mercado Pago is the live provider for Colombia (Epic 3 / RUM-22);
          // it only registers when MP_ACCESS_TOKEN is configured. The system
          // provider is kept as a manual fallback for local testing.
          payment_providers: [
            "pp_system_default",
            ...(process.env.MP_ACCESS_TOKEN
              ? ["pp_mercadopago_mercadopago"]
              : []),
          ],
        },
      ],
    },
  });
  const region = regionResult[0];
  logger.info("Finished seeding regions.");

  logger.info("Seeding tax regions...");
  await createTaxRegionsWorkflow(container).run({
    input: countries.map((country_code) => ({
      country_code,
      provider_id: "tp_system",
    })),
  });
  logger.info("Finished seeding tax regions.");

  logger.info("Seeding stock location data...");
  const { result: stockLocationResult } = await createStockLocationsWorkflow(
    container
  ).run({
    input: {
      locations: [
        {
          name: "Gorumin Digital (CO)",
          address: {
            city: "Bogotá",
            country_code: "CO",
            address_1: "Entrega digital",
          },
        },
      ],
    },
  });
  const stockLocation = stockLocationResult[0];

  await link.create({
    [Modules.STOCK_LOCATION]: {
      stock_location_id: stockLocation.id,
    },
    [Modules.FULFILLMENT]: {
      fulfillment_provider_id: "manual_manual",
    },
  });

  logger.info("Seeding fulfillment data...");
  const { data: shippingProfileResult } = await query.graph({
    entity: "shipping_profile",
    fields: ["id"],
  });
  const shippingProfile = shippingProfileResult[0];

  const fulfillmentSet = await fulfillmentModuleService.createFulfillmentSets({
    name: "Entrega digital Colombia",
    type: "shipping",
    service_zones: [
      {
        name: "Colombia",
        geo_zones: [
          {
            country_code: "co",
            type: "country",
          },
        ],
      },
    ],
  });

  await link.create({
    [Modules.STOCK_LOCATION]: {
      stock_location_id: stockLocation.id,
    },
    [Modules.FULFILLMENT]: {
      fulfillment_set_id: fulfillmentSet.id,
    },
  });

  // Digital goods: a single zero-cost "delivery" option so checkout completes.
  await createShippingOptionsWorkflow(container).run({
    input: [
      {
        name: "Entrega digital",
        price_type: "flat",
        provider_id: "manual_manual",
        service_zone_id: fulfillmentSet.service_zones[0].id,
        shipping_profile_id: shippingProfile.id,
        type: {
          label: "Digital",
          description: "Recibe tu código por correo en segundos.",
          code: "digital",
        },
        prices: [
          {
            currency_code: "cop",
            amount: 0,
          },
          {
            region_id: region.id,
            amount: 0,
          },
        ],
        rules: [
          {
            attribute: "enabled_in_store",
            value: "true",
            operator: "eq",
          },
          {
            attribute: "is_return",
            value: "false",
            operator: "eq",
          },
        ],
      },
    ],
  });
  logger.info("Finished seeding fulfillment data.");

  await linkSalesChannelsToStockLocationWorkflow(container).run({
    input: {
      id: stockLocation.id,
      add: [defaultSalesChannel.id],
    },
  });
  logger.info("Finished seeding stock location data.");

  logger.info("Seeding product types...");
  const { result: productTypeResult } = await createProductTypesWorkflow(
    container
  ).run({
    input: {
      product_types: PRODUCT_TYPES.map((value) => ({ value })),
    },
  });
  const productTypeIdByValue = new Map(
    productTypeResult.map((t) => [t.value, t.id])
  );
  logger.info("Finished seeding product types.");

  logger.info("Seeding product categories...");
  // One category per platform present in the catalog.
  const platformsInCatalog = Array.from(
    new Set(CATALOG.map((p) => p.platform))
  );
  const { result: categoryResult } = await createProductCategoriesWorkflow(
    container
  ).run({
    input: {
      product_categories: platformsInCatalog.map((platform) => ({
        name: PLATFORM_LABELS[platform],
        is_active: true,
      })),
    },
  });
  const categoryIdByName = new Map(categoryResult.map((c) => [c.name, c.id]));
  logger.info("Finished seeding categories.");

  logger.info("Seeding product data (digital catalog)...");
  // Real catalog is synced from Fazer Cards in Epic 2 (RUM-15).
  await createProductsWorkflow(container).run({
    input: {
      products: CATALOG.map((product) => ({
        title: product.title,
        handle: product.handle,
        description: product.description,
        status: ProductStatus.PUBLISHED,
        type_id: productTypeIdByValue.get(product.product_type),
        category_ids: [categoryIdByName.get(PLATFORM_LABELS[product.platform])!],
        shipping_profile_id: shippingProfile.id,
        metadata: {
          platform: product.platform,
          product_type: product.product_type,
          delivery_type: product.delivery_type,
          region: "co",
        },
        options: [
          {
            title: product.option_title,
            values: product.variants.map((v) => v.label),
          },
        ],
        variants: product.variants.map((v) => ({
          title: v.label,
          sku: v.sku,
          options: { [product.option_title]: v.label },
          metadata: {
            fazer_sku_id: v.fazer_sku_id ?? "",
            face_value_usd: v.face_value_usd ?? null,
          },
          prices: [{ amount: v.cop, currency_code: "cop" }],
        })),
        sales_channels: [{ id: defaultSalesChannel.id }],
      })),
    },
  });
  logger.info(`Finished seeding ${CATALOG.length} products.`);

  logger.info("Seeding inventory levels.");
  const { data: inventoryItems } = await query.graph({
    entity: "inventory_item",
    fields: ["id"],
  });

  await createInventoryLevelsWorkflow(container).run({
    input: {
      inventory_levels: inventoryItems.map((item) => ({
        location_id: stockLocation.id,
        stocked_quantity: 1000000,
        inventory_item_id: item.id,
      })),
    },
  });
  logger.info("Finished seeding inventory levels data.");

  logger.info("Gorumin Colombia seed complete.");
}
