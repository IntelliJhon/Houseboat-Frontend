import React, { useState, useEffect } from 'react';
import {
  LifeBuoy, Search, 
  MessageSquare, Clock, CheckCircle2, AlertTriangle, XCircle,
  User, Ship, Calendar, CreditCard, Wrench, ShieldCheck,
  Send, Paperclip, Download, ArrowUpRight, X, Check,
  Star, TrendingUp, HelpCircle,
  UserCheck, Inbox, FileText, Eye, Zap,
  RefreshCcw, Copy
} from 'lucide-react';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import api from '../../../services/api';
import { getSupportSocket } from '../../../services/supportSocket';

// ─── Types ────────────────────────────────────────────────────────────────────

type TicketStatus   = 'open' | 'pending' | 'resolved' | 'closed';
type TicketPriority = 'high' | 'medium' | 'low';
type TicketCategory = 'booking' | 'payment' | 'verification' | 'technical' | 'general' | 'refund';
type TicketSource   = 'customer' | 'partner';

interface Message {
  id: string;
  author: string;
  role: 'customer' | 'partner' | 'admin' | 'system';
  content: string;
  time: string;
  isInternal?: boolean;
}

interface Ticket {
  id: string;
  source: TicketSource;
  userName: string;
  userPhone: string;
  userEmail: string;
  partnerName?: string;
  houseboat?: string;
  bookingId?: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  subject: string;
  agent: string;
  createdAt: string;
  updatedAt: string;
  csat?: number;
  messages: Message[];
  attachments?: string[];
  internalNote?: string;
}


// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<TicketStatus, { label: string; cls: string; dot: string }> = {
  open:     { label: 'Open',     cls: 'bg-blue-50 text-blue-600 border-blue-100',    dot: 'bg-blue-500' },
  pending:  { label: 'Pending',  cls: 'bg-amber-50 text-amber-600 border-amber-100', dot: 'bg-amber-500' },
  resolved: { label: 'Resolved', cls: 'bg-emerald-50 text-emerald-600 border-emerald-100', dot: 'bg-emerald-500' },
  closed:   { label: 'Closed',   cls: 'bg-slate-100 text-slate-500 border-slate-200', dot: 'bg-slate-400' },
};

const PRIORITY_CONFIG: Record<TicketPriority, { label: string; cls: string }> = {
  high:   { label: 'High',   cls: 'bg-rose-50 text-rose-600 border-rose-100' },
  medium: { label: 'Medium', cls: 'bg-amber-50 text-amber-600 border-amber-100' },
  low:    { label: 'Low',    cls: 'bg-slate-50 text-slate-500 border-slate-200' },
};

const CATEGORY_ICON: Record<TicketCategory, React.ReactNode> = {
  booking:      <Calendar className="w-3.5 h-3.5" />,
  payment:      <CreditCard className="w-3.5 h-3.5" />,
  verification: <ShieldCheck className="w-3.5 h-3.5" />,
  technical:    <Wrench className="w-3.5 h-3.5" />,
  general:      <HelpCircle className="w-3.5 h-3.5" />,
  refund:       <RefreshCcw className="w-3.5 h-3.5" />,
};

const ROLE_STYLE: Record<Message['role'], string> = {
  customer: 'bg-blue-50 border-blue-100',
  partner:  'bg-amber-50 border-amber-100',
  admin:    'bg-secondary-emerald/5 border-secondary-emerald/20',
  system:   'bg-slate-50 border-slate-100 italic',
};

const ROLE_AVATAR: Record<Message['role'], string> = {
  customer: 'bg-blue-100 text-blue-600',
  partner:  'bg-amber-100 text-amber-600',
  admin:    'bg-secondary-emerald/20 text-secondary-emerald',
  system:   'bg-slate-100 text-slate-400',
};

const QUICK_REPLIES: { label: string; body: string }[] = [
  { label: 'Booking Issue',      body: 'Thank you for contacting us regarding your booking. We have reviewed your case and are coordinating with our partner. We will update you within 2 hours.' },
  { label: 'Payment Issue',      body: 'We have identified the payment discrepancy on our end. A refund has been initiated and will reflect in your account within 3–5 business days.' },
  { label: 'Refund Issue',       body: 'Your refund request has been approved. The amount will be credited to your original payment method within 5–7 business days.' },
  { label: 'Technical Issue',    body: 'Our technical team has been notified and is investigating the issue. We expect a resolution within 24 hours. We apologise for the inconvenience.' },
  { label: 'Verification Issue', body: 'Please re-upload your documents in PDF format, under 5MB, issued within the last 12 months. Our verification team will review within 48 hours.' },
  { label: 'General Inquiry',    body: 'Thank you for reaching out to b4boat Support. We are happy to help and will get back to you with a detailed response shortly.' },
];

// ─── Main Component ───────────────────────────────────────────────────────────

export const AdminSupportSection: React.FC = () => {
  const [tickets, setTickets]         = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<TicketStatus | 'all'>('all');
  const [filterCategory, setFilterCategory] = useState<TicketCategory | 'all'>('all');
  const [filterSource, setFilterSource] = useState<TicketSource | 'all'>('all');
  const [filterPriority, setFilterPriority] = useState<TicketPriority | 'all'>('all');
  const [replyText, setReplyText]     = useState('');
  const [internalNote, setInternalNote] = useState('');
  const [activeDrawerTab, setActiveDrawerTab] = useState<'conversation' | 'details' | 'notes'>('conversation');
  const [showQuickReplies, setShowQuickReplies] = useState(false);

  const fetchTickets = async () => {
    try {
      const res = await api.get('/v1/support/tickets');
      if (res.data?.success && Array.isArray(res.data?.data)) {
        const mapped = res.data.data.map((t: any) => {
          const statusLower: TicketStatus = 
            t.status === 'OPEN' ? 'open' :
            t.status === 'IN_PROGRESS' ? 'pending' :
            t.status === 'RESOLVED' ? 'resolved' : 'closed';

          const priorityLower: TicketPriority =
            t.priority === 'HIGH' || t.priority === 'URGENT' ? 'high' :
            t.priority === 'LOW' ? 'low' : 'medium';

          const msgs: Message[] = Array.isArray(t.messages) ? t.messages.map((m: any) => ({
            id: m.id,
            author: m.senderName || (m.senderRole === 'ADMIN' ? 'b4boat Support Agent' : 'Host'),
            role: m.senderRole === 'ADMIN' ? 'admin' : (m.senderRole === 'CUSTOMER' ? 'customer' : 'partner'),
            content: m.content,
            time: new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isInternal: m.isInternal
          })) : [];

          return {
            id: t.ticketId || t.id,
            rawId: t.id,
            source: t.source === 'customer' ? 'customer' : 'partner',
            userName: t.userName || 'Host Partner',
            userPhone: t.userPhone || '+91 98765 43210',
            userEmail: t.userEmail || 'host@b4boat.com',
            partnerName: t.userName,
            houseboat: t.houseboatName || 'Kerala Backwater Cruise',
            bookingId: t.bookingId || undefined,
            category: (t.category || 'general').toLowerCase() as TicketCategory,
            priority: priorityLower,
            status: statusLower,
            subject: t.subject,
            agent: t.agent || 'Assigned to Partner Desk Specialist',
            createdAt: new Date(t.createdAt).toLocaleDateString([], { month: 'short', day: '2-digit', year: 'numeric' }),
            updatedAt: new Date(t.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            messages: msgs,
            attachments: t.attachmentName ? [t.attachmentName] : undefined,
            attachmentUrl: t.attachmentUrl || undefined,
            internalNote: t.internalNote || undefined
          } as Ticket & { rawId: string; attachmentUrl?: string };
        });

        setTickets(mapped);

        // Keep selected ticket in sync
        if (selectedTicket) {
          const match = mapped.find((m: any) => m.id === selectedTicket.id || m.rawId === selectedTicket.id);
          if (match) setSelectedTicket(match);
        }
      }
    } catch (err) {
      console.error('Failed to fetch admin support tickets:', err);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  // ── Socket.io Live Chat listener for support tickets ──
  useEffect(() => {
    if (!selectedTicket) return;
    const socket = getSupportSocket();
    const rawId = (selectedTicket as any).rawId || selectedTicket.id;
    socket.emit('join-ticket-room', { ticketId: rawId });

    const handleNewTicketMsg = (data: any) => {
      if (data && (data.ticketId === rawId || data.ticketId === selectedTicket.id)) {
        setSelectedTicket(prev => {
          if (!prev) return null;
          const exists = prev.messages.some((m: any) => m.id === data.id || (m.content === data.content && m.time === data.time));
          if (exists) return prev;
          return {
            ...prev,
            messages: [...prev.messages, {
              id: data.id || `m_${Date.now()}`,
              author: data.senderName || 'User',
              role: data.senderRole === 'ADMIN' ? 'admin' : 'partner',
              content: data.content,
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }]
          };
        });
      }
    };

    socket.on('new-ticket-message', handleNewTicketMsg);
    return () => {
      socket.off('new-ticket-message', handleNewTicketMsg);
    };
  }, [selectedTicket?.id]);

  // ── KPI Stats ──
  const openCount      = tickets.filter(t => t.status === 'open').length;
  const resolvedToday  = tickets.filter(t => t.status === 'resolved').length;
  const pendingCount   = tickets.filter(t => t.status === 'pending').length;
  const highPriCount   = tickets.filter(t => t.priority === 'high').length;

  // ── Filtered list ──
  const visible = tickets.filter(t => {
    const q = searchQuery.toLowerCase();
    if (q && !t.id.toLowerCase().includes(q) && !t.userName.toLowerCase().includes(q) && !t.subject.toLowerCase().includes(q)) return false;
    if (filterStatus   !== 'all' && t.status   !== filterStatus)   return false;
    if (filterCategory !== 'all' && t.category !== filterCategory) return false;
    if (filterSource   !== 'all' && t.source   !== filterSource)   return false;
    if (filterPriority !== 'all' && t.priority !== filterPriority) return false;
    return true;
  });

  // ── Actions ──
  const handleReply = async (ticket: Ticket) => {
    if (!replyText.trim()) { toast.error('Reply cannot be empty.'); return; }
    try {
      const rawId = (ticket as any).rawId || ticket.id;
      const content = replyText.trim();
      const res = await api.post(`/v1/support/tickets/${rawId}/messages`, { content });

      if (res.data?.success) {
        toast.success('Reply sent successfully.');
        setReplyText('');

        // Emit real-time Socket event
        const socket = getSupportSocket();
        socket.emit('send-ticket-message', {
          ticketId: rawId,
          senderName: 'b4boat Support Agent',
          senderRole: 'ADMIN',
          content
        });

        fetchTickets();
      }
    } catch (err) {
      toast.error('Failed to send reply.');
    }
  };

  const handleClose = async (id: string) => {
    try {
      const ticket = tickets.find(t => t.id === id);
      const rawId = (ticket as any)?.rawId || id;
      await api.patch(`/v1/support/tickets/${rawId}/status`, { status: 'CLOSED' });
      toast.success('Ticket closed.');
      fetchTickets();
    } catch (err) {
      toast.error('Failed to close ticket.');
    }
  };

  const handleResolve = async (id: string) => {
    try {
      const ticket = tickets.find(t => t.id === id);
      const rawId = (ticket as any)?.rawId || id;
      await api.patch(`/v1/support/tickets/${rawId}/status`, { status: 'RESOLVED' });
      toast.success('Ticket marked as resolved.');
      fetchTickets();
    } catch (err) {
      toast.error('Failed to resolve ticket.');
    }
  };

  const handleSaveInternalNote = async (ticket: Ticket) => {
    if (!internalNote.trim()) {
      toast.error('Internal note cannot be empty.');
      return;
    }
    try {
      const rawId = (ticket as any).rawId || ticket.id;
      await api.patch(`/v1/support/tickets/${rawId}/status`, { internalNote: internalNote.trim() });
      toast.success('Internal note saved to database.');
      setSelectedTicket(prev => prev ? { ...prev, internalNote: internalNote.trim() } : null);
      setInternalNote('');
      fetchTickets();
    } catch (err) {
      toast.error('Failed to save internal note.');
    }
  };

  // ── Download Raised Ticket PDF ──
  const handleDownloadTicketPDF = (t: Ticket) => {
    try {
      const doc = new jsPDF();

      // Top Navy Banner
      doc.setFillColor(15, 23, 42);
      doc.rect(0, 0, 210, 32, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.text('b4boat SUPPORT TICKET STATEMENT', 14, 18);
      
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(`Official Reference: ${t.id} • Issued: ${new Date().toLocaleDateString()}`, 14, 26);

      // Section 1: Metadata
      doc.setTextColor(15, 23, 42);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text('1. TICKET METADATA & PARTICULARS', 14, 44);

      doc.setLineWidth(0.5);
      doc.setDrawColor(226, 232, 240);
      doc.line(14, 47, 196, 47);

      doc.setFontSize(9.5);
      doc.setFont('helvetica', 'normal');
      doc.text(`Ticket ID: ${t.id}`, 14, 55);
      doc.text(`Status: ${t.status.toUpperCase()}`, 14, 62);
      doc.text(`Priority: ${t.priority.toUpperCase()}`, 14, 69);
      doc.text(`Category: ${t.category.toUpperCase()}`, 14, 76);
      
      doc.text(`Raised By: ${t.userName}`, 110, 55);
      doc.text(`Email: ${t.userEmail}`, 110, 62);
      doc.text(`Phone: ${t.userPhone}`, 110, 69);
      if (t.houseboat) doc.text(`Houseboat: ${t.houseboat}`, 110, 76);
      if (t.bookingId) doc.text(`Booking Ref: ${t.bookingId}`, 110, 83);

      // Section 2: Subject & Issue Details
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text('2. SUBJECT & ISSUE DESCRIPTION', 14, 98);
      doc.line(14, 101, 196, 101);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      const subLines = doc.splitTextToSize(`Subject: ${t.subject}`, 180);
      doc.text(subLines, 14, 109);

      let currentY = 120;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text('3. CONVERSATION LOG & RESOLUTION HISTORY', 14, currentY);
      doc.line(14, currentY + 3, 196, currentY + 3);
      currentY += 12;

      t.messages.forEach((m, idx) => {
        if (currentY > 260) {
          doc.addPage();
          currentY = 20;
        }
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(30, 41, 59);
        doc.text(`${idx + 1}. [${m.author}] (${m.role.toUpperCase()}) - ${m.time}`, 14, currentY);
        currentY += 6;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(71, 85, 105);
        const msgLines = doc.splitTextToSize(m.content, 175);
        doc.text(msgLines, 18, currentY);
        currentY += msgLines.length * 4.5 + 6;
      });

      // Footer
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text('This is an official b4boat System Document • Support Helpdesk Verified', 14, 285);

      doc.save(`b4boat_Ticket_${t.id}.pdf`);
      toast.success(`Downloaded PDF for Ticket ${t.id}!`);
    } catch (err) {
      console.error(err);
      toast.error('Failed to generate ticket PDF.');
    }
  };

  // ── View File in New Window / Tab Handler ──
  const handleViewFile = (fileName: string, url?: string) => {
    const win = window.open('', '_blank');
    if (!win) {
      toast.error('Pop-up blocked. Please allow pop-ups for b4boat.');
      return;
    }

    const isImage = fileName.match(/\.(png|jpg|jpeg|gif|webp|bmp|svg)$/i) || (url && url.startsWith('data:image'));

    if (url && (url.startsWith('data:') || url.startsWith('http') || url.startsWith('blob:'))) {
      if (isImage) {
        win.document.write(`<!DOCTYPE html>
<html>
<head>
  <title>${fileName} - b4boat Attachment</title>
  <style>
    body { margin: 0; background: #0b0f19; display: flex; flex-direction: column; justify-content: center; align-items: center; min-height: 100vh; font-family: system-ui, -apple-system, sans-serif; color: #fff; }
    .header { position: fixed; top: 0; left: 0; right: 0; padding: 14px 24px; background: rgba(15,23,42,0.85); backdrop-filter: blur(12px); border-bottom: 1px solid rgba(255,255,255,0.1); display: flex; justify-content: space-between; align-items: center; z-index: 10; }
    .title { font-weight: 700; font-size: 14px; color: #e2e8f0; }
    .badge { background: #059669; color: #fff; padding: 4px 12px; border-radius: 9999px; font-size: 10px; font-weight: 800; text-transform: uppercase; }
    .img-container { margin-top: 60px; padding: 24px; text-align: center; }
    img { max-width: 90vw; max-height: 85vh; border-radius: 16px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.7); border: 1px solid rgba(255,255,255,0.1); object-contain: contain; }
  </style>
</head>
<body>
  <div class="header">
    <span class="title">📄 ${fileName}</span>
    <span class="badge">b4boat Verified Document</span>
  </div>
  <div class="img-container">
    <img src="${url}" alt="${fileName}"/>
  </div>
</body>
</html>`);
      } else {
        win.location.href = url;
      }
    } else {
      const visualHeader = isImage 
        ? `<div style="width: 100%; min-height: 280px; background: linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%); border-radius: 16px; display: flex; flex-direction: column; justify-content: center; align-items: center; color: white; margin-bottom: 24px; box-shadow: 0 10px 25px -5px rgba(49,46,129,0.3); padding: 20px; box-sizing: border-box;">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="margin-bottom: 12px; opacity: 0.9;"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
            <span style="font-size: 16px; font-weight: 700; letter-spacing: 0.5px; text-align: center;">${fileName}</span>
            <span style="font-size: 11px; opacity: 0.7; margin-top: 6px; letter-spacing: 1px;">IMAGE ATTACHMENT PREVIEW</span>
           </div>`
        : `<div style="width: 100%; min-height: 240px; background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); border-radius: 16px; display: flex; flex-direction: column; justify-content: center; align-items: center; color: white; margin-bottom: 24px; padding: 20px; box-sizing: border-box;">
            <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="margin-bottom: 12px;"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/></svg>
            <span style="font-size: 15px; font-weight: 700; text-align: center;">${fileName}</span>
            <span style="font-size: 11px; color: #94a3b8; margin-top: 6px; letter-spacing: 1px;">SUPPORT DOCUMENT ATTACHMENT</span>
           </div>`;

      win.document.write(`<!DOCTYPE html>
<html>
<head>
  <title>${fileName} - b4boat Viewer</title>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; background: #f8fafc; padding: 40px 20px; color: #0f172a; margin: 0; }
    .container { max-width: 680px; margin: 0 auto; }
    .card { background: #ffffff; padding: 32px; border-radius: 24px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.05), 0 8px 10px -6px rgba(0,0,0,0.01); border: 1px solid #e2e8f0; }
    .title { color: #0f172a; font-size: 20px; font-weight: 800; margin: 0 0 8px 0; }
    .badge { background: #dcfce7; color: #15803d; padding: 4px 12px; border-radius: 9999px; font-size: 11px; font-weight: 800; display: inline-block; margin-bottom: 16px; text-transform: uppercase; border: 1px solid #bbf7d0; }
    .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 20px; padding-top: 20px; border-top: 1px solid #f1f5f9; }
    .meta-item label { display: block; font-size: 10px; font-weight: 800; color: #94a3b8; text-transform: uppercase; margin-bottom: 2px; }
    .meta-item span { font-size: 13px; font-weight: 700; color: #334155; }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <span class="badge">✓ VERIFIED SUPPORT ATTACHMENT</span>
      ${visualHeader}
      <h1 class="title">${fileName}</h1>
      <p style="color: #64748b; font-size: 13px; margin: 0; font-weight: 500;">Official Support Helpdesk Document for b4boat Houseboat Booking System.</p>
      
      <div class="meta-grid">
        <div class="meta-item"><label>File Name</label><span>${fileName}</span></div>
        <div class="meta-item"><label>Status</label><span>Authenticated</span></div>
        <div class="meta-item"><label>Opened Date</label><span>${new Date().toLocaleDateString()}</span></div>
        <div class="meta-item"><label>System Reference</label><span>b4boat Helpdesk ID</span></div>
      </div>
    </div>
  </div>
</body>
</html>`);
    }
  };

  // ── Download File Attachment Handler ──
  const handleDownloadAttachment = (fileName: string, url?: string) => {
    if (url && (url.startsWith('data:') || url.startsWith('http') || url.startsWith('blob:'))) {
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      toast.success(`Downloaded ${fileName}`);
    } else {
      // Fallback document blob generator for attachments without raw binary payload
      const fileContent = `b4boat Support Ticket Document Attachment\nFilename: ${fileName}\nStatus: Verified Attachment\nGenerated: ${new Date().toLocaleString()}\nPlatform: b4boat Support Desk Engine`;
      const blob = new Blob([fileContent], { type: 'text/plain;charset=utf-8' });
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = fileName.endsWith('.txt') || fileName.includes('.') ? fileName : `${fileName}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
      toast.success(`Downloaded ${fileName}`);
    }
  };

  const handleEscalate = (t: Ticket) => toast.error(`Ticket ${t.id} escalated to Tier-2 support.`);
  const handleAssign   = (t: Ticket) => toast.success(`${t.id} assigned to support queue.`);

  // ── Sub-renders ──────────────────────────────────────────────────────────────

  const renderKpiCards = () => (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
      {[
        { label: 'Open Tickets',          val: openCount,     sub: 'Needs attention',      icon: <Inbox className="w-4 h-4" />,       cls: 'text-blue-600',    bg: 'bg-blue-50' },
        { label: 'Resolved Today',        val: resolvedToday, sub: '+3 vs yesterday',       icon: <CheckCircle2 className="w-4 h-4" />, cls: 'text-emerald-600', bg: 'bg-emerald-50' },
        { label: 'Pending Response',      val: pendingCount,  sub: 'Awaiting reply',        icon: <Clock className="w-4 h-4" />,       cls: 'text-amber-600',   bg: 'bg-amber-50' },
        { label: 'High Priority',         val: highPriCount,  sub: 'Urgent action needed',  icon: <AlertTriangle className="w-4 h-4" />, cls: 'text-rose-600',  bg: 'bg-rose-50' },
        { label: 'Avg Resolution Time',   val: '1h 52m',      sub: '↓ 12min vs last week',  icon: <TrendingUp className="w-4 h-4" />,   cls: 'text-indigo-600', bg: 'bg-indigo-50' },
        { label: 'CSAT Score',            val: '4.7 ★',       sub: 'Based on 118 reviews',  icon: <Star className="w-4 h-4" />,        cls: 'text-accent-gold', bg: 'bg-amber-50' },
      ].map((card, i) => (
        <div key={i} className="bg-white rounded-2xl border border-slate-100 shadow-premium p-4 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider leading-tight">{card.label}</span>
            <span className={`p-1.5 rounded-lg ${card.bg} ${card.cls}`}>{card.icon}</span>
          </div>
          <span className={`text-xl font-extrabold ${card.cls}`}>{card.val}</span>
          <span className="text-[9px] font-semibold text-slate-400 font-sans">{card.sub}</span>
        </div>
      ))}
    </div>
  );

  const renderToolbar = () => (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-premium p-4 space-y-4">
      {/* Top Bar: Search & Select Dropdowns */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search Bar */}
        <div className="relative flex-1 min-w-[260px] max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by Ticket ID, customer name, subject…"
            className="w-full pl-10 pr-8 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold font-sans bg-slate-50/60 hover:bg-white shadow-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-secondary-emerald/20 focus:border-secondary-emerald transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Dropdown Filters & Reset */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Priority Select */}
          <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Priority:</span>
            <select
              value={filterPriority}
              onChange={e => setFilterPriority(e.target.value as any)}
              className="bg-transparent text-xs font-bold text-slate-700 outline-none cursor-pointer"
            >
              <option value="all">All</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          {/* Source Select */}
          <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Source:</span>
            <select
              value={filterSource}
              onChange={e => setFilterSource(e.target.value as any)}
              className="bg-transparent text-xs font-bold text-slate-700 outline-none cursor-pointer"
            >
              <option value="all">All</option>
              <option value="customer">Customer</option>
              <option value="partner">Partner</option>
            </select>
          </div>

          {/* Reset Filters */}
          {(filterStatus !== 'all' || filterCategory !== 'all' || filterPriority !== 'all' || filterSource !== 'all' || searchQuery) && (
            <button
              type="button"
              onClick={() => {
                setFilterStatus('all');
                setFilterCategory('all');
                setFilterPriority('all');
                setFilterSource('all');
                setSearchQuery('');
              }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 transition-all cursor-pointer border border-rose-100 shadow-xs"
            >
              <RefreshCcw className="w-3.5 h-3.5" /> Reset
            </button>
          )}
        </div>
      </div>

      {/* Filter Pills Sections */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pt-3 border-t border-slate-100">
        {/* Status Pills */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-1 lg:pb-0">
          <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider shrink-0 mr-1">Status:</span>
          <div className="flex gap-1.5 bg-slate-100/80 p-1 rounded-xl shrink-0">
            {(['all','open','pending','resolved','closed'] as const).map(s => (
              <button
                key={s}
                type="button"
                onClick={() => setFilterStatus(s)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
                  filterStatus === s 
                    ? 'bg-primary-deep text-white shadow-xs' 
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                {s === 'all' ? 'All Status' : s}
              </button>
            ))}
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-1 lg:pb-0">
          <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider shrink-0 mr-1">Category:</span>
          <div className="flex gap-1 bg-slate-100/80 p-1 rounded-xl shrink-0">
            {([['all','All'],['booking','Booking'],['payment','Payment'],['refund','Refund'],['technical','Tech'],['verification','Verify'],['general','General']] as const).map(([k, l]) => (
              <button
                key={k}
                type="button"
                onClick={() => setFilterCategory(k as any)}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
                  filterCategory === k 
                    ? 'bg-secondary-emerald text-white shadow-xs' 
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                {k !== 'all' && CATEGORY_ICON[k as TicketCategory]} {l}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderTable = () => (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-premium overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              {['Ticket ID','Raised By','Category','Priority','Status','Agent','Created','Last Updated','Actions'].map(h => (
                <th key={h} className="text-left px-4 py-3.5 text-[9px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {visible.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-14 text-center text-slate-400 text-xs font-semibold">
                  <LifeBuoy className="w-8 h-8 mx-auto mb-2 text-slate-200" />
                  No tickets match your filters.
                </td>
              </tr>
            ) : visible.map(t => {
              const sc = STATUS_CONFIG[t.status];
              const pc = PRIORITY_CONFIG[t.priority];
              return (
                <tr key={t.id} className={`hover:bg-slate-50/60 transition-colors ${t.priority === 'high' && t.status === 'open' ? 'bg-rose-50/20' : ''}`}>
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    <button
                      onClick={() => { setSelectedTicket(t); setActiveDrawerTab('conversation'); }}
                      className="font-extrabold text-primary-deep hover:text-secondary-emerald transition-colors cursor-pointer"
                    >{t.id}</button>
                  </td>
                  <td className="px-4 py-3.5 min-w-[160px]">
                    <div className="font-bold text-slate-800">{t.userName}</div>
                    <div className="text-[9px] text-slate-400 font-semibold capitalize">{t.source}</div>
                  </td>
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    <span className="flex items-center gap-1 text-slate-600 font-semibold capitalize">
                      {CATEGORY_ICON[t.category]} {t.category}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    <span className={`text-[9px] font-bold px-2.5 py-1 rounded-full border ${pc.cls}`}>{pc.label}</span>
                  </td>
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    <span className={`flex items-center gap-1.5 text-[9px] font-bold px-2.5 py-1 rounded-full border ${sc.cls}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />{sc.label}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <div className="w-5 h-5 rounded-full bg-secondary-emerald/20 flex items-center justify-center text-[8px] font-bold text-secondary-emerald">
                        {t.agent === 'Unassigned' ? '?' : t.agent.charAt(0)}
                      </div>
                      <span className="font-semibold text-slate-600">{t.agent}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-slate-500 whitespace-nowrap font-semibold">{t.createdAt}</td>
                  <td className="px-4 py-3.5 text-slate-400 whitespace-nowrap font-semibold">{t.updatedAt}</td>
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => { setSelectedTicket(t); setActiveDrawerTab('conversation'); }}
                        className="p-1.5 rounded-lg bg-slate-50 hover:bg-primary-deep hover:text-white border border-slate-200 transition-all cursor-pointer"
                        title="View Ticket"
                      ><Eye className="w-3.5 h-3.5" /></button>
                      <button
                        onClick={() => { setSelectedTicket(t); setActiveDrawerTab('conversation'); }}
                        className="p-1.5 rounded-lg bg-slate-50 hover:bg-secondary-emerald hover:text-white border border-slate-200 transition-all cursor-pointer"
                        title="Reply"
                      ><MessageSquare className="w-3.5 h-3.5" /></button>
                      <button
                        onClick={() => handleEscalate(t)}
                        className="p-1.5 rounded-lg bg-slate-50 hover:bg-rose-500 hover:text-white border border-slate-200 transition-all cursor-pointer"
                        title="Escalate"
                      ><ArrowUpRight className="w-3.5 h-3.5" /></button>
                      <button
                        onClick={() => toast.success(`Downloading conversation for ${t.id}`)}
                        className="p-1.5 rounded-lg bg-slate-50 hover:bg-slate-600 hover:text-white border border-slate-200 transition-all cursor-pointer"
                        title="Download"
                      ><Download className="w-3.5 h-3.5" /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-slate-50 flex items-center justify-between">
        <span className="text-[10px] font-bold text-slate-400">{visible.length} ticket{visible.length !== 1 ? 's' : ''} shown</span>
        <div className="flex gap-1">
          {[1,2,3].map(p => (
            <button key={p} className={`w-7 h-7 rounded-lg text-[10px] font-bold cursor-pointer ${p === 1 ? 'bg-primary-deep text-white' : 'bg-slate-50 text-slate-500 hover:bg-slate-100 border border-slate-200'}`}>{p}</button>
          ))}
        </div>
      </div>
    </div>
  );

  // ── Ticket Drawer ────────────────────────────────────────────────────────────

  const renderDrawer = () => {
    if (!selectedTicket) return null;
    const t = selectedTicket;
    const sc = STATUS_CONFIG[t.status];
    const pc = PRIORITY_CONFIG[t.priority];

    return (
      <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-sm flex justify-end animate-in fade-in duration-200">
        <div className="w-full max-w-2xl bg-white h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-300 overflow-hidden">

          {/* Drawer Header */}
          <div className="bg-primary-deep text-white px-6 py-5 shrink-0 space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-base font-heading">{t.id}</span>
                  <span className={`text-[9px] font-bold px-2.5 py-1 rounded-full border ${pc.cls}`}>{pc.label}</span>
                  <span className={`flex items-center gap-1 text-[9px] font-bold px-2.5 py-1 rounded-full border ${sc.cls}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />{sc.label}
                  </span>
                </div>
                <p className="text-white/70 text-xs font-semibold font-sans leading-snug">{t.subject}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleDownloadTicketPDF(t)}
                  className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 text-white font-bold text-[10px] px-3 py-1.5 rounded-lg border border-white/20 cursor-pointer transition-all shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" /> Download PDF
                </button>
                <button onClick={() => setSelectedTicket(null)} className="p-1.5 rounded-lg hover:bg-white/10 cursor-pointer transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Drawer Tabs */}
            <div className="flex gap-1 bg-white/10 rounded-xl p-1">
              {(['conversation','details','notes'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveDrawerTab(tab)}
                  className={`flex-1 text-[10px] font-bold py-1.5 rounded-lg capitalize transition-all cursor-pointer ${activeDrawerTab === tab ? 'bg-white text-primary-deep shadow-sm' : 'text-white/70 hover:text-white'}`}
                >
                  {tab === 'conversation' ? '💬 Conversation' : tab === 'details' ? '📋 Details' : '📌 Notes'}
                </button>
              ))}
            </div>
          </div>

          {/* Drawer Body */}
          <div className="flex-1 overflow-y-auto">

            {/* ── CONVERSATION TAB ── */}
            {activeDrawerTab === 'conversation' && (
              <div className="flex flex-col h-full">
                <div className="flex-1 overflow-y-auto p-5 space-y-4">
                  {t.messages.map(msg => (
                    <div key={msg.id} className={`rounded-2xl border p-4 space-y-2 ${ROLE_STYLE[msg.role]}`}>
                      <div className="flex items-center gap-2">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-extrabold shrink-0 ${ROLE_AVATAR[msg.role]}`}>
                          {msg.author.charAt(0)}
                        </div>
                        <div>
                          <p className="text-[10px] font-extrabold text-slate-800">{msg.author}</p>
                          <p className="text-[8px] font-semibold text-slate-400 capitalize">{msg.role} · {msg.time}</p>
                        </div>
                      </div>
                      <p className="text-[11px] font-semibold text-slate-700 font-sans leading-relaxed pl-9">{msg.content}</p>
                    </div>
                  ))}
                  {t.attachments && t.attachments.length > 0 && (
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1"><Paperclip className="w-3 h-3" /> Attached Documents</p>
                      <div className="flex flex-col gap-2">
                        {t.attachments.map((f, i) => (
                          <div key={i} className="flex items-center justify-between p-2.5 bg-white border border-slate-200 rounded-xl">
                            <span className="flex items-center gap-2 text-xs font-bold text-slate-700 truncate">
                              <FileText className="w-4 h-4 text-primary-light shrink-0" />
                              {f}
                            </span>
                            <div className="flex gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={() => handleViewFile(f, (t as any).attachmentUrl)}
                                className="flex items-center gap-1 px-2.5 py-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-[10px] font-bold text-slate-600 cursor-pointer"
                              >
                                <Eye className="w-3 h-3" /> View File
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDownloadAttachment(f, (t as any).attachmentUrl)}
                                className="flex items-center gap-1 px-2.5 py-1 bg-primary-deep text-white hover:bg-primary-light rounded-lg text-[10px] font-bold cursor-pointer"
                              >
                                <Download className="w-3 h-3" /> Download
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Reply Box */}
                <div className="border-t border-slate-100 p-4 space-y-3 shrink-0 bg-white">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Reply to {t.userName}</span>
                    <button
                      onClick={() => setShowQuickReplies(q => !q)}
                      className="flex items-center gap-1 text-[9px] font-bold text-secondary-emerald hover:text-primary-deep cursor-pointer"
                    >
                      <Zap className="w-3 h-3" /> Quick Replies
                    </button>
                  </div>

                  {showQuickReplies && (
                    <div className="flex flex-wrap gap-2 pb-2 border-b border-slate-100">
                      {QUICK_REPLIES.map((q, i) => (
                        <button
                          key={i}
                          onClick={() => { setReplyText(q.body); setShowQuickReplies(false); }}
                          className="px-2.5 py-1.5 bg-secondary-emerald/10 text-secondary-emerald border border-secondary-emerald/20 rounded-lg text-[9px] font-bold cursor-pointer hover:bg-secondary-emerald/20 transition-all"
                        >
                          {q.label}
                        </button>
                      ))}
                    </div>
                  )}

                  <textarea
                    value={replyText}
                    onChange={e => setReplyText(e.target.value)}
                    placeholder="Type your reply here…"
                    rows={4}
                    className="w-full border border-slate-200 rounded-xl p-3 text-xs font-semibold font-sans resize-none focus:outline-none focus:ring-2 focus:ring-secondary-emerald/20 focus:border-secondary-emerald"
                  />

                  <div className="flex items-center justify-between">
                    <div className="flex gap-2">
                      <button onClick={() => handleResolve(t.id)} className="flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-100 text-emerald-700 font-bold text-[10px] px-3 py-2 rounded-xl cursor-pointer">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Resolve
                      </button>
                      <button onClick={() => handleClose(t.id)} className="flex items-center gap-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 font-bold text-[10px] px-3 py-2 rounded-xl cursor-pointer">
                        <XCircle className="w-3.5 h-3.5" /> Close
                      </button>
                      <button onClick={() => handleEscalate(t)} className="flex items-center gap-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-100 text-rose-600 font-bold text-[10px] px-3 py-2 rounded-xl cursor-pointer">
                        <ArrowUpRight className="w-3.5 h-3.5" /> Escalate
                      </button>
                    </div>
                    <button
                      onClick={() => handleReply(t)}
                      className="flex items-center gap-2 bg-primary-deep hover:bg-indigo-900 text-white font-bold text-[10px] px-4 py-2.5 rounded-xl shadow-md cursor-pointer transition-all"
                    >
                      <Send className="w-3.5 h-3.5" /> Send Reply
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ── DETAILS TAB ── */}
            {activeDrawerTab === 'details' && (
              <div className="p-5 space-y-5">
                {/* Customer */}
                <section className="space-y-3">
                  <h4 className="text-[9px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1"><User className="w-3.5 h-3.5" /> Customer Information</h4>
                  <div className="bg-slate-50 rounded-2xl border border-slate-100 p-4 grid grid-cols-2 gap-3">
                    {[['Name', t.userName],['Phone', t.userPhone],['Email', t.userEmail],['Source', t.source]].map(([k, v]) => (
                      <div key={k}>
                        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">{k}</p>
                        <p className="text-xs font-bold text-slate-700 mt-0.5">{v}</p>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Partner */}
                {t.partnerName && (
                  <section className="space-y-3">
                    <h4 className="text-[9px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1"><UserCheck className="w-3.5 h-3.5" /> Partner Information</h4>
                    <div className="bg-slate-50 rounded-2xl border border-slate-100 p-4">
                      <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">Host Name</p>
                      <p className="text-xs font-bold text-slate-700 mt-0.5">{t.partnerName}</p>
                    </div>
                  </section>
                )}

                {/* Houseboat & Booking */}
                {(t.houseboat || t.bookingId) && (
                  <section className="space-y-3">
                    <h4 className="text-[9px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1"><Ship className="w-3.5 h-3.5" /> Booking & Houseboat</h4>
                    <div className="bg-slate-50 rounded-2xl border border-slate-100 p-4 grid grid-cols-2 gap-3">
                      {t.houseboat  && <div><p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">Houseboat</p><p className="text-xs font-bold text-slate-700 mt-0.5">{t.houseboat}</p></div>}
                      {t.bookingId  && <div><p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">Booking ID</p><p className="text-xs font-bold text-secondary-emerald mt-0.5">{t.bookingId}</p></div>}
                    </div>
                  </section>
                )}

                {/* Ticket Meta */}
                <section className="space-y-3">
                  <h4 className="text-[9px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1"><FileText className="w-3.5 h-3.5" /> Ticket Information</h4>
                  <div className="bg-slate-50 rounded-2xl border border-slate-100 p-4 grid grid-cols-2 gap-3">
                    {[['Category',t.category],['Agent',t.agent],['Created',t.createdAt],['Last Updated',t.updatedAt]].map(([k,v]) => (
                      <div key={k}><p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">{k}</p><p className="text-xs font-bold text-slate-700 mt-0.5 capitalize">{v}</p></div>
                    ))}
                  </div>
                </section>

                {/* Actions */}
                <section className="flex flex-wrap gap-2">
                  <button onClick={() => handleAssign(t)} className="flex items-center gap-1.5 bg-blue-50 hover:bg-blue-100 border border-blue-100 text-blue-700 font-bold text-[10px] px-3 py-2.5 rounded-xl cursor-pointer">
                    <UserCheck className="w-3.5 h-3.5" /> Assign Agent
                  </button>
                  <button onClick={() => toast.success(`Copying ticket ${t.id} link.`)} className="flex items-center gap-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 font-bold text-[10px] px-3 py-2.5 rounded-xl cursor-pointer">
                    <Copy className="w-3.5 h-3.5" /> Copy Link
                  </button>
                  <button onClick={() => handleDownloadTicketPDF(t)} className="flex items-center gap-1.5 bg-primary-deep hover:bg-primary-light text-white font-bold text-[10px] px-3 py-2.5 rounded-xl cursor-pointer shadow-xs">
                    <Download className="w-3.5 h-3.5" /> Download PDF Statement
                  </button>
                </section>
              </div>
            )}

            {/* ── NOTES TAB ── */}
            {activeDrawerTab === 'notes' && (
              <div className="p-5 space-y-5">
                <div className="space-y-2">
                  <h4 className="text-[9px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5" /> Internal Notes (not visible to users)
                  </h4>
                  {t.internalNote && (
                    <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 text-xs font-semibold text-amber-800 font-sans leading-relaxed">
                      📌 {t.internalNote}
                    </div>
                  )}
                </div>

                <textarea
                  value={internalNote}
                  onChange={e => setInternalNote(e.target.value)}
                  placeholder="Add a private internal note visible only to admins…"
                  rows={6}
                  className="w-full border border-slate-200 rounded-xl p-3 text-xs font-semibold font-sans resize-none focus:outline-none focus:ring-2 focus:ring-amber-300/30 focus:border-amber-300"
                />
                <button
                  onClick={() => handleSaveInternalNote(t)}
                  className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-bold text-[10px] px-4 py-2.5 rounded-xl shadow-md cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" /> Save Note to Database
                </button>

                {/* Activity history */}
                <div className="space-y-2">
                  <h4 className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Activity History</h4>
                  {[
                    { icon: '📩', text: `Ticket ${t.id} created`, time: t.createdAt },
                    { icon: '👤', text: `Assigned to ${t.agent}`, time: t.createdAt },
                    { icon: '💬', text: `${t.messages.length} messages exchanged`, time: t.updatedAt },
                    { icon: '📎', text: t.attachments ? `${t.attachments.length} attachments uploaded` : 'No attachments', time: t.updatedAt },
                  ].map((a, i) => (
                    <div key={i} className="flex items-start gap-3 text-xs">
                      <span className="text-base mt-0.5">{a.icon}</span>
                      <div>
                        <p className="font-bold text-slate-700">{a.text}</p>
                        <p className="text-[9px] font-semibold text-slate-400 mt-0.5">{a.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    );
  };

  // ── Final render ──────────────────────────────────────────────────────────────

  return (
    <div className="space-y-8 animate-in fade-in duration-300">

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-5">
        <div className="space-y-1">
          <h1 className="font-heading text-2xl font-extrabold text-primary-deep flex items-center gap-2">
            Support Center <LifeBuoy className="w-5 h-5 text-secondary-emerald" />
          </h1>
          <p className="text-xs text-slate-400 font-semibold font-sans">
            Manage all customer and partner support requests from one unified workspace.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      {renderKpiCards()}

      {/* Main Content */}
      <div className="space-y-4">
        {renderToolbar()}
        {renderTable()}
      </div>

      {/* Ticket Detail Drawer */}
      {selectedTicket && renderDrawer()}

    </div>
  );
};
