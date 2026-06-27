import { defineRouteConfig } from "@medusajs/admin-sdk"
import { ComputerDesktop } from "@medusajs/icons"
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
import RoleGate from "../../components/role-gate"

type FeaturedGame = {
  id: string
  title: string
  slug: string
  status: "draft" | "published" | "archived"
  excerpt?: string | null
  body?: string | null
  cover_image?: string | null
  related_product_ids?: string[]
  home_position?: number | null
}
type ProductHit = { id: string; title: string }

const STATUS_COLOR = { draft: "grey", published: "green", archived: "orange" } as const

const empty: Partial<FeaturedGame> = {
  title: "",
  slug: "",
  excerpt: "",
  body: "",
  cover_image: "",
  status: "draft",
  related_product_ids: [],
  home_position: null,
}

const VideojuegosPage = () => {
  const [games, setGames] = useState<FeaturedGame[]>([])
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<Partial<FeaturedGame>>(empty)
  const [saving, setSaving] = useState(false)
  const [productQuery, setProductQuery] = useState("")
  const [productHits, setProductHits] = useState<ProductHit[]>([])

  const load = async () => {
    const r = await fetch("/admin/cms/featured-games?limit=100", { credentials: "include" })
    const json = await r.json()
    setGames(json.featured_games ?? [])
  }

  useEffect(() => {
    load()
  }, [])

  const openCreate = () => {
    setForm(empty)
    setOpen(true)
  }

  const openEdit = (game: FeaturedGame) => {
    setForm({
      ...game,
      related_product_ids: game.related_product_ids ?? [],
    })
    setOpen(true)
  }

  const searchProducts = async (q: string) => {
    setProductQuery(q)
    if (q.length < 2) return setProductHits([])
    const r = await fetch(`/admin/products?q=${encodeURIComponent(q)}&limit=8`, {
      credentials: "include",
    }).then((res) => res.json())
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
    if (!form.title) {
      return toast.error("El título es obligatorio.")
    }
    setSaving(true)
    try {
      const isEdit = Boolean(form.id)
      const url = isEdit
        ? `/admin/cms/featured-games/${form.id}`
        : "/admin/cms/featured-games"
      const payload = {
        title: form.title,
        slug: form.slug || undefined,
        excerpt: form.excerpt,
        body: form.body,
        cover_image: form.cover_image,
        status: form.status,
        related_product_ids: form.related_product_ids ?? [],
        home_position: form.home_position ?? null,
      }
      const r = await fetch(url, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const json = await r.json().catch(() => ({}))
      if (!r.ok) throw new Error(json.message ?? "Error")
      toast.success(isEdit ? "Videojuego actualizado." : "Videojuego creado.")
      setOpen(false)
      await load()
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  const remove = async (game: FeaturedGame) => {
    if (!window.confirm(`¿Eliminar "${game.title}"?`)) return
    await fetch(`/admin/cms/featured-games/${game.id}`, {
      method: "DELETE",
      credentials: "include",
    })
    await load()
  }

  const homeSlotsUsed = new Set(
    games.filter((g) => g.home_position && g.id !== form.id).map((g) => g.home_position)
  )

  return (
    <RoleGate permission="cms">
      <Container className="divide-y p-0">
        <div className="flex items-center justify-between px-6 py-4">
          <div>
            <Heading level="h1">Videojuegos</Heading>
            <p className="text-ui-fg-subtle mt-1 text-sm">
              Destaca hasta 3 videojuegos en el home. Asigna posición 1, 2 o 3 y vincula
              productos para el botón de compra.
            </p>
          </div>
          <Button size="small" onClick={openCreate}>
            Nuevo videojuego
          </Button>
        </div>

        <Table>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>Título</Table.HeaderCell>
              <Table.HeaderCell>Posición home</Table.HeaderCell>
              <Table.HeaderCell>Estado</Table.HeaderCell>
              <Table.HeaderCell />
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {games.map((game) => (
              <Table.Row key={game.id}>
                <Table.Cell>{game.title}</Table.Cell>
                <Table.Cell>
                  {game.home_position ? (
                    <Badge color="purple" size="small">
                      #{game.home_position}
                    </Badge>
                  ) : (
                    "—"
                  )}
                </Table.Cell>
                <Table.Cell>
                  <Badge color={STATUS_COLOR[game.status]} size="small">
                    {game.status}
                  </Badge>
                </Table.Cell>
                <Table.Cell>
                  <div className="flex gap-x-2">
                    <Button size="small" variant="secondary" onClick={() => openEdit(game)}>
                      Editar
                    </Button>
                    <Button size="small" variant="danger" onClick={() => remove(game)}>
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
              <Heading level="h2">
                {form.id ? "Editar videojuego" : "Nuevo videojuego"}
              </Heading>

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
                  <Label>Posición en home</Label>
                  <Select
                    value={form.home_position ? String(form.home_position) : "none"}
                    onValueChange={(v) =>
                      setForm((f) => ({
                        ...f,
                        home_position: v === "none" ? null : Number(v),
                      }))
                    }
                  >
                    <Select.Trigger>
                      <Select.Value placeholder="No mostrar en home" />
                    </Select.Trigger>
                    <Select.Content>
                      <Select.Item value="none">No mostrar en home</Select.Item>
                      {[1, 2, 3].map((slot) => (
                        <Select.Item
                          key={slot}
                          value={String(slot)}
                          disabled={homeSlotsUsed.has(slot)}
                        >
                          Posición {slot}
                          {homeSlotsUsed.has(slot) ? " (ocupada)" : ""}
                        </Select.Item>
                      ))}
                    </Select.Content>
                  </Select>
                </div>
                <div className="flex flex-col gap-y-1">
                  <Label>Estado</Label>
                  <Select
                    value={form.status ?? "draft"}
                    onValueChange={(v) =>
                      setForm((f) => ({ ...f, status: v as FeaturedGame["status"] }))
                    }
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
                <Label>Descripción (opcional)</Label>
                <Textarea
                  rows={6}
                  value={form.body ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
                />
              </div>

              <div className="flex flex-col gap-y-1">
                <Label>Productos asociados</Label>
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
                    <Badge
                      key={id}
                      size="small"
                      className="cursor-pointer"
                      onClick={() => removeProduct(id)}
                    >
                      {id} ✕
                    </Badge>
                  ))}
                </div>
                <p className="text-ui-fg-subtle mt-1 text-xs">
                  El primer producto se usa como destino principal del botón COMPRAR.
                </p>
              </div>
            </FocusModal.Body>
          </FocusModal.Content>
        </FocusModal>
      </Container>
    </RoleGate>
  )
}

export const config = defineRouteConfig({
  label: "Videojuegos",
  icon: ComputerDesktop,
})

export default VideojuegosPage
