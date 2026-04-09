import { useEffect, useState, useCallback, useMemo } from "react";
import { api } from "../../api";
import { useCompany } from "../../hooks/useCompany";
import taskService from "../../services/taskService";
import CommonTable from "../../components/CommonTable";
import { useAuth } from "../../context/AuthContext";
import { useProject } from "../../context/ProjectContext";
import socketService from "../../services/socketService";
import { Pencil, Trash2, Eye, Upload, X, Clock, Timer, AlertCircle } from "lucide-react";
import TableSkeleton from "../../components/TableSkeleton";
import BulkUpload from "../../components/BulkUpload";
import ConfirmDelete from "../../components/ConfirmDelete";
import ToastMessage from "../../components/ToastMessage";
import PageHeader from "../../components/PageHeader";
import FormModal from "../../components/FormModal";
import useToast from "../../hooks/useToast";
import useDebounce from "../../hooks/useDebounce";
import {
  calculateEndDate,
  formatDateTimeLabel,
  getScheduleSummary,
} from "../../utils/workingDaysCalculator";
import "../../styles/createform.css";

const BASE_URL = import.meta.env.VITE_API_URL?.replace("/api", "") || "http://localhost:4000";

const HOUR_OPTIONS = [0.5,1,1.5,2,2.5,3,4,5,6,7,8,10,12,16,20,24,32,40,48,60,80,100];

function SchedulePreview({ estimatedHours, workingHours, holidays }) {
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (!estimatedHours || !workingHours?.length) { setResult(null); return; }
    const r = calculateEndDate(parseFloat(estimatedHours), workingHours, holidays || []);
    setResult(r);
  }, [estimatedHours, workingHours, holidays]);

  if (!estimatedHours || !workingHours?.length) return null;

  if (!result) return (
    <div style={{ padding:"10px 12px", background:"#fef2f2", border:"1px solid #fca5a5",
      borderRadius:"8px", fontSize:"12px", color:"#dc2626", display:"flex", gap:"6px", alignItems:"center" }}>
      <AlertCircle size={13} />
      Could not calculate — please check company working hours config.
    </div>
  );

  const { startDateTime, endDate, totalHours, skippedDays, workingDayCount, breakdown } = result;
  const isMultiDay = workingDayCount > 1;

  return (
    <div style={{ borderRadius:"10px", border:"1px solid #86efac", overflow:"hidden", fontSize:"12px" }}>
      <div style={{ background:"linear-gradient(135deg,#15803d,#059669)", padding:"9px 14px",
        color:"#fff", display:"flex", alignItems:"center", gap:"8px" }}>
        <Timer size={13} />
        <strong>Auto Schedule Preview</strong>
        <span style={{ marginLeft:"auto", background:"rgba(255,255,255,.2)", padding:"2px 10px",
          borderRadius:"10px", fontSize:"11px" }}>
          {totalHours}h
          {skippedDays > 0 ? ` · ${skippedDays} off-day${skippedDays>1?"s":""} skipped` : ""}
          {" · "}{workingDayCount} working day{workingDayCount>1?"s":""}
        </span>
      </div>
      <div style={{ background:"#f0fdf4", padding:"12px 14px",
        display:"grid", gridTemplateColumns:"1fr auto 1fr", alignItems:"center", gap:"10px" }}>
        <div>
          <div style={{ fontSize:"10px", color:"#15803d", fontWeight:700,
            textTransform:"uppercase", marginBottom:"3px" }}>🟢 Starts</div>
          <div style={{ fontWeight:600, color:"#14532d", fontSize:"13px" }}>
            {formatDateTimeLabel(startDateTime)}
          </div>
          <div style={{ fontSize:"10px", color:"#4ade80", marginTop:"2px" }}>
            (auto-set to now)
          </div>
        </div>
        <div style={{ fontSize:"20px", color:"#86efac" }}>→</div>
        <div>
          <div style={{ fontSize:"10px", color:"#dc2626", fontWeight:700,
            textTransform:"uppercase", marginBottom:"3px" }}>🔴 Due / Ends</div>
          <div style={{ fontWeight:700, color:"#991b1b", fontSize:"14px" }}>
            {formatDateTimeLabel(endDate)}
          </div>
        </div>
      </div>
      {isMultiDay && (
        <div style={{ background:"#fff", padding:"10px 14px", borderTop:"1px solid #dcfce7" }}>
          <div style={{ fontSize:"10px", color:"#6b7280", fontWeight:600,
            textTransform:"uppercase", marginBottom:"8px" }}>Daily Breakdown</div>
          <div style={{ display:"flex", flexDirection:"column", gap:"5px" }}>
            {breakdown.map((d, i) => (
              <div key={i} style={{ display:"grid", gridTemplateColumns:"100px 1fr 60px",
                alignItems:"center", gap:"8px" }}>
                <div style={{ fontSize:"11px" }}>
                  <span style={{ fontWeight:600, color:"#374151" }}>
                    {d.dayName.charAt(0).toUpperCase()+d.dayName.slice(1,3)},{" "}
                    {new Date(d.date).toLocaleDateString("en-US",{month:"short",day:"numeric"})}
                  </span>
                  <span style={{ color:"#9ca3af", marginLeft:"4px", fontSize:"10px" }}>
                    {d.startTime}–{d.endTime}
                  </span>
                </div>
                <div style={{ background:"#f3f4f6", borderRadius:"4px", height:"6px", overflow:"hidden" }}>
                  <div style={{ width:`${(d.hoursUsed/totalHours)*100}%`,
                    background: d.partial ? "#fb923c":"#22c55e", height:"100%", transition:"width .3s" }} />
                </div>
                <span style={{ fontSize:"11px", fontWeight:600, textAlign:"right",
                  color: d.partial ? "#ea580c":"#16a34a" }}>
                  {d.hoursUsed}h{d.partial ? " ↩":""}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function TaskDateBadge({ task }) {
  const now     = new Date();
  const endDate = task.endDate ? new Date(task.endDate) : null;
  const isDone  = ["completed","done","closed","resolved"].some(s => (task.status||"").toLowerCase().includes(s));
  const isOverdue = endDate && endDate < now && !isDone;
  const isSoon    = endDate && !isOverdue && (endDate - now) < 24*60*60*1000;

  const clr = isOverdue ? "#dc2626" : isSoon ? "#d97706" : "#16a34a";
  const bg  = isOverdue ? "#fef2f2"  : isSoon ? "#fffbeb"  : "#f0fdf4";

  const fmtShort = (d) => new Date(d).toLocaleDateString("en-US",{month:"short",day:"numeric"});
  const fmtTime  = (d) => new Date(d).toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit"});

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:"3px", fontSize:"10px" }}>
      {task.startDate
        ? <span style={{ color:"#2563eb", display:"flex", alignItems:"center", gap:"3px" }}>
            🟢 {fmtShort(task.startDate)} {fmtTime(task.startDate)}
          </span>
        : <span style={{ color:"#9ca3af" }}>🟢 —</span>
      }
      {endDate
        ? <span style={{ padding:"2px 7px", borderRadius:"10px", background:bg, color:clr,
            border:`1px solid ${clr}44`, fontWeight:600, display:"inline-flex",
            alignItems:"center", gap:"3px", width:"fit-content" }}>
            {isOverdue?"⚠":isSoon?"⏰":"🔴"} {fmtShort(endDate)} {fmtTime(endDate)}
          </span>
        : <span style={{ color:"#9ca3af", display:"flex", alignItems:"center", gap:"3px" }}>
            🔴 —
          </span>
      }
      {task.estimatedHours
        ? <span style={{ color:"#6b7280", display:"flex", alignItems:"center", gap:"3px" }}>
            <Timer size={9} /> {task.estimatedHours}h
          </span>
        : null
      }
    </div>
  );
}

export default function CreateTask() {
  const { hasPermission, user }             = useAuth();
  const { selectedProject }                 = useProject();
  const { getCompanyId, isAdmin, isGlobal } = useCompany();
  const { toast, showToast, clearToast }    = useToast();

  const [tasks,       setTasks]       = useState([]);
  const [staff,       setStaff]       = useState([]);
  const [statuses,    setStatuses]    = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [companyData, setCompanyData] = useState(null);

  const [page,  setPage]  = useState(1);
  const [limit, setLimit] = useState(() => Number(localStorage.getItem("table_entries") || 10));
  const [totalPages,   setTotalPages]   = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  const [search,         setSearch]         = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedStaff,  setSelectedStaff]  = useState("");
  const debouncedSearch = useDebounce(search, 400);

  const [showForm,   setShowForm]   = useState(false);
  const [editingId,  setEditingId]  = useState(null);
  const [viewTask,   setViewTask]   = useState(null);
  const [deleteId,   setDeleteId]   = useState(null);
  const [deleteName, setDeleteName] = useState("");
  const [deleting,   setDeleting]   = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    title: "", description: "", assignedTo: "", status: "",
    priority: "Normal", media: [], estimatedHours: "",
  });

  const canCreate = hasPermission("task.create");
  const canUpdate = hasPermission("task.update");
  const canDelete = hasPermission("task.delete");
  const canRead   = hasPermission("task.read");
  const companyId = getCompanyId();

  useEffect(() => {
    if (companyId && companyId !== "global") {
      api(`/company/${companyId}`)
        .then(d => { if (d?.workingHours) setCompanyData(d); })
        .catch(() => {});
    }
  }, [companyId]);

  const workingHours    = companyData?.workingHours || [];
  const holidays        = companyData?.holidays     || [];
  const scheduleSummary = workingHours.length ? getScheduleSummary(workingHours) : null;

  const projectMembers = useMemo(() => {
    if (!selectedProject?.members) return [];
    const ids = selectedProject.members.map(m => m._id || m);
    return staff
      .filter(s => {
        if (isAdmin) return true;
        const sc = s.company?._id || s.company;
        return sc === companyId || sc?.toString() === companyId?.toString();
      })
      .filter(s => ids.includes(s._id));
  }, [selectedProject, staff, companyId, isAdmin]);

  const fmt = d => {
    if (!d) return "—";
    try { return new Date(d).toLocaleString("en-US",{year:"numeric",month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"}); }
    catch { return "Invalid"; }
  };

  const getCreatorName = c => {
    if (!c) return "—";
    return typeof c === "string" ? c : c.username || c.email || "—";
  };

  const fetchTasks = useCallback(async () => {
    if (!isGlobal && !selectedProject?._id) return;
    if (!companyId && !isAdmin) return;
    try {
      setLoading(true);
      const cl = Number(limit) || 10;
      let url = isGlobal
        ? `/tasks?type=task&page=${page}&limit=${cl}&company=${companyId}`
        : `/tasks?project=${selectedProject._id}&type=task&page=${page}&limit=${cl}${companyId?`&company=${companyId}`:""}`;
      const isOwner = user?.role === "COMPANY_OWNER";
      if (!isAdmin && !isOwner && user?._id) url += `&assignedTo=${user._id}`;
      else if (selectedStaff) url += `&assignedTo=${selectedStaff}`;
      if (debouncedSearch) url += `&search=${encodeURIComponent(debouncedSearch)}`;
      if (selectedStatus)  url += `&status=${selectedStatus}`;
      const res = await api(url);
      if (res?.data) { setTasks(res.data); setTotalPages(res.totalPages||1); setTotalRecords(res.totalRecords||0); }
      else { const raw=res||[]; setTotalRecords(raw.length); setTotalPages(Math.ceil(raw.length/cl)||1); setTasks(raw.slice((page-1)*cl,page*cl)); }
    } catch { setTasks([]); }
    finally { setLoading(false); }
  }, [selectedProject?._id,page,limit,debouncedSearch,selectedStatus,selectedStaff,isAdmin,user?._id,companyId]);

  useEffect(() => { if (canRead && (selectedProject?._id || isGlobal)) fetchTasks(); },
    [canRead, selectedProject?._id, isGlobal, user?._id, fetchTasks]);

  useEffect(() => {
    if (canRead) {
      const sUrl = isAdmin && companyId ? `/task-status/active?company=${companyId}` : "/task-status/active";
      api(sUrl).then(d=>setStatuses(d||[])).catch(()=>{});
      const stUrl = companyId ? `/auth/staff?company=${companyId}` : "/auth/staff";
      api(stUrl).then(d=>setStaff(d||[])).catch(()=>{});
    }
  }, [canRead, companyId]);

  useEffect(() => {
    if (selectedProject?._id) {
      socketService.joinProject(selectedProject._id);
      const r = () => fetchTasks();
      socketService.onTaskCreated(r); socketService.onTaskUpdated(r);
      socketService.onTaskDeleted(r); socketService.onTaskStatusChanged(r);
      return () => {
        socketService.offTaskCreated?.(r); socketService.offTaskUpdated?.(r);
        socketService.offTaskDeleted?.(r); socketService.offTaskStatusChanged?.(r);
        socketService.leaveProject(selectedProject._id);
      };
    }
  }, [selectedProject?._id, fetchTasks]);

  const updateInline = async (row, updates) => {
    const statusOnly = Object.keys(updates).length === 1 && updates.status;
    if (!canUpdate && !statusOnly) { showToast("Permission denied","error"); return; }
    try {
      setTasks(p => p.map(t => t._id===row._id ? {...t,...updates} : t));
      const fd = new FormData();
      fd.append("assignedTo", updates.assignedTo||row.assignedTo?._id||"");
      fd.append("status",     updates.status    ||row.status);
      fd.append("type","task"); fd.append("project",selectedProject._id);
      fd.append("company",companyId); fd.append("appLink",window.location.href);
      await api(`/tasks/${row._id}`,{method:"PUT",body:fd});
      showToast(updates.status&&!updates.assignedTo?"Status updated":updates.assignedTo&&!updates.status?"Assignee updated":"Task updated","update");
      fetchTasks();
    } catch (err) { fetchTasks(); showToast(err.message||"Failed to update","error"); }
  };

  const handleFileChange = e => setForm(f=>({...f,media:[...f.media,...Array.from(e.target.files)]}));
  const removeMedia = i => setForm(f=>({...f,media:f.media.filter((_,idx)=>idx!==i)}));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!companyId)         { showToast("No company selected","error"); return; }
    if (!form.title.trim()) { showToast("Title is required","error");   return; }
    if (!form.assignedTo)   { showToast("Please assign to a staff member","error"); return; }
    if (!form.status)       { showToast("Please select a status","error"); return; }
    try {
      setSubmitting(true);
      const taskData = {
        title: form.title, description: form.description,
        assignedTo: form.assignedTo, status: form.status, priority: form.priority||"Normal",
        project: selectedProject._id, company: companyId, type:"task", appLink:window.location.href,
        estimatedHours: form.estimatedHours || undefined,
      };
      if (editingId) {
        await taskService.updateTask(editingId, taskData);
        showToast("Task updated","update");
      } else {
        await taskService.createTask(taskData);
        showToast("Task created","success");
      }
      resetForm(); fetchTasks();
    } catch (err) { showToast(err.message||"Operation failed","error"); }
    finally { setSubmitting(false); }
  };

  const resetForm = () => {
    setForm({title:"",description:"",assignedTo:"",status:"",priority:"Normal",media:[],estimatedHours:""});
    setEditingId(null); setShowForm(false);
  };

  const confirmDelete = async () => {
    try {
      setDeleting(true);
      await api(`/tasks/${deleteId}`,{method:"DELETE"});
      setDeleteId(null); showToast("Task deleted","delete"); fetchTasks();
    } catch (err) { showToast(err.message||"Failed to delete","error"); }
    finally { setDeleting(false); }
  };

  if (!canRead) return <div className="permission-page"><h3>No Access</h3></div>;

  const fld = { marginBottom:"14px" };
  const lbl = { display:"block", fontSize:"12px", fontWeight:600, color:"#374151", marginBottom:"5px" };
  const inp = { width:"100%", padding:"8px 10px", border:"1px solid #d1d5db",
                borderRadius:"6px", fontSize:"13px", boxSizing:"border-box" };

  return (
    <div className="permission-page">
      {toast && <ToastMessage key={toast.id} {...toast} onClose={clearToast} />}

      <PageHeader title="Task Management" actions={
        canCreate && !isGlobal && selectedProject?._id && (
          <div style={{display:"flex",gap:"10px",alignItems:"center"}}>
            <BulkUpload type="task" projectId={selectedProject?._id} companyId={companyId}
              onUploadSuccess={fetchTasks} onShowToast={showToast} />
            <button className="btn-primary" onClick={()=>setShowForm(true)}>+ Create Task</button>
          </div>
        )
      } />

      {scheduleSummary && (
        <div style={{marginBottom:"12px",padding:"8px 14px",background:"#f0f9ff",
          border:"1px solid #bae6fd",borderRadius:"8px",fontSize:"12px",color:"#0369a1",
          display:"flex",alignItems:"center",gap:"8px"}}>
          <Clock size={13} /> <strong>Company Schedule:</strong> {scheduleSummary}
        </div>
      )}

      <div className="filter-bar">
        <div className="filter-left">
          <input type="text" placeholder="Search tasks..." value={search}
            onChange={e=>setSearch(e.target.value)} />
        </div>
        <div className="filter-right-group">
          <select value={selectedStatus} onChange={e=>setSelectedStatus(e.target.value)}>
            <option value="">All Status</option>
            {statuses.map(s=><option key={s._id} value={s.name}>{s.name}</option>)}
          </select>
          <select value={selectedStaff} onChange={e=>setSelectedStaff(e.target.value)}>
            <option value="">All Staff</option>
            {staff.map(s=><option key={s._id} value={s._id}>{s.username}</option>)}
          </select>
        </div>
      </div>

      {loading ? <TableSkeleton columns={5} rows={limit} /> : (
        <CommonTable
          columns={[
            { header:"Title", accessor:"title" },
            { header:"Schedule", render:(row)=><TaskDateBadge task={row} /> },
            {
              header:"Status",
              render:(row)=>(
                <select className="table-select" value={row.status}
                  onClick={e=>e.stopPropagation()}
                  onChange={e=>updateInline(row,{status:e.target.value})}>
                  {statuses.map(s=><option key={s._id} value={s.name}>{s.name}</option>)}
                </select>
              ),
            },
            {
              header:"Assigned To",
              render:(row)=>(
                <select className="table-select" disabled={!canUpdate}
                  value={row.assignedTo?._id||""}
                  onClick={e=>e.stopPropagation()}
                  onChange={e=>updateInline(row,{assignedTo:e.target.value})}>
                  <option value="">Unassigned</option>
                  {projectMembers.map(s=><option key={s._id} value={s._id}>{s.username}</option>)}
                </select>
              ),
            },
            {
              header:"Created By",
              render:(row)=>(
                <div style={{fontSize:"11px",lineHeight:"1.2"}}>
                  <div style={{fontWeight:600,color:"#374151"}}>{getCreatorName(row.createdBy)}</div>
                  <div style={{color:"#6b7280",fontSize:"10px"}}>{fmt(row.createdAt)}</div>
                </div>
              ),
            },
          ]}
          data={tasks} totalRecords={totalRecords} currentPage={page}
          totalPages={totalPages} limit={limit} onPageChange={setPage}
          onLimitChange={l=>{localStorage.setItem("table_entries",l);setLimit(l);setPage(1);}}
          actions={(row)=>(
            <>
              {canUpdate && (
                <button className="iconedit" title="Edit task"
                  onClick={e=>{
                    e.stopPropagation(); setEditingId(row._id);
                    setForm({
                      title:row.title||"", description:row.description||"",
                      assignedTo:row.assignedTo?._id||"", status:row.status||"",
                      priority:row.priority||"Normal", media:row.media||[],
                      // ✅ FIX: always store as string so it matches option value={String(h)}
                      estimatedHours: row.estimatedHours != null ? String(row.estimatedHours) : "",
                    });
                    setShowForm(true);
                  }}>
                  <Pencil size={18} />
                </button>
              )}
              {canDelete && (
                <button className="icondelete" title="Delete task"
                  onClick={e=>{e.stopPropagation();setDeleteId(row._id);setDeleteName(row.title);}}>
                  <Trash2 size={18} />
                </button>
              )}
              <button className="iconview" title="View task"
                onClick={e=>{e.stopPropagation();setViewTask(row);}}>
                <Eye size={18} />
              </button>
            </>
          )}
        />
      )}

      {/* ─── VIEW MODAL ─── */}
      <FormModal open={!!viewTask} onClose={()=>setViewTask(null)}
        title={viewTask?.type?.toUpperCase()||"TASK"} size="lg">
        {viewTask && (
          <div style={{padding:"10px 5px",color:"#1a1a1a"}}>
            <h2 style={{fontSize:"22px",fontWeight:600,margin:"0 0 6px 0"}}>{viewTask.title}</h2>
            <div style={{display:"flex",gap:"12px",fontSize:"12px",color:"#666",marginBottom:"20px",flexWrap:"wrap"}}>
              <span style={{display:"flex",alignItems:"center",gap:"6px"}}>
                <div style={{width:"8px",height:"8px",borderRadius:"50%",
                  background:viewTask.status==="Completed"?"#10b981":"#3b82f6"}} />
                {viewTask.status}
              </span>
              <span>· <strong>{viewTask.priority||"Normal"}</strong></span>
              <span style={{display:"flex",alignItems:"center",gap:"4px"}}>
                <Clock size={11} /> {fmt(viewTask.createdAt)}
              </span>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"10px",marginBottom:"22px"}}>
              <div style={{padding:"12px",background:"#eff6ff",borderRadius:"8px",border:"1px solid #bfdbfe"}}>
                <div style={{fontSize:"10px",color:"#1d4ed8",fontWeight:700,textTransform:"uppercase",marginBottom:"4px"}}>🟢 Started</div>
                {viewTask.startDate
                  ? <div style={{fontWeight:600,color:"#1e3a8a",fontSize:"12px"}}>{fmt(viewTask.startDate)}</div>
                  : <div style={{color:"#93c5fd",fontSize:"12px"}}>—</div>}
              </div>
              <div style={{padding:"12px",background:"#fff7ed",borderRadius:"8px",border:"1px solid #fed7aa"}}>
                <div style={{fontSize:"10px",color:"#c2410c",fontWeight:700,textTransform:"uppercase",marginBottom:"4px"}}>🔴 Due / Ends</div>
                {viewTask.endDate
                  ? <div style={{fontWeight:600,color:"#7c2d12",fontSize:"12px"}}>{fmt(viewTask.endDate)}</div>
                  : <div style={{color:"#fca5a5",fontSize:"12px"}}>Add hours to calculate</div>}
              </div>
              <div style={{padding:"12px",background:"#f0fdf4",borderRadius:"8px",border:"1px solid #86efac"}}>
                <div style={{fontSize:"10px",color:"#15803d",fontWeight:700,textTransform:"uppercase",marginBottom:"4px"}}>⏱ Est. Hours</div>
                {viewTask.estimatedHours
                  ? <div style={{fontWeight:700,color:"#14532d",fontSize:"22px",lineHeight:"1"}}>{viewTask.estimatedHours}h</div>
                  : <div style={{color:"#86efac",fontSize:"12px"}}>—</div>}
              </div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1.6fr 1fr",gap:"40px"}}>
              <div>
                <div style={{fontSize:"14px",lineHeight:"1.7",color:"#444",whiteSpace:"pre-wrap",marginBottom:"20px"}}>
                  {viewTask.description||"No additional details provided."}
                </div>
                {viewTask.media?.length > 0 && (
                  <div>
                    <div style={{fontSize:"12px",fontWeight:600,color:"#999",textTransform:"uppercase",marginBottom:"10px"}}>
                      📎 Attachments ({viewTask.media.length})
                    </div>
                    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(90px,1fr))",gap:"10px"}}>
                      {viewTask.media.map((file,idx)=>{
                        const isVid = file.match(/\.(mp4|mov|webm|avi)$/i);
                        const url = `${BASE_URL}/uploads/${file}`;
                        return (
                          <div key={idx} onClick={()=>window.open(url,"_blank")}
                            style={{position:"relative",paddingBottom:"100%",borderRadius:"8px",
                              overflow:"hidden",border:"1px solid #e5e7eb",cursor:"pointer",background:"#f9fafb"}}>
                            {isVid
                              ? <video src={url} style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover"}} />
                              : <img src={url} alt="" style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover"}} />}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
              <div style={{borderLeft:"1px solid #f0f0f0",paddingLeft:"28px",display:"flex",flexDirection:"column",gap:"18px"}}>
                {[
                  {label:"Assignee",    value:viewTask.assignedTo?.username||"Not assigned"},
                  {label:"Reporter",    value:getCreatorName(viewTask.createdBy), sub:viewTask.createdBy?.email},
                  {label:"Company",     value:viewTask.company?.name||"—"},
                  {label:"Last Updated",value:fmt(viewTask.updatedAt)},
                ].map(({label,value,sub})=>(
                  <div key={label}>
                    <div style={{fontSize:"10px",fontWeight:600,color:"#aaa",textTransform:"uppercase",marginBottom:"5px"}}>{label}</div>
                    <div style={{fontSize:"13px",fontWeight:500}}>{value}</div>
                    {sub && <div style={{fontSize:"11px",color:"#888"}}>{sub}</div>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </FormModal>

      {/* ─── CREATE / EDIT MODAL ─── */}
      <FormModal open={showForm} onClose={resetForm} title={editingId?"Edit Task":"Create Task"}>
        <form onSubmit={handleSubmit}>

          <div style={fld}>
            <label style={lbl}>Title <span style={{color:"#dc2626"}}>*</span></label>
            <input style={inp} value={form.title} required placeholder="Enter task title"
              onChange={e=>setForm({...form,title:e.target.value})} />
          </div>

          <div style={fld}>
            <label style={lbl}>Description</label>
            <textarea style={{...inp,minHeight:"68px",resize:"vertical"}}
              placeholder="Describe the task..." value={form.description}
              onChange={e=>setForm({...form,description:e.target.value})} />
          </div>

          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"14px",...fld}}>
            <div>
              <label style={lbl}>Assign To <span style={{color:"#dc2626"}}>*</span></label>
              <select style={inp} value={form.assignedTo} required
                onChange={e=>setForm({...form,assignedTo:e.target.value})}>
                <option value="">Select Staff</option>
                {projectMembers.length
                  ? projectMembers.map(s=><option key={s._id} value={s._id}>{s.username}</option>)
                  : <option disabled>No staff in this project</option>}
              </select>
            </div>
            <div>
              <label style={lbl}>Status <span style={{color:"#dc2626"}}>*</span></label>
              <select style={inp} value={form.status} required
                onChange={e=>setForm({...form,status:e.target.value})}>
                <option value="">Select Status</option>
                {statuses.map(s=><option key={s._id} value={s.name}>{s.name}</option>)}
              </select>
            </div>
          </div>

          <div style={fld}>
            <label style={lbl}>Priority</label>
            <select style={inp} value={form.priority||"Normal"}
              onChange={e=>setForm({...form,priority:e.target.value})}>
              {["Low","Normal","High","Critical"].map(p=><option key={p} value={p}>{p}</option>)}
            </select>
          </div>

          {/* ─── HOUR-BASED SCHEDULING ─── */}
          <div style={{background:"#f8fafc",border:"1px solid #e2e8f0",borderRadius:"10px",
            padding:"14px",...fld}}>

            <div style={{fontSize:"12px",fontWeight:700,color:"#1e293b",
              marginBottom:"12px",display:"flex",alignItems:"center",gap:"6px"}}>
              <Timer size={14} color="#7c3aed" />
              Hour-Based Scheduling
            </div>

            <div style={{padding:"8px 12px",background:"#eff6ff",borderRadius:"8px",
              border:"1px solid #bfdbfe",fontSize:"12px",color:"#1d4ed8",
              marginBottom:"12px",display:"flex",alignItems:"center",gap:"8px"}}>
              🟢 <strong>Start: Now</strong>
              <span style={{color:"#3b82f6",fontWeight:400}}>
                — task starts the moment you submit, from current time
              </span>
            </div>

            <div style={fld}>
              <label style={{...lbl,color:"#7c3aed"}}>
                ⏱ Estimated Hours Required
              </label>
              {/* ✅ FIX: value={String(h)} ensures string comparison works correctly in edit mode */}
              <select style={inp} value={form.estimatedHours}
                onChange={e=>setForm({...form,estimatedHours:e.target.value})}>
                <option value="">Select hours needed</option>
                {HOUR_OPTIONS.map(h=>(
                  <option key={h} value={String(h)}>
                    {h < 1 ? `${h*60} minutes (${h}h)` : `${h} hour${h>1?"s":""}`}
                  </option>
                ))}
              </select>
            </div>

            {form.estimatedHours && workingHours.length > 0 && (
              <SchedulePreview
                estimatedHours={form.estimatedHours}
                workingHours={workingHours}
                holidays={holidays}
              />
            )}
            {form.estimatedHours && !workingHours.length && (
              <div style={{padding:"8px 12px",background:"#fffbeb",borderRadius:"8px",
                border:"1px solid #fde68a",fontSize:"12px",color:"#92400e",
                display:"flex",gap:"6px",alignItems:"center"}}>
                <AlertCircle size={13} />
                Working hours not configured. Please set them in Company Settings.
              </div>
            )}
          </div>

          {/* Media */}
          <div style={fld}>
            <label style={{...lbl,display:"flex",alignItems:"center",gap:"5px"}}>
              <Upload size={13} /> Attach Media
            </label>
            <input type="file" multiple accept="image/*,video/*" onChange={handleFileChange}
              style={{fontSize:"12px"}} />
            {form.media.length > 0 && (
              <div style={{display:"flex",gap:"8px",flexWrap:"wrap",marginTop:"8px",
                background:"#f9fafb",padding:"8px",borderRadius:"8px"}}>
                {form.media.map((file,idx)=>(
                  <div key={idx} style={{position:"relative",width:"64px",height:"64px",
                    borderRadius:"6px",overflow:"hidden",border:"1px solid #ddd"}}>
                    <img src={typeof file==="string"?`${BASE_URL}/uploads/${file}`:URL.createObjectURL(file)}
                      style={{width:"100%",height:"100%",objectFit:"cover"}} alt="" />
                    <button type="button" onClick={()=>removeMedia(idx)}
                      style={{position:"absolute",top:"2px",right:"2px",background:"rgba(220,0,0,.8)",
                        color:"#fff",border:"none",borderRadius:"50%",width:"16px",height:"16px",
                        display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}>
                      <X size={10} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="form-actions" style={{marginTop:"8px"}}>
            <button type="button" className="btn-secondary" onClick={resetForm}
              style={{marginRight:"10px"}} disabled={submitting}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting?"Processing...":editingId?"Update Task":"Create Task"}
            </button>
          </div>
        </form>
      </FormModal>

      {deleteId && (
        <ConfirmDelete title={`Delete "${deleteName}"?`} message="This action cannot be undone."
          onCancel={()=>setDeleteId(null)} onConfirm={confirmDelete} loading={deleting} />
      )}
    </div>
  );
}