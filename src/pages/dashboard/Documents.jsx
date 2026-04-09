import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import { Pencil, Trash2, Eye, Download, FileText } from "lucide-react";
import { api } from "../../api";
import { useCompany } from "../../hooks/useCompany"; // ✅ ADD THIS
import { useAuth } from "../../context/AuthContext";
import { useProject } from "../../context/ProjectContext";
import socketService from "../../services/socketService";
import CommonTable from "../../components/CommonTable";
import TableSkeleton from "../../components/TableSkeleton";
import ToastMessage from "../../components/ToastMessage";
import FormModal from "../../components/FormModal";
import PageHeader from "../../components/PageHeader";
import FilterBar from "../../components/FilterBar";
import useToast from "../../hooks/useToast";
import { CKEditor } from "@ckeditor/ckeditor5-react";
import ClassicEditor from "@ckeditor/ckeditor5-build-classic";
import Select from "react-select";
import html2pdf from "html2pdf.js";
import "../../styles/createform.css";
import "../../styles/WordEditor.css";

const BASE_URL =
  import.meta.env.VITE_API_URL?.replace("/api", "") || "http://localhost:4000";

export default function Documents() {
  const { user, loading: authLoading } = useAuth();
  const { selectedProject } = useProject();
  const { getCompanyId, isAdmin, isGlobal } = useCompany(); // ✅ ADD THIS

  const editorInstanceRef = useRef(null);

  const [documents, setDocuments] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [file, setFile] = useState({ title: "", file: null });
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // ── Pagination States ───────────────────────────────────
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(() => {
    const saved = localStorage.getItem("table_entries");
    return saved ? Number(saved) : 10;
  });

  const totalPages = useMemo(() => {
    return Math.ceil(documents.length / limit) || 1;
  }, [documents, limit]);

  const paginatedDocs = useMemo(() => {
    const startIndex = (currentPage - 1) * limit;
    return documents.slice(startIndex, startIndex + limit);
  }, [documents, currentPage, limit]);

  const [search, setSearch] = useState("");
  const [fileTypeFilter, setFileTypeFilter] = useState("");

  const { toast, showToast, clearToast } = useToast();
  const [requestDoc, setRequestDoc] = useState(null);
  const [requests, setRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(false);

  // Editor States
  const [showEditor, setShowEditor] = useState(false);
  const [editorDocId, setEditorDocId] = useState(null);
  const [editorTitle, setEditorTitle] = useState("");
  const [editorDesc, setEditorDesc] = useState("");
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const [lastSaved, setLastSaved] = useState(null);
  const [activeTab, setActiveTab] = useState("Insert");

  // ✅ Page size selector
  const PAGE_SIZES = {
    A4: {
      label: "A4",
      width: "210mm",
      height: "297mm",
      jsPDF: "a4",
      orientation: "portrait",
    },
    A3: {
      label: "A3",
      width: "297mm",
      height: "420mm",
      jsPDF: "a3",
      orientation: "portrait",
    },
    A5: {
      label: "A5",
      width: "148mm",
      height: "210mm",
      jsPDF: "a5",
      orientation: "portrait",
    },
    Letter: {
      label: "Letter (US)",
      width: "216mm",
      height: "279mm",
      jsPDF: "letter",
      orientation: "portrait",
    },
    Legal: {
      label: "Legal",
      width: "216mm",
      height: "356mm",
      jsPDF: "legal",
      orientation: "portrait",
    },
    A4L: {
      label: "A4 Landscape",
      width: "297mm",
      height: "210mm",
      jsPDF: "a4",
      orientation: "landscape",
    },
  };
  const [pageSize, setPageSize] = useState("A4");
  const pageSizeRef = useRef("A4");

  // ✅ Keep pageSizeRef in sync
  // (placed outside useEffect intentionally — runs on every render, always fresh)

  // ✅ Doc type selector (docs or txt)
  const [showDocTypeModal, setShowDocTypeModal] = useState(false);
  const [docType, setDocType] = useState("docs"); // "docs" or "txt"

  // ✅ TXT editor state
  const [showTxtEditor, setShowTxtEditor] = useState(false);
  const [txtContent, setTxtContent] = useState("");
  const [txtTitle, setTxtTitle] = useState("");
  const [txtDocId, setTxtDocId] = useState(null);
  const [isTxtSaving, setIsTxtSaving] = useState(false);

  // ✅ Multi-page support
  const [pages, setPages] = useState([""]); // array of page HTML content
  const [activePageIndex, setActivePageIndex] = useState(0);
  const pageEditorRefs = useRef([]); // array of CKEditor instances per page
  const [editorKey, setEditorKey] = useState(0); // increment to force CKEditor remount

  const fetchDocumentsRef = useRef(null);
  const addNewPageRef = useRef(null);
  const companyId = getCompanyId();

  // ✅ MOVE THE FUNCTION DEFINITION HERE
  const addNewPage = (initialContent = "") => {
    const currentEditor = pageEditorRefs.current[activePageIndex];
    const currentContent = currentEditor
      ? currentEditor.getData()
      : (pages[activePageIndex] ?? "");

    setPages((prev) => {
      const updated = [...prev];
      updated[activePageIndex] = currentContent;
      const newIdx = updated.length;
      const newPages = [...updated, initialContent];
      setTimeout(() => {
        setActivePageIndex(newIdx);
        const tryFocus = (attempts = 0) => {
          const newEditor = pageEditorRefs.current[newIdx];
          if (newEditor) {
            newEditor.editing.view.focus();
            const model = newEditor.model;
            model.change((writer) => {
              writer.setSelection(model.document.getRoot(), "in");
            });
            const pageEls = document.querySelectorAll(".word-a4-page");
            if (pageEls[newIdx]) {
              pageEls[newIdx].scrollIntoView({
                behavior: "smooth",
                block: "start",
              });
            }
          } else if (attempts < 20) {
            setTimeout(() => tryFocus(attempts + 1), 80);
          }
        };
        tryFocus();
      }, 50);
      return newPages;
    });
  };

  // ✅ NOW IT IS SAFE TO ASSIGN
  addNewPageRef.current = addNewPage;

  const getId = (val) => {
    if (!val) return "";
    if (typeof val === "string") return val;
    if (typeof val === "object") {
      if (val._id) return String(val._id);
      if (val.id) return String(val.id);
    }
    return String(val);
  };

  const editorConfig = {
    toolbar: {
      items: [
        "undo",
        "redo",
        "|",
        "heading",
        "|",
        "bold",
        "italic",
        "underline",
        "link",
        "|",
        "bulletedList",
        "numberedList",
        "|",
        "insertTable",
        "blockQuote",
        "horizontalLine",
      ],
    },
    table: { contentToolbar: ["tableColumn", "tableRow", "mergeTableCells"] },
  };

  const handleRibbonAction = (action) => {
    const editor =
      pageEditorRefs.current[activePageIndex] || editorInstanceRef.current;
    if (!editor) return;
    if (action === "table") {
      editor.execute("insertTable", { rows: 3, columns: 3 });
    } else if (action === "link") {
      editor.execute("link");
    } else if (action === "pdf") {
      handleDownloadPDF({ title: editorTitle });
    }
  };

  // ✅ Add new page — flush active editor content first so no data is lost

  // ✅ Remove a page by index (cannot remove if only 1 page)
  const removePage = (index) => {
    if (pages.length === 1) return;
    setPages((prev) => prev.filter((_, i) => i !== index));
    pageEditorRefs.current.splice(index, 1);
    setActivePageIndex((prev) => Math.max(0, prev >= index ? prev - 1 : prev));
  };

  // ✅ 1mm → px at 96dpi
  const mmToPx = (mm) => parseFloat(mm) * 3.7795275591;

  // ✅ Focus new page editor with retry loop
  const focusPage = (newIdx) => {
    const tryFocus = (attempts = 0) => {
      const newEditor = pageEditorRefs.current[newIdx];
      if (newEditor) {
        newEditor.editing.view.focus();
        const model = newEditor.model;
        model.change((writer) => {
          const root = model.document.getRoot();
          const lastChild = root.getChild(root.childCount - 1);
          if (lastChild) {
            writer.setSelection(lastChild, "end");
          } else {
            writer.setSelection(root, 0);
          }
        });

        // Ensure the new page container is scrolled into view properly
        const pageEls = document.querySelectorAll(".word-a4-page");
        if (pageEls[newIdx]) {
          pageEls[newIdx].scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        }
      } else if (attempts < 40) {
        // Increased retries for stability
        setTimeout(() => tryFocus(attempts + 1), 50);
      }
    };
    tryFocus();
  };

  // ✅ Guard: prevent multiple simultaneous breaks
  const isBreakingRef = useRef(false);

  // ✅ Get max content height in px for the selected page size
  const getMaxContentHeightPx = () => {
    const sizeObj = PAGE_SIZES[pageSizeRef.current] || PAGE_SIZES.A4;
    // Convert mm to pixels accurately
    const pageH = mmToPx(parseFloat(sizeObj.height));

    // Adjusted values based on standard Word-like UI:
    const toolbarHeight = 41; // CKEditor 5 default toolbar height
    const pageLabelHeight = 35; // The "PAGE 1" / "Remove" header height
    const verticalPadding = 96; // 1 inch (2.54cm) total top/bottom padding

    // We subtract an extra 10-15px "Safety Buffer" to trigger
    // the break BEFORE the text touches the physical edge.
    return pageH - toolbarHeight - pageLabelHeight - verticalPadding - 15;
  };

  // ✅ Measure REAL content height using a detached clone
  //    (avoids the scrollHeight=clientHeight problem with overflow:hidden)
  const measureContentHeight = (editable) => {
    const clone = editable.cloneNode(true);
    clone.style.cssText = [
      "position:fixed",
      "visibility:hidden",
      "overflow:visible", // key: let it grow naturally
      "height:auto",
      "min-height:unset",
      "max-height:unset",
      "width:" + editable.offsetWidth + "px",
      "top:-9999px",
      "left:-9999px",
    ].join(";");
    document.body.appendChild(clone);
    const h = clone.scrollHeight;
    document.body.removeChild(clone);
    return h;
  };

  // ✅ Auto page break — split last block onto new page when content overflows
  const checkOverflowAndBreak = (index, editor) => {
    if (isBreakingRef.current) return;

    const editable = editor.editing.view.getDomRoot();
    if (!editable) return;

    const contentH = measureContentHeight(editable);
    const maxH = getMaxContentHeightPx();

    // Trigger break when height exceeds max minus a small buffer
    if (contentH <= maxH) return;

    const model = editor.model;
    const root = model.document.getRoot();
    const children = Array.from(root.getChildren());

    if (children.length < 2) return;

    isBreakingRef.current = true;

    // Move the last block
    const lastChild = children[children.length - 1];
    const lastChildHtml = editor.data.stringify(lastChild);

    model.change((writer) => {
      writer.remove(lastChild);
    });

    const trimmedHtml = editor.getData();

    setPages((prev) => {
      const updated = [...prev];
      updated[index] = trimmedHtml;

      // Check if a next page already exists (typing in middle of doc)
      // or if we need to create a new one.
      if (updated[index + 1] !== undefined) {
        // Prepend content to existing next page
        updated[index + 1] = lastChildHtml + updated[index + 1];
        setActivePageIndex(index + 1);
      } else {
        // Append brand new page
        updated.push(lastChildHtml);
        setActivePageIndex(updated.length - 1);
      }

      setTimeout(() => {
        focusPage(index + 1);
        setTimeout(() => {
          isBreakingRef.current = false;
        }, 200);
      }, 100);

      return updated;
    });
  };

  // ✅ Called by CKEditor onChange — update page content then check overflow
  const updatePageContent = (index, data, editor) => {
    // If we are currently in the middle of a break, ignore updates to prevent loops
    if (isBreakingRef.current) return;

    setPages((prev) => {
      const updated = [...prev];
      updated[index] = data;
      return updated;
    });

    if (editor) {
      // Use double RequestAnimationFrame to ensure measurement happens after layout
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          checkOverflowAndBreak(index, editor);
        });
      });
    }
  };

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Delete ${title}?`)) return;
    try {
      await api(`/documents/${id}`, { method: "DELETE" });
      showToast("Document deleted", "delete");
      fetchDocuments(search, fileTypeFilter);
    } catch {
      showToast("Error deleting document", "error");
    }
  };

  const handleRequestAccess = async (id) => {
    try {
      await api(`/documents/${id}/request`, { method: "POST" });
      showToast("✓ Access request sent", "success");
    } catch {
      showToast("Error sending request", "error");
    }
  };

  const fetchRequests = async (id) => {
    setLoadingRequests(true);
    try {
      const data = await api(`/documents/${id}/requests`);
      setRequests(data || []);
    } catch {
      setRequests([]);
    } finally {
      setLoadingRequests(false);
    }
  };

  const handleDownloadPDF = async (doc) => {
    const sizeKey = pageSizeRef.current || pageSize || "A4";
    const size = PAGE_SIZES[sizeKey] || PAGE_SIZES.A4;

    // ✅ Collect all page content
    let allPages = [...pages];
    if (doc._id && !editorDocId) {
      try {
        const fetched = await api(`/documents/${doc._id}/pages`);
        if (fetched && fetched.length > 0) {
          allPages = [...fetched]
            .sort((a, b) => a.pageNumber - b.pageNumber)
            .map((p) => p.content || "");
        }
      } catch {
        /* use live pages */
      }
    }

    const title = doc.title || editorTitle || "Untitled";

    // ✅ Build each page as a properly-sized @page section
    //    Use browser native print → PDF (100% reliable, no html2canvas issues)
    const pagesBodyHtml = allPages
      .map(
        (pageContent, i) => `
      <div class="pdf-page">
        <div class="pdf-header">
          <span class="pdf-title-text">${title}</span>
          <span class="pdf-page-num">Page ${i + 1}${allPages.length > 1 ? " / " + allPages.length : ""}</span>
        </div>
        ${i === 0 ? `<h1 class="pdf-doc-title">${title}</h1>` : ""}
        <div class="pdf-content">${pageContent}</div>
      </div>
    `,
      )
      .join("");

    const paperW = size.width; // e.g. "210mm"
    const paperH = size.height; // e.g. "297mm"
    const orient = size.orientation; // "portrait" | "landscape"

    const printHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>${title}</title>
  <style>
    @page {
      size: ${paperW} ${paperH};
      margin: 0;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: Arial, Helvetica, sans-serif;
      font-size: 12pt;
      color: #1e293b;
      background: #fff;
    }
    .pdf-page {
      width: ${paperW};
      height: ${paperH};
      padding: 1.5cm 2cm;
      page-break-after: always;
      break-after: page;
      overflow: hidden;
      background: #fff;
    }
    .pdf-page:last-child {
      page-break-after: avoid;
      break-after: avoid;
    }
    .pdf-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 8pt;
      color: #94a3b8;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 5px;
      margin-bottom: 14px;
    }
    .pdf-doc-title {
      font-size: 18pt;
      color: #2b579a;
      border-bottom: 2px solid #2b579a;
      padding-bottom: 8px;
      margin-bottom: 16px;
      font-weight: 700;
    }
    .pdf-content {
      font-size: 11pt;
      line-height: 1.7;
      color: #1e293b;
    }
    .pdf-content p { margin-bottom: 8pt; }
    .pdf-content h1 { font-size: 16pt; margin-bottom: 10pt; }
    .pdf-content h2 { font-size: 14pt; margin-bottom: 8pt; }
    .pdf-content h3 { font-size: 12pt; margin-bottom: 6pt; }
    .pdf-content ul, .pdf-content ol { padding-left: 20pt; margin-bottom: 8pt; }
    .pdf-content table { border-collapse: collapse; width: 100%; margin-bottom: 8pt; }
    .pdf-content td, .pdf-content th {
      border: 1px solid #e2e8f0; padding: 5pt 8pt; font-size: 10pt;
    }
    .pdf-content blockquote {
      border-left: 3px solid #2563eb; padding-left: 10pt;
      color: #64748b; margin: 8pt 0;
    }
    @media print {
      html, body { width: ${paperW}; height: ${paperH}; }
    }
  </style>
</head>
<body>${pagesBodyHtml}</body>
</html>`;

    // ✅ Open hidden iframe, write HTML, trigger print dialog
    const iframe = document.createElement("iframe");
    iframe.style.cssText =
      "position:fixed;right:0;bottom:0;width:0;height:0;border:none;";
    document.body.appendChild(iframe);

    const iframeDoc = iframe.contentWindow.document;
    iframeDoc.open();
    iframeDoc.write(printHtml);
    iframeDoc.close();

    showToast("⏳ Opening PDF export...", "success");

    // Wait for iframe content to fully load then print
    iframe.onload = () => {
      setTimeout(() => {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
        // Remove iframe after print dialog closes
        setTimeout(() => document.body.removeChild(iframe), 2000);
      }, 500);
    };

    // Fallback if onload already fired
    setTimeout(() => {
      if (iframe.contentWindow?.document?.readyState === "complete") {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
        setTimeout(() => {
          if (document.body.contains(iframe)) document.body.removeChild(iframe);
        }, 2000);
      }
    }, 800);
  };

  useEffect(() => {
    if (selectedProject?._id) {
      socketService.joinProject(selectedProject._id);
      return () => socketService.leaveProject(selectedProject._id);
    }
  }, [selectedProject]);

  useEffect(() => {
    const unsubReq = socketService.listen(
      "documentAccessRequested",
      (payload) => {
        showToast(
          `🔔 ${payload?.requesterName} requested access to "${payload?.documentTitle}"`,
          "warning",
        );
        fetchDocumentsRef.current?.();
      },
    );
    const unsubUpload = socketService.listen("documentUploaded", (payload) => {
      showToast(`📄 New document: "${payload?.document?.title}"`, "success");
      fetchDocumentsRef.current?.();
    });
    const unsubPermissions = socketService.listen(
      "documentPermissionsUpdated",
      () => {
        fetchDocumentsRef.current?.();
      },
    );
    return () => {
      unsubReq?.();
      unsubUpload?.();
      unsubPermissions?.();
    };
  }, [showToast]);

  useEffect(() => {
    fetchDocumentsRef.current = () => fetchDocuments(search, fileTypeFilter);
  }, [selectedProject?._id, search, fileTypeFilter]);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      // ✅ FIX: Fetch when either selectedProject exists OR isGlobal is true
      if (selectedProject?._id || isGlobal)
        fetchDocuments(search, fileTypeFilter);
    }, 500);
    return () => clearTimeout(delayDebounce);
  }, [search, fileTypeFilter, selectedProject?._id, isGlobal]);

  useEffect(() => {
    // ✅ FIX: Only fetch team members if not in Global mode (Global has no project)
    if (selectedProject?._id) fetchTeamMembers();
  }, [selectedProject, isGlobal]);

  // ✅ ADD COMPANY FILTER TO FETCH DOCUMENTS
  const fetchDocuments = async (searchText = "", type = "") => {
    if (!isGlobal && !selectedProject?._id) return;
    if (!companyId && !isGlobal) {
      console.warn("No company ID available");
      return;
    }

    setLoading(true);
    try {
      let url;
      if (isGlobal) {
        url = `/documents?company=${companyId}`;
      } else {
        url = `/documents?project=${selectedProject._id}&company=${companyId}`;
      }
      if (searchText) url += `&search=${searchText}`;
      if (type) url += `&fileType=${type}`;
      const data = await api(url);
      setDocuments(data || []);
      setCurrentPage(1);
    } catch {
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeamMembers = async () => {
    try {
      const data = await api(`/projects/${selectedProject._id}/team`);
      setTeamMembers(data || []);
    } catch {
      setTeamMembers([]);
    }
  };

  // ✅ ADD COMPANY TO UPLOAD
  const handleUpload = async (e) => {
    e.preventDefault();

    if (!companyId) {
      showToast(
        isAdmin
          ? "Please select a company from the header first"
          : "Error: No company assigned to your account",
        "error",
      );
      return;
    }

    if (!file.file || !file.title)
      return showToast("Title and file are required", "error");

    if (!isGlobal && !selectedProject?._id) {
      return showToast("Please select a project first", "error");
    }

    try {
      setSaving(true);
      const formData = new FormData();
      formData.append("title", file.title);
      if (selectedProject?._id) formData.append("project", selectedProject._id);
      formData.append("company", companyId); // ✅ ADD COMPANY
      formData.append(
        "allowedUsers",
        JSON.stringify(selectedUsers.map((u) => u.value)),
      );
      formData.append("documentFile", file.file);

      await api("/documents", {
        method: "POST",
        body: formData,
        isFormData: true,
      });

      showToast("✓ Document uploaded successfully", "success");
      setShowForm(false);
      setFile({ title: "", file: null });
      setSelectedUsers([]);
      fetchDocuments(search, fileTypeFilter);
    } catch (err) {
      console.error("Upload error:", err);
      showToast(err.message || "Upload failed", "error");
    } finally {
      setSaving(false);
    }
  };

  // ✅ ADD COMPANY TO AUTO SAVE
  const autoSaveDocument = useCallback(
    async (isManual = false) => {
      if (!editorTitle.trim() || !selectedProject?._id || !companyId) {
        if (!companyId) {
          showToast(
            isAdmin
              ? "Please select a company from the header first"
              : "Error: No company assigned",
            "error",
          );
        }
        return;
      }

      setIsAutoSaving(true);
      try {
        // ✅ Build structured pages array for DB
        const pagesPayload = pages.map((html, i) => ({
          pageNumber: i + 1,
          content: html,
        }));

        const payload = {
          title: editorTitle,
          description: editorDesc,
          pages: pagesPayload, // ✅ page-wise storage
          pageSize: pageSizeRef.current || pageSize, // ✅ save selected size
          project: selectedProject._id,
          company: companyId, // ✅ ADD COMPANY
          allowedUsers: selectedUsers.map((u) => u.value),
        };

        const endpoint = editorDocId
          ? `/documents/${editorDocId}`
          : "/documents/create-internal";

        const res = await api(endpoint, {
          method: editorDocId ? "PUT" : "POST",
          body: payload,
        });

        if (!editorDocId && res._id) setEditorDocId(res._id);
        setLastSaved(new Date().toLocaleTimeString());

        if (isManual) showToast("✓ Document saved", "success");

        fetchDocuments(search, fileTypeFilter);
      } catch (err) {
        console.error("Save failed", err);
        if (isManual) showToast(err.message || "Save failed", "error");
      } finally {
        setIsAutoSaving(false);
      }
    },
    [
      editorTitle,
      editorDesc,
      editorDocId,
      pages, // ✅ CRITICAL: pages must be in deps so closure is always fresh
      selectedProject,
      selectedUsers,
      search,
      fileTypeFilter,
      companyId,
      showToast,
    ],
  );

  useEffect(() => {
    if (!showEditor || !autoSaveEnabled) return;
    const timer = setTimeout(() => autoSaveDocument(), 2000);
    return () => clearTimeout(timer);
  }, [pages, editorTitle, autoSaveDocument, showEditor, autoSaveEnabled]);

  // ── TXT EDITOR FUNCTIONS ────────────────────────────────────────────────

  const openDocTypeModal = () => setShowDocTypeModal(true);

  const handleDocTypeSelect = (type) => {
    setDocType(type);
    setShowDocTypeModal(false);
    if (type === "txt") {
      setTxtTitle("");
      setTxtContent("");
      setTxtDocId(null);
      setShowTxtEditor(true);
    } else {
      setShowEditor(true);
    }
  };

  const openTxtInEditor = (doc) => {
    setDocType("txt");
    setTxtDocId(doc._id);
    setTxtTitle(doc.title);
    setTxtContent(doc.content || "");
    setShowTxtEditor(true);
  };

  const handleCloseTxtEditor = async () => {
    if (txtTitle.trim()) await saveTxtDocument(false);
    setShowTxtEditor(false);
    setTxtTitle("");
    setTxtContent("");
    setTxtDocId(null);
  };

  const saveTxtDocument = async (isManual = true) => {
    if (!txtTitle.trim() || !selectedProject?._id || !companyId) return;
    setIsTxtSaving(true);
    try {
      const payload = {
        title: txtTitle,
        content: txtContent,
        pages: [{ pageNumber: 1, content: txtContent }], // ✅ single page for txt
        description: "",
        project: selectedProject._id,
        company: companyId,
        allowedUsers: selectedUsers.map((u) => u.value),
        fileType: "txt",
        isEditorGenerated: true,
      };
      const endpoint = txtDocId
        ? `/documents/${txtDocId}`
        : "/documents/create-internal";
      const res = await api(endpoint, {
        method: txtDocId ? "PUT" : "POST",
        body: payload,
      });
      if (!txtDocId && res._id) setTxtDocId(res._id);
      if (isManual) showToast("✓ Text document saved", "success");
      fetchDocuments(search, fileTypeFilter);
    } catch (err) {
      if (isManual) showToast(err.message || "Save failed", "error");
    } finally {
      setIsTxtSaving(false);
    }
  };

  const downloadTxtFile = () => {
    const blob = new Blob([txtContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${txtTitle || "document"}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("✓ Downloaded as .txt", "success");
  };

  const handleCloseEditor = async () => {
    if (editorTitle.trim() && autoSaveEnabled) await autoSaveDocument();
    setShowEditor(false);
    setEditorDocId(null);
    setEditorTitle("");
    setEditorDesc("");
    setSelectedUsers([]);
    setPages([""]); // ✅ reset pages
    setActivePageIndex(0);
    pageEditorRefs.current = [];
    setEditorKey((k) => k + 1); // reset key for next open
  };

  const openInEditor = async (doc) => {
    // ✅ Route to correct editor based on fileType
    if (doc.fileType === "txt") {
      openTxtInEditor(doc);
      return;
    }
    setEditorDocId(doc._id);
    setEditorTitle(doc.title);
    setEditorDesc(doc.description || "");
    setActivePageIndex(0);
    pageEditorRefs.current = [];

    // ✅ Restore saved page size
    if (doc.pageSize && PAGE_SIZES[doc.pageSize]) {
      setPageSize(doc.pageSize);
      pageSizeRef.current = doc.pageSize;
    }

    setSelectedUsers(
      (doc.allowedUsers || []).map((u) => ({
        value: getId(u._id || u),
        label: u.username || u.name || "Member",
      })),
    );

    // ✅ Fetch pages FIRST, then open editor so CKEditor mounts with correct data
    try {
      const fetchedPages = await api(`/documents/${doc._id}/pages`);
      if (fetchedPages && fetchedPages.length > 0) {
        const sorted = [...fetchedPages]
          .sort((a, b) => a.pageNumber - b.pageNumber)
          .map((p) => p.content || "");
        setPages(sorted);
      } else {
        setPages([""]);
      }
    } catch {
      setPages([""]);
    }

    // ✅ Increment key to force full CKEditor remount with fresh data
    setEditorKey((k) => k + 1);
    // ✅ Open editor AFTER pages are set — prevents blank editor
    setShowEditor(true);
  };

  const columns = [
    {
      header: "Title",
      accessor: "title",
      render: (row) => (
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span>
            {row.fileType === "txt"
              ? "📄"
              : row.isEditorGenerated
                ? "📝"
                : "📎"}
          </span>
          <span style={{ fontWeight: "500", color: "#1e293b" }}>
            {row.title}
          </span>
          {row.fileType === "txt" && (
            <span
              style={{
                fontSize: "10px",
                background: "#d1fae5",
                color: "#065f46",
                padding: "1px 6px",
                borderRadius: "4px",
                fontWeight: 600,
              }}
            >
              TXT
            </span>
          )}
          {row.isEditorGenerated && row.fileType !== "txt" && (
            <span
              style={{
                fontSize: "10px",
                background: "#dbeafe",
                color: "#1e40af",
                padding: "1px 6px",
                borderRadius: "4px",
                fontWeight: 600,
              }}
            >
              DOCS
            </span>
          )}
        </div>
      ),
    },
    {
      header: "Owner",
      render: (row) => {
        const owner = row.uploadedBy;
        return owner?.username || owner?.name || owner?.email || "Unknown";
      },
    },
    {
      header: "Assigned To",
      render: (row) => {
        const guests = (row.allowedUsers || []).filter(
          (u) => getId(u) !== getId(row.uploadedBy),
        );
        if (guests.length === 0)
          return (
            <span style={{ color: "#94a3b8", fontSize: "12px" }}>
              Only Owner
            </span>
          );
        return (
          <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
            {guests.slice(0, 2).map((u, i) => (
              <span
                key={i}
                style={{
                  background: "#f1f5f9",
                  padding: "2px 8px",
                  borderRadius: "12px",
                  fontSize: "11px",
                }}
              >
                {u.username || u.name || "Member"}
              </span>
            ))}
            {guests.length > 2 && (
              <span style={{ fontSize: "11px", color: "#64748b" }}>
                +{guests.length - 2} more
              </span>
            )}
          </div>
        );
      },
    },
  ];

  if (authLoading) return <TableSkeleton columns={4} rows={5} />;

  return (
    <div className="permission-page">
      <PageHeader
        title="Project Documents"
        actions={
          (selectedProject || isGlobal) &&
          !isGlobal &&
          selectedProject && (
            <div style={{ display: "flex", gap: "10px" }}>
              <button className="btn-secondary" onClick={openDocTypeModal}>
                + Create Doc
              </button>
              <button className="btn-primary" onClick={() => setShowForm(true)}>
                + Upload Doc
              </button>
            </div>
          )
        }
      />
      {toast && <ToastMessage key={toast.id} {...toast} onClose={clearToast} />}
      <FilterBar
        searchValue={search}
        onSearchChange={(val) => setSearch(val)}
      />

      {loading || !user?._id ? (
        <TableSkeleton columns={4} rows={limit} />
      ) : (
        <CommonTable
          columns={columns}
          data={paginatedDocs}
          totalRecords={documents.length}
          totalPages={totalPages}
          currentPage={currentPage}
          limit={limit}
          onPageChange={(p) => setCurrentPage(p)}
          onLimitChange={(l) => {
            localStorage.setItem("table_entries", l);
            setLimit(l);
            setCurrentPage(1);
          }}
          actions={(row) => {
            const currentUserId = user?._id ? String(user._id) : "";
            const ownerId = String(
              typeof row.uploadedBy === "object"
                ? row.uploadedBy._id
                : row.uploadedBy,
            );
            const pendingCount = (row.accessRequests || []).filter(
              (r) => r.status === "pending",
            ).length;
            const allowedUserIds = (row.allowedUsers || []).map((u) =>
              String(typeof u === "object" ? u._id : u),
            );
            const isOwner = currentUserId === ownerId;
            const isAssigned = allowedUserIds.includes(currentUserId);

            if (isOwner) {
              return (
                <div className="table-actions">
                  {/* Edit / View */}
                  <button
                    className="iconedit"
                    title={row.isEditorGenerated ? "Edit" : "View"}
                    onClick={() =>
                      row.isEditorGenerated
                        ? openInEditor(row)
                        : window.open(
                            BASE_URL + "/uploads/" + row.fileUrl,
                            "_blank",
                          )
                    }
                  >
                    {row.isEditorGenerated ? (
                      <Pencil size={17} />
                    ) : (
                      <Eye size={17} />
                    )}
                  </button>

                  {/* Download (uploaded files only) */}
                  {!row.isEditorGenerated && (
                    <a
                      href={BASE_URL + "/uploads/" + row.fileUrl}
                      download
                      className="iconview"
                      title="Download"
                    >
                      <Download size={17} />
                    </a>
                  )}

                  {/* PDF export (editor docs only) */}
                  {row.isEditorGenerated && row.fileType !== "txt" && (
                    <button
                      className="iconview"
                      title="Export PDF"
                      onClick={() => handleDownloadPDF(row)}
                    >
                      <FileText size={17} />
                    </button>
                  )}

                  {/* Requests badge */}
                  <button
                    className="iconedit"
                    title={`Access Requests${pendingCount > 0 ? " (" + pendingCount + ")" : ""}`}
                    style={pendingCount > 0 ? { color: "#f59e0b" } : {}}
                    onClick={() => {
                      setRequestDoc(row);
                      fetchRequests(row._id);
                    }}
                  >
                    <Eye size={17} />
                    {pendingCount > 0 && (
                      <span
                        style={{
                          position: "absolute",
                          top: "-4px",
                          right: "-4px",
                          background: "#ef4444",
                          color: "#fff",
                          borderRadius: "50%",
                          fontSize: "9px",
                          width: "14px",
                          height: "14px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontWeight: 700,
                        }}
                      >
                        {pendingCount}
                      </span>
                    )}
                  </button>

                  {/* Delete */}
                  <button
                    className="icondelete"
                    title="Delete"
                    onClick={() => handleDelete(row._id, row.title)}
                  >
                    <Trash2 size={17} />
                  </button>
                </div>
              );
            }

            if (isAssigned) {
              return (
                <div className="table-actions">
                  <button
                    className="iconedit"
                    title={row.isEditorGenerated ? "Edit" : "View"}
                    onClick={() =>
                      row.isEditorGenerated
                        ? openInEditor(row)
                        : window.open(
                            BASE_URL + "/uploads/" + row.fileUrl,
                            "_blank",
                          )
                    }
                  >
                    {row.isEditorGenerated ? (
                      <Pencil size={17} />
                    ) : (
                      <Eye size={17} />
                    )}
                  </button>
                  {!row.isEditorGenerated && (
                    <a
                      href={BASE_URL + "/uploads/" + row.fileUrl}
                      download
                      className="iconview"
                      title="Download"
                    >
                      <Download size={17} />
                    </a>
                  )}
                  {row.isEditorGenerated && row.fileType !== "txt" && (
                    <button
                      className="iconview"
                      title="Export PDF"
                      onClick={() => handleDownloadPDF(row)}
                    >
                      <FileText size={17} />
                    </button>
                  )}
                </div>
              );
            }

            const request = (row.accessRequests || []).find(
              (r) =>
                String(typeof r.user === "object" ? r.user?._id : r.user) ===
                String(currentUserId),
            );
            return (
              <div className="table-actions">
                <button
                  className={
                    request?.status === "pending" ? "iconedit" : "iconview"
                  }
                  title={
                    request?.status === "pending"
                      ? "Access Requested"
                      : "Request Access"
                  }
                  disabled={request?.status === "pending"}
                  onClick={() => handleRequestAccess(row._id)}
                >
                  <Eye size={17} />
                </button>
              </div>
            );
          }}
        />
      )}

      {/* ── Doc Type Selection Modal ── */}
      {showDocTypeModal &&
        createPortal(
          <div
            className="modal-overlay"
            onClick={() => setShowDocTypeModal(false)}
          >
            <div
              className="modal-card"
              style={{ width: "420px", textAlign: "center" }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3
                style={{
                  marginBottom: "6px",
                  fontSize: "18px",
                  color: "#1e293b",
                }}
              >
                Choose Document Type
              </h3>
              <p
                style={{
                  color: "#64748b",
                  fontSize: "13px",
                  marginBottom: "24px",
                }}
              >
                Select the type of document you want to create
              </p>
              <div
                style={{
                  display: "flex",
                  gap: "16px",
                  justifyContent: "center",
                }}
              >
                <button
                  onClick={() => handleDocTypeSelect("docs")}
                  style={{
                    flex: 1,
                    padding: "20px 16px",
                    border: "2px solid #e2e8f0",
                    borderRadius: "10px",
                    background: "white",
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "#2563eb";
                    e.currentTarget.style.background = "#eff6ff";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "#e2e8f0";
                    e.currentTarget.style.background = "white";
                  }}
                >
                  <div style={{ fontSize: "32px", marginBottom: "8px" }}>
                    📝
                  </div>
                  <div
                    style={{
                      fontWeight: "700",
                      fontSize: "15px",
                      color: "#1e293b",
                      marginBottom: "4px",
                    }}
                  >
                    Docs
                  </div>
                  <div
                    style={{
                      fontSize: "12px",
                      color: "#64748b",
                      lineHeight: "1.4",
                    }}
                  >
                    Rich editor • Multiple pages
                    <br />
                    Page sizes • Export as PDF
                  </div>
                </button>
                <button
                  onClick={() => handleDocTypeSelect("txt")}
                  style={{
                    flex: 1,
                    padding: "20px 16px",
                    border: "2px solid #e2e8f0",
                    borderRadius: "10px",
                    background: "white",
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "#10b981";
                    e.currentTarget.style.background = "#f0fdf4";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "#e2e8f0";
                    e.currentTarget.style.background = "white";
                  }}
                >
                  <div style={{ fontSize: "32px", marginBottom: "8px" }}>
                    📄
                  </div>
                  <div
                    style={{
                      fontWeight: "700",
                      fontSize: "15px",
                      color: "#1e293b",
                      marginBottom: "4px",
                    }}
                  >
                    TXT
                  </div>
                  <div
                    style={{
                      fontSize: "12px",
                      color: "#64748b",
                      lineHeight: "1.4",
                    }}
                  >
                    Plain text • Single page
                    <br />
                    No formatting • Download as .txt
                  </div>
                </button>
              </div>
              <button
                onClick={() => setShowDocTypeModal(false)}
                style={{
                  marginTop: "20px",
                  background: "none",
                  border: "none",
                  color: "#94a3b8",
                  cursor: "pointer",
                  fontSize: "13px",
                }}
              >
                Cancel
              </button>
            </div>
          </div>,
          document.body,
        )}

      {/* ── TXT Editor Modal ── */}
      {showTxtEditor &&
        createPortal(
          <div className="modal-overlay" onClick={handleCloseTxtEditor}>
            <div
              className="modal-card"
              style={{
                width: "96vw",
                maxWidth: "96vw",
                height: "96vh",
                padding: 0,
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* TXT Top Bar */}
              <div
                style={{
                  background: "#10b981",
                  color: "white",
                  padding: "8px 16px",
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  flexShrink: 0,
                }}
              >
                <div
                  style={{
                    background: "white",
                    color: "#10b981",
                    fontWeight: 800,
                    fontSize: "13px",
                    width: "28px",
                    height: "28px",
                    borderRadius: "4px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  T
                </div>
                <span
                  style={{
                    fontSize: "11px",
                    opacity: 0.85,
                    fontWeight: 600,
                    letterSpacing: "1px",
                  }}
                >
                  DOCUMENT NAME:
                </span>
                <input
                  value={txtTitle}
                  placeholder="Type document title here..."
                  onChange={(e) => setTxtTitle(e.target.value)}
                  style={{
                    flex: 1,
                    background: "rgba(255,255,255,0.2)",
                    border: "1px solid rgba(255,255,255,0.4)",
                    borderRadius: "4px",
                    padding: "4px 10px",
                    color: "white",
                    fontSize: "14px",
                    outline: "none",
                  }}
                />
                <div
                  style={{ display: "flex", alignItems: "center", gap: "12px" }}
                >
                  <button
                    onClick={() => saveTxtDocument(true)}
                    disabled={isTxtSaving}
                    style={{
                      background: "rgba(255,255,255,0.2)",
                      border: "1px solid rgba(255,255,255,0.5)",
                      color: "white",
                      borderRadius: "5px",
                      padding: "5px 14px",
                      cursor: "pointer",
                      fontSize: "12px",
                      fontWeight: 600,
                    }}
                  >
                    {isTxtSaving ? "Saving..." : "💾 Save"}
                  </button>
                  <button
                    onClick={downloadTxtFile}
                    style={{
                      background: "rgba(255,255,255,0.2)",
                      border: "1px solid rgba(255,255,255,0.5)",
                      color: "white",
                      borderRadius: "5px",
                      padding: "5px 14px",
                      cursor: "pointer",
                      fontSize: "12px",
                      fontWeight: 600,
                    }}
                  >
                    ⬇️ Download .txt
                  </button>
                  <span
                    onClick={handleCloseTxtEditor}
                    style={{
                      cursor: "pointer",
                      fontSize: "18px",
                      opacity: 0.8,
                      marginLeft: "8px",
                    }}
                  >
                    ✕
                  </span>
                </div>
              </div>
              {/* TXT info bar */}
              <div
                style={{
                  background: "#f0fdf4",
                  borderBottom: "1px solid #d1fae5",
                  padding: "6px 20px",
                  fontSize: "11px",
                  color: "#6b7280",
                  flexShrink: 0,
                  display: "flex",
                  gap: "20px",
                }}
              >
                <span>📄 Plain Text Document</span>
                <span>Single page only</span>
                <span>
                  {txtContent.length} characters •{" "}
                  {txtContent.split(/\s+/).filter(Boolean).length} words
                </span>
              </div>
              {/* TXT Textarea */}
              <textarea
                value={txtContent}
                onChange={(e) => setTxtContent(e.target.value)}
                placeholder="Start typing your plain text document here..."
                style={{
                  flex: 1,
                  resize: "none",
                  border: "none",
                  outline: "none",
                  padding: "32px 48px",
                  fontFamily: "'Courier New', Courier, monospace",
                  fontSize: "14px",
                  lineHeight: "1.8",
                  color: "#1e293b",
                  background: "#fafafa",
                  overflowY: "auto",
                }}
              />
              {/* TXT Footer */}
              <div
                style={{
                  background: "#f8fafc",
                  borderTop: "1px solid #e2e8f0",
                  padding: "6px 20px",
                  fontSize: "11px",
                  color: "#94a3b8",
                  flexShrink: 0,
                }}
              >
                TXT files download as plain text (.txt) • No PDF export
                available for this format
              </div>
            </div>
          </div>,
          document.body,
        )}

      {/* Editor Modal */}
      {showEditor &&
        createPortal(
          <div className="modal-overlay" onClick={handleCloseEditor}>
            <div
              className="modal-card word-modal-card"
              style={{ width: "96vw", height: "96vh", maxWidth: "96vw" }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="word-top-bar">
                <div className="word-app-icon">W</div>
                <div className="word-title-container">
                  <span className="word-label-hint">Document Name:</span>
                  <input
                    className="word-doc-name"
                    value={editorTitle}
                    placeholder="Type heading/title here..."
                    onChange={(e) => setEditorTitle(e.target.value)}
                  />
                </div>
                <div className="word-header-actions">
                  <div className="word-save-status">
                    <span
                      className={`status-dot ${isAutoSaving ? "pulsing" : ""}`}
                    ></span>
                    {isAutoSaving
                      ? "Saving..."
                      : lastSaved
                        ? `Last Saved: ${lastSaved}`
                        : "Draft"}
                  </div>
                  <span className="modal-close" onClick={handleCloseEditor}>
                    ✕
                  </span>
                </div>
              </div>
              <div className="word-ribbon-tabs">
                <div
                  className={`ribbon-tab ${activeTab === "File" ? "active" : ""}`}
                  onClick={() => setActiveTab("File")}
                >
                  File
                </div>
                <div
                  className={`ribbon-tab ${activeTab === "Insert" ? "active" : ""}`}
                  onClick={() => setActiveTab("Insert")}
                >
                  Insert
                </div>
                <div
                  className={`ribbon-tab ${activeTab === "Layout" ? "active" : ""}`}
                  onClick={() => setActiveTab("Layout")}
                >
                  Layout
                </div>
                <div
                  className={`ribbon-tab ${activeTab === "Review" ? "active" : ""}`}
                  onClick={() => setActiveTab("Review")}
                >
                  Review
                </div>
              </div>
              <div className="word-ribbon-content">
                {activeTab === "File" && (
                  <div className="ribbon-group">
                    <button
                      className="ribbon-btn"
                      onClick={() => handleRibbonAction("pdf")}
                    >
                      💾 Export as PDF
                    </button>
                    <button
                      className="ribbon-btn"
                      onClick={() => autoSaveDocument(true)}
                    >
                      📁 Save to Project
                    </button>
                  </div>
                )}
                {activeTab === "Insert" && (
                  <div className="ribbon-group">
                    <button
                      className="ribbon-btn"
                      onClick={() => handleRibbonAction("table")}
                    >
                      📊 Table (3x3)
                    </button>
                    <button
                      className="ribbon-btn"
                      onClick={() => handleRibbonAction("link")}
                    >
                      🔗 Add Link
                    </button>
                  </div>
                )}
                {activeTab === "Layout" && (
                  <div
                    className="ribbon-group"
                    style={{ alignItems: "center", gap: "16px" }}
                  >
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "3px",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "10px",
                          color: "#888",
                          fontWeight: 600,
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                        }}
                      >
                        Page Size
                      </span>
                      <select
                        className="page-size-select"
                        value={pageSize}
                        onChange={(e) => {
                          setPageSize(e.target.value);
                          pageSizeRef.current = e.target.value;
                        }}
                      >
                        {Object.entries(PAGE_SIZES).map(([key, val]) => (
                          <option key={key} value={key}>
                            {val.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "3px",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "10px",
                          color: "#888",
                          fontWeight: 600,
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                        }}
                      >
                        Current Size
                      </span>
                      <span
                        style={{
                          fontSize: "12px",
                          color: "#2563eb",
                          fontWeight: 600,
                        }}
                      >
                        {PAGE_SIZES[pageSize]?.width} ×{" "}
                        {PAGE_SIZES[pageSize]?.height}
                      </span>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "3px",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "10px",
                          color: "#888",
                          fontWeight: 600,
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                        }}
                      >
                        Orientation
                      </span>
                      <span
                        style={{
                          fontSize: "12px",
                          color: "#374151",
                          fontWeight: 500,
                        }}
                      >
                        {PAGE_SIZES[pageSize]?.orientation === "landscape"
                          ? "🔄 Landscape"
                          : "📄 Portrait"}
                      </span>
                    </div>
                  </div>
                )}
                {activeTab === "Review" && (
                  <div className="ribbon-group">
                    <div className="word-autosave-toggle">
                      <span>Auto-save:</span>
                      <label className="switch-mini">
                        <input
                          type="checkbox"
                          checked={autoSaveEnabled}
                          onChange={() => setAutoSaveEnabled(!autoSaveEnabled)}
                        />
                        <span className="slider-mini round"></span>
                      </label>
                    </div>
                  </div>
                )}
                <div className="ribbon-group" style={{ marginLeft: "auto" }}>
                  <Select
                    isMulti
                    placeholder="Assign Members..."
                    options={teamMembers.map((m) => ({
                      value: getId(m._id),
                      label: m.username,
                    }))}
                    value={selectedUsers}
                    onChange={setSelectedUsers}
                    className="word-member-select"
                  />
                  <div className="manual-save-slot">
                    {!autoSaveEnabled && (
                      <button
                        className="word-manual-save"
                        onClick={() => autoSaveDocument(true)}
                      >
                        Save Now
                      </button>
                    )}
                  </div>
                </div>
              </div>
              <div className="word-workspace">
                {pages.map((pageContent, pageIndex) => (
                  <div
                    key={pageIndex}
                    className={
                      "word-a4-page" +
                      (activePageIndex === pageIndex
                        ? " word-a4-page--active"
                        : "")
                    }
                    style={{
                      width: PAGE_SIZES[pageSize]?.width || "210mm",
                      height: PAGE_SIZES[pageSize]?.height || "297mm",
                    }}
                    onClick={() => setActivePageIndex(pageIndex)}
                  >
                    {/* Page header: number + remove button */}
                    <div className="word-page-header">
                      <span className="word-page-number">
                        Page {pageIndex + 1}
                      </span>
                      {pages.length > 1 && (
                        <button
                          className="word-page-remove"
                          title="Remove this page"
                          onClick={(e) => {
                            e.stopPropagation();
                            removePage(pageIndex);
                          }}
                        >
                          ✕ Remove
                        </button>
                      )}
                    </div>
                    <CKEditor
                      key={`page-${pageIndex}-${editorKey}`}
                      editor={ClassicEditor}
                      config={{
                        ...editorConfig,
                        toolbar: {
                          ...editorConfig.toolbar,
                          // hide toolbar on non-active pages
                          shouldNotGroupWhenFull: true,
                        },
                      }}
                      data={pageContent}
                      onReady={(editor) => {
                        pageEditorRefs.current[pageIndex] = editor;
                        if (pageIndex === 0) editorInstanceRef.current = editor;

                        // ✅ Listen for Shift+Enter or Cmd+Enter → add new page
                        editor.editing.view.document.on(
                          "keydown",
                          (evt, data) => {
                            const isCmdOrShift =
                              data.shiftKey || data.metaKey || data.ctrlKey;
                            const isEnter = data.keyCode === 13;
                            if (isCmdOrShift && isEnter) {
                              evt.stop();
                              data.preventDefault();
                              addNewPageRef.current(); // always fresh — no stale closure
                            }
                          },
                        );
                      }}
                      onChange={(event, editor) => {
                        updatePageContent(pageIndex, editor.getData(), editor);
                      }}
                    />
                  </div>
                ))}
                {/* Add page hint */}
                <div className="word-add-page-hint">
                  Pages auto-add when full &nbsp;•&nbsp; Manual:{" "}
                  <kbd>Shift</kbd> + <kbd>Enter</kbd> or <kbd>⌘</kbd> +{" "}
                  <kbd>Enter</kbd>
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {/* Requests Modal */}
      {requestDoc &&
        createPortal(
          <div
            className="modal-overlay"
            onClick={() => {
              setRequestDoc(null);
              setRequests([]);
            }}
          >
            <div
              className="modal-card"
              style={{ width: "600px" }}
              onClick={(e) => e.stopPropagation()}
            >
              <div
                style={{
                  display: "flex",
                  justifycontent: "space-between",
                  marginBottom: "15px",
                }}
              >
                <h3>Access Requests</h3>
                <span
                  style={{ cursor: "pointer", fontSize: "18px" }}
                  onClick={() => {
                    setRequestDoc(null);
                    setRequests([]);
                  }}
                >
                  ✕
                </span>
              </div>
              {loadingRequests ? (
                <p>Loading requests...</p>
              ) : requests.length === 0 ? (
                <p style={{ color: "#64748b" }}>No requests</p>
              ) : (
                <table className="request-table">
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Email</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {requests.map((r) => (
                      <tr key={r._id}>
                        <td>{r.user?.username || r.user?.name}</td>
                        <td>{r.user?.email}</td>
                        <td>{r.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>,
          document.body,
        )}

      {/* Upload Modal */}
      <FormModal
        open={showForm}
        onClose={() => setShowForm(false)}
        title="Upload Document"
      >
        <form onSubmit={handleUpload} style={{ padding: "20px" }}>
          <div className="form-field">
            <label>Title *</label>
            <input
              type="text"
              value={file.title}
              required
              onChange={(e) => setFile({ ...file, title: e.target.value })}
              placeholder="Enter document title"
            />
          </div>
          <div className="form-field">
            <label>Assign Members (Send Email)</label>
            <Select
              isMulti
              placeholder="Select members to share with..."
              options={teamMembers.map((m) => ({
                value: getId(m._id),
                label: m.username,
              }))}
              value={selectedUsers}
              onChange={setSelectedUsers}
            />
          </div>
          <div className="form-field">
            <label>File *</label>
            <input
              type="file"
              required
              onChange={(e) => setFile({ ...file, file: e.target.files[0] })}
            />
          </div>
          <button type="submit" className="btn-primary full" disabled={saving}>
            {saving ? "Uploading..." : "Upload & Share"}
          </button>
        </form>
      </FormModal>
    </div>
  );
}
