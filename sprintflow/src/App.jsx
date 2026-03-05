import { useState, useMemo } from "react";

// ── DATA ─────────────────────────────────────────────────────────────────────
const MEMBERS_INIT = [
  { id: 1, name: "Ana García", role: "UX Designer", avatar: "AG", color: "bg-pink-400" },
  { id: 2, name: "Carlos Ruiz", role: "Backend Dev", avatar: "CR", color: "bg-blue-500" },
  { id: 3, name: "Luis Mora", role: "Frontend Dev", avatar: "LM", color: "bg-indigo-500" },
  { id: 4, name: "María Peña", role: "QA Tester", avatar: "MP", color: "bg-emerald-500" },
  { id: 5, name: "Pedro Soto", role: "Product Manager", avatar: "PS", color: "bg-amber-500" },
];

const TAGS_OPTIONS = ["UI", "API", "Bug", "Feature", "Docs", "Infra", "Test", "Marketing"];
const TAG_COLORS = { UI:"bg-pink-100 text-pink-700", API:"bg-blue-100 text-blue-700", Bug:"bg-red-100 text-red-700", Feature:"bg-indigo-100 text-indigo-700", Docs:"bg-yellow-100 text-yellow-700", Infra:"bg-gray-100 text-gray-600", Test:"bg-emerald-100 text-emerald-700", Marketing:"bg-orange-100 text-orange-700" };

const SPRINTS_INIT = [
  { id: 1, name: "Sprint 1", start: "2026-02-01", end: "2026-02-21", closed: true },
  { id: 2, name: "Sprint 2", start: "2026-02-22", end: "2026-03-14", closed: true },
  { id: 3, name: "Sprint 3", start: "2026-03-15", end: "2026-04-04", closed: false },
];

const TASKS_INIT = [
  { id:1, title:"Wireframes del tablero", priority:"alta", memberId:1, status:"done", sprintId:1, tags:["UI","Docs"], due:"2026-02-10", comments:[{author:"Ana García",text:"Aprobados por el PM ✅",time:"hace 3 días"}] },
  { id:2, title:"Configurar repositorio GitHub", priority:"media", memberId:2, status:"done", sprintId:1, tags:["Infra"], due:"2026-02-08", comments:[] },
  { id:3, title:"Autenticación JWT", priority:"alta", memberId:2, status:"done", sprintId:2, tags:["API","Feature"], due:"2026-03-01", comments:[{author:"Carlos Ruiz",text:"Implementado con refresh token.",time:"hace 1 semana"}] },
  { id:4, title:"Tablero Kanban drag & drop", priority:"alta", memberId:3, status:"done", sprintId:2, tags:["UI","Feature"], due:"2026-03-05", comments:[] },
  { id:5, title:"Endpoints REST de tareas", priority:"alta", memberId:2, status:"in-progress", sprintId:3, tags:["API"], due:"2026-03-20", comments:[{author:"Pedro Soto",text:"Prioridad máxima esta semana.",time:"hace 2 días"}] },
  { id:6, title:"Componente de sprint selector", priority:"media", memberId:3, status:"in-progress", sprintId:3, tags:["UI","Feature"], due:"2026-03-22", comments:[] },
  { id:7, title:"Pruebas E2E módulo login", priority:"media", memberId:4, status:"todo", sprintId:3, tags:["Test","Bug"], due:"2026-03-28", comments:[] },
  { id:8, title:"Landing page de lanzamiento", priority:"baja", memberId:3, status:"todo", sprintId:3, tags:["Marketing","UI"], due:"2026-04-01", comments:[] },
  { id:9, title:"Documentación de API", priority:"baja", memberId:2, status:"todo", sprintId:3, tags:["Docs","API"], due:"2026-04-03", comments:[] },
];

const ACTIVITY_INIT = [
  { id:1, text:"Ana García completó 'Wireframes del tablero'", time:"hace 3 días", icon:"✅" },
  { id:2, text:"Carlos Ruiz añadió comentario en 'Autenticación JWT'", time:"hace 1 semana", icon:"💬" },
  { id:3, text:"Pedro Soto creó Sprint 3", time:"hace 10 días", icon:"🚀" },
  { id:4, text:"Luis Mora movió 'Tablero Kanban' a Hecho", time:"hace 5 días", icon:"📋" },
];

const PRIORITY_COLORS = { alta:"bg-red-100 text-red-700", media:"bg-yellow-100 text-yellow-700", baja:"bg-green-100 text-green-700" };
const COL_STYLES = {
  todo:{ header:"bg-slate-100 text-slate-600", border:"border-slate-200" },
  "in-progress":{ header:"bg-indigo-50 text-indigo-700", border:"border-indigo-200" },
  done:{ header:"bg-emerald-50 text-emerald-700", border:"border-emerald-200" },
};
const STATUS_LABELS = { todo:"To Do", "in-progress":"En Progreso", done:"Hecho" };
const COLUMNS = ["todo","in-progress","done"];

// ── HELPERS ───────────────────────────────────────────────────────────────────
const Avatar = ({ m, size="w-7 h-7", text="text-xs" }) => (
  <div className={`${size} ${m.color} rounded-full flex items-center justify-center text-white font-bold ${text} flex-shrink-0`}>{m.avatar}</div>
);

const isOverdue = due => due && new Date(due) < new Date() ? true : false;

// ── APP ───────────────────────────────────────────────────────────────────────
export default function SprintFlow() {
  const [tasks, setTasks] = useState(TASKS_INIT);
  const [sprints, setSprints] = useState(SPRINTS_INIT);
  const [members, setMembers] = useState(MEMBERS_INIT);
  const [activity, setActivity] = useState(ACTIVITY_INIT);
  const [activeSprint, setActiveSprint] = useState(3);
  const [view, setView] = useState("board");
  const [dragging, setDragging] = useState(null);
  const [filterMember, setFilterMember] = useState("all");
  const [filterTag, setFilterTag] = useState("all");
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(null); // "task" | "member" | "sprint" | {taskId}
  const [newTask, setNewTask] = useState({ title:"", priority:"media", memberId:1, due:"", tags:[] });
  const [newMember, setNewMember] = useState({ name:"", role:"" });
  const [newSprint, setNewSprint] = useState({ name:"", start:"", end:"" });
  const [commentText, setCommentText] = useState("");
  const [nextId, setNextId] = useState(10);

  const sprint = sprints.find(s => s.id === activeSprint);
  const sprintTasks = tasks.filter(t => t.sprintId === activeSprint);

  const filteredTasks = useMemo(() => sprintTasks.filter(t => {
    const matchMember = filterMember === "all" || t.memberId === Number(filterMember);
    const matchTag = filterTag === "all" || t.tags.includes(filterTag);
    const matchSearch = !search || t.title.toLowerCase().includes(search.toLowerCase());
    return matchMember && matchTag && matchSearch;
  }), [sprintTasks, filterMember, filterTag, search]);

  const byStatus = s => filteredTasks.filter(t => t.status === s);
  const done = sprintTasks.filter(t => t.status === "done").length;
  const progress = sprintTasks.length ? Math.round((done / sprintTasks.length) * 100) : 0;

  const addActivity = (text, icon="📌") => setActivity(a => [{ id: Date.now(), text, time:"ahora mismo", icon }, ...a.slice(0,9)]);

  const drop = (status) => {
    if (!dragging) return;
    const t = tasks.find(x => x.id === dragging);
    if (t && t.status !== status) {
      setTasks(prev => prev.map(x => x.id === dragging ? { ...x, status } : x));
      const m = members.find(x => x.id === t.memberId);
      addActivity(`${m?.name} movió '${t.title}' a ${STATUS_LABELS[status]}`, status === "done" ? "✅" : "📋");
    }
    setDragging(null);
  };

  const addTask = () => {
    if (!newTask.title.trim()) return;
    const t = { id: nextId, ...newTask, memberId: Number(newTask.memberId), sprintId: activeSprint, status:"todo", comments:[] };
    setTasks(p => [...p, t]);
    const m = members.find(x => x.id === t.memberId);
    addActivity(`${m?.name} creó '${t.title}'`, "🆕");
    setNextId(n => n+1);
    setNewTask({ title:"", priority:"media", memberId:1, due:"", tags:[] });
    setModal(null);
  };

  const deleteTask = id => {
    const t = tasks.find(x => x.id === id);
    setTasks(p => p.filter(x => x.id !== id));
    addActivity(`Tarea '${t?.title}' eliminada`, "🗑️");
  };

  const addComment = (taskId) => {
    if (!commentText.trim()) return;
    setTasks(p => p.map(t => t.id === taskId ? { ...t, comments:[...t.comments,{ author:"Pedro Soto", text:commentText, time:"ahora mismo" }]} : t));
    addActivity(`Pedro Soto comentó en una tarea`, "💬");
    setCommentText("");
  };

  const addMember = () => {
    if (!newMember.name.trim()) return;
    const colors = ["bg-purple-500","bg-teal-500","bg-rose-500","bg-cyan-500"];
    const m = { id: nextId, name: newMember.name, role: newMember.role, avatar: newMember.name.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase(), color: colors[members.length % colors.length] };
    setMembers(p => [...p, m]);
    addActivity(`${m.name} se unió al equipo`, "👤");
    setNextId(n => n+1);
    setNewMember({ name:"", role:"" });
    setModal(null);
  };

  const addSprint = () => {
    if (!newSprint.name.trim()) return;
    const s = { id: nextId, ...newSprint, closed: false };
    setSprints(p => [...p, s]);
    setActiveSprint(s.id);
    addActivity(`Sprint '${s.name}' creado`, "🚀");
    setNextId(n => n+1);
    setNewSprint({ name:"", start:"", end:"" });
    setModal(null);
  };

  const toggleTag = (tag, arr, set) => set(p => ({ ...p, tags: p.tags.includes(tag) ? p.tags.filter(t=>t!==tag) : [...p.tags, tag] }));

  const taskDetail = typeof modal === "object" && modal?.taskId ? tasks.find(t => t.id === modal.taskId) : null;
  const taskDetailMember = taskDetail ? members.find(m => m.id === taskDetail.memberId) : null;

  // Workload
  const workload = members.map(m => ({
    ...m,
    total: sprintTasks.filter(t => t.memberId === m.id).length,
    done: sprintTasks.filter(t => t.memberId === m.id && t.status === "done").length,
  }));

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-sm">
      {/* NAVBAR */}
      <nav className="bg-indigo-600 text-white px-5 py-2.5 flex items-center justify-between shadow-md z-10">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-white rounded-lg flex items-center justify-center">
            <span className="text-indigo-600 font-black text-xs">SF</span>
          </div>
          <span className="font-bold text-base tracking-tight">SprintFlow</span>
          <span className="ml-3 bg-indigo-500 text-indigo-100 text-xs px-2 py-0.5 rounded-full">MVP v2</span>
        </div>
        <div className="flex gap-1">
          {[["board","Tablero"],["dashboard","Dashboard"],["team","Equipo"],["activity","Actividad"]].map(([v,l]) => (
            <button key={v} onClick={() => setView(v)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${view===v?"bg-white text-indigo-600":"text-indigo-200 hover:text-white"}`}>{l}</button>
          ))}
        </div>
        <div className="flex gap-2">
          <button onClick={() => setModal("sprint")} className="bg-indigo-500 hover:bg-indigo-400 text-white text-xs px-3 py-1.5 rounded-full transition">+ Sprint</button>
          <button onClick={() => setModal("task")} className="bg-white text-indigo-600 text-xs font-semibold px-3 py-1.5 rounded-full hover:bg-indigo-50 transition">+ Tarea</button>
        </div>
      </nav>

      {/* SPRINT BAR */}
      <div className="bg-white border-b px-5 py-2 flex items-center gap-4 flex-wrap">
        <div className="flex gap-1 flex-wrap">
          {sprints.map(s => (
            <button key={s.id} onClick={() => setActiveSprint(s.id)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition border ${activeSprint===s.id?"bg-indigo-600 text-white border-indigo-600":"border-gray-200 text-gray-500 hover:border-indigo-300"}`}>
              {s.name} {s.closed && <span className="opacity-60">✓</span>}
            </button>
          ))}
        </div>
        {sprint && <span className="text-gray-400 text-xs">{sprint.start} → {sprint.end}</span>}
        <div className="ml-auto flex items-center gap-2">
          <div className="w-32 bg-gray-200 rounded-full h-1.5">
            <div className="bg-indigo-500 h-1.5 rounded-full transition-all" style={{width:`${progress}%`}}/>
          </div>
          <span className="text-xs font-semibold text-indigo-600">{progress}%</span>
        </div>
      </div>

      {/* FILTERS (board only) */}
      {view === "board" && (
        <div className="bg-white border-b px-5 py-2 flex items-center gap-3 flex-wrap">
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 Buscar tarea..."
            className="border rounded-lg px-3 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-200 w-44"/>
          <select value={filterMember} onChange={e=>setFilterMember(e.target.value)}
            className="border rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-200">
            <option value="all">Todos los miembros</option>
            {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
          <select value={filterTag} onChange={e=>setFilterTag(e.target.value)}
            className="border rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-200">
            <option value="all">Todas las etiquetas</option>
            {TAGS_OPTIONS.map(t => <option key={t}>{t}</option>)}
          </select>
          {(filterMember!=="all"||filterTag!=="all"||search) &&
            <button onClick={()=>{setFilterMember("all");setFilterTag("all");setSearch("");}} className="text-xs text-indigo-500 hover:underline">Limpiar filtros</button>}
          <span className="ml-auto text-xs text-gray-400">{filteredTasks.length} tareas</span>
        </div>
      )}

      <main className="p-5 flex-1 overflow-auto">

        {/* ── BOARD ── */}
        {view==="board" && (
          <div className="grid grid-cols-3 gap-4">
            {COLUMNS.map(col => (
              <div key={col} onDragOver={e=>e.preventDefault()} onDrop={()=>drop(col)}
                className={`rounded-xl border-2 ${COL_STYLES[col].border} bg-white min-h-60 flex flex-col`}>
                <div className={`px-4 py-2 rounded-t-xl flex items-center justify-between ${COL_STYLES[col].header}`}>
                  <span className="font-semibold text-xs uppercase tracking-wide">{STATUS_LABELS[col]}</span>
                  <span className="text-xs font-bold bg-white bg-opacity-60 px-2 py-0.5 rounded-full">{byStatus(col).length}</span>
                </div>
                <div className="p-2.5 flex flex-col gap-2 flex-1">
                  {byStatus(col).map(task => {
                    const m = members.find(x=>x.id===task.memberId);
                    const overdue = isOverdue(task.due) && task.status!=="done";
                    return (
                      <div key={task.id} draggable onDragStart={()=>setDragging(task.id)}
                        className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm cursor-grab hover:shadow-md transition select-none">
                        <div className="flex items-start justify-between gap-1 mb-2">
                          <p className="text-xs font-semibold text-gray-800 leading-snug flex-1">{task.title}</p>
                          <div className="flex gap-1">
                            <button onClick={()=>setModal({taskId:task.id})} className="text-gray-300 hover:text-indigo-400 text-xs">💬</button>
                            <button onClick={()=>deleteTask(task.id)} className="text-gray-300 hover:text-red-400 text-xs">✕</button>
                          </div>
                        </div>
                        {task.tags.length>0 && (
                          <div className="flex flex-wrap gap-1 mb-2">
                            {task.tags.map(tag=>(
                              <span key={tag} className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${TAG_COLORS[tag]||"bg-gray-100 text-gray-600"}`}>{tag}</span>
                            ))}
                          </div>
                        )}
                        <div className="flex items-center justify-between">
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${PRIORITY_COLORS[task.priority]}`}>{task.priority}</span>
                          <div className="flex items-center gap-1.5">
                            {task.due && <span className={`text-[10px] ${overdue?"text-red-500 font-semibold":"text-gray-400"}`}>{overdue?"⚠️ ":""}{task.due}</span>}
                            {task.comments.length>0 && <span className="text-[10px] text-gray-400">💬{task.comments.length}</span>}
                            {m && <Avatar m={m} size="w-5 h-5" text="text-[9px]"/>}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {byStatus(col).length===0 && <p className="text-xs text-gray-300 text-center mt-8">Arrastra tarjetas aquí</p>}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── DASHBOARD ── */}
        {view==="dashboard" && (
          <div className="grid grid-cols-2 gap-4">
            {/* Progress */}
            <div className="bg-white rounded-xl border p-4 col-span-2 flex gap-6 items-center">
              {[
                {label:"Total",val:sprintTasks.length,color:"text-gray-700"},
                {label:"Completadas",val:byStatus("done").length,color:"text-emerald-600"},
                {label:"En progreso",val:byStatus("in-progress").length,color:"text-indigo-600"},
                {label:"Pendientes",val:byStatus("todo").length,color:"text-yellow-600"},
              ].map(s=>(
                <div key={s.label} className="text-center flex-1">
                  <p className={`text-3xl font-black ${s.color}`}>{s.val}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
                </div>
              ))}
              <div className="flex-1">
                <p className="text-xs text-gray-500 mb-1">Progreso del sprint</p>
                <div className="w-full bg-gray-100 rounded-full h-4">
                  <div className="bg-gradient-to-r from-indigo-500 to-emerald-400 h-4 rounded-full flex items-center justify-end pr-2 transition-all" style={{width:`${progress}%`}}>
                    <span className="text-white text-[10px] font-bold">{progress}%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Burndown */}
            <div className="bg-white rounded-xl border p-4">
              <h3 className="font-semibold text-gray-700 mb-3 text-xs uppercase tracking-wide">Burndown Chart</h3>
              <div className="flex items-end gap-1.5 h-28">
                {Array.from({length:7},(_,i)=>{
                  const rem = Math.max(sprintTasks.length - Math.round((done/6)*i), done===sprintTasks.length?0:done);
                  return <div key={i} className="flex flex-col items-center flex-1 gap-0.5">
                    <span className="text-[9px] text-gray-400">{rem}</span>
                    <div className="w-full bg-indigo-500 rounded-t" style={{height:`${(rem/sprintTasks.length)*100}px`}}/>
                    <span className="text-[9px] text-gray-400">D{i*3+1}</span>
                  </div>;
                })}
              </div>
            </div>

            {/* Workload */}
            <div className="bg-white rounded-xl border p-4">
              <h3 className="font-semibold text-gray-700 mb-3 text-xs uppercase tracking-wide">Carga de trabajo</h3>
              {workload.map(m=>(
                <div key={m.id} className="flex items-center gap-2 mb-2">
                  <Avatar m={m} size="w-6 h-6" text="text-[9px]"/>
                  <div className="flex-1">
                    <div className="flex justify-between text-[10px] mb-0.5">
                      <span className="text-gray-600 font-medium">{m.name.split(" ")[0]}</span>
                      <span className="text-gray-400">{m.done}/{m.total} tareas</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                      <div className={`h-1.5 rounded-full ${m.total>3?"bg-red-400":m.total>1?"bg-amber-400":"bg-emerald-400"}`}
                        style={{width:m.total?`${(m.done/m.total)*100}%`:"0%"}}/>
                    </div>
                  </div>
                  {m.total>3 && <span className="text-[10px] text-red-500 font-medium">🔥</span>}
                </div>
              ))}
            </div>

            {/* Historial de sprints */}
            <div className="bg-white rounded-xl border p-4 col-span-2">
              <h3 className="font-semibold text-gray-700 mb-3 text-xs uppercase tracking-wide">Historial de Sprints</h3>
              <div className="grid grid-cols-3 gap-3">
                {sprints.map(s=>{
                  const st = tasks.filter(t=>t.sprintId===s.id);
                  const sd = st.filter(t=>t.status==="done").length;
                  const sp = st.length ? Math.round((sd/st.length)*100) : 0;
                  return <div key={s.id} onClick={()=>setActiveSprint(s.id)}
                    className={`rounded-lg border-2 p-3 cursor-pointer transition ${activeSprint===s.id?"border-indigo-400 bg-indigo-50":"border-gray-100 hover:border-indigo-200"}`}>
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-semibold text-gray-700 text-xs">{s.name}</span>
                      {s.closed && <span className="text-[10px] bg-emerald-100 text-emerald-600 px-1.5 py-0.5 rounded-full">Cerrado</span>}
                      {!s.closed && <span className="text-[10px] bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded-full">Activo</span>}
                    </div>
                    <p className="text-[10px] text-gray-400 mb-2">{s.start} → {s.end}</p>
                    <div className="w-full bg-gray-100 rounded-full h-1.5 mb-1">
                      <div className="bg-indigo-400 h-1.5 rounded-full" style={{width:`${sp}%`}}/>
                    </div>
                    <p className="text-[10px] text-gray-500">{sd}/{st.length} tareas · {sp}%</p>
                  </div>;
                })}
              </div>
            </div>
          </div>
        )}

        {/* ── TEAM ── */}
        {view==="team" && (
          <div className="grid grid-cols-3 gap-4">
            {members.map(m=>{
              const mt = tasks.filter(t=>t.memberId===m.id);
              const md = mt.filter(t=>t.status==="done").length;
              const overdueTasks = mt.filter(t=>isOverdue(t.due)&&t.status!=="done");
              return <div key={m.id} className="bg-white rounded-xl border p-4">
                <div className="flex items-center gap-3 mb-3">
                  <Avatar m={m} size="w-10 h-10" text="text-sm"/>
                  <div>
                    <p className="font-semibold text-gray-800">{m.name}</p>
                    <p className="text-[10px] text-gray-400">{m.role}</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {[{l:"Total",v:mt.length},{l:"Hechas",v:md},{l:"Vencidas",v:overdueTasks.length}].map(s=>(
                    <div key={s.l} className="bg-gray-50 rounded-lg p-2 text-center">
                      <p className={`text-lg font-bold ${s.l==="Vencidas"&&s.v>0?"text-red-500":"text-indigo-600"}`}>{s.v}</p>
                      <p className="text-[9px] text-gray-400">{s.l}</p>
                    </div>
                  ))}
                </div>
                <div className="w-full bg-gray-100 rounded-full h-1.5 mb-2">
                  <div className="bg-indigo-400 h-1.5 rounded-full" style={{width:mt.length?`${(md/mt.length)*100}%`:"0%"}}/>
                </div>
                <div className="flex flex-wrap gap-1">
                  {mt.slice(0,3).map(t=>(
                    <span key={t.id} className="text-[9px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full truncate max-w-full">{t.title}</span>
                  ))}
                  {mt.length>3 && <span className="text-[9px] text-gray-400">+{mt.length-3} más</span>}
                </div>
              </div>;
            })}
            <div onClick={()=>setModal("member")}
              className="bg-white rounded-xl border-2 border-dashed border-gray-200 p-4 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-indigo-300 hover:bg-indigo-50 transition min-h-40">
              <span className="text-3xl">👤</span>
              <p className="text-xs text-gray-400 font-medium">Añadir miembro</p>
            </div>
          </div>
        )}

        {/* ── ACTIVITY ── */}
        {view==="activity" && (
          <div className="max-w-lg mx-auto bg-white rounded-xl border p-5">
            <h3 className="font-semibold text-gray-700 mb-4 text-xs uppercase tracking-wide">Actividad reciente</h3>
            <div className="flex flex-col gap-3">
              {activity.map(a=>(
                <div key={a.id} className="flex items-start gap-3">
                  <span className="text-lg leading-none">{a.icon}</span>
                  <div className="flex-1">
                    <p className="text-xs text-gray-700">{a.text}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">{a.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* ── MODALS ── */}
      {modal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50 p-4" onClick={e=>e.target===e.currentTarget&&setModal(null)}>

          {/* Nueva tarea */}
          {modal==="task" && (
            <div className="bg-white rounded-2xl shadow-xl p-5 w-96">
              <h3 className="font-bold text-gray-800 mb-4">Nueva Tarea</h3>
              <div className="flex flex-col gap-3">
                <input value={newTask.title} onChange={e=>setNewTask(p=>({...p,title:e.target.value}))}
                  placeholder="Título de la tarea..." className="border rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-300"/>
                <div className="grid grid-cols-2 gap-2">
                  <select value={newTask.priority} onChange={e=>setNewTask(p=>({...p,priority:e.target.value}))}
                    className="border rounded-lg px-2 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-300">
                    <option value="alta">Alta</option><option value="media">Media</option><option value="baja">Baja</option>
                  </select>
                  <input type="date" value={newTask.due} onChange={e=>setNewTask(p=>({...p,due:e.target.value}))}
                    className="border rounded-lg px-2 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-300"/>
                </div>
                <select value={newTask.memberId} onChange={e=>setNewTask(p=>({...p,memberId:e.target.value}))}
                  className="border rounded-lg px-2 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-300">
                  {members.map(m=><option key={m.id} value={m.id}>{m.name} – {m.role}</option>)}
                </select>
                <div>
                  <p className="text-[10px] text-gray-500 mb-1.5 font-medium">Etiquetas</p>
                  <div className="flex flex-wrap gap-1">
                    {TAGS_OPTIONS.map(tag=>(
                      <button key={tag} onClick={()=>toggleTag(tag, newTask.tags, setNewTask)}
                        className={`text-[10px] px-2 py-0.5 rounded-full border transition ${newTask.tags.includes(tag)?"border-indigo-400 bg-indigo-50 text-indigo-600":"border-gray-200 text-gray-500 hover:border-indigo-300"}`}>{tag}</button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <button onClick={()=>setModal(null)} className="flex-1 border border-gray-200 text-gray-500 py-2 rounded-lg text-xs hover:bg-gray-50">Cancelar</button>
                <button onClick={addTask} className="flex-1 bg-indigo-600 text-white py-2 rounded-lg text-xs font-semibold hover:bg-indigo-700">Agregar</button>
              </div>
            </div>
          )}

          {/* Nuevo miembro */}
          {modal==="member" && (
            <div className="bg-white rounded-2xl shadow-xl p-5 w-80">
              <h3 className="font-bold text-gray-800 mb-4">Añadir Miembro</h3>
              <div className="flex flex-col gap-3">
                <input value={newMember.name} onChange={e=>setNewMember(p=>({...p,name:e.target.value}))}
                  placeholder="Nombre completo" className="border rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-300"/>
                <input value={newMember.role} onChange={e=>setNewMember(p=>({...p,role:e.target.value}))}
                  placeholder="Rol (ej. Dev, QA...)" className="border rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-300"/>
              </div>
              <div className="flex gap-2 mt-4">
                <button onClick={()=>setModal(null)} className="flex-1 border border-gray-200 text-gray-500 py-2 rounded-lg text-xs hover:bg-gray-50">Cancelar</button>
                <button onClick={addMember} className="flex-1 bg-indigo-600 text-white py-2 rounded-lg text-xs font-semibold hover:bg-indigo-700">Añadir</button>
              </div>
            </div>
          )}

          {/* Nuevo sprint */}
          {modal==="sprint" && (
            <div className="bg-white rounded-2xl shadow-xl p-5 w-80">
              <h3 className="font-bold text-gray-800 mb-4">Nuevo Sprint</h3>
              <div className="flex flex-col gap-3">
                <input value={newSprint.name} onChange={e=>setNewSprint(p=>({...p,name:e.target.value}))}
                  placeholder="Nombre del sprint" className="border rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-300"/>
                <div className="grid grid-cols-2 gap-2">
                  <input type="date" value={newSprint.start} onChange={e=>setNewSprint(p=>({...p,start:e.target.value}))}
                    className="border rounded-lg px-2 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-300"/>
                  <input type="date" value={newSprint.end} onChange={e=>setNewSprint(p=>({...p,end:e.target.value}))}
                    className="border rounded-lg px-2 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-300"/>
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <button onClick={()=>setModal(null)} className="flex-1 border border-gray-200 text-gray-500 py-2 rounded-lg text-xs hover:bg-gray-50">Cancelar</button>
                <button onClick={addSprint} className="flex-1 bg-indigo-600 text-white py-2 rounded-lg text-xs font-semibold hover:bg-indigo-700">Crear</button>
              </div>
            </div>
          )}

          {/* Detalle tarea + comentarios */}
          {taskDetail && (
            <div className="bg-white rounded-2xl shadow-xl p-5 w-96 max-h-[80vh] overflow-y-auto">
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-bold text-gray-800 leading-snug flex-1">{taskDetail.title}</h3>
                <button onClick={()=>setModal(null)} className="text-gray-300 hover:text-gray-500 ml-2">✕</button>
              </div>
              <div className="flex flex-wrap gap-1 mb-3">
                {taskDetail.tags.map(tag=>(
                  <span key={tag} className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${TAG_COLORS[tag]||"bg-gray-100 text-gray-600"}`}>{tag}</span>
                ))}
              </div>
              <div className="flex items-center gap-4 mb-4 text-xs text-gray-500">
                <span className={`px-2 py-0.5 rounded-full font-medium ${PRIORITY_COLORS[taskDetail.priority]}`}>{taskDetail.priority}</span>
                {taskDetailMember && <div className="flex items-center gap-1"><Avatar m={taskDetailMember} size="w-5 h-5" text="text-[9px]"/><span>{taskDetailMember.name}</span></div>}
                {taskDetail.due && <span className={isOverdue(taskDetail.due)&&taskDetail.status!=="done"?"text-red-500 font-semibold":""}>{taskDetail.due}</span>}
              </div>
              <div className="border-t pt-3">
                <p className="text-[10px] text-gray-500 uppercase tracking-wide font-semibold mb-2">Comentarios ({taskDetail.comments.length})</p>
                {taskDetail.comments.length===0 && <p className="text-xs text-gray-300 mb-3">Sin comentarios aún.</p>}
                {taskDetail.comments.map((c,i)=>(
                  <div key={i} className="bg-gray-50 rounded-lg p-2.5 mb-2">
                    <div className="flex justify-between text-[10px] text-gray-500 mb-1">
                      <span className="font-semibold">{c.author}</span><span>{c.time}</span>
                    </div>
                    <p className="text-xs text-gray-700">{c.text}</p>
                  </div>
                ))}
                <div className="flex gap-2 mt-2">
                  <input value={commentText} onChange={e=>setCommentText(e.target.value)}
                    placeholder="Escribe un comentario..." className="flex-1 border rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-300"/>
                  <button onClick={()=>addComment(taskDetail.id)} className="bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-indigo-700">Enviar</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
