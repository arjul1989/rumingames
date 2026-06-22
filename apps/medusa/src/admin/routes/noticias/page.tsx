import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Newspaper } from "@medusajs/icons"
import {
  Container,
  Heading,
  Button,
  Table,
  Badge,
  FocusModal,
  Input,
  Textarea,
  Select,
  Label,
  toast,
} from "@medusajs/ui"
import { useEffect, useState } from "react"

type Category = { id: string; name: string }
type Article = {
  id: string
  title: string
  slug: string
  status: "draft" | "published" | "archived"
  category?: Category | null
  category_id?: string | null
  excerpt?: string | null
  body?: string
  cover_image?: string | null
  author?: string | null
  related_product_ids?: string[]
}
type ProductHit = { id: string; title: string; thumbnail?: string | null }

const STATUS_COLOR = { draft: "grey", published: "green", archived: "orange" } as const

const empty: Partial<Article> = {
  title: "",
  slug: "",
  excerpt: "",
  body: "",
  cover_image: "",
  author: "",
  status: "draft",
  category_id: null,
  related_product_ids: [],
}

const NoticiasPage = () => {
  const [articles, setArticles] = useState<Article[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<Partial<Article>>(empty)
  const [saving, setSaving] = useState(false)
  const [productQuery, setProductQuery] = useState("")
  const [productHits, setProductHits] = useState<ProductHit[]>([])

  const load = async () => {
    const [a, c] = await Promise.all([
      fetch("/admin/cms/articles?limit=100", { credentials: "include" }).then((r) => r.json()),
      fetch("/admin/cms/categories", { credentials: "include" }).then((r) => r.json()),
    ])
    setArticles(a.articles ?? [])
    setCategories(c.categories ?? [])
  }

  useEffect(() => {
    load()
  }, [])

  const openCreate = () => {
    setForm(empty)
    setOpen(true)
  }
  const openEdit = (a: Article) => {
    setForm({ ...a, category_id: a.category?.id ?? a.category_id ?? null })
    setOpen(true)
  }

  const searchProducts = async (q: string) => {
    setProductQuery(q)
    if (q.length < 2) return setProductHits([])
    const r = await fetch(`/admin/products?q=${encodeURIComponent(q)}&limit=8`, {
      credentials: "include",
    }).then((r) => r.json())
    setProductHits((r.products ?? []).map((p: ProductHit) => ({ id: p.id, title: p.title })))
  }

  const addProduct = (id: string) => {
    const ids = new Set(form.related_product_ids ?? [])
    ids.add(id)
    setForm((f) => ({ ...f, related_product_ids: [...ids] }))
  }
  const removeProduct = (id: string) => {
    setForm((f) => ({
      ...f,
      related_product_ids: (f.related_product_ids ?? []).filter((x) => x !== id),
    }))
  }

  const uploadCover = async (file: File) => {
    const fd = new FormData()
    fd.append("files", file)
    const r = await fetch("/admin/uploads", { method: "POST", credentials: "include", body: fd })
    const json = await r.json()
    const url = json.files?.[0]?.url
    if (url) {
      setForm((f) => ({ ...f, cover_image: url }))
      toast.success("Portada subida.")
    } else {
      toast.error("No se pudo subir la portada.")
    }
  }

  const save = async () => {
    if (!form.title || !form.body) {
      return toast.error("Título y contenido son obligatorios.")
    }
    setSaving(true)
    try {
      const isEdit = Boolean(form.id)
      const url = isEdit ? `/admin/cms/articles/${form.id}` : "/admin/cms/articles"
      const payload = {
        title: form.title,
        slug: form.slug || undefined,
        excerpt: form.excerpt,
        body: form.body,
        cover_image: form.cover_image,
        author: form.author,
        status: form.status,
        category_id: form.category_id,
        related_product_ids: form.related_product_ids ?? [],
      }
      const r = await fetch(url, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!r.ok) throw new Error((await r.json()).message ?? "Error")
      toast.success(isEdit ? "Artículo actualizado." : "Artículo creado.")
      setOpen(false)
      await load()
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  const remove = async (a: Article) => {
    if (!window.confirm(`¿Eliminar "${a.title}"?`)) return
    await fetch(`/admin/cms/articles/${a.id}`, { method: "DELETE", credentials: "include" })
    await load()
  }

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h1">Noticias</Heading>
        <Button size="small" onClick={openCreate}>
          Nueva noticia
        </Button>
      </div>

      <Table>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell>Título</Table.HeaderCell>
            <Table.HeaderCell>Categoría</Table.HeaderCell>
            <Table.HeaderCell>Estado</Table.HeaderCell>
            <Table.HeaderCell />
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {articles.map((a) => (
            <Table.Row key={a.id}>
              <Table.Cell>{a.title}</Table.Cell>
              <Table.Cell>{a.category?.name ?? "—"}</Table.Cell>
              <Table.Cell>
                <Badge color={STATUS_COLOR[a.status]} size="small">
                  {a.status}
                </Badge>
              </Table.Cell>
              <Table.Cell>
                <div className="flex gap-x-2">
                  <Button size="small" variant="secondary" onClick={() => openEdit(a)}>
                    Editar
                  </Button>
                  <Button size="small" variant="danger" onClick={() => remove(a)}>
                    Eliminar
                  </Button>
                </div>
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table>

      <FocusModal open={open} onOpenChange={setOpen}>
        <FocusModal.Content>
          <FocusModal.Header>
            <Button size="small" onClick={save} isLoading={saving}>
              Guardar
            </Button>
          </FocusModal.Header>
          <FocusModal.Body className="flex flex-col gap-y-4 overflow-y-auto p-6">
            <Heading level="h2">{form.id ? "Editar noticia" : "Nueva noticia"}</Heading>

            <div className="flex flex-col gap-y-1">
              <Label>Título</Label>
              <Input
                value={form.title ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              />
            </div>

            <div className="flex flex-col gap-y-1">
              <Label>Slug (opcional)</Label>
              <Input
                value={form.slug ?? ""}
                placeholder="se genera del título"
                onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-x-4">
              <div className="flex flex-col gap-y-1">
                <Label>Categoría</Label>
                <Select
                  value={form.category_id ?? ""}
                  onValueChange={(v) => setForm((f) => ({ ...f, category_id: v }))}
                >
                  <Select.Trigger>
                    <Select.Value placeholder="Selecciona" />
                  </Select.Trigger>
                  <Select.Content>
                    {categories.map((c) => (
                      <Select.Item key={c.id} value={c.id}>
                        {c.name}
                      </Select.Item>
                    ))}
                  </Select.Content>
                </Select>
              </div>
              <div className="flex flex-col gap-y-1">
                <Label>Estado</Label>
                <Select
                  value={form.status ?? "draft"}
                  onValueChange={(v) => setForm((f) => ({ ...f, status: v as Article["status"] }))}
                >
                  <Select.Trigger>
                    <Select.Value />
                  </Select.Trigger>
                  <Select.Content>
                    <Select.Item value="draft">Borrador</Select.Item>
                    <Select.Item value="published">Publicado</Select.Item>
                    <Select.Item value="archived">Archivado</Select.Item>
                  </Select.Content>
                </Select>
              </div>
            </div>

            <div className="flex flex-col gap-y-1">
              <Label>Autor</Label>
              <Input
                value={form.author ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, author: e.target.value }))}
              />
            </div>

            <div className="flex flex-col gap-y-1">
              <Label>Portada</Label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => e.target.files?.[0] && uploadCover(e.target.files[0])}
              />
              {form.cover_image && (
                <img src={form.cover_image} alt="cover" className="mt-2 h-24 w-auto rounded" />
              )}
            </div>

            <div className="flex flex-col gap-y-1">
              <Label>Extracto</Label>
              <Textarea
                rows={2}
                value={form.excerpt ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, excerpt: e.target.value }))}
              />
            </div>

            <div className="flex flex-col gap-y-1">
              <Label>Contenido (Markdown)</Label>
              <Textarea
                rows={12}
                value={form.body ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
              />
            </div>

            <div className="flex flex-col gap-y-1">
              <Label>Productos relacionados</Label>
              <Input
                value={productQuery}
                placeholder="Buscar producto…"
                onChange={(e) => searchProducts(e.target.value)}
              />
              {productHits.length > 0 && (
                <div className="border-ui-border-base mt-1 flex flex-col rounded border">
                  {productHits.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      className="hover:bg-ui-bg-base-hover px-3 py-2 text-left text-sm"
                      onClick={() => addProduct(p.id)}
                    >
                      {p.title}
                    </button>
                  ))}
                </div>
              )}
              <div className="mt-2 flex flex-wrap gap-2">
                {(form.related_product_ids ?? []).map((id) => (
                  <Badge key={id} size="small" className="cursor-pointer" onClick={() => removeProduct(id)}>
                    {id} ✕
                  </Badge>
                ))}
              </div>
            </div>
          </FocusModal.Body>
        </FocusModal.Content>
      </FocusModal>
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "Noticias",
  icon: Newspaper,
})

export default NoticiasPage
