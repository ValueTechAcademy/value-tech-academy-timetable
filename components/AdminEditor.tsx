"use client";
import { ChangeEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, Trash2, Pencil, Save, CalendarOff, RefreshCw } from "lucide-react";
import type { TimetableData, Lecture, Course, Holiday } from "@/lib/types";
import { TIMETABLE_API_URL } from "@/lib/config";

const BASE = process.env.NEXT_PUBLIC_BASE_PATH || "";
const blank: TimetableData = { timezone: "Asia/Kolkata", courses: [], lectures: [], holidays: [] };
const newId = () => `item-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
const initialForm = () => ({
  courseId: "", title: "", instructor: "", date: "", startTime: "09:00",
  endTime: "10:00", meetUrl: "", description: "", repeat: "none",
  repeatDays: [] as number[], repeatUntil: ""
});
type Form = ReturnType<typeof initialForm>;
const weekdays = [{ label: "Mon", value: 1 }, { label: "Tue", value: 2 }, { label: "Wed", value: 3 },
  { label: "Thu", value: 4 }, { label: "Fri", value: 5 }, { label: "Sat", value: 6 }, { label: "Sun", value: 0 }];
const dateISO = (d: Date) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
function plusDays(date: string, n: number) { const d = new Date(`${date}T12:00:00`); d.setDate(d.getDate()+n); return dateISO(d); }
function weekday(date: string) { return new Date(`${date}T12:00:00`).getDay(); }

export default function AdminEditor({ onLogout }: { onLogout: () => void }) {
  const [data, setData] = useState<TimetableData>(blank);
  const [form, setForm] = useState<Form>(initialForm);
  const [editing, setEditing] = useState<string | null>(null);
  const [courseName, setCourseName] = useState("");
  const [holidayDate, setHolidayDate] = useState("");
  const [holidayName, setHolidayName] = useState("");
  const [notice, setNotice] = useState("Loading timetable from Google Sheets…");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  async function loadData() {
    if (!TIMETABLE_API_URL) { setNotice("Add your Google Apps Script Web App URL in lib/config.ts."); setLoading(false); return; }
    try {
      const r = await fetch(TIMETABLE_API_URL, { cache: "no-store" });
      if (!r.ok) throw new Error("Could not read Google Sheets data");
      const d = await r.json();
      if (!Array.isArray(d.courses) || !Array.isArray(d.lectures)) throw new Error("Invalid sheet data");
      setData({ timezone: "Asia/Kolkata", courses: d.courses, lectures: d.lectures, holidays: Array.isArray(d.holidays) ? d.holidays : [] });
      setNotice("Connected to Google Sheets.");
    } catch (e) { setNotice(`Could not load Google Sheets: ${e instanceof Error ? e.message : "Unknown error"}`); }
    finally { setLoading(false); }
  }
  useEffect(() => { loadData(); }, []);

  const sorted = useMemo(() => [...data.lectures].sort((a,b)=>(a.date+a.startTime).localeCompare(b.date+b.startTime)), [data.lectures]);
  function update<K extends keyof Form>(key: K, value: Form[K]) { setForm(f => ({...f, [key]: value})); }
  function addCourse() {
    const name = courseName.trim(); if (!name) return;
    setData(d => ({...d, courses:[...d.courses, {id:newId(), name}]}));
    setCourseName(""); setNotice("Course added. Click Save & Publish to update the public timetable.");
  }
  function saveLecture(e: React.FormEvent) {
    e.preventDefault();
    if (!form.courseId || !form.date || !form.startTime || !form.endTime) return;
    if (form.endTime <= form.startTime) { setNotice("End time must be later than start time."); return; }
    if (form.repeat === "weekly" && (!form.repeatDays.length || !form.repeatUntil || form.repeatUntil < form.date)) {
      setNotice("For weekly repeat, select at least one weekday and a valid end date."); return;
    }
    const base: Lecture = {
      id: editing || newId(), courseId: form.courseId,
      title: form.title.trim() || data.courses.find(c=>c.id===form.courseId)?.name || "Lecture",
      instructor: form.instructor.trim(), date: form.date, startTime: form.startTime,
      endTime: form.endTime, meetUrl: form.meetUrl.trim(), description: form.description.trim(), status:"scheduled"
    };
    let additions: Lecture[] = [base];
    if (form.repeat === "weekly" && !editing) {
      additions = [];
      for (let day=form.date; day<=form.repeatUntil; day=plusDays(day,1)) {
        if (form.repeatDays.includes(weekday(day))) additions.push({...base, id:newId(), date:day});
      }
      if (!additions.length) { setNotice("No dates matched the selected weekdays and date range."); return; }
    }
    setData(d => ({...d, lectures: editing
      ? d.lectures.map(l=>l.id===editing ? base : l)
      : [...d.lectures, ...additions]}));
    setForm(initialForm()); setEditing(null);
    setNotice(editing ? "Lecture updated. Click Save & Publish." : `Added ${additions.length} class occurrence(s). Click Save & Publish.`);
  }
  function edit(l: Lecture) {
    setEditing(l.id);
    setForm({courseId:l.courseId,title:l.title,instructor:l.instructor,date:l.date,startTime:l.startTime,
      endTime:l.endTime,meetUrl:l.meetUrl,description:l.description||"",repeat:"none",repeatDays:[],repeatUntil:""});
    window.scrollTo({top:0,behavior:"smooth"});
  }
  function remove(id: string) {
    if (confirm("Delete this lecture?")) setData(d=>({...d,lectures:d.lectures.filter(l=>l.id!==id)}));
  }
  function addHoliday(e: React.FormEvent) {
    e.preventDefault(); if (!holidayDate) return;
    if (data.holidays.some(h=>h.date===holidayDate)) { setNotice("A holiday is already declared for this date."); return; }
    const h: Holiday = {id:newId(), date:holidayDate, name:holidayName.trim() || "Holiday"};
    setData(d=>({...d,holidays:[...d.holidays,h]}));
    setHolidayDate(""); setHolidayName(""); setNotice("Holiday added. Click Save & Publish to update the calendar.");
  }
  async function publish() {
    if (!TIMETABLE_API_URL) { setNotice("Set the Apps Script URL in lib/config.ts first."); return; }
    let key = sessionStorage.getItem("vta-sheets-admin-key");
    if (!key) { key = prompt("Enter the private VTA Google Sheets admin key (generated by initialiseVTA):") || ""; }
    if (!key) return;
    setSaving(true); setNotice("Saving changes to Google Sheets…");
    try {
      const r = await fetch(TIMETABLE_API_URL, {
        method:"POST", headers:{"Content-Type":"text/plain;charset=utf-8"},
        body:JSON.stringify({key, data})
      });
      const result = await r.json();
      if (!result.ok) throw new Error(result.error || "Save failed");
      sessionStorage.setItem("vta-sheets-admin-key", key);
      setNotice("Saved successfully. The public timetable will show the latest data on its next refresh.");
    } catch (e) {
      setNotice(`Could not save: ${e instanceof Error ? e.message : "Unknown error"}. Check the Apps Script deployment and key.`);
    } finally { setSaving(false); }
  }
  async function importFile(e: ChangeEvent<HTMLInputElement>) {
    const file=e.target.files?.[0]; if(!file)return;
    try {
      const p=JSON.parse(await file.text());
      if(!Array.isArray(p.courses)||!Array.isArray(p.lectures)) throw new Error();
      setData({timezone:"Asia/Kolkata",courses:p.courses,lectures:p.lectures,holidays:Array.isArray(p.holidays)?p.holidays:[]});
      setNotice("Imported JSON into editor. Click Save & Publish to store it in Google Sheets.");
    } catch { setNotice("Invalid timetable JSON file."); }
    e.target.value="";
  }
  return <main className="shell adminShell">
    <header className="topbar">
      <Link href="/" className="brand"><img src={`${BASE}/logo.png`} alt="Value Tech Academy"/></Link>
      <div className="adminHeaderActions"><Link href="/" className="backLink"><ArrowLeft size={16}/> View public timetable</Link>
        <button type="button" className="logoutButton" onClick={onLogout}>Log out</button></div>
    </header>
    <section className="intro"><div><p className="eyebrow">ADMIN WORKSPACE</p><h1>Timetable <span>Editor</span></h1>
      <p className="sub">Manage classes, weekly repeats and holidays. Save directly to Google Sheets.</p></div><span className="timezone">IST · Asia/Kolkata</span></section>
    <div className="noticeBox"><Save size={19}/><div><strong>Google Sheets publishing</strong><p>Make your changes, then select <b>Save &amp; Publish</b>. No JSON download, Git commit or website redeployment is needed for timetable updates.</p></div></div>
    <div className="adminGrid">
      <section className="panel editorPanel"><div className="panelHead"><div><p className="eyebrow">CLASS MANAGEMENT</p><h2>{editing?"Edit lecture":"Add a lecture"}</h2></div></div>
        <form onSubmit={saveLecture} className="lectureForm">
          <label>Course<select required value={form.courseId} onChange={e=>update("courseId",e.target.value)}><option value="">Select a course</option>{data.courses.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
          <label>Lecture title<input value={form.title} onChange={e=>update("title",e.target.value)} placeholder="e.g. Introduction to Python"/></label>
          <label>Instructor<input value={form.instructor} onChange={e=>update("instructor",e.target.value)} placeholder="Faculty name"/></label>
          <label>Date<input type="date" required value={form.date} onChange={e=>update("date",e.target.value)}/></label>
          <div className="formRow"><label>Start time<input type="time" required value={form.startTime} onChange={e=>update("startTime",e.target.value)}/></label>
            <label>End time<input type="time" required value={form.endTime} onChange={e=>update("endTime",e.target.value)}/></label></div>
          <label>Google Meet URL<input type="url" value={form.meetUrl} onChange={e=>update("meetUrl",e.target.value)} placeholder="https://meet.google.com/..."/></label>
          <label>Description (optional)<textarea rows={2} value={form.description} onChange={e=>update("description",e.target.value)} placeholder="Class notes or instructions"/></label>
          <label>Repeat<select value={form.repeat} onChange={e=>update("repeat",e.target.value)}><option value="none">Do not repeat</option><option value="weekly">Repeat weekly on selected days</option></select></label>
          {form.repeat==="weekly" && <div className="repeatBox"><label>Repeat on</label><div className="weekdayChoices">{weekdays.map(d=><label key={d.value} className="weekdayChoice"><input type="checkbox" checked={form.repeatDays.includes(d.value)} onChange={e=>update("repeatDays",e.target.checked?[...form.repeatDays,d.value]:form.repeatDays.filter(x=>x!==d.value))}/>{d.label}</label>)}</div>
            <label>Repeat until<input type="date" min={form.date} value={form.repeatUntil} onChange={e=>update("repeatUntil",e.target.value)}/></label></div>}
          <div className="formActions"><button className="primaryButton" type="submit"><Save size={16}/>{editing?"Update lecture":"Add lecture"}</button>
            {editing&&<button type="button" className="secondaryButton" onClick={()=>{setEditing(null);setForm(initialForm());}}>Cancel</button>}</div>
        </form>
      </section>
      <section className="panel coursesPanel"><div className="panelHead"><div><p className="eyebrow">ACADEMY CATALOG</p><h2>Manage courses</h2></div><span className="bookIcon">▤</span></div>
        <form className="courseAdd" onSubmit={e=>{e.preventDefault();addCourse();}}><input value={courseName} onChange={e=>setCourseName(e.target.value)} placeholder="New course name"/><button className="iconButton" type="submit" aria-label="Add course"><Plus/></button></form>
        {data.courses.length?<div className="courseList">{data.courses.map(c=><div key={c.id}><span>{c.name}</span><button aria-label={`Remove ${c.name}`} onClick={()=>{if(confirm(`Remove ${c.name}?`))setData(d=>({...d,courses:d.courses.filter(x=>x.id!==c.id)}));}}><Trash2 size={15}/></button></div>)}</div>:<p className="emptyInline">No courses added yet.</p>}
        <section className="holidayManager"><div className="holidayHeading"><CalendarOff size={18}/><div><b>Manage holidays</b><small>Declare dates when no classes will be held.</small></div></div>
          <form onSubmit={addHoliday} className="holidayForm"><label>Holiday date<input type="date" required value={holidayDate} onChange={e=>setHolidayDate(e.target.value)}/></label>
            <label>Holiday name<input value={holidayName} onChange={e=>setHolidayName(e.target.value)} placeholder="e.g. Diwali holiday"/></label>
            <button className="secondaryButton" type="submit"><Plus size={15}/> Add holiday</button></form>
          {data.holidays.length>0&&<div className="holidayList">{[...data.holidays].sort((a,b)=>a.date.localeCompare(b.date)).map(h=><div key={h.id}><span><b>{h.name}</b><small>{h.date}</small></span><button onClick={()=>setData(d=>({...d,holidays:d.holidays.filter(x=>x.id!==h.id)}))} aria-label="Remove holiday"><Trash2 size={15}/></button></div>)}</div>}
        </section>
        <div className="importExport"><button className="primaryButton" onClick={publish} disabled={saving||loading}><Save size={16}/>{saving?"Saving…":"Save & Publish"}</button>
          <button className="secondaryButton" onClick={loadData} disabled={loading}><RefreshCw size={15}/> Reload from Sheets</button>
          <label className="secondaryButton uploadButton">Import JSON<input type="file" accept="application/json,.json" onChange={importFile}/></label></div>
        {notice&&<p className="noticeText">{notice}</p>}
      </section>
    </div>
    <section className="panel recordsPanel"><div className="panelHead"><div><p className="eyebrow">SCHEDULE DATABASE</p><h2>All lectures <span className="recordCount">{sorted.length}</span></h2></div></div>
      {sorted.length?<div className="records">{sorted.map(l=><div className="record" key={l.id}><div><strong>{l.title}</strong><span>{data.courses.find(c=>c.id===l.courseId)?.name||"Course removed"} · {l.date} · {l.startTime}–{l.endTime}</span></div>
        <div className="recordActions"><button onClick={()=>edit(l)} aria-label="Edit lecture"><Pencil size={16}/></button><button onClick={()=>remove(l.id)} aria-label="Delete lecture"><Trash2 size={16}/></button></div></div>)}</div>
      :<div className="emptyState"><strong>{loading?"Loading…":"No lectures in the timetable yet"}</strong><span>Add courses and lectures above.</span></div>}
    </section>
    <footer><span>© {new Date().getFullYear()} Value Tech Academy</span><span>Google Sheets · Admin editor</span></footer>
  </main>;
}
