export type Chapter = {
  id: number
  title: string
  content: string
  status: string
}

export type Scene = {
  title: string
  text: string
  tag: string
  color: string
  chapterId?: number
}

export type CharacterModule = {
  id: string
  title: string
  content: string
}

export type CharacterProfile = {
  id: string
  name: string
  /** lead = 主角档案，support = 配角档案 */
  kind: "lead" | "support"
  role: string
  gender: string
  age: string
  height: string
  birthday: string
  hobby: string
  birthplace: string
  occupation: string
  desc: string
  coreEvent: string
  modules: CharacterModule[]
}

export type Relation = {
  id: string
  from: string
  to: string
  label: string
}

export type GraphPos = { x: number; y: number }

export type Book = {
  id: string
  name: string
  genre: string
  cover: string
  volume: string
  chapters: Chapter[]
  scenes: Scene[]
  active: number
  notes: string
  premise: string
  theme: string
  ending: string
  characters: CharacterProfile[]
  relations: Relation[]
  graph: Record<string, GraphPos>
}

export type HoverField =
  | "birthday"
  | "height"
  | "hobby"
  | "coreEvent"
  | "occupation"
  | "birthplace"
  | "age"

export const HOVER_FIELDS: { key: HoverField; label: string }[] = [
  { key: "birthday", label: "生日" },
  { key: "height", label: "身高" },
  { key: "hobby", label: "爱好" },
  { key: "coreEvent", label: "核心事件名称" },
  { key: "occupation", label: "职业" },
  { key: "birthplace", label: "出生地" },
  { key: "age", label: "年龄" },
]

export const DEFAULT_HOVER_FIELDS: HoverField[] = [
  "birthday",
  "height",
  "hobby",
  "coreEvent",
]

export function hoverValue(profile: CharacterProfile, key: HoverField): string {
  const value = profile[key]
  if (typeof value !== "string" || !value.trim()) return "未设定"
  if (key === "age") return `${value.trim()} 岁`
  return value
}

let seq = 0
export function uid(prefix = "id") {
  seq += 1
  return `${prefix}-${Date.now().toString(36)}-${seq}`
}

export function makeCharacter(
  input: Partial<CharacterProfile> & { name: string },
): CharacterProfile {
  return {
    id: input.id || uid("char"),
    name: input.name,
    kind: "support",
    role: "配角",
    gender: "未设定",
    age: "",
    height: "",
    birthday: "",
    hobby: "",
    birthplace: "",
    occupation: "",
    desc: "",
    coreEvent: "",
    modules: [],
    ...input,
  }
}