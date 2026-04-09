import { useState, useEffect, useRef } from "react";
import { api } from "../../api";
import { useAuth } from "../../context/AuthContext";
import { useGlobalSocket } from "../../context/GlobalSocketProvider";
import {
  MessageSquare, Send, Paperclip, X, FileText, Image,
  Film, File, Check, Hash, User, Users, UserPlus,
  UserMinus, ChevronRight, Forward, Pencil, Trash2,
  CheckCheck, Info,
} from "lucide-react";
import "../../styles/Chat.css";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:4000";
const API_BASE   = import.meta.env.VITE_API_URL    || "http://localhost:4000/api";

/* ============================================================  HELPERS  */
const formatTime = (d) => {
  if (!d) return "";
  const dt = new Date(d), now = new Date();
  const yes = new Date(now); yes.setDate(now.getDate() - 1);
  if (dt.toDateString() === now.toDateString())
    return dt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  if (dt.toDateString() === yes.toDateString()) return "Yesterday";
  return dt.toLocaleDateString([], { day: "numeric", month: "short" });
};
const formatDateLabel = (d) => {
  const dt = new Date(d), now = new Date();
  const yes = new Date(now); yes.setDate(now.getDate() - 1);
  if (dt.toDateString() === now.toDateString()) return "Today";
  if (dt.toDateString() === yes.toDateString()) return "Yesterday";
  return dt.toLocaleDateString([], { day: "numeric", month: "long", year: "numeric" });
};
const fmtSize = (b) => {
  if (!b) return "";
  if (b < 1024) return `${b} B`;
  if (b < 1024*1024) return `${(b/1024).toFixed(1)} KB`;
  return `${(b/(1024*1024)).toFixed(1)} MB`;
};
const fileIcon = (mime="", name="") => {
  if (/^image\//.test(mime)) return <Image size={18}/>;
  if (/^video\//.test(mime)) return <Film size={18}/>;
  if (/pdf/.test(mime)||/\.pdf$/i.test(name)) return <FileText size={18}/>;
  return <File size={18}/>;
};
const getRoomAvatar = (room, myId) => {
  if (room.type === "personal") {
    const o = room.members?.find((m) => String(m._id) !== String(myId));
    return o?.username?.[0]?.toUpperCase() || "?";
  }
  if (room.type === "company_group") return "C";
  return room.name?.[0]?.toUpperCase() || "G";
};
const getRoomName = (room, myId) => {
  if (room.type === "personal") {
    const o = room.members?.find((m) => String(m._id) !== String(myId));
    return o?.username || o?.email || "Unknown";
  }
  return room.name || "Group";
};
const avatarClass = (t) =>
  t === "project_group" ? "project" : t === "company_group" ? "company" : t === "personal" ? "personal" : "";

const groupByDate = (msgs) => {
  const out = []; let cur = null;
  msgs.forEach((msg) => {
    const d = new Date(msg.createdAt).toDateString();
    if (d !== cur) { out.push({ type:"sep", date: msg.createdAt, key: d }); cur = d; }
    out.push({ type:"msg", msg });
  });
  return out;
};

/* ============================================================  MEMBER SELECT MODAL  */
function MemberSelectModal({ title, members, onClose, onConfirm, multiSelect=false, loading, excludeIds=[] }) {
  const [search, setSearch] = useState("");
  const [sel, setSel]       = useState([]);
  const [gname, setGname]   = useState("");

  const list = members.filter(
    (m) => !excludeIds.includes(String(m._id)) &&
      (m.username?.toLowerCase().includes(search.toLowerCase()) ||
       m.email?.toLowerCase().includes(search.toLowerCase()))
  );

  const toggle = (id) => {
    if (!multiSelect) { setSel([id]); return; }
    setSel((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]);
  };

  const ok = multiSelect ? sel.length > 0 && gname.trim() : sel.length === 1;

  return (
    <div className="chat-modal-overlay" onClick={(e) => e.target===e.currentTarget && onClose()}>
      <div className="chat-modal">
        <h3>{title}</h3>
        {multiSelect && (
          <input className="chat-modal-input" placeholder="Group name..." value={gname}
            onChange={(e) => setGname(e.target.value)} />
        )}
        <input className="chat-modal-input" placeholder="Search members..." value={search}
          onChange={(e) => setSearch(e.target.value)} autoFocus />
        <div className="chat-members-select-list">
          {list.map((m) => (
            <div key={m._id} className={`chat-member-select-item${sel.includes(m._id)?" selected":""}`}
              onClick={() => toggle(m._id)}>
              <div className="chat-member-select-check">
                {sel.includes(m._id) && <Check size={11} strokeWidth={3}/>}
              </div>
              <div className="chat-room-avatar personal" style={{width:30,height:30,fontSize:12}}>
                {m.username?.[0]?.toUpperCase()||"?"}
              </div>
              <div>
                <div className="chat-member-select-name">{m.username}</div>
                <div className="chat-member-select-email">
                  {m.email}{m.company?.name ? ` · ${m.company.name}` : ""}
                </div>
              </div>
            </div>
          ))}
          {list.length === 0 && (
            <div style={{padding:"20px",textAlign:"center",color:"#94a3b8",fontSize:13}}>
              No members found
            </div>
          )}
        </div>
        <div className="chat-modal-actions">
          <button className="chat-modal-btn cancel" onClick={onClose}>Cancel</button>
          <button className="chat-modal-btn confirm" disabled={!ok||loading}
            onClick={() => onConfirm(sel, gname)}>
            {loading ? "..." : multiSelect ? "Create Group" : "Start Chat"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ============================================================  FORWARD MODAL  */
function ForwardModal({ rooms, myId, onClose, onForward, loading }) {
  const [search, setSearch] = useState("");
  const [picked, setPicked] = useState(null);

  const list = rooms.filter((r) =>
    getRoomName(r, myId).toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="chat-modal-overlay" onClick={(e) => e.target===e.currentTarget && onClose()}>
      <div className="chat-modal">
        <h3>Forward Message</h3>
        <input className="chat-modal-input" placeholder="Search chats..." value={search}
          onChange={(e) => setSearch(e.target.value)} autoFocus />
        <div className="chat-members-select-list">
          {list.map((r) => (
            <div key={r._id} className={`chat-member-select-item${picked===r._id?" selected":""}`}
              onClick={() => setPicked(r._id)}>
              <div className="chat-member-select-check">
                {picked===r._id && <Check size={11} strokeWidth={3}/>}
              </div>
              <div className={`chat-room-avatar ${avatarClass(r.type)}`} style={{width:30,height:30,fontSize:12}}>
                {getRoomAvatar(r, myId)}
              </div>
              <div>
                <div className="chat-member-select-name">{getRoomName(r, myId)}</div>
                <div className="chat-member-select-email">{r.type.replace("_"," ")}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="chat-modal-actions">
          <button className="chat-modal-btn cancel" onClick={onClose}>Cancel</button>
          <button className="chat-modal-btn confirm" disabled={!picked||loading}
            onClick={() => onForward(picked)}>
            {loading ? "Forwarding..." : "Forward"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ============================================================  GROUP INFO PANEL  */
function GroupInfoPanel({ room, members, myId, isAdmin, onClose, onAddMember, onRemoveMember, allMembers }) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [addLoading, setAddLoading]     = useState(false);
  const isCreator = String(room?.createdBy) === String(myId);
  const canManage = isAdmin || isCreator;
  const existingIds = (room?.members||[]).map((m) => String(m._id||m));

  const handleAdd = async (sel) => {
    setAddLoading(true);
    await onAddMember(sel[0]);
    setAddLoading(false);
    setShowAddModal(false);
  };

  return (
    <>
      <div className="chat-group-panel">
        <div className="chat-group-panel-header">
          <button className="chat-group-panel-close" onClick={onClose}><X size={16}/></button>
          <div className="chat-group-panel-avatar">
            <div className={`chat-room-avatar ${avatarClass(room?.type)}`}
              style={{width:56,height:56,fontSize:22}}>
              {getRoomAvatar(room, myId)}
            </div>
          </div>
          <div className="chat-group-panel-name">{getRoomName(room, myId)}</div>
          <div className="chat-group-panel-count">{members.length} members</div>
        </div>

        <div className="chat-group-panel-section-label">Members</div>
        <div className="chat-group-panel-members">
          {members.map((m) => {
            const memberId = m._id || m;
            const isMe     = String(memberId) === String(myId);
            const isOwner  = String(memberId) === String(room?.createdBy);
            return (
              <div key={String(memberId)} className="chat-group-panel-member-row">
                <div className="chat-room-avatar personal" style={{width:34,height:34,fontSize:13,flexShrink:0}}>
                  {(m.username||"?")[0].toUpperCase()}
                </div>
                <div className="chat-group-panel-member-info">
                  <div className="chat-group-panel-member-name">
                    {m.username || "Unknown"}{isMe?" (You)":""}{isOwner?" 👑":""}
                  </div>
                  <div className="chat-group-panel-member-email">{m.email||""}</div>
                </div>
                {canManage && !isMe && !isOwner && room?.type !== "project_group" && room?.type !== "company_group" && (
                  <button className="chat-group-panel-remove-btn"
                    onClick={() => onRemoveMember(String(memberId))}
                    title="Remove member">
                    <UserMinus size={14}/>
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {canManage && room?.type !== "project_group" && room?.type !== "company_group" && (
          <div style={{padding:"12px 16px"}}>
            <button className="chat-group-panel-add-btn" onClick={() => setShowAddModal(true)}>
              <UserPlus size={14}/> Add Member
            </button>
          </div>
        )}
      </div>

      {showAddModal && (
        <MemberSelectModal
          title="Add Member"
          members={allMembers}
          onClose={() => setShowAddModal(false)}
          onConfirm={handleAdd}
          multiSelect={false}
          loading={addLoading}
          excludeIds={existingIds}
        />
      )}
    </>
  );
}

/* ============================================================  MESSAGE CONTEXT MENU  */
function MsgContextMenu({ x, y, msg, isOwn, onEdit, onDelete, onForward, onClose }) {
  const ref = useRef(null);
  useEffect(() => {
    const fn = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, [onClose]);

  const canEdit = isOwn && msg.text && !msg.isDeleted && !msg.file?.url;

  return (
    <div ref={ref} className="chat-context-menu" style={{ top: y, left: x }}>
      {!msg.isDeleted && (
        <button className="chat-ctx-btn" onClick={() => { onForward(msg); onClose(); }}>
          <Forward size={13}/> Forward
        </button>
      )}
      {canEdit && (
        <button className="chat-ctx-btn" onClick={() => { onEdit(msg); onClose(); }}>
          <Pencil size={13}/> Edit
        </button>
      )}
      {isOwn && !msg.isDeleted && (
        <button className="chat-ctx-btn danger" onClick={() => { onDelete(msg._id); onClose(); }}>
          <Trash2 size={13}/> Delete
        </button>
      )}
    </div>
  );
}

/* ============================================================  SEEN LABEL  */
function SeenLabel({ msg, room, myId }) {
  if (!msg || !room) return null;
  const readBy = msg.readBy || [];
  const others = readBy.filter((id) => String(id) !== String(myId));

  if (room.type === "personal") {
    const otherMember = room.members?.find((m) => String(m._id||m) !== String(myId));
    const seen = otherMember && others.some((id) => String(id) === String(otherMember._id||otherMember));
    return (
      <div className="chat-seen-label">
        {seen
          ? <><CheckCheck size={12} style={{color:"#a5b4fc"}}/> <span>Seen</span></>
          : <><Check size={12}/></>
        }
      </div>
    );
  }

  // Group
  const totalMembers = (room.members?.length || 1) - 1;
  const seenCount    = others.length;
  if (seenCount === 0) return <div className="chat-seen-label"><Check size={12}/></div>;

  return (
    <div className="chat-seen-label">
      <CheckCheck size={12} style={{color: seenCount >= totalMembers ? "#a5b4fc" : "#94a3b8"}}/>
      {seenCount > 0 && <span>{seenCount >= totalMembers ? "Seen" : `Seen by ${seenCount}`}</span>}
    </div>
  );
}

/* ============================================================  MAIN COMPONENT  */
export default function Chat() {
  const { user, role } = useAuth();
  const { socket }     = useGlobalSocket();
  const isAdmin        = role === "ADMIN";

  const [rooms,          setRooms]          = useState([]);
  const [activeRoom,     setActiveRoom]      = useState(null);
  const [messages,       setMessages]        = useState([]);
  const [members,        setMembers]         = useState([]);
  const [searchQuery,    setSearchQuery]     = useState("");
  const [inputText,      setInputText]       = useState("");
  const [pendingFile,    setPendingFile]     = useState(null);
  const [sending,        setSending]         = useState(false);
  const [loadingRooms,   setLoadingRooms]    = useState(true);
  const [loadingMsgs,    setLoadingMsgs]     = useState(false);
  const [typingUsers,    setTypingUsers]     = useState({});
  const [showDmModal,    setShowDmModal]     = useState(false);
  const [showGroupModal, setShowGroupModal]  = useState(false);
  const [modalLoading,   setModalLoading]    = useState(false);
  const [totalUnread,    setTotalUnread]     = useState(0);
  const [showGroupInfo,  setShowGroupInfo]   = useState(false);
  const [contextMenu,    setContextMenu]     = useState(null); // { msg, x, y }
  const [editingMsg,     setEditingMsg]      = useState(null); // message obj
  const [editText,       setEditText]        = useState("");
  const [forwardMsg,     setForwardMsg]      = useState(null);
  const [fwdLoading,     setFwdLoading]      = useState(false);

  const messagesEndRef = useRef(null);
  const fileInputRef   = useRef(null);
  const typingTimer    = useRef(null);
  const isTypingRef    = useRef(false);
  const activeRoomRef  = useRef(null);

  useEffect(() => { activeRoomRef.current = activeRoom; }, [activeRoom]);
  useEffect(() => { fetchRooms(); fetchMembers(); }, []);

  const fetchRooms = async () => {
    try {
      setLoadingRooms(true);
      const data = await api.get("/chat/rooms");
      setRooms(data || []);
      setTotalUnread((data||[]).reduce((s,r) => s+(r.unreadCount||0), 0));
    } catch (e) { console.error(e); } finally { setLoadingRooms(false); }
  };

  const fetchMembers = async () => {
    try { setMembers((await api.get("/chat/members")) || []); }
    catch (e) { console.error(e); }
  };

  /* ── Active room change ── */
  useEffect(() => {
    if (!activeRoom) return;
    loadMessages(activeRoom._id);
    setShowGroupInfo(false);
    if (socket) socket.emit("joinChatRoom", activeRoom._id);
    return () => { if (socket) socket.emit("leaveChatRoom", activeRoom._id); };
  }, [activeRoom?._id]);

  const loadMessages = async (roomId) => {
    try {
      setLoadingMsgs(true);
      const data = await api.get(`/chat/rooms/${roomId}/messages`);
      setMessages(data || []);
      setRooms((p) => p.map((r) => String(r._id)===String(roomId)?{...r,unreadCount:0}:r));
    } catch (e) { console.error(e); } finally { setLoadingMsgs(false); }
  };

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior:"smooth" }); }, [messages]);

  /* ── Socket events ── */
  useEffect(() => {
    if (!socket) return;

    const onNewMsg = ({ roomId, message }) => {
      if (String(activeRoomRef.current?._id) === String(roomId)) {
        setMessages((p) => [...p, message]);
        setTypingUsers((p) => ({
          ...p,
          [roomId]: (p[roomId]||[]).filter((u) => String(u.userId)!==String(message.sender?._id)),
        }));
      } else {
        setRooms((p) => p.map((r) => String(r._id)===String(roomId)
          ? {...r, unreadCount:(r.unreadCount||0)+1,
              lastMessage:{text:message.text||(message.file?`📎 ${message.file.originalName}`:""),
                sender:message.sender, sentAt:message.createdAt}}
          : r));
        setTotalUnread((n) => n+1);
      }
    };

    const onMsgDeleted = ({ messageId }) => {
      setMessages((p) => p.map((m) => String(m._id)===String(messageId)?{...m,isDeleted:true,text:""}:m));
    };

    const onMsgEdited = ({ messageId, text, isEdited, editedAt }) => {
      setMessages((p) => p.map((m) => String(m._id)===String(messageId)?{...m,text,isEdited,editedAt}:m));
    };

    const onTyping = ({ userId, username, roomId }) => {
      if (String(activeRoomRef.current?._id)===String(roomId)) {
        setTypingUsers((p) => {
          const ex = (p[roomId]||[]).filter((u) => u.userId!==userId);
          return {...p,[roomId]:[...ex,{userId,username}]};
        });
      }
    };

    const onStopTyping = ({ userId, roomId }) => {
      setTypingUsers((p) => ({...p,[roomId]:(p[roomId]||[]).filter((u)=>u.userId!==userId)}));
    };

    const onNewRoom = (room) => {
      setRooms((p) => p.some((r)=>String(r._id)===String(room._id)) ? p : [room,...p]);
    };

    const onRemovedFromGroup = ({ roomId }) => {
      setRooms((p) => p.filter((r) => String(r._id)!==String(roomId)));
      if (String(activeRoomRef.current?._id)===String(roomId)) setActiveRoom(null);
    };

    const onMembersUpdated = ({ roomId, members }) => {
      setRooms((p) => p.map((r) => String(r._id)===String(roomId)?{...r,members}:r));
      if (String(activeRoomRef.current?._id)===String(roomId)) {
        setActiveRoom((prev) => prev?{...prev,members}:prev);
      }
    };

    // ✅ Real-time seen: update readBy for all messages
    const onMsgsRead = ({ roomId, userId: readerId }) => {
      if (String(activeRoomRef.current?._id)===String(roomId)) {
        setMessages((p) => p.map((m) => {
          if ((m.readBy||[]).map(String).includes(String(readerId))) return m;
          return {...m, readBy:[...(m.readBy||[]), readerId]};
        }));
      }
    };

    socket.on("newMessage",          onNewMsg);
    socket.on("messageDeleted",      onMsgDeleted);
    socket.on("messageEdited",       onMsgEdited);
    socket.on("userTyping",          onTyping);
    socket.on("userStopTyping",      onStopTyping);
    socket.on("newChatRoom",         onNewRoom);
    socket.on("removedFromGroup",    onRemovedFromGroup);
    socket.on("groupMembersUpdated", onMembersUpdated);
    socket.on("messagesRead",        onMsgsRead);

    return () => {
      socket.off("newMessage",          onNewMsg);
      socket.off("messageDeleted",      onMsgDeleted);
      socket.off("messageEdited",       onMsgEdited);
      socket.off("userTyping",          onTyping);
      socket.off("userStopTyping",      onStopTyping);
      socket.off("newChatRoom",         onNewRoom);
      socket.off("removedFromGroup",    onRemovedFromGroup);
      socket.off("groupMembersUpdated", onMembersUpdated);
      socket.off("messagesRead",        onMsgsRead);
    };
  }, [socket]);

  /* ── Typing ── */
  const handleInputChange = (e) => {
    setInputText(e.target.value);
    if (!socket || !activeRoom) return;
    if (!isTypingRef.current) {
      isTypingRef.current = true;
      socket.emit("chatTyping", { roomId:activeRoom._id, userId:user._id, username:user.username });
    }
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => {
      isTypingRef.current = false;
      socket.emit("chatStopTyping", { roomId:activeRoom._id, userId:user._id });
    }, 1500);
  };

  /* ── Send ── */
  const handleSend = async () => {
    if ((!inputText.trim() && !pendingFile) || !activeRoom || sending) return;
    setSending(true);
    if (isTypingRef.current) {
      isTypingRef.current = false;
      socket?.emit("chatStopTyping", { roomId:activeRoom._id, userId:user._id });
    }
    try {
      const fd = new FormData();
      if (inputText.trim()) fd.append("text", inputText.trim());
      if (pendingFile) fd.append("file", pendingFile);
      await fetch(`${API_BASE}/chat/rooms/${activeRoom._id}/messages`,
        { method:"POST", credentials:"include", body:fd });
      setInputText(""); setPendingFile(null);
      setRooms((p) => p.map((r) => String(r._id)===String(activeRoom._id)
        ? {...r, lastMessage:{text:inputText.trim()||"📎 File", sentAt:new Date()}} : r));
    } catch(e) { console.error(e); } finally { setSending(false); }
  };

  const handleKeyDown = (e) => {
    if (e.key==="Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  /* ── Delete ── */
  const handleDeleteMessage = async (msgId) => {
    try { await api.delete(`/chat/messages/${msgId}`); } catch(e) { console.error(e); }
  };

  /* ── Edit ── */
  const handleEditSave = async () => {
    if (!editText.trim() || !editingMsg) return;
    try {
      await api.put(`/chat/messages/${editingMsg._id}`, { text: editText.trim() });
      setEditingMsg(null); setEditText("");
    } catch(e) { console.error(e); }
  };

  /* ── Forward ── */
  const handleForward = async (targetRoomId) => {
    if (!forwardMsg) return;
    setFwdLoading(true);
    try {
      await api.post(`/chat/messages/${forwardMsg._id}/forward`, { targetRoomId });
      setForwardMsg(null);
    } catch(e) { console.error(e); } finally { setFwdLoading(false); }
  };

  /* ── DM ── */
  const handleStartDM = async (sel) => {
    setModalLoading(true);
    try {
      const room = await api.post(`/chat/rooms/personal/${sel[0]}`);
      setRooms((p) => {
        const ex = p.find((r) => String(r._id)===String(room._id));
        if (ex) { setActiveRoom(ex); return p; }
        setActiveRoom(room); return [room,...p];
      });
      setShowDmModal(false);
    } catch(e) { console.error(e); } finally { setModalLoading(false); }
  };

  /* ── Create group ── */
  const handleCreateGroup = async (sel, name) => {
    setModalLoading(true);
    try {
      const room = await api.post("/chat/rooms/group", { name, memberIds:sel });
      setRooms((p) => [{...room,unreadCount:0},...p]);
      setActiveRoom(room); setShowGroupModal(false);
    } catch(e) { console.error(e); } finally { setModalLoading(false); }
  };

  /* ── Group member management ── */
  const handleAddMember = async (memberId) => {
    try {
      const updated = await api.post(`/chat/rooms/${activeRoom._id}/members`, { userId: memberId });
      setActiveRoom(updated); setRooms((p) => p.map((r) => String(r._id)===String(updated._id)?updated:r));
    } catch(e) { console.error(e); }
  };

  const handleRemoveMember = async (memberId) => {
    try {
      const updated = await api.delete(`/chat/rooms/${activeRoom._id}/members/${memberId}`);
      setActiveRoom(updated); setRooms((p) => p.map((r) => String(r._id)===String(updated._id)?updated:r));
    } catch(e) { console.error(e); }
  };

  /* ── Context menu ── */
  const openContextMenu = (e, msg) => {
    e.preventDefault();
    const isOwn = String(msg.sender?._id)===String(user?._id);
    if (!isOwn && msg.isDeleted) return;
    const rect = document.querySelector(".chat-messages").getBoundingClientRect();
    // Position relative to the chat-messages container
    setContextMenu({ msg, x: e.clientX - rect.left, y: e.clientY - rect.top, isOwn });
  };

  /* ── File ── */
  const handleFileSelect = (e) => {
    const f = e.target.files?.[0]; if (f) setPendingFile(f); e.target.value="";
  };

  /* ── Filtered rooms ── */
  const filtered = rooms.filter((r) =>
    getRoomName(r, user?._id).toLowerCase().includes(searchQuery.toLowerCase())
  );
  const companyGrps = filtered.filter((r) => r.type==="company_group");
  const projGrps    = filtered.filter((r) => r.type==="project_group");
  const custGrps    = filtered.filter((r) => r.type==="custom_group");
  const dms         = filtered.filter((r) => r.type==="personal");

  const currentTyping = typingUsers[activeRoom?._id] || [];
  const typingLabel   = currentTyping.length===1
    ? `${currentTyping[0].username} is typing...`
    : currentTyping.length>1
      ? `${currentTyping.map((u)=>u.username).join(", ")} are typing...`
      : null;

  const isGroup = activeRoom && activeRoom.type !== "personal";

  /* ── Render room item ── */
  const renderRoomItem = (room) => {
    const active  = String(activeRoom?._id)===String(room._id);
    const name    = getRoomName(room, user?._id);
    const unread  = room.unreadCount || 0;
    const lastTxt = room.lastMessage?.text || "";
    const lastT   = room.lastMessage?.sentAt ? formatTime(room.lastMessage.sentAt) : "";
    return (
      <div key={room._id}
        className={`chat-room-item${active?" active":""}`}
        onClick={() => { setActiveRoom(room); setTypingUsers((p)=>({...p,[room._id]:[]}))}}>
        <div className={`chat-room-avatar ${avatarClass(room.type)}`}>
          {getRoomAvatar(room, user?._id)}
        </div>
        <div className="chat-room-info">
          <div className="chat-room-name">{name}</div>
          <div className={`chat-room-last-msg${unread>0?" unread":""}`}>{lastTxt||"No messages yet"}</div>
        </div>
        <div className="chat-room-meta">
          {lastT && <span className="chat-room-time">{lastT}</span>}
          {unread>0 && <span className="chat-unread-badge">{unread>99?"99+":unread}</span>}
        </div>
      </div>
    );
  };

  /* ── Render message ── */
  const renderMessage = (msg) => {
    const isOwn  = String(msg.sender?._id)===String(user?._id);
    const sName  = msg.sender?.username || "Unknown";
    const isEdit = editingMsg && String(editingMsg._id)===String(msg._id);

    return (
      <div key={msg._id} className={`chat-message-group ${isOwn?"own":"other"}`}>
        {!isOwn && isGroup && <div className="chat-msg-sender-label">{sName}</div>}
        <div className="chat-bubble-row">
          {!isOwn && <div className="chat-bubble-avatar">{sName[0]?.toUpperCase()}</div>}
          <div className="chat-bubble"
            onContextMenu={(e) => openContextMenu(e, msg)}
            title="Right-click for options">
            {msg.isDeleted ? (
              <span className="chat-bubble-deleted">🚫 This message was deleted</span>
            ) : isEdit ? (
              /* ── Inline edit mode ── */
              <div className="chat-edit-mode">
                <textarea className="chat-edit-textarea"
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  onKeyDown={(e) => { if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();handleEditSave();}
                    if(e.key==="Escape"){setEditingMsg(null);setEditText("");} }}
                  autoFocus />
                <div className="chat-edit-actions">
                  <button className="chat-edit-btn save" onClick={handleEditSave}>Save</button>
                  <button className="chat-edit-btn cancel" onClick={()=>{setEditingMsg(null);setEditText("");}}>Cancel</button>
                </div>
              </div>
            ) : (
              <>
                {/* Forwarded label */}
                {msg.forwardedFrom && (
                  <div className="chat-forwarded-label"><Forward size={11}/> Forwarded</div>
                )}
                {/* File */}
                {msg.file?.url && (
                  msg.file.fileCategory==="image" ? (
                    <a href={`${SOCKET_URL}/${msg.file.url}`} target="_blank" rel="noreferrer">
                      <img src={`${SOCKET_URL}/${msg.file.url}`} alt={msg.file.originalName}
                        className="chat-img-preview" />
                    </a>
                  ) : (
                    <a className="chat-file-attachment" href={`${SOCKET_URL}/${msg.file.url}`}
                      target="_blank" rel="noreferrer" download={msg.file.originalName}>
                      <div className="chat-file-icon">{fileIcon(msg.file.mimeType,msg.file.originalName)}</div>
                      <div className="chat-file-info">
                        <div className="chat-file-name">{msg.file.originalName}</div>
                        <div className="chat-file-size">{fmtSize(msg.file.size)}</div>
                        {msg.linkedDocument && <div className="chat-file-doc-badge">📄 Saved to Documents</div>}
                      </div>
                    </a>
                  )
                )}
                {/* Text */}
                {msg.text && <div style={{whiteSpace:"pre-wrap"}}>{msg.text}</div>}
                {/* Edited label */}
                {msg.isEdited && <div className="chat-edited-label">edited</div>}
              </>
            )}
            <div className="chat-bubble-time">
              {new Date(msg.createdAt).toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"})}
            </div>
            {/* ✅ Seen indicator — only for own messages */}
            {isOwn && !msg.isDeleted && (
              <SeenLabel msg={msg} room={activeRoom} myId={user?._id} />
            )}
          </div>
          {/* Three-dot hover button */}
          {!msg.isDeleted && (
            <button className="chat-msg-options-btn"
              onClick={(e) => openContextMenu(e, msg)}
              title="Options">
              ⋯
            </button>
          )}
        </div>
      </div>
    );
  };

  /* ============================================================  RENDER  */
  return (
    <div className="chat-page" onClick={() => contextMenu && setContextMenu(null)}>
      {/* ── LEFT SIDEBAR ── */}
      <div className="chat-sidebar">
        <div className="chat-sidebar-header">
          <h2>
            Chats
            {totalUnread>0 && (
              <span className="chat-unread-badge" style={{marginLeft:8,fontSize:12}}>{totalUnread}</span>
            )}
          </h2>
          <input className="chat-search-input" placeholder="Search conversations..."
            value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          <div className="chat-sidebar-actions">
            <button className="chat-action-btn" onClick={()=>setShowDmModal(true)}>
              <User size={13}/> {isAdmin ? "Message Owner" : "New Message"}
            </button>
            <button className="chat-action-btn" onClick={()=>setShowGroupModal(true)}>
              <Users size={13}/> New Group
            </button>
          </div>
        </div>

        <div className="chat-rooms-list">
          {loadingRooms ? (
            <div style={{padding:"20px",textAlign:"center",color:"#94a3b8",fontSize:13}}>Loading chats...</div>
          ) : (
            <>
              {companyGrps.length>0 && <><div className="chat-section-label">Company</div>{companyGrps.map(renderRoomItem)}</>}
              {projGrps.length>0    && <><div className="chat-section-label">Projects</div>{projGrps.map(renderRoomItem)}</>}
              {custGrps.length>0    && <><div className="chat-section-label">Groups</div>{custGrps.map(renderRoomItem)}</>}
              {dms.length>0         && <><div className="chat-section-label">
                {isAdmin ? "Company Owners" : "Direct Messages"}
              </div>{dms.map(renderRoomItem)}</>}
              {filtered.length===0 && (
                <div style={{padding:"24px 16px",textAlign:"center",color:"#94a3b8",fontSize:13}}>
                  {searchQuery ? "No results found" : "No chats yet. Start a conversation!"}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ── RIGHT CHAT WINDOW ── */}
      <div className="chat-window">
        {!activeRoom ? (
          <div className="chat-empty-state">
            <MessageSquare size={56}/>
            <h3>Select a conversation</h3>
            <p>Choose a chat from the list or start a new message</p>
          </div>
        ) : (
          <div className="chat-main-area">
            {/* Header */}
            <div className="chat-window-header">
              <div className={`chat-room-avatar ${avatarClass(activeRoom.type)}`}
                style={{width:38,height:38,fontSize:14}}>
                {getRoomAvatar(activeRoom, user?._id)}
              </div>
              <div className="chat-window-header-info"
                style={{cursor: isGroup?"pointer":"default"}}
                onClick={() => isGroup && setShowGroupInfo((p)=>!p)}>
                <div className="chat-window-title">
                  {getRoomName(activeRoom, user?._id)}
                  {isGroup && <Info size={13} style={{marginLeft:6,opacity:0.5,verticalAlign:"middle"}}/>}
                </div>
                <div className={`chat-window-subtitle${typingLabel?" typing":""}`}>
                  {typingLabel || (isGroup ? `${activeRoom.members?.length||0} members` : "Personal message")}
                </div>
              </div>
              {isGroup && (
                <button className="chat-info-toggle-btn"
                  onClick={() => setShowGroupInfo((p)=>!p)}
                  title={showGroupInfo?"Hide info":"Show info"}>
                  <ChevronRight size={18} style={{transform: showGroupInfo?"rotate(180deg)":"none", transition:"0.2s"}}/>
                </button>
              )}
            </div>

            <div className="chat-body">
              {/* Messages */}
              <div className="chat-messages" style={{position:"relative"}}>
                {loadingMsgs ? (
                  <div style={{textAlign:"center",color:"#94a3b8",fontSize:13,marginTop:24}}>Loading messages...</div>
                ) : messages.length===0 ? (
                  <div style={{textAlign:"center",color:"#94a3b8",fontSize:13,marginTop:32}}>No messages yet. Say hello 👋</div>
                ) : (
                  groupByDate(messages).map((item) =>
                    item.type==="sep" ? (
                      <div className="chat-date-separator" key={item.key}>
                        <span>{formatDateLabel(item.date)}</span>
                      </div>
                    ) : renderMessage(item.msg)
                  )
                )}
                {typingLabel && (
                  <div className="chat-typing-indicator">
                    <div className="typing-dots"><span/><span/><span/></div>
                    {typingLabel}
                  </div>
                )}
                <div ref={messagesEndRef}/>

                {/* Context menu */}
                {contextMenu && (
                  <MsgContextMenu
                    x={contextMenu.x} y={contextMenu.y}
                    msg={contextMenu.msg} isOwn={contextMenu.isOwn}
                    onEdit={(m) => { setEditingMsg(m); setEditText(m.text); }}
                    onDelete={handleDeleteMessage}
                    onForward={(m) => setForwardMsg(m)}
                    onClose={() => setContextMenu(null)}
                  />
                )}
              </div>

              {/* Input */}
              <div className="chat-input-area">
                {pendingFile && (
                  <div className="chat-file-preview-bar">
                    <span style={{fontSize:16}}>{fileIcon(pendingFile.type,pendingFile.name)}</span>
                    <span className="chat-file-preview-name">{pendingFile.name}</span>
                    <span style={{fontSize:12,color:"#6366f1",marginRight:4}}>{fmtSize(pendingFile.size)}</span>
                    <button className="chat-file-preview-remove" onClick={()=>setPendingFile(null)}>
                      <X size={14}/>
                    </button>
                  </div>
                )}
                <div className="chat-input-row">
                  <button className="chat-input-btn" onClick={()=>fileInputRef.current?.click()} title="Attach file">
                    <Paperclip size={17}/>
                  </button>
                  <input ref={fileInputRef} type="file" style={{display:"none"}}
                    accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv"
                    onChange={handleFileSelect}/>
                  <textarea className="chat-input-box"
                    placeholder={`Message ${getRoomName(activeRoom,user?._id)}...`}
                    value={inputText} onChange={handleInputChange} onKeyDown={handleKeyDown}
                    rows={1} style={{height:"auto",minHeight:"40px"}}
                    onInput={(e)=>{e.target.style.height="auto";e.target.style.height=Math.min(e.target.scrollHeight,120)+"px";}}/>
                  <button className="chat-input-btn send" onClick={handleSend}
                    disabled={(!inputText.trim()&&!pendingFile)||sending}>
                    <Send size={16}/>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── GROUP INFO PANEL ── */}
        {showGroupInfo && activeRoom && isGroup && (
          <GroupInfoPanel
            room={activeRoom}
            members={activeRoom.members||[]}
            myId={user?._id}
            isAdmin={isAdmin}
            allMembers={members}
            onClose={() => setShowGroupInfo(false)}
            onAddMember={handleAddMember}
            onRemoveMember={handleRemoveMember}
          />
        )}
      </div>

      {/* ── MODALS ── */}
      {showDmModal && (
        <MemberSelectModal title={isAdmin?"Message a Company Owner":"New Direct Message"}
          members={members} onClose={()=>setShowDmModal(false)}
          onConfirm={handleStartDM} multiSelect={false} loading={modalLoading}/>
      )}
      {showGroupModal && (
        <MemberSelectModal title="Create New Group"
          members={members} onClose={()=>setShowGroupModal(false)}
          onConfirm={handleCreateGroup} multiSelect={true} loading={modalLoading}/>
      )}
      {forwardMsg && (
        <ForwardModal rooms={rooms} myId={user?._id}
          onClose={()=>setForwardMsg(null)} onForward={handleForward} loading={fwdLoading}/>
      )}
    </div>
  );
}
