/** Maps Fazer category ids to existing Medusa catalog products for auto-provisioning. */
export interface FazerCategoryProductTarget {
  productHandle: string
  /** Unique per category — avoids SKU collisions when several categories share one product. */
  skuPrefix: string
}

/**
 * Every Fazer category we mirror for CO/LATAM/US/GLOBAL storefronts.
 * Add new rows here when Fazer introduces categories for platforms we sell.
 */
export const FAZER_CATEGORY_PRODUCT_MAP: Record<string, FazerCategoryProductTarget> = {
  // Steam Wallet
  steam_wallet_co: { productHandle: "steam-gift-card", skuPrefix: "STEAM-CO" },
  steam_wallet_us: { productHandle: "steam-gift-card", skuPrefix: "STEAM-US" },
  steam_wallet_global: { productHandle: "steam-gift-card", skuPrefix: "STEAM-GL" },

  // PlayStation Store
  playstation_us: { productHandle: "playstation-gift-card", skuPrefix: "PSN-US" },

  // Nintendo eShop
  nintendo_us: { productHandle: "nintendo-gift-card", skuPrefix: "NIN-US" },
  nintendo_switch_us: { productHandle: "nintendo-gift-card", skuPrefix: "NIN-SW-US" },

  // Riot ecosystem (Valorant, LoL, Wild Rift, access codes)
  valorant_latam: { productHandle: "riot-points", skuPrefix: "RIOT-VAL-LA" },
  valorant_us: { productHandle: "riot-points", skuPrefix: "RIOT-VAL-US" },
  league_of_legends_us: { productHandle: "riot-points", skuPrefix: "RIOT-LOL-US" },
  league_of_legends_latam: { productHandle: "riot-points", skuPrefix: "RIOT-LOL-LA" },
  wild_rift_us: { productHandle: "riot-points", skuPrefix: "RIOT-WR-US" },
  wild_rift_latam: { productHandle: "riot-points", skuPrefix: "RIOT-WR-LA" },
  riot_access_code_us: { productHandle: "riot-points", skuPrefix: "RIOT-AC-US" },
  riot_access_code_latam: { productHandle: "riot-points", skuPrefix: "RIOT-AC-LA" },

  // Free Fire
  free_fire_latam: { productHandle: "free-fire-diamantes", skuPrefix: "FF-LA" },
  garena_free_fire_global: { productHandle: "free-fire-diamantes", skuPrefix: "FF-GL" },

  // Xbox Game Pass
  xbox_game_pass_us: { productHandle: "xbox-game-pass-ultimate", skuPrefix: "XGP-US" },
  xbox_game_pass_co: { productHandle: "xbox-game-pass-ultimate", skuPrefix: "XGP-CO" },

  // Xbox Gift Cards
  xbox_us: { productHandle: "xbox-gift-card", skuPrefix: "XBOX-US" },
  xbox_co: { productHandle: "xbox-gift-card", skuPrefix: "XBOX-CO" },

  // Xbox in-game credits
  call_of_duty_xbox_global: { productHandle: "xbox-game-credits", skuPrefix: "XBOX-COD" },
  apex_legendstm_xbox: { productHandle: "xbox-game-credits", skuPrefix: "XBOX-APEX" },
  ea_sports_fctm_26_xbox_points: { productHandle: "xbox-game-credits", skuPrefix: "XBOX-EAFC" },
  tom_clancy_s_rainbow_six_extraction_xbox_react_credits: {
    productHandle: "xbox-game-credits",
    skuPrefix: "XBOX-R6E",
  },
  halo_infinite_xbox_halo_credits: { productHandle: "xbox-game-credits", skuPrefix: "XBOX-HALO" },
  tom_clancy_s_rainbow_six_siege_x_xbox_credits: {
    productHandle: "xbox-game-credits",
    skuPrefix: "XBOX-R6",
  },
  sea_of_thieves_xbox_coins: { productHandle: "xbox-game-credits", skuPrefix: "XBOX-SOT" },
}

/** Fallback when a synced category id is not listed above (uses platform from fazer_category). */
const PLATFORM_PRODUCT_FALLBACK: Record<string, FazerCategoryProductTarget> = {
  steam: { productHandle: "steam-gift-card", skuPrefix: "STEAM" },
  playstation: { productHandle: "playstation-gift-card", skuPrefix: "PSN" },
  nintendo: { productHandle: "nintendo-gift-card", skuPrefix: "NIN" },
  riot: { productHandle: "riot-points", skuPrefix: "RIOT" },
  free_fire: { productHandle: "free-fire-diamantes", skuPrefix: "FF" },
  xbox: { productHandle: "xbox-gift-card", skuPrefix: "XBOX" },
}

function skuPrefixFromCategoryId(fazerCategoryId: string): string {
  return fazerCategoryId
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 24)
}

export function resolveFazerCategoryProduct(
  fazerCategoryId: string,
  platform?: string | null
): FazerCategoryProductTarget | null {
  const explicit = FAZER_CATEGORY_PRODUCT_MAP[fazerCategoryId]
  if (explicit) return explicit

  if (platform && PLATFORM_PRODUCT_FALLBACK[platform]) {
    const base = PLATFORM_PRODUCT_FALLBACK[platform]
    return {
      productHandle: base.productHandle,
      skuPrefix: skuPrefixFromCategoryId(fazerCategoryId),
    }
  }

  return null
}

/** All product handles referenced by the Fazer category map (for ensuring catalog exists). */
export function listFazerMappedProductHandles(): string[] {
  const handles = new Set<string>()
  for (const target of Object.values(FAZER_CATEGORY_PRODUCT_MAP)) {
    handles.add(target.productHandle)
  }
  for (const target of Object.values(PLATFORM_PRODUCT_FALLBACK)) {
    handles.add(target.productHandle)
  }
  return [...handles]
}

/** Stable Medusa SKU for a Fazer offer (unique per category + offer id). */
export function buildFazerVariantSku(skuPrefix: string, offerId: string): string {
  const tail = offerId
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
  return `${skuPrefix}-FAZ-${tail}`
}
