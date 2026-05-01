import { useState } from 'react';
import { FileDown, FileText, Mail, Loader2, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import api from '../services/api';

/**
 * Export alerts as CSV or generate a styled PDF incident report.
 * Designed to be embedded inside the Alerts page or triggered from Dashboard.
 */
const ExportPanel = ({ alerts = [], stats = null }) => {
  const [exporting, setExporting] = useState(null); // 'csv' | 'pdf' | 'email'

  // ─── CSV Export (Backend Driven) ──────────────────────────────
  const exportCSV = async () => {
    setExporting('csv');
    try {
      const response = await api.get('/reports/csv', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `trinetra_alerts_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      toast.success('CSV Report Downloaded');
    } catch {
      toast.error('Failed to export CSV from server');
    } finally {
      setExporting(null);
    }
  };

  // ─── PDF Incident Report (Backend Driven) ─────────────────────
  const generatePDFReport = async () => {
    setExporting('pdf');
    try {
      const response = await api.get('/reports/pdf', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `trinetra_executive_report_${new Date().toISOString().slice(0, 10)}.pdf`);
      document.body.appendChild(link);
      link.click();
      toast.success('Executive PDF Report Generated');
    } catch {
      toast.error('Server failed to generate PDF');
    } finally {
      setExporting(null);
    }
  };

  // ─── Email Report (simulated) ─────────────────────────────────
  const emailReport = async () => {
    setExporting('email');
    try {
      await api.post('/reports/email');
      toast.success('Incident report delivered to your inbox');
    } catch (err) {
      const msg = err.response?.data?.error || 'Email dispatch failed';
      toast.error(msg);
    } finally {
      setExporting(null);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={exportCSV}
        disabled={exporting === 'csv'}
        className="flex items-center gap-2 bg-surface-container border border-on-surface/10 text-on-surface-variant px-3 py-2 rounded-lg text-[11px] transition-all hover:bg-surface-container-high hover:text-tertiary hover:border-tertiary font-bold disabled:opacity-50 active:scale-95"
      >
        {exporting === 'csv' ? <CheckCircle size={12} className="text-tertiary" /> : <FileDown size={12} />}
        CSV
      </button>
      <button
        onClick={generatePDFReport}
        disabled={exporting === 'pdf'}
        className="flex items-center gap-2 bg-surface-container border border-on-surface/10 text-on-surface-variant px-3 py-2 rounded-lg text-[11px] transition-all hover:bg-surface-container-high hover:text-primary hover:border-primary font-bold disabled:opacity-50 active:scale-95"
      >
        {exporting === 'pdf' ? <Loader2 size={12} className="animate-spin" /> : <FileText size={12} />}
        PDF Report
      </button>
      <button
        onClick={emailReport}
        disabled={exporting === 'email'}
        className="flex items-center gap-2 bg-surface-container border border-on-surface/10 text-on-surface-variant px-3 py-2 rounded-lg text-[11px] transition-all hover:bg-surface-container-high hover:text-error hover:border-error font-bold disabled:opacity-50 active:scale-95"
      >
        {exporting === 'email' ? <Loader2 size={12} className="animate-spin" /> : <Mail size={12} />}
        Email
      </button>
    </div>
  );
};

export default ExportPanel;
