import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Users } from "@medusajs/icons"
import {
  Container,
  Heading,
  Button,
  Table,
  Badge,
  FocusModal,
  Input,
  Textarea,
  Label,
  Switch,
  Text,
  toast,
} from "@medusajs/ui"
import { useEffect, useState } from "react"
import RoleGate from "../../components/role-gate"

type Streamer = {
  id: string
  name: string
  slug: string
  avatar?: string | null
  bio?: string | null
  twitch_url?: string | null
  youtube_url?: string | null
  is_featured: boolean
}

const empty: Partial<Streamer> = {
  name: "",
  avatar: "",
  bio: "",
  twitch_url: "",
  youtube_url: "",
  is_featured: false,
}

const StreamersPage = () => {
  const [streamers, setStreamers] = useState<Streamer[]>([])
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<Partial<Streamer>>(empty)
  const [saving, setSaving] = useState(false)
  const [streamerArticles, setStreamerArticles] = useState<{ id: string; title: string; status: string }[]>([])

  const openEdit = async (s: Streamer) => {
    setForm(s)
    setStreamerArticles([])
    setOpen(true)
    const r = await fetch(`/admin/cms/articles?streamer_id=${s.id}&limit=100`, {
      credentials: "include",
    }).then((r) => r.json())
    setStreamerArticles(r.articles ?? [])
  }

  const openCreate = () => {
    setForm(empty)
    setStreamerArticles([])
    setOpen(true)
  }

  const load = async () => {
    const r = await fetch("/admin/cms/streamers?limit=100", { credentials: "include" }).then((r) =>
      r.json()
    )
    setStreamers(r.streamers ?? [])
  }
  useEffect(() => {
    load()
  }, [])

  const save = async () => {
    if (!form.name) return toast.error("El nombre es obligatorio.")
    setSaving(true)
    try {
      const isEdit = Boolean(form.id)
      const url = isEdit ? `/admin/cms/streamers/${form.id}` : "/admin/cms/streamers"
      const r = await fetch(url, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      if (!r.ok) throw new Error((await r.json()).message ?? "Error")
      toast.success(isEdit ? "Streamer actualizado." : "Streamer creado.")
      setOpen(false)
      await load()
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  const remove = async (s: Streamer) => {
    if (!window.confirm(`¿Eliminar a ${s.name}?`)) return
    await fetch(`/admin/cms/streamers/${s.id}`, { method: "DELETE", credentials: "include" })
    await load()
  }

  return (
    <RoleGate permission="cms">
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h1">Streamers</Heading>
        <Button size="small" onClick={openCreate}>
          Nuevo streamer
        </Button>
      </div>

      <Table>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell>Nombre</Table.HeaderCell>
            <Table.HeaderCell>Destacado</Table.HeaderCell>
            <Table.HeaderCell />
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {streamers.map((s) => (
            <Table.Row key={s.id}>
              <Table.Cell>{s.name}</Table.Cell>
              <Table.Cell>
                {s.is_featured ? <Badge color="green" size="small">Destacado</Badge> : "—"}
              </Table.Cell>
              <Table.Cell>
                <div className="flex gap-x-2">
                  <Button size="small" variant="secondary" onClick={() => openEdit(s)}>
                    Editar
                  </Button>
                  <Button size="small" variant="danger" onClick={() => remove(s)}>
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
            <Heading level="h2">{form.id ? "Editar streamer" : "Nuevo streamer"}</Heading>
            <div className="flex flex-col gap-y-1">
              <Label>Nombre</Label>
              <Input
                value={form.name ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div className="flex flex-col gap-y-1">
              <Label>Avatar (URL)</Label>
              <Input
                value={form.avatar ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, avatar: e.target.value }))}
              />
            </div>
            <div className="flex flex-col gap-y-1">
              <Label>Bio</Label>
              <Textarea
                rows={3}
                value={form.bio ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-x-4">
              <div className="flex flex-col gap-y-1">
                <Label>Twitch URL</Label>
                <Input
                  value={form.twitch_url ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, twitch_url: e.target.value }))}
                />
              </div>
              <div className="flex flex-col gap-y-1">
                <Label>YouTube URL</Label>
                <Input
                  value={form.youtube_url ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, youtube_url: e.target.value }))}
                />
              </div>
            </div>
            <div className="flex items-center gap-x-2">
              <Switch
                checked={Boolean(form.is_featured)}
                onCheckedChange={(v) => setForm((f) => ({ ...f, is_featured: v }))}
              />
              <Label>Destacado en la comunidad</Label>
            </div>

            {form.id && (
              <div className="flex flex-col gap-y-2 border-t pt-4">
                <Label>Artículos del streamer</Label>
                {streamerArticles.length === 0 ? (
                  <Text size="small" className="text-ui-fg-muted">
                    Sin artículos asociados.
                  </Text>
                ) : (
                  <div className="flex flex-col gap-y-1">
                    {streamerArticles.map((a) => (
                      <div
                        key={a.id}
                        className="flex items-center justify-between rounded border px-3 py-2"
                      >
                        <span className="text-sm">{a.title}</span>
                        <Badge
                          size="small"
                          color={a.status === "published" ? "green" : "grey"}
                        >
                          {a.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </FocusModal.Body>
        </FocusModal.Content>
      </FocusModal>
    </Container>
    </RoleGate>
  )
}

export const config = defineRouteConfig({
  label: "Streamers",
  icon: Users,
})

export default StreamersPage
