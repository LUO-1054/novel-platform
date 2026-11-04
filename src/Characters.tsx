import { useMemo, useRef, useState } from "react"
import type { PointerEvent as ReactPointerEvent, WheelEvent } from "react"
import type {
  Book,
  CharacterProfile,
  GraphPos,
  HoverField,
  Relation,
} from "./story"
import { HOVER_FIELDS, hoverValue, makeCharacter, uid } from "./story"

type Tab = "lead" | "support" | "graph"

type Props = {
  book: Book
  hoverFields: HoverField[]
  onUpdate: (
    patch: Partial<Pick<Book, "characters" | "relations" | "graph">>,
  ) => void
}

const NODE_W = 150
const NODE_H = 56
const ZOOM_MIN = 0.5
const ZOOM_MAX = 1.6

function fallbackPos(index: number): GraphPos {
  const col = index % 3
  const row = Math.floor(index / 3)
  return { x: 150 + col * 240, y: 70 + row * 160 }
}

export default function CharactersModule({ book, hoverFields, onUpdate }: Props) {
  const [tab, setTab] = useState<Tab>("lead")
  const [selectedId, setSelectedId] = useState(book.characters[0]?.id ?? "")
  const [editing, setEditing] = useState(false)
  const [creating, setCreating] = useState<null | "lead" | "support">(null)
  const [createName, setCreateName] = useState("")
  const [moduleDraft, setModuleDraft] = useState<null | {
    title: string
    content: string
  }>(null)
  const [askName, setAskName] = useState<string | null>(null)
  const [relationDraft, setRelationDraft] = useState<null | {
    from: string
    to: string
    label: string
  }>(null)
  const [newName, setNewName] = useState("")

  const leads = book.characters.filter((c) => c.kind === "lead")
  const supports = book.characters.filter((c) => c.kind === "support")
  const list = tab === "lead" ? leads : supports
  const selected =
    list.find((c) => c.id === selectedId) ?? list[0] ?? undefined

  const names = useMemo(() => {
    const set = new Set<string>()
    book.characters.forEach((c) => set.add(c.name))
    Object.keys(book.graph).forEach((n) => set.add(n))
    book.relations.forEach((r) => {
      set.add(r.from)
      set.add(r.to)
    })
    return [...set].filter(Boolean)
  }, [book.characters, book.graph, book.relations])

  function updateCharacter(id: string, patch: Partial<CharacterProfile>) {
    onUpdate({
      characters: book.characters.map((c) =>
        c.id === id ? { ...c, ...patch } : c,
      ),
    })
  }

  function createProfile(name: string, kind: "lead" | "support") {
    const trimmed = name.trim() || (kind === "lead" ? "新主角" : "新配角")
    if (book.characters.some((c) => c.name === trimmed)) {
      setTab(kind)
      const exist = book.characters.find((c) => c.name === trimmed)!
      setSelectedId(exist.id)
      setCreating(null)
      return
    }
    const profile = makeCharacter({
      name: trimmed,
      kind,
      role: kind === "lead" ? "主角" : "配角",
    })
    onUpdate({ characters: [...book.characters, profile] })
    setTab(kind)
    setSelectedId(profile.id)
    setEditing(true)
    setCreating(null)
    setCreateName("")
  }

  function openProfileByName(name: string) {
    const profile = book.characters.find((c) => c.name === name)
    if (profile) {
      setTab(profile.kind)
      setSelectedId(profile.id)
      setEditing(false)
    } else {
      setAskName(name)
    }
  }

  function addModule() {
    if (!selected || !moduleDraft) return
    const title = moduleDraft.title.trim()
    if (!title) return
    updateCharacter(selected.id, {
      modules: [
        ...selected.modules,
        { id: uid("mod"), title, content: moduleDraft.content.trim() },
      ],
    })
    setModuleDraft(null)
  }

  return (
    <div className="ch-module">
      <div className="ch-head">
        <div>
          <span className="ch-eyebrow">CHARACTERS · 人物设定</span>
          <h1>人物</h1>
        </div>
        <button
          className="ch-primary"
          onClick={() => {
            setCreating(tab === "support" ? "support" : "lead")
            setCreateName("")
          }}
        >
          <span>＋</span>
          {tab === "graph"
            ? "新建人物"
            : tab === "support"
              ? "新建配角"
              : "新建主角"}
        </button>
      </div>
      <div className="ch-tabs">
        {(
          [
            ["lead", "主角档案"],
            ["support", "配角档案"],
            ["graph", "关系网"],
          ] as [Tab, string][]
        ).map(([key, label]) => (
          <button
            key={key}
            className={tab === key ? "active" : ""}
            onClick={() => {
              setTab(key)
              setEditing(false)
            }}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="ch-body">
        {tab === "graph" ? (
          <GraphView
            book={book}
            names={names}
            hoverFields={hoverFields}
            onUpdate={onUpdate}
            onOpenProfile={openProfileByName}
            onAddRelation={() =>
              setRelationDraft({
                from: names[0] ?? "",
                to: names[1] ?? "",
                label: "",
              })
            }
            newName={newName}
            setNewName={setNewName}
            onAddName={(name) => {
              const trimmed = name.trim()
              if (!trimmed) return
              if (names.includes(trimmed)) return
              const boxes = names.map(
                (n, i) => book.graph[n] ?? fallbackPos(i),
              )
              const maxX = boxes.reduce(
                (m, p) => Math.max(m, p.x + NODE_W),
                80,
              )
              const minY = boxes.length
                ? Math.min(...boxes.map((p) => p.y))
                : 90
              const next =
                maxX > 1050
                  ? { x: 150, y: Math.max(...boxes.map((p) => p.y)) + 130 }
                  : { x: maxX + 46, y: minY }
              onUpdate({
                graph: {
                  ...book.graph,
                  [trimmed]: next,
                },
              })
              setNewName("")
            }}
          />
        ) : (
          <>
            <aside className="ch-list">
              <div className="ch-list-head">
                <span>{tab === "lead" ? "主角" : "配角"}</span>
                <small>{list.length} 位</small>
              </div>
              <div className="ch-list-scroll">
                {list.map((c) => (
                  <button
                    key={c.id}
                    className={`ch-list-item ${
                      selected?.id === c.id ? "active" : ""
                    }`}
                    onClick={() => {
                      setSelectedId(c.id)
                      setEditing(false)
                    }}
                  >
                    <span className="ch-mini-avatar">{c.name.slice(0, 1)}</span>
                    <span className="ch-list-text">
                      <strong>{c.name}</strong>
                      <small>
                        {c.role || (c.kind === "lead" ? "主角" : "配角")}
                        {c.age ? ` · ${c.age}岁` : ""}
                      </small>
                    </span>
                  </button>
                ))}
                {!list.length && (
                  <p className="ch-list-empty">
                    还没有{tab === "lead" ? "主角" : "配角"}档案。
                    <br />
                    新建一位，让 TA 走进故事。
                  </p>
                )}
              </div>
              <button
                className="ch-list-add"
                onClick={() => {
                  setCreating(tab === "support" ? "support" : "lead")
                  setCreateName("")
                }}
              >
                ＋ 新建{tab === "support" ? "配角" : "主角"}档案
              </button>
            </aside>

            <section className="ch-detail">
              {selected ? (
                <ProfileCard
                  profile={selected}
                  editing={editing}
                  onEdit={() => setEditing(true)}
                  onDone={() => setEditing(false)}
                  onChange={(patch) => updateCharacter(selected.id, patch)}
                  onDelete={() => {
                    if (!window.confirm(`确定删除「${selected.name}」的档案吗？`))
                      return
                    onUpdate({
                      characters: book.characters.filter(
                        (c) => c.id !== selected.id,
                      ),
                    })
                    setEditing(false)
                  }}
                  onAddModule={() => setModuleDraft({ title: "", content: "" })}
                  onRemoveModule={(id) =>
                    updateCharacter(selected.id, {
                      modules: selected.modules.filter((m) => m.id !== id),
                    })
                  }
                />
              ) : (
                <div className="ch-empty">
                  <span>人</span>
                  <h3>故事里，还没有这个人</h3>
                  <p>
                    点击右上角「新建{tab === "support" ? "配角" : "主角"}」，
                    为角色建立第一份档案。
                  </p>
                </div>
              )}
            </section>
          </>
        )}
      </div>

      {creating && (
        <div className="ch-overlay" onClick={() => setCreating(null)}>
          <div className="ch-dialog" onClick={(e) => e.stopPropagation()}>
            <h2>新建{creating === "lead" ? "主角" : "配角"}档案</h2>
            <p>先给 TA 一个名字，其余信息可以随时补充。</p>
            <input
              autoFocus
              value={createName}
              placeholder={creating === "lead" ? "例如：林深" : "例如：周素"}
              onChange={(e) => setCreateName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") createProfile(createName, creating)
              }}
            />
            <div className="ch-dialog-actions">
              <button onClick={() => setCreating(null)}>取消</button>
              <button
                className="dark"
                onClick={() => createProfile(createName, creating)}
              >
                创建档案
              </button>
            </div>
          </div>
        </div>
      )}

      {moduleDraft && (
        <div className="ch-overlay" onClick={() => setModuleDraft(null)}>
          <div className="ch-dialog" onClick={(e) => e.stopPropagation()}>
            <h2>新建档案模块</h2>
            <p>比如「人物弧光」「隐藏的秘密」「经典台词」。</p>
            <input
              autoFocus
              value={moduleDraft.title}
              placeholder="模块名称"
              onChange={(e) =>
                setModuleDraft({ ...moduleDraft, title: e.target.value })
              }
            />
            <textarea
              value={moduleDraft.content}
              placeholder="写下这个模块的内容……"
              onChange={(e) =>
                setModuleDraft({ ...moduleDraft, content: e.target.value })
              }
            />
            <div className="ch-dialog-actions">
              <button onClick={() => setModuleDraft(null)}>取消</button>
              <button className="dark" onClick={addModule}>
                添加模块
              </button>
            </div>
          </div>
        </div>
      )}

      {askName && (
        <div className="ch-overlay" onClick={() => setAskName(null)}>
          <div className="ch-dialog ch-ask" onClick={(e) => e.stopPropagation()}>
            <h2>是否创建「{askName}」的档案</h2>
            <p>
              「{askName}」还没有人物档案。创建后即可补充性别、身高、生日与核心事件。
            </p>
            <div className="ch-dialog-actions">
              <button onClick={() => setAskName(null)}>否</button>
              <button
                className="dark"
                onClick={() => {
                  createProfile(askName, "support")
                  setAskName(null)
                }}
              >
                是
              </button>
            </div>
          </div>
        </div>
      )}

      {relationDraft && (
        <div className="ch-overlay" onClick={() => setRelationDraft(null)}>
          <div className="ch-dialog" onClick={(e) => e.stopPropagation()}>
            <h2>添加人物关系</h2>
            <p>选择两位人物，并为这条关系写一个称呼。</p>
            <label className="ch-dialog-field">
              人物 A
              <select
                value={relationDraft.from}
                onChange={(e) =>
                  setRelationDraft({ ...relationDraft, from: e.target.value })
                }
              >
                {names.map((n) => (
                  <option key={n}>{n}</option>
                ))}
              </select>
            </label>
            <label className="ch-dialog-field">
              人物 B
              <select
                value={relationDraft.to}
                onChange={(e) =>
                  setRelationDraft({ ...relationDraft, to: e.target.value })
                }
              >
                {names.map((n) => (
                  <option key={n}>{n}</option>
                ))}
              </select>
            </label>
            <label className="ch-dialog-field">
              关系
              <input
                value={relationDraft.label}
                placeholder="例如：母女、挚友、青梅竹马"
                onChange={(e) =>
                  setRelationDraft({
                    ...relationDraft,
                    label: e.target.value,
                  })
                }
              />
            </label>
            <div className="ch-dialog-actions">
              <button onClick={() => setRelationDraft(null)}>取消</button>
              <button
                className="dark"
                onClick={() => {
                  const { from, to, label } = relationDraft
                  if (!from || !to || !label.trim()) return
                  if (from === to) return
                  const relation: Relation = {
                    id: uid("rel"),
                    from,
                    to,
                    label: label.trim(),
                  }
                  onUpdate({ relations: [...book.relations, relation] })
                  setRelationDraft(null)
                }}
              >
                添加关系
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function ProfileCard({
  profile,
  editing,
  onEdit,
  onDone,
  onChange,
  onDelete,
  onAddModule,
  onRemoveModule,
}: {
  profile: CharacterProfile
  editing: boolean
  onEdit: () => void
  onDone: () => void
  onChange: (patch: Partial<CharacterProfile>) => void
  onDelete: () => void
  onAddModule: () => void
  onRemoveModule: (id: string) => void
}) {
  const fields: [keyof CharacterProfile, string][] = [
    ["gender", "性别"],
    ["age", "年龄"],
    ["height", "身高"],
    ["birthday", "生日"],
    ["hobby", "爱好"],
    ["birthplace", "出生地"],
    ["occupation", "职业"],
  ]
  return (
    <article className="ch-card">
      <header className="ch-card-head">
        <div className="ch-portrait">{profile.name.slice(0, 1)}</div>
        <div className="ch-card-title">
          <h2>{editing ? "编辑档案" : profile.name}</h2>
          <div className="ch-chips">
            <span>{profile.kind === "lead" ? "主角" : "配角"}</span>
            {profile.age && <span>{profile.age} 岁</span>}
            {profile.occupation && <span>{profile.occupation}</span>}
          </div>
          {!editing && profile.desc && (
            <p className="ch-card-desc">{profile.desc}</p>
          )}
        </div>
        {!editing ? (
          <button className="ch-edit" onClick={onEdit}>
            编辑档案
          </button>
        ) : (
          <div className="ch-edit-actions">
            <button className="ch-delete" onClick={onDelete}>
              删除
            </button>
            <button className="ch-edit dark" onClick={onDone}>
              完成编辑
            </button>
          </div>
        )}
      </header>

      {editing && (
        <label className="ch-field ch-field-wide">
          角色名
          <input
            value={profile.name}
            onChange={(e) => onChange({ name: e.target.value })}
          />
        </label>
      )}

      <div className="ch-grid">
        {fields.map(([key, label]) => (
          <div className="ch-field" key={key}>
            <span>{label}</span>
            {editing ? (
              <input
                value={String(profile[key] ?? "")}
                placeholder={`填写${label}`}
                onChange={(e) => onChange({ [key]: e.target.value })}
              />
            ) : (
              <strong>
                {String(profile[key] ?? "") || "未设定"}
                {key === "age" ? " 岁" : ""}
              </strong>
            )}
          </div>
        ))}
      </div>

      <div className="ch-core">
        <span>核心事件</span>
        {editing ? (
          <textarea
            value={profile.coreEvent}
            placeholder="在这段故事里，TA 经历了什么？"
            onChange={(e) => onChange({ coreEvent: e.target.value })}
          />
        ) : (
          <p>{profile.coreEvent || "还没有记录核心事件。"}</p>
        )}
      </div>

      {editing && (
        <label className="ch-field ch-field-wide">
          人物简介
          <textarea
            value={profile.desc}
            placeholder="一句话写下这个人。"
            onChange={(e) => onChange({ desc: e.target.value })}
          />
        </label>
      )}

      <div className="ch-modules">
        {profile.modules.map((m) => (
          <div className="ch-module-card" key={m.id}>
            <div>
              <h3>{m.title}</h3>
              {editing && (
                <button
                  className="ch-module-remove"
                  aria-label={`删除${m.title}`}
                  onClick={() => onRemoveModule(m.id)}
                >
                  ×
                </button>
              )}
            </div>
            <p>{m.content || "写下这个模块的内容……"}</p>
          </div>
        ))}
        <button className="ch-module-add" onClick={onAddModule}>
          <span>＋ 新建模块</span>
          <small>按你的需要，为角色添加新的档案维度</small>
        </button>
      </div>
    </article>
  )
}

function GraphView({
  book,
  names,
  hoverFields,
  onUpdate,
  onOpenProfile,
  onAddRelation,
  onAddName,
  newName,
  setNewName,
}: {
  book: Book
  names: string[]
  hoverFields: HoverField[]
  onUpdate: (
    patch: Partial<Pick<Book, "characters" | "relations" | "graph">>,
  ) => void
  onOpenProfile: (name: string) => void
  onAddRelation: () => void
  onAddName: (name: string) => void
  newName: string
  setNewName: (value: string) => void
}) {
  const stage = useRef<HTMLDivElement>(null)
  const [pan, setPan] = useState<GraphPos>({ x: 28, y: 18 })
  const [zoom, setZoom] = useState(1)
  const [hover, setHover] = useState<null | { name: string; x: number; y: number }>(
    null,
  )
  const drag = useRef<null | {
    mode: "node" | "pan"
    name?: string
    sx: number
    sy: number
    ox: number
    oy: number
    moved: boolean
  }>(null)

  const positions: Record<string, GraphPos> = {}
  names.forEach((name, i) => {
    positions[name] = book.graph[name] ?? fallbackPos(i)
  })
  const profilesByName = new Map(book.characters.map((c) => [c.name, c]))
  const relations = book.relations.filter(
    (r) => positions[r.from] && positions[r.to],
  )

  function nodeCenter(name: string) {
    const p = positions[name]
    return { x: p.x + NODE_W / 2, y: p.y + NODE_H / 2 }
  }

  function moveNode(name: string, e: ReactPointerEvent<HTMLDivElement>) {
    const d = drag.current
    if (!d || d.mode !== "node" || d.name !== name) return
    const dx = (e.clientX - d.sx) / zoom
    const dy = (e.clientY - d.sy) / zoom
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) d.moved = true
    onUpdate({
      graph: {
        ...book.graph,
        [name]: { x: Math.round(d.ox + dx), y: Math.round(d.oy + dy) },
      },
    })
  }

  function startPan(e: ReactPointerEvent<HTMLDivElement>) {
    const target = e.target as HTMLElement
    if (target.closest(".ch-node") || target.closest(".ch-zoom")) return
    drag.current = {
      mode: "pan",
      sx: e.clientX,
      sy: e.clientY,
      ox: pan.x,
      oy: pan.y,
      moved: false,
    }
    stage.current?.setPointerCapture(e.pointerId)
  }

  function movePan(e: ReactPointerEvent<HTMLDivElement>) {
    if (drag.current?.mode !== "pan") return
    const d = drag.current
    setPan({
      x: d.ox + (e.clientX - d.sx),
      y: d.oy + (e.clientY - d.sy),
    })
  }

  function endPan() {
    drag.current = null
  }

  function zoomBy(delta: number) {
    setZoom((z) =>
      Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, Number((z + delta).toFixed(2)))),
    )
  }

  function onWheel(e: WheelEvent<HTMLDivElement>) {
    zoomBy(e.deltaY > 0 ? -0.08 : 0.08)
  }

  const hoverProfile = hover ? profilesByName.get(hover.name) : undefined
  const hoverRows = hoverProfile
    ? hoverFields.map((key) => ({
        label: HOVER_FIELDS.find((f) => f.key === key)?.label ?? key,
        value: hoverValue(hoverProfile, key),
      }))
    : []

  return (
    <div className="ch-graph">
      <div className="ch-graph-tools">
        <div className="ch-graph-hint">
          <span>
            {names.length} 位人物 · {relations.length} 组关系
          </span>
          <small>拖动人物调整位置 · 滚轮或按钮缩放 · 拖动空白处平移</small>
        </div>
        <div className="ch-graph-actions">
          <div className="ch-add-person">
            <input
              value={newName}
              placeholder="添加人物名称…"
              aria-label="添加人物名称"
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") onAddName(newName)
              }}
            />
            <button
              aria-label="添加人物"
              onClick={() => onAddName(newName)}
              disabled={!newName.trim()}
            >
              ＋
            </button>
          </div>
          <button
            className="ch-relate"
            onClick={onAddRelation}
            disabled={names.length < 2}
          >
            ⚭ 添加关系
          </button>
        </div>
      </div>

      <div
        className="ch-graph-stage"
        ref={stage}
        onPointerDown={startPan}
        onPointerMove={movePan}
        onPointerUp={endPan}
        onPointerCancel={endPan}
        onWheel={onWheel}
      >
        <div
          className="ch-graph-world"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          }}
        >
          <svg
            className="ch-edges"
            width={1600}
            height={1100}
            aria-hidden="true"
          >
            {relations.map((r) => {
              const a = nodeCenter(r.from)
              const b = nodeCenter(r.to)
              return (
                <line
                  key={r.id}
                  x1={a.x}
                  y1={a.y}
                  x2={b.x}
                  y2={b.y}
                  stroke="#dadada"
                  strokeWidth={1.2}
                />
              )
            })}
          </svg>
          {relations.map((r) => {
            const a = nodeCenter(r.from)
            const b = nodeCenter(r.to)
            return (
              <button
                key={`label-${r.id}`}
                className="ch-rel-label"
                title="点击移除这条关系"
                style={{
                  left: (a.x + b.x) / 2,
                  top: (a.y + b.y) / 2,
                }}
                onClick={() =>
                  onUpdate({
                    relations: book.relations.filter((x) => x.id !== r.id),
                  })
                }
                onPointerDown={(e) => e.stopPropagation()}
              >
                {r.label}
              </button>
            )
          })}
          {names.map((name) => {
            const p = positions[name]
            const profile = profilesByName.get(name)
            return (
              <div
                key={name}
                className={`ch-node ${profile ? "" : "is-empty"}`}
                style={{ left: p.x, top: p.y }}
                onPointerDown={(e) => {
                  e.stopPropagation()
                  drag.current = {
                    mode: "node",
                    name,
                    sx: e.clientX,
                    sy: e.clientY,
                    ox: p.x,
                    oy: p.y,
                    moved: false,
                  }
                  e.currentTarget.setPointerCapture(e.pointerId)
                }}
                onPointerMove={(e) => moveNode(name, e)}
                onPointerUp={() => {
                  if (drag.current?.mode === "node" && !drag.current.moved) {
                    onOpenProfile(name)
                  }
                  drag.current = null
                }}
                onMouseEnter={() => {
                  const center = nodeCenter(name)
                  const screenX = center.x * zoom + pan.x
                  const screenY = p.y * zoom + pan.y
                  setHover({ name, x: screenX, y: screenY })
                }}
                onMouseLeave={() => setHover(null)}
              >
                <span className="ch-node-avatar">{name.slice(0, 1)}</span>
                <span className="ch-node-text">
                  <strong>{name}</strong>
                  <small>
                    {profile
                      ? profile.role || (profile.kind === "lead" ? "主角" : "配角")
                      : "未建档"}
                  </small>
                </span>
              </div>
            )
          })}
        </div>

        {hover &&
          (() => {
            const stageW = stage.current?.clientWidth ?? 820
            const cardW = 236
            const above = hover.y > 200
            const left = Math.max(
              12,
              Math.min(hover.x - cardW / 2, stageW - cardW - 12),
            )
            return (
              <div
                className={`ch-float ${above ? "above" : "below"}`}
                style={{
                  left,
                  top: above
                    ? hover.y - 12
                    : hover.y + NODE_H * zoom + 12,
                }}
              >
                {hoverProfile ? (
                  <>
                    <div className="ch-float-head">
                      <span className="ch-float-avatar">
                        {hover.name.slice(0, 1)}
                      </span>
                      <div>
                        <strong>{hoverProfile.name}</strong>
                        <small>
                          {hoverProfile.role ||
                            (hoverProfile.kind === "lead" ? "主角" : "配角")}
                        </small>
                      </div>
                    </div>
                    {hoverRows.length ? (
                      <dl>
                        {hoverRows.map((row) => (
                          <div key={row.label}>
                            <dt>{row.label}</dt>
                            <dd>{row.value}</dd>
                          </div>
                        ))}
                      </dl>
                    ) : (
                      <p className="ch-float-hint">
                        还没有选择悬浮卡字段，可在「设置」中调整。
                      </p>
                    )}
                    <div className="ch-float-foot">
                      <span>查看完整档案 →</span>
                      <small>在「设置」中调整</small>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="ch-float-head">
                      <span className="ch-float-avatar">
                        {hover.name.slice(0, 1)}
                      </span>
                      <div>
                        <strong>{hover.name}</strong>
                        <small>尚未建档</small>
                      </div>
                    </div>
                    <p className="ch-float-hint">
                      这个人还没有档案，点击人物名称即可创建。
                    </p>
                  </>
                )}
              </div>
            )
          })()}

        <div className="ch-graph-tip">点击人物名称进入档案 · 悬浮查看简略档案</div>
        <div className="ch-zoom">
          <button aria-label="缩小" onClick={() => zoomBy(-0.1)}>
            −
          </button>
          <span>{Math.round(zoom * 100)}%</span>
          <button aria-label="放大" onClick={() => zoomBy(0.1)}>
            ＋
          </button>
          <i />
          <button
            aria-label="复位"
            onClick={() => {
              setZoom(1)
              setPan({ x: 28, y: 18 })
            }}
          >
            ↺
          </button>
        </div>

        {!names.length && (
          <div className="ch-graph-empty">
            <strong>关系网还是空的</strong>
            <p>先添加人物名称，再从右上角「添加关系」开始连线。</p>
          </div>
        )}
      </div>
    </div>
  )
}