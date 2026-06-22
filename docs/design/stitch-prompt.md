# Prompt para Stitch — Gorumin (rumingames)

Documento listo para pegar en [Google Stitch](https://stitch.withgoogle.com/). El objetivo es **adaptar tu diseño visual existente al modelo de datos real** del proyecto, cubriendo:

1. **El sitio** (storefront público — Épica 7).
2. **Módulo de administración de productos** (gift cards, variantes, proveedor Fazer — Épicas 1/2/9).
3. **Módulo de administración de noticias e influencers** (CMS de artículos + streamers — Épica 4).

## Cómo usarlo con Stitch

- Stitch rinde mejor **una pantalla (o un flujo corto) por generación**. No pegues todo el documento de golpe.
- **Paso 1:** sube tu diseño actual como imagen de referencia y pega el bloque **`0. Contexto y sistema de diseño`**. Eso fija marca, tema y tokens visuales.
- **Paso 2:** genera cada pantalla pegando su bloque correspondiente (secciones 1, 2 y 3). Empieza por la **Épica 7 (storefront)**, luego los módulos de admin.
- Mantén el bloque `0` al inicio de cada prompt (o usa "edit" sobre la pantalla anterior) para que Stitch conserve la coherencia visual.
- Todo el texto de UI va en **español (es-CO)**. Moneda **COP** sin decimales (ej. `45.000 COP`).

---

## 0. Contexto y sistema de diseño (pegar SIEMPRE primero)

```
Contexto del producto:
Gorumin (gorumin.com) es una tienda de gift cards y recargas de videojuegos para
Colombia, con un enfoque "comunidad primero": noticias gaming, perfiles de streamers
y la tienda integrada. Idioma español (Colombia). Moneda Colombian Peso (COP),
mostrada sin decimales con separador de miles (ej. "45.000 COP").

Estilo visual (respeta la imagen de referencia que adjunté):
- Tema oscuro "gaming", moderno, con acentos de color neón/vibrante para CTAs.
- Mobile-first y totalmente responsive.
- Tipografía legible, jerarquía clara de títulos (un solo H1 por pantalla).
- Tarjetas con esquinas redondeadas, sombras suaves, badges para categorías/estado.
- Plataformas con identidad visual reconocible: Steam, PlayStation, Nintendo, Xbox,
  Riot Games, Free Fire.

Genera diseños limpios, consistentes entre pantallas y listos para implementar en
Next.js + Tailwind. Reutiliza los mismos componentes (header, footer, cards, botones,
badges) en todas las pantallas.
```

---

## 1. EL SITIO — Storefront (Épica 7)

> Rutas con prefijo de país: `/co`, `/co/noticias`, `/co/streamers`, `/co/tienda`, `/co/cuenta`.

### 1.1 Layout global: header + footer (US-7.1)

```
Diseña el layout global del storefront Gorumin (tema oscuro gaming).

Header (sticky, responsive):
- Logo "Gorumin" a la izquierda.
- Navegación principal: Noticias, Streamers, Tienda.
- A la derecha: ícono de búsqueda, ícono de carrito con contador de items,
  botón "Iniciar sesión".
- En móvil: menú hamburguesa con la misma navegación.

Footer:
- Columnas de enlaces: Tienda (por plataforma), Comunidad (Noticias, Streamers),
  Legal (Términos, Privacidad, Contacto).
- Selector de país (muestra "Colombia" / bandera CO).
- Redes sociales y copyright.

Muestra el layout con un contenido de ejemplo en el centro.
```

### 1.2 Home comunidad-first (US-7.2)

```
Diseña la página de inicio (/co) de Gorumin, enfocada en comunidad. Secciones de
arriba hacia abajo:

1. Hero: artículo destacado a pantalla ancha con imagen de portada (cover_image),
   categoría (badge), título (title), extracto (excerpt) y botón "Leer más".
2. "Noticias recientes": grid de 6 tarjetas de artículo. Cada tarjeta: imagen de
   portada, badge de categoría, título, autor y fecha de publicación.
3. "Streamers destacados": carrusel horizontal de tarjetas de streamer con avatar
   circular, nombre y un botón pequeño "Ver perfil".
4. "Cards populares": grid de 4 a 6 tarjetas de producto. Cada tarjeta: logo/imagen
   de la plataforma, título del producto, precio "desde X COP" y botón "Comprar".
5. CTA final: banner que invita a ir a la Tienda.

Datos de ejemplo: artículos de noticias gaming, streamers con avatar, y productos
como "Steam Gift Card", "PlayStation Store Gift Card", "Free Fire Diamantes".
```

### 1.3 Listado de noticias (US-7.3)

```
Diseña la página de listado de noticias (/co/noticias) de Gorumin.

- Título H1 "Noticias".
- Barra de filtros por categoría (chips/tabs): Noticias, Reviews, Esports,
  Streamers, Guías. Una categoría activa resaltada.
- Grid responsive de tarjetas de artículo: imagen de portada, badge de categoría,
  título, extracto corto, autor y fecha de publicación.
- Paginación o "cargar más" al final.
```

### 1.4 Detalle de noticia (US-7.3)

```
Diseña la página de detalle de un artículo (/co/noticias/[slug]) de Gorumin.

- Encabezado: badge de categoría, título grande (H1), autor, fecha de publicación
  y botones de compartir en redes (Open Graph).
- Imagen de portada (cover_image) ancha.
- Cuerpo del artículo (body) con formato rich text: párrafos, subtítulos (H2/H3),
  imágenes, listas.
- Lista de tags al final.
- Si el artículo está escrito por/sobre un streamer: mini-tarjeta del streamer con
  avatar, nombre y enlace a su perfil.
- Bloque "Productos relacionados": tarjetas de producto (de related_product_ids)
  con imagen, título, precio en COP y botón "Agregar al carrito".
```

### 1.5 Listado de streamers (US-7.4)

```
Diseña la página de streamers (/co/streamers) de Gorumin.

- Título H1 "Streamers".
- Sección superior "Destacados" (is_featured) con tarjetas más grandes.
- Grid de tarjetas de streamer: avatar circular, nombre, bio corta, íconos de
  enlace a Twitch y YouTube, y botón "Ver perfil".
```

### 1.6 Perfil de streamer (US-7.4)

```
Diseña el perfil de un streamer (/co/streamers/[slug]) de Gorumin.

- Cabecera: avatar grande, nombre (H1), bio completa, botones a Twitch (twitch_url)
  y YouTube (youtube_url), badge "Destacado" si aplica.
- Sección "Artículos relacionados": grid de tarjetas de los artículos asociados a
  este streamer (imagen, título, fecha).
```

### 1.7 Tienda — landing por categorías (US-7.5)

```
Diseña la página principal de la tienda (/co/tienda) de Gorumin.

- Título H1 "Tienda".
- Bloque de categorías por plataforma: tarjetas grandes con logo de Steam,
  PlayStation, Nintendo, Xbox, Riot Games y Free Fire que enlazan a su listado.
- Debajo, grid de productos destacados con tarjeta: imagen de plataforma, título,
  badge del tipo de producto (Gift Card, Recarga, Suscripción), precio "desde X COP"
  y botón "Comprar".
```

### 1.8 Tienda — listado por categoría (US-7.5)

```
Diseña el listado de productos de una categoría (/co/tienda/[categoria]) de Gorumin,
por ejemplo "Steam".

- Encabezado con el logo y nombre de la plataforma.
- Sidebar de filtros: tipo de producto (Gift Card, Recarga de juego, Suscripción)
  y rango de precio.
- Grid de tarjetas de producto: imagen, título, precio "desde X COP", badge de tipo
  y botón "Comprar".
```

### 1.9 Tienda — detalle de producto (US-7.5)

```
Diseña la página de detalle de producto (/co/tienda/producto/[slug]) de Gorumin.
Ejemplo: "Steam Gift Card".

- Imagen/arte de la plataforma a la izquierda.
- A la derecha: título (H1), badge de plataforma y de tipo (Gift Card / Recarga /
  Suscripción), descripción.
- Selector de variante por valor: botones/opciones con el label de cada variante
  (ej. "20.000 COP", "50.000 COP", "100.000 COP"; o para recargas "100 diamantes",
  "310 diamantes"; o para suscripción "1 mes", "3 meses"). Al seleccionar, se
  actualiza el precio mostrado en COP.
- Si el tipo de entrega es "recarga por ID" (topup_id), mostrar un campo "ID de
  jugador" requerido antes de agregar al carrito. Si es "código digital", indicar
  "Entrega digital inmediata por correo".
- Botón grande "Agregar al carrito".
- Bloque informativo: cómo se entrega el código, tiempo de entrega.

Datos de ejemplo de variantes para Steam Gift Card: 20.000 COP, 50.000 COP,
100.000 COP.
```

### 1.10 Carrito (US-7.5)

```
Diseña la página del carrito (/co/carrito) de Gorumin.

- Lista de items: imagen del producto, título, variante seleccionada, precio
  unitario COP, selector de cantidad y botón eliminar.
- Para items de recarga, mostrar el ID de jugador ingresado.
- Resumen lateral: subtotal, impuestos si aplica, total en COP y botón
  "Ir a pagar".
```

### 1.11 Checkout con Mercado Pago (US-7.6)

```
Diseña la página de checkout (/co/checkout) de Gorumin.

- Columna izquierda: formulario de datos del cliente (email, nombre) y bloque de
  pago integrado de Mercado Pago (tarjetas crédito/débito y PSE). Estilo "Payment
  Brick".
- Columna derecha: resumen del pedido con items, variantes, total en COP.
- Botón "Pagar" destacado.
```

### 1.12 Resultado de pago: éxito / pendiente / error (US-7.6)

```
Diseña 3 variantes de la pantalla de resultado de pago de Gorumin:
1. Éxito (/co/checkout/success): ícono de check verde, "¡Pago aprobado!", número de
   orden, mensaje "Tu código se está entregando" y botón "Ver mis órdenes".
2. Pendiente (/co/checkout/pending): ícono de reloj, "Pago pendiente", explicación
   de que se confirmará pronto.
3. Error (/co/checkout/failure): ícono de error, "El pago no se pudo procesar",
   botón "Reintentar".
```

### 1.13 Login y registro (US-7.7)

```
Diseña las pantallas de autenticación de Gorumin (tema oscuro gaming):
- Iniciar sesión: email, contraseña, botón "Entrar", enlace "Crear cuenta".
- Registro: nombre, email, contraseña, botón "Crear cuenta".
Tarjeta centrada con el logo arriba.
```

### 1.14 Mi cuenta — historial de órdenes (US-7.7)

```
Diseña la página de órdenes del cliente (/co/cuenta/ordenes) de Gorumin.

- Layout con sidebar de cuenta (Perfil, Órdenes, Cerrar sesión).
- Lista/tabla de órdenes: número de orden, fecha, total COP, y badge de estado de
  entrega (Pendiente, Procesando, Entregado, Fallido, Reembolsado).
- Cada fila enlaza al detalle de la orden.
```

### 1.15 Mi cuenta — detalle de orden + revelar código (US-7.7)

```
Diseña el detalle de una orden (/co/cuenta/ordenes/[id]) de Gorumin.

- Encabezado: número de orden, fecha, estado general y total en COP.
- Lista de items comprados: producto, variante, precio.
- Por cada item digital, un bloque "Tu código":
  - Si el estado de entrega es "Entregado": botón "Revelar código" que muestra el
    código (oculto por defecto, con opción de copiar).
  - Si es "Pendiente/Procesando": mensaje "Tu código se está preparando".
  - Si es "Fallido": mensaje de error y nota de soporte.
- Estados posibles de entrega: Pendiente, Procesando, Entregado, Fallido,
  Reembolsado.
```

---

## 2. MÓDULO DE ADMINISTRACIÓN DE PRODUCTOS (Épicas 1/2/9)

> Panel de administración interno (estilo dashboard, puede ser tema claro o el de
> Medusa Admin). Operadores gestionan catálogo, proveedor Fazer Cards y fulfillment.

### 2.1 Listado de productos

```
Diseña la pantalla de administración "Productos" de Gorumin (panel admin, layout
con sidebar de navegación: Productos, Órdenes, Proveedor Fazer, Noticias,
Streamers).

- Título "Productos" y botón "Crear producto".
- Barra de filtros: plataforma (Steam, PlayStation, Nintendo, Xbox, Riot, Free
  Fire), tipo (Gift Card, Recarga, Suscripción), estado.
- Tabla de productos: columnas Imagen, Título, Plataforma, Tipo, Nº de variantes,
  Estado (Activo / Inactivo / Sin stock), Precio desde (COP).
- Acciones por fila: editar, activar/desactivar.
```

### 2.2 Crear / editar producto + variantes

```
Diseña el formulario de edición de producto del admin de Gorumin.

Secciones:
1. General: Título, Handle (slug), Descripción (textarea), Imagen del producto.
2. Atributos (metadata): Plataforma (select: Steam, PlayStation, Nintendo, Xbox,
   Riot, Free Fire), Tipo de producto (Gift Card, Recarga de juego, Suscripción),
   Tipo de entrega (Código digital / Recarga por ID de jugador), Región (Colombia).
3. Variantes (tabla editable): Etiqueta (ej. "50.000 COP" o "310 diamantes"),
   SKU, Precio COP, Valor en USD (face_value_usd), SKU de Fazer (fazer_sku_id).
   Botón "Añadir variante".
4. Botones Guardar / Cancelar.
```

### 2.3 Mapeo con proveedor Fazer Cards + sincronización

```
Diseña la pantalla "Proveedor Fazer Cards" del admin de Gorumin.

- Widget superior: "Balance Fazer Cards" en USD, con alerta visual si está bajo
  un umbral.
- Botón "Sincronizar catálogo" y texto "Última sincronización: <fecha>".
- Tabla de mapeo de productos: Producto Medusa, Variante, SKU Fazer (fazer_sku_id),
  Último precio sincronizado (USD), Margen % (margin_pct), Estado (Activo /
  Inactivo / Sin stock), Última sincronización.
- Acciones: editar margen, activar/desactivar.
```

### 2.4 Órdenes y entregas digitales (fulfillment)

```
Diseña la pantalla "Órdenes" del admin de Gorumin enfocada en fulfillment digital.

- Filtros por estado de entrega: Pendiente, Procesando, Entregado, Fallido,
  Reembolsado.
- Tabla: Nº de orden, Cliente, Producto/variante, Estado de pago (Mercado Pago),
  Estado de entrega (badge de color), Nº de orden Fazer (fazer_order_id), Fecha.
- Vista de detalle de una orden fallida: mensaje de error de Fazer y acciones
  "Reintentar fulfillment" y "Marcar para reembolso (Mercado Pago)".
```

---

## 3. MÓDULO DE ADMINISTRACIÓN DE NOTICIAS E INFLUENCERS (Épica 4)

> CMS nativo. Editores gestionan artículos y perfiles de streamers, separado
> visualmente del módulo de productos.

### 3.1 Listado de artículos / noticias

```
Diseña la pantalla "Noticias" del admin de Gorumin (CMS).

- Título "Noticias" y botón "Nuevo artículo".
- Filtros: categoría (Noticias, Reviews, Esports, Streamers, Guías) y estado
  (Borrador, Publicado, Archivado).
- Tabla de artículos: Imagen de portada (miniatura), Título, Categoría, Autor,
  Estado (badge), Fecha de publicación.
- Acciones por fila: editar, publicar/despublicar, vista previa.
```

### 3.2 Editor de artículo

```
Diseña el editor de artículo del CMS de Gorumin.

Layout de dos columnas:
Columna principal:
- Campo Título.
- Campo Slug (editable, con validación de unicidad).
- Campo Extracto (excerpt, textarea corto).
- Editor de contenido rich text / Markdown para el cuerpo (body), con barra de
  herramientas (negrita, itálica, encabezados, listas, enlaces, insertar imagen).

Columna lateral (panel):
- Estado: Borrador / Publicado / Archivado, con botón "Publicar".
- Fecha de publicación (published_at).
- Imagen de portada (cover_image): zona de subida de imagen.
- Autor.
- Categoría (select).
- Tags (input de múltiples etiquetas).
- "Streamer relacionado" (select opcional).
- "Productos relacionados": selector que busca productos de Medusa y los añade como
  chips (related_product_ids).
- Sección SEO: Título SEO (seo_title), Meta descripción (seo_description), imagen
  Open Graph (og_image) y una vista previa de cómo se verá en Google.
```

### 3.3 Listado de streamers / influencers

```
Diseña la pantalla "Streamers" del admin de Gorumin.

- Título "Streamers" y botón "Nuevo streamer".
- Grid o tabla: Avatar, Nombre, badge "Destacado" (is_featured), enlaces Twitch y
  YouTube, Nº de artículos asociados.
- Acciones: editar, marcar/desmarcar destacado, eliminar.
```

### 3.4 Editor de streamer

```
Diseña el formulario de edición de streamer del admin de Gorumin.

Campos:
- Avatar (zona de subida de imagen, vista circular).
- Nombre.
- Slug (editable, validación de unicidad).
- Bio (textarea).
- URL de Twitch (twitch_url).
- URL de YouTube (youtube_url).
- Toggle "Destacado" (is_featured).
- Sección "Artículos del streamer": lista de artículos relacionados (solo lectura,
  con enlace a editar).
- Botones Guardar / Cancelar.
```

---

## Referencia rápida del modelo de datos

| Entidad | Campos clave |
|---|---|
| **Product** (Medusa) | title, handle, description, metadata: `platform`, `product_type` (gift_card/game_topup/subscription), `delivery_type` (digital_code/topup_id), `region` |
| **Variant** | label, sku, precio COP, metadata: `fazer_sku_id`, `face_value_usd` |
| **SupplierProductMapping** | medusa_product_id, medusa_variant_id, fazer_sku_id, last_synced_price_usd, margin_pct, status (active/inactive/out_of_stock), last_synced_at |
| **DigitalDelivery** | order_id, line_item_id, fazer_order_id, code (encriptado), status (pending/processing/delivered/failed/refunded), delivered_at |
| **Article** | title, slug, excerpt, body, cover_image, author, status (draft/published/archived), published_at, related_product_ids, tag_ids, category, streamer |
| **ArticleCategory** | name, slug (Noticias, Reviews, Esports, Streamers, Guías) |
| **ArticleTag** | name, slug |
| **Streamer** | name, slug, avatar, bio, twitch_url, youtube_url, is_featured, articles |

**Plataformas:** Steam, PlayStation, Nintendo, Xbox, Riot Games, Free Fire.
**País / moneda MVP:** Colombia (CO) / COP. **Pago:** Mercado Pago. **Idioma:** es-CO.
