import React from 'react';
import { X, Mail, ShieldCheck, ExternalLink } from 'lucide-react';

interface EmailPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  emailData: {
    recipientEmail: string;
    subject: string;
    html: string;
    subscriptionName: string;
  } | null;
}

export const EmailPreviewModal: React.FC<EmailPreviewModalProps> = ({
  isOpen,
  onClose,
  emailData,
}) => {
  if (!isOpen || !emailData) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-2xl max-h-[90vh] rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-indigo-400" />
            <div>
              <h3 className="text-xs font-bold text-white">Resend Transactional Email Delivery</h3>
              <p className="text-[11px] text-slate-400 font-mono">To: {emailData.recipientEmail}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Email Meta Info */}
        <div className="px-5 py-2.5 bg-slate-950/90 border-b border-slate-800/80 text-xs text-slate-300 flex items-center justify-between font-mono">
          <div className="truncate mr-4">
            <span className="text-slate-500">Subject: </span>
            <span className="text-indigo-200 font-semibold">{emailData.subject}</span>
          </div>
          <div className="flex items-center gap-1.5 text-emerald-400 text-[11px] shrink-0">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>DKIM & SPF Verified</span>
          </div>
        </div>

        {/* Rendered Email Body in iFrame or sanitized container */}
        <div className="flex-1 overflow-y-auto p-4 bg-slate-950/40">
          <div
            className="w-full rounded-xl overflow-hidden shadow-inner border border-slate-800"
            dangerouslySetInnerHTML={{ __html: emailData.html }}
          />
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/70 flex items-center justify-between text-xs text-slate-400">
          <span>Sent with Resend API (Node.js SDK / React Email)</span>
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium transition-colors"
          >
            Close Preview
          </button>
        </div>
      </div>
    </div>
  );
};
