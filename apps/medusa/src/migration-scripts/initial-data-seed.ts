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
  createRegionsWorkflow,
  createSalesChannelsWorkflow,
  createShippingOptionsWorkflow,
  createStockLocationsWorkflow,
  createStoresWorkflow,
  createTaxRegionsWorkflow,
  linkSalesChannelsToApiKeyWorkflow,
  linkSalesChannelsToStockLocationWorkflow,
} from "@medusajs/medusa/core-flows";

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
          // Mercado Pago provider is added in Epic 3 (RUM-22).
          payment_providers: ["pp_system_default"],
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

  logger.info("Seeding product data (gift card categories)...");

  const { result: categoryResult } = await createProductCategoriesWorkflow(
    container
  ).run({
    input: {
      product_categories: [
        { name: "Steam", is_active: true },
        { name: "PlayStation", is_active: true },
        { name: "Nintendo", is_active: true },
        { name: "Xbox", is_active: true },
        { name: "Riot Games", is_active: true },
        { name: "Free Fire", is_active: true },
      ],
    },
  });

  const steamCategory = categoryResult.find((c) => c.name === "Steam")!;

  // Example gift card. Real catalog is synced from Fazer Cards in Epic 2 (RUM-15).
  await createProductsWorkflow(container).run({
    input: {
      products: [
        {
          title: "Steam Gift Card",
          category_ids: [steamCategory.id],
          description:
            "Recarga tu billetera de Steam y compra juegos, DLC y más. Entrega digital inmediata.",
          handle: "steam-gift-card",
          status: ProductStatus.PUBLISHED,
          shipping_profile_id: shippingProfile.id,
          metadata: {
            platform: "steam",
            delivery_type: "digital_code",
            region: "co",
          },
          images: [
            {
              url: "https://medusa-public-images.s3.eu-west-1.amazonaws.com/tee-black-front.png",
            },
          ],
          options: [
            {
              title: "Valor",
              values: ["20.000 COP", "50.000 COP", "100.000 COP"],
            },
          ],
          variants: [
            {
              title: "20.000 COP",
              sku: "STEAM-CO-20000",
              options: { Valor: "20.000 COP" },
              metadata: { fazer_sku_id: "" },
              prices: [{ amount: 20000, currency_code: "cop" }],
            },
            {
              title: "50.000 COP",
              sku: "STEAM-CO-50000",
              options: { Valor: "50.000 COP" },
              metadata: { fazer_sku_id: "" },
              prices: [{ amount: 50000, currency_code: "cop" }],
            },
            {
              title: "100.000 COP",
              sku: "STEAM-CO-100000",
              options: { Valor: "100.000 COP" },
              metadata: { fazer_sku_id: "" },
              prices: [{ amount: 100000, currency_code: "cop" }],
            },
          ],
          sales_channels: [{ id: defaultSalesChannel.id }],
        },
      ],
    },
  });
  logger.info("Finished seeding product data.");

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
