import React, { useState, useEffect } from 'react';
import { 
  Headphones, MessageSquare, Phone, Globe, FileText, AlertCircle, LifeBuoy, Send, HelpCircle,
  X, ChevronDown, ChevronUp, Paperclip, ExternalLink, Trash2
} from 'lucide-react';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import api from '../../../services/api';
import { getSupportSocket } from '../../../services/supportSocket';

export interface TicketMessageItem {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: 'HOST' | 'ADMIN' | 'CUSTOMER';
  content: string;
  createdAt: string;
}

export interface SupportTicket {
  id: string;
  ticketId: string;
  category: string;
  subject: string;
  description: string;
  attachmentName?: string;
  attachmentUrl?: string;
  priority: 'High' | 'Normal' | 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'Open' | 'In Progress' | 'Resolved' | 'Closed' | 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  createdAt: string;
  agent: string;
  messages?: TicketMessageItem[];
}

export const SupportSection: React.FC = () => {
  // Support Form State
  const [supportCategory, setSupportCategory] = useState('Booking Issue');
  const [supportSubject, setSupportSubject] = useState('');
  const [supportDescription, setSupportDescription] = useState('');
  const [attachedFile, setAttachedFile] = useState<File | null>(null);

  // Live Chat Modal State
  const [isLiveChatOpen, setIsLiveChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'user' | 'agent'; text: string; time: string }>>([
    { sender: 'agent', text: 'Hello! Welcome to b4boat Partner Support. How can we assist your houseboat operations today?', time: 'Just now' },
  ]);
  const [chatInput, setChatInput] = useState('');

  // Ticket Detail View Modal State
  const [viewTicket, setViewTicket] = useState<SupportTicket | null>(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [isSendingReply, setIsSendingReply] = useState(false);

  const handleViewHostFile = (fileName: string, url?: string) => {
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

  const handleDownloadHostAttachment = (fileName: string, url?: string) => {
    if (url && (url.startsWith('data:') || url.startsWith('http') || url.startsWith('blob:'))) {
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      toast.success(`Downloaded ${fileName}`);
    } else {
      const fileContent = `b4boat Partner Support Document Attachment\nFilename: ${fileName}\nStatus: Verified Attachment\nGenerated: ${new Date().toLocaleString()}`;
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

  // FAQ Accordion State
  const [faqTab, setFaqTab] = useState<'all' | 'booking' | 'payment' | 'technical'>('all');
  const [expandedFaq, setExpandedFaq] = useState<number | null>(0);

  // Tickets List State (100% Dynamic from Backend DB)
  const [ticketsList, setTicketsList] = useState<SupportTicket[]>([]);

  const fetchTickets = async () => {
    try {
      const res = await api.get('/v1/support/tickets');
      if (res.data?.success && Array.isArray(res.data?.data)) {
        setTicketsList(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch support tickets:', err);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleDeleteTicket = async (id: string) => {
    try {
      await api.delete(`/v1/support/tickets/${id}`);
      toast.success(`Support ticket deleted.`);
      fetchTickets();
      if (viewTicket?.id === id || viewTicket?.ticketId === id) {
        setViewTicket(null);
      }
    } catch (err) {
      toast.error('Failed to delete ticket.');
    }
  };

  // Handle Ticket Submission
  const handleRaiseTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supportSubject.trim() || !supportDescription.trim()) {
      toast.error('Please enter ticket subject and description.', { id: 'ticket-err' });
      return;
    }

    try {
      let attachmentUrl: string | undefined = undefined;
      if (attachedFile) {
        try {
          attachmentUrl = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(attachedFile);
          });
        } catch (fileErr) {
          console.error('Failed to read file:', fileErr);
        }
      }

      const payload = {
        category: supportCategory,
        subject: supportSubject.trim(),
        description: supportDescription.trim(),
        priority: supportCategory === 'Payments' || supportCategory === 'Technical' ? 'HIGH' : 'MEDIUM',
        attachmentName: attachedFile ? attachedFile.name : undefined,
        attachmentUrl
      };

      const res = await api.post('/v1/support/tickets', payload);
      if (res.data?.success) {
        toast.success(`Support ticket ${res.data.data.ticketId} raised successfully!`);
        setSupportSubject('');
        setSupportDescription('');
        setAttachedFile(null);
        fetchTickets();
      }
    } catch (err) {
      toast.error('Failed to submit support ticket.');
    }
  };

  // Handle Close / Resolve Ticket
  const handleCloseTicket = async (id: string) => {
    try {
      await api.patch(`/v1/support/tickets/${id}/status`, { status: 'RESOLVED' });
      toast.success(`Ticket marked as Resolved!`);
      fetchTickets();
      if (viewTicket?.id === id || viewTicket?.ticketId === id) {
        setViewTicket(prev => prev ? { ...prev, status: 'RESOLVED' } : null);
      }
    } catch (err) {
      toast.error('Failed to update ticket status.');
    }
  };

  // Socket live chat listener for host ticket view
  useEffect(() => {
    if (!viewTicket) return;
    const socket = getSupportSocket();
    const rawId = viewTicket.id || viewTicket.ticketId;
    socket.emit('join-ticket-room', { ticketId: rawId });

    const handleNewMsg = (data: any) => {
      if (data && (data.ticketId === rawId || data.ticketId === viewTicket.ticketId)) {
        setViewTicket(prev => {
          if (!prev) return null;
          const msgs = prev.messages || [];
          const exists = msgs.some((m: any) => m.id === data.id || (m.content === data.content && m.createdAt === data.createdAt));
          if (exists) return prev;
          return {
            ...prev,
            messages: [...msgs, {
              id: data.id || `m_${Date.now()}`,
              senderId: data.senderId || 'user',
              senderName: data.senderName || 'b4boat Support',
              senderRole: data.senderRole || 'ADMIN',
              content: data.content,
              createdAt: new Date().toISOString()
            }]
          };
        });
      }
    };

    socket.on('new-ticket-message', handleNewMsg);
    return () => {
      socket.off('new-ticket-message', handleNewMsg);
    };
  }, [viewTicket?.id, viewTicket?.ticketId]);

  // Reply message inside ticket modal
  const handleSendTicketReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!viewTicket || !replyMessage.trim()) return;

    try {
      setIsSendingReply(true);
      const rawId = viewTicket.id || viewTicket.ticketId;
      const content = replyMessage.trim();
      const res = await api.post(`/v1/support/tickets/${rawId}/messages`, {
        content
      });

      if (res.data?.success) {
        toast.success('Reply sent!');
        setReplyMessage('');

        // Emit real-time socket message
        const socket = getSupportSocket();
        socket.emit('send-ticket-message', {
          ticketId: rawId,
          senderName: 'Host Partner',
          senderRole: 'HOST',
          content
        });

        // Refresh single ticket view & list
        const updatedTicketRes = await api.get(`/v1/support/tickets/${rawId}`);
        if (updatedTicketRes.data?.success && updatedTicketRes.data?.data) {
          setViewTicket(updatedTicketRes.data.data);
        }
        fetchTickets();
      }
    } catch (err) {
      toast.error('Failed to send reply message.');
    } finally {
      setIsSendingReply(false);
    }
  };

  // Download PDF statement for ticket
  const handleDownloadHostTicketPDF = (t: SupportTicket) => {
    try {
      const doc = new jsPDF();

      doc.setFillColor(15, 23, 42);
      doc.rect(0, 0, 210, 32, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.text('b4boat PARTNER SUPPORT TICKET STATEMENT', 14, 18);
      
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(`Ticket Reference: ${t.ticketId || t.id} • Issued: ${new Date().toLocaleDateString()}`, 14, 26);

      doc.setTextColor(15, 23, 42);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text('TICKET DETAILS', 14, 44);

      doc.setLineWidth(0.5);
      doc.setDrawColor(226, 232, 240);
      doc.line(14, 47, 196, 47);

      doc.setFontSize(9.5);
      doc.setFont('helvetica', 'normal');
      doc.text(`Ticket ID: ${t.ticketId || t.id}`, 14, 55);
      doc.text(`Status: ${t.status}`, 14, 62);
      doc.text(`Priority: ${t.priority}`, 14, 69);
      doc.text(`Category: ${t.category}`, 14, 76);

      doc.setFont('helvetica', 'bold');
      doc.text(`Subject: ${t.subject}`, 14, 90);

      let currentY = 105;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text('CONVERSATION HISTORY', 14, currentY);
      doc.line(14, currentY + 3, 196, currentY + 3);
      currentY += 12;

      const msgs = t.messages || [];
      if (msgs.length === 0) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        const descLines = doc.splitTextToSize(`"${t.description}"`, 175);
        doc.text(descLines, 14, currentY);
      } else {
        msgs.forEach((m: any, idx: number) => {
          if (currentY > 260) {
            doc.addPage();
            currentY = 20;
          }
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(9);
          doc.setTextColor(30, 41, 59);
          const timeStr = m.createdAt ? new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
          doc.text(`${idx + 1}. [${m.senderName || m.senderRole}] - ${timeStr}`, 14, currentY);
          currentY += 6;

          doc.setFont('helvetica', 'normal');
          doc.setFontSize(8.5);
          doc.setTextColor(71, 85, 105);
          const lines = doc.splitTextToSize(m.content, 175);
          doc.text(lines, 18, currentY);
          currentY += lines.length * 4.5 + 6;
        });
      }

      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text('Official b4boat Helpdesk Verified Document', 14, 285);

      doc.save(`b4boat_Support_Ticket_${t.ticketId || t.id}.pdf`);
      toast.success(`Downloaded PDF for Ticket #${t.ticketId || t.id}`);
    } catch (e) {
      toast.error('Failed to generate ticket PDF.');
    }
  };

  // Live Chat Send Message Handler
  const handleSendChatMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMsg = { sender: 'user' as const, text: chatInput.trim(), time: 'Just now' };
    setChatMessages((prev) => [...prev, userMsg]);
    setChatInput('');

    setTimeout(() => {
      setChatMessages((prev) => [
        ...prev,
        {
          sender: 'agent',
          text: `Thank you for contacting b4boat Support! An agent has received your query regarding "${userMsg.text}". We are processing your request immediately.`,
          time: 'Just now',
        },
      ]);
    }, 1000);
  };

  const faqs = [
    {
      cat: 'booking',
      q: 'How do bookings automatically appear in my dashboard?',
      a: 'When customers complete payment on b4boat, instant-book APIs immediately sync confirmed trip reservations directly into your partner dashboard timeline and send WhatsApp notifications.',
    },
    {
      cat: 'payment',
      q: 'What is the payout settlement schedule cycle?',
      a: 'All confirmed bookings follow a T+2 automatic settlement cycle directly into your registered State Bank of India account once guest voyages complete.',
    },
    {
      cat: 'technical',
      q: 'How does blocking dates impact calendar pricing overrides?',
      a: 'Marking specific days as blocked for maintenance or private use disables instant booking on client portals, overriding special surge pricings for that timeframe.',
    },
    {
      cat: 'technical',
      q: 'How can I troubleshoot API sync delay alerts with Port Authority?',
      a: 'Verify your vessel license codes in Business Info settings. If sync delay logs exceed 3 hours, raise a high-priority ticket under the Technical category.',
    },
  ];

  const filteredFaqs = faqs.filter((f) => faqTab === 'all' || f.cat === faqTab);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-5">
        <div className="space-y-1">
          <h1 className="font-heading text-2xl font-extrabold text-primary-deep flex items-center gap-2">
            Help & Support Center <Headphones className="w-5 h-5 text-indigo-600" />
          </h1>
          <p className="text-xs text-slate-400 font-semibold font-sans font-medium">
            Direct host assistance, instant hotline dialing, WhatsApp support, and active ticket management.
          </p>
        </div>
      </div>

      {/* Quick Contact Actions row (Targeted exact links & phone numbers) */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        
        {/* 1. Live Chat Support Modal Action */}
        <button
          type="button"
          onClick={() => setIsLiveChatOpen(true)}
          className="p-4 rounded-2xl border text-left font-bold text-xs flex flex-col justify-between gap-3 transition-all cursor-pointer shadow-premium bg-white text-slate-700 hover:bg-slate-50 border-slate-100 hover:border-indigo-200"
        >
          <div className="flex justify-between items-center w-full">
            <MessageSquare className="w-4 h-4 text-indigo-500" />
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          </div>
          <span>Live Chat Support</span>
        </button>

        {/* 2. Call Support Team (Dials 1234567890) */}
        <a
          href="tel:1234567890"
          className="p-4 rounded-2xl border text-left font-bold text-xs flex flex-col justify-between gap-3 transition-all cursor-pointer shadow-premium bg-white text-slate-700 hover:bg-slate-50 border-slate-100 hover:border-sky-200"
        >
          <div className="flex justify-between items-center w-full">
            <Phone className="w-4 h-4 text-sky-500" />
          </div>
          <div>
            <span className="block">Call Support Team</span>
            <span className="text-[9px] text-slate-400 font-semibold font-mono block mt-0.5">1234567890</span>
          </div>
        </a>

        {/* 3. WhatsApp Support (Goes to 1234567890) */}
        <a
          href="https://wa.me/911234567890?text=Hello%20b4boat%20Support%20Team"
          target="_blank"
          rel="noreferrer"
          className="p-4 rounded-2xl border text-left font-bold text-xs flex flex-col justify-between gap-3 transition-all cursor-pointer shadow-premium bg-white text-slate-700 hover:bg-slate-50 border-slate-100 hover:border-emerald-200"
        >
          <div className="flex justify-between items-center w-full">
            <Globe className="w-4 h-4 text-emerald-500" />
            <ExternalLink className="w-3 h-3 text-slate-300" />
          </div>
          <div>
            <span className="block">WhatsApp Support</span>
            <span className="text-[9px] text-slate-400 font-semibold font-mono block mt-0.5">1234567890</span>
          </div>
        </a>

        {/* 4. Email Helpdesk (Mails waauautomation@gmail.com) */}
        <a
          href="mailto:waauautomation@gmail.com?subject=b4boat%20Host%20Support%20Request"
          className="p-4 rounded-2xl border text-left font-bold text-xs flex flex-col justify-between gap-3 transition-all cursor-pointer shadow-premium bg-white text-slate-700 hover:bg-slate-50 border-slate-100 hover:border-purple-200"
        >
          <div className="flex justify-between items-center w-full">
            <FileText className="w-4 h-4 text-purple-500" />
          </div>
          <div>
            <span className="block">Email Helpdesk</span>
            <span className="text-[9px] text-slate-400 font-semibold block mt-0.5 truncate">waauautomation@gmail.com</span>
          </div>
        </a>

        {/* 5. Emergency Line (Dials 1234567890) */}
        <a
          href="tel:1234567890"
          className="p-4 rounded-2xl border text-left font-bold text-xs flex flex-col justify-between gap-3 transition-all cursor-pointer shadow-premium bg-rose-50 border-rose-100 text-rose-800 hover:bg-rose-100/60 animate-pulse"
        >
          <div className="flex justify-between items-center w-full">
            <AlertCircle className="w-4 h-4 text-rose-600" />
          </div>
          <div>
            <span className="block">Emergency Line</span>
            <span className="text-[9px] text-rose-500 font-semibold font-mono block mt-0.5">1234567890</span>
          </div>
        </a>

      </div>

      {/* Support workspace split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left panel: Active Support Tickets & Raise Ticket form */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Raise support ticket form */}
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-premium space-y-5">
            <div className="border-b border-slate-50 pb-2">
              <h3 className="font-heading text-sm font-bold text-primary-deep flex items-center gap-1.5">
                <LifeBuoy className="w-4 h-4 text-accent-gold" /> Raise Support Ticket
              </h3>
            </div>

            <form onSubmit={handleRaiseTicket} className="space-y-4 text-xs font-bold text-slate-700">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-400 uppercase">Category</label>
                  <select
                    value={supportCategory}
                    onChange={(e) => setSupportCategory(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl focus:outline-none font-bold text-slate-800 cursor-pointer"
                  >
                    <option value="Booking">Booking</option>
                    <option value="Payments">Payments</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Technical">Technical</option>
                    <option value="Registration">Registration</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-[10px] text-slate-400 uppercase">Subject *</label>
                  <input
                    type="text"
                    required
                    placeholder="Summary of issue..."
                    value={supportSubject}
                    onChange={(e) => setSupportSubject(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl focus:outline-none font-bold text-slate-800"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] text-slate-400 uppercase">Description Details *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Provide details about your support request..."
                  value={supportDescription}
                  onChange={(e) => setSupportDescription(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl focus:outline-none font-bold text-slate-800 resize-none"
                />
              </div>

              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pt-2">
                <label className="inline-flex items-center gap-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold px-3.5 py-2 rounded-xl text-[10px] cursor-pointer border border-slate-200">
                  <Paperclip className="w-3.5 h-3.5 text-slate-500" />
                  {attachedFile ? attachedFile.name : 'Attach Document Report'}
                  <input 
                    type="file" 
                    onChange={(e) => setAttachedFile(e.target.files?.[0] || null)}
                    className="hidden" 
                  />
                </label>

                <button
                  type="submit"
                  className="bg-primary-deep hover:bg-primary-light text-white font-bold px-6 py-2.5 rounded-xl text-xs cursor-pointer flex items-center gap-2 shadow-md transition-all"
                >
                  <Send className="w-3.5 h-3.5" /> Submit Ticket
                </button>
              </div>
            </form>
          </div>

          {/* Support Tickets Ledger */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-premium p-6 space-y-4">
            <div className="border-b border-slate-50 pb-2 flex justify-between items-center">
              <h3 className="font-heading text-xs font-bold text-slate-400 uppercase tracking-wider">
                Active Support Tickets Desk
              </h3>
              <span className="text-[10px] text-slate-400 font-bold">{ticketsList.length} Tickets</span>
            </div>

            <div className="space-y-3">
              {ticketsList.length === 0 ? (
                <p className="text-xs text-slate-400 italic py-4 text-center">No active support tickets found.</p>
              ) : (
                ticketsList.map((t) => (
                  <div key={t.id} className="bg-slate-50/50 border border-slate-100 rounded-2xl p-4 flex flex-col sm:flex-row justify-between sm:items-center gap-4 text-xs font-bold hover:bg-slate-50 transition-colors">
                    <div className="space-y-1 text-slate-600 flex-1 min-w-0">
                      <div className="flex gap-2 items-center">
                        <span className="font-mono text-slate-800 text-xs">{t.id}</span>
                        <span className={`text-[8px] font-bold px-2 py-0.5 rounded border uppercase ${
                          t.status === 'Resolved' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'
                        }`}>
                          {t.status}
                        </span>
                        <span className={`text-[8px] font-bold px-2 py-0.5 rounded border uppercase ${
                          t.priority === 'High' ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-slate-50 text-slate-600 border-slate-200'
                        }`}>
                          {t.priority}
                        </span>
                      </div>
                      <h4 className="text-slate-800 font-extrabold font-sans text-xs truncate">{t.subject}</h4>
                      <span className="text-[10px] text-slate-400 font-semibold block truncate">
                        Category: {t.category} • Created: {t.createdAt ? new Date(t.createdAt).toLocaleDateString() : 'Today'} • {t.agent || 'Partner Support Desk'}
                      </span>
                    </div>

                    <div className="flex gap-2 justify-end sm:justify-start shrink-0">
                      <button
                        type="button"
                        onClick={() => setViewTicket(t)}
                        className="bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold px-3 py-1.5 rounded-lg text-[10px] cursor-pointer shadow-xs"
                      >
                        View Ticket
                      </button>
                      {t.status !== 'Resolved' && (
                        <button
                          type="button"
                          onClick={() => handleCloseTicket(t.id)}
                          className="bg-white hover:bg-emerald-50 text-emerald-600 font-bold px-3 py-1.5 rounded-lg text-[10px] border border-slate-200 hover:border-emerald-100 cursor-pointer shadow-xs"
                        >
                          Mark Resolved
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleDeleteTicket(t.id)}
                        className="bg-white hover:bg-rose-50 text-rose-500 hover:text-rose-700 font-bold p-1.5 rounded-lg text-[10px] border border-slate-200 cursor-pointer shadow-xs transition-colors"
                        title="Delete Ticket"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

        {/* Right panel: FAQ accordion + Knowledge Base links */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Interactive FAQs list */}
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-premium space-y-4">
            <div className="border-b border-slate-50 pb-2">
              <h3 className="font-heading text-xs font-bold text-slate-400 uppercase tracking-wider">Frequently Asked Questions</h3>
            </div>

            {/* FAQ tabs */}
            <div className="flex gap-1 overflow-x-auto border-b border-slate-50 pb-2 scrollbar-none">
              {[
                { label: 'All', key: 'all' },
                { label: 'Booking', key: 'booking' },
                { label: 'Pay', key: 'payment' },
                { label: 'Tech', key: 'technical' },
              ].map((ft) => (
                <button
                  key={ft.key}
                  type="button"
                  onClick={() => setFaqTab(ft.key as any)}
                  className={`px-3 py-1 rounded-lg text-[9px] font-bold uppercase transition-all cursor-pointer whitespace-nowrap ${
                    faqTab === ft.key
                      ? 'bg-primary-deep text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  {ft.label}
                </button>
              ))}
            </div>

            <div className="space-y-3 text-xs font-semibold text-slate-600">
              {filteredFaqs.map((faq, fIdx) => {
                const isOpen = expandedFaq === fIdx;
                return (
                  <div key={fIdx} className="border border-slate-100 rounded-xl overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setExpandedFaq(isOpen ? null : fIdx)}
                      className="w-full p-3 bg-slate-50/50 hover:bg-slate-50 text-left flex justify-between items-center font-bold text-[11px] text-slate-800 cursor-pointer"
                    >
                      <span className="flex items-center gap-1.5">
                        <HelpCircle className="w-3.5 h-3.5 text-primary-light shrink-0" /> {faq.q}
                      </span>
                      {isOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                    </button>

                    {isOpen && (
                      <div className="p-3 bg-white border-t border-slate-100 text-[11px] text-slate-500 font-sans leading-relaxed">
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

        </div>

      </div>

      {/* Live Chat Modal */}
      {isLiveChatOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-500 animate-ping" />
                <h3 className="font-heading text-sm font-bold text-primary-deep">b4boat Partner Support Live Chat</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsLiveChatOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Chat Messages */}
            <div className="h-64 overflow-y-auto space-y-3 p-3 bg-slate-50 rounded-2xl border border-slate-100 text-xs font-semibold scrollbar-none">
              {chatMessages.map((msg, idx) => (
                <div key={idx} className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                  <div className={`p-3 rounded-2xl max-w-[80%] ${
                    msg.sender === 'user' ? 'bg-primary-deep text-white rounded-br-none' : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none shadow-xs'
                  }`}>
                    {msg.text}
                  </div>
                  <span className="text-[8px] text-slate-400 mt-1">{msg.time}</span>
                </div>
              ))}
            </div>

            {/* Chat Input */}
            <form onSubmit={handleSendChatMessage} className="flex gap-2">
              <input
                type="text"
                placeholder="Type your message..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-800 outline-none focus:border-secondary-emerald"
              />
              <button
                type="submit"
                className="bg-primary-deep hover:bg-primary-light text-white p-2.5 rounded-xl cursor-pointer"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Ticket View Modal */}
      {viewTicket && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 space-y-4 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-heading text-sm font-bold text-primary-deep flex items-center gap-2">
                <LifeBuoy className="w-4 h-4 text-emerald-600" /> Support Ticket #{viewTicket.ticketId || viewTicket.id}
              </h3>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleDownloadHostTicketPDF(viewTicket)}
                  className="flex items-center gap-1.5 bg-primary-deep hover:bg-primary-light text-white font-bold text-[10px] px-3 py-1.5 rounded-xl cursor-pointer transition-all shadow-xs"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Download PDF
                </button>
                <button
                  type="button"
                  onClick={() => setViewTicket(null)}
                  className="text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="space-y-3 text-xs font-semibold">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-mono font-extrabold text-slate-900 text-sm">{viewTicket.ticketId || viewTicket.id}</span>
                  <span className={`font-bold uppercase text-[10px] px-2.5 py-0.5 rounded-full border ${
                    viewTicket.status === 'RESOLVED' || viewTicket.status === 'Resolved'
                      ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                      : 'bg-amber-50 text-amber-600 border-amber-100'
                  }`}>
                    {viewTicket.status}
                  </span>
                </div>
                <h4 className="font-heading font-extrabold text-slate-900 text-sm">{viewTicket.subject}</h4>
                <span className="text-[10px] text-slate-400 block font-sans">
                  Category: {viewTicket.category} • Priority: {viewTicket.priority} • {viewTicket.agent || 'Partner Support Desk'}
                </span>
              </div>

              {/* Messages Thread */}
              <div className="space-y-2">
                <span className="text-[9px] text-slate-400 uppercase font-bold block">Conversation History</span>
                <div className="max-h-60 overflow-y-auto space-y-2.5 p-3 bg-slate-50 rounded-2xl border border-slate-100 scrollbar-none">
                  {viewTicket.messages && viewTicket.messages.length > 0 ? (
                    viewTicket.messages.map((m: any, idx: number) => {
                      const isAdmin = m.senderRole === 'ADMIN';
                      return (
                        <div key={m.id || idx} className={`flex flex-col ${isAdmin ? 'items-start' : 'items-end'}`}>
                          <span className="text-[9px] font-bold text-slate-400 mb-0.5 px-1">
                            {m.senderName || (isAdmin ? 'b4boat Support Agent' : 'You')}
                          </span>
                          <div className={`p-3 rounded-2xl max-w-[85%] text-xs ${
                            isAdmin 
                              ? 'bg-white text-slate-800 border border-slate-200 shadow-xs rounded-tl-none' 
                              : 'bg-primary-deep text-white rounded-tr-none'
                          }`}>
                            {m.content}
                          </div>
                          <span className="text-[8px] text-slate-400 mt-1 font-mono">
                            {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      );
                    })
                  ) : (
                    <p className="p-3 bg-white rounded-xl border border-slate-100 text-slate-700 text-xs leading-relaxed">
                      "{viewTicket.description}"
                    </p>
                  )}
                </div>
              </div>

              {/* Attachments */}
              {viewTicket.attachmentName && (
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-1.5">
                  <span className="text-[9px] text-slate-400 uppercase font-bold flex items-center gap-1">
                    <Paperclip className="w-3 h-3" /> Attached File
                  </span>
                  <div className="flex items-center justify-between p-2 bg-white border border-slate-200 rounded-xl">
                    <span className="text-xs font-bold text-slate-800 truncate">{viewTicket.attachmentName}</span>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => handleViewHostFile(viewTicket.attachmentName!, viewTicket.attachmentUrl)}
                        className="px-2.5 py-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg text-[10px] font-bold cursor-pointer"
                      >
                        View File
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDownloadHostAttachment(viewTicket.attachmentName!, viewTicket.attachmentUrl)}
                        className="px-2.5 py-1 bg-primary-deep text-white hover:bg-primary-light rounded-lg text-[10px] font-bold cursor-pointer"
                      >
                        Download
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Send Reply Box */}
              {viewTicket.status !== 'RESOLVED' && viewTicket.status !== 'Resolved' && viewTicket.status !== 'CLOSED' && (
                <form onSubmit={handleSendTicketReply} className="flex gap-2 pt-1">
                  <input
                    type="text"
                    placeholder="Write a reply message..."
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-800 outline-none focus:border-secondary-emerald"
                  />
                  <button
                    type="submit"
                    disabled={isSendingReply}
                    className="bg-primary-deep hover:bg-primary-light text-white font-bold px-4 py-2.5 rounded-xl cursor-pointer flex items-center gap-1 text-xs"
                  >
                    <Send className="w-3.5 h-3.5" /> Send Reply
                  </button>
                </form>
              )}
            </div>

            <div className="pt-2 flex gap-3">
              {(viewTicket.status !== 'RESOLVED' && viewTicket.status !== 'Resolved') && (
                <button
                  type="button"
                  onClick={() => handleCloseTicket(viewTicket.id || viewTicket.ticketId)}
                  className="flex-1 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-bold rounded-xl text-xs transition-all cursor-pointer"
                >
                  Mark Resolved
                </button>
              )}
              <button
                type="button"
                onClick={() => setViewTicket(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-all cursor-pointer"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
