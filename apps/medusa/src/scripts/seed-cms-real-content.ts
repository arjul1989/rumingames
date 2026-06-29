import { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { CMS_MODULE } from "../modules/cms"
import type CmsModuleService from "../modules/cms/service"
import { slugify } from "../lib/cms"

// Real-world CMS content for Gorumin (noticias + streamers). Idempotent by slug.
// Run: npx medusa exec ./src/scripts/seed-cms-real-content.ts

const DEMO_ARTICLE_SLUGS = [
  "ofertas-steam-gift-cards",
  "guia-recargar-free-fire",
  "valorant-champions-final",
]

const DEMO_STREAMER_SLUGS = ["lunaplay"]

type ProductMap = Map<string, string>

const STREAMERS: Array<{
  name: string
  slug: string
  bio: string
  twitch_url: string
  youtube_url: string
  is_featured: boolean
  avatar: string
}> = [
  {
    name: "Juansguarnizo",
    slug: "juansguarnizo",
    bio: "Streamer colombiano con millones de seguidores. Just Chatting, variedades y comunidad latina en vivo.",
    twitch_url: "https://www.twitch.tv/juansguarnizo",
    youtube_url: "https://www.youtube.com/@Juansguarnizo",
    is_featured: true,
    avatar: "https://unavatar.io/twitch/juansguarnizo",
  },
  {
    name: "Ibai Llanos",
    slug: "ibai",
    bio: "Referente del streaming en español: eventos masivos, esports y entretenimiento desde España.",
    twitch_url: "https://www.twitch.tv/ibai",
    youtube_url: "https://www.youtube.com/@IbaiLlanos",
    is_featured: true,
    avatar: "https://unavatar.io/twitch/ibai",
  },
  {
    name: "Kai Cenat",
    slug: "kai-cenat",
    bio: "El streamer más seguido de Twitch. Maratones, reacciones y cultura pop en tiempo real.",
    twitch_url: "https://www.twitch.tv/kaicenat",
    youtube_url: "https://www.youtube.com/@KaiCenat",
    is_featured: true,
    avatar: "https://unavatar.io/twitch/kaicenat",
  },
  {
    name: "Rubius",
    slug: "rubius",
    bio: "Veterano del contenido gaming en español. Minecraft, variedades y millones de horas en directo.",
    twitch_url: "https://www.twitch.tv/rubius",
    youtube_url: "https://www.youtube.com/@Rubius",
    is_featured: false,
    avatar: "https://unavatar.io/twitch/rubius",
  },
  {
    name: "Auronplay",
    slug: "auronplay",
    bio: "Gameplay, humor y vlogs. Uno de los creadores más influyentes de la escena hispana.",
    twitch_url: "https://www.twitch.tv/auronplay",
    youtube_url: "https://www.youtube.com/@auronplay",
    is_featured: false,
    avatar: "https://unavatar.io/twitch/auronplay",
  },
  {
    name: "TheGrefg",
    slug: "thegrefg",
    bio: "Fortnite, retos imposibles y récords de audiencia. Referente del gaming competitivo.",
    twitch_url: "https://www.twitch.tv/thegrefg",
    youtube_url: "https://www.youtube.com/@TheGrefg",
    is_featured: false,
    avatar: "https://unavatar.io/twitch/thegrefg",
  },
  {
    name: "xQc",
    slug: "xqc",
    bio: "Streams intensos de variedad, reacciones y juegos competitivos. Audiencia global las 24 horas.",
    twitch_url: "https://www.twitch.tv/xqc",
    youtube_url: "https://www.youtube.com/@xQcOW",
    is_featured: false,
    avatar: "https://unavatar.io/twitch/xqc",
  },
  {
    name: "IShowSpeed",
    slug: "ishowspeed",
    bio: "Fenómeno global en YouTube y Twitch. Energía desbordada, fútbol, gaming y virales diarios.",
    twitch_url: "https://www.twitch.tv/ishowspeed",
    youtube_url: "https://www.youtube.com/@IShowSpeed",
    is_featured: true,
    avatar: "https://unavatar.io/youtube/IShowSpeed",
  },
  {
    name: "Ninja",
    slug: "ninja",
    bio: "Leyenda del streaming en Fortnite y shooters. Pionero que llevó el gaming en vivo al mainstream.",
    twitch_url: "https://www.twitch.tv/ninja",
    youtube_url: "https://www.youtube.com/@Ninja",
    is_featured: false,
    avatar: "https://unavatar.io/twitch/ninja",
  },
  {
    name: "Pokimane",
    slug: "pokimane",
    bio: "Una de las voces más reconocidas del streaming. Comunidad, variedades y gaming accesible.",
    twitch_url: "https://www.twitch.tv/pokimane",
    youtube_url: "https://www.youtube.com/@pokimane",
    is_featured: false,
    avatar: "https://unavatar.io/twitch/pokimane",
  },
]

function productId(map: ProductMap, handle: string): string[] {
  const id = map.get(handle)
  return id ? [id] : []
}

function articleCover(filename: string): string {
  return `/articles/${filename}`
}

function buildArticles(
  products: ProductMap,
  categoryId: string,
  tagIds: Record<string, string>,
  streamerIds: Record<string, string>
) {
  const daysAgo = (n: number) => new Date(Date.now() - n * 86400000)

  return [
    {
      title: "GTA 6: Rockstar revela portada y abre preventas el 25 de junio",
      slug: "gta-6-portada-preventas-junio-2026",
      excerpt:
        "La portada oficial ya está aquí. Preventas desde el 25 de junio y lanzamiento confirmado para el 19 de noviembre en PS5 y Xbox.",
      body: `**Rumin Noticias** — Rockstar acaba de mover el tablero: portada oficial de *Grand Theft Auto VI* y fecha de preventa confirmada para el **25 de junio de 2026**.

Jason y Lucia regresan a Vice City en el lanzamiento más esperado de la década. El juego sale el **19 de noviembre** en PlayStation 5 y Xbox Series X|S. Los tráilers previos superan los **446 millones de vistas** — la hype no es broma.

Todavía no hay precio oficial, pero con las preventas a la vuelta de la esquina, ese misterio se resolverá pronto. ¿$70? ¿$80? El debate sigue, pero una cosa es segura: millones van a reservar el day one.

**¿Listo para Vice City?** Recarga tu **PlayStation Store** o **Xbox** en Gorumin y ten saldo disponible el día que se abra la preventa. Entrega digital al instante, desde Colombia.`,
      cover_image: articleCover("gta-6-portada.jpg"),
      author: "Rumin Noticias",
      status: "published" as const,
      published_at: daysAgo(0),
      related_product_ids: [
        ...productId(products, "playstation-gift-card"),
        ...productId(products, "xbox-game-pass-ultimate"),
      ],
      tag_ids: [tagIds.lanzamientos, tagIds.playstation].filter(Boolean),
      category_id: categoryId,
    },
    {
      title: "State of Play junio 2026: Wolverine, God of War Laufey y Until Dawn 2",
      slug: "state-of-play-junio-2026-anuncios",
      excerpt:
        "Más de 60 minutos de anuncios: Marvel's Wolverine con gameplay, God of War Laufey, Tomb Raider y fechas para todo 2026.",
      body: `**Rumin Noticias** — Sony soltó un **State of Play** para recordarnos por qué PlayStation sigue en la cima.

Entre los titulares: **gameplay nuevo de Marvel's Wolverine**, el reveal de **God of War Laufey**, **Until Dawn 2**, fechas para *Control Resonant*, *Silent Hill Townfall* y *Tomb Raider: Legacy of Atlantis*. El calendario de PS5 para lo que queda de 2026 se ve brutal.

Si eres de los que ya tienen lista de deseos llena, este direct fue puro combustible.

**¿Tu wallet está lista?** Carga saldo en **PlayStation Store** con nuestras gift cards en Gorumin — código digital, sin filas, entrega inmediata en Colombia.`,
      cover_image: articleCover("state-of-play.jpg"),
      author: "Rumin Noticias",
      status: "published" as const,
      published_at: daysAgo(1),
      related_product_ids: productId(products, "playstation-gift-card"),
      tag_ids: [tagIds.playstation, tagIds.lanzamientos].filter(Boolean),
      category_id: categoryId,
    },
    {
      title: "Crimson Desert llega: el RPG de acción más ambicioso de marzo",
      slug: "crimson-desert-lanzamiento-marzo-2026",
      excerpt:
        "Pearl Abyss lanza su mundo abierto de fantasía tras años de espera. Disponible en PS5, Xbox Series y PC.",
      body: `**Rumin Noticias** — Llegó **Crimson Desert**, el ambicioso action-RPG de Pearl Abyss que promete combate visceral y un continente enorme por explorar.

Tras varios aplazamientos, el título ya está en **PS5, Xbox Series X|S y PC**. La crítica destaca el combate dinámico y la escala del mundo — ideal para quienes buscan su próxima obsesión de cien horas.

Si vas a comprarlo digital, asegúrate de tener saldo en tu tienda favorita antes del day one.

**¿A explorar el continente de Pywel?** Recarga **Steam**, **PlayStation Store** o **Xbox** en Gorumin y entra al juego en minutos.`,
      cover_image: articleCover("crimson-desert.jpg"),
      author: "Rumin Noticias",
      status: "published" as const,
      published_at: daysAgo(2),
      related_product_ids: [
        ...productId(products, "steam-gift-card"),
        ...productId(products, "playstation-gift-card"),
      ],
      tag_ids: [tagIds.lanzamientos, tagIds.steam].filter(Boolean),
      category_id: categoryId,
    },
    {
      title: "Switch 2 sube de precio: Nintendo confirma ajuste por escasez de chips",
      slug: "switch-2-aumento-precio-2026",
      excerpt:
        "La consola pasará a $499.99 USD en septiembre. Nintendo también separa precios digitales y físicos en sus juegos.",
      body: `**Rumin Noticias** — Nintendo confirmó un **aumento de precio del Switch 2** por la escasez global de memoria para chips de IA. La consola costará **$499.99 USD** a partir de septiembre de 2026.

Además, desde mayo los juegos first-party del Switch 2 tendrán **precios distintos en formato digital y físico**. Si compras en eShop, conviene planear con tiempo.

Con más de **19 millones de unidades vendidas**, la consola sigue imparable — pero tu billetera digital también debe estar preparada.

**¿Recargas eShop?** Compra **Nintendo eShop Gift Cards** en Gorumin: entrega al instante y denominations desde 50.000 COP.`,
      cover_image: articleCover("switch-2-precio.jpg"),
      author: "Rumin Noticias",
      status: "published" as const,
      published_at: daysAgo(3),
      related_product_ids: productId(products, "nintendo-gift-card"),
      tag_ids: [tagIds.nintendo, tagIds.switch2].filter(Boolean),
      category_id: categoryId,
    },
    {
      title: "Filtraciones masivas en Nintendo: remake de Ocarina of Time y más",
      slug: "filtraciones-nintendo-ocarina-remake-2026",
      excerpt:
        "Un ex empleado dice que Nintendo está 'furiosa'. Entre los juegos filtrados: Ocarina of Time remake y un nuevo Star Fox.",
      body: `**Rumin Noticias** — Las filtraciones de la hoja de ruta Nintendo sacudieron la industria. Entre lo filtrado: un **remake de The Legend of Zelda: Ocarina of Time** para fin de 2026, un **nuevo Star Fox** y títulos como *Splatoon Raiders* y *Rhythm Heaven: Groove*.

Kit Ellis, ex PR de Nintendo of America, dijo que la compañía está **"absolutamente furiosa"** — y que evitar spoilers será casi imposible en redes.

Para fans de Zelda, la emoción es real. Para Nintendo, es un golpe a su estrategia de sorpresas en Directs.

**¿Clásicos en Switch?** Ten saldo en **Nintendo eShop** listo con gift cards de Gorumin — cuando salgan, compras en segundos.`,
      cover_image: articleCover("ocarina-remake.jpg"),
      author: "Rumin Noticias",
      status: "published" as const,
      published_at: daysAgo(4),
      related_product_ids: productId(products, "nintendo-gift-card"),
      tag_ids: [tagIds.nintendo, tagIds.lanzamientos].filter(Boolean),
      category_id: categoryId,
    },
    {
      title: "Monster Hunter Stories 3: la saga de monstruos-tamers regresa con todo",
      slug: "monster-hunter-stories-3-marzo-2026",
      excerpt:
        "Capcom lanza la tercera entrega de la saga spin-off: criar, combinar y explorar en PS5, Xbox, PC y Switch 2.",
      body: `**Rumin Noticias** — **Monster Hunter Stories 3: Twisted Reflection** ya está disponible. Si la saga principal es cazar dragones del tamaño de edificios, *Stories* es otra vibra: **RPG por turnos, vínculos con monstruos y aventura más accesible**.

Llega a **PS5, Xbox Series, PC y Nintendo Switch 2** — perfecto para entrar al universo sin el learning curve del MH clásico.

**¿A criar tu primer Monstie?** Recarga **Nintendo eShop** o **Steam** en Gorumin y arranca la aventura hoy.`,
      cover_image: articleCover("monster-hunter-stories-3.jpg"),
      author: "Rumin Noticias",
      status: "published" as const,
      published_at: daysAgo(5),
      related_product_ids: [
        ...productId(products, "nintendo-gift-card"),
        ...productId(products, "steam-gift-card"),
      ],
      tag_ids: [tagIds.lanzamientos, tagIds.nintendo].filter(Boolean),
      category_id: categoryId,
    },
    {
      title: "EA Sports UFC 6 ya está aquí: crossplay y gráficos next-gen",
      slug: "ea-sports-ufc-6-lanzamiento-junio-2026",
      excerpt:
        "El simulador de MMA más grande estrena crossplay PS5/Xbox, Flow State y modos Historia. Disponible desde el 19 de junio.",
      body: `**Rumin Noticias** — **EA Sports UFC 6** golpeó las tiendas digitales con **crossplay entre PS5 y Xbox Series** por primera vez en la franquicia.

Nuevas mecánicas como **Flow State**, captura markerless y modos *Hall of Legends* y *The Legacy* prometen la entrega más realista de la saga. Los suscriptores de EA Play pueden probar hasta 10 horas gratis.

Si peleas online, necesitas el juego — y si no tienes saldo en tu consola, te quedas mirando el octágono.

**¿Listo para el combate?** Recarga **PlayStation Store** o **Xbox Game Pass Ultimate** en Gorumin y entra al octágono hoy.`,
      cover_image: articleCover("ufc-6.jpg"),
      author: "Rumin Noticias",
      status: "published" as const,
      published_at: daysAgo(6),
      related_product_ids: [
        ...productId(products, "playstation-gift-card"),
        ...productId(products, "xbox-game-pass-ultimate"),
      ],
      tag_ids: [tagIds.lanzamientos, tagIds.playstation].filter(Boolean),
      category_id: categoryId,
    },
    {
      title: "Star Fox regresa el 25 de junio: Nintendo revive a Fox McCloud",
      slug: "star-fox-regreso-junio-2026",
      excerpt:
        "Tras años de silencio, la saga de combate aéreo vuelve a Switch 2. Una de las sorpresas más comentadas del mes.",
      body: `**Rumin Noticias** — **Star Fox** vuelve a escena el **25 de junio**. Nintendo revive a **Fox McCloud** y su escuadrón en combate aéreo clásico, adaptado a la potencia del **Switch 2**.

Los fans llevaban años pidiendo el regreso de la saga — y según las filtraciones previas, este podría ser solo el comienzo de un revival más grande.

**¿A volar con el escuadrón?** Carga tu **Nintendo eShop** en Gorumin y ten el juego listo el día del lanzamiento.`,
      cover_image: articleCover("star-fox.jpg"),
      author: "Rumin Noticias",
      status: "published" as const,
      published_at: daysAgo(7),
      related_product_ids: productId(products, "nintendo-gift-card"),
      tag_ids: [tagIds.nintendo, tagIds.lanzamientos].filter(Boolean),
      category_id: categoryId,
    },
    {
      title: "Devil May Cry 5 llega a Switch 2: acción stylish en portátil",
      slug: "devil-may-cry-5-switch-2-junio-2026",
      excerpt:
        "Capcom trae el hack-and-slash aclamado a la consola híbrida de Nintendo. Combates frenéticos, donde sea.",
      body: `**Rumin Noticias** — **Devil May Cry 5** desembarca en **Nintendo Switch 2**. El hack-and-slash que enamoró en PS4 y Xbox ahora corre en la consola híbrida de Nintendo.

Nero, Dante y V regresan con el combate **stylish** que define la saga — ideal para sesiones intensas en casa o en movimiento.

**¿A subir tu rank de estilo?** Recarga **Nintendo eShop** en Gorumin y descarga el juego al instante.`,
      cover_image: articleCover("devil-may-cry-5.jpg"),
      author: "Rumin Noticias",
      status: "published" as const,
      published_at: daysAgo(8),
      related_product_ids: productId(products, "nintendo-gift-card"),
      tag_ids: [tagIds.nintendo, tagIds.lanzamientos].filter(Boolean),
      category_id: categoryId,
    },
    {
      title: "Marathon de Bungie ya está en vivo: extraction shooter futurista",
      slug: "marathon-bungie-lanzamiento-marzo-2026",
      excerpt:
        "El reboot del clásico de Bungie llega a PS5, Xbox Series y PC. Extracción, PvP y estética cyberpunk neón.",
      body: `**Rumin Noticias** — **Marathon** — el reboot del shooter de extracción de Bungie — ya está disponible en **PS5, Xbox Series X|S y PC**.

PvP intenso, extracción de loot y una estética futurista neón que recuerda al clásico de los 90, pero reinventado para 2026. Si te gustan los extraction shooters tipo *Tarkov* con ritmo más arcade, este es tu mes.

**¿A extraer loot?** Recarga **Steam**, **PlayStation Store** o **Xbox Game Pass** en Gorumin y entra a la carrera armado.`,
      cover_image: articleCover("marathon-bungie.jpg"),
      author: "Rumin Noticias",
      status: "published" as const,
      published_at: daysAgo(9),
      related_product_ids: [
        ...productId(products, "steam-gift-card"),
        ...productId(products, "xbox-game-pass-ultimate"),
      ],
      tag_ids: [tagIds.lanzamientos, tagIds.steam].filter(Boolean),
      category_id: categoryId,
      streamer_id: streamerIds["thegrefg"] ?? null,
    },
  ]
}

export default async function seedCmsRealContent({ container }: ExecArgs) {
  const logger = container.resolve("logger")
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const cms = container.resolve<CmsModuleService>(CMS_MODULE)

  // Ensure base categories exist.
  const ensureCategory = async (name: string, slug: string) => {
    const [found] = await cms.listArticleCategories({ slug })
    if (found) return found
    const [created] = await cms.createArticleCategories([{ name, slug }])
    return created
  }
  const ensureTag = async (name: string, slug: string) => {
    const [found] = await cms.listArticleTags({ slug })
    if (found) return found
    const [created] = await cms.createArticleTags([{ name, slug }])
    return created
  }

  const noticias = await ensureCategory("Noticias", "noticias")
  await ensureCategory("Reviews", "reviews")
  await ensureCategory("Esports", "esports")

  const tagLanzamientos = await ensureTag("Lanzamientos", "lanzamientos")
  const tagPlaystation = await ensureTag("PlayStation", "playstation")
  const tagNintendo = await ensureTag("Nintendo", "nintendo")
  const tagSteam = await ensureTag("Steam", "steam")
  const tagSwitch2 = await ensureTag("Switch 2", "switch-2")

  const tagIds = {
    lanzamientos: tagLanzamientos.id,
    playstation: tagPlaystation.id,
    nintendo: tagNintendo.id,
    steam: tagSteam.id,
    switch2: tagSwitch2.id,
  }

  // Remove old demo content.
  for (const slug of DEMO_ARTICLE_SLUGS) {
    const [article] = await cms.listArticles({ slug })
    if (article) await cms.deleteArticles([article.id])
  }
  for (const slug of DEMO_STREAMER_SLUGS) {
    const [streamer] = await cms.listStreamers({ slug })
    if (streamer) await cms.deleteStreamers([streamer.id])
  }

  const streamerIds: Record<string, string> = {}
  for (const data of STREAMERS) {
    const [existing] = await cms.listStreamers({ slug: data.slug })
    if (existing) {
      await cms.updateStreamers({ id: existing.id, ...data })
      streamerIds[data.slug] = existing.id
    } else {
      const [created] = await cms.createStreamers([data])
      streamerIds[data.slug] = created.id
    }
  }

  const { data: products } = await query.graph({
    entity: "product",
    fields: ["id", "handle"],
    pagination: { take: 50 },
  })
  const productMap: ProductMap = new Map(
    products.map((p: { id: string; handle: string }) => [p.handle, p.id])
  )

  const articles = buildArticles(productMap, noticias.id, tagIds, streamerIds)
  let created = 0
  let updated = 0

  for (const article of articles) {
    const [existing] = await cms.listArticles({ slug: article.slug })
    if (existing) {
      await cms.updateArticles({ id: existing.id, ...article })
      updated++
    } else {
      await cms.createArticles(article)
      created++
    }
  }

  logger.info(
    `CMS real content ready: ${STREAMERS.length} streamers, ${created} articles created, ${updated} updated.`
  )
  logger.info("Storefront: http://localhost:8000/co/noticias · http://localhost:8000/co/streamers")
}
