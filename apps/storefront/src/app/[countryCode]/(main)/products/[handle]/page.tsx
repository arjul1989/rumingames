import { Metadata } from "next"
import { notFound } from "next/navigation"
import { listProducts } from "@lib/data/products"
import { getRegion, listRegions } from "@lib/data/regions"
import { absoluteUrl, localizedAlternates, SITE_NAME } from "@lib/seo"
import { getProductPrice } from "@lib/util/get-product-price"
import ProductTemplate from "@modules/gorumin/templates/product"
import JsonLd from "@modules/common/components/json-ld"
import { filterStorefrontProducts } from "@lib/storefront-catalog"

export const revalidate = 30

type Props = {
  params: Promise<{ countryCode: string; handle: string }>
  searchParams: Promise<{ v_id?: string }>
}

export async function generateStaticParams() {
  try {
    const countryCodes = await listRegions().then((regions) =>
      regions?.map((r) => r.countries?.map((c) => c.iso_2)).flat()
    )

    if (!countryCodes) {
      return []
    }

    const promises = countryCodes.map(async (country) => {
      const { response } = await listProducts({
        countryCode: country,
        queryParams: { limit: 100, fields: "handle" },
      })

      return {
        country,
        products: response.products,
      }
    })

    const countryProducts = await Promise.all(promises)

    return countryProducts
      .flatMap((countryData) =>
        countryData.products.map((product) => ({
          countryCode: countryData.country,
          handle: product.handle,
        }))
      )
      .filter((param) => param.handle)
  } catch (error) {
    console.error(
      `Failed to generate static paths for product pages: ${
        error instanceof Error ? error.message : "Unknown error"
      }.`
    )
    return []
  }
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params
  const { handle } = params
  const region = await getRegion(params.countryCode)

  if (!region) {
    notFound()
  }

  const product = await listProducts({
    countryCode: params.countryCode,
    queryParams: { handle },
  }).then(({ response }) => response.products[0])

  if (!product) {
    notFound()
  }

  return {
    title: product.title,
    description: product.description ?? `${product.title} en ${SITE_NAME}`,
    alternates: localizedAlternates(`products/${handle}`),
    openGraph: {
      title: `${product.title} — ${SITE_NAME}`,
      description: product.description ?? `${product.title} en ${SITE_NAME}`,
      type: "website",
      url: absoluteUrl(`co/products/${handle}`),
      images: product.thumbnail ? [product.thumbnail] : [],
    },
  }
}

export default async function ProductPage(props: Props) {
  const params = await props.params
  const region = await getRegion(params.countryCode)

  if (!region) {
    notFound()
  }

  const pricedProduct = filterStorefrontProducts(
    (
      await listProducts({
        countryCode: params.countryCode,
        queryParams: { handle: params.handle },
      })
    ).response.products
  )[0]

  if (!pricedProduct) {
    notFound()
  }

  const { cheapestPrice } = getProductPrice({ product: pricedProduct })
  const productUrl = absoluteUrl(
    `${params.countryCode}/products/${params.handle}`
  )
  const productLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: pricedProduct.title,
    description: pricedProduct.description ?? undefined,
    image: pricedProduct.thumbnail ? [pricedProduct.thumbnail] : undefined,
    brand: { "@type": "Brand", name: SITE_NAME },
    ...(cheapestPrice
      ? {
          offers: {
            "@type": "Offer",
            price: cheapestPrice.calculated_price_number,
            priceCurrency: cheapestPrice.currency_code.toUpperCase(),
            availability: "https://schema.org/InStock",
            url: productUrl,
          },
        }
      : {}),
  }

  return (
    <>
      <JsonLd data={productLd} id="ld-product" />
      <ProductTemplate
        product={pricedProduct}
        countryCode={params.countryCode}
      />
    </>
  )
}
