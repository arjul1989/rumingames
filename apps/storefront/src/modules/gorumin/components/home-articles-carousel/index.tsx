import type { Article } from "@lib/data/cms"
import AutoCarousel from "@modules/gorumin/components/auto-carousel"
import HomeArticleSlide from "@modules/gorumin/components/home-article-slide"

export default function HomeArticlesCarousel({
  articles,
}: {
  articles: Article[]
}) {
  const slides = articles.slice(0, 3)
  if (!slides.length) return null

  return (
    <AutoCarousel aria-label="Noticias destacadas" intervalMs={7000}>
      {slides.map((article) => (
        <HomeArticleSlide key={article.id} article={article} />
      ))}
    </AutoCarousel>
  )
}
