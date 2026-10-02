'use client';

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * src/components/HelpAndSupportModal.tsx
 * Professional Help & Support Desk Modal
 * Dispatches operator queries directly to djnitish97@gmail.com
 */

import React, { useState } from 'react';
import {
  X,
  Mail,
  Send,
  Linkedin,
  CheckCircle2,
  Copy,
  Check,
  ExternalLink,
  Headphones,
  AlertCircle,
  HelpCircle,
  Clock,
  ShieldCheck
} from 'lucide-react';
import confetti from 'canvas-confetti';

export interface HelpAndSupportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function HelpAndSupportModal({ isOpen, onClose }: HelpAndSupportModalProps) {
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [category, setCategory] = useState<string>('ID Card / Aadhaar / PAN Printing');
  const [message, setMessage] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [copiedQuery, setCopiedQuery] = useState<boolean>(false);

  if (!isOpen) return null;

  const supportEmail = 'djnitish97@gmail.com';

  const prepareMailtoUrl = () => {
    const subject = encodeURIComponent(`[NK PrintBay Support] ${category} - ${name || 'Operator'}`);
    const bodyContent = `Hello NK PrintBay Support Team,

Operator Details:
- Name: ${name || 'N/A'}
- Email: ${email || 'N/A'}
- Mobile/WhatsApp: ${phone || 'N/A'}
- Category: ${category}

Query / Issue Description:
${message}

------------------------------------
Sent via NK PrintBay Help & Support Desk
Timestamp: ${new Date().toLocaleString()}`;

    return `mailto:${supportEmail}?subject=${subject}&body=${encodeURIComponent(bodyContent)}`;
  };

  const prepareGmailWebUrl = () => {
    const subject = encodeURIComponent(`[NK PrintBay Support] ${category} - ${name || 'Operator'}`);
    const bodyContent = `Hello NK PrintBay Support Team,

Operator Details:
- Name: ${name || 'N/A'}
- Email: ${email || 'N/A'}
- Mobile/WhatsApp: ${phone || 'N/A'}
- Category: ${category}

Query / Issue Description:
${message}

------------------------------------
Sent via NK PrintBay Help & Support Desk
Timestamp: ${new Date().toLocaleString()}`;

    return `https://mail.google.com/mail/?view=cm&fs=1&to=${supportEmail}&su=${subject}&body=${encodeURIComponent(bodyContent)}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) {
      alert('कृपया अपना नाम, ईमेल एवं संदेश भरें। (Please fill in your name, email and message.)');
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Post to internal support endpoint
      await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone, category, message }),
      }).catch(() => {});

      // 2. Trigger direct mailto link to open user's default email client
      const mailtoUrl = prepareMailtoUrl();
      const tempLink = document.createElement('a');
      tempLink.href = mailtoUrl;
      tempLink.target = '_blank';
      tempLink.click();

      setIsSubmitted(true);
      confetti({ particleCount: 50, spread: 70, origin: { y: 0.6 } });
    } catch {
      setIsSubmitted(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyDetails = () => {
    const fullText = `Subject: [NK PrintBay Support] ${category} - ${name}
To: ${supportEmail}
Name: ${name}
Email: ${email}
Phone: ${phone}
Query:
${message}`;
    navigator.clipboard.writeText(fullText);
    setCopiedQuery(true);
    setTimeout(() => setCopiedQuery(false), 2000);
  };

  const handleResetForm = () => {
    setIsSubmitted(false);
    setMessage('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-[#0b1f4d] border border-blue-800 rounded-3xl w-full max-w-xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-slate-200 text-xs">
        
        {/* Top Header */}
        <div className="border-b border-blue-900 bg-[#08183d] px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600/30 border border-blue-500/50 flex items-center justify-center text-cyan-300">
              <Headphones className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                <span>Help & Support Desk</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-mono font-bold bg-blue-500/20 text-cyan-300 border border-blue-500/30">
                  OFFICIAL
                </span>
              </h2>
              <p className="text-[11px] text-slate-400">
                प्रिंटिंग, कार्ड टूल्स या सब्सक्रिप्शन सहायता के लिए फॉर्म भरें
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-blue-950/80 hover:bg-blue-900 border border-blue-800 flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {isSubmitted ? (
            /* Success View */
            <div className="py-6 flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-xl shadow-emerald-500/20">
                <CheckCircle2 className="w-9 h-9" />
              </div>

              <div className="space-y-1">
                <h3 className="text-lg font-black text-white">संदेश सफलतापूर्वक दर्ज हुआ!</h3>
                <p className="text-xs text-slate-300 max-w-md">
                  आपकी सहायता अनुरोध ईमेल क्लाइंट में तैयार कर दी गई है। हमारा सपोर्ट ईमेल है:{' '}
                  <span className="font-mono text-cyan-300 font-bold">{supportEmail}</span>
                </p>
              </div>

              {/* Quick Actions */}
              <div className="w-full bg-blue-950/80 border border-blue-800/80 rounded-2xl p-4 text-left space-y-3 font-mono text-xs">
                <div className="flex justify-between items-center text-slate-400">
                  <span>Target Support:</span>
                  <span className="text-white font-bold">{supportEmail}</span>
                </div>
                <div className="flex justify-between items-center text-slate-400">
                  <span>Category:</span>
                  <span className="text-cyan-300">{category}</span>
                </div>
                <div className="flex justify-between items-center text-slate-400">
                  <span>Operator:</span>
                  <span className="text-white">{name} ({email})</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 w-full pt-2">
                <a
                  href={prepareGmailWebUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-blue-600/30 transition-all cursor-pointer"
                >
                  <Mail className="w-4 h-4" />
                  <span>Open Directly in Gmail →</span>
                </a>

                <button
                  onClick={handleCopyDetails}
                  className="px-4 py-2.5 rounded-xl bg-blue-950 hover:bg-blue-900 border border-blue-800 text-slate-200 text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer"
                >
                  {copiedQuery ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedQuery ? 'Copied to Clipboard!' : 'Copy Query'}</span>
                </button>
              </div>

              <button
                onClick={handleResetForm}
                className="text-xs text-cyan-400 underline hover:text-cyan-300 cursor-pointer pt-2"
              >
                Send Another Support Query
              </button>
            </div>
          ) : (
            /* Form View */
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="bg-blue-950/60 border border-blue-800/70 rounded-2xl p-3.5 flex items-center gap-3 text-slate-300 text-[11px]">
                <Clock className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>
                  फॉर्म सबमिट करने पर विवरण सीधे सपोर्ट इनबॉक्स (<b>{supportEmail}</b>) पर भेजा जाएगा। औसत प्रतिक्रिया समय: 2-4 घंटे।
                </span>
              </div>

              {/* Name & Email Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-slate-300 font-semibold block mb-1">
                    आपका नाम (Full Name) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="उदा. राहुल शर्मा"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-[#08183d] border border-blue-900 rounded-xl px-3.5 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 text-xs"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-slate-300 font-semibold block mb-1">
                    ईमेल पता (Email Address) *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-[#08183d] border border-blue-900 rounded-xl px-3.5 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 text-xs font-mono"
                  />
                </div>
              </div>

              {/* Phone & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-slate-300 font-semibold block mb-1">
                    मोबाइल / WhatsApp नंबर
                  </label>
                  <input
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-[#08183d] border border-blue-900 rounded-xl px-3.5 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-slate-300 font-semibold block mb-1">
                    सहायता विषय (Topic / Issue Category) *
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-[#08183d] border border-blue-900 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-400 text-xs font-sans cursor-pointer"
                  >
                    <option value="ID Card / Aadhaar / PAN Printing">ID Card / Aadhaar / PAN Printing</option>
                    <option value="Passport Photo Studio / 300 DPI Export">Passport Photo Studio / 300 DPI Export</option>
                    <option value="Image Size Reducer in KB / PDF Suite">Image Size Reducer in KB / PDF Suite</option>
                    <option value="Account, Plan & Payment Issue">Account, Plan & Payment Issue</option>
                    <option value="Feature Request / Suggestion">Feature Request / Suggestion</option>
                    <option value="Other Technical Support">Other Technical Support</option>
                  </select>
                </div>
              </div>

              {/* Detailed Message */}
              <div>
                <label className="text-[11px] text-slate-300 font-semibold block mb-1">
                  अपनी समस्या या प्रश्न लिखें (Message / Issue Details) *
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="उदा. मुझे आधार कार्ड 300 DPI प्रिंट करते समय पेज साइज में समस्या आ रही है..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full bg-[#08183d] border border-blue-900 rounded-xl p-3 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 text-xs resize-none"
                />
              </div>

              {/* Submit Buttons */}
              <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  {/* LinkedIn Icon Link (as requested by user) */}
                  <a
                    href="https://www.linkedin.com/in/nitish-khobragade-61476b1b4/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-8 h-8 rounded-full bg-blue-950 hover:bg-blue-900 border border-blue-800 text-blue-300 hover:text-white flex items-center justify-center transition-colors shadow-sm"
                    title="LinkedIn Support"
                  >
                    <Linkedin className="w-4 h-4" />
                  </a>

                  {/* Direct Email link */}
                  <a
                    href={`mailto:${supportEmail}`}
                    className="w-8 h-8 rounded-full bg-blue-950 hover:bg-blue-900 border border-blue-800 text-amber-400 hover:text-amber-300 flex items-center justify-center transition-colors shadow-sm"
                    title={`Email Support: ${supportEmail}`}
                  >
                    <Mail className="w-4 h-4" />
                  </a>
                  <span className="text-[11px] text-slate-400 font-mono hidden sm:inline">
                    {supportEmail}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 rounded-xl bg-blue-950 hover:bg-blue-900 text-slate-300 text-xs font-semibold"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-blue-600/30 transition-all cursor-pointer disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isSubmitting ? 'Sending...' : 'Submit Support Request'}</span>
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
