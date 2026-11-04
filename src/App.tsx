import { useEffect, useLayoutEffect, useRef, useState } from "react"
import type { CSSProperties, ReactNode, RefObject, SetStateAction } from "react"
import CharactersModule from "./Characters"
import { DEFAULT_HOVER_FIELDS, HOVER_FIELDS, makeCharacter } from "./story"
import type { Book, Chapter, HoverField, Scene } from "./story"
import "./outline.css"

type IconName = "feather" | "book" | "outline" | "search" | "settings" | "plus" | "chevron" | "back" | "more" | "file" | "check" | "export" | "panel" | "focus" | "sun" | "close" | "target" | "clock" | "leaf" | "users" | "arrow"
function Icon({
  name,
  size = 20,
  ...props
}: {
  name: IconName
  size?: number
  className?: string
}) {
  const paths: Record<IconName, ReactNode> = {
    feather: (
      <>
        <path d="M20 3c-6-2-13 2-13 9v5l5-1C19 14 23 7 20 3Z" />
        <path d="m3 21 12-12M7 17v-5m4 1h5" />
      </>
    ),
    book: (
      <>
        <path d="M12 5v15M3 4c3-1 6-1 9 1 3-2 6-2 9-1v15c-3-1-6-1-9 1-3-2-6-2-9-1Z" />
      </>
    ),
    outline: (
      <>
        <rect x="3" y="3" width="7" height="5" rx="1" />
        <rect x="14" y="15" width="7" height="5" rx="1" />
        <path d="M6 8v9h8M14 5h7M14 8h4" />
      </>
    ),
    search: (
      <>
        <circle cx="10.5" cy="10.5" r="6.5" />
        <path d="m16 16 5 5" />
      </>
    ),
    settings: (
      <>
        <path d="m9 3-1 3-3 1-2 3 2 3v4l4 1 3 3 3-3 4-1v-4l2-3-2-3-3-1-1-3Z" />
        <circle cx="12" cy="11" r="3" />
      </>
    ),
    plus: <path d="M12 5v14M5 12h14" />,
    chevron: <path d="m9 5 7 7-7 7" />,
    back: <path d="m14 6-6 6 6 6" />,
    more: (
      <>
        <circle cx="5" cy="12" r="1" />
        <circle cx="12" cy="12" r="1" />
        <circle cx="19" cy="12" r="1" />
      </>
    ),
    file: (
      <>
        <path d="M14 3H5v18h14V8Z" />
        <path d="M14 3v6h5M8 13h8M8 17h5" />
      </>
    ),
    check: <path d="m5 12 4 4L19 6" />,
    export: (
      <>
        <path d="M12 15V3m-4 4 4-4 4 4M5 13v7h14v-7" />
      </>
    ),
    panel: (
      <>
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <path d="M15 4v16" />
      </>
    ),
    focus: <path d="M9 3H3v6m12-6h6v6M3 15v6h6m6 0h6v-6" />,
    sun: (
      <>
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1 1m12 12 1 1M5 19l1-1M18 6l1-1" />
      </>
    ),
    close: <path d="m6 6 12 12M6 18 18 6" />,
    target: (
      <>
        <circle cx="12" cy="12" r="9" />
        <circle cx="12" cy="12" r="5" />
        <circle cx="12" cy="12" r="1" />
      </>
    ),
    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
    leaf: (
      <>
        <path d="M20 3C9 1 2 8 6 15s16 2 14-12Z" />
        <path d="M4 21 15 10" />
      </>
    ),
    users: (
      <>
        <circle cx="9" cy="8" r="3" />
        <path d="M3 20v-2a6 6 0 0 1 12 0v2M16 5a3 3 0 0 1 0 6m3 9v-2a6 6 0 0 0-2-4" />
      </>
    ),
    arrow: <path d="M4 12h16m-6-6 6 6-6 6" />,
  }
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {paths[name]}
    </svg>
  )
}

const OUTLINE_MODULES: {
  key: "world" | "characters" | "events" | "structure"
  no: string
  en: string
  title: string
  desc: string
  icon: IconName
}[] = [
  {
    key: "world",
    no: "01",
    en: "WORLD",
    title: "世界观",
    desc: "时代、地域、规则与氛围，让故事有可以呼吸的空间。",
    icon: "leaf",
  },
  {
    key: "characters",
    no: "02",
    en: "CHARACTERS",
    title: "人物",
    desc: "主角、配角与他们之间的关系，决定故事的温度。",
    icon: "users",
  },
  {
    key: "events",
    no: "03",
    en: "EVENTS",
    title: "事件",
    desc: "把情节拆成可以落笔的瞬间，让故事一点点发生。",
    icon: "file",
  },
  {
    key: "structure",
    no: "04",
    en: "STRUCTURE",
    title: "结构",
    desc: "幕、章节节奏与线索收束，决定故事如何被读完。",
    icon: "outline",
  },
]

const firstText = `<p>九月的最后一天，林深收到了一封没有署名的信。</p><p>信封是旧式的牛皮纸，边角微微泛黄，像是被某个人珍藏了许多年。邮戳模糊，只依稀辨认出一个地名——青川。</p><p>那是他离开了整整十年的故乡。</p><p>窗外的雨下得很慢。水珠沿着玻璃蜿蜒而下，把对面楼房的灯火晕染成一片模糊的暖黄。他放下手里的咖啡，用裁纸刀小心地划开了信封。</p><p>里面只有一张薄薄的信纸，和一张老照片。</p><p>照片上是夏天的青川。河水穿过小镇，岸边的香樟树枝叶繁茂，树下站着三个少年。最左边的那个是他，穿着洗得发白的蓝色校服，笑得有些腼腆。</p><p>他已经很久没有这样笑过了。</p><p>林深翻过照片，背面有一行清秀的小字：</p><p>“如果你还记得，就在秋天回来吧。”</p><p>他认得这个笔迹。</p><p>时钟的秒针走过了一圈。他坐在原处，听着雨声，忽然觉得这些年奔忙的日子，像一列从未停靠的火车。而此刻，有人在很远的地方，轻轻扳动了道岔。</p><p>他拿起手机，打开了订票软件。</p>`
const initialChapters: Chapter[] = [
  { id: 1, title: "一封远方的来信", content: firstText, status: "写作中" },
  {
    id: 2,
    title: "回到青川",
    content:
      "<p>清晨六点，开往青川的列车缓缓驶出了站台。</p><p>林深靠着窗，看着城市的轮廓一点点退向身后。十年了，他终于踏上了回家的路。</p>",
    status: "草稿",
  },
  {
    id: 3,
    title: "旧时的香樟树",
    content:
      "<p>那棵香樟树还在。</p><p>树下的石凳已经长满了青苔，阳光穿过叶隙，落下细碎的光斑。</p>",
    status: "草稿",
  },
  {
    id: 4,
    title: "重逢",
    content:
      "<p>“好久不见，林深。”</p><p>熟悉的声音从身后传来。他转过身，仿佛看见了十年前的那个夏天。</p>",
    status: "未开始",
  },
  { id: 5, title: "被遗忘的夏天", content: "", status: "未开始" },
]
const initialScenes = [
  {
    title: "一封神秘来信",
    text: "林深收到一封来自故乡的匿名信，信中夹着一张旧照片。",
    tag: "故事开端",
    color: "purple",
  },
  {
    title: "记忆的涟漪",
    text: "照片唤醒了沉睡的往事，也带出了他一直回避的人。",
    tag: "情绪铺垫",
    color: "orange",
  },
  {
    title: "回乡的决定",
    text: "在城市的雨夜中，林深决定回到阔别十年的青川。",
    tag: "情节转折",
    color: "green",
  },
]
const initialBooks: Book[] = [
  {
    id: "wind",
    name: "风起时，想你",
    genre: "现实情感",
    cover: "风起时",
    volume: "第一卷 · 归途",
    chapters: initialChapters,
    scenes: initialScenes.map((scene, i) => ({ ...scene, chapterId: i + 1 })),
    active: 1,
    notes: "",
    premise:
      "一封意外的来信，让离乡十年的林深重返青川，在重逢中找回被遗忘的自己。",
    theme: "关于故乡、错过与重逢。人可以走得很远，却总有一个地方值得回来。",
    ending: "林深决定留下来，和许知夏一起修复老街上的书店。",
    characters: [
      makeCharacter({
        name: "林深",
        kind: "lead",
        role: "主角 · 建筑师",
        gender: "男",
        age: "32",
        height: "183cm",
        birthday: "1992.09.30",
        hobby: "摄影、在老街上散步",
        birthplace: "青川",
        occupation: "建筑师",
        desc: "沉默而细腻，习惯把情绪收进细节里。离乡十年后，因一封没有署名的来信重新面对过去。",
        coreEvent: "收到匿名来信，回到青川",
        modules: [
          {
            id: "m-linshen-1",
            title: "人物弧光",
            content: "从逃避故乡，到主动留下，学会与人和解。",
          },
          {
            id: "m-linshen-2",
            title: "隐藏的秘密",
            content: "十年前离开青川的真正原因，他一直没对任何人说起。",
          },
        ],
      }),
      makeCharacter({
        name: "许知夏",
        kind: "lead",
        role: "女主角 · 书店店主",
        gender: "女",
        age: "31",
        height: "168cm",
        birthday: "1993.05.12",
        hobby: "烘焙、收集旧书",
        birthplace: "青川",
        occupation: "书店店主",
        desc: "温柔而坚定。一直留在青川，守着旧日的约定和那棵香樟树。",
        coreEvent: "在香樟树下等一个人十年",
      }),
      makeCharacter({
        name: "林望",
        role: "父亲 · 木匠",
        gender: "男",
        age: "58",
        height: "176cm",
        birthday: "1966.03.08",
        hobby: "下棋、修旧家具",
        birthplace: "青川",
        occupation: "木匠",
        desc: "不善言辞的父亲，把关心都做进了家具的榫卯里。",
        coreEvent: "与儿子十年未曾好好说话",
      }),
      makeCharacter({
        name: "陈屿",
        role: "挚友 · 医生",
        gender: "男",
        age: "33",
        height: "180cm",
        birthday: "1991.11.21",
        hobby: "跑步、做饭",
        birthplace: "青川",
        occupation: "医生",
        desc: "林深的发小，也是唯一知道当年那件事的人。",
        coreEvent: "陪林深回乡",
      }),
      makeCharacter({
        name: "苏晚",
        role: "闺蜜 · 咖啡师",
        gender: "女",
        age: "30",
        height: "165cm",
        birthday: "1994.07.02",
        hobby: "旅行、拍照",
        birthplace: "青川",
        occupation: "咖啡师",
        desc: "许知夏的闺蜜，性格爽朗，总在关键时刻推她一把。",
        coreEvent: "鼓励许知夏重新开店",
      }),
    ],
    relations: [
      { id: "rel-w1", from: "林深", to: "周素", label: "母子" },
      { id: "rel-w2", from: "林深", to: "林望", label: "父子" },
      { id: "rel-w3", from: "林深", to: "许知夏", label: "青梅竹马" },
      { id: "rel-w4", from: "林深", to: "陈屿", label: "挚友" },
      { id: "rel-w5", from: "周素", to: "林望", label: "夫妻" },
      { id: "rel-w6", from: "许知夏", to: "苏晚", label: "闺蜜" },
    ],
    graph: {
      林深: { x: 396, y: 255 },
      许知夏: { x: 610, y: 150 },
      周素: { x: 200, y: 150 },
      林望: { x: 188, y: 380 },
      陈屿: { x: 610, y: 382 },
      苏晚: { x: 800, y: 255 },
    },
  },
  {
    id: "night",
    name: "长夜行舟",
    genre: "悬疑推理",
    cover: "长夜行",
    volume: "第一卷 · 雾港",
    chapters: [
      {
        id: 1,
        title: "午夜的渡轮",
        content:
          "<p>最后一班渡轮在午夜离港。</p><p>顾远站在甲板上，看着雾气慢慢吞没岸边的灯。他的口袋里，是一张没有返程日期的船票。</p>",
        status: "写作中",
      },
      {
        id: 2,
        title: "失踪的旅客",
        content: "<p>清晨点名时，船上少了一个人。</p>",
        status: "草稿",
      },
    ],
    scenes: [
      {
        title: "渡轮离港",
        text: "顾远收到匿名委托，登上前往雾岛的最后一班渡轮。",
        tag: "故事开端",
        color: "purple",
      },
      {
        title: "无声的失踪",
        text: "一位旅客凭空消失，留下了一本被撕去末页的日记。",
        tag: "悬念升级",
        color: "orange",
      },
    ],
    active: 1,
    notes: "",
    premise:
      "一艘被浓雾困住的渡轮，一位凭空消失的旅客，以及所有人共同守护的秘密。",
    theme: "真相与谎言，每个人都有不能回头的理由。",
    ending: "雾散之时，顾远发现委托人一直就在船上。",
    characters: [
      makeCharacter({
        name: "顾远",
        kind: "lead",
        role: "主角 · 独立调查员",
        gender: "男",
        age: "35",
        height: "181cm",
        birthday: "1989.12.04",
        hobby: "观察、收集旧报纸",
        birthplace: "雾港",
        occupation: "独立调查员",
        desc: "习惯观察细节，不轻易相信任何人的证词。",
        coreEvent: "登上最后一班渡轮",
      }),
      makeCharacter({
        name: "沈雾",
        role: "旅客 · 摄影师",
        gender: "女",
        age: "29",
        height: "167cm",
        birthday: "1995.02.18",
        hobby: "摄影、写日记",
        birthplace: "雾港",
        occupation: "摄影师",
        desc: "携带旧日记登船的女摄影师，对这条航线异常熟悉。",
        coreEvent: "带着被撕去末页的日记登船",
      }),
    ],
    relations: [
      { id: "rel-n1", from: "顾远", to: "沈雾", label: "调查对象" },
    ],
    graph: {
      顾远: { x: 380, y: 240 },
      沈雾: { x: 680, y: 240 },
    },
  },
  {
    id: "island",
    name: "第七座岛屿",
    genre: "幻想冒险",
    cover: "第七岛",
    volume: "第一卷 · 海图",
    chapters: [
      {
        id: 1,
        title: "地图之外",
        content:
          "<p>所有的海图上，都只画着六座岛屿。</p><p>但阿澄知道，祖父留下的罗盘，永远指向第七座。</p>",
        status: "草稿",
      },
    ],
    scenes: [
      {
        title: "祖父的罗盘",
        text: "阿澄发现罗盘指向海图之外，决定跟随它出海。",
        tag: "故事开端",
        color: "green",
      },
    ],
    active: 1,
    notes: "",
    premise: "少女阿澄带着祖父的罗盘出海，寻找一座从所有地图上消失的岛屿。",
    theme: "探索未知，也是在寻找属于自己的方向。",
    ending: "第七座岛屿不是终点，而是一段新旅程的起点。",
    characters: [
      makeCharacter({
        name: "阿澄",
        kind: "lead",
        role: "主角 · 制图师",
        gender: "女",
        age: "22",
        height: "162cm",
        birthday: "2002.06.15",
        hobby: "画海图、收集贝壳",
        birthplace: "潮汐镇",
        occupation: "制图师",
        desc: "年轻的制图师。热爱海洋，相信每一条未知的航线都值得被记录。",
        coreEvent: "发现祖父的罗盘指向海图之外",
      }),
    ],
    relations: [],
    graph: {
      阿澄: { x: 430, y: 250 },
    },
  },
]
const plain = (html: string) =>
  html.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ")
const count = (html: string) => plain(html).replace(/\s/g, "").length

function DraftEditor({
  html,
  editorRef,
  style,
  onChange,
}: {
  html: string
  editorRef: RefObject<HTMLDivElement | null>
  style: CSSProperties
  onChange: (html: string) => void
}) {
  // Keep the initial markup stable so word-count updates don't move the caret.
  const initialHtml = useRef(html)
  useLayoutEffect(() => {
    if (editorRef.current) editorRef.current.innerHTML = initialHtml.current
  }, [editorRef])
  return (
    <div
      ref={editorRef}
      className="prose-editor"
      contentEditable
      role="textbox"
      aria-label="章节正文"
      aria-multiline="true"
      suppressContentEditableWarning
      data-placeholder="故事，就从这里开始……"
      style={style}
      onInput={(e) => onChange(e.currentTarget.innerHTML)}
      onPaste={(e) => {
        e.preventDefault()
        document.execCommand(
          "insertText",
          false,
          e.clipboardData.getData("text/plain"),
        )
      }}
    />
  )
}

function BookSwitcher({
  books,
  selectedId,
  onSelect,
  onOpenOutline,
}: {
  books: Book[]
  selectedId: string
  onSelect: (id: string) => void
  onOpenOutline: () => void
}) {
  const [open, setOpen] = useState(false)
  const container = useRef<HTMLDivElement>(null)
  const selected = books.find((b) => b.id === selectedId)!
  useEffect(() => {
    if (!open) return
    const onPointer = (e: PointerEvent) => {
      if (!container.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false)
    }
    document.addEventListener("pointerdown", onPointer)
    document.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("pointerdown", onPointer)
      document.removeEventListener("keydown", onKey)
    }
  }, [open])
  return (
    <div className="book-switcher" ref={container}>
      <div className={`project-card ${open ? "is-open" : ""}`}>
        <button
          className="project-main"
          aria-label="打开故事大纲"
          onClick={onOpenOutline}
        >
          <div className="book-cover">
            <span>
              {selected.cover.split("").map((c, i) => (
                <span key={i}>
                  {c}
                  <br />
                </span>
              ))}
            </span>
            <i>墨间 · 原创作品</i>
          </div>
          <div className="project-info">
            <strong>{selected.name}</strong>
            <span>
              长篇小说 <b>·</b> {selected.genre}
            </span>
            <small>
              <i />
              连载中
            </small>
          </div>
        </button>
        <button
          className="project-caret"
          aria-label="切换书籍"
          aria-expanded={open}
          aria-haspopup="listbox"
          onClick={() => setOpen(!open)}
        >
          <Icon name="chevron" size={15} className={open ? "rotate" : ""} />
        </button>
      </div>
      {open && (
        <div className="book-menu" role="listbox" aria-label="选择书籍">
          <div className="book-menu-heading">
            <span>我的书籍</span>
            <small>{books.length} 部作品</small>
          </div>
          {books.map((b) => (
            <button
              key={b.id}
              role="option"
              aria-selected={b.id === selectedId}
              className={`book-option ${b.id === selectedId ? "selected" : ""}`}
              onClick={() => {
                onSelect(b.id)
                setOpen(false)
              }}
            >
              <div className={`mini-cover cover-${b.id}`}>{b.cover}</div>
              <div>
                <strong>{b.name}</strong>
                <span>
                  {b.genre} · {b.chapters.length} 章 ·{" "}
                  {b.chapters
                    .reduce((sum, c) => sum + count(c.content), 0)
                    .toLocaleString()}{" "}
                  字
                </span>
              </div>
              {b.id === selectedId && <Icon name="check" size={15} />}
            </button>
          ))}
          <div className="book-menu-footer">在不同的故事之间，自由切换。</div>
        </div>
      )}
    </div>
  )
}

export default function App() {
  const [books, setBooks] = useState(initialBooks)
  const [bookId, setBookId] = useState("wind")
  const book = books.find((b) => b.id === bookId)!
  function setBookField<K extends keyof Book>(
    key: K,
    value: SetStateAction<Book[K]>,
  ) {
    setBooks((bs) =>
      bs.map((b) => {
        if (b.id !== bookId) return b
        let nextValue: Book[K]
        if (typeof value === "function") {
          const updater = value as (current: Book[K]) => Book[K]
          nextValue = updater(b[key])
        } else {
          nextValue = value
        }
        return { ...b, [key]: nextValue }
      }),
    )
  }
  const { chapters, active, scenes, notes, name: projectName } = book
  const setChapters = (value: SetStateAction<Chapter[]>) =>
    setBookField("chapters", value)
  const setScenes = (value: SetStateAction<Scene[]>) =>
    setBookField("scenes", value)
  const setActive = (value: number) => setBookField("active", value)
  const setNotes = (value: string) => setBookField("notes", value)
  const setProjectName = (value: string) => setBookField("name", value)
  const [view, setView] = useState<"writing" | "outline">("writing")
  const [outlineSection, setOutlineSection] = useState<
    "world" | "characters" | "events" | "structure" | null
  >(null)
  const [hoverFields, setHoverFields] =
    useState<HoverField[]>(DEFAULT_HOVER_FIELDS)
  const [rightTab, setRightTab] = useState("大纲")
  const [rightPanels, setRightPanels] = useState(() => ({
    writing: window.innerWidth > 900,
    outline: window.innerWidth > 900,
  }))
  const rightOpen = rightPanels[view]
  const setRightOpen = (value: boolean) =>
    setRightPanels((p) => ({ ...p, [view]: value }))
  const [bookOpen, setBookOpen] = useState(() => window.innerWidth > 700)
  const [railOpen, setRailOpen] = useState(true)
  const [selectedScene, setSelectedScene] = useState(0)
  const currentScene = scenes[Math.min(selectedScene, scenes.length - 1)]
  const currentSceneIndex = Math.min(selectedScene, scenes.length - 1)
  const [outlineTab, setOutlineTab] = useState("情节详情")
  const [focus, setFocus] = useState(false)
  const [modal, setModal] = useState<"search" | "settings" | "project" | null>(
    null,
  )
  const [query, setQuery] = useState("")
  const [fontSize, setFontSize] = useState(16)
  const [font, setFont] = useState("serif")
  const [goal, setGoal] = useState(2000)
  const [minutes, setMinutes] = useState(0)
  const [volumeOpen, setVolumeOpen] = useState(true)
  const [toast, setToast] = useState("")
  const editor = useRef<HTMLDivElement>(null)
  const chapter = chapters.find((c) => c.id === active)!
  const total = chapters.reduce((n, c) => n + count(c.content), 0)
  useEffect(() => {
    const timer = setInterval(() => setMinutes((m) => m + 1), 60000)
    return () => clearInterval(timer)
  }, [])
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(""), 2600)
      return () => clearTimeout(timer)
    }
  }, [toast])
  useEffect(() => {
    const listener = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setModal(null)
        setFocus(false)
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        setModal("search")
      }
    }
    window.addEventListener("keydown", listener)
    return () => window.removeEventListener("keydown", listener)
  }, [])
  function updateChapter(update: Partial<Chapter>) {
    setChapters((cs) =>
      cs.map((c) => (c.id === active ? { ...c, ...update } : c)),
    )
  }
  function addChapter() {
    const id = Date.now()
    setChapters((cs) => [
      ...cs,
      { id, title: "未命名章节", content: "", status: "草稿" },
    ])
    setActive(id)
    setView("writing")
    setVolumeOpen(true)
  }
  function switchBook(id: string) {
    setBookId(id)
    setSelectedScene(0)
    setQuery("")
    setVolumeOpen(true)
  }
  function updateScene(update: Partial<Scene>) {
    setScenes((s) =>
      s.map((v, i) => (i === currentSceneIndex ? { ...v, ...update } : v)),
    )
  }
  function addScene() {
    setSelectedScene(scenes.length)
    setScenes((s) => [
      ...s,
      { title: "新的情节点", text: "", tag: "待构思", color: "purple" },
    ])
    setView("outline")
    setOutlineTab("情节详情")
    setRightPanels((p) => ({ ...p, outline: true }))
  }
  function download() {
    const text =
      `${projectName}\n\n` +
      chapters
        .map(
          (c, i) =>
            `第${i + 1}章 ${c.title}\n\n${c.content
              .replace(/<\/p>/g, "\n\n")
              .replace(/<[^>]*>/g, "")
              .replace(/&nbsp;/g, " ")}`,
        )
        .join("\n\n")
    const url = URL.createObjectURL(
      new Blob([text], { type: "text/plain;charset=utf-8" }),
    )
    const a = document.createElement("a")
    a.href = url
    a.download = `${projectName}.txt`
    document.body.appendChild(a)
    a.click()
    a.remove()
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
    setToast("作品已导出，请妥善保存")
  }
  function format(command: string) {
    document.execCommand(command)
    if (editor.current) updateChapter({ content: editor.current.innerHTML })
    editor.current?.focus()
  }
  const iconButton = (
    name: IconName,
    title: string,
    click: () => void,
    extra = "",
  ) => (
    <button
      className={`icon-button ${extra}`}
      title={title}
      aria-label={title}
      onClick={click}
    >
      <Icon name={name} size={18} />
    </button>
  )
  return (
    <div className={`app ${focus ? "focus-mode" : ""}`}>
      {!focus && (
        <nav
          className={`rail ${railOpen ? "" : "rail-collapsed"}`}
          aria-label="主导航"
        >
          <a
            className="brand-mark"
            href="#"
            aria-label="墨间首页"
            onClick={(e) => {
              e.preventDefault()
              setView("writing")
            }}
          >
            <Icon name="feather" size={29} />
          </a>
          <div className="rail-nav">
            <button
              aria-label="码字"
              className={view === "writing" ? "rail-item active" : "rail-item"}
              onClick={() => setView("writing")}
            >
              <Icon name="book" size={22} />
              <span>码字</span>
            </button>
            <button
              aria-label="大纲"
              className={view === "outline" ? "rail-item active" : "rail-item"}
              onClick={() => {
                setView("outline")
                setOutlineSection(null)
              }}
            >
              <Icon name="outline" size={22} />
              <span>大纲</span>
            </button>
            <button
              className="rail-item"
              aria-label="搜索"
              onClick={() => setModal("search")}
            >
              <Icon name="search" size={22} />
              <span>搜索</span>
            </button>
          </div>
          <div className="rail-bottom">
            <button
              className="rail-item rail-collapse"
              aria-label={railOpen ? "收起导航栏" : "展开导航栏"}
              title={railOpen ? "收起导航栏" : "展开导航栏"}
              aria-expanded={railOpen}
              onClick={() => setRailOpen(!railOpen)}
            >
              <Icon name={railOpen ? "back" : "chevron"} size={18} />
            </button>
            <button
              className="rail-item"
              onClick={() => setModal("settings")}
              aria-label="设置"
            >
              <Icon name="settings" size={21} />
            </button>
            <button
              className="avatar"
              onClick={() => setModal("project")}
              title="作者工作台"
            >
              林
            </button>
          </div>
        </nav>
      )}

      {!focus && bookOpen && (
        <aside className="book-sidebar">
          <div className="sidebar-brand">
            墨间<span>让故事，自由生长</span>
          </div>
          <BookSwitcher
            books={books}
            selectedId={bookId}
            onSelect={switchBook}
            onOpenOutline={() => {
              setView("outline")
              setOutlineSection(null)
              setRightPanels((p) => ({ ...p, outline: true }))
            }}
          />
          <div className="chapter-heading">
            <span>
              章节目录 <small>{chapters.length}</small>
            </span>
            <div className="chapter-heading-actions">
              {iconButton("plus", "新建章节", addChapter)}
              {iconButton("back", "收起书籍侧栏", () => setBookOpen(false))}
            </div>
          </div>
          <div className="chapter-scroll">
            <button
              className="volume"
              onClick={() => setVolumeOpen(!volumeOpen)}
            >
              <Icon
                name="chevron"
                size={13}
                className={volumeOpen ? "rotate" : ""}
              />
              <strong>{book.volume}</strong>
              <span>{chapters.length} 章</span>
            </button>
            {volumeOpen && (
              <div className="chapter-list">
                {chapters.map((c, i) => (
                  <button
                    key={c.id}
                    className={`chapter-item ${
                      active === c.id ? "selected" : ""
                    }`}
                    onClick={() => {
                      setActive(c.id)
                      if (window.innerWidth <= 700) setBookOpen(false)
                    }}
                  >
                    <Icon name="file" size={16} />
                    <div>
                      <span>
                        第
                        {[
                          "一",
                          "二",
                          "三",
                          "四",
                          "五",
                          "六",
                          "七",
                          "八",
                          "九",
                          "十",
                        ][i] || i + 1}
                        章　{c.title}
                      </span>
                      <small>
                        {count(c.content).toLocaleString()} 字 <b>·</b>{" "}
                        {c.status}
                      </small>
                    </div>
                    {active === c.id && <i />}
                  </button>
                ))}
              </div>
            )}
            <button className="add-chapter" onClick={addChapter}>
              <Icon name="plus" size={16} /> 新建章节
            </button>
            <div className="volume-next">
              <span className="tiny-line" />
              <span>下一卷，等你落笔</span>
            </div>
          </div>
          <div className="sidebar-bottom">
            <div className="writing-target">
              <span>
                <Icon name="target" size={16} /> 今日写作目标
              </span>
              <button onClick={() => setModal("settings")}>调整</button>
            </div>
            <div className="goal-numbers">
              <strong>
                {total.toLocaleString()}
                <small> / {goal.toLocaleString()} 字</small>
              </strong>
              <span>{Math.min(100, Math.round((total / goal) * 100))}%</span>
            </div>
            <div className="progress-track">
              <div
                style={{ width: `${Math.min(100, (total / goal) * 100)}%` }}
              />
            </div>
            <p>每一个字，都在靠近心中的故事。</p>
          </div>
        </aside>
      )}

      <main className="workspace">
        <header className="topbar">
          <div className="breadcrumbs">
            <button
              className="crumb-book"
              onClick={() => {
                setView("outline")
                setOutlineSection(null)
                setRightPanels((p) => ({ ...p, outline: true }))
              }}
            >
              {projectName}
            </button>
            <Icon name="chevron" size={12} />
            <span>{book.volume}</span>
            <Icon name="chevron" size={12} />
            <strong>
              {view === "writing"
                ? `第${chapters.findIndex((c) => c.id === active) + 1}章`
                : outlineSection === "characters"
                  ? "人物"
                  : outlineSection === "world"
                    ? "世界观"
                    : outlineSection === "events"
                      ? "事件"
                      : outlineSection === "structure"
                        ? "结构"
                        : "故事大纲"}
            </strong>
          </div>
          <div className="header-actions">
            <span className="save-state">
              <Icon name="check" size={14} /> 当前会话草稿
            </span>
            <button className="export-button" onClick={download}>
              <Icon name="export" size={15} />
              导出作品
            </button>
          </div>
        </header>
        <div className="work-body">
          <section className="editor-column">
            <div className="editor-toolbar">
              {!focus && (
                <button
                  className={`icon-button book-sidebar-toggle ${
                    bookOpen ? "is-active" : ""
                  }`}
                  aria-label={bookOpen ? "收起书籍侧栏" : "展开书籍侧栏"}
                  title={bookOpen ? "收起书籍侧栏" : "展开书籍侧栏"}
                  aria-expanded={bookOpen}
                  onClick={() => {
                    setBookOpen(!bookOpen)
                    if (window.innerWidth <= 700) setRightOpen(false)
                  }}
                >
                  <Icon name="panel" size={17} />
                </button>
              )}
              <div className="view-tabs">
                <button
                  className={view === "writing" ? "active" : ""}
                  onClick={() => setView("writing")}
                >
                  <Icon name="feather" size={16} />
                  码字
                </button>
                <button
                  className={view === "outline" ? "active" : ""}
                  onClick={() => setView("outline")}
                >
                  <Icon name="outline" size={16} />
                  大纲
                </button>
              </div>
              {view === "writing" && (
                <>
                  <span className="toolbar-divider" />
                  <select
                    aria-label="正文字体"
                    value={font}
                    onChange={(e) => setFont(e.target.value)}
                  >
                    <option value="serif">思源宋体</option>
                    <option value="sans-serif">系统黑体</option>
                  </select>
                  <select
                    className="font-size"
                    aria-label="字号"
                    value={fontSize}
                    onChange={(e) => setFontSize(Number(e.target.value))}
                  >
                    {[14, 16, 18, 20, 22].map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                  <span className="toolbar-divider" />
                  <button
                    className="format-button bold"
                    aria-label="加粗选中文字"
                    onMouseDown={(e) => {
                      e.preventDefault()
                      format("bold")
                    }}
                  >
                    B
                  </button>
                  <button
                    className="format-button italic"
                    aria-label="斜体选中文字"
                    onMouseDown={(e) => {
                      e.preventDefault()
                      format("italic")
                    }}
                  >
                    I
                  </button>
                  <button
                    className="format-button underline"
                    aria-label="下划线"
                    onMouseDown={(e) => {
                      e.preventDefault()
                      format("underline")
                    }}
                  >
                    U
                  </button>
                </>
              )}
              <div className="toolbar-end">
                {iconButton("focus", focus ? "退出专注模式" : "专注模式", () =>
                  setFocus(!focus),
                )}
                {!focus && (
                  <button
                    className={`icon-button ${rightOpen ? "is-active" : ""}`}
                    aria-label={`${rightOpen ? "收起" : "展开"}${
                      view === "writing" ? "码字辅助面板" : "大纲设置面板"
                    }`}
                    title={`${rightOpen ? "收起" : "展开"}${
                      view === "writing" ? "码字辅助面板" : "大纲设置面板"
                    }`}
                    aria-expanded={rightOpen}
                    onClick={() => {
                      setRightOpen(!rightOpen)
                      if (window.innerWidth <= 700) setBookOpen(false)
                    }}
                  >
                    <Icon name="panel" size={18} />
                  </button>
                )}
              </div>
            </div>
            {view === "writing" ? (
              <div className="document-scroll">
                <article className="document">
                  <div className="chapter-eyebrow">
                    <span>
                      CHAPTER{" "}
                      {String(
                        chapters.findIndex((c) => c.id === active) + 1,
                      ).padStart(2, "0")}
                    </span>
                    <span className="draft-tag">
                      <i />
                      {chapter.status}
                    </span>
                  </div>
                  <input
                    className="chapter-title"
                    aria-label="章节标题"
                    value={chapter.title}
                    onChange={(e) => updateChapter({ title: e.target.value })}
                  />
                  <div className="document-meta">
                    <span>{book.volume}</span>
                    <span className="meta-dot" />
                    <span>{count(chapter.content).toLocaleString()} 字</span>
                    <div className="chapter-flourish">
                      <span />
                      <Icon name="leaf" size={16} />
                    </div>
                  </div>
                  <DraftEditor
                    key={`${book.id}-${active}`}
                    editorRef={editor}
                    html={chapter.content}
                    style={{
                      fontSize,
                      fontFamily:
                        font === "serif"
                          ? '"Noto Serif SC", "Songti SC", SimSun, serif'
                          : "inherit",
                    }}
                    onChange={(content) => updateChapter({ content })}
                  />
                  <div className="document-end">
                    <span />
                    故事未完，落笔不停
                    <span />
                  </div>
                </article>
              </div>
            ) : (
              <div
                className={`outline-workspace ${
                  outlineSection ? "is-section" : ""
                }`}
              >
                {outlineSection === null && (
                  <div className="outline-overview">
                    <div className="outline-eyebrow">
                      STORY OUTLINE · 故事大纲
                    </div>
                    <h1 className="outline-title">故事大纲</h1>
                    <p className="outline-intro">
                      先搭好骨架，再让故事生长。四个模块，随时可以回来补充。
                    </p>
                    <div className="outline-modules">
                      {OUTLINE_MODULES.map((m) => {
                        const meta =
                          m.key === "characters"
                            ? `${book.characters.length} 位人物 · ${book.relations.length} 条关系`
                            : m.key === "events"
                              ? `${scenes.length} 个情节点`
                              : m.key === "structure"
                                ? `${chapters.length} 章 · 3 幕`
                                : `${book.volume}`
                        return (
                          <button
                            key={m.key}
                            className={`outline-module ${
                              m.key === "characters" ? "is-focus" : ""
                            }`}
                            onClick={() => setOutlineSection(m.key)}
                          >
                            <div className="om-top">
                              <span className="om-no">{m.no}</span>
                              <span className="om-en">{m.en}</span>
                              {m.key === "characters" && (
                                <span className="om-badge">正在编辑</span>
                              )}
                            </div>
                            <span className="om-icon">
                              <Icon name={m.icon} size={18} />
                            </span>
                            <h3>{m.title}</h3>
                            <p>{m.desc}</p>
                            <div className="om-foot">
                              <span>{meta}</span>
                              <Icon name="arrow" size={16} />
                            </div>
                          </button>
                        )
                      })}
                    </div>
                    <div className="outline-tip">
                      <Icon name="leaf" size={18} />
                      <p>
                        不必一次写完。
                        <br />
                        <span>
                          先记下能记住的部分，剩下的交给写作时的自己。
                        </span>
                      </p>
                    </div>
                  </div>
                )}

                {outlineSection === "characters" && (
                  <CharactersModule
                    book={book}
                    hoverFields={hoverFields}
                    onUpdate={(patch) =>
                      setBooks((bs) =>
                        bs.map((b) =>
                          b.id === bookId ? { ...b, ...patch } : b,
                        ),
                      )
                    }
                  />
                )}

                {(outlineSection === "world" ||
                  outlineSection === "structure") && (
                  <div className="outline-placeholder">
                    <span className="placeholder-no">
                      {outlineSection === "world" ? "01" : "04"}
                    </span>
                    <h1>{outlineSection === "world" ? "世界观" : "结构"}</h1>
                    <p>
                      {outlineSection === "world"
                        ? "时代、地域、规则与氛围，会让故事有可以呼吸的空间。"
                        : "三幕、章节节奏与线索收束，决定故事如何被读完。"}
                      <br />
                      这个模块正在设计中，先把人物写好，故事会自己找上门来。
                    </p>
                    <button
                      className="ghost-button"
                      onClick={() => setOutlineSection(null)}
                    >
                      <Icon name="back" size={15} />
                      返回大纲
                    </button>
                  </div>
                )}

                {outlineSection === "events" && (
                  <>
                    <div className="outline-eyebrow">PLOT &amp; EVENTS</div>
                    <h1 className="outline-title">事件</h1>
                    <p className="outline-intro">
                      把故事拆成一个个可以落笔的瞬间。
                    </p>
                    <div className="outline-section-title">
                      <h2>{book.volume}</h2>
                      <span>{scenes.length} 个情节点</span>
                      <button onClick={addScene}>
                        <Icon name="plus" size={16} />
                        添加情节点
                      </button>
                    </div>
                    <div className="story-board">
                      {scenes.map((scene, i) => (
                        <div
                          className={`story-card ${scene.color} ${
                            currentSceneIndex === i ? "is-selected" : ""
                          }`}
                          key={`${book.id}-${i}`}
                          onFocus={() => setSelectedScene(i)}
                        >
                          <div className="story-number">
                            0{i + 1}
                            <span>{scene.tag}</span>
                          </div>
                          <input
                            aria-label={`情节点${i + 1}标题`}
                            value={scene.title}
                            onChange={(e) =>
                              setScenes((s) =>
                                s.map((v, j) =>
                                  i === j
                                    ? { ...v, title: e.target.value }
                                    : v,
                                ),
                              )
                            }
                          />
                          <textarea
                            aria-label={`情节点${i + 1}内容`}
                            placeholder="记录这个情节点的故事……"
                            value={scene.text}
                            onChange={(e) =>
                              setScenes((s) =>
                                s.map((v, j) =>
                                  i === j ? { ...v, text: e.target.value } : v,
                                ),
                              )
                            }
                          />
                          <div className="story-card-bottom">
                            <span>
                              {scene.chapterId
                                ? chapters.find(
                                    (c) => c.id === scene.chapterId,
                                  )?.title || "未关联章节"
                                : "未关联章节"}
                            </span>
                            <button
                              className="scene-detail-button"
                              aria-label={`查看情节点${i + 1}详情`}
                              onClick={() => {
                                setSelectedScene(i)
                                setOutlineTab("情节详情")
                                setRightOpen(true)
                              }}
                            >
                              详情
                              <Icon name="chevron" size={12} />
                            </button>
                            <button
                              aria-label="删除情节点"
                              onClick={() =>
                                setScenes((s) => s.filter((_, j) => i !== j))
                              }
                            >
                              <Icon name="close" size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="outline-note">
                      <Icon name="leaf" />
                      <p>
                        不必一开始就想好结局。
                        <br />
                        <span>给故事一点空间，也给灵感一点时间。</span>
                      </p>
                    </div>
                  </>
                )}
              </div>
            )}
            <footer className="editor-footer">
              <span>
                <i />
                创作中<span className="footer-separator">|</span>本章{" "}
                {count(chapter.content).toLocaleString()} 字
                <span className="footer-separator">|</span>全书{" "}
                {total.toLocaleString()} 字
              </span>
              <div>
                <span>
                  <Icon name="clock" size={13} />
                  {minutes} 分钟
                </span>
                <button onClick={() => setFocus(!focus)}>
                  <Icon name={focus ? "close" : "focus"} size={13} />
                  {focus ? "退出专注" : "专注模式"}
                </button>
              </div>
            </footer>
          </section>

          {rightOpen && !focus && view === "writing" && (
            <aside className="inspiration-panel" aria-label="码字辅助面板">
              <div className="panel-tabs">
                {["大纲", "人物", "便签"].map((tab) => (
                  <button
                    className={rightTab === tab ? "active" : ""}
                    key={tab}
                    onClick={() => setRightTab(tab)}
                  >
                    {tab}
                  </button>
                ))}
                {iconButton("close", "收起码字辅助面板", () =>
                  setRightOpen(false),
                )}
              </div>
              <div className="panel-content">
                {rightTab === "大纲" ? (
                  <>
                    <div className="panel-heading">
                      <span>本章大纲</span>
                      <button
                        onClick={() => setView("outline")}
                        title="编辑大纲"
                      >
                        <Icon name="outline" size={16} />
                      </button>
                    </div>
                    <div className="chapter-summary">
                      <span className="summary-label">核心情节</span>
                      <p>{book.premise}</p>
                    </div>
                    <div className="scene-heading">
                      <span>情节脉络</span>
                      <small>{scenes.length} 个情节点</small>
                    </div>
                    <div className="scene-timeline">
                      {scenes.map((scene, i) => (
                        <button
                          className={`scene-card ${scene.color}`}
                          key={i}
                          onClick={() => {
                            setSelectedScene(i)
                            setView("outline")
                            setOutlineTab("情节详情")
                          }}
                        >
                          <div>
                            <span className="scene-dot" />
                            <strong>{scene.title}</strong>
                            <small>0{i + 1}</small>
                          </div>
                          <p>{scene.text || "点击补充故事细节"}</p>
                          <span className="scene-tag">{scene.tag}</span>
                        </button>
                      ))}
                    </div>
                    <button className="add-scene" onClick={addScene}>
                      <Icon name="plus" size={15} />
                      添加情节点
                    </button>
                    <div className="related-character">
                      <div className="panel-heading">
                        <span>出场人物</span>
                        <button onClick={() => setRightTab("人物")}>
                          <Icon name="arrow" size={15} />
                        </button>
                      </div>
                      <button
                        className="character-row"
                        onClick={() => setRightTab("人物")}
                      >
                        <div className="character-avatar">
                          {book.characters[0].name[0]}
                        </div>
                        <div>
                          <strong>
                            {book.characters[0].name}{" "}
                            <span>{book.characters[0].role}</span>
                          </strong>
                          <p>{book.characters[0].desc}</p>
                        </div>
                      </button>
                    </div>
                  </>
                ) : rightTab === "人物" ? (
                  <>
                    <div className="panel-heading">
                      <span>故事里的人</span>
                      <Icon name="users" size={17} />
                    </div>
                    {book.characters.map((p, i) => (
                      <div className="character-detail" key={p.name}>
                        <div className={`character-avatar character-${i}`}>
                          {p.name[0]}
                        </div>
                        <h3>
                          {p.name}
                          <span>{p.role}</span>
                        </h3>
                        <p>{p.desc}</p>
                      </div>
                    ))}
                  </>
                ) : (
                  <>
                    <div className="panel-heading">
                      <span>随手记下的灵感</span>
                      <Icon name="feather" size={17} />
                    </div>
                    <textarea
                      className="notes-input"
                      placeholder="一句对白、一个场景，或一个还没有答案的问题……"
                      aria-label="灵感便签"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    />
                    <p className="note-hint">
                      便签在本次会话中保留，离开前记得复制。
                    </p>
                  </>
                )}
              </div>
              <div className="inspiration-quote">
                <Icon name="leaf" size={22} />
                <p>
                  写作，是在纸上
                  <br />
                  与另一个自己相遇。
                </p>
                <span>慢慢写，好故事值得等待。</span>
              </div>
            </aside>
          )}
          {rightOpen &&
            !focus &&
            view === "outline" &&
            outlineSection === "events" && (
            <aside
              className="inspiration-panel outline-inspector"
              aria-label="大纲设置面板"
            >
              <div className="inspector-heading">
                <div>
                  <Icon name="outline" size={17} />
                  <span>大纲工作台</span>
                </div>
                {iconButton("close", "收起大纲设置面板", () =>
                  setRightOpen(false),
                )}
              </div>
              <div className="inspector-tabs">
                {["情节详情", "故事设定"].map((tab) => (
                  <button
                    key={tab}
                    className={outlineTab === tab ? "active" : ""}
                    onClick={() => setOutlineTab(tab)}
                  >
                    {tab}
                  </button>
                ))}
              </div>
              <div className="inspector-content">
                {outlineTab === "情节详情" ? (
                  currentScene ? (
                    <>
                      <div className="inspector-scene-number">
                        <span>STORY POINT</span>
                        <strong>
                          {String(currentSceneIndex + 1).padStart(2, "0")}
                          <small>
                            {" "}
                            / {String(scenes.length).padStart(2, "0")}
                          </small>
                        </strong>
                      </div>
                      <div className="scene-pagination">
                        <button
                          disabled={currentSceneIndex === 0}
                          aria-label="上一个情节点"
                          onClick={() =>
                            setSelectedScene(currentSceneIndex - 1)
                          }
                        >
                          <Icon name="back" size={14} />
                          上一个
                        </button>
                        <span>
                          {currentSceneIndex + 1} / {scenes.length}
                        </span>
                        <button
                          disabled={currentSceneIndex === scenes.length - 1}
                          aria-label="下一个情节点"
                          onClick={() =>
                            setSelectedScene(currentSceneIndex + 1)
                          }
                        >
                          下一个
                          <Icon name="chevron" size={14} />
                        </button>
                      </div>
                      <label className="inspector-field">
                        情节名称
                        <input
                          aria-label="情节名称"
                          value={currentScene.title}
                          onChange={(e) =>
                            updateScene({ title: e.target.value })
                          }
                        />
                      </label>
                      <label className="inspector-field">
                        叙事阶段
                        <select
                          aria-label="叙事阶段"
                          value={currentScene.tag}
                          onChange={(e) => updateScene({ tag: e.target.value })}
                        >
                          {Array.from(
                            new Set([
                              "待构思",
                              "故事开端",
                              "情绪铺垫",
                              "情节转折",
                              "悬念升级",
                              "故事高潮",
                              "故事结局",
                              currentScene.tag,
                            ]),
                          ).map((tag) => (
                            <option key={tag}>{tag}</option>
                          ))}
                        </select>
                      </label>
                      <label className="inspector-field">
                        情节描述
                        <textarea
                          aria-label="情节描述"
                          value={currentScene.text}
                          placeholder="发生了什么？它如何推动故事前进？"
                          onChange={(e) =>
                            updateScene({ text: e.target.value })
                          }
                        />
                      </label>
                      <label className="inspector-field">
                        关联章节
                        <select
                          aria-label="关联章节"
                          value={currentScene.chapterId || ""}
                          onChange={(e) =>
                            updateScene({
                              chapterId: e.target.value
                                ? Number(e.target.value)
                                : undefined,
                            })
                          }
                        >
                          <option value="">暂不关联</option>
                          {chapters.map((c, i) => (
                            <option key={c.id} value={c.id}>
                              第{i + 1}章 · {c.title}
                            </option>
                          ))}
                        </select>
                      </label>
                      {currentScene.chapterId && (
                        <button
                          className="linked-chapter-button"
                          onClick={() => {
                            setActive(currentScene.chapterId!)
                            setView("writing")
                          }}
                        >
                          <Icon name="file" size={14} />
                          前往这一章码字
                          <Icon name="arrow" size={14} />
                        </button>
                      )}
                    </>
                  ) : (
                    <div className="inspector-empty">
                      <Icon name="outline" size={28} />
                      <h3>故事的骨架，等你构思</h3>
                      <p>添加第一个情节点，开始梳理故事。</p>
                      <button className="primary-button" onClick={addScene}>
                        <Icon name="plus" size={15} />
                        添加情节点
                      </button>
                    </div>
                  )
                ) : (
                  <>
                    <div className="story-settings-heading">
                      <span>STORY OVERVIEW</span>
                      <h3>先想清楚，要讲一个怎样的故事。</h3>
                    </div>
                    <label className="inspector-field">
                      一句话梗概
                      <textarea
                        aria-label="一句话梗概"
                        value={book.premise}
                        onChange={(e) =>
                          setBookField("premise", e.target.value)
                        }
                        placeholder="谁，想要什么，又遇到了什么？"
                      />
                    </label>
                    <label className="inspector-field">
                      故事主题
                      <textarea
                        aria-label="故事主题"
                        value={book.theme}
                        onChange={(e) => setBookField("theme", e.target.value)}
                        placeholder="你希望故事留给读者什么？"
                      />
                    </label>
                    <label className="inspector-field">
                      预想的结局
                      <textarea
                        aria-label="预想的结局"
                        value={book.ending}
                        onChange={(e) => setBookField("ending", e.target.value)}
                        placeholder="终点可以改变，先记下此刻的想法。"
                      />
                    </label>
                    <div className="outline-statistics">
                      <div>
                        <strong>{scenes.length}</strong>
                        <span>情节点</span>
                      </div>
                      <div>
                        <strong>
                          {scenes.filter((s) => s.chapterId).length}
                        </strong>
                        <span>已关联章节</span>
                      </div>
                      <div>
                        <strong>{book.characters.length}</strong>
                        <span>故事人物</span>
                      </div>
                    </div>
                  </>
                )}
              </div>
              <div className="inspector-footer">
                <Icon name="check" size={13} />
                <span>与故事卡片实时同步 · 当前会话保留</span>
              </div>
            </aside>
          )}
        </div>
      </main>
      {toast && (
        <div className="toast">
          <Icon name="check" size={17} />
          {toast}
        </div>
      )}
      {modal && (
        <div className="modal-backdrop" onClick={() => setModal(null)}>
          <section
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-label={
              modal === "search"
                ? "搜索作品"
                : modal === "settings"
                  ? "写作偏好"
                  : "作品设置"
            }
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-heading">
              <h2>
                {modal === "search"
                  ? "在故事中寻找"
                  : modal === "settings"
                    ? "你的写作节奏"
                    : "关于这部作品"}
              </h2>
              {iconButton("close", "关闭", () => setModal(null))}
            </div>
            {modal === "search" ? (
              <>
                <div className="search-field">
                  <Icon name="search" />
                  <input
                    autoFocus
                    placeholder="搜索章节或正文……"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                  <kbd>⌘ K</kbd>
                </div>
                <div className="search-results">
                  {chapters
                    .filter((c) => (c.title + plain(c.content)).includes(query))
                    .map((c) => (
                      <button
                        key={c.id}
                        onClick={() => {
                          setActive(c.id)
                          setView("writing")
                          setModal(null)
                        }}
                      >
                        <Icon name="file" size={18} />
                        <span>
                          <strong>{c.title}</strong>
                          <small>
                            {plain(c.content).slice(0, 48) || "还未落笔"}
                          </small>
                        </span>
                        <Icon name="arrow" size={16} />
                      </button>
                    ))}
                  {!chapters.some((c) =>
                    (c.title + plain(c.content)).includes(query),
                  ) && (
                    <p className="empty-search">
                      没有找到相关章节，试试其他关键词。
                    </p>
                  )}
                </div>
              </>
            ) : modal === "settings" ? (
              <>
                <p className="modal-description">
                  按照自己的步调，让写作成为日常。
                </p>
                <label className="setting-label">
                  每日字数目标
                  <div className="number-input">
                    <input
                      type="number"
                      min="100"
                      max="100000"
                      step="100"
                      value={goal}
                      onChange={(e) =>
                        setGoal(
                          Math.max(
                            100,
                            Math.min(100000, Number(e.target.value)),
                          ),
                        )
                      }
                    />
                    <span>字 / 天</span>
                  </div>
                </label>
                <div className="goal-presets">
                  {[1000, 2000, 3000, 5000].map((n) => (
                    <button
                      key={n}
                      className={goal === n ? "active" : ""}
                      onClick={() => setGoal(n)}
                    >
                      {n.toLocaleString()} 字
                    </button>
                  ))}
                </div>
                <div className="setting-block">
                  <span className="setting-title">悬浮卡显示字段</span>
                  <p className="setting-hint">
                    选择鼠标悬浮关系网人物时，简略档案中展示的信息。
                  </p>
                  <div className="hover-field-list">
                    {HOVER_FIELDS.map((field) => {
                      const on = hoverFields.includes(field.key)
                      return (
                        <button
                          key={field.key}
                          className={`hover-field ${on ? "on" : ""}`}
                          role="switch"
                          aria-checked={on}
                          onClick={() =>
                            setHoverFields((hs) =>
                              on
                                ? hs.filter((k) => k !== field.key)
                                : [...hs, field.key],
                            )
                          }
                        >
                          <span>{field.label}</span>
                          <i className="switch-track" />
                        </button>
                      )
                    })}
                  </div>
                </div>
                <p className="session-notice">
                  当前为体验工作台，内容仅在本次会话中保留。关闭或刷新前，请导出作品。
                </p>
                <button
                  className="primary-button"
                  onClick={() => {
                    setModal(null)
                    setToast("设置已保存")
                  }}
                >
                  保存设置
                  <Icon name="arrow" size={16} />
                </button>
              </>
            ) : (
              <>
                <label className="setting-label">
                  作品名称
                  <input
                    className="project-name-input"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                  />
                </label>
                <div className="project-stats">
                  <div>
                    <strong>{chapters.length}</strong>
                    <span>章节</span>
                  </div>
                  <div>
                    <strong>{total.toLocaleString()}</strong>
                    <span>累计字数</span>
                  </div>
                  <div>
                    <strong>{scenes.length}</strong>
                    <span>故事情节点</span>
                  </div>
                </div>
                <p className="session-notice">
                  文字值得被珍藏。体验中的修改仅在当前会话保留，请导出一份属于你的故事。
                </p>
                <button className="primary-button" onClick={download}>
                  <Icon name="export" size={17} />
                  导出完整作品
                </button>
              </>
            )}
          </section>
        </div>
      )}
    </div>
  )
}
