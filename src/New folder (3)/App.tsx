/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, Component } from 'react';
import axios from 'axios';
import { 
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  limit,
  serverTimestamp,
  doc,
  setDoc,
  getDoc,
  increment,
  getDocFromServer,
  deleteDoc,
  runTransaction
} from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from './firebase';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { SupportTier, SupportAction, Stats, TIER_CONFIG, Task, TeamCandidate, ChatMessage, AppTab, AppEntry, CRARating, CRCReport, CTRRating, BiographyEntry, CompletedWebsite, Lottery } from './types';
import { formatNumber, formatCurrency, cn } from './lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Heart, 
  Star, 
  Award, 
  Zap, 
  Crown, 
  Users, 
  TrendingUp, 
  MessageSquare,
  X,
  ChevronRight,
  User,
  MoreVertical,
  Trophy,
  Ticket,
  Brain,
  Phone,
  ClipboardList,
  Home,
  CreditCard,
  Plus,
  CheckCircle,
  AlertCircle,
  History,
  ThumbsUp,
  ThumbsDown,
  Image as ImageIcon,
  Upload,
  Trash2,
  Search,
  Play,
  Send,
  Camera,
  Phone,
  HelpCircle,
  MessageCircle,
  HelpCircle as AskIcon,
  Rocket,
  FileText,
  ShieldCheck,
  Info,
  ShieldAlert,
  BookOpen,
  Gift,
  Pencil,
  Check,
  ShoppingBag,
  Package,
  MapPin,
  Truck,
  Loader2,
  Lock,
  Facebook,
  Youtube,
  Instagram,
  Twitter,
  Menu,
  Globe,
  Gem,
  Sparkles,
  Shield
} from 'lucide-react';

// --- Components ---

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<any, any> {
  constructor(props: any) {
    super(props);
    (this as any).state = {
      hasError: false,
      error: null
    };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    const self = this as any;
    if (self.state.hasError) {
      let message = "Something went wrong.";
      try {
        const errInfo = JSON.parse(self.state.error?.message || "");
        if (errInfo.error) {
          message = `Firestore Error: ${errInfo.error} during ${errInfo.operationType} on ${errInfo.path}`;
        }
      } catch (e) {
        message = self.state.error?.message || message;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
          <div className="max-w-md w-full bg-white p-8 rounded-3xl border border-slate-100 shadow-xl text-center">
            <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <ShieldAlert className="text-rose-600" size={32} />
            </div>
            <h2 className="font-display font-bold text-2xl text-slate-900 mb-4">Oops! Error</h2>
            <p className="text-slate-600 mb-8 leading-relaxed text-sm">
              {message}
            </p>
            <button 
              onClick={() => window.location.reload()}
              className="w-full py-4 bg-brand-600 text-white rounded-2xl font-bold text-lg shadow-xl shadow-brand-600/20 hover:bg-brand-700 transition-all"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return self.props.children;
  }
}

const Navbar = ({ onBrandClick, onSupportClick, onIntroClick, onMenuClick }: { onBrandClick: () => void; onSupportClick: () => void; onIntroClick: () => void; onMenuClick: () => void }) => (
  <nav className="sticky top-0 z-50 glass border-b border-slate-200/50 px-6 py-4">
    <div className="max-w-5xl mx-auto flex justify-between items-center">
      <div className="flex items-center gap-4">
        <button onClick={onMenuClick} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
          <Menu size={24} className="text-slate-600" />
        </button>
        <div
          className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
          onClick={onBrandClick}
        >
          <img src="/logo-blue.png.png" alt="Г. Жавхлан" className="w-9 h-9 object-contain rounded-lg" />
          <span className="font-display font-bold text-xl tracking-tight">Г. Жавхлан</span>
        </div>
      </div>
      <div className="flex items-center gap-6">
        <button
          onClick={onIntroClick}
          className="text-sm font-medium text-slate-600 hover:text-brand-600 transition-colors"
        >
          Танилцъя
        </button>
        <button
          onClick={onSupportClick}
          className="bg-brand-600 text-white px-4 py-2 rounded-full text-sm font-semibold hover:bg-brand-700 transition-all shadow-lg shadow-brand-600/20"
        >
          Иргэд
        </button>
      </div>
    </div>
  </nav>
);

const Sidebar = ({ isOpen, onClose, activeTab, setActiveTab }: { isOpen: boolean; onClose: () => void; activeTab: AppTab; setActiveTab: (tab: AppTab) => void }) => {
  const menuItems: { id: AppTab; label: string; icon: any }[] = [
    { id: 'membership', label: 'Get Membership', icon: Crown },
    { id: 'website', label: 'Website', icon: Globe },
    { id: 'lucky_draw', label: 'Азтан Тодруулах', icon: Trophy },
    { id: 'lottery', label: 'Сугалаа', icon: Ticket },
    { id: 'askify', label: 'Askify', icon: Brain },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100]"
          />
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed left-0 top-0 bottom-0 w-72 bg-white z-[101] shadow-2xl flex flex-col"
          >
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <img src="/logo-blue.png.png" alt="Г. Жавхлан" className="w-8 h-8 object-contain rounded-lg" />
                <span className="font-display font-bold text-lg tracking-tight">Г. Жавхлан</span>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                <X size={20} className="text-slate-400" />
              </button>
            </div>
            <div className="flex-grow overflow-y-auto p-4 space-y-2">
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    onClose();
                  }}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all font-medium",
                    activeTab === item.id 
                      ? "bg-brand-50 text-brand-600 shadow-sm shadow-brand-600/5" 
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  )}
                >
                  <item.icon size={20} className={activeTab === item.id ? "text-brand-600" : "text-slate-400"} />
                  {item.label}
                </button>
              ))}
            </div>
            <div className="p-6 border-t border-slate-100">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">
                © 2024 Г. Жавхлан
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

const MonnamTyping = ({ onClick }: { onClick: () => void }) => {
  const [displayText, setDisplayText] = useState('НАМ');
  const [isDeleting, setIsDeleting] = useState(false);
  const [loopNum, setLoopNum] = useState(0);
  const [typingSpeed, setTypingSpeed] = useState(150);

  const words = ['НАМ', 'ГОЛ'];

  useEffect(() => {
    const handleType = () => {
      const i = loopNum % words.length;
      const fullText = words[i];

      setDisplayText(isDeleting 
        ? fullText.substring(0, displayText.length - 1) 
        : fullText.substring(0, displayText.length + 1)
      );

      setTypingSpeed(isDeleting ? 100 : 150);

      if (!isDeleting && displayText === fullText) {
        setTimeout(() => setIsDeleting(true), 2000);
      } else if (isDeleting && displayText === '') {
        setIsDeleting(false);
        setLoopNum(loopNum + 1);
      }
    };

    const timer = setTimeout(handleType, typingSpeed);
    return () => clearTimeout(timer);
  }, [displayText, isDeleting, loopNum, typingSpeed]);

  return (
    <motion.div 
      onClick={onClick}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xl mb-8 cursor-pointer hover:shadow-2xl transition-all group overflow-hidden relative"
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-brand-500/5 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-brand-500/10 transition-colors" />
      <div className="flex items-center justify-between relative z-10">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-600 to-brand-700 flex items-center justify-center text-white shadow-lg shadow-brand-600/20">
            <Rocket size={28} className="group-hover:animate-bounce" />
          </div>
          <div>
            <h3 className="font-display font-bold text-3xl text-slate-900 flex items-center tracking-tight">
              МОН
              <span className="text-brand-600 ml-0.5 min-w-[3ch] inline-block">
                {displayText}
                <motion.span 
                  animate={{ opacity: [1, 0] }}
                  transition={{ duration: 0.5, repeat: Infinity }}
                  className="inline-block w-1 h-8 bg-brand-600 ml-1 align-middle"
                />
              </span>
            </h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-1">Монгол Олны Нам</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-slate-300 group-hover:text-brand-600 transition-colors">
          <span className="text-xs font-bold uppercase tracking-widest hidden sm:block">Нэвтрэх</span>
          <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
        </div>
      </div>
    </motion.div>
  );
};

const SplashScreen = ({ onDone }: { onDone: () => void }) => {
  useEffect(() => {
    const t = setTimeout(onDone, 2800);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center"
      style={{ backgroundColor: '#0284c7' }}
    >
      {/* Logo */}
      <motion.div
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.7, ease: [0.34, 1.56, 0.64, 1] }}
        className="mb-6"
      >
        <img src="/logo-blue.png.png" alt="Logo" className="w-44 h-44 object-contain" />
      </motion.div>

      {/* Name */}
      <motion.p
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.5 }}
        className="text-2xl font-bold tracking-widest text-white uppercase"
        style={{ letterSpacing: '0.15em' }}
      >
        Г. Жавхлан
      </motion.p>
    </motion.div>
  );
};

const IntroModal = ({
  onClose,
  onComplete
}: { 
  onClose: () => void; 
  onComplete: (data: { name: string; age: number; phone: string; businessInfo: string; amount: number }) => void 
}) => {
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState({ name: '', age: '', phone: '', businessInfo: '', amount: '' });

  const steps = [
    {
      javkhlan: "Сайн байна уу? Намайг Ганбаатар овогтой Жавхлан гэдэг 34 настай хувиараа бизнес эрхэлдэг, Founder, CEO, Marketer, Developer Аялал Жуулчлал Менежерээр төгссөн хүн байна.",
      userAction: <button onClick={() => setStep(1)} className="w-full py-3 bg-brand-600 text-white rounded-xl font-bold">Сайн, сайн байна уу?</button>
    },
    {
      javkhlan: "Би маш сайн. Таныг хэн гэдэг вэ, та өөрийгөө сайхан танилцуулаач.",
      userAction: (
        <div className="space-y-3">
          <input 
            type="text" 
            placeholder="Таны нэр" 
            value={formData.name}
            onChange={e => setFormData({...formData, name: e.target.value})}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:border-brand-500"
          />
          <input 
            type="number" 
            placeholder="Таны нас" 
            value={formData.age}
            onChange={e => setFormData({...formData, age: e.target.value})}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:border-brand-500"
          />
          <button 
            disabled={!formData.name || !formData.age}
            onClick={() => setStep(2)} 
            className="w-full py-3 bg-brand-600 text-white rounded-xl font-bold disabled:opacity-50"
          >
            Үргэлжлүүлэх
          </button>
        </div>
      )
    },
    {
      javkhlan: "Сайхан нэр байна, би таньд гоё мэдээ хэлэх байх тиймээс таны дугаар надад байхгүй юм байна, та надад дугаараа өгнө үү.",
      userAction: (
        <div className="space-y-3">
          <input 
            type="tel" 
            placeholder="Таны утасны дугаар" 
            value={formData.phone}
            onChange={e => setFormData({...formData, phone: e.target.value})}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:border-brand-500"
          />
          <button 
            disabled={!formData.phone}
            onClick={() => setStep(3)} 
            className="w-full py-3 bg-brand-600 text-white rounded-xl font-bold disabled:opacity-50"
          >
            Үргэлжлүүлэх
          </button>
        </div>
      )
    },
    {
      javkhlan: "Удахгүй би таньтай холбогдноо. Нээрээ та хаана ямар бизнес эрхэлдэг талаараа болон бизнесийнхээ талаар танилцуулаач, би Askify Platform хөгжүүлж байгаа магадгүй би таны бизнесийг цааш нь олон хүнд танилцуулна хэрвээ та манай Askify Platform-ыг ашиглах бол та хэлээрэй.",
      userAction: (
        <div className="space-y-3">
          <textarea 
            placeholder="Бизнесийнхээ талаар бичнэ үү..." 
            value={formData.businessInfo}
            onChange={e => setFormData({...formData, businessInfo: e.target.value})}
            rows={3}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:border-brand-500 resize-none"
          />
          <button 
            disabled={!formData.businessInfo}
            onClick={() => setStep(4)} 
            className="w-full py-3 bg-brand-600 text-white rounded-xl font-bold disabled:opacity-50"
          >
            Үргэлжлүүлэх
          </button>
        </div>
      )
    },
    {
      javkhlan: (
        <div className="space-y-4 text-sm leading-relaxed">
          <p className="font-bold text-lg">Сайн байна уу 🙏</p>
          <p>Би Монголд анх удаа <strong>“Үнэлгээний Нэгдсэн Систем”</strong> платформ хөгжүүлж байна.</p>
          <div className="bg-slate-50 p-4 rounded-2xl space-y-2">
            <p>Энэ нь:</p>
            <p>✔️ Хэн ч хэнийг ч үнэлдэг</p>
            <p>✔️ Худал биш, бодит рейтинг үүсгэдэг</p>
            <p>✔️ Итгэл дээр суурилсан шинэ орчин бий болгодог</p>
          </div>
          <p>Өнөөдөр бидэнд шударга үнэлгээний систем хамгийн их дутагдаж байна. Харин энэ төсөл тэр асуудлыг шийдэх зорилготой.</p>
          <p>🚀 Энэ системийг бодит болгоход таны дэмжлэг маш чухал. Хэрвээ та энэ санааг дэмжиж байвал боломжтой хэмжээгээр хувь нэмэр оруулж дэмжээрэй 🙏</p>
          <div className="bg-brand-50 p-4 rounded-2xl space-y-2 border border-brand-100">
            <p className="font-bold text-brand-700">🎁 Дэмжсэн хэрэглэгчдэд:</p>
            <ul className="list-disc list-inside text-brand-600">
              <li>Early Access эрх</li>
              <li>VIP Badge (платформ дээр)</li>
              <li>Онцгой хэрэглэгч статус</li>
            </ul>
          </div>
          <p className="font-medium">🚀 Та зүгээр нэг дэмжигч биш энэ системийн анхны бүтээгчдийн нэг болно.</p>
        </div>
      ),
      userAction: (
        <button 
          onClick={() => setStep(5)} 
          className="w-full py-3 bg-brand-600 text-white rounded-xl font-bold shadow-lg shadow-brand-600/20"
        >
          Ойлголоо
        </button>
      )
    },
    {
      javkhlan: "Та энэ төслийг дэмжиж боломжтой хэмжээгээрээ хувь нэмэр оруулна уу. Таны дэмжлэг бидэнд маш чухал.",
      userAction: (
        <div className="space-y-3">
          <input 
            type="number" 
            placeholder="Дэмжих дүн (₮)" 
            value={formData.amount}
            onChange={e => setFormData({...formData, amount: e.target.value})}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:border-brand-500"
          />
          <button 
            onClick={() => setStep(6)} 
            className="w-full py-3 bg-brand-600 text-white rounded-xl font-bold"
          >
            {formData.amount && Number(formData.amount) > 0 ? 'Дэмжих' : 'Үргэлжлүүлэх'}
          </button>
        </div>
      )
    },
    {
      javkhlan: "За баярлалаа, удахгүй энэ танилцах хэсгийг илүү гоё болгоод эргээд уулзана. Одоо та манай албан ёсны хуудас руу орох гэж байна таньд амжилт хүсье.",
      userAction: (
        <button 
          onClick={() => onComplete({ ...formData, age: Number(formData.age), amount: Number(formData.amount) || 0 })} 
          className="w-full py-3 bg-brand-600 text-white rounded-xl font-bold"
        >
          Дуусгах
        </button>
      )
    }
  ];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md"
    >
      <motion.div 
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl"
      >
        <div className="p-6 bg-brand-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-bold">Ж</div>
            <h3 className="font-display font-bold text-lg">Танилцъя</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-brand-100 flex-shrink-0 flex items-center justify-center text-brand-600 text-xs font-bold">Ж</div>
            <div className="bg-slate-100 p-4 rounded-2xl rounded-tl-none">
              <div className="text-slate-700 text-sm leading-relaxed">{steps[step].javkhlan}</div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-50">
            {steps[step].userAction}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

const QPayModal = ({ 
  invoice, 
  onClose, 
  onSuccess 
}: { 
  invoice: any; 
  onClose: () => void; 
  onSuccess: () => void 
}) => {
  const [status, setStatus] = useState<'pending' | 'success' | 'failed'>('pending');

  useEffect(() => {
    let interval: any;
    if (status === 'pending') {
      interval = setInterval(async () => {
        try {
          const response = await axios.post('/api/qpay/check', { invoice_id: invoice.invoice_id });
          if ((response.data.rows && response.data.rows.length > 0) || response.data.paid_amount > 0) {
            setStatus('success');
            clearInterval(interval);
            setTimeout(onSuccess, 2000);
          }
        } catch (error) {
          console.error("Check payment failed:", error);
        }
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [invoice.invoice_id, status, onSuccess]);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md"
    >
      <motion.div 
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
      >
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10">
          <h3 className="font-display font-bold text-xl text-slate-900">QPay Төлбөр</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <X size={20} className="text-slate-400" />
          </button>
        </div>

        <div className="flex-grow overflow-y-auto p-8 custom-scrollbar">
          {status === 'pending' ? (
            <div className="space-y-8 text-center">
              <div className="space-y-4">
                <div className="bg-slate-50 p-6 rounded-3xl inline-block border-2 border-slate-100">
                  <img src={`data:image/png;base64,${invoice.qr_image}`} alt="QPay QR" className="w-48 h-48 mx-auto" />
                </div>
                <div>
                  <p className="text-slate-500 text-sm mb-1">Төлөх дүн:</p>
                  <p className="text-2xl font-bold text-slate-900">{formatCurrency(invoice.amount)}</p>
                </div>
                <div className="flex items-center justify-center gap-2 text-brand-600 font-medium animate-pulse">
                  <div className="w-2 h-2 bg-brand-600 rounded-full" />
                  <span className="text-sm">Төлбөр хүлээж байна...</span>
                </div>
              </div>

              <div className="space-y-4 text-left">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-px flex-grow bg-slate-100"></div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Банкаа сонгох</span>
                  <div className="h-px flex-grow bg-slate-100"></div>
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {invoice.urls?.map((bank: any, idx: number) => (
                    <a 
                      key={idx}
                      href={bank.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex flex-col items-center gap-2 p-3 rounded-2xl border border-slate-100 hover:border-brand-200 hover:bg-brand-50/50 transition-all group"
                    >
                      <div className="w-10 h-10 rounded-xl overflow-hidden border border-slate-100 bg-white flex items-center justify-center p-1 group-hover:scale-110 transition-transform">
                        <img src={bank.logo} alt={bank.name} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                      </div>
                      <span className="text-[10px] font-bold text-slate-600 text-center line-clamp-1">{bank.description}</span>
                    </a>
                  ))}
                </div>
              </div>

              <p className="text-xs text-slate-400 italic">Та QR кодыг уншуулах эсвэл дээрх банкны апп-уудаас сонгож төлбөрөө төлнө үү.</p>
            </div>
          ) : (
            <div className="py-12 space-y-4 text-center">
              <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={40} />
              </div>
              <h3 className="text-2xl font-bold text-slate-900">Амжилттай!</h3>
              <p className="text-slate-500">Төлбөр амжилттай хийгдлээ. Түр хүлээнэ үү...</p>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

const SupportModal = ({ 
  tier, 
  onClose, 
  onSubmit 
}: { 
  tier: SupportTier; 
  onClose: () => void; 
  onSubmit: (data: { name: string; phone: string; message: string }) => void 
}) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [customAmountLocal, setCustomAmountLocal] = useState('');
  const isCustom = tier === 'custom';
  const config = isCustom
    ? { label: 'Дэмжлэг', amount: Number(customAmountLocal) || 0, color: 'bg-brand-600' }
    : TIER_CONFIG[tier];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div 
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className={cn("p-6 text-white relative", config.color)}>
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-white/20 rounded-xl">
              {tier === 'starter' && <Heart size={24} />}
              {tier === 'star' && <Star size={24} />}
              {tier === 'special' && <Award size={24} />}
              {tier === 'super' && <Zap size={24} />}
              {tier === 'sponsor' && <Crown size={24} />}
            </div>
            <h3 className="font-display font-bold text-2xl">{config.label} Support</h3>
          </div>
          <p className="text-white/80 text-sm">Таны {formatCurrency(config.amount)} дэмжлэг маш их тус болно.</p>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Нэр</label>
            <input 
              type="text" 
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Таны нэр"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Утас</label>
            <input 
              type="tel" 
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="Таны утасны дугаар"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Захих Үг</label>
            <textarea 
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Жишээ нь: Заавал гишүүн болоорой..."
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all resize-none"
            />
          </div>
          
          {isCustom && (
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Дүн (₮)</label>
              <input
                type="number"
                value={customAmountLocal}
                onChange={e => setCustomAmountLocal(e.target.value)}
                placeholder="Дэмжлэгийн дүн"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-brand-500 outline-none"
              />
            </div>
          )}

          <div className="pt-2">
            <div className="flex justify-between items-center mb-4 px-1">
              <span className="text-slate-500 text-sm font-medium">Дэмжлэг:</span>
              <span className="font-bold text-slate-900">{formatCurrency(config.amount)}</span>
            </div>
            <button
              onClick={() => onSubmit({ name, phone, message, ...(isCustom ? { amount: Number(customAmountLocal) } : {}) } as any)}
              disabled={!name || (isCustom && !customAmountLocal)}
              className={cn(
                "w-full py-4 rounded-2xl text-white font-bold text-lg shadow-lg transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100",
                config.color
              )}
            >
              Дэмжих
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

const QuickSupportModal = ({ 
  onClose, 
  onConfirm 
}: { 
  onClose: () => void; 
  onConfirm: (data: { name: string; phone: string }) => void 
}) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div 
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6 bg-brand-600 text-white relative">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-white/20 rounded-xl">
              <Heart size={24} />
            </div>
            <h3 className="font-display font-bold text-2xl">Дэмжих</h3>
          </div>
          <p className="text-white/80 text-sm">Мэдээллээ оруулаад дэмжиж эхэлнэ үү.</p>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Нэр</label>
            <input 
              type="text" 
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Таны нэр"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-brand-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Утасны дугаар</label>
            <input 
              type="tel" 
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="Утасны дугаар оруулна уу"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-brand-500 outline-none"
            />
          </div>
          
          <button 
            onClick={() => onConfirm({ name, phone })}
            disabled={!name || !phone}
            className="w-full py-4 bg-brand-600 text-white rounded-2xl font-bold text-lg shadow-xl shadow-brand-600/20 hover:bg-brand-700 transition-all disabled:opacity-50"
          >
            Дэмжиж эхлэх
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

const SupportersListModal = ({ 
  onClose, 
  supporters 
}: { 
  onClose: () => void; 
  supporters: SupportAction[] 
}) => {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div 
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <h3 className="font-display font-bold text-xl text-slate-900 flex items-center gap-2">
            <Users size={20} className="text-brand-600" />
            Нийт дэмжигчид
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <X size={20} className="text-slate-400" />
          </button>
        </div>
        <div className="max-h-[60vh] overflow-y-auto p-4 space-y-3">
          {supporters.length === 0 ? (
            <p className="text-center py-8 text-slate-400 font-medium">Одоогоор дэмжигч байхгүй байна.</p>
          ) : (
            supporters.map((s) => (
              <div key={s.uniqueKey || s.id} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center text-brand-600 font-bold">
                    {s.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 flex items-center gap-1.5">
                      {(s as any).userNumber && (
                        <span className="text-[10px] font-black text-brand-600 bg-brand-50 px-1.5 py-0.5 rounded-full">№{(s as any).userNumber}</span>
                      )}
                      {s.name}
                      <CheckCircle size={14} className="text-blue-500 fill-blue-500 text-white" />
                    </p>
                    <p className="text-[10px] text-slate-400 font-medium">{s.phone}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

const SupportsHistoryModal = ({ 
  onClose, 
  history 
}: { 
  onClose: () => void; 
  history: SupportAction[] 
}) => {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div 
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <h3 className="font-display font-bold text-xl text-slate-900 flex items-center gap-2">
            <History size={20} className="text-brand-600" />
            Дэмжлэгийн түүх
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <X size={20} className="text-slate-400" />
          </button>
        </div>
        <div className="max-h-[60vh] overflow-y-auto p-4 space-y-3">
          {history.length === 0 ? (
            <p className="text-center py-8 text-slate-400 font-medium">Түүх байхгүй байна.</p>
          ) : (
            history.map((s) => (
              <div key={s.id} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center text-brand-600 font-bold">
                    {s.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">{s.name}</p>
                    <p className="text-[10px] text-slate-400 font-medium">
                      {s.timestamp?.toDate ? s.timestamp.toDate().toLocaleDateString() : 'Саяхан'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-brand-600">{formatCurrency(s.amount)}</p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{s.tier}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

const SuperSupportModal = ({ 
  onClose, 
  onSubmit 
}: { 
  onClose: () => void; 
  onSubmit: (data: { amount: number }) => void 
}) => {
  const [amount, setAmount] = useState('');

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div 
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6 bg-amber-500 text-white relative">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-white/20 rounded-xl">
              <Zap size={24} />
            </div>
            <h3 className="font-display font-bold text-2xl">Super Support</h3>
          </div>
          <p className="text-white/80 text-sm">Дэмжлэгийн үнийн дүнгээ оруулаад мөнгө өгөх боломжтой.</p>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Дэмжих үнийн дүн (₮)</label>
            <input 
              type="number" 
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="Дүн оруулна уу"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-amber-500 outline-none"
            />
          </div>
          
          <button 
            onClick={() => onSubmit({ amount: Number(amount) })}
            disabled={!amount}
            className="w-full py-4 bg-amber-500 text-white rounded-2xl font-bold text-lg shadow-xl shadow-amber-500/20 hover:bg-amber-600 transition-all disabled:opacity-50"
          >
            Илгээх
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

const SupportOthersModal = ({ 
  onClose, 
  onSubmit 
}: { 
  onClose: () => void; 
  onSubmit: (data: { phone: string; amount: number }) => void 
}) => {
  const [phone, setPhone] = useState('');
  const [amount, setAmount] = useState('');

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div 
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6 bg-brand-600 text-white relative">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-white/20 rounded-xl">
              <Heart size={24} />
            </div>
            <h3 className="font-display font-bold text-2xl">Бусдыг дэмжих</h3>
          </div>
          <p className="text-white/80 text-sm">Та бусдад тусламж үзүүлэх гэж байна.</p>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Дэмжих хүнийхээ утасны дугаар</label>
            <input 
              type="tel" 
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="Утасны дугаар оруулна уу"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-brand-500 outline-none"
            />
            <p className="mt-1 text-[10px] text-slate-400 font-medium italic">* Тухайн хэрэглэгч манайд бүртгэлтэй байх ёстой</p>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Дэмжих үнийн дүн (₮)</label>
            <input 
              type="number" 
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="Дүн оруулна уу"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-brand-500 outline-none"
            />
          </div>
          
          <button 
            onClick={() => onSubmit({ phone, amount: Number(amount) })}
            disabled={!phone || !amount}
            className="w-full py-4 bg-brand-600 text-white rounded-2xl font-bold text-lg shadow-xl shadow-brand-600/20 hover:bg-brand-700 transition-all disabled:opacity-50"
          >
            Дэмжих
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

// --- Helpers ---

const compressImage = (file: File, maxWidth: number = 1200, maxHeight: number = 1200, quality: number = 0.7): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height *= maxWidth / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width *= maxHeight / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = reject;
    };
    reader.onerror = reject;
  });
};

// --- Main App ---

export default function App() {
  const [activeTab, setActiveTab] = useState<AppTab>('home');
  const [teamTab, setTeamTab] = useState<number>(0);
  const [taskTab, setTaskTab] = useState<number>(0);
  const [appsTab, setAppsTab] = useState<number>(0);
  const [bookTab, setBookTab] = useState<number>(0); // 0: All, 1: MVP, 2: CRA, 3: CRC, 4: CTR, 5: Biography
  const [stats, setStats] = useState<Stats>({
    totalAmount: 0,
    totalSupporters: 0,
    totalSupported: 0,
    totalSubscribers: 0,
    tierCounts: { starter: 0, star: 0, special: 0, super: 0, sponsor: 0, subscription: 0 },
    profileImageUrl: '',
    coverImageUrl: ''
  });
  const [recentSupports, setRecentSupports] = useState<SupportAction[]>([]);
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [allApps, setAllApps] = useState<AppEntry[]>([]);
  const [teamCandidates, setTeamCandidates] = useState<TeamCandidate[]>([]);
  const [selectedTier, setSelectedTier] = useState<SupportTier | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isUpdatingCover, setIsUpdatingCover] = useState(false);
  const [showSupportOthers, setShowSupportOthers] = useState(false);
  const [showSupportersList, setShowSupportersList] = useState(false);
  const [showSupportsHistory, setShowSupportsHistory] = useState(false);
  const [showQuickSupportModal, setShowQuickSupportModal] = useState(false);
  const [showSuperModal, setShowSuperModal] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const [showGiftModal, setShowGiftModal] = useState(false);
  const [giftStep, setGiftStep] = useState<'intro' | 'phone' | 'revealed' | 'not-qualified' | 'support-first'>('intro');
  const [giftPhone, setGiftPhone] = useState('');
  const [giftPhoneError, setGiftPhoneError] = useState('');
  const [showGiftEdit, setShowGiftEdit] = useState(false);
  const [giftMessage, setGiftMessage] = useState("Бид танд үнэ төлбөргүй website хийж өгнө.");
  const [giftEditValue, setGiftEditValue] = useState("");
  const [gifts, setGifts] = useState<any[]>([]);
  const [showGiftAddForm, setShowGiftAddForm] = useState(false);
  const [giftForm, setGiftForm] = useState({ name: '', eligibility: 'any', customAmount: '' });

  // Shop state
  const [products, setProducts] = useState<any[]>([]);
  const [showProductForm, setShowProductForm] = useState(false);
  const [productForm, setProductForm] = useState({ name: '', price: '', image: '' });
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [orderType, setOrderType] = useState<'direct' | 'delivery'>('direct');
  const [orderForm, setOrderForm] = useState({ phone: '', address: '' });
  const [orderSubmitting, setOrderSubmitting] = useState(false);
  const [isAdminUnlocked, setIsAdminUnlocked] = useState(() => !!localStorage.getItem('admin_email'));
  const [currentAdminEmail, setCurrentAdminEmail] = useState(() => localStorage.getItem('admin_email') || '');
  const [showAdminLoginForm, setShowAdminLoginForm] = useState(false);
  const [adminLoginForm, setAdminLoginForm] = useState({ email: '', password: '' });
  const [adminLoginError, setAdminLoginError] = useState('');
  const [citizenSearch, setCitizenSearch] = useState('');
  // Free 10-digit ID (Танилцъя)
  const [freeUserId, setFreeUserId] = useState<string | null>(null);
  // Paid sequential # (Дэмжих - after payment)
  const [userNumber, setUserNumber] = useState<number | null>(null);
  const [isEarlyUser, setIsEarlyUser] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);
  const [showWelcomeNotif, setShowWelcomeNotif] = useState(false);
  const [welcomeIsPaid, setWelcomeIsPaid] = useState(false);
  const [registeredUsers, setRegisteredUsers] = useState<any[]>([]);
  const [allOrders, setAllOrders] = useState<any[]>([]);
  const DIAMOND_CUTOFF = new Date('2026-10-13');
  const [showAdminDashboard, setShowAdminDashboard] = useState(false);
  const [adminDashTab, setAdminDashTab] = useState('profile');
  const [adminProfileName, setAdminProfileName] = useState('Г. Жавхлан');
  const [adminProfileUsername, setAdminProfileUsername] = useState('javkhlan');
  const [accessList, setAccessList] = useState<any[]>([]);
  const [addAccessForm, setAddAccessForm] = useState({ name: '', email: '', password: '', role: 'admin' });
  const [showSidebar, setShowSidebar] = useState(false);
  const [showAddAccessForm, setShowAddAccessForm] = useState(false);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [announceForm, setAnnounceForm] = useState({ title: '', content: '' });
  const [showAnnounceForm, setShowAnnounceForm] = useState(false);

  // Website state
  const [websiteSubTab, setWebsiteSubTab] = useState<'order' | 'completed'>('order');
  const [completedWebsites, setCompletedWebsites] = useState<CompletedWebsite[]>([]);
  const [websiteForm, setWebsiteForm] = useState({ name: '', shopUrl: '', clientName: '', record: '', imageUrl: '' });
  const [isSubmittingWebsite, setIsSubmittingWebsite] = useState(false);

  const GIFT_MIN_AMOUNT = 1_000_000;
  const ADMIN_EMAILS = ["iamikajaki@gmail.com", "azashigamjilt@gmail.com", "dansdaatgal@gmail.com"];
  const [currentUserDoc, setCurrentUserDoc] = useState<any>(null);
  const isAdmin = ADMIN_EMAILS.includes(auth.currentUser?.email || '') || currentUserDoc?.username === 'javkhlan';
  const OWNER_EMAILS = ['iamikajaki@gmail.com', 'dansdaatgal@gmail.com'];
  const isOwner = OWNER_EMAILS.includes(currentAdminEmail) || OWNER_EMAILS.includes(auth.currentUser?.email || '') || isAdminUnlocked;

  const handleAddCompletedWebsite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!websiteForm.name || !websiteForm.shopUrl || !websiteForm.clientName || !websiteForm.record || !websiteForm.imageUrl) {
      alert('Бүх талбарыг бөглөнө үү.');
      return;
    }
    setIsSubmittingWebsite(true);
    try {
      await addDoc(collection(db, 'completed_websites'), {
        ...websiteForm,
        timestamp: serverTimestamp()
      });
      setWebsiteForm({ name: '', shopUrl: '', clientName: '', record: '', imageUrl: '' });
      alert('Амжилттай нэмэгдлээ!');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'completed_websites');
    } finally {
      setIsSubmittingWebsite(false);
    }
  };

  const handleWebsiteImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await compressImage(file, 800, 600, 0.7);
        setWebsiteForm(prev => ({ ...prev, imageUrl: compressed }));
      } catch (error) {
        console.error("Failed to compress website image:", error);
      }
    }
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const { email, password } = adminLoginForm;
    const builtIn = [
      { email: 'iamikajaki@gmail.com', password: 'Pw#Admin1$' },
      { email: 'dansdaatgal@gmail.com', password: 'Pw#Admin1$' },
    ];
    const dynamic = accessList.find(a => a.email === email && a.password === password);
    const matched = builtIn.find(a => a.email === email && a.password === password) || dynamic;
    if (matched) {
      setIsAdminUnlocked(true);
      setCurrentAdminEmail(email);
      localStorage.setItem('admin_email', email);
      setAdminLoginError('');
      setShowAdminLoginForm(false);
    } else {
      setAdminLoginError('Нэвтрэх нэр эсвэл нууц үг буруу байна.');
    }
  };

  const handleGoogleAdminLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const email = result.user.email;
      if (email && ADMIN_EMAILS.includes(email)) {
        setIsAdminUnlocked(true);
        setCurrentAdminEmail(email);
        localStorage.setItem('admin_email', email);
        setAdminLoginError('');
        setShowAdminLoginForm(false);
      } else {
        setAdminLoginError('Таны имэйл админ эрхгүй байна.');
        await auth.signOut();
      }
    } catch (error) {
      console.error("Google login failed:", error);
      setAdminLoginError('Google нэвтрэлт амжилтгүй боллоо.');
    }
  };

  const handleGiftOpen = () => {
    setGiftStep('intro');
    setGiftPhone('');
    setGiftPhoneError('');
    setShowGiftModal(true);
  };

  const handleGiftAdd = async () => {
    if (!giftForm.name.trim()) return;
    const minAmount = giftForm.eligibility === 'any' ? 0
      : giftForm.eligibility === '1m' ? 1_000_000
      : Number(giftForm.customAmount) || 0;
    await addDoc(collection(db, 'gifts'), {
      name: giftForm.name.trim(),
      eligibility: giftForm.eligibility,
      minAmount,
      createdAt: serverTimestamp()
    });
    setGiftForm({ name: '', eligibility: 'any', customAmount: '' });
    setShowGiftAddForm(false);
  };

  const handleProductAdd = async () => {
    if (!productForm.name.trim() || !productForm.price) return;
    await addDoc(collection(db, 'products'), {
      name: productForm.name.trim(),
      price: Number(productForm.price),
      image: productForm.image || '',
      createdAt: serverTimestamp()
    });
    setProductForm({ name: '', price: '', image: '' });
    setShowProductForm(false);
  };

  const handleProductImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await compressImage(file, 600, 600, 0.6);
        setProductForm(prev => ({ ...prev, image: compressed }));
      } catch (error) {
        console.error("Failed to compress product image:", error);
      }
    }
  };

  const handleOrder = async () => {
    if (!selectedProduct || !orderForm.phone) return;
    setOrderSubmitting(true);
    try {
      await addDoc(collection(db, 'orders'), {
        productId: selectedProduct.id,
        productName: selectedProduct.name,
        productPrice: selectedProduct.price,
        orderType,
        phone: orderForm.phone,
        address: orderType === 'delivery' ? orderForm.address : '',
        timestamp: serverTimestamp()
      });
      // Delivery бол Ask Circle-д мэдэгдэл
      if (orderType === 'delivery') {
        await addDoc(collection(db, 'help_requests'), {
          name: `Захиалга: ${selectedProduct.name}`,
          phone: orderForm.phone,
          content: `Хүргэлтийн захиалга\nБараа: ${selectedProduct.name}\nҮнэ: ${Number(selectedProduct.price).toLocaleString()}₮\nХаяг: ${orderForm.address}`,
          amount: 0,
          type: 'order',
          timestamp: serverTimestamp()
        });
      }
      setSelectedProduct(null);
      setOrderForm({ phone: '', address: '' });
      setOrderType('direct');
      alert(orderType === 'delivery' ? 'Захиалга амжилттай! Бид тантай удахгүй холбогдоно.' : 'Захиалга амжилттай!');
    } catch (e) {
      console.error(e);
    } finally {
      setOrderSubmitting(false);
    }
  };

  const handleGiftPhoneCheck = () => {
    const phone = giftPhone.trim();
    if (!phone) { setGiftPhoneError('Дугаараа оруулна уу'); return; }
    const total = recentSupports
      .filter(s => s.phone === phone)
      .reduce((sum, s) => sum + (s.amount || 0), 0);
    // Check if any gift is eligible for this user
    const eligible = gifts.filter(g => total >= (g.minAmount || 0));
    if (eligible.length > 0) {
      setGiftStep('revealed');
    } else {
      setGiftStep('not-qualified');
    }
  };
  const [showIntro, setShowIntro] = useState(() => {
    return !localStorage.getItem('intro_completed');
  });
  const [showTierMenu, setShowTierMenu] = useState(false);
  const [qpayInvoice, setQpayInvoice] = useState<any>(null);
  const [onPaymentSuccess, setOnPaymentSuccess] = useState<(() => void) | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [selectedCitizen, setSelectedCitizen] = useState<any>(null);

  // Custom support form state
  const [customAmount, setCustomAmount] = useState('');
  const [supportForm, setSupportForm] = useState({ name: '', phone: '', message: '' });

  // Task form state
  const [taskForm, setTaskForm] = useState({ name: '', phone: '', description: '', additionalSupport: '' });
  const [taskImage, setTaskImage] = useState<string | null>(null);
  const [taskSupportAmount, setTaskSupportAmount] = useState<number | 'custom'>(0);
  const [customTaskSupport, setCustomTaskSupport] = useState('');

  // Team form state
  const [teamForm, setTeamForm] = useState({ name: '', phone: '', profession: '', description: '' });
  const [appForm, setAppForm] = useState({ name: '', type: '', link: '', description: '' });
  const [appLogo, setAppLogo] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCandidate, setSelectedCandidate] = useState<TeamCandidate | null>(null);
  const [activeTaskForChat, setActiveTaskForChat] = useState<Task | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatMessageInput, setChatMessageInput] = useState('');
  const [chatImage, setChatImage] = useState<string | null>(null);

  // Ask Circle state
  const [showAskMenu, setShowAskMenu] = useState(false);
  const [showHelpForm, setShowHelpForm] = useState(false);
  const [showSuggestionForm, setShowSuggestionForm] = useState(false);
  const [helpForm, setHelpForm] = useState({ name: '', phone: '', content: '' });
  const [suggestionForm, setSuggestionForm] = useState({ name: '', phone: '', content: '' });
  const [totalHelpRequests, setTotalHelpRequests] = useState(0);
  const [totalSuggestions, setTotalSuggestions] = useState(0);
  const [newNotification, setNewNotification] = useState(false);

  // CRA & CRC state
  const [allCRARatings, setAllCRARatings] = useState<CRARating[]>([]);
  const [allCRCReports, setAllCRCReports] = useState<CRCReport[]>([]);
  const [showCRARatingModal, setShowCRARatingModal] = useState(false);
  const [showCRCReportModal, setShowCRCReportModal] = useState(false);
  const [craRatingType, setCRARatingType] = useState<'free' | 'paid'>('free');
  const [crcReportType, setCRCReportType] = useState<'good' | 'bad'>('good');
  const [craRatingValue, setCRARatingValue] = useState(50);
  const [crcReportReason, setCRCReportReason] = useState('');
  const [showCRAInfo, setShowCRAInfo] = useState(false);
  const [showCRCInfo, setShowCRCInfo] = useState(false);

  // CTR state
  const [allCTRRatings, setAllCTRRatings] = useState<CTRRating[]>([]);
  const [showCTRRatingModal, setShowCTRRatingModal] = useState(false);
  const [ctrRatingType, setCTRRatingType] = useState<'free' | 'paid'>('free');
  const [ctrRatingValue, setCTRRatingValue] = useState(50);
  const [showCTRInfo, setShowCTRInfo] = useState(false);

  // Biography state
  const [allBiographyEntries, setAllBiographyEntries] = useState<BiographyEntry[]>([]);
  const [showBiographyForm, setShowBiographyForm] = useState(false);
  const [biographyForm, setBiographyForm] = useState({
    projectName: '',
    totalCost: '',
    description: '',
    imageUrl: '',
    peopleInvolved: ''
  });

  // Membership check state
  const [membershipPhone, setMembershipPhone] = useState('');
  const [membershipStatus, setMembershipStatus] = useState<{ expiresAt: Date | null; plan: string } | null>(null);
  const [isCheckingMembership, setIsCheckingMembership] = useState(false);

  // Membership purchase state
  const [showMembershipPurchaseModal, setShowMembershipPurchaseModal] = useState(false);
  const [selectedMembershipPlan, setSelectedMembershipPlan] = useState<any>(null);
  const [membershipPurchasePhone, setMembershipPurchasePhone] = useState('');

  // Lucky Draw state
  const [luckyWinner, setLuckyWinner] = useState<SupportAction | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [reelItems, setReelItems] = useState<any[]>([]);
  const [reelX, setReelX] = useState(0);
  const [reelAnimating, setReelAnimating] = useState(false);
  const [showLuckyDrawInfo, setShowLuckyDrawInfo] = useState(false);

  // Lottery state
  const [lotteries, setLotteries] = useState<Lottery[]>([]);
  const [lotteryForm, setLotteryForm] = useState({ type: '', kind: 'хожих_хүртэл' as 'хожих_хүртэл' | 'насан_туршын', price: 100000 });
  const [isSubmittingLottery, setIsSubmittingLottery] = useState(false);
  const [selectedLottery, setSelectedLottery] = useState<Lottery | null>(null);
  const [lotteryBuyForm, setLotteryBuyForm] = useState({ name: '', phone: '', number: '', useSlot: true });
  const [isSubmittingBuy, setIsSubmittingBuy] = useState(false);
  const [lotteryPurchases, setLotteryPurchases] = useState<any[]>([]);
  const [lotteryBuyKind, setLotteryBuyKind] = useState<'хожих_хүртлээ' | 'насан_туршын'>('хожих_хүртлээ');

  // Askify state
  const [askifySubTab, setAskifySubTab] = useState<'play' | 'add' | 'records'>('play');
  const [allQuestions, setAllQuestions] = useState<any[]>([]);
  const [askifyRecords, setAskifyRecords] = useState<any[]>([]);
  const [prizes, setPrizes] = useState<any[]>([]);
  // Game
  const [gameActive, setGameActive] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [shuffledQs, setShuffledQs] = useState<any[]>([]);
  const [qIndex, setQIndex] = useState(0);
  const [askScore, setAskScore] = useState(0);
  const [selectedAns, setSelectedAns] = useState<number | null>(null);
  const [ansRevealed, setAnsRevealed] = useState(false);
  const [eliminatedAnsList, setEliminatedAnsList] = useState<number[]>([]);
  const [lifelineUsed, setLifelineUsed] = useState({ callFriend: false, fiftyFifty: false, addQuestion: false });
  const [showFriendHint, setShowFriendHint] = useState(false);
  // Spin wheel
  const [showSpinWheel, setShowSpinWheel] = useState(false);
  const [isWheelSpinning, setIsWheelSpinning] = useState(false);
  const [wonPrize, setWonPrize] = useState<any | null>(null);
  const [wheelDeg, setWheelDeg] = useState(0);
  // Add question form
  const [addQForm, setAddQForm] = useState({ question: '', answers: ['', '', '', ''], correctIndex: 0, addedBy: '' });
  const [isSubmittingQ, setIsSubmittingQ] = useState(false);
  const [showAddQLifeline, setShowAddQLifeline] = useState(false);
  // Prize form (admin)
  const [prizeForm, setPrizeForm] = useState({ name: '', probability: 0.1 });
  const [isSubmittingPrize, setIsSubmittingPrize] = useState(false);
  // Record
  const [playerName, setPlayerName] = useState('');
  const [recordSaved, setRecordSaved] = useState(false);
  const [slotDigits, setSlotDigits] = useState<number[]>(Array(10).fill(0));
  const [isSlotSpinning, setIsSlotSpinning] = useState(false);
  const [slotFinalNumber, setSlotFinalNumber] = useState<string | null>(null);

  // Rating flow state
  const [ratingStep, setRatingStep] = useState<'payment' | 'rating'>('rating');

  const crcTotals = useMemo(() => {
    const good = allCRCReports.filter(r => r.type === 'good').reduce((acc, curr) => acc + curr.credit, 0);
    const bad = allCRCReports.filter(r => r.type === 'bad').reduce((acc, curr) => acc + curr.credit, 0);
    return { good, bad, total: good + bad };
  }, [allCRCReports]);

  const uniqueCitizens = useMemo(() => {
    const citizensMap = new Map<string, any>();
    
    recentSupports.forEach(support => {
      // Use phone as key, but fallback to name if phone is missing
      const key = support.phone || `no-phone-${support.name}-${support.id}`;
      const existing = citizensMap.get(key);
      if (existing) {
        existing.totalAmount += support.amount;
        existing.supportCount += 1;
        // Keep the latest info
        if (support.timestamp && (!existing.timestamp || support.timestamp.toMillis() > existing.timestamp.toMillis())) {
          existing.timestamp = support.timestamp;
          existing.name = support.name;
          existing.businessInfo = support.businessInfo || existing.businessInfo;
          existing.message = support.message || existing.message;
        }
      } else {
        citizensMap.set(key, { 
          ...support, 
          uniqueKey: key,
          totalAmount: support.amount, 
          supportCount: 1 
        });
      }
    });
    
    return Array.from(citizensMap.values()).sort((a, b) => {
      const timeA = a.timestamp?.toMillis() || 0;
      const timeB = b.timestamp?.toMillis() || 0;
      return timeB - timeA;
    });
  }, [recentSupports]);

  useEffect(() => {
    // Validate connection
    const testConnection = async () => {
      try {
        await getDocFromServer(doc(db, 'stats', 'global'));
      } catch (error) {
        if (error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration.");
        }
      }
    };
    testConnection();

    // Listen for stats
    const unsubscribeStats = onSnapshot(doc(db, 'stats', 'global'), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setStats({
          totalAmount: data.totalAmount || 0,
          totalSupporters: data.totalSupporters || 0,
          totalSupported: data.totalSupported || 0,
          totalSubscribers: data.totalSubscribers || 0,
          tierCounts: {
            starter: data.tierCounts?.starter || 0,
            star: data.tierCounts?.star || 0,
            special: data.tierCounts?.special || 0,
            super: data.tierCounts?.super || 0,
            sponsor: data.tierCounts?.sponsor || 0,
            subscription: data.tierCounts?.subscription || 0,
          },
          profileImageUrl: data.profileImageUrl || '',
          coverImageUrl: data.coverImageUrl || '',
          totalHelpRequests: data.totalHelpRequests || 0,
          totalSuggestions: data.totalSuggestions || 0
        });
        setTotalHelpRequests(data.totalHelpRequests || 0);
        setTotalSuggestions(data.totalSuggestions || 0);
      }
    }, (error) => handleFirestoreError(error, OperationType.GET, 'stats/global'));

    // Listen for recent supports
    const q = query(collection(db, 'supports'), orderBy('timestamp', 'desc'), limit(100));
    const unsubscribeSupports = onSnapshot(q, (snapshot) => {
      const supports = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SupportAction));
      setRecentSupports(supports);
    }, (error) => handleFirestoreError(error, OperationType.GET, 'supports'));

    // Listen for tasks
    const tasksQuery = query(collection(db, 'tasks'), orderBy('timestamp', 'desc'));
    const unsubscribeTasks = onSnapshot(tasksQuery, (snapshot) => {
      const tasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task));
      setAllTasks(tasks);
    }, (error) => handleFirestoreError(error, OperationType.GET, 'tasks'));

    // Listen for team candidates
    const teamQuery = query(collection(db, 'team_candidates'), orderBy('votes', 'desc'));
    const unsubscribeTeam = onSnapshot(teamQuery, (snapshot) => {
      const candidates = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TeamCandidate));
      setTeamCandidates(candidates);
    }, (error) => handleFirestoreError(error, OperationType.GET, 'team_candidates'));

    return () => {
      unsubscribeStats();
      unsubscribeSupports();
      unsubscribeTasks();
      unsubscribeTeam();
    };
  }, []);

  // Current user doc (for admin check)
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;
    getDoc(doc(db, 'users', user.uid)).then(snap => {
      if (snap.exists()) setCurrentUserDoc(snap.data());
    }).catch(() => {});
  }, []);

  // Notification effect for Ask Circle
  useEffect(() => {
    const qHelp = query(collection(db, 'help_requests'), orderBy('timestamp', 'desc'), limit(1));
    const unsubscribeHelp = onSnapshot(qHelp, (snapshot) => {
      if (!snapshot.empty) {
        setNewNotification(true);
        setTimeout(() => setNewNotification(false), 5000);
      }
    }, (error) => handleFirestoreError(error, OperationType.GET, 'help_requests'));

    const qSug = query(collection(db, 'suggestions'), orderBy('timestamp', 'desc'), limit(1));
    const unsubscribeSug = onSnapshot(qSug, (snapshot) => {
      if (!snapshot.empty) {
        setNewNotification(true);
        setTimeout(() => setNewNotification(false), 5000);
      }
    }, (error) => handleFirestoreError(error, OperationType.GET, 'suggestions'));

    const qOrders = query(collection(db, 'orders'), orderBy('timestamp', 'desc'), limit(1));
    const unsubscribeOrders = onSnapshot(qOrders, (snapshot) => {
      if (!snapshot.empty) {
        const latest = snapshot.docs[0].data();
        if (latest.timestamp && (Date.now() - latest.timestamp.toDate().getTime() < 10000)) {
          setNewNotification(true);
          setTimeout(() => setNewNotification(false), 5000);
        }
      }
    }, (error) => handleFirestoreError(error, OperationType.GET, 'orders'));

    const qAllOrders = query(collection(db, 'orders'), orderBy('timestamp', 'desc'));
    const unsubscribeAllOrders = onSnapshot(qAllOrders, (snapshot) => {
      setAllOrders(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    }, () => {});

    const qApps = query(collection(db, 'apps'), orderBy('timestamp', 'desc'));
    const unsubscribeApps = onSnapshot(qApps, (snapshot) => {
      const apps = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AppEntry));
      setAllApps(apps);
    }, (error) => handleFirestoreError(error, OperationType.GET, 'apps'));

    const qCRA = query(collection(db, 'cra_ratings'), orderBy('timestamp', 'desc'));
    const unsubscribeCRA = onSnapshot(qCRA, (snapshot) => {
      const ratings = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CRARating));
      setAllCRARatings(ratings);
    }, (error) => handleFirestoreError(error, OperationType.GET, 'cra_ratings'));

    const qCRC = query(collection(db, 'crc_reports'), orderBy('timestamp', 'desc'));
    const unsubscribeCRC = onSnapshot(qCRC, (snapshot) => {
      const reports = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CRCReport));
      setAllCRCReports(reports);
    }, (error) => handleFirestoreError(error, OperationType.GET, 'crc_reports'));

    const qCTR = query(collection(db, 'ctr_ratings'), orderBy('timestamp', 'desc'));
    const unsubscribeCTR = onSnapshot(qCTR, (snapshot) => {
      const ratings = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CTRRating));
      setAllCTRRatings(ratings);
    }, (error) => handleFirestoreError(error, OperationType.GET, 'ctr_ratings'));

    const qBio = query(collection(db, 'biography_entries'), orderBy('timestamp', 'desc'));
    const unsubscribeBio = onSnapshot(qBio, (snapshot) => {
      const entries = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BiographyEntry));
      setAllBiographyEntries(entries);
    }, (error) => handleFirestoreError(error, OperationType.GET, 'biography_entries'));

    const qWebsites = query(collection(db, 'completed_websites'), orderBy('timestamp', 'desc'));
    const unsubscribeWebsites = onSnapshot(qWebsites, (snapshot) => {
      const websites = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CompletedWebsite));
      setCompletedWebsites(websites);
    }, (error) => handleFirestoreError(error, OperationType.GET, 'completed_websites'));

    const qLotteries = query(collection(db, 'lotteries'), orderBy('timestamp', 'desc'));
    const unsubscribeLotteries = onSnapshot(qLotteries, (snapshot) => {
      setLotteries(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Lottery)));
    });

    const qLotteryPurchases = query(collection(db, 'lottery_purchases'), orderBy('timestamp', 'desc'));
    const unsubscribeLotteryPurchases = onSnapshot(qLotteryPurchases, (snapshot) => {
      setLotteryPurchases(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const qQuestions = query(collection(db, 'askify_questions'), orderBy('timestamp', 'desc'));
    const unsubscribeQuestions = onSnapshot(qQuestions, (snap) => {
      setAllQuestions(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    const qAskifyRecords = query(collection(db, 'askify_records'), orderBy('score', 'desc'));
    const unsubscribeAskifyRecords = onSnapshot(qAskifyRecords, (snap) => {
      setAskifyRecords(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    const qPrizes = query(collection(db, 'askify_prizes'), orderBy('timestamp', 'desc'));
    const unsubscribePrizes = onSnapshot(qPrizes, (snap) => {
      setPrizes(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    const qGifts = query(collection(db, 'gifts'), orderBy('createdAt', 'desc'));
    const unsubscribeGifts = onSnapshot(qGifts, (snapshot) => {
      setGifts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const qProducts = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
    const unsubscribeProducts = onSnapshot(qProducts, (snapshot) => {
      setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const qAccess = query(collection(db, 'access_list'), orderBy('createdAt', 'desc'));
    const unsubscribeAccess = onSnapshot(qAccess, (snapshot) => {
      setAccessList(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, () => {});

    const qAnnouncements = query(collection(db, 'announcements'), orderBy('createdAt', 'desc'));
    const unsubscribeAnnouncements = onSnapshot(qAnnouncements, (snapshot) => {
      setAnnouncements(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, () => {});

    const qRegisteredUsers = query(collection(db, 'user_ids'), orderBy('userNumber', 'asc'));
    const unsubscribeRegisteredUsers = onSnapshot(qRegisteredUsers, (snapshot) => {
      setRegisteredUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, () => {});

    return () => {
      unsubscribeHelp();
      unsubscribeSug();
      unsubscribeOrders();
      unsubscribeApps();
      unsubscribeCRA();
      unsubscribeCRC();
      unsubscribeCTR();
      unsubscribeBio();
      unsubscribeWebsites();
      unsubscribeLotteries();
      unsubscribeLotteryPurchases();
      unsubscribeQuestions();
      unsubscribeAskifyRecords();
      unsubscribePrizes();
      unsubscribeGifts();
      unsubscribeProducts();
      unsubscribeAccess();
      unsubscribeAnnouncements();
      unsubscribeRegisteredUsers();
      unsubscribeAllOrders();
    };
  }, []);

  // User ID system
  useEffect(() => {
    // 1. Free 10-digit ID — assigned immediately on first visit (no Firestore)
    let storedFreeId = localStorage.getItem('free_user_id');
    if (!storedFreeId) {
      storedFreeId = String(Math.floor(1000000000 + Math.random() * 9000000000));
      localStorage.setItem('free_user_id', storedFreeId);
      setIsNewUser(true);
    }
    setFreeUserId(storedFreeId);

    // 2. Paid sequential # — only set after confirmed payment
    const storedPaidNumber = localStorage.getItem('paid_user_number');
    const storedPaidAt = localStorage.getItem('paid_created_at');
    if (storedPaidNumber) {
      setUserNumber(Number(storedPaidNumber));
      const createdAt = storedPaidAt ? new Date(storedPaidAt) : new Date();
      setIsEarlyUser(createdAt <= DIAMOND_CUTOFF);
    }
  }, []);

  useEffect(() => {
    if (!activeTaskForChat) {
      setChatMessages([]);
      return;
    }

    const q = query(
      collection(db, 'tasks', activeTaskForChat.id, 'messages'),
      orderBy('timestamp', 'asc')
    );

    const unsubscribeMessages = onSnapshot(q, (snapshot) => {
      const messages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ChatMessage));
      setChatMessages(messages);
    }, (error) => handleFirestoreError(error, OperationType.GET, `tasks/${activeTaskForChat.id}/messages`));

    return () => unsubscribeMessages();
  }, [activeTaskForChat]);

  const handleToggleSupport = async () => {
    setShowQuickSupportModal(true);
  };

  const handleConfirmQuickSupport = async (data: { name: string; phone: string }) => {
    try {
      setIsSubmitting(true);
      const statsRef = doc(db, 'stats', 'global');
      
      // Add a support record
      await addDoc(collection(db, 'supports'), {
        name: data.name,
        phone: data.phone,
        amount: 0,
        tier: 'starter',
        timestamp: serverTimestamp()
      });

      await setDoc(statsRef, {
        totalSupporters: increment(1)
      }, { merge: true });

      setShowQuickSupportModal(false);
    } catch (error) {
      console.error("Failed to confirm support:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGiveTask = async () => {
    const minFee = 1000000;

    if (!taskForm.name || !taskForm.phone || !taskForm.description) return;

    const finalSupportAmount = taskSupportAmount === 'custom' ? Number(customTaskSupport) : taskSupportAmount;
    
    if (finalSupportAmount < minFee) {
      alert("Даалгавар өгөхийн тулд 1,000,000₮ ба түүнээс дээш дэмжлэг өгөх шаардлагатай.");
      return;
    }

    const processGiveTask = async () => {
      setIsSubmitting(true);
      try {
        await addDoc(collection(db, 'tasks'), {
          name: taskForm.name,
          phone: taskForm.phone,
          description: taskForm.description,
          imageUrl: taskImage,
          supportAmount: finalSupportAmount,
          likes: 0,
          dislikes: 0,
          superSupportTotal: 0,
          status: 'pending',
          timestamp: serverTimestamp()
        });

        const statsRef = doc(db, 'stats', 'global');
        await setDoc(statsRef, {
          totalAmount: increment(finalSupportAmount)
        }, { merge: true });

        setTaskForm({ name: '', phone: '', description: '', additionalSupport: '' });
        setTaskImage(null);
        setTaskSupportAmount(0);
        setCustomTaskSupport('');
        setTaskTab(1); // Switch to list (index 1 now)
      } catch (error) {
        console.error("Failed to add task:", error);
      } finally {
        setIsSubmitting(false);
      }
    };

    // Trigger QPay
    try {
      setIsSubmitting(true);
      const response = await axios.post('/api/qpay/invoice', {
        amount: finalSupportAmount,
        description: `Task Support: ${taskForm.name}`,
        senderPhone: taskForm.phone
      });
      setQpayInvoice(response.data);
      setOnPaymentSuccess(() => processGiveTask);
    } catch (error) {
      console.error("QPay invoice creation failed:", error);
      alert("Төлбөрийн нэхэмжлэх үүсгэхэд алдаа гарлаа.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAskHelp = async () => {
    if (!helpForm.name || !helpForm.phone || !helpForm.content) return;

    const amount = 20000;
    
    const processHelp = async () => {
      setIsSubmitting(true);
      try {
        await addDoc(collection(db, 'help_requests'), {
          name: helpForm.name,
          phone: helpForm.phone,
          content: helpForm.content,
          amount: amount,
          timestamp: serverTimestamp()
        });

        const statsRef = doc(db, 'stats', 'global');
        await setDoc(statsRef, {
          totalAmount: increment(amount),
          totalHelpRequests: increment(1)
        }, { merge: true });

        setHelpForm({ name: '', phone: '', content: '' });
        setShowHelpForm(false);
        setShowAskMenu(false);
      } catch (error) {
        console.error("Failed to submit help request:", error);
      } finally {
        setIsSubmitting(false);
      }
    };

    setQpayInvoice(null);
    try {
      setIsSubmitting(true);
      const response = await axios.post('/api/qpay/invoice', {
        amount: amount,
        description: `Help Request: ${helpForm.name}`,
        senderPhone: helpForm.phone
      });
      setQpayInvoice(response.data);
      setOnPaymentSuccess(() => processHelp);
    } catch (error) {
      console.error("QPay Error:", error);
      alert("Төлбөрийн нэхэмжлэх үүсгэхэд алдаа гарлаа.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendSuggestion = async () => {
    if (!suggestionForm.name || !suggestionForm.phone || !suggestionForm.content) return;

    const amount = 0;
    
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'suggestions'), {
        name: suggestionForm.name,
        phone: suggestionForm.phone,
        content: suggestionForm.content,
        amount: amount,
        timestamp: serverTimestamp()
      });

      const statsRef = doc(db, 'stats', 'global');
      await setDoc(statsRef, {
        totalSuggestions: increment(1)
      }, { merge: true });

      setSuggestionForm({ name: '', phone: '', content: '' });
      setShowSuggestionForm(false);
      setShowAskMenu(false);
    } catch (error) {
      console.error("Failed to submit suggestion:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddApp = async () => {
    if (!appForm.name || !appForm.type || !appForm.link || !appForm.description || !appLogo) {
      alert("Бүх талбарыг бөглөнө үү.");
      return;
    }

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'apps'), {
        ...appForm,
        logoUrl: appLogo,
        timestamp: serverTimestamp()
      });
      setAppForm({ name: '', type: '', link: '', description: '' });
      setAppLogo(null);
      setAppsTab(1); // Switch to App List
    } catch (error) {
      console.error("Failed to add app:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGiveCRARating = async () => {
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'cra_ratings'), {
        type: craRatingType,
        rating: craRatingValue,
        timestamp: serverTimestamp()
      });
      setShowCRARatingModal(false);
      setRatingStep('rating'); // Reset for next time
    } catch (error) {
      console.error("Failed to give CRA rating:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGiveCTRRating = async () => {
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'ctr_ratings'), {
        type: ctrRatingType,
        rating: ctrRatingValue,
        timestamp: serverTimestamp()
      });
      setShowCTRRatingModal(false);
      setRatingStep('rating'); // Reset for next time
    } catch (error) {
      console.error("Failed to give CTR rating:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegisterBiography = async () => {
    if (!biographyForm.projectName || !biographyForm.totalCost || !biographyForm.description || !biographyForm.peopleInvolved) {
      alert("Бүх талбарыг бөглөнө үү.");
      return;
    }

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'biography_entries'), {
        projectName: biographyForm.projectName,
        totalCost: Number(biographyForm.totalCost),
        description: biographyForm.description,
        imageUrl: biographyForm.imageUrl || `https://picsum.photos/seed/${biographyForm.projectName}/800/600`,
        peopleInvolved: biographyForm.peopleInvolved,
        timestamp: serverTimestamp()
      });
      setBiographyForm({
        projectName: '',
        totalCost: '',
        description: '',
        imageUrl: '',
        peopleInvolved: ''
      });
      setShowBiographyForm(false);
    } catch (error) {
      console.error("Failed to register biography:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCheckMembership = async (phone: string) => {
    if (!phone.trim()) return;
    setIsCheckingMembership(true);
    try {
      const userSupports = recentSupports.filter(s => s.phone === phone.trim() && s.isSubscription);
      if (userSupports.length > 0) {
        const latest = [...userSupports].sort((a, b) => (b.timestamp?.toMillis() || 0) - (a.timestamp?.toMillis() || 0))[0];
        const startDate = latest.timestamp?.toDate() || new Date();
        const expiresAt = new Date(startDate);
        if (latest.message.includes('Super VIP')) {
          expiresAt.setFullYear(expiresAt.getFullYear() + 100); // Lifetime
        } else {
          expiresAt.setMonth(expiresAt.getMonth() + 1);
        }
        setMembershipStatus({ expiresAt, plan: latest.message.replace(' Membership авах хүсэлтэй', '') });
      } else {
        setMembershipStatus({ expiresAt: null, plan: '' });
      }
    } finally {
      setIsCheckingMembership(false);
    }
  };

  const handleMembershipPurchase = async () => {
    if (!selectedMembershipPlan || !membershipPurchasePhone.trim()) return;

    const prices: Record<string, number> = {
      'Bronze': 1000,
      'Silver': 5000,
      'Gold': 10000,
      'Diamond': 20000,
      'VIP': 50000,
      'Super VIP': 1000000
    };

    const amount = prices[selectedMembershipPlan.name] || 1000;
    
    const processMembership = async () => {
      setIsSubmitting(true);
      try {
        await addDoc(collection(db, 'supports'), {
          name: membershipPurchasePhone.trim(),
          phone: membershipPurchasePhone.trim(),
          amount: amount,
          message: `${selectedMembershipPlan.name} Membership авах хүсэлтэй`,
          tier: 'subscription',
          isSubscription: true,
          timestamp: serverTimestamp()
        });

        const statsRef = doc(db, 'stats', 'global');
        await setDoc(statsRef, {
          totalAmount: increment(amount),
          totalSubscribers: increment(1)
        }, { merge: true });

        setShowMembershipPurchaseModal(false);
        setMembershipPurchasePhone('');
        setSelectedMembershipPlan(null);
        alert('Гишүүнчлэл амжилттай идэвхжлээ!');
      } catch (error) {
        console.error("Failed to process membership:", error);
      } finally {
        setIsSubmitting(false);
      }
    };

    try {
      setIsSubmitting(true);
      const response = await axios.post('/api/qpay/invoice', {
        amount: amount,
        description: `Membership: ${selectedMembershipPlan.name}`,
        senderPhone: membershipPurchasePhone.trim()
      });
      setQpayInvoice(response.data);
      setOnPaymentSuccess(() => processMembership);
    } catch (error) {
      console.error("QPay Error:", error);
      alert("Төлбөрийн нэхэмжлэх үүсгэхэд алдаа гарлаа.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLuckyDraw = () => {
    if (recentSupports.length === 0) return;

    const WINNER_IDX = 40;
    const ITEM_TOTAL = 118; // 110px card + 8px gap

    // Pick winner
    const winner = recentSupports[Math.floor(Math.random() * recentSupports.length)];

    // Build 50-item reel, winner placed at WINNER_IDX
    const items: any[] = Array.from({ length: 50 }, (_, i) =>
      i === WINNER_IDX
        ? winner
        : recentSupports[Math.floor(Math.random() * recentSupports.length)]
    );

    // Reset reel then animate
    setReelAnimating(false);
    setReelX(0);
    setReelItems(items);
    setLuckyWinner(null);
    setIsSpinning(true);

    // Start scroll after first paint
    setTimeout(() => {
      setReelAnimating(true);
      setReelX(-(WINNER_IDX * ITEM_TOTAL));
    }, 100);

    // Finalize after animation (4s) + delay (100ms) + buffer (400ms)
    setTimeout(() => {
      setIsSpinning(false);
      setLuckyWinner(winner);
      setReelAnimating(false);
    }, 4500);
  };

  const handleSlotSpin = () => {
    if (isSlotSpinning) return;
    setIsSlotSpinning(true);
    setSlotFinalNumber(null);

    const finalNum = String(Math.floor(1000000000 + Math.random() * 9000000000));
    const finalDigits = finalNum.split('').map(Number);

    let frame = 0;
    const totalFrames = 50;
    const timer = setInterval(() => {
      frame++;
      if (frame < totalFrames) {
        setSlotDigits(Array(10).fill(0).map((_, i) => {
          const stopFrame = Math.floor(totalFrames * 0.4) + i * 3;
          if (frame >= stopFrame) return finalDigits[i];
          return Math.floor(Math.random() * 10);
        }));
      } else {
        clearInterval(timer);
        setSlotDigits(finalDigits);
        setSlotFinalNumber(finalNum);
        setIsSlotSpinning(false);
      }
    }, 50);
  };

  const handleAddLottery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lotteryForm.type) return;
    setIsSubmittingLottery(true);
    const price = lotteryForm.kind === 'насан_туршын' ? 250000 : lotteryForm.price;
    try {
      await addDoc(collection(db, 'lotteries'), {
        type: lotteryForm.type,
        kind: lotteryForm.kind,
        price,
        isActive: true,
        timestamp: serverTimestamp(),
      });
      setLotteryForm({ type: '', kind: 'хожих_хүртэл', price: 100000 });
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmittingLottery(false);
    }
  };

  const handleLotteryPurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lotteryBuyForm.name || !lotteryBuyForm.phone) return;
    const number = lotteryBuyForm.useSlot ? (slotFinalNumber || '') : lotteryBuyForm.number;
    if (!number || number.length !== 10) {
      alert('10 оронтой дугаар оруулна уу.');
      return;
    }
    const price = lotteryBuyKind === 'насан_туршын' ? 250000 : 100000;

    const processPurchase = async () => {
      await addDoc(collection(db, 'lottery_purchases'), {
        kind: lotteryBuyKind,
        price,
        name: lotteryBuyForm.name,
        phone: lotteryBuyForm.phone,
        number,
        timestamp: serverTimestamp(),
      });
      setLotteryBuyForm({ name: '', phone: '', number: '', useSlot: true });
    };

    setIsSubmittingBuy(true);
    try {
      const response = await axios.post('/api/qpay/invoice', {
        amount: price,
        description: `Сугалаа: ${lotteryBuyKind === 'насан_туршын' ? 'Насан Туршын' : 'Хожих Хүртлээ'}`,
        senderPhone: lotteryBuyForm.phone,
      });
      setQpayInvoice(response.data);
      setOnPaymentSuccess(() => processPurchase);
    } catch {
      alert('Төлбөрийн нэхэмжлэх үүсгэхэд алдаа гарлаа.');
    } finally {
      setIsSubmittingBuy(false);
    }
  };

  // ── Askify handlers ──
  const startGame = () => {
    if (allQuestions.length === 0) return;
    const shuffled = [...allQuestions].sort(() => Math.random() - 0.5);
    setShuffledQs(shuffled);
    setQIndex(0);
    setAskScore(0);
    setSelectedAns(null);
    setAnsRevealed(false);
    setEliminatedAnsList([]);
    setLifelineUsed({ callFriend: false, fiftyFifty: false, addQuestion: false });
    setShowFriendHint(false);
    setGameOver(false);
    setGameActive(true);
    setRecordSaved(false);
    setPlayerName('');
    setWonPrize(null);
    setShowSpinWheel(false);
  };

  const handleAnswer = (idx: number) => {
    if (ansRevealed || selectedAns !== null) return;
    setSelectedAns(idx);
    setAnsRevealed(true);
    const correct = shuffledQs[qIndex]?.correctIndex;
    if (idx === correct) {
      setTimeout(() => {
        const nextScore = askScore + 1;
        setAskScore(nextScore);
        if (qIndex + 1 >= shuffledQs.length) {
          setGameOver(true);
          setGameActive(false);
        } else {
          setQIndex(q => q + 1);
          setSelectedAns(null);
          setAnsRevealed(false);
          setEliminatedAnsList([]);
          setShowFriendHint(false);
        }
      }, 1000);
    } else {
      setTimeout(() => {
        setGameOver(true);
        setGameActive(false);
      }, 1200);
    }
  };

  const useLifelineFiftyFifty = () => {
    if (lifelineUsed.fiftyFifty) return;
    setLifelineUsed(l => ({ ...l, fiftyFifty: true }));
    const correct = shuffledQs[qIndex]?.correctIndex;
    const wrongs = [0, 1, 2, 3].filter(i => i !== correct);
    const toEliminate = wrongs.sort(() => Math.random() - 0.5).slice(0, 2);
    setEliminatedAnsList(toEliminate);
  };

  const useLifelineCallFriend = () => {
    if (lifelineUsed.callFriend) return;
    setLifelineUsed(l => ({ ...l, callFriend: true }));
    setShowFriendHint(true);
  };

  const handleSpinWheel = () => {
    if (prizes.length === 0 || isWheelSpinning) return;
    setIsWheelSpinning(true);
    setWonPrize(null);

    // Weighted random pick
    const totalProb = prizes.reduce((s: number, p: any) => s + (p.probability || 1), 0);
    let rand = Math.random() * totalProb;
    let picked = prizes[prizes.length - 1];
    for (const p of prizes) {
      rand -= (p.probability || 1);
      if (rand <= 0) { picked = p; break; }
    }

    // Animate
    const spins = 5;
    const finalDeg = wheelDeg + spins * 360 + Math.floor(Math.random() * 360);
    setWheelDeg(finalDeg);

    setTimeout(() => {
      setIsWheelSpinning(false);
      setWonPrize(picked);
    }, 3500);
  };

  const handleSaveRecord = async () => {
    if (!playerName.trim() || recordSaved) return;
    await addDoc(collection(db, 'askify_records'), {
      name: playerName.trim(),
      score: askScore,
      timestamp: serverTimestamp(),
    });
    setRecordSaved(true);
    setShowSpinWheel(true);
  };

  const handleAddQuestionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addQForm.question || addQForm.answers.some(a => !a) || !addQForm.addedBy) return;
    setIsSubmittingQ(true);
    try {
      await addDoc(collection(db, 'askify_questions'), {
        question: addQForm.question,
        answers: addQForm.answers,
        correctIndex: addQForm.correctIndex,
        addedBy: addQForm.addedBy,
        timestamp: serverTimestamp(),
      });
      setAddQForm({ question: '', answers: ['', '', '', ''], correctIndex: 0, addedBy: '' });
    } catch (e) { console.error(e); }
    finally { setIsSubmittingQ(false); }
  };

  const handleAddQuestionWithPay = async () => {
    if (!addQForm.question || addQForm.answers.some(a => !a) || !addQForm.addedBy) {
      alert('Бүх талбарыг бөглөнө үү.');
      return;
    }
    const processAddQ = async () => {
      await addDoc(collection(db, 'askify_questions'), {
        question: addQForm.question,
        answers: addQForm.answers,
        correctIndex: addQForm.correctIndex,
        addedBy: addQForm.addedBy,
        timestamp: serverTimestamp(),
      });
      setAddQForm({ question: '', answers: ['', '', '', ''], correctIndex: 0, addedBy: '' });
      setShowAddQLifeline(false);
      if (gameActive) {
        // skip current question
        if (qIndex + 1 >= shuffledQs.length) {
          setGameOver(true); setGameActive(false);
        } else {
          setQIndex(q => q + 1);
          setSelectedAns(null); setAnsRevealed(false); setEliminatedAnsList([]);
        }
      }
      setLifelineUsed(l => ({ ...l, addQuestion: true }));
    };
    try {
      const response = await axios.post('/api/qpay/invoice', {
        amount: 5000,
        description: 'Askify: Асуулт нэмэх',
        senderPhone: addQForm.addedBy,
      });
      setQpayInvoice(response.data);
      setOnPaymentSuccess(() => processAddQ);
    } catch {
      alert('Төлбөрийн нэхэмжлэх үүсгэхэд алдаа гарлаа.');
    }
  };

  const handleAddPrize = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prizeForm.name) return;
    setIsSubmittingPrize(true);
    try {
      await addDoc(collection(db, 'askify_prizes'), {
        name: prizeForm.name,
        probability: prizeForm.probability,
        timestamp: serverTimestamp(),
      });
      setPrizeForm({ name: '', probability: 0.1 });
    } catch (e) { console.error(e); }
    finally { setIsSubmittingPrize(false); }
  };

  const handleGiveCRCReport = async (reason: string, credit: number) => {
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'crc_reports'), {
        type: crcReportType,
        reason,
        credit,
        timestamp: serverTimestamp()
      });
      setShowCRCReportModal(false);
    } catch (error) {
      console.error("Failed to give CRC report:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await compressImage(file, 1000, 1000, 0.6);
        setTaskImage(compressed);
      } catch (error) {
        console.error("Failed to compress image:", error);
      }
    }
  };

  const handleLikeTask = async (taskId: string) => {
    const processLike = async () => {
      try {
        const taskRef = doc(db, 'tasks', taskId);
        await setDoc(taskRef, { likes: increment(1) }, { merge: true });
        
        // Also update global stats for the 500₮ like
        const statsRef = doc(db, 'stats', 'global');
        await setDoc(statsRef, { totalAmount: increment(500) }, { merge: true });
      } catch (error) {
        console.error("Failed to like task:", error);
      }
    };

    // Trigger QPay for Like (500₮)
    try {
      setIsSubmitting(true);
      const response = await axios.post('/api/qpay/invoice', {
        amount: 500,
        description: `Task Like: ${taskId}`,
      });
      setQpayInvoice(response.data);
      setOnPaymentSuccess(() => processLike);
    } catch (error) {
      console.error("QPay invoice creation failed:", error);
      alert("Төлбөрийн нэхэмжлэх үүсгэхэд алдаа гарлаа.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDislikeTask = async (taskId: string) => {
    try {
      const taskRef = doc(db, 'tasks', taskId);
      await setDoc(taskRef, { dislikes: increment(1) }, { merge: true });
    } catch (error) {
      console.error("Failed to dislike task:", error);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      await deleteDoc(doc(db, 'tasks', taskId));
    } catch (error) {
      console.error("Failed to delete task:", error);
    }
  };

  const handleAddAccess = async () => {
    if (!addAccessForm.email.trim() || !addAccessForm.password.trim()) return;
    await addDoc(collection(db, 'access_list'), {
      ...addAccessForm,
      createdAt: serverTimestamp()
    });
    setAddAccessForm({ name: '', email: '', password: '', role: 'admin' });
    setShowAddAccessForm(false);
  };

  const handleDeleteAccess = async (id: string) => {
    await deleteDoc(doc(db, 'access_list', id));
  };

  const handleAddAnnouncement = async () => {
    if (!announceForm.title.trim()) return;
    await addDoc(collection(db, 'announcements'), {
      ...announceForm,
      createdAt: serverTimestamp()
    });
    setAnnounceForm({ title: '', content: '' });
    setShowAnnounceForm(false);
  };

  const handleDeleteAnnouncement = async (id: string) => {
    await deleteDoc(doc(db, 'announcements', id));
  };

  const handleDeleteCitizen = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'supports', id));
    } catch (error: any) {
      console.error('Delete citizen failed:', error);
      alert('Устгахад алдаа гарлаа: ' + (error?.message || String(error)));
    }
  };

  const handleUpdateSiteProfile = async (fullName: string, username: string) => {
    const statsRef = doc(db, 'stats', 'global');
    await setDoc(statsRef, { fullName, username }, { merge: true });
  };

  const handleRegisterTeam = async () => {
    if (!teamForm.name || !teamForm.phone || !teamForm.profession || !teamForm.description) return;

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'team_candidates'), {
        ...teamForm,
        votes: 0,
        isTeamMember: false,
        timestamp: serverTimestamp()
      });
      setTeamForm({ name: '', phone: '', profession: '', description: '' });
      setTeamTab(1); // Switch to candidates list
    } catch (error) {
      console.error("Failed to register for team:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVoteCandidate = async (candidateId: string) => {
    try {
      const candidateRef = doc(db, 'team_candidates', candidateId);
      await setDoc(candidateRef, { votes: increment(1) }, { merge: true });
    } catch (error) {
      console.error("Failed to vote for candidate:", error);
    }
  };

  const handleTakeTask = async (task: Task) => {
    try {
      const taskRef = doc(db, 'tasks', task.id);
      await setDoc(taskRef, { 
        status: 'in-progress',
        takenBy: 'Мэргэжилтэн' // In a real app, this would be the logged-in user's name
      }, { merge: true });
      setActiveTaskForChat(task);
    } catch (error) {
      console.error("Failed to take task:", error);
    }
  };

  const handleSendMessage = async () => {
    if (!activeTaskForChat || (!chatMessageInput.trim() && !chatImage)) return;

    try {
      await addDoc(collection(db, 'tasks', activeTaskForChat.id, 'messages'), {
        senderName: 'Мэргэжилтэн', // In a real app, this would be the logged-in user's name
        text: chatMessageInput.trim(),
        imageUrl: chatImage,
        likes: 0,
        timestamp: serverTimestamp()
      });
      setChatMessageInput('');
      setChatImage(null);
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  const handleLikeMessage = async (messageId: string) => {
    if (!activeTaskForChat) return;
    try {
      const msgRef = doc(db, 'tasks', activeTaskForChat.id, 'messages', messageId);
      await setDoc(msgRef, { likes: increment(1) }, { merge: true });
    } catch (error) {
      console.error("Failed to like message:", error);
    }
  };

  const handleChatImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await compressImage(file, 800, 800, 0.5);
        setChatImage(compressed);
      } catch (error) {
        console.error("Failed to compress image:", error);
      }
    }
  };

  const handleProfileImageUpdate = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        setIsUpdatingProfile(true);
        const compressed = await compressImage(file, 400, 400, 0.7);
        const statsRef = doc(db, 'stats', 'global');
        await setDoc(statsRef, { profileImageUrl: compressed }, { merge: true });
      } catch (error) {
        console.error("Failed to update profile image:", error);
      } finally {
        setIsUpdatingProfile(false);
      }
    }
  };

  const handleCoverImageUpdate = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        setIsUpdatingCover(true);
        // Compressed more to avoid Firestore 1MB limit
        const compressed = await compressImage(file, 1000, 600, 0.5);
        const statsRef = doc(db, 'stats', 'global');
        await setDoc(statsRef, { coverImageUrl: compressed }, { merge: true });
      } catch (error) {
        console.error("Failed to update cover image:", error);
      } finally {
        setIsUpdatingCover(false);
      }
    }
  };

  const handleSuperSupportTask = async (taskId: string, amount: number) => {
    try {
      const taskRef = doc(db, 'tasks', taskId);
      await setDoc(taskRef, { superSupportTotal: increment(amount) }, { merge: true });
      
      const statsRef = doc(db, 'stats', 'global');
      await setDoc(statsRef, { totalAmount: increment(amount) }, { merge: true });
    } catch (error) {
      console.error("Failed to super support task:", error);
    }
  };

  const handleSupport = async (data: { name: string; phone: string; message: string, amount?: number, tier?: SupportTier }) => {
    const tier = data.tier || selectedTier;
    if (!tier && !data.amount) return;

    const config = tier ? TIER_CONFIG[tier] : null;
    const finalAmount = data.amount || (config ? config.amount : 0);

    // 1. Register user to user_ids and show welcome popup immediately on form submit
    if (userNumber !== null && data.name) {
      try {
        await setDoc(doc(db, 'user_ids', String(userNumber)), {
          name: data.name,
          phone: data.phone,
          userNumber: userNumber,
          isEarlyUser: isEarlyUser,
          registeredAt: serverTimestamp(),
          source: 'support',
        }, { merge: true });
      } catch {}
      setShowWelcomeNotif(true);
    }

    const processSupport = async () => {
      setIsSubmitting(true);
      try {
        // Add support document
        await addDoc(collection(db, 'supports'), {
          name: data.name,
          phone: data.phone,
          message: data.message,
          amount: finalAmount,
          tier: tier || 'starter',
          isSubscription: tier === 'subscription',
          userNumber: userNumber,
          timestamp: serverTimestamp()
        });

        // Update global stats
        const statsRef = doc(db, 'stats', 'global');
        const updateData: any = {
          totalAmount: increment(finalAmount),
          totalSupporters: increment(1),
        };

        if (tier) {
          updateData[`tierCounts.${tier}`] = increment(1);
          if (tier === 'subscription') {
            updateData.totalSubscribers = increment(1);
          }
        }

        await setDoc(statsRef, updateData, { merge: true });

        setSelectedTier(null);
        setSupportForm({ name: '', phone: '', message: '' });
        setCustomAmount('');
        if (activeTab === 'support') setActiveTab('home');
      } catch (error) {
        console.error("Support failed:", error);
      } finally {
        setIsSubmitting(false);
      }
    };

    // Trigger QPay
    try {
      setIsSubmitting(true);
      const response = await axios.post('/api/qpay/invoice', {
        amount: finalAmount,
        description: `Support: ${data.name}`,
        senderPhone: data.phone
      });
      setQpayInvoice(response.data);
      setOnPaymentSuccess(() => processSupport);
    } catch (error) {
      console.error("QPay invoice creation failed:", error);
      alert("Төлбөрийн нэхэмжлэх үүсгэхэд алдаа гарлаа.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSuperSupport = async (data: { amount: number }) => {
    if (!data.amount) return;
    
    setIsSubmitting(true);
    try {
      // 1. Add support document
      await addDoc(collection(db, 'supports'), {
        name: 'Super Supporter',
        phone: 'Нууцлагдсан',
        message: 'Super Support!',
        amount: data.amount,
        tier: 'super',
        timestamp: serverTimestamp()
      });

      // 2. Update global stats
      const statsRef = doc(db, 'stats', 'global');
      await setDoc(statsRef, {
        totalAmount: increment(data.amount),
        totalSupporters: increment(1),
        'tierCounts.super': increment(1)
      }, { merge: true });

      setShowSuperModal(false);
    } catch (error) {
      console.error("Super support failed:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSupportOthers = async (data: { phone: string; amount: number }) => {
    if (!data.phone || !data.amount) return;
    
    const processSupportOthers = async () => {
      setIsSubmitting(true);
      try {
        // 1. Add support document (representing supporting someone else)
        await addDoc(collection(db, 'supports'), {
          name: 'Г. Жавхлан', // Javkhlan is supporting someone
          phone: data.phone,
          amount: data.amount,
          tier: 'custom',
          timestamp: serverTimestamp()
        });

        // 2. Update global stats (Javkhlan's "Supported" count goes up)
        const statsRef = doc(db, 'stats', 'global');
        await setDoc(statsRef, {
          totalAmount: increment(data.amount),
          totalSupported: increment(1)
        }, { merge: true });

        setShowSupportOthers(false);
        setSupportForm({ name: '', phone: '', message: '' });
        setCustomAmount('');
      } catch (error) {
        console.error("Support failed:", error);
      } finally {
        setIsSubmitting(false);
      }
    };

    // Trigger QPay
    try {
      setIsSubmitting(true);
      const response = await axios.post('/api/qpay/invoice', {
        amount: data.amount,
        description: `Support Others: ${data.phone}`,
        senderPhone: data.phone
      });
      setQpayInvoice(response.data);
      setOnPaymentSuccess(() => processSupportOthers);
    } catch (error) {
      console.error("QPay invoice creation failed:", error);
      alert("Төлбөрийн нэхэмжлэх үүсгэхэд алдаа гарлаа.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleIntroComplete = async (data: { name: string; age: number; phone: string; businessInfo: string; amount: number }) => {
    setIsSubmitting(true);
    try {
      if (data.amount > 0) {
        // If amount is provided, treat it as a support action
        await handleSupport({
          name: data.name,
          phone: data.phone,
          message: `Intro-гоор дэмжсэн: ${data.businessInfo}`,
          amount: data.amount,
          tier: 'star' // Default tier for intro support
        });
      } else {
        // Just record as a starter support
        await addDoc(collection(db, 'supports'), {
          name: data.name,
          phone: data.phone,
          age: data.age,
          businessInfo: data.businessInfo,
          amount: 0,
          tier: 'starter',
          message: `Intro-гоор бүртгүүлсэн: ${data.businessInfo}`,
          userNumber: userNumber,
          timestamp: serverTimestamp()
        });

        const statsRef = doc(db, 'stats', 'global');
        await setDoc(statsRef, {
          totalSupporters: increment(1)
        }, { merge: true });
      }

      // Save to user_ids registry
      if (userNumber !== null) {
        try {
          await setDoc(doc(db, 'user_ids', String(userNumber)), {
            name: data.name,
            phone: data.phone,
            userNumber: userNumber,
            isEarlyUser: isEarlyUser,
            registeredAt: serverTimestamp(),
            source: 'intro',
          }, { merge: true });
        } catch {}
      }

      setShowIntro(false);
      localStorage.setItem('intro_completed', 'true');
      setActiveTab('home');
      setShowWelcomeNotif(true);
      setIsNewUser(false);
    } catch (error) {
      console.error("Intro registration failed:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ErrorBoundary>
      <AnimatePresence>
        {showSplash && <SplashScreen onDone={() => setShowSplash(false)} />}
      </AnimatePresence>

      <div className="h-screen flex flex-col overflow-hidden bg-slate-50">
      <Navbar 
        onBrandClick={() => setActiveTab('home')}
        onSupportClick={() => setActiveTab('citizens')}
        onMenuClick={() => setShowSidebar(true)}
        onIntroClick={() => {
          if (localStorage.getItem('intro_completed') && userNumber !== null) {
            setShowWelcomeNotif(true);
          } else {
            setShowIntro(true);
          }
        }}
      />

      <Sidebar 
        isOpen={showSidebar} 
        onClose={() => setShowSidebar(false)} 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
      />

      <main className={cn(
        "flex-grow scrollbar-hide",
        activeTab === 'lucky_draw' ? "overflow-hidden" : "overflow-y-auto"
      )}>
        {activeTab === 'home' && (
          <>
            {/* Hero / Cover Section */}
            <section className="relative h-64 md:h-80 overflow-hidden group">
              <img 
                src={stats.coverImageUrl || "https://picsum.photos/seed/javkhlan-cover/1920/1080"} 
                alt="Cover" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent" />
              <label className="absolute bottom-4 right-6 p-3 bg-slate-900/60 backdrop-blur-md text-white rounded-2xl cursor-pointer hover:bg-slate-900/80 transition-all border border-white/20 flex items-center justify-center min-w-[44px] min-h-[44px] shadow-lg">
                {isUpdatingCover ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Camera size={20} />
                )}
                <input type="file" accept="image/*" onChange={handleCoverImageUpdate} className="hidden" disabled={isUpdatingCover} />
              </label>
            </section>

            {/* Profile Section */}
            <section className="max-w-5xl mx-auto px-6 -mt-28 relative z-10">
              <div className="flex flex-col items-center text-center gap-6 mb-12">
                <div className="relative group">
                  <div className="w-36 h-36 md:w-48 md:h-48 rounded-[2.5rem] border-8 border-white overflow-hidden shadow-2xl bg-white">
                    <img 
                      src={stats.profileImageUrl || "https://picsum.photos/seed/javkhlan-profile/400/400"} 
                      alt="Profile" 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <label className="absolute inset-0 flex items-center justify-center bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-[2.5rem]">
                    {isUpdatingProfile ? (
                      <div className="w-8 h-8 border-3 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Camera size={32} className="text-white" />
                    )}
                    <input type="file" accept="image/*" onChange={handleProfileImageUpdate} className="hidden" disabled={isUpdatingProfile} />
                  </label>
                </div>
                
                <div className="space-y-2">
                  <h1 className="font-display font-bold text-4xl md:text-6xl text-slate-900 tracking-tight">Г. Жавхлан</h1>
                  <p className="text-brand-600 font-bold text-lg md:text-xl">@javkhlan</p>
                </div>

                {userNumber !== null && (
                  <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full font-black text-sm tracking-widest ${isEarlyUser ? 'text-sky-700' : 'bg-slate-100 text-slate-500'}`}
                    style={isEarlyUser ? {
                      background: 'linear-gradient(white, white) padding-box, linear-gradient(135deg, #67e8f9, #818cf8, #c084fc, #67e8f9) border-box',
                      border: '2px solid transparent',
                      animation: 'diamond-spin 4s linear infinite',
                    } : {}}>
                    {isEarlyUser && <span className="text-lg">💎</span>}
                    <span>Таны дугаар №{userNumber}</span>
                  </div>
                )}

                <div className="flex flex-wrap justify-center gap-12 md:gap-24 py-4">
                  <div
                    className="flex flex-col items-center cursor-pointer group"
                    onClick={() => setShowSupportersList(true)}
                  >
                    <span className="font-display font-bold text-2xl md:text-3xl text-slate-900 group-hover:text-brand-600 transition-colors">{formatNumber(stats.totalSupporters)}</span>
                    <span className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">Supporters</span>
                  </div>
                  <div
                    className="flex flex-col items-center cursor-pointer group"
                    onClick={() => setShowSupportsHistory(true)}
                  >
                    <span className="font-display font-bold text-2xl md:text-3xl text-slate-900 group-hover:text-brand-600 transition-colors">{formatNumber(stats.totalAmount)}</span>
                    <span className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">Supports</span>
                  </div>
                  <div
                    className="flex flex-col items-center cursor-pointer group"
                    onClick={() => setShowSupportOthers(true)}
                  >
                    <span className="font-display font-bold text-2xl md:text-3xl text-slate-900 group-hover:text-brand-600 transition-colors">{formatNumber(stats.totalSupported)}</span>
                    <span className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">Supported</span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-3">
                  <button
                    onClick={handleToggleSupport}
                    className="px-10 py-4 rounded-2xl font-bold text-lg transition-all shadow-xl flex items-center justify-center gap-2 group bg-brand-600 text-white hover:bg-brand-700 shadow-brand-600/30 hover:-translate-y-1"
                  >
                    <Heart className="group-hover:scale-110 transition-transform" />
                    Дэмжих
                  </button>
                  
                  <button
                    onClick={() => setActiveTab('shop')}
                    className="px-10 py-4 rounded-2xl font-bold text-lg transition-all shadow-xl flex items-center justify-center gap-2 group bg-white text-slate-900 border border-slate-200 hover:bg-slate-50 hover:-translate-y-1"
                  >
                    <ShoppingBag className="group-hover:scale-110 transition-transform" />
                    Дэлгүүр
                  </button>

                </div>
              </div>
            </section>
          </>
        )}

        {/* Tab Content */}
        <div className={cn("max-w-5xl mx-auto px-6 pb-24", activeTab === 'home' ? "mt-8" : "pt-12")}>
            {activeTab === 'home' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="font-display font-bold text-2xl text-slate-900 flex items-center gap-2">
                      <TrendingUp className="text-brand-600" />
                      Сүүлийн дэмжлэгүүд
                    </h2>
                  </div>

                  <div className="space-y-4">
                    {recentSupports.length === 0 ? (
                      <div className="bg-white p-12 rounded-3xl border border-dashed border-slate-200 text-center">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Users className="text-slate-300" />
                        </div>
                        <p className="text-slate-400 font-medium">Одоогоор дэмжлэг ирээгүй байна.</p>
                      </div>
                    ) : (
                      recentSupports.map((support) => (
                        <motion.div 
                          key={support.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex gap-4"
                        >
                          <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center text-white shrink-0", TIER_CONFIG[support.tier]?.color || 'bg-slate-400')}>
                            <User size={24} />
                          </div>
                          <div className="flex-grow">
                            <div className="flex justify-between items-start mb-1">
                              <h4 className="font-bold text-slate-900">{support.name}</h4>
                              <span className="text-xs font-bold text-brand-600 bg-brand-50 px-2 py-1 rounded-lg">
                                {formatCurrency(support.amount)}
                              </span>
                            </div>
                            {support.message && (
                              <div className="bg-slate-50 p-4 rounded-2xl mb-2 flex gap-3">
                                <MessageSquare size={16} className="text-slate-400 shrink-0 mt-1" />
                                <p className="text-slate-600 text-sm leading-relaxed italic">"{support.message}"</p>
                              </div>
                            )}
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                              {support.timestamp?.toDate().toLocaleString() || 'Саяхан'}
                            </p>
                          </div>
                        </motion.div>
                      ))
                    )}
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="bg-brand-900 rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-brand-500/20 rounded-full -mr-16 -mt-16 blur-3xl" />
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-brand-400/10 rounded-full -ml-12 -mb-12 blur-2xl" />
                    
                    <h3 className="font-display font-bold text-2xl mb-6 relative">Нийт Дэмжлэг</h3>
                    <div className="space-y-6 relative">
                      <div>
                        <p className="text-brand-300 text-xs font-bold uppercase tracking-widest mb-1">Нийт дүн</p>
                        <p className="text-3xl font-bold">{formatCurrency(stats.totalAmount)}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-brand-300 text-xs font-bold uppercase tracking-widest mb-1">Дэмжигчид</p>
                          <p className="text-xl font-bold">{formatNumber(stats.totalSupporters)}</p>
                        </div>
                        <div>
                          <p className="text-brand-300 text-xs font-bold uppercase tracking-widest mb-1">Гишүүд</p>
                          <p className="text-xl font-bold">{formatNumber(stats.totalSubscribers)}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-display font-bold text-lg text-slate-900">Дэлгүүр</h3>
                      <button onClick={() => setActiveTab('shop')} className="text-xs font-bold text-brand-600 hover:underline">Бүгдийг харах</button>
                    </div>
                    <div className="space-y-4">
                      {products.length === 0 ? (
                        <p className="text-xs text-slate-400 text-center py-4">Одоогоор бараа байхгүй байна</p>
                      ) : (
                        products.slice(0, 2).map(product => (
                          <div key={product.id} className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                              <Package size={20} className="text-brand-600" />
                            </div>
                            <div className="flex-grow">
                              <p className="text-sm font-bold text-slate-900 leading-tight">{product.name}</p>
                              <p className="text-xs font-bold text-brand-600">{Number(product.price).toLocaleString()}₮</p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
                    <h3 className="font-display font-bold text-lg text-slate-900 mb-4">Ангилал</h3>
                    <div className="space-y-3">
                      {(Object.keys(TIER_CONFIG) as SupportTier[]).map(tier => (
                        <div key={tier} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className={cn("w-2 h-2 rounded-full", TIER_CONFIG[tier].color)} />
                            <span className="text-sm font-medium text-slate-600">{TIER_CONFIG[tier].label}</span>
                          </div>
                          <span className="text-sm font-bold text-slate-900">{stats.tierCounts[tier] || 0}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'membership' && (
              <div className="relative space-y-16 pb-32 overflow-hidden">
                {/* Decorative Background Elements */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full pointer-events-none overflow-hidden">
                  <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand-500/5 rounded-full blur-[120px]" />
                  <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/5 rounded-full blur-[120px]" />
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full opacity-[0.03] [mask-image:radial-gradient(ellipse_at_center,black,transparent)]">
                    <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
                  </div>
                </div>

                <div className="relative text-center space-y-6 max-w-3xl mx-auto px-4">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white/80 backdrop-blur-md border border-slate-200 shadow-sm text-brand-600 text-xs font-black tracking-[0.2em] uppercase mb-4"
                  >
                    <Sparkles size={14} className="animate-pulse" />
                    <span>Premium Membership</span>
                  </motion.div>
                  
                  <motion.h2 
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                    className="text-5xl md:text-7xl font-display font-black text-slate-900 tracking-tight leading-[1.1]"
                  >
                    Unlock Your <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 via-purple-600 to-brand-600 bg-[length:200%_auto] animate-gradient">Digital Empire</span>
                  </motion.h2>
                  
                  <motion.p 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.6 }}
                    className="text-xl text-slate-500 leading-relaxed font-medium"
                  >
                    Choose a plan that matches your ambition. Get exclusive access, massive discounts, and direct support to scale your vision.
                  </motion.p>

                  {/* Membership Check Section */}
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="max-w-md mx-auto mt-12 p-6 bg-white rounded-[2.5rem] border border-slate-100 shadow-xl"
                  >
                    <div className="flex flex-col gap-4">
                      <div className="relative">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input 
                          type="tel" 
                          placeholder="Утасны дугаараа шалгах" 
                          value={membershipPhone}
                          onChange={e => {
                            setMembershipPhone(e.target.value);
                            setMembershipStatus(null);
                          }}
                          className="w-full pl-12 pr-4 py-4 rounded-2xl border border-slate-100 focus:border-brand-500 outline-none font-bold text-slate-900 transition-all"
                        />
                      </div>
                      <button 
                        onClick={() => handleCheckMembership(membershipPhone)}
                        disabled={!membershipPhone.trim() || isCheckingMembership}
                        className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-brand-600 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {isCheckingMembership ? <Loader2 className="animate-spin" size={20} /> : <Search size={20} />}
                        <span>Гишүүнчлэл шалгах</span>
                      </button>

                      <AnimatePresence>
                        {membershipStatus && (
                          <motion.div 
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="pt-4 border-t border-slate-50 mt-2"
                          >
                            {membershipStatus.expiresAt ? (
                              <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 text-center">
                                <p className="text-emerald-600 text-xs font-black uppercase tracking-widest mb-1">Идэвхтэй Гишүүнчлэл</p>
                                <p className="text-slate-900 font-black text-lg">{membershipStatus.plan}</p>
                                <p className="text-emerald-700 font-bold text-sm mt-1">
                                  Дуусах хугацаа: {membershipStatus.expiresAt.toLocaleDateString()}
                                </p>
                              </div>
                            ) : (
                              <div className="bg-rose-50 p-4 rounded-2xl border border-rose-100 text-center">
                                <p className="text-rose-600 font-bold text-sm">Бүртгэлтэй гишүүнчлэл олдсонгүй.</p>
                              </div>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                </div>

                <div className="relative grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 px-4">
                  {[
                    {
                      name: 'Bronze',
                      price: '1,000₮',
                      period: 'Month',
                      color: 'from-orange-400 to-orange-600',
                      icon: Shield,
                      description: 'Эхлэхэд тохиромжтой',
                      features: [
                        { text: 'Access - 1 App', icon: Rocket },
                        { text: 'My Business - 10% Discount', icon: ShoppingBag },
                        { text: 'My Team - 10% Call', icon: Phone },
                        { text: 'Earn - 10% Profit', icon: TrendingUp },
                        { text: 'Learn - 10% Discount', icon: BookOpen }
                      ]
                    },
                    {
                      name: 'Silver',
                      price: '5,000₮',
                      period: 'Month',
                      color: 'from-slate-300 to-slate-500',
                      icon: Award,
                      description: 'Илүү их боломж',
                      features: [
                        { text: 'Access - 2 App', icon: Rocket },
                        { text: 'My Business - 20% Discount', icon: ShoppingBag },
                        { text: 'My Team - 25% Call', icon: Phone },
                        { text: 'Earn - 25% Profit', icon: TrendingUp },
                        { text: 'Learn - 25% Discount', icon: BookOpen }
                      ]
                    },
                    {
                      name: 'Gold',
                      price: '10,000₮',
                      period: 'Month',
                      color: 'from-amber-400 to-amber-600',
                      icon: Star,
                      badge: 'Popular',
                      description: 'Хамгийн эрэлттэй',
                      features: [
                        { text: 'Access - 3 App', icon: Rocket },
                        { text: 'My Business - 30% Discount', icon: ShoppingBag },
                        { text: 'My Team - 50% Call', icon: Phone },
                        { text: 'Earn - 50% Profit', icon: TrendingUp },
                        { text: 'Learn - 50% Discount', icon: BookOpen }
                      ]
                    },
                    {
                      name: 'Diamond',
                      price: '20,000₮',
                      period: 'Month',
                      color: 'from-sky-400 to-sky-600',
                      icon: Gem,
                      description: 'Мэргэжлийн түвшин',
                      features: [
                        { text: 'Access - 4 App', icon: Rocket },
                        { text: 'My Business - 40% Discount', icon: ShoppingBag },
                        { text: 'My Team - 75% Call', icon: Phone },
                        { text: 'Earn - 75% Profit', icon: TrendingUp },
                        { text: 'Learn - 75% Discount', icon: BookOpen }
                      ]
                    },
                    {
                      name: 'VIP',
                      price: '50,000₮',
                      period: 'Month',
                      color: 'from-purple-500 to-brand-600',
                      icon: Crown,
                      badge: 'Best Value',
                      description: 'Бүх зүйл нээлттэй',
                      features: [
                        { text: 'Access - All App', icon: Rocket },
                        { text: 'My Business - 50% Discount', icon: ShoppingBag },
                        { text: 'My Team - 90% Call', icon: Phone },
                        { text: 'Earn - 90% Profit', icon: TrendingUp },
                        { text: 'Learn - 90% Discount', icon: BookOpen }
                      ]
                    },
                    {
                      name: 'Super VIP',
                      price: '1,000,000₮',
                      period: 'Forever',
                      color: 'from-slate-800 to-slate-950',
                      icon: Zap,
                      isPremium: true,
                      description: 'Насан туршийн эрх',
                      features: [
                        { text: 'Access - All App', icon: Rocket },
                        { text: 'My Business - 50% Discount', icon: ShoppingBag },
                        { text: 'My Team - 90% Call', icon: Phone },
                        { text: 'Earn - 90% Profit', icon: TrendingUp },
                        { text: 'Learn - 90% Discount', icon: BookOpen },
                        { text: 'Lifetime Access', icon: History }
                      ]
                    }
                  ].map((plan, index) => (
                    <motion.div
                      key={plan.name}
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ y: -5 }}
                      className={cn(
                        "group relative flex flex-col h-full bg-white rounded-[2rem] p-5 border border-slate-100 shadow-lg transition-all duration-500",
                        plan.badge && "ring-1 ring-brand-500/20"
                      )}
                    >
                      {/* Badge */}
                      {plan.badge && (
                        <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 z-10">
                          <span className="bg-brand-600 text-white text-[8px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-lg">
                            {plan.badge}
                          </span>
                        </div>
                      )}

                      {/* Icon & Header */}
                      <div className="relative mb-5">
                        <div className={cn(
                          "w-12 h-12 rounded-xl flex items-center justify-center text-white mb-4 shadow-md bg-gradient-to-br",
                          plan.color
                        )}>
                          <plan.icon size={24} strokeWidth={1.5} />
                        </div>
                        <h3 className="text-lg font-display font-black text-slate-900 mb-0.5 tracking-tight">{plan.name}</h3>
                        <p className="text-slate-400 text-[9px] font-bold uppercase tracking-wider mb-3">{plan.description}</p>
                        
                        <div className="flex items-baseline gap-1">
                          <span className="text-2xl font-black text-slate-900 tracking-tighter">{plan.price}</span>
                          <span className="text-slate-400 font-black text-[9px] uppercase tracking-widest ml-1">/{plan.period}</span>
                        </div>
                      </div>

                      {/* Features */}
                      <div className="space-y-3 flex-grow mb-6">
                        {plan.features.map((feature, idx) => (
                          <div key={idx} className="flex items-center gap-2.5">
                            <div className={cn(
                              "w-5 h-5 rounded-lg flex items-center justify-center text-white flex-shrink-0 bg-gradient-to-br",
                              plan.color
                            )}>
                              <feature.icon size={10} strokeWidth={2.5} />
                            </div>
                            <span className="text-slate-600 font-bold text-[11px] tracking-tight">
                              {feature.text}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Action Button */}
                      <button 
                        onClick={() => {
                          setSelectedMembershipPlan(plan);
                          setShowMembershipPurchaseModal(true);
                        }}
                        className={cn(
                          "relative w-full py-3 rounded-xl font-black text-white shadow-md transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] overflow-hidden group/btn bg-gradient-to-br",
                          plan.color
                        )}
                      >
                        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-500" />
                        <span className="relative flex items-center justify-center gap-2 text-xs">
                          Access <ChevronRight size={14} strokeWidth={3} />
                        </span>
                      </button>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
            {activeTab === 'team' && (
              <div className="space-y-8 pb-20">
                <div className="max-w-2xl mx-auto">
                  <MonnamTyping onClick={() => setTeamTab(3)} />

                  {teamTab !== 3 && (
                    <div className="flex bg-slate-100 p-1 rounded-2xl mb-8">
                      {['Миний баг', 'Чөлөөт хэсэг', 'Бүртгүүлэх'].map((title, i) => (
                        <button
                          key={title}
                          onClick={() => setTeamTab(i)}
                          className={cn(
                            "flex-1 py-3 px-4 rounded-xl text-xs font-bold transition-all",
                            teamTab === i 
                              ? "bg-white text-brand-600 shadow-sm" 
                              : "text-slate-500 hover:text-slate-700"
                          )}
                        >
                          {title}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="max-w-2xl mx-auto">
                  <AnimatePresence mode="wait">
                    {teamTab === 0 && (
                      <motion.div 
                        key="my-team" 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="space-y-6"
                      >
                        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-xl">
                          <div className="flex items-center gap-3 mb-8">
                            <div className="p-3 rounded-2xl bg-brand-600 text-white shadow-lg shadow-brand-600/20">
                              <Users size={24} />
                            </div>
                            <div>
                              <h3 className="font-display font-bold text-2xl text-slate-900">Миний баг</h3>
                              <p className="text-sm text-slate-400 font-medium">Хамгийн шилдэг мэргэжилтнүүдийн баг</p>
                            </div>
                          </div>
                          
                          <div className="space-y-4">
                            {teamCandidates.filter(c => c.isTeamMember || c.votes > 100).length === 0 ? (
                              <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                                <p className="text-slate-400 text-sm">Одоогоор баг бүрдэж байна. Чөлөөт хэсгээс саналаа өгөөрэй.</p>
                              </div>
                            ) : (
                              teamCandidates.filter(c => c.isTeamMember || c.votes > 100).map((member, idx) => (
                                <div 
                                  key={member.id} 
                                  onClick={() => setSelectedCandidate(member)}
                                  className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 cursor-pointer hover:bg-slate-100 transition-colors"
                                >
                                  <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-brand-100 flex items-center justify-center text-brand-600 font-bold text-xl">
                                      {member.name.charAt(0)}
                                    </div>
                                    <div>
                                      <p className="font-bold text-slate-900">{member.name}</p>
                                      <p className="text-xs text-brand-600 font-bold">{member.profession}</p>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <div className="flex items-center gap-1 text-amber-500">
                                      <Star size={14} fill="currentColor" />
                                      <span className="text-sm font-bold">Шилдэг</span>
                                    </div>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {teamTab === 1 && (
                      <motion.div 
                        key="candidates" 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="space-y-6"
                      >
                        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-xl">
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                            <div className="flex items-center gap-3">
                              <div className="p-3 rounded-2xl bg-amber-500 text-white shadow-lg shadow-amber-500/20">
                                <Trophy size={24} />
                              </div>
                              <div>
                                <h3 className="font-display font-bold text-2xl text-slate-900">Чөлөөт хэсэг</h3>
                                <p className="text-sm text-slate-400 font-medium">Багт орохын төлөө өрсөлдөж буй мэргэжилтнүүд</p>
                              </div>
                            </div>
                            <div className="relative">
                              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                              <input 
                                type="text"
                                placeholder="Хайх..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 w-full md:w-64"
                              />
                            </div>
                          </div>

                          <div className="space-y-4">
                            {teamCandidates.filter(c => 
                              c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                              c.profession.toLowerCase().includes(searchTerm.toLowerCase())
                            ).length === 0 ? (
                              <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                                <p className="text-slate-400 text-sm">Хайлтад тохирох хүн олдсонгүй.</p>
                              </div>
                            ) : (
                              teamCandidates
                                .filter(c => 
                                  c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                  c.profession.toLowerCase().includes(searchTerm.toLowerCase())
                                )
                                .map((candidate) => (
                                <div 
                                  key={candidate.id} 
                                  onClick={() => setSelectedCandidate(candidate)}
                                  className="p-6 bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all cursor-pointer group"
                                >
                                  <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-4">
                                      <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 font-bold text-2xl group-hover:bg-brand-50 group-hover:text-brand-600 transition-colors">
                                        {candidate.name.charAt(0)}
                                      </div>
                                      <div>
                                        <h4 className="font-bold text-slate-900 text-lg">{candidate.name}</h4>
                                        <p className="text-sm text-brand-600 font-bold uppercase tracking-wider">{candidate.profession}</p>
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <p className="text-2xl font-bold text-slate-900">{candidate.votes || 0}</p>
                                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Санал</p>
                                    </div>
                                  </div>
                                  <p className="text-slate-600 text-sm leading-relaxed mb-6 bg-slate-50 p-4 rounded-2xl italic line-clamp-2">
                                    "{candidate.description}"
                                  </p>
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleVoteCandidate(candidate.id);
                                    }}
                                    className="w-full py-3 bg-brand-50 text-brand-600 rounded-xl font-bold text-sm hover:bg-brand-600 hover:text-white transition-all flex items-center justify-center gap-2"
                                  >
                                    <ThumbsUp size={16} />
                                    Санал өгөх
                                  </button>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {teamTab === 2 && (
                      <motion.div 
                        key="register" 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="bg-white p-8 rounded-3xl border border-slate-100 shadow-xl"
                      >
                        <h3 className="font-display font-bold text-2xl text-slate-900 mb-6 flex items-center gap-2">
                          <Plus className="text-brand-600" />
                          Багт бүртгүүлэх
                        </h3>
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Нэр</label>
                              <input 
                                type="text" 
                                value={teamForm.name}
                                onChange={e => setTeamForm({...teamForm, name: e.target.value})}
                                placeholder="Таны нэр"
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-brand-500 outline-none"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Утас</label>
                              <input 
                                type="tel" 
                                value={teamForm.phone}
                                onChange={e => setTeamForm({...teamForm, phone: e.target.value})}
                                placeholder="Утасны дугаар"
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-brand-500 outline-none"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Мэргэжил</label>
                            <input 
                              type="text" 
                              value={teamForm.profession}
                              onChange={e => setTeamForm({...teamForm, profession: e.target.value})}
                              placeholder="Жишээ нь: Инженер, Дизайнер"
                              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-brand-500 outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Яагаад би сонгогдох ёстой вэ?</label>
                            <textarea 
                              value={teamForm.description}
                              onChange={e => setTeamForm({...teamForm, description: e.target.value})}
                              placeholder="Өөрийн давуу тал, туршлагаа бичнэ үү..."
                              rows={4}
                              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-brand-500 outline-none resize-none"
                            />
                          </div>
                          <button 
                            onClick={handleRegisterTeam}
                            disabled={isSubmitting || !teamForm.name || !teamForm.phone || !teamForm.profession || !teamForm.description}
                            className="w-full py-4 bg-brand-600 text-white rounded-2xl font-bold text-lg shadow-xl shadow-brand-600/20 hover:bg-brand-700 transition-all disabled:opacity-50"
                          >
                            {isSubmitting ? 'Бүртгэж байна...' : 'Бүртгүүлэх'}
                          </button>
                        </div>
                      </motion.div>
                    )}

                    {teamTab === 3 && (
                      <motion.div 
                        key="monnam-view" 
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-6"
                      >
                        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-xl">
                          <button 
                            onClick={() => setTeamTab(0)}
                            className="flex items-center gap-2 text-slate-400 hover:text-brand-600 transition-colors mb-6 font-bold text-sm"
                          >
                            <ChevronRight size={16} className="rotate-180" />
                            Буцах
                          </button>
                          <div className="text-center py-12">
                            <div className="w-20 h-20 bg-brand-50 rounded-full flex items-center justify-center mx-auto mb-6">
                              <Rocket size={40} className="text-brand-600" />
                            </div>
                            <h2 className="text-2xl font-display font-bold text-slate-900 mb-2">Монгол Олны Нам</h2>
                            <p className="text-slate-500 max-w-md mx-auto">
                              Удахгүй нэмэгдэх болно. Энэ хэсэгт Монгол Олны Намын талаарх мэдээлэл болон үйл ажиллагаанууд харагдах болно.
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            )}

            {activeTab === 'apps' && (
              <div className="max-w-2xl mx-auto space-y-8 pb-24">
                <div className="flex bg-slate-100 p-1 rounded-2xl mb-8">
                  {['Add App', 'App List'].map((title, i) => (
                    <button
                      key={title}
                      onClick={() => setAppsTab(i)}
                      className={cn(
                        "flex-1 py-3 px-4 rounded-xl text-xs font-bold transition-all",
                        appsTab === i 
                          ? "bg-white text-brand-600 shadow-sm" 
                          : "text-slate-500 hover:text-slate-700"
                      )}
                    >
                      {title}
                    </button>
                  ))}
                </div>

                <AnimatePresence mode="wait">
                  {appsTab === 0 && (
                    <motion.div
                      key="add-app"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="bg-white p-8 rounded-3xl border border-slate-100 shadow-xl"
                    >
                      <h2 className="font-display font-bold text-2xl text-slate-900 mb-6 flex items-center gap-2">
                        <Plus className="text-brand-600" />
                        Add App
                      </h2>

                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Name</label>
                            <input 
                              type="text" 
                              value={appForm.name}
                              onChange={e => setAppForm({...appForm, name: e.target.value})}
                              placeholder="App Name"
                              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-brand-500 outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Type</label>
                            <input 
                              type="text" 
                              value={appForm.type}
                              onChange={e => setAppForm({...appForm, type: e.target.value})}
                              placeholder="App Type (e.g. Fintech, E-commerce)"
                              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-brand-500 outline-none"
                            />
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">App Logo</label>
                          <div className="flex items-center gap-4">
                            {appLogo ? (
                              <div className="relative w-24 h-24 rounded-2xl overflow-hidden border border-slate-200">
                                <img src={appLogo} alt="Logo" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                <button 
                                  onClick={() => setAppLogo(null)}
                                  className="absolute top-1 right-1 p-1 bg-rose-500 text-white rounded-lg shadow-lg hover:bg-rose-600 transition-colors"
                                >
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            ) : (
                              <label className="w-24 h-24 rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-1 cursor-pointer hover:border-brand-300 hover:bg-brand-50/30 transition-all text-slate-400 hover:text-brand-600">
                                <Upload size={20} />
                                <span className="text-[10px] font-bold uppercase tracking-wider">Upload</span>
                                <input 
                                  type="file" 
                                  accept="image/*" 
                                  onChange={async (e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      try {
                                        const compressed = await compressImage(file, 400, 400, 0.7);
                                        setAppLogo(compressed);
                                      } catch (error) {
                                        console.error("Failed to compress logo:", error);
                                      }
                                    }
                                  }} 
                                  className="hidden" 
                                />
                              </label>
                            )}
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Link</label>
                          <input 
                            type="url" 
                            value={appForm.link}
                            onChange={e => setAppForm({...appForm, link: e.target.value})}
                            placeholder="https://example.com"
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-brand-500 outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Description</label>
                          <textarea 
                            value={appForm.description}
                            onChange={e => setAppForm({...appForm, description: e.target.value})}
                            placeholder="Briefly describe your app..."
                            rows={3}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-brand-500 outline-none resize-none"
                          />
                        </div>

                        <button 
                          onClick={handleAddApp}
                          disabled={isSubmitting || !appForm.name || !appForm.type || !appForm.link || !appForm.description || !appLogo}
                          className="w-full py-4 bg-brand-600 text-white rounded-2xl font-bold text-lg shadow-xl shadow-brand-600/20 hover:bg-brand-700 transition-all disabled:opacity-50"
                        >
                          {isSubmitting ? 'Adding...' : 'Add App'}
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {appsTab === 1 && (
                    <motion.div
                      key="app-list"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-6"
                    >
                      <h2 className="font-display font-bold text-2xl text-slate-900 flex items-center gap-2">
                        <Zap className="text-brand-600" />
                        App List
                      </h2>

                      {allApps.length === 0 ? (
                        <div className="bg-white p-12 rounded-3xl border border-slate-100 shadow-sm text-center">
                          <p className="text-slate-400 font-medium">No apps added yet.</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 gap-4">
                          {allApps.map(app => (
                            <div key={app.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-6">
                              <div className="w-16 h-16 rounded-2xl overflow-hidden border border-slate-100 flex-shrink-0">
                                <img src={app.logoUrl} alt={app.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                              </div>
                              <div className="flex-grow">
                                <div className="flex items-center justify-between mb-1">
                                  <h4 className="font-bold text-slate-900">{app.name}</h4>
                                  <span className="text-[10px] font-bold text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full uppercase tracking-wider">
                                    {app.type}
                                  </span>
                                </div>
                                <p className="text-xs text-slate-500 line-clamp-2 mb-2">{app.description}</p>
                                <a 
                                  href={app.link} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-[10px] font-bold text-brand-600 hover:underline flex items-center gap-1"
                                >
                                  Visit App <ChevronRight size={12} />
                                </a>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {activeTab === 'book' && (
              <div className="max-w-2xl mx-auto space-y-8 pb-24">
                <div className="space-y-2">
                  <button
                    onClick={() => setBookTab(5)}
                    className={cn(
                      "w-full py-4 px-6 rounded-2xl font-display font-bold text-lg transition-all flex items-center justify-center gap-2 shadow-sm",
                      bookTab === 5 
                        ? "bg-brand-600 text-white shadow-brand-600/20" 
                        : "bg-white text-slate-600 border border-slate-100 hover:bg-slate-50"
                    )}
                  >
                    <BookOpen size={20} />
                    Миний Намтар
                  </button>
                  <div className="flex bg-slate-100 p-1 rounded-2xl overflow-x-auto scrollbar-hide">
                    <button
                      onClick={() => setBookTab(0)}
                      className={cn(
                        "flex-1 py-3 px-4 rounded-xl text-xs font-bold transition-all whitespace-nowrap",
                        bookTab === 0 
                          ? "bg-white text-brand-600 shadow-sm" 
                          : "text-slate-500 hover:text-slate-700"
                      )}
                    >
                      Бүгд
                    </button>
                    <button
                      onClick={() => setBookTab(1)}
                      className={cn(
                        "flex-1 py-3 px-4 rounded-xl text-xs font-bold transition-all whitespace-nowrap",
                        bookTab === 1 
                          ? "bg-white text-brand-600 shadow-sm" 
                          : "text-slate-500 hover:text-slate-700"
                      )}
                    >
                      MVP
                    </button>
                    <button
                      onClick={() => setBookTab(2)}
                      className={cn(
                        "flex-1 py-3 px-4 rounded-xl flex justify-center transition-all",
                        bookTab === 2 
                          ? "bg-white text-brand-600 shadow-sm" 
                          : "text-slate-400 hover:text-slate-600"
                      )}
                      title="CRA Rating"
                    >
                      <Star size={18} fill={bookTab === 2 ? "currentColor" : "none"} />
                    </button>
                    <button
                      onClick={() => setBookTab(3)}
                      className={cn(
                        "flex-1 py-3 px-4 rounded-xl flex justify-center transition-all",
                        bookTab === 3 
                          ? "bg-white text-brand-600 shadow-sm" 
                          : "text-slate-400 hover:text-slate-600"
                      )}
                      title="CRC Report"
                    >
                      <FileText size={18} />
                    </button>
                    <button
                      onClick={() => setBookTab(4)}
                      className={cn(
                        "flex-1 py-3 px-4 rounded-xl flex justify-center transition-all",
                        bookTab === 4 
                          ? "bg-white text-brand-600 shadow-sm" 
                          : "text-slate-400 hover:text-slate-600"
                      )}
                      title="CTR Trust"
                    >
                      <ShieldCheck size={18} />
                    </button>
                  </div>
                </div>

                <AnimatePresence mode="wait">
                  {(bookTab === 0 || bookTab === 1) && (
                    <motion.div
                      key="mvp"
                      initial={bookTab === 0 ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-6 mb-8"
                    >
                      {/* MVP Stats Cards */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xl text-center">
                          <div className="w-12 h-12 bg-brand-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <Rocket className="text-brand-600" size={24} />
                          </div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">MVP</p>
                          <h3 className="font-display font-bold text-xl text-slate-900">1,000,000₮ Эрх</h3>
                          <p className="text-[10px] text-slate-400 font-medium mt-1">(Most Valuable Person)</p>
                        </div>
                        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xl text-center">
                          <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <TrendingUp className="text-emerald-600" size={24} />
                          </div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">MVP Average</p>
                          <h3 className="font-display font-bold text-xl text-slate-900">0₮</h3>
                          <p className="text-[10px] text-slate-400 font-medium mt-1">0 Хүн (Most Valuable Person)</p>
                        </div>
                      </div>

                      {/* MVP Content */}
                      {bookTab !== 0 && (
                        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-xl space-y-8">
                          <section>
                            <h4 className="font-display font-bold text-xl text-slate-900 mb-3 flex items-center gap-2">
                              <div className="w-1.5 h-6 bg-brand-600 rounded-full" />
                              MVP эрх хэрхэн өсөх вэ?
                            </h4>
                            <div className="space-y-4 text-slate-600 leading-relaxed">
                              <p>
                                MVP эрх нь тухайн хүний өөрийн бүтээсэн үнэ цэнэ, олон нийтийн итгэл, дэмжлэг дээр үндэслэн өснө.
                              </p>
                              <p className="bg-slate-50 p-4 rounded-2xl border border-slate-100 italic">
                                "Өөрөөр хэлбэл, хүн өөрөө үнэ цэнээ бий болгож, тэр үнэ цэнээрээ эрхээ тогтоолгоно."
                              </p>
                              <p>
                                Хэрэв тухайн хүн үнэхээр зөв, баталгаатай, олонд танигдсан, бодит нөлөөтэй болсон бол бидэнтэй холбогдон өөрийн эрхээ албан ёсоор тогтоолгох боломжтой.
                              </p>
                            </div>
                          </section>

                          <div className="h-px bg-slate-50" />

                          <section>
                            <h4 className="font-display font-bold text-xl text-slate-900 mb-3 flex items-center gap-2">
                              <div className="w-1.5 h-6 bg-emerald-500 rounded-full" />
                              MVP Average гэж юу вэ?
                            </h4>
                            <p className="text-slate-600 leading-relaxed mb-6">
                              MVP Average нь тухайн хүнийг дэмжсэн хүмүүсийн өгсөн мөнгөн дэмжлэгийн дундаж хэмжээг илэрхийлнэ.
                            </p>

                            <div className="bg-brand-50/50 p-6 rounded-3xl border border-brand-100">
                              <h5 className="font-bold text-brand-900 mb-4 flex items-center gap-2 text-sm uppercase tracking-wider">
                                <Star size={16} className="text-brand-600" />
                                Жишээ:
                              </h5>
                              <div className="space-y-3 text-sm">
                                <div className="flex justify-between items-center text-slate-600">
                                  <span>2 хүн мөнгө өгч дэмжсэн гэж үзье:</span>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                  <div className="bg-white p-3 rounded-xl border border-brand-100 text-center">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase">1-р хүн</p>
                                    <p className="font-bold text-slate-900">90,000₮</p>
                                  </div>
                                  <div className="bg-white p-3 rounded-xl border border-brand-100 text-center">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase">2-р хүн</p>
                                    <p className="font-bold text-slate-900">10,000₮</p>
                                  </div>
                                </div>
                                <div className="pt-3 border-t border-brand-100 space-y-2">
                                  <div className="flex justify-between text-slate-600">
                                    <span>Нийт дэмжлэг:</span>
                                    <span className="font-bold text-slate-900">100,000₮</span>
                                  </div>
                                  <div className="flex justify-between text-slate-600">
                                    <span>Нийт дэмжсэн хүний тоо:</span>
                                    <span className="font-bold text-slate-900">2</span>
                                  </div>
                                  <div className="flex justify-between items-center pt-2 mt-2 border-t border-brand-200">
                                    <span className="font-bold text-brand-900">MVP Average:</span>
                                    <span className="bg-brand-600 text-white px-3 py-1 rounded-lg font-bold">50,000₮</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </section>
                        </div>
                      )}
                    </motion.div>
                  )}

                  {(bookTab === 0 || bookTab === 2) && (
                    <motion.div
                      key="cra"
                      initial={bookTab === 0 ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-6 mb-8"
                    >
                      {/* CRA Stats Cards */}
                      <div className="grid grid-cols-2 gap-4">
                        <button 
                          onClick={() => {
                            setCRARatingType('free');
                            setShowCRARatingModal(true);
                          }}
                          className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xl text-center hover:border-amber-200 transition-all group"
                        >
                          <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-amber-100 transition-colors">
                            <Star className="text-amber-500" size={24} />
                          </div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">CRA Free</p>
                          <h3 className="font-display font-bold text-xl text-slate-900">
                            {allCRARatings.filter(r => r.type === 'free').length > 0
                              ? Math.round(allCRARatings.filter(r => r.type === 'free').reduce((acc, curr) => acc + curr.rating, 0) / allCRARatings.filter(r => r.type === 'free').length)
                              : 0}
                            <span className="text-xs text-slate-400 ml-1 font-sans">
                              ({allCRARatings.filter(r => r.type === 'free').length} хүн)
                            </span>
                          </h3>
                          <p className="text-[10px] text-slate-400 font-medium mt-1">(Community Rating Average)</p>
                        </button>
                        <button 
                          onClick={() => {
                            setCRARatingType('paid');
                            setRatingStep('payment');
                            setShowCRARatingModal(true);
                          }}
                          className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xl text-center hover:border-brand-200 transition-all group"
                        >
                          <div className="w-12 h-12 bg-brand-50 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-brand-100 transition-colors">
                            <Zap className="text-brand-600" size={24} />
                          </div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">CRA Paid</p>
                          <h3 className="font-display font-bold text-xl text-slate-900">
                            {allCRARatings.filter(r => r.type === 'paid').length > 0
                              ? Math.round(allCRARatings.filter(r => r.type === 'paid').reduce((acc, curr) => acc + curr.rating, 0) / allCRARatings.filter(r => r.type === 'paid').length)
                              : 0}
                            <span className="text-xs text-slate-400 ml-1 font-sans">
                              ({allCRARatings.filter(r => r.type === 'paid').length} хүн)
                            </span>
                          </h3>
                          <p className="text-[10px] text-slate-400 font-medium mt-1">(Community Rating Average)</p>
                        </button>
                      </div>

                      {/* CRA Content */}
                      {bookTab !== 0 && (
                        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-xl space-y-6">
                          <div className="flex items-center justify-between">
                            <h4 className="font-display font-bold text-xl text-slate-900 flex items-center gap-2">
                              <div className="w-1.5 h-6 bg-amber-500 rounded-full" />
                              Үнэлгээний систем
                            </h4>
                            <button 
                              onClick={() => setShowCRAInfo(!showCRAInfo)}
                              className="p-2 text-slate-400 hover:text-brand-600 transition-colors"
                            >
                              <Info size={20} />
                            </button>
                          </div>

                          <AnimatePresence>
                            {showCRAInfo && (
                              <motion.div 
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                              >
                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-sm text-slate-600 space-y-4">
                                  <p>
                                    Үнэлгээ өгөхөд 1-100 хүртэл өгөх боломжтой. Энэхүү үнэлгээ нь олон нийтийн зүгээс өгч буй бодит үнэлэмжийг илэрхийлнэ.
                                  </p>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="bg-white p-4 rounded-xl border border-slate-100">
                                      <p className="font-bold text-slate-900 mb-1">CRA Free</p>
                                      <p className="text-xs">Үнэ төлбөргүйгээр 1-100 хүртэлх үнэлгээг өгөх боломжтой.</p>
                                    </div>
                                    <div className="bg-white p-4 rounded-xl border border-slate-100">
                                      <p className="font-bold text-slate-900 mb-1">CRA Paid</p>
                                      <p className="text-xs">5,000₮ төлөн 1-100 хүртэлх үнэлгээг өгөх боломжтой. Энэ нь илүү өндөр жинтэй үнэлгээ болно.</p>
                                    </div>
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>

                          <div className="h-px bg-slate-50" />

                          {/* CRA History */}
                          <div className="space-y-4">
                            <h5 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Үнэлгээний түүх</h5>
                            {allCRARatings.length === 0 ? (
                              <p className="text-center py-8 text-slate-400 text-sm">Одоогоор үнэлгээ байхгүй байна.</p>
                            ) : (
                              <div className="space-y-3">
                                {allCRARatings.slice(0, 10).map(rating => (
                                  <div key={rating.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                                    <div className="flex items-center gap-3">
                                      <div className={cn(
                                        "w-8 h-8 rounded-lg flex items-center justify-center text-white",
                                        rating.type === 'free' ? "bg-amber-500" : "bg-brand-600"
                                      )}>
                                        {rating.type === 'free' ? <Star size={14} /> : <Zap size={14} />}
                                      </div>
                                      <div>
                                        <p className="text-xs font-bold text-slate-900">
                                          {rating.type === 'free' ? 'CRA Free' : 'CRA Paid'}
                                        </p>
                                        <p className="text-[10px] text-slate-400">
                                          {rating.timestamp?.toDate().toLocaleString()}
                                        </p>
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <p className="font-bold text-brand-600">{rating.rating}</p>
                                      <p className="text-[10px] text-slate-400 uppercase font-bold">Rating</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}

                  {(bookTab === 0 || bookTab === 3) && (
                    <motion.div
                      key="crc"
                      initial={bookTab === 0 ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-6 mb-8"
                    >
                      {/* CRC Stats Cards */}
                      <div className="space-y-4">
                        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xl text-center">
                          <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <FileText className="text-blue-600" size={24} />
                          </div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Report</p>
                          <h3 className={cn(
                            "font-display font-bold text-3xl",
                            crcTotals.total >= 0 ? "text-emerald-600" : "text-rose-600"
                          )}>
                            {crcTotals.total > 0 ? '+' : ''}{formatNumber(crcTotals.total)} Кредит
                          </h3>
                          <p className="text-[10px] text-slate-400 font-medium mt-1">(Community Report Credit)</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <button 
                            onClick={() => {
                              setCRCReportType('bad');
                              setShowCRCReportModal(true);
                            }}
                            className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xl text-center hover:border-rose-200 transition-all group"
                          >
                            <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-rose-100 transition-colors">
                              <ShieldAlert className="text-rose-600" size={24} />
                            </div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Bad Report</p>
                            <h3 className="font-display font-bold text-xl text-rose-600">
                              {crcTotals.bad > 0 ? '+' : ''}{formatNumber(crcTotals.bad)}
                            </h3>
                          </button>
                          <button 
                            onClick={() => {
                              setCRCReportType('good');
                              setShowCRCReportModal(true);
                            }}
                            className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xl text-center hover:border-emerald-200 transition-all group"
                          >
                            <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-emerald-100 transition-colors">
                              <ShieldCheck className="text-emerald-600" size={24} />
                            </div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Good Report</p>
                            <h3 className="font-display font-bold text-xl text-emerald-600">
                              {crcTotals.good > 0 ? '+' : ''}{formatNumber(crcTotals.good)}
                            </h3>
                          </button>
                        </div>
                      </div>

                      {/* CRC Content */}
                      {bookTab !== 0 && (
                        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-xl space-y-6">
                          <div className="flex items-center justify-between">
                            <h4 className="font-display font-bold text-xl text-slate-900 flex items-center gap-2">
                              <div className="w-1.5 h-6 bg-blue-600 rounded-full" />
                              CRC Систем
                            </h4>
                            <button 
                              onClick={() => setShowCRCInfo(!showCRCInfo)}
                              className="p-2 text-slate-400 hover:text-brand-600 transition-colors"
                            >
                              <Info size={20} />
                            </button>
                          </div>

                          <AnimatePresence>
                            {showCRCInfo && (
                              <motion.div 
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                              >
                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-sm text-slate-600">
                                  <p>
                                    Community Report Credit - Энэхүү систем нь иргэдийн бие биедээ өгч буй итгэлцлийн тайлан юм. Сайн болон муу үйлдлүүдийг тайлагнаснаар тухайн хүний кредит оноо өөрчлөгдөнө.
                                  </p>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>

                          <div className="h-px bg-slate-50" />

                          {/* CRC History */}
                          <div className="space-y-4">
                            <h5 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Тайлангийн түүх</h5>
                            {allCRCReports.length === 0 ? (
                              <p className="text-center py-8 text-slate-400 text-sm">Одоогоор тайлан байхгүй байна.</p>
                            ) : (
                              <div className="space-y-3">
                                {allCRCReports.slice(0, 10).map(report => (
                                  <div key={report.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                    <div className="flex items-center justify-between mb-2">
                                      <div className="flex items-center gap-2">
                                        <div className={cn(
                                          "w-6 h-6 rounded-full flex items-center justify-center text-white",
                                          report.type === 'good' ? "bg-emerald-500" : "bg-rose-500"
                                        )}>
                                          {report.type === 'good' ? <ShieldCheck size={12} /> : <ShieldAlert size={12} />}
                                        </div>
                                        <span className={cn(
                                          "text-[10px] font-bold uppercase tracking-wider",
                                          report.type === 'good' ? "text-emerald-600" : "text-rose-600"
                                        )}>
                                          {report.type === 'good' ? 'Good Report' : 'Bad Report'}
                                        </span>
                                      </div>
                                      <span className={cn(
                                        "font-bold text-sm",
                                        report.type === 'good' ? "text-emerald-600" : "text-rose-600"
                                      )}>
                                        {report.type === 'good' ? '+' : ''}{report.credit} Credit
                                      </span>
                                    </div>
                                    <p className="text-sm text-slate-700 font-medium mb-1">{report.reason}</p>
                                    <p className="text-[10px] text-slate-400">
                                      {report.timestamp?.toDate().toLocaleString()}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}

                  {(bookTab === 0 || bookTab === 4) && (
                    <motion.div
                      key="ctr"
                      initial={bookTab === 0 ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-6 mb-8"
                    >
                      {/* CTR Stats Cards */}
                      <div className="grid grid-cols-2 gap-4">
                        <button 
                          onClick={() => {
                            setCTRRatingType('free');
                            setShowCTRRatingModal(true);
                          }}
                          className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xl text-center hover:border-emerald-200 transition-all group"
                        >
                          <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-emerald-100 transition-colors">
                            <ShieldCheck className="text-emerald-600" size={24} />
                          </div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">CTR Free</p>
                          <h3 className="font-display font-bold text-xl text-slate-900">
                            {allCTRRatings.filter(r => r.type === 'free').length > 0
                              ? Math.round(allCTRRatings.filter(r => r.type === 'free').reduce((acc, curr) => acc + curr.rating, 0) / allCTRRatings.filter(r => r.type === 'free').length)
                              : 0}
                            <span className="text-xs text-slate-400 ml-1 font-sans">
                              ({allCTRRatings.filter(r => r.type === 'free').length} хүн)
                            </span>
                          </h3>
                          <p className="text-[10px] text-slate-400 font-medium mt-1">(Community Trust Rating)</p>
                        </button>
                        <button 
                          onClick={() => {
                            setCTRRatingType('paid');
                            setRatingStep('payment');
                            setShowCTRRatingModal(true);
                          }}
                          className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xl text-center hover:border-brand-200 transition-all group"
                        >
                          <div className="w-12 h-12 bg-brand-50 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-brand-100 transition-colors">
                            <Zap className="text-brand-600" size={24} />
                          </div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">CTR Paid</p>
                          <h3 className="font-display font-bold text-xl text-slate-900">
                            {allCTRRatings.filter(r => r.type === 'paid').length > 0
                              ? Math.round(allCTRRatings.filter(r => r.type === 'paid').reduce((acc, curr) => acc + curr.rating, 0) / allCTRRatings.filter(r => r.type === 'paid').length)
                              : 0}
                            <span className="text-xs text-slate-400 ml-1 font-sans">
                              ({allCTRRatings.filter(r => r.type === 'paid').length} хүн)
                            </span>
                          </h3>
                          <p className="text-[10px] text-slate-400 font-medium mt-1">(Community Trust Rating)</p>
                        </button>
                      </div>

                      {/* CTR Content */}
                      {bookTab !== 0 && (
                        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-xl space-y-6">
                          <div className="flex items-center justify-between">
                            <h4 className="font-display font-bold text-xl text-slate-900 flex items-center gap-2">
                              <div className="w-1.5 h-6 bg-emerald-500 rounded-full" />
                              Итгэлцлийн үнэлгээ
                            </h4>
                            <button 
                              onClick={() => setShowCTRInfo(!showCTRInfo)}
                              className="p-2 text-slate-400 hover:text-brand-600 transition-colors"
                            >
                              <Info size={20} />
                            </button>
                          </div>

                          <AnimatePresence>
                            {showCTRInfo && (
                              <motion.div 
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                              >
                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-sm text-slate-600 space-y-4">
                                  <p>
                                    Community Trust Rating - Энэхүү үнэлгээ нь олон нийтийн зүгээс тухайн хүнд хэр зэрэг итгэж буйг илэрхийлнэ.
                                  </p>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="bg-white p-4 rounded-xl border border-slate-100">
                                      <p className="font-bold text-slate-900 mb-1">CTR Free</p>
                                      <p className="text-xs">Үнэ төлбөргүйгээр 1-100 хүртэлх үнэлгээг өгөх боломжтой.</p>
                                    </div>
                                    <div className="bg-white p-4 rounded-xl border border-slate-100">
                                      <p className="font-bold text-slate-900 mb-1">CTR Paid</p>
                                      <p className="text-xs">5,000₮ төлөн 1-100 хүртэлх үнэлгээг өгөх боломжтой. Энэ нь илүү өндөр жинтэй үнэлгээ болно.</p>
                                    </div>
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>

                          <div className="h-px bg-slate-50" />

                          {/* CTR History */}
                          <div className="space-y-4">
                            <h5 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Үнэлгээний түүх</h5>
                            {allCTRRatings.length === 0 ? (
                              <p className="text-center py-8 text-slate-400 text-sm">Одоогоор үнэлгээ байхгүй байна.</p>
                            ) : (
                              <div className="space-y-3">
                                {allCTRRatings.slice(0, 10).map(rating => (
                                  <div key={rating.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                                    <div className="flex items-center gap-3">
                                      <div className={cn(
                                        "w-8 h-8 rounded-lg flex items-center justify-center text-white",
                                        rating.type === 'free' ? "bg-emerald-500" : "bg-brand-600"
                                      )}>
                                        {rating.type === 'free' ? <ShieldCheck size={14} /> : <Zap size={14} />}
                                      </div>
                                      <div>
                                        <p className="text-xs font-bold text-slate-900">
                                          {rating.type === 'free' ? 'CTR Free' : 'CTR Paid'}
                                        </p>
                                        <p className="text-[10px] text-slate-400">
                                          {rating.timestamp?.toDate().toLocaleString()}
                                        </p>
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <p className="font-bold text-brand-600">{rating.rating}</p>
                                      <p className="text-[10px] text-slate-400 uppercase font-bold">Rating</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}

                  {bookTab === 5 && (
                    <motion.div
                      key="biography"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-6"
                    >
                      <div className="flex items-center justify-between">
                        <h2 className="font-display font-bold text-2xl text-slate-900 flex items-center gap-2">
                          <BookOpen className="text-brand-600" />
                          Миний Намтар
                        </h2>
                        <button 
                          onClick={() => setShowBiographyForm(!showBiographyForm)}
                          className="px-4 py-2 bg-brand-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-brand-600/20 hover:bg-brand-700 transition-all flex items-center gap-2"
                        >
                          <Plus size={16} />
                          Ажил нэмэх
                        </button>
                      </div>

                      <AnimatePresence>
                        {showBiographyForm && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-xl space-y-4 mb-8">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Миний Хийсэн Ажил Нэр</label>
                                  <input 
                                    type="text" 
                                    value={biographyForm.projectName}
                                    onChange={e => setBiographyForm({...biographyForm, projectName: e.target.value})}
                                    placeholder="Ажлын нэр"
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-brand-500 outline-none"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Тухайн Ажлын Нийт Зардал</label>
                                  <input 
                                    type="number" 
                                    value={biographyForm.totalCost}
                                    onChange={e => setBiographyForm({...biographyForm, totalCost: e.target.value})}
                                    placeholder="Зардал (₮)"
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-brand-500 outline-none"
                                  />
                                </div>
                              </div>
                              <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Тайлбар</label>
                                <textarea 
                                  value={biographyForm.description}
                                  onChange={e => setBiographyForm({...biographyForm, description: e.target.value})}
                                  placeholder="Ажлын дэлгэрэнгүй тайлбар..."
                                  rows={4}
                                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-brand-500 outline-none resize-none"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Энэ Ажлыг Хийхэд Оролцсон Хүмүүс</label>
                                <input 
                                  type="text" 
                                  value={biographyForm.peopleInvolved}
                                  onChange={e => setBiographyForm({...biographyForm, peopleInvolved: e.target.value})}
                                  placeholder="Хүмүүсийн нэрс..."
                                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-brand-500 outline-none"
                                />
                              </div>
                              <button 
                                onClick={handleRegisterBiography}
                                disabled={isSubmitting || !biographyForm.projectName || !biographyForm.totalCost || !biographyForm.description || !biographyForm.peopleInvolved}
                                className="w-full py-4 bg-brand-600 text-white rounded-2xl font-bold text-lg shadow-xl shadow-brand-600/20 hover:bg-brand-700 transition-all disabled:opacity-50"
                              >
                                {isSubmitting ? 'Бүртгэж байна...' : 'Бүртгүүлэх'}
                              </button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <div className="space-y-6">
                        {allBiographyEntries.length === 0 ? (
                          <div className="bg-white p-12 rounded-3xl border border-slate-100 shadow-sm text-center">
                            <p className="text-slate-400 font-medium">Одоогоор намтар нэмэгдээгүй байна.</p>
                          </div>
                        ) : (
                          allBiographyEntries.map(entry => (
                            <div key={entry.id} className="bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden">
                              <div className="h-48 w-full overflow-hidden">
                                <img 
                                  src={entry.imageUrl} 
                                  alt={entry.projectName} 
                                  className="w-full h-full object-cover"
                                  referrerPolicy="no-referrer"
                                />
                              </div>
                              <div className="p-6 space-y-4">
                                <div className="flex justify-between items-start">
                                  <h3 className="font-display font-bold text-xl text-slate-900">{entry.projectName}</h3>
                                  <span className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-xs font-bold">
                                    {formatNumber(entry.totalCost)}₮
                                  </span>
                                </div>
                                <p className="text-slate-600 text-sm leading-relaxed">{entry.description}</p>
                                <div className="pt-4 border-t border-slate-50">
                                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Оролцсон хүмүүс</p>
                                  <p className="text-sm text-slate-700 font-medium">{entry.peopleInvolved}</p>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {activeTab === 'website' && (
              <div className="max-w-4xl mx-auto space-y-8 pb-24">
                {/* Sub-tabs */}
                <div className="flex bg-slate-100 p-1 rounded-2xl max-w-md mx-auto">
                  <button
                    onClick={() => setWebsiteSubTab('order')}
                    className={cn(
                      "flex-1 py-3 px-4 rounded-xl text-sm font-bold transition-all",
                      websiteSubTab === 'order' 
                        ? "bg-white text-brand-600 shadow-sm" 
                        : "text-slate-500 hover:text-slate-700"
                    )}
                  >
                    Website Хийлгэх
                  </button>
                  <button
                    onClick={() => setWebsiteSubTab('completed')}
                    className={cn(
                      "flex-1 py-3 px-4 rounded-xl text-sm font-bold transition-all",
                      websiteSubTab === 'completed' 
                        ? "bg-white text-brand-600 shadow-sm" 
                        : "text-slate-500 hover:text-slate-700"
                    )}
                  >
                    Хийлгэсэн хүмүүс
                  </button>
                </div>

                <AnimatePresence mode="wait">
                  {websiteSubTab === 'order' ? (
                    <motion.div
                      key="order"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-12"
                    >
                      <div className="text-center space-y-4">
                        <h2 className="font-display font-bold text-4xl md:text-5xl text-slate-900 tracking-tight">Website хийлгэх</h2>
                        <p className="text-slate-500 max-w-2xl mx-auto font-medium">
                          Бид таны бизнест зориулсан орчин үеийн, хурдан, найдвартай вэбсайтыг мэргэжлийн түвшинд хийж гүйцэтгэнэ.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 gap-8">
                        {/* Super Sale Section */}
                        <motion.div 
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="relative group"
                        >
                          <div className="absolute -inset-1 bg-gradient-to-r from-brand-600 to-amber-500 rounded-[2rem] blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200" />
                          <div className="relative bg-white p-8 md:p-12 rounded-[2rem] border border-slate-100 shadow-2xl overflow-hidden">
                            <div className="absolute top-0 right-0 p-6">
                              <span className="bg-amber-100 text-amber-600 px-4 py-1 rounded-full text-xs font-black uppercase tracking-widest">Super Sale</span>
                            </div>
                            
                            <div className="flex flex-col md:flex-row gap-8 items-center">
                              <div className="w-24 h-24 bg-brand-50 rounded-3xl flex items-center justify-center shrink-0">
                                <Zap size={48} className="text-brand-600" />
                              </div>
                              <div className="space-y-4 text-center md:text-left">
                                <h3 className="font-display font-bold text-2xl md:text-3xl text-slate-900">Rent me for one day</h3>
                                <p className="text-slate-600 leading-relaxed">
                                  Хүссэн зүйлээ хийлгэ <span className="font-bold text-brand-600">1,000,000₮</span> <span className="line-through text-slate-400">10,000,000₮</span> чадахаараа магадгүй <span className="font-bold text-emerald-600">30,000,000₮</span> амжуул хийлгээрэй.
                                </p>
                                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                                  <p className="text-sm text-slate-500 italic leading-relaxed">
                                    "Манайд хамгийн сүүлд нэг өдрийн дотор <span className="font-bold text-slate-900">13,000,000₮</span> иж бүрэн Website болсон хүн байгаа энэ хүн ердөө надад <span className="font-bold text-brand-600">2,000,000₮</span> өгөөд л ийм зүйл хийлгэлээ."
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </motion.div>

                        {/* Standard Packages */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <motion.div 
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1 }}
                            className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-xl space-y-6"
                          >
                            <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center">
                              <FileText size={28} className="text-blue-600" />
                            </div>
                            <div className="space-y-2">
                              <h4 className="font-display font-bold text-xl text-slate-900">Энгийн Танилцуулга</h4>
                              <p className="text-3xl font-black text-brand-600">3,000,000₮</p>
                            </div>
                            <ul className="space-y-3 text-sm text-slate-500">
                              <li className="flex items-center gap-2">
                                <CheckCircle size={16} className="text-emerald-500" />
                                7-14 хоногт хийж гүйцэтгэнэ
                              </li>
                              <li className="flex items-center gap-2">
                                <CheckCircle size={16} className="text-emerald-500" />
                                Орчин үеийн дизайн
                              </li>
                              <li className="flex items-center gap-2">
                                <CheckCircle size={16} className="text-emerald-500" />
                                Гар утсанд тохирсон
                              </li>
                            </ul>
                          </motion.div>

                          <motion.div 
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 }}
                            className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-xl space-y-6"
                          >
                            <div className="w-14 h-14 bg-purple-50 rounded-2xl flex items-center justify-center">
                              <ShoppingBag size={28} className="text-purple-600" />
                            </div>
                            <div className="space-y-2">
                              <h4 className="font-display font-bold text-xl text-slate-900">Иж Бүрэн E-Commerce</h4>
                              <p className="text-3xl font-black text-brand-600">10,000,000₮</p>
                            </div>
                            <ul className="space-y-3 text-sm text-slate-500">
                              <li className="flex items-center gap-2">
                                <CheckCircle size={16} className="text-emerald-500" />
                                28 хоногт хийж гүйцэтгэнэ
                              </li>
                              <li className="flex items-center gap-2">
                                <CheckCircle size={16} className="text-emerald-500" />
                                Төлбөрийн систем интеграци
                              </li>
                              <li className="flex items-center gap-2">
                                <CheckCircle size={16} className="text-emerald-500" />
                                Бараа материалын удирдлага
                              </li>
                            </ul>
                          </motion.div>
                        </div>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="completed"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-8"
                    >
                      {/* Admin Form */}
                      {isOwner && (
                        <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-xl space-y-6">
                          <h3 className="font-display font-bold text-xl text-slate-900">Шинэ Website нэмэх</h3>
                          <form onSubmit={handleAddCompletedWebsite} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <label className="text-xs font-bold text-slate-400 uppercase">Нэр</label>
                              <input 
                                type="text" 
                                value={websiteForm.name}
                                onChange={e => setWebsiteForm({...websiteForm, name: e.target.value})}
                                placeholder="Вэбсайтын нэр"
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-brand-500 outline-none"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-xs font-bold text-slate-400 uppercase">Дэлгүүр (Link)</label>
                              <input 
                                type="text" 
                                value={websiteForm.shopUrl}
                                onChange={e => setWebsiteForm({...websiteForm, shopUrl: e.target.value})}
                                placeholder="https://..."
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-brand-500 outline-none"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-xs font-bold text-slate-400 uppercase">Захиалагч</label>
                              <input 
                                type="text" 
                                value={websiteForm.clientName}
                                onChange={e => setWebsiteForm({...websiteForm, clientName: e.target.value})}
                                placeholder="Захиалагчийн нэр"
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-brand-500 outline-none"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-xs font-bold text-slate-400 uppercase">Рекорд</label>
                              <input 
                                type="text" 
                                value={websiteForm.record}
                                onChange={e => setWebsiteForm({...websiteForm, record: e.target.value})}
                                placeholder="Жишээ: 1 өдөрт"
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-brand-500 outline-none"
                              />
                            </div>
                            <div className="md:col-span-2 space-y-1">
                              <label className="text-xs font-bold text-slate-400 uppercase">Зураг</label>
                              <div className="flex gap-4 items-center">
                                <label className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed border-slate-200 hover:border-brand-500 cursor-pointer transition-all">
                                  <Camera size={20} className="text-slate-400" />
                                  <span className="text-sm text-slate-500 font-medium">Зураг сонгох</span>
                                  <input type="file" accept="image/*" onChange={handleWebsiteImageChange} className="hidden" />
                                </label>
                                {websiteForm.imageUrl && (
                                  <img src={websiteForm.imageUrl} className="w-12 h-12 rounded-xl object-cover" />
                                )}
                              </div>
                            </div>
                            <button 
                              type="submit"
                              disabled={isSubmittingWebsite}
                              className="md:col-span-2 py-4 bg-brand-600 text-white rounded-2xl font-bold shadow-lg shadow-brand-600/20 hover:bg-brand-700 transition-all disabled:opacity-50"
                            >
                              {isSubmittingWebsite ? 'Нэмж байна...' : 'Хадгалах'}
                            </button>
                          </form>
                        </div>
                      )}

                      {/* Completed Websites List */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {completedWebsites.length === 0 ? (
                          <div className="md:col-span-2 text-center py-24 bg-white rounded-[2rem] border border-dashed border-slate-200">
                            <Globe size={48} className="text-slate-200 mx-auto mb-4" />
                            <p className="text-slate-400 font-medium">Одоогоор хийгдсэн вэбсайт байхгүй байна.</p>
                          </div>
                        ) : (
                          completedWebsites.map((site) => (
                            <motion.div 
                              key={site.id}
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className="bg-white rounded-[2rem] border border-slate-100 shadow-xl overflow-hidden group"
                            >
                              <div className="aspect-video overflow-hidden relative">
                                <img 
                                  src={site.imageUrl} 
                                  alt={site.name} 
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                  referrerPolicy="no-referrer"
                                />
                                <div className="absolute top-4 right-4">
                                  <span className="bg-brand-600 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg">
                                    {site.record}
                                  </span>
                                </div>
                              </div>
                              <div className="p-6 space-y-4">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <h4 className="font-display font-bold text-xl text-slate-900">{site.name}</h4>
                                    <p className="text-xs text-slate-400 font-medium">Захиалагч: {site.clientName}</p>
                                  </div>
                                  <a 
                                    href={site.shopUrl} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="p-2 bg-slate-50 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-xl transition-all"
                                  >
                                    <Globe size={20} />
                                  </a>
                                </div>
                              </div>
                            </motion.div>
                          ))
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {activeTab === 'lucky_draw' && (() => {
              // CS:GO reel constants
              const ITEM_W = 110;
              const GAP = 8;
              const ITEM_TOTAL = ITEM_W + GAP; // 118px
              const CONTAINER_CENTER = 160; // ~half of max-w-sm visible area
              const startLeft = CONTAINER_CENTER - ITEM_W / 2; // 105px — item[0] starts centered

              const displayItems = reelItems.length > 0
                ? reelItems
                : recentSupports.slice(0, 12);

              return (
                <div className="relative min-h-full flex flex-col bg-slate-50 overflow-hidden">

                  {/* Subtle top accent */}
                  <div className="absolute top-0 left-0 right-0 h-40 pointer-events-none"
                    style={{ background: 'linear-gradient(180deg, rgba(2,132,199,0.07) 0%, transparent 100%)' }} />

                  <div className="relative z-10 w-full max-w-sm mx-auto flex flex-col gap-5 pt-8 pb-6">

                    {/* Title */}
                    <div className="text-center px-6">
                      <motion.div
                        animate={{ rotate: [0, -8, 8, -8, 0] }}
                        transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                        className="inline-block mb-2"
                      >
                        <Trophy size={36} className="text-amber-400" style={{ filter: 'drop-shadow(0 0 10px rgba(251,191,36,0.45))' }} />
                      </motion.div>
                      <div className="flex items-center justify-center gap-2">
                        <h2 className="font-display font-black text-2xl text-slate-900 tracking-tight">Азтан Тодруулах</h2>
                        <button onClick={() => setShowLuckyDrawInfo(true)} className="text-slate-400 hover:text-slate-600 transition-colors mt-0.5">
                          <Info size={16} />
                        </button>
                      </div>
                      <p className="text-slate-400 text-xs mt-1">{recentSupports.length} хүний дотроос тодруулна</p>
                    </div>

                    {/* ── CS:GO Reel ── */}
                    <div className="relative w-full" style={{ height: 148 }}>
                      {/* Reel track */}
                      <div className="absolute inset-0 overflow-hidden"
                        style={{ backgroundColor: '#ffffff', boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.06), inset 0 -2px 10px rgba(0,0,0,0.06)' }}
                      >
                        {/* Items strip — anchored so item[0] is at container center */}
                        <div className="absolute top-0 bottom-0 flex items-center"
                          style={{ left: startLeft }}
                        >
                          <motion.div
                            className="flex"
                            style={{ gap: GAP }}
                            animate={{ x: reelX }}
                            transition={reelAnimating
                              ? { duration: 4, ease: [0.08, 0.82, 0.17, 1] }
                              : { duration: 0 }
                            }
                          >
                            {displayItems.map((item, i) => {
                              const isWon = !isSpinning && luckyWinner && i === 40 && reelItems.length > 0;
                              return (
                                <div key={i}
                                  className="flex-shrink-0 flex flex-col items-center justify-center gap-2 rounded-xl"
                                  style={{
                                    width: ITEM_W,
                                    height: 120,
                                    backgroundColor: isWon ? '#0284c7' : '#f1f5f9',
                                    border: isWon ? '2px solid #38bdf8' : '2px solid #e2e8f0',
                                    boxShadow: isWon ? '0 0 20px rgba(2,132,199,0.4)' : 'none',
                                    transition: 'background-color 0.3s, border-color 0.3s, box-shadow 0.3s',
                                  }}
                                >
                                  <div className="w-10 h-10 rounded-full flex items-center justify-center font-black text-base"
                                    style={{ backgroundColor: isWon ? 'rgba(255,255,255,0.25)' : '#e2e8f0', color: isWon ? '#fff' : '#64748b' }}
                                  >
                                    {(item.name || '?').charAt(0).toUpperCase()}
                                  </div>
                                  <p className="text-[9px] font-bold text-center px-2 leading-tight line-clamp-2"
                                    style={{ color: isWon ? '#fff' : '#64748b', maxWidth: ITEM_W - 8 }}
                                  >
                                    {item.name || 'Нэргүй'}
                                  </p>
                                </div>
                              );
                            })}
                          </motion.div>
                        </div>

                        {/* Left fade */}
                        <div className="absolute left-0 top-0 bottom-0 w-20 pointer-events-none z-10"
                          style={{ background: 'linear-gradient(90deg, #ffffff 0%, transparent 100%)' }} />
                        {/* Right fade */}
                        <div className="absolute right-0 top-0 bottom-0 w-20 pointer-events-none z-10"
                          style={{ background: 'linear-gradient(270deg, #ffffff 0%, transparent 100%)' }} />

                        {/* Center indicator line */}
                        <div className="absolute top-0 bottom-0 z-20 pointer-events-none"
                          style={{ left: '50%', transform: 'translateX(-50%)', width: 2, backgroundColor: '#0284c7' }} />
                        {/* Top arrow */}
                        <div className="absolute top-0 z-20 pointer-events-none"
                          style={{ left: '50%', transform: 'translateX(-50%)', width: 0, height: 0,
                            borderLeft: '7px solid transparent', borderRight: '7px solid transparent', borderTop: '9px solid #0284c7' }} />
                        {/* Bottom arrow */}
                        <div className="absolute bottom-0 z-20 pointer-events-none"
                          style={{ left: '50%', transform: 'translateX(-50%)', width: 0, height: 0,
                            borderLeft: '7px solid transparent', borderRight: '7px solid transparent', borderBottom: '9px solid #0284c7' }} />
                      </div>
                    </div>

                    {/* Lucky Draw Info popup */}
                    <AnimatePresence>
                      {showLuckyDrawInfo && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                          className="fixed inset-0 z-[500] flex items-center justify-center px-6"
                          style={{ backgroundColor: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(4px)' }}
                          onClick={() => setShowLuckyDrawInfo(false)}
                        >
                          <motion.div
                            initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
                            className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl space-y-4"
                            onClick={e => e.stopPropagation()}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-xl bg-brand-50 flex items-center justify-center" style={{ backgroundColor: '#e0f2fe' }}>
                                  <Info size={16} style={{ color: '#0284c7' }} />
                                </div>
                                <p className="font-black text-slate-900">Таарах Магадлал</p>
                              </div>
                              <button onClick={() => setShowLuckyDrawInfo(false)} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                                <X size={14} />
                              </button>
                            </div>
                            <p className="text-slate-500 text-sm leading-relaxed">
                              Хэрэглэгч дэмжлэг өгөх болон худалдан авалт хийх бүрт таарах магадлалаа нэмэгдүүлнэ.
                            </p>
                            <div className="space-y-2">
                              {[
                                { icon: '💰', label: 'Дэмжлэг бүрт', value: '10,000₮ → +0.1%', bg: 'bg-amber-50', border: 'border-amber-100' },
                                { icon: '🛒', label: 'Худалдан авалт', value: 'Захиалга бүрт +1%', bg: 'bg-sky-50', border: 'border-sky-100' },
                              ].map(r => (
                                <div key={r.label} className={`flex items-center gap-3 p-3 rounded-2xl ${r.bg} border ${r.border}`}>
                                  <span className="text-lg">{r.icon}</span>
                                  <div>
                                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">{r.label}</p>
                                    <p className="text-slate-700 font-bold text-sm">{r.value}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </motion.div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Winner popup modal */}
                    <AnimatePresence>
                      {!isSpinning && luckyWinner && (() => {
                        const amt = (luckyWinner as any).amount || 0;
                        const purchaseCount = allOrders.filter((o: any) =>
                          o.phone && (luckyWinner as any).phone && o.phone === (luckyWinner as any).phone
                        ).length;
                        const prob = Math.min(Math.floor(amt / 10000) * 0.1 + purchaseCount, 100);
                        return (
                          <motion.div
                            key="winner-overlay"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[400] flex items-center justify-center px-4"
                            style={{ backgroundColor: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(4px)' }}
                            onClick={() => setLuckyWinner(null)}
                          >
                            <motion.div
                              initial={{ opacity: 0, scale: 0.88 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.92 }}
                              transition={{ type: 'spring', stiffness: 320, damping: 30 }}
                              className="w-full max-w-sm bg-white rounded-3xl overflow-hidden shadow-2xl"
                              onClick={e => e.stopPropagation()}
                            >
                              {/* Top accent bar */}
                              <div className="h-1.5 w-full" style={{ background: 'linear-gradient(90deg, #0369a1, #0284c7, #38bdf8)' }} />

                              <div className="p-6 space-y-5">
                                {/* Trophy + close */}
                                <div className="flex items-start justify-between">
                                  <div className="flex items-center gap-3">
                                    <motion.div
                                      animate={{ rotate: [0, -10, 10, -10, 0] }}
                                      transition={{ duration: 0.6, delay: 0.3 }}
                                      className="w-12 h-12 rounded-2xl flex items-center justify-center"
                                      style={{ background: 'linear-gradient(135deg, #fbbf24, #f59e0b)' }}
                                    >
                                      <Trophy size={24} className="text-white" />
                                    </motion.div>
                                    <div>
                                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Тодорлогдлоо</p>
                                      <p className="font-black text-slate-900 text-base">Азтан иргэн</p>
                                    </div>
                                  </div>
                                  <button
                                    onClick={() => setLuckyWinner(null)}
                                    className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 hover:bg-slate-200 transition-colors"
                                  >
                                    <X size={14} />
                                  </button>
                                </div>

                                {/* Divider */}
                                <div className="h-px bg-slate-100" />

                                {/* Name */}
                                <div>
                                  <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em] mb-1">Нэр</p>
                                  <motion.p
                                    initial={{ x: -10, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.2 }}
                                    className="text-slate-900 font-black text-3xl tracking-tight"
                                  >{luckyWinner.name}</motion.p>
                                </div>

                                {/* Phone */}
                                <div>
                                  <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em] mb-1">Дугаар</p>
                                  <motion.p
                                    initial={{ x: -10, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.3 }}
                                    className="text-slate-700 font-bold text-xl tracking-widest"
                                  >{luckyWinner.phone || '—'}</motion.p>
                                </div>

                                {/* Amount */}
                                {amt > 0 && (
                                  <div>
                                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em] mb-1">Дэмжлэг</p>
                                    <motion.p
                                      initial={{ x: -10, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.35 }}
                                      className="text-slate-700 font-bold text-lg"
                                    >{amt.toLocaleString()}₮</motion.p>
                                  </div>
                                )}

                                {/* Match probability */}
                                <div>
                                  <div className="flex items-center justify-between mb-2">
                                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em]">Таарах Магадлал</p>
                                    <p className="font-black text-xl" style={{ color: '#0284c7' }}>{prob.toFixed(1)}%</p>
                                  </div>
                                  <div className="h-2.5 rounded-full overflow-hidden bg-slate-100">
                                    <motion.div
                                      initial={{ width: 0 }}
                                      animate={{ width: `${prob}%` }}
                                      transition={{ duration: 1, delay: 0.5, ease: 'easeOut' }}
                                      className="h-full rounded-full"
                                      style={{ background: 'linear-gradient(90deg, #0284c7, #38bdf8)' }}
                                    />
                                  </div>
                                </div>

                                {/* Close button */}
                                <motion.button
                                  whileTap={{ scale: 0.97 }}
                                  onClick={() => setLuckyWinner(null)}
                                  className="w-full py-3.5 rounded-2xl font-bold text-white text-sm"
                                  style={{ background: 'linear-gradient(135deg, #0369a1, #0284c7)' }}
                                >
                                  Хаах
                                </motion.button>
                              </div>
                            </motion.div>
                          </motion.div>
                        );
                      })()}
                    </AnimatePresence>

                    {/* Draw button */}
                    <div className="px-6">
                      <motion.button
                        onClick={handleLuckyDraw}
                        disabled={isSpinning || recentSupports.length === 0}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        className="w-full py-5 rounded-2xl font-black text-white text-lg relative overflow-hidden disabled:opacity-40"
                        style={{
                          background: isSpinning ? '#94a3b8' : 'linear-gradient(135deg, #0369a1 0%, #0284c7 60%, #0ea5e9 100%)',
                          boxShadow: isSpinning ? 'none' : '0 8px 24px rgba(2,132,199,0.3)',
                        }}
                      >
                        {!isSpinning && (
                          <motion.div className="absolute inset-0 opacity-25"
                            style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent)' }}
                            animate={{ x: ['-100%', '200%'] }}
                            transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 1 }}
                          />
                        )}
                        <span className="relative flex items-center justify-center gap-3">
                          {isSpinning
                            ? <><Loader2 className="animate-spin" size={20} />Тодруулж байна...</>
                            : <><Trophy size={20} />Азтан Тодруулах</>
                          }
                        </span>
                      </motion.button>
                      {recentSupports.length === 0 && (
                        <p className="text-rose-500 text-xs font-bold text-center mt-2">Одоогоор дэмжигч байхгүй байна</p>
                      )}
                    </div>

                  </div>
                </div>
              );
            })()}

            {activeTab === 'lottery' && (
              <div className="max-w-sm mx-auto px-4 py-6 space-y-6 pb-24">

                {/* ── 10-digit Slot Machine ── */}
                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                  <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg, #0369a1, #0284c7, #38bdf8)' }} />
                  <div className="p-5 space-y-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #0284c7, #38bdf8)' }}>
                        <Ticket size={16} className="text-white" />
                      </div>
                      <p className="font-black text-slate-900">Сугалааны дугаар</p>
                    </div>
                    <div className="flex gap-1 justify-center">
                      {slotDigits.map((digit, i) => (
                        <motion.div key={i}
                          animate={isSlotSpinning ? { y: [0, -4, 0] } : {}}
                          transition={{ duration: 0.15, repeat: isSlotSpinning ? Infinity : 0, delay: i * 0.02 }}
                          className="w-8 h-11 rounded-xl flex items-center justify-center font-black text-lg border"
                          style={{
                            backgroundColor: slotFinalNumber ? '#f0f9ff' : '#f8fafc',
                            borderColor: slotFinalNumber ? '#bae6fd' : '#e2e8f0',
                            color: slotFinalNumber ? '#0284c7' : '#475569',
                          }}
                        >
                          {digit}
                        </motion.div>
                      ))}
                    </div>
                    {slotFinalNumber && (
                      <motion.p initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                        className="text-center text-[11px] font-bold text-slate-400 tracking-widest"
                      >ТАНЫ ДУГААР</motion.p>
                    )}
                    <motion.button onClick={handleSlotSpin} disabled={isSlotSpinning} whileTap={{ scale: 0.97 }}
                      className="w-full py-4 rounded-2xl font-black text-white text-sm relative overflow-hidden disabled:opacity-50"
                      style={{ background: 'linear-gradient(135deg, #0369a1, #0284c7)', boxShadow: '0 6px 20px rgba(2,132,199,0.3)' }}
                    >
                      {!isSlotSpinning && (
                        <motion.div className="absolute inset-0 opacity-20"
                          style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent)' }}
                          animate={{ x: ['-100%', '200%'] }} transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
                        />
                      )}
                      <span className="relative flex items-center justify-center gap-2">
                        {isSlotSpinning ? <><Loader2 className="animate-spin" size={16} />Эргэж байна...</> : <><Ticket size={16} />Дугаар гаргах</>}
                      </span>
                    </motion.button>
                  </div>
                </div>

                {/* ── Сугалаа Авах ── */}
                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                  <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg, #f59e0b, #fbbf24, #0284c7)' }} />
                  <div className="p-5 space-y-4">
                    <p className="font-black text-slate-900">Сугалаа Авах</p>
                    <form onSubmit={handleLotteryPurchase} className="space-y-3">

                      {/* Name */}
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Нэр</label>
                        <input type="text" value={lotteryBuyForm.name}
                          onChange={e => setLotteryBuyForm(f => ({ ...f, name: e.target.value }))}
                          placeholder="Таны нэр"
                          className="w-full mt-1 px-4 py-3 rounded-xl border border-slate-200 focus:border-brand-500 outline-none text-sm"
                        />
                      </div>

                      {/* Phone */}
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Утас</label>
                        <input type="tel" value={lotteryBuyForm.phone}
                          onChange={e => setLotteryBuyForm(f => ({ ...f, phone: e.target.value }))}
                          placeholder="8888-8888"
                          className="w-full mt-1 px-4 py-3 rounded-xl border border-slate-200 focus:border-brand-500 outline-none text-sm"
                        />
                      </div>

                      {/* Kind selector */}
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Төрөл</label>
                        <div className="flex bg-slate-100 p-1 rounded-2xl mt-1">
                          {([['хожих_хүртлээ', 'Хожих Хүртлээ'], ['насан_туршын', 'Насан Туршын']] as const).map(([val, label]) => (
                            <button key={val} type="button"
                              onClick={() => setLotteryBuyKind(val)}
                              className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${lotteryBuyKind === val ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
                            >{label}</button>
                          ))}
                        </div>
                      </div>

                      {/* Price display */}
                      <div className="flex items-center justify-between px-4 py-3 rounded-xl border border-slate-100 bg-slate-50">
                        <span className="text-slate-500 text-sm font-medium">Үнэ</span>
                        <motion.span key={lotteryBuyKind}
                          initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                          className="font-black text-lg"
                          style={{ color: lotteryBuyKind === 'насан_туршын' ? '#d97706' : '#0284c7' }}
                        >
                          {lotteryBuyKind === 'насан_туршын' ? '250,000₮' : '100,000₮'}
                        </motion.span>
                      </div>

                      {/* Number selection */}
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Дугаар</label>
                        <div className="flex bg-slate-100 p-1 rounded-2xl mt-1">
                          <button type="button" onClick={() => setLotteryBuyForm(f => ({ ...f, useSlot: true }))}
                            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${lotteryBuyForm.useSlot ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
                          >Системийн тоо</button>
                          <button type="button" onClick={() => setLotteryBuyForm(f => ({ ...f, useSlot: false }))}
                            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${!lotteryBuyForm.useSlot ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
                          >Өөрийн тоо</button>
                        </div>
                        {lotteryBuyForm.useSlot ? (
                          slotFinalNumber ? (
                            <div className="flex gap-0.5 justify-center bg-sky-50 rounded-xl p-3 mt-2 border border-sky-100">
                              {slotFinalNumber.split('').map((d, i) => (
                                <div key={i} className="w-7 h-9 rounded-lg flex items-center justify-center font-black text-sm"
                                  style={{ backgroundColor: '#0284c7', color: '#fff' }}>{d}</div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-center text-xs text-slate-400 mt-2 font-medium">↑ Дээрх слотоос тоо гарга</p>
                          )
                        ) : (
                          <input type="text" maxLength={10} value={lotteryBuyForm.number}
                            onChange={e => setLotteryBuyForm(f => ({ ...f, number: e.target.value.replace(/\D/g, '') }))}
                            placeholder="10 оронтой тоо"
                            className="w-full mt-2 px-4 py-3 rounded-xl border border-slate-200 focus:border-brand-500 outline-none text-sm tracking-widest font-bold"
                          />
                        )}
                      </div>

                      <motion.button type="submit" whileTap={{ scale: 0.97 }}
                        disabled={isSubmittingBuy || !lotteryBuyForm.name || !lotteryBuyForm.phone || (lotteryBuyForm.useSlot && !slotFinalNumber) || (!lotteryBuyForm.useSlot && lotteryBuyForm.number.length !== 10)}
                        className="w-full py-4 rounded-2xl font-black text-white text-sm disabled:opacity-40 relative overflow-hidden"
                        style={{ background: 'linear-gradient(135deg, #0369a1, #0284c7)', boxShadow: '0 6px 20px rgba(2,132,199,0.3)' }}
                      >
                        <span className="flex items-center justify-center gap-2">
                          {isSubmittingBuy ? <><Loader2 className="animate-spin" size={16} />Уншиж байна...</> : 'Төлбөр Төлөх'}
                        </span>
                      </motion.button>
                    </form>
                  </div>
                </div>

                {/* ── Нийт Сугалаа ── */}
                <div className="space-y-3">
                  <p className="font-black text-slate-900 text-base px-1">Нийт Сугалаа</p>
                  {lotteryPurchases.length === 0 ? (
                    <div className="bg-white rounded-3xl border border-dashed border-slate-200 p-8 text-center">
                      <Ticket size={36} className="text-slate-200 mx-auto mb-3" />
                      <p className="text-slate-400 text-sm font-medium">Одоогоор сугалаа байхгүй байна</p>
                    </div>
                  ) : (
                    lotteryPurchases.map((p, i) => (
                      <motion.div key={p.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                        className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden"
                      >
                        <div className="h-0.5 w-full"
                          style={{ background: p.kind === 'насан_туршын' ? 'linear-gradient(90deg, #f59e0b, #fbbf24)' : 'linear-gradient(90deg, #0284c7, #38bdf8)' }}
                        />
                        <div className="p-4">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div>
                              <p className="font-black text-slate-900 text-sm">{p.name}</p>
                              <p className="text-slate-400 text-xs">{p.phone}</p>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-lg"
                                style={{
                                  backgroundColor: p.kind === 'насан_туршын' ? '#fef3c7' : '#e0f2fe',
                                  color: p.kind === 'насан_туршын' ? '#d97706' : '#0284c7',
                                }}
                              >
                                {p.kind === 'насан_туршын' ? 'Насан Туршын' : 'Хожих Хүртлээ'}
                              </span>
                              <p className="font-black text-slate-700 text-sm mt-1">{(p.price || 0).toLocaleString()}₮</p>
                            </div>
                          </div>
                          {/* Ticket number */}
                          <div className="flex gap-0.5 mt-2">
                            {String(p.number || '').split('').map((d: string, j: number) => (
                              <div key={j} className="w-6 h-8 rounded-md flex items-center justify-center font-black text-xs bg-slate-50 border border-slate-100 text-slate-600">
                                {d}
                              </div>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>

              </div>
            )}

            {activeTab === 'askify' && (() => {
              const currentQ = shuffledQs[qIndex];
              const topScore = askifyRecords[0]?.score ?? 0;
              const isNewRecord = askScore > 0 && askScore > topScore;

              // Answer button color
              const ansColor = (i: number) => {
                if (!ansRevealed) return eliminatedAnsList.includes(i) ? '#e2e8f0' : '#f8fafc';
                if (i === currentQ?.correctIndex) return '#dcfce7';
                if (i === selectedAns && i !== currentQ?.correctIndex) return '#fee2e2';
                return '#f8fafc';
              };
              const ansTextColor = (i: number) => {
                if (!ansRevealed) return eliminatedAnsList.includes(i) ? '#cbd5e1' : '#0f172a';
                if (i === currentQ?.correctIndex) return '#16a34a';
                if (i === selectedAns && i !== currentQ?.correctIndex) return '#dc2626';
                return '#94a3b8';
              };

              return (
                <div className="max-w-sm mx-auto px-4 py-6 space-y-5 pb-24">

                  {/* Header */}
                  <div className="flex items-center gap-3 px-1">
                    <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #7c3aed, #a855f7)' }}>
                      <Brain size={20} className="text-white" />
                    </div>
                    <div>
                      <h2 className="font-black text-slate-900 text-xl">Askify</h2>
                      <p className="text-slate-400 text-xs">{allQuestions.length} асуулт байна</p>
                    </div>
                  </div>

                  {/* Sub-tabs */}
                  <div className="flex bg-slate-100 p-1 rounded-2xl">
                    {([['play','Асуулт Асуух'],['add','Асуулт Нэмэх'],['records','Рекорд']] as const).map(([k,l]) => (
                      <button key={k} onClick={() => setAskifySubTab(k)}
                        className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${askifySubTab===k?'bg-white text-slate-900 shadow-sm':'text-slate-500'}`}
                      >{l}</button>
                    ))}
                  </div>

                  {/* ── Tab: Асуулт Нэмэх ── */}
                  {askifySubTab === 'add' && (
                    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                      <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg, #7c3aed, #a855f7, #ec4899)' }} />
                      <form onSubmit={handleAddQuestionSubmit} className="p-5 space-y-4">
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Асуулт</label>
                          <textarea value={addQForm.question} onChange={e => setAddQForm(f=>({...f, question: e.target.value}))}
                            placeholder="Асуултаа бичнэ үү..."
                            rows={3}
                            className="w-full mt-1 px-4 py-3 rounded-xl border border-slate-200 focus:border-violet-400 outline-none text-sm resize-none"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Хариултууд (зөв хариултыг сонгоно уу)</label>
                          {addQForm.answers.map((ans, i) => (
                            <div key={i} className="flex gap-2 items-center">
                              <button type="button" onClick={() => setAddQForm(f=>({...f, correctIndex: i}))}
                                className="w-6 h-6 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all"
                                style={{ borderColor: addQForm.correctIndex===i?'#7c3aed':'#e2e8f0', backgroundColor: addQForm.correctIndex===i?'#7c3aed':'transparent' }}
                              >
                                {addQForm.correctIndex===i && <div className="w-2 h-2 rounded-full bg-white"/>}
                              </button>
                              <input value={ans} onChange={e => {
                                const arr = [...addQForm.answers]; arr[i]=e.target.value;
                                setAddQForm(f=>({...f, answers: arr}));
                              }}
                                placeholder={`Хариулт ${i+1}`}
                                className="flex-1 px-3 py-2.5 rounded-xl border border-slate-200 focus:border-violet-400 outline-none text-sm"
                              />
                            </div>
                          ))}
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Асуултыг Оруулсан</label>
                          <input value={addQForm.addedBy} onChange={e => setAddQForm(f=>({...f, addedBy: e.target.value}))}
                            placeholder="Таны нэр"
                            className="w-full mt-1 px-4 py-3 rounded-xl border border-slate-200 focus:border-violet-400 outline-none text-sm"
                          />
                        </div>

                        {isOwner ? (
                          <motion.button type="submit" disabled={isSubmittingQ} whileTap={{ scale: 0.97 }}
                            className="w-full py-4 rounded-2xl font-black text-white text-sm disabled:opacity-40"
                            style={{ background: 'linear-gradient(135deg, #7c3aed, #a855f7)' }}
                          >
                            {isSubmittingQ ? 'Нэмж байна...' : 'Асуулт Нэмэх'}
                          </motion.button>
                        ) : (
                          <motion.button type="button" whileTap={{ scale: 0.97 }}
                            onClick={handleAddQuestionWithPay}
                            disabled={isSubmittingQ || !addQForm.question || addQForm.answers.some(a=>!a) || !addQForm.addedBy}
                            className="w-full py-4 rounded-2xl font-black text-white text-sm disabled:opacity-40"
                            style={{ background: 'linear-gradient(135deg, #7c3aed, #a855f7)' }}
                          >
                            5,000₮ төлж нэмэх
                          </motion.button>
                        )}
                      </form>
                    </div>
                  )}

                  {/* ── Tab: Асуулт Асуух ── */}
                  {askifySubTab === 'play' && (
                    <div className="space-y-4">
                      {!gameActive && !gameOver && (
                        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8 text-center space-y-5">
                          <motion.div animate={{ rotate: [0,-8,8,-8,0] }} transition={{ duration: 2, repeat: Infinity, repeatDelay: 2 }}>
                            <Brain size={48} className="mx-auto" style={{ color: '#7c3aed' }} />
                          </motion.div>
                          <div>
                            <p className="font-black text-slate-900 text-lg">Асуулт Асуух</p>
                            <p className="text-slate-400 text-sm mt-1">Буруу хариулах хүртлээ тоглоорой</p>
                          </div>
                          <div className="flex gap-2 text-xs font-bold text-slate-400 justify-center">
                            <span className="px-3 py-1.5 bg-slate-50 rounded-xl border border-slate-100">📞 Найз</span>
                            <span className="px-3 py-1.5 bg-slate-50 rounded-xl border border-slate-100">50/50</span>
                            <span className="px-3 py-1.5 bg-slate-50 rounded-xl border border-slate-100">💡 Асуулт</span>
                          </div>
                          <motion.button onClick={startGame} disabled={allQuestions.length===0} whileTap={{ scale: 0.97 }}
                            className="w-full py-4 rounded-2xl font-black text-white disabled:opacity-40"
                            style={{ background: 'linear-gradient(135deg, #7c3aed, #a855f7)' }}
                          >
                            {allQuestions.length===0 ? 'Асуулт байхгүй байна' : 'Эхлэх'}
                          </motion.button>
                        </div>
                      )}

                      {gameActive && currentQ && (
                        <div className="space-y-4">
                          {/* Score + lifelines */}
                          <div className="flex items-center justify-between">
                            <div className="px-4 py-2 bg-white rounded-2xl border border-slate-100 shadow-sm">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Оноо</span>
                              <p className="font-black text-violet-600 text-xl">{askScore}</p>
                            </div>
                            <div className="flex gap-2">
                              {/* Call friend */}
                              <motion.button whileTap={{ scale: 0.95 }} onClick={useLifelineCallFriend}
                                disabled={lifelineUsed.callFriend}
                                className="w-11 h-11 rounded-2xl flex items-center justify-center font-black text-sm border transition-all disabled:opacity-30"
                                style={{ backgroundColor: lifelineUsed.callFriend?'#f8fafc':'#f0fdf4', borderColor: lifelineUsed.callFriend?'#e2e8f0':'#86efac' }}
                                title="Найзруугаа залгах"
                              ><Phone size={18} style={{ color: lifelineUsed.callFriend?'#94a3b8':'#16a34a' }} /></motion.button>
                              {/* 50/50 */}
                              <motion.button whileTap={{ scale: 0.95 }} onClick={useLifelineFiftyFifty}
                                disabled={lifelineUsed.fiftyFifty}
                                className="w-11 h-11 rounded-2xl flex items-center justify-center font-black text-xs border transition-all disabled:opacity-30"
                                style={{ backgroundColor: lifelineUsed.fiftyFifty?'#f8fafc':'#fefce8', borderColor: lifelineUsed.fiftyFifty?'#e2e8f0':'#fde047' }}
                                title="Буруу 2 хариулт хасах"
                              ><span style={{ color: lifelineUsed.fiftyFifty?'#94a3b8':'#ca8a04' }}>50/50</span></motion.button>
                              {/* Add question */}
                              <motion.button whileTap={{ scale: 0.95 }}
                                disabled={lifelineUsed.addQuestion}
                                onClick={() => setShowAddQLifeline(true)}
                                className="w-11 h-11 rounded-2xl flex items-center justify-center font-black text-sm border transition-all disabled:opacity-30"
                                style={{ backgroundColor: lifelineUsed.addQuestion?'#f8fafc':'#f0f9ff', borderColor: lifelineUsed.addQuestion?'#e2e8f0':'#7dd3fc' }}
                                title="Асуулт нэмэх — 5,000₮"
                              ><span style={{ color: lifelineUsed.addQuestion?'#94a3b8':'#0284c7', fontSize: 10, fontWeight: 900 }}>+Q</span></motion.button>
                            </div>
                          </div>

                          {/* Friend hint */}
                          {showFriendHint && (
                            <motion.div initial={{ opacity:0, y:-8 }} animate={{ opacity:1, y:0 }}
                              className="bg-green-50 border border-green-100 rounded-2xl p-3 flex items-center gap-2"
                            >
                              <Phone size={14} className="text-green-600 flex-shrink-0" />
                              <p className="text-green-700 text-xs font-bold">
                                Найз минь "{currentQ.answers[currentQ.correctIndex]}" гэж хэллээ
                              </p>
                            </motion.div>
                          )}

                          {/* Question card */}
                          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                            <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg, #7c3aed, #a855f7)' }} />
                            <div className="p-5">
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                                {qIndex + 1}-р асуулт · {currentQ.addedBy} оруулсан
                              </p>
                              <p className="font-black text-slate-900 text-base leading-snug">{currentQ.question}</p>
                            </div>
                          </div>

                          {/* Answer buttons */}
                          <div className="grid grid-cols-2 gap-2">
                            {(currentQ.answers as string[]).map((ans, i) => (
                              <motion.button key={i} whileTap={{ scale: eliminatedAnsList.includes(i)?1:0.97 }}
                                onClick={() => !eliminatedAnsList.includes(i) && handleAnswer(i)}
                                disabled={eliminatedAnsList.includes(i) || ansRevealed}
                                className="p-3 rounded-2xl border-2 text-sm font-bold text-left transition-all"
                                style={{ backgroundColor: ansColor(i), borderColor: ansColor(i)==='#dcfce7'?'#86efac':ansColor(i)==='#fee2e2'?'#fca5a5':'#e2e8f0', color: ansTextColor(i) }}
                              >
                                <span className="text-[10px] font-black opacity-50 mr-1">{['A','B','C','D'][i]}</span>
                                {ans}
                              </motion.button>
                            ))}
                          </div>
                        </div>
                      )}

                      {gameOver && (
                        <div className="space-y-4">
                          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                            className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 text-center space-y-3"
                          >
                            <p className="text-4xl">{askScore >= topScore && askScore > 0 ? '🏆' : '😔'}</p>
                            <p className="font-black text-slate-900 text-xl">Оноо: {askScore}</p>
                            {isNewRecord && <p className="text-violet-600 font-black text-sm">Шинэ рекорд!</p>}
                            {isNewRecord && !recordSaved && (
                              <div className="space-y-3 mt-4">
                                <p className="text-slate-500 text-xs">Рекордоо хадгалахын тулд нэрээ оруулна уу</p>
                                <input value={playerName} onChange={e => setPlayerName(e.target.value)}
                                  placeholder="Таны нэр" className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none text-sm" />
                                <motion.button onClick={handleSaveRecord} disabled={!playerName.trim()} whileTap={{ scale: 0.97 }}
                                  className="w-full py-3 rounded-2xl font-black text-white text-sm disabled:opacity-40"
                                  style={{ background: 'linear-gradient(135deg, #7c3aed, #a855f7)' }}
                                >Рекорд хадгалах & Спин эргүүлэх</motion.button>
                              </div>
                            )}
                            <motion.button onClick={startGame} whileTap={{ scale: 0.97 }}
                              className="w-full py-3 rounded-2xl font-bold text-slate-700 text-sm bg-slate-100 hover:bg-slate-200 transition-colors"
                            >Дахин тоглох</motion.button>
                          </motion.div>

                          {/* Spin wheel section */}
                          {showSpinWheel && (
                            <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }}
                              className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden"
                            >
                              <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg, #f59e0b, #a855f7, #0284c7)' }} />
                              <div className="p-6 text-center space-y-4">
                                <p className="font-black text-slate-900">Шагнал Спин</p>
                                {prizes.length === 0 ? (
                                  <p className="text-slate-400 text-sm">Шагнал тохируулаагүй байна</p>
                                ) : (
                                  <>
                                    {/* Wheel visual */}
                                    <div className="relative w-40 h-40 mx-auto">
                                      <motion.div
                                        className="w-full h-full rounded-full border-4 border-violet-200 overflow-hidden"
                                        style={{ background: `conic-gradient(${prizes.map((p:any,i:number)=>`hsl(${i*360/prizes.length},70%,60%) ${i*100/prizes.length}% ${(i+1)*100/prizes.length}%`).join(',')})` }}
                                        animate={{ rotate: wheelDeg }}
                                        transition={isWheelSpinning ? { duration: 3.5, ease: [0.1, 0.8, 0.3, 1] } : { duration: 0 }}
                                      />
                                      <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="w-8 h-8 rounded-full bg-white border-2 border-violet-300 shadow-md" />
                                      </div>
                                      {/* Pointer */}
                                      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 w-0 h-0"
                                        style={{ borderLeft:'8px solid transparent', borderRight:'8px solid transparent', borderTop:'12px solid #7c3aed' }} />
                                    </div>

                                    {wonPrize ? (
                                      <motion.div initial={{ scale:0.8, opacity:0 }} animate={{ scale:1, opacity:1 }}
                                        className="p-4 rounded-2xl border border-violet-100 bg-violet-50"
                                      >
                                        <p className="text-violet-700 font-black text-lg">🎉 {wonPrize.name}</p>
                                        <p className="text-violet-500 text-xs mt-1">Та хожлоо!</p>
                                      </motion.div>
                                    ) : (
                                      <motion.button onClick={handleSpinWheel} disabled={isWheelSpinning} whileTap={{ scale: 0.97 }}
                                        className="w-full py-4 rounded-2xl font-black text-white disabled:opacity-40"
                                        style={{ background: 'linear-gradient(135deg, #7c3aed, #a855f7)' }}
                                      >
                                        {isWheelSpinning ? <><Loader2 className="animate-spin inline mr-2" size={16}/>Эргэж байна...</> : 'Спин Эргүүлэх'}
                                      </motion.button>
                                    )}
                                  </>
                                )}
                              </div>
                            </motion.div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* ── Tab: Рекорд ── */}
                  {askifySubTab === 'records' && (
                    <div className="space-y-3">
                      {askifyRecords.length === 0 ? (
                        <div className="bg-white rounded-3xl border border-dashed border-slate-200 p-8 text-center">
                          <Trophy size={36} className="text-slate-200 mx-auto mb-3" />
                          <p className="text-slate-400 text-sm">Рекорд байхгүй байна</p>
                        </div>
                      ) : (
                        askifyRecords.map((r, i) => (
                          <div key={r.id} className="bg-white rounded-2xl border border-slate-100 p-4 flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm"
                              style={{ background: i===0?'linear-gradient(135deg,#fbbf24,#f59e0b)':i===1?'linear-gradient(135deg,#94a3b8,#64748b)':i===2?'linear-gradient(135deg,#d97706,#b45309)':'#f1f5f9', color: i<3?'#fff':'#64748b' }}
                            >{i+1}</div>
                            <div className="flex-1">
                              <p className="font-black text-slate-900 text-sm">{r.name}</p>
                            </div>
                            <p className="font-black text-violet-600 text-lg">{r.score}</p>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                </div>
              );
            })()}

            {/* Askify: Add Question lifeline modal */}
            <AnimatePresence>
              {showAddQLifeline && (
                <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
                  className="fixed inset-0 z-[400] flex items-center justify-center px-4"
                  style={{ backgroundColor:'rgba(15,23,42,0.55)', backdropFilter:'blur(4px)' }}
                  onClick={() => setShowAddQLifeline(false)}
                >
                  <motion.div initial={{ scale:0.9, opacity:0 }} animate={{ scale:1, opacity:1 }} exit={{ scale:0.9, opacity:0 }}
                    transition={{ type:'spring', stiffness:320, damping:28 }}
                    className="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden"
                    onClick={e => e.stopPropagation()}
                  >
                    <div className="h-1.5 w-full" style={{ background:'linear-gradient(90deg,#7c3aed,#a855f7)' }} />
                    <div className="p-6 space-y-4">
                      <div className="flex items-center justify-between">
                        <p className="font-black text-slate-900">Асуулт нэмэх — 5,000₮</p>
                        <button onClick={() => setShowAddQLifeline(false)} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400"><X size={14}/></button>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Асуулт</label>
                        <textarea value={addQForm.question} onChange={e => setAddQForm(f=>({...f, question:e.target.value}))}
                          placeholder="Асуулт..." rows={2} className="w-full mt-1 px-3 py-2.5 rounded-xl border border-slate-200 outline-none text-sm resize-none" />
                      </div>
                      {addQForm.answers.map((ans, i) => (
                        <div key={i} className="flex gap-2 items-center">
                          <button type="button" onClick={() => setAddQForm(f=>({...f, correctIndex:i}))}
                            className="w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center"
                            style={{ borderColor:addQForm.correctIndex===i?'#7c3aed':'#e2e8f0', backgroundColor:addQForm.correctIndex===i?'#7c3aed':'transparent' }}
                          >{addQForm.correctIndex===i&&<div className="w-1.5 h-1.5 rounded-full bg-white"/>}</button>
                          <input value={ans} onChange={e=>{ const a=[...addQForm.answers]; a[i]=e.target.value; setAddQForm(f=>({...f, answers:a})); }}
                            placeholder={`Хариулт ${i+1}`} className="flex-1 px-3 py-2 rounded-xl border border-slate-200 outline-none text-sm" />
                        </div>
                      ))}
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Таны нэр</label>
                        <input value={addQForm.addedBy} onChange={e=>setAddQForm(f=>({...f, addedBy:e.target.value}))}
                          placeholder="Нэр" className="w-full mt-1 px-3 py-2.5 rounded-xl border border-slate-200 outline-none text-sm" />
                      </div>
                      <motion.button whileTap={{ scale:0.97 }} onClick={handleAddQuestionWithPay}
                        disabled={!addQForm.question||addQForm.answers.some(a=>!a)||!addQForm.addedBy}
                        className="w-full py-4 rounded-2xl font-black text-white text-sm disabled:opacity-40"
                        style={{ background:'linear-gradient(135deg,#7c3aed,#a855f7)' }}
                      >5,000₮ төлж нэмэх → Асуулт алгасах</motion.button>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {activeTab === 'shop' && (
              <div className="max-w-2xl mx-auto space-y-6 pb-24">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-brand-600 rounded-2xl flex items-center justify-center">
                      <ShoppingBag size={20} className="text-white" />
                    </div>
                    <div>
                      <h2 className="font-display font-bold text-2xl text-slate-900">Дэлгүүр</h2>
                      <p className="text-slate-400 text-xs">{products.length} бараа</p>
                    </div>
                  </div>
                  {!isAdminUnlocked && (
                    <button
                      onClick={() => setShowAdminLoginForm(!showAdminLoginForm)}
                      className="text-xs font-bold text-brand-600 hover:text-brand-700 uppercase tracking-widest flex items-center gap-1"
                    >
                      <Lock size={12} /> Admin Access
                    </button>
                  )}
                </div>

                {/* Admin Login Form */}
                {showAdminLoginForm && !isAdminUnlocked && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-3xl border border-slate-100 shadow-xl p-8 max-w-md mx-auto">
                    <div className="text-center mb-6">
                      <div className="w-16 h-16 bg-brand-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Lock size={32} className="text-brand-600" />
                      </div>
                      <h3 className="font-display font-bold text-xl text-slate-900">Admin Access</h3>
                      <p className="text-slate-500 text-sm">Бараа нэмэхийн тулд нэвтэрнэ үү</p>
                    </div>
                    <form onSubmit={handleAdminLogin} className="space-y-4">
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Имэйл</label>
                        <input
                          type="email"
                          value={adminLoginForm.email}
                          onChange={e => setAdminLoginForm({ ...adminLoginForm, email: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:border-brand-400 text-sm"
                          placeholder="admin@example.com"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Нууц үг</label>
                        <input
                          type="password"
                          value={adminLoginForm.password}
                          onChange={e => setAdminLoginForm({ ...adminLoginForm, password: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:border-brand-400 text-sm"
                          placeholder="••••••••"
                        />
                      </div>
                      {adminLoginError && (
                        <p className="text-red-500 text-xs font-medium">{adminLoginError}</p>
                      )}
                      <button
                        type="submit"
                        className="w-full py-4 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl shadow-lg shadow-brand-600/20 transition-all"
                      >
                        Нэвтрэх
                      </button>
                    </form>
                  </motion.div>
                )}


                {/* Product list */}
                {products.length === 0 ? (
                  <div className="bg-white rounded-3xl border border-slate-100 p-16 text-center">
                    <ShoppingBag size={48} className="text-slate-200 mx-auto mb-4" />
                    <p className="text-slate-400 font-medium">Одоогоор бараа байхгүй байна</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    {products.map((product) => (
                      <motion.div key={product.id}
                        whileHover={{ y: -8, shadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)' }}
                        className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden transition-all duration-300"
                      >
                        <div className="h-36 bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center relative group">
                          <div className="absolute inset-0 bg-brand-600/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                          {product.image ? (
                            <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                          ) : (
                            <Package size={40} className="text-brand-200" />
                          )}
                        </div>
                        <div className="p-3">
                          <h3 className="font-display font-bold text-slate-900 text-sm mb-1 leading-tight line-clamp-2">{product.name}</h3>
                          <div className="flex items-baseline gap-0.5 mb-3">
                            <span className="text-lg font-black text-brand-600">{Number(product.price).toLocaleString()}</span>
                            <span className="text-[10px] font-bold text-brand-400">₮</span>
                          </div>
                          <button
                            onClick={() => { setSelectedProduct(product); setOrderType('direct'); setOrderForm({ phone: '', address: '' }); }}
                            className="w-full py-2.5 bg-slate-900 hover:bg-brand-600 text-white font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 active:scale-[0.98]"
                          >
                            <ShoppingBag size={14} />
                            Захиалах
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'citizens' && (
              <div className="max-w-2xl mx-auto space-y-8 pb-24">
                <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-xl">
                  <h2 className="font-display font-bold text-2xl text-slate-900 mb-6 flex items-center gap-2">
                    <Users className="text-brand-600" />
                    Иргэд
                  </h2>
                  
                  <div className="space-y-4">
                    {uniqueCitizens.length === 0 ? (
                      <p className="text-center py-12 text-slate-400 font-medium">Одоогоор бүртгэлтэй иргэн байхгүй байна.</p>
                    ) : (
                      uniqueCitizens.map((supporter) => (
                        <div 
                          key={supporter.uniqueKey} 
                          onClick={() => setSelectedCitizen(supporter)}
                          className="p-4 rounded-2xl bg-white border border-slate-100 flex items-start gap-4 cursor-pointer hover:shadow-md transition-all group"
                        >
                          <div className="w-12 h-12 rounded-full bg-brand-100 flex items-center justify-center text-brand-600 font-bold text-lg flex-shrink-0 group-hover:bg-brand-200 transition-colors">
                            {supporter.name.charAt(0)}
                          </div>
                          <div className="flex-grow">
                            <div className="flex items-center justify-between mb-1">
                              <h4 className="font-bold text-slate-900">{supporter.name}</h4>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full">
                                  {supporter.supportCount} удаа
                                </span>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                  {supporter.timestamp?.toDate().toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                            <p className="text-xs text-slate-500 mb-2">{supporter.phone.replace(/(\d{4})(\d{4})/, '$1-****')}</p>
                            <div className="flex items-center justify-between">
                              <p className="text-xs font-bold text-emerald-600">{formatCurrency(supporter.totalAmount)}</p>
                              {supporter.businessInfo && (
                                <p className="text-[10px] text-slate-400 italic line-clamp-1 max-w-[150px]">"{supporter.businessInfo}"</p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'support' && (
              <div className="max-w-2xl mx-auto bg-white p-8 rounded-3xl border border-slate-100 shadow-xl mb-24">
                <h2 className="font-display font-bold text-2xl text-slate-900 mb-6 flex items-center gap-2">
                  <Heart className="text-brand-600" />
                  Дэмжлэг үзүүлэх
                </h2>
                
                <div className="space-y-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Нэр</label>
                      <input 
                        type="text" 
                        value={supportForm.name}
                        onChange={e => setSupportForm({...supportForm, name: e.target.value})}
                        placeholder="Таны нэр"
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-brand-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Дугаар</label>
                      <input 
                        type="tel" 
                        value={supportForm.phone}
                        onChange={e => setSupportForm({...supportForm, phone: e.target.value})}
                        placeholder="Таны утасны дугаар"
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-brand-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Дүн (₮)</label>
                      <input 
                        type="number" 
                        value={customAmount}
                        onChange={e => setCustomAmount(e.target.value)}
                        placeholder="Дэмжлэгийн дүн оруулна уу"
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-brand-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Захих Үг</label>
                      <textarea 
                        value={supportForm.message}
                        onChange={e => setSupportForm({...supportForm, message: e.target.value})}
                        placeholder="Жишээ нь: Заавал гишүүн болоорой..."
                        rows={3}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-brand-500 outline-none resize-none"
                      />
                    </div>
                  </div>

                  <button 
                    onClick={() => handleSupport({ ...supportForm, amount: Number(customAmount) })}
                    disabled={!supportForm.name || !customAmount}
                    className="w-full py-4 bg-brand-600 text-white rounded-2xl font-bold text-lg shadow-xl shadow-brand-600/20 hover:bg-brand-700 transition-all disabled:opacity-50"
                  >
                    Дэмжих
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'tasks' && (
              <div className="max-w-2xl mx-auto space-y-8 pb-24">
                {/* Task Sub-tabs */}
                <div className="flex bg-slate-100 p-1 rounded-2xl mb-8">
                  {['Даалгавар өгөх', 'Нийт даалгаврууд'].map((title, i) => (
                    <button
                      key={title}
                      onClick={() => setTaskTab(i)}
                      className={cn(
                        "flex-1 py-3 px-4 rounded-xl text-xs font-bold transition-all",
                        taskTab === i 
                          ? "bg-white text-brand-600 shadow-sm" 
                          : "text-slate-500 hover:text-slate-700"
                      )}
                    >
                      {title}
                    </button>
                  ))}
                </div>

                <AnimatePresence mode="wait">
                  {taskTab === 0 && (
                    <motion.div
                      key="give-task"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="bg-white p-8 rounded-3xl border border-slate-100 shadow-xl"
                    >
                      <h2 className="font-display font-bold text-2xl text-slate-900 mb-6 flex items-center gap-2">
                        <Plus className="text-brand-600" />
                        Даалгавар өгөх
                      </h2>

                      <div className="mb-8 p-4 bg-brand-50 border border-brand-100 rounded-2xl flex items-start gap-3">
                        <div className="p-2 bg-brand-100 rounded-xl text-brand-600">
                          <Zap size={20} />
                        </div>
                        <div>
                          <p className="font-bold text-brand-900 text-sm">Даалгавар өгөх нөхцөл</p>
                          <p className="text-brand-700 text-xs">Даалгавар өгөхийн тулд та 1,000,000₮ ба түүнээс дээш дэмжлэг өгөх шаардлагатай.</p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Нэр</label>
                            <input 
                              type="text" 
                              value={taskForm.name}
                              onChange={e => setTaskForm({...taskForm, name: e.target.value})}
                              placeholder="Таны нэр"
                              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-brand-500 outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Утас</label>
                            <input 
                              type="tel" 
                              value={taskForm.phone}
                              onChange={e => setTaskForm({...taskForm, phone: e.target.value})}
                              placeholder="Утасны дугаар"
                              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-brand-500 outline-none"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Өгөх Даалгавар</label>
                          <textarea 
                            value={taskForm.description}
                            onChange={e => setTaskForm({...taskForm, description: e.target.value})}
                            placeholder="Жишээ нь: 120 дээр сагсанбөмбөгийн талбай маш их хэрэгтэй байгаа энэ асуудлыг шийдэхийг хүсч байна."
                            rows={4}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-brand-500 outline-none resize-none"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Зураг хавсаргах</label>
                          <div className="flex items-center gap-4">
                            {taskImage ? (
                              <div className="relative w-32 h-32 rounded-2xl overflow-hidden border border-slate-200">
                                <img src={taskImage} alt="Task" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                <button 
                                  onClick={() => setTaskImage(null)}
                                  className="absolute top-1 right-1 p-1.5 bg-rose-500 text-white rounded-lg shadow-lg hover:bg-rose-600 transition-colors"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            ) : (
                              <label className="w-32 h-32 rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-brand-300 hover:bg-brand-50/30 transition-all text-slate-400 hover:text-brand-600">
                                <Upload size={24} />
                                <span className="text-[10px] font-bold uppercase tracking-wider">Зураг</span>
                                <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                              </label>
                            )}
                            <div className="flex-1">
                              <p className="text-[10px] text-slate-400 leading-relaxed">
                                Даалгавартай холбоотой зураг хавсаргаснаар илүү ойлгомжтой болох болно. (Макс: 800KB)
                              </p>
                            </div>
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Нэмэлт Дэмжлэг (Хэрвээ хүсвэл)</label>
                          <div className="flex flex-wrap gap-2">
                            {[0, 10000, 20000].map(amt => (
                              <button
                                key={amt}
                                onClick={() => setTaskSupportAmount(amt)}
                                className={cn(
                                  "px-4 py-2 rounded-xl text-sm font-bold transition-all",
                                  taskSupportAmount === amt 
                                    ? "bg-brand-600 text-white shadow-lg shadow-brand-600/20" 
                                    : "bg-slate-50 text-slate-500 hover:bg-slate-100"
                                )}
                              >
                                {amt === 0 ? 'Үгүй' : formatCurrency(amt)}
                              </button>
                            ))}
                            <button
                              onClick={() => setTaskSupportAmount('custom')}
                              className={cn(
                                "px-4 py-2 rounded-xl text-sm font-bold transition-all",
                                taskSupportAmount === 'custom' 
                                  ? "bg-brand-600 text-white shadow-lg shadow-brand-600/20" 
                                  : "bg-slate-50 text-slate-500 hover:bg-slate-100"
                              )}
                            >
                              Custom
                            </button>
                          </div>
                          {taskSupportAmount === 'custom' && (
                            <input 
                              type="number" 
                              value={customTaskSupport}
                              onChange={e => setCustomTaskSupport(e.target.value)}
                              placeholder="Дүн оруулна уу"
                              className="mt-3 w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-brand-500 outline-none"
                            />
                          )}
                        </div>

                        <button 
                          onClick={handleGiveTask}
                          disabled={isSubmitting || !taskForm.name || !taskForm.phone || !taskForm.description}
                          className="w-full py-4 bg-brand-600 text-white rounded-2xl font-bold text-lg shadow-xl shadow-brand-600/20 hover:bg-brand-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                          {isSubmitting ? 'Уншиж байна...' : 'Даалгавар Оруулах'}
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {taskTab === 1 && (
                    <motion.div
                      key="total-tasks"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-6"
                    >
                      <div className="flex items-center justify-between">
                        <h2 className="font-display font-bold text-2xl text-slate-900 flex items-center gap-2">
                          <ClipboardList className="text-brand-600" />
                          Нийт даалгаврууд
                        </h2>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest bg-slate-100 px-3 py-1 rounded-full">
                          {allTasks.length} Tasks
                        </p>
                      </div>

                      <div className="bg-brand-50 p-4 rounded-2xl border border-brand-100 mb-4">
                        <p className="text-xs font-bold text-brand-700 flex items-center gap-2">
                          <Zap size={14} />
                          Жагсаалтын ТОП 1 даалгаврыг манайх шууд авч хэрэгжүүлнэ!
                        </p>
                      </div>

                      {allTasks.length === 0 ? (
                        <div className="bg-white p-12 rounded-3xl border border-slate-100 shadow-sm text-center">
                          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <ClipboardList className="text-slate-300" size={32} />
                          </div>
                          <p className="text-slate-400 font-medium">Одоогоор даалгавар байхгүй байна.</p>
                        </div>
                      ) : (
                        [...allTasks]
                          .sort((a, b) => (b.likes || 0) - (a.likes || 0))
                          .map((task, index) => (
                          <div 
                            key={task.id} 
                            className={cn(
                              "bg-white p-6 rounded-3xl border transition-all relative overflow-hidden h-[280px] flex flex-col",
                              index === 0 ? "border-brand-200 shadow-xl shadow-brand-600/5 ring-2 ring-brand-500/10" : "border-slate-100 shadow-sm"
                            )}
                          >
                            {index === 0 && (
                              <div className="absolute top-0 right-0 bg-brand-600 text-white px-4 py-1 rounded-bl-2xl text-[10px] font-bold uppercase tracking-widest flex items-center gap-1 z-10">
                                <Crown size={12} />
                                Top 1
                              </div>
                            )}
                            
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-brand-50 flex items-center justify-center text-brand-600 font-bold">
                                  {task.name.charAt(0)}
                                </div>
                                <div>
                                  <p className="font-bold text-slate-900">{task.name}</p>
                                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                    {task.timestamp?.toDate().toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                              <div className={cn(
                                "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                                task.status === 'completed' ? "bg-emerald-100 text-emerald-600" :
                                task.status === 'in-progress' ? "bg-amber-100 text-amber-600" :
                                "bg-slate-100 text-slate-400"
                              )}>
                                {task.status}
                              </div>
                            </div>

                            <p className="text-slate-600 leading-relaxed mb-4 line-clamp-3 flex-grow">{task.description}</p>

                            <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-slate-50 mt-auto">
                              <div className="flex items-center gap-4">
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleLikeTask(task.id);
                                  }}
                                  className="flex items-center gap-1.5 text-slate-600 hover:text-emerald-600 transition-colors"
                                >
                                  <ThumbsUp size={16} />
                                  <span className="text-sm font-bold">{task.likes || 0}</span>
                                </button>
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDislikeTask(task.id);
                                  }}
                                  className="flex items-center gap-1.5 text-slate-600 hover:text-rose-600 transition-colors"
                                >
                                  <ThumbsDown size={16} />
                                  <span className="text-sm font-bold">{task.dislikes || 0}</span>
                                </button>
                              </div>
                              
                              <button
                                onClick={() => setSelectedTask(task)}
                                className="ml-auto text-brand-600 text-xs font-bold uppercase tracking-widest flex items-center gap-1 hover:text-brand-700 transition-colors"
                              >
                                Дэлгэрэнгүй <ChevronRight size={14} />
                              </button>
                              {(isAdmin || isAdminUnlocked) && (
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleDeleteTask(task.id); }}
                                  className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-colors"
                                >
                                  <Trash2 size={16} />
                                </button>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>
        </main>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-lg border-t border-slate-100 px-6 py-3 z-[100]">
        <div className="max-w-lg mx-auto flex justify-around items-center">
          <button 
            onClick={() => setActiveTab('apps')}
            className={cn("flex flex-col items-center gap-1 transition-all", activeTab === 'apps' ? "text-brand-600" : "text-slate-400 hover:text-slate-600")}
          >
            <Zap size={24} />
            <span className="text-[10px] font-bold uppercase tracking-wider">My Apps</span>
          </button>
          <button 
            onClick={() => setActiveTab('team')}
            className={cn("flex flex-col items-center gap-1 transition-all", activeTab === 'team' ? "text-brand-600" : "text-slate-400 hover:text-slate-600")}
          >
            <Trophy size={24} />
            <span className="text-[10px] font-bold uppercase tracking-wider">My Team</span>
          </button>
          <button 
            onClick={() => setActiveTab('support')}
            className={cn("flex flex-col items-center gap-1 transition-all", activeTab === 'support' ? "text-brand-600" : "text-slate-400 hover:text-slate-600")}
          >
            <div className={cn("p-3 rounded-2xl -mt-8 shadow-xl transition-all", activeTab === 'support' ? "bg-brand-600 text-white shadow-brand-600/40" : "bg-white text-slate-400 border border-slate-100")}>
              <Heart size={28} fill={activeTab === 'support' ? "currentColor" : "none"} />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider">Support</span>
          </button>
          <button 
            onClick={() => setActiveTab('tasks')}
            className={cn("flex flex-col items-center gap-1 transition-all", activeTab === 'tasks' ? "text-brand-600" : "text-slate-400 hover:text-slate-600")}
          >
            <ClipboardList size={24} />
            <span className="text-[10px] font-bold uppercase tracking-wider">Tasks</span>
          </button>
          <button
            onClick={() => setActiveTab('book')}
            className={cn("flex flex-col items-center gap-1 transition-all", activeTab === 'book' ? "text-brand-600" : "text-slate-400 hover:text-slate-600")}
          >
            <ClipboardList size={24} />
            <span className="text-[10px] font-bold uppercase tracking-wider">My Book</span>
          </button>
        </div>
      </div>

      <AnimatePresence>
        {selectedTier && (
          <SupportModal 
            tier={selectedTier} 
            onClose={() => setSelectedTier(null)}
            onSubmit={handleSupport}
          />
        )}
        {showSupportOthers && (
          <SupportOthersModal 
            onClose={() => setShowSupportOthers(false)}
            onSubmit={handleSupportOthers}
          />
        )}
        {showSupportersList && (
          <SupportersListModal 
            onClose={() => setShowSupportersList(false)}
            supporters={recentSupports}
          />
        )}
        {showSupportsHistory && (
          <SupportsHistoryModal 
            onClose={() => setShowSupportsHistory(false)}
            history={recentSupports}
          />
        )}
        {showQuickSupportModal && (
          <QuickSupportModal 
            onClose={() => setShowQuickSupportModal(false)}
            onConfirm={handleConfirmQuickSupport}
          />
        )}
        {showSuperModal && (
          <SuperSupportModal 
            onClose={() => setShowSuperModal(false)}
            onSubmit={handleSuperSupport}
          />
        )}
        {selectedCandidate && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" onClick={() => setSelectedCandidate(null)}>
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-8 bg-brand-600 text-white relative">
                <button onClick={() => setSelectedCandidate(null)} className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full transition-colors">
                  <X size={20} />
                </button>
                <div className="flex items-center gap-6">
                  <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center text-white font-bold text-4xl">
                    {selectedCandidate.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-3xl">{selectedCandidate.name}</h3>
                    <p className="text-white/80 font-bold uppercase tracking-widest text-sm">{selectedCandidate.profession}</p>
                  </div>
                </div>
              </div>
              <div className="p-8 space-y-6">
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Яагаад сонгогдох ёстой вэ?</h4>
                  <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                    <p className="text-slate-700 leading-relaxed italic">"{selectedCandidate.description}"</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                    <p className="text-2xl font-bold text-slate-900">{selectedCandidate.votes}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Нийт санал</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                    <p className="text-lg font-bold text-slate-900">{selectedCandidate.phone.replace(/(\d{4})(\d{4})/, '$1-****')}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Холбоо барих</p>
                  </div>
                </div>
                <button 
                  onClick={() => {
                    handleVoteCandidate(selectedCandidate.id);
                    setSelectedCandidate(null);
                  }}
                  className="w-full py-4 bg-brand-600 text-white rounded-2xl font-bold text-lg shadow-xl shadow-brand-600/20 hover:bg-brand-700 transition-all"
                >
                  Санал өгөх
                </button>
              </div>
            </motion.div>
          </div>
        )}
        {showIntro && (
          <IntroModal 
            onClose={() => setShowIntro(false)}
            onComplete={handleIntroComplete}
          />
        )}
        {/* Membership Purchase Modal */}
        <AnimatePresence>
          {showMembershipPurchaseModal && selectedMembershipPlan && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md"
              onClick={() => setShowMembershipPurchaseModal(false)}
            >
              <motion.div 
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="bg-white rounded-[2.5rem] w-full max-w-md overflow-hidden shadow-2xl"
                onClick={e => e.stopPropagation()}
              >
                <div className={cn("p-8 text-white relative bg-gradient-to-br", selectedMembershipPlan.color)}>
                  <button 
                    onClick={() => setShowMembershipPurchaseModal(false)}
                    className="absolute top-6 right-6 p-2 hover:bg-white/20 rounded-full transition-colors"
                  >
                    <X size={20} />
                  </button>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md">
                      <selectedMembershipPlan.icon size={32} />
                    </div>
                    <div>
                      <h3 className="font-display font-black text-2xl tracking-tight">{selectedMembershipPlan.name}</h3>
                      <p className="text-white/80 text-xs font-bold uppercase tracking-widest">Membership Access</p>
                    </div>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-black">{selectedMembershipPlan.price}</span>
                    <span className="text-white/60 text-xs font-bold uppercase tracking-widest">/{selectedMembershipPlan.period}</span>
                  </div>
                </div>

                <div className="p-8 space-y-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="block text-xs font-black text-slate-400 uppercase tracking-[0.15em]">Утасны дугаар</label>
                      <div className="flex gap-2">
                        <div className="relative flex-grow">
                          <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                          <input 
                            type="tel" 
                            value={membershipPurchasePhone}
                            onChange={e => {
                              setMembershipPurchasePhone(e.target.value);
                              setMembershipStatus(null);
                            }}
                            placeholder="Утасны дугаараа оруулна уу"
                            className="w-full pl-12 pr-4 py-4 rounded-2xl border border-slate-100 focus:border-brand-500 outline-none font-bold text-slate-900 transition-all"
                          />
                        </div>
                        <button 
                          onClick={() => handleCheckMembership(membershipPurchasePhone)}
                          disabled={!membershipPurchasePhone.trim() || isCheckingMembership}
                          className="px-6 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-all disabled:opacity-50"
                        >
                          {isCheckingMembership ? <Loader2 size={18} className="animate-spin" /> : 'Шалгах'}
                        </button>
                      </div>
                    </div>

                    {membershipStatus && (
                      <motion.div 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={cn(
                          "p-4 rounded-2xl border flex items-center gap-3",
                          membershipStatus.expiresAt 
                            ? "bg-emerald-50 border-emerald-100 text-emerald-700" 
                            : "bg-amber-50 border-amber-100 text-amber-700"
                        )}
                      >
                        {membershipStatus.expiresAt ? (
                          <>
                            <CheckCircle size={20} />
                            <div>
                              <p className="text-xs font-black uppercase tracking-wider">{membershipStatus.plan} Идэвхтэй</p>
                              <p className="text-[10px] font-bold opacity-80">Дуусах: {membershipStatus.expiresAt.toLocaleDateString()}</p>
                            </div>
                          </>
                        ) : (
                          <>
                            <AlertCircle size={20} />
                            <p className="text-xs font-black uppercase tracking-wider">Гишүүнчлэлгүй байна</p>
                          </>
                        )}
                      </motion.div>
                    )}
                  </div>

                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-3">Багцад багтсан:</p>
                    <div className="grid grid-cols-1 gap-2">
                      {selectedMembershipPlan.features.slice(0, 3).map((f: any, i: number) => (
                        <div key={i} className="flex items-center gap-2">
                          <CheckCircle size={12} className="text-emerald-500" />
                          <span className="text-xs font-bold text-slate-600">{f.text}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button 
                    onClick={async () => {
                      if (!membershipPurchasePhone.trim()) return;
                      
                      const prices: Record<string, number> = {
                        'Bronze': 1000,
                        'Silver': 5000,
                        'Gold': 10000,
                        'Diamond': 20000,
                        'VIP': 50000,
                        'Super VIP': 1000000
                      };
                      const amount = prices[selectedMembershipPlan.name] || 1000;
                      
                      const processMembership = async () => {
                        setIsSubmitting(true);
                        try {
                          await addDoc(collection(db, 'supports'), {
                            name: `User ${membershipPurchasePhone}`,
                            phone: membershipPurchasePhone,
                            message: `${selectedMembershipPlan.name} Membership авах хүсэлтэй`,
                            amount: amount,
                            tier: 'subscription',
                            isSubscription: true,
                            timestamp: serverTimestamp()
                          });
                          
                          const statsRef = doc(db, 'stats', 'global');
                          await setDoc(statsRef, {
                            totalAmount: increment(amount),
                            totalSupporters: increment(1),
                            totalSubscribers: increment(1),
                            'tierCounts.subscription': increment(1)
                          }, { merge: true });

                          setShowMembershipPurchaseModal(false);
                          setMembershipPurchasePhone('');
                          alert('Гишүүнчлэл амжилттай идэвхжлээ!');
                        } catch (error) {
                          console.error("Membership activation failed:", error);
                        } finally {
                          setIsSubmitting(false);
                        }
                      };

                      try {
                        setIsSubmitting(true);
                        const response = await axios.post('/api/qpay/invoice', {
                          amount: amount,
                          description: `${selectedMembershipPlan.name} Membership`,
                          senderPhone: membershipPurchasePhone
                        });
                        setQpayInvoice(response.data);
                        setOnPaymentSuccess(() => processMembership);
                      } catch (error) {
                        console.error("QPay invoice failed:", error);
                        alert("Нэхэмжлэх үүсгэхэд алдаа гарлаа.");
                      } finally {
                        setIsSubmitting(false);
                      }
                    }}
                    disabled={!membershipPurchasePhone.trim() || isSubmitting}
                    className={cn(
                      "w-full py-5 rounded-2xl font-black text-white shadow-xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 bg-gradient-to-br",
                      selectedMembershipPlan.color
                    )}
                  >
                    {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <CreditCard size={20} />}
                    <span>Төлбөр төлөх</span>
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {qpayInvoice && (
          <QPayModal 
            invoice={qpayInvoice}
            onClose={() => setQpayInvoice(null)}
            onSuccess={() => {
              if (onPaymentSuccess) onPaymentSuccess();
              setQpayInvoice(null);
            }}
          />
        )}
        {selectedTask && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md"
            onClick={() => setSelectedTask(null)}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-6 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-display font-bold text-xl text-slate-900">Даалгаврын дэлгэрэнгүй</h3>
                <button onClick={() => setSelectedTask(null)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                  <X size={20} className="text-slate-500" />
                </button>
              </div>
              <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-brand-50 flex items-center justify-center text-brand-600 font-bold text-2xl">
                    {selectedTask.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-xl">{selectedTask.name}</h4>
                    <p className="text-sm text-slate-400 font-medium">{selectedTask.timestamp?.toDate().toLocaleString()}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                    <p className="text-slate-700 leading-relaxed">{selectedTask.description}</p>
                  </div>

                  {selectedTask.imageUrl && (
                    <div className="rounded-2xl overflow-hidden border border-slate-100">
                      <img 
                        src={selectedTask.imageUrl} 
                        alt="Task" 
                        className="w-full h-auto object-cover" 
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100">
                      <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest mb-1">Дэмжлэг</p>
                      <p className="text-xl font-bold text-emerald-700">{formatCurrency(selectedTask.supportAmount || 0)}</p>
                    </div>
                    <div className="bg-brand-50 p-4 rounded-2xl border border-brand-100">
                      <p className="text-[10px] text-brand-600 font-bold uppercase tracking-widest mb-1">Төлөв</p>
                      <p className="text-xl font-bold text-brand-700 capitalize">{selectedTask.status}</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 pt-6 border-t border-slate-100">
                  <button 
                    onClick={() => handleLikeTask(selectedTask.id)}
                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-emerald-50 text-emerald-600 rounded-xl font-bold hover:bg-emerald-100 transition-colors"
                  >
                    <ThumbsUp size={18} />
                    {selectedTask.likes || 0} Like
                  </button>
                  <button 
                    onClick={() => handleDislikeTask(selectedTask.id)}
                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-rose-50 text-rose-600 rounded-xl font-bold hover:bg-rose-100 transition-colors"
                  >
                    <ThumbsDown size={18} />
                    {selectedTask.dislikes || 0} Dislike
                  </button>
                </div>

                {selectedTask.status === 'pending' ? (
                  <button 
                    onClick={() => {
                      handleTakeTask(selectedTask);
                      setSelectedTask(null);
                    }}
                    className="w-full py-4 bg-brand-600 text-white rounded-2xl font-bold text-lg shadow-xl shadow-brand-600/20 hover:bg-brand-700 transition-all flex items-center justify-center gap-2"
                  >
                    <Play size={20} fill="currentColor" />
                    Take Task
                  </button>
                ) : (
                  <button 
                    onClick={() => {
                      setActiveTaskForChat(selectedTask);
                      setSelectedTask(null);
                    }}
                    className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold text-lg shadow-xl hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
                  >
                    <MessageSquare size={20} />
                    Ярилцах
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}

        {selectedCitizen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md"
            onClick={() => setSelectedCitizen(null)}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-6 bg-brand-600 text-white flex items-center justify-between">
                <h3 className="font-display font-bold text-xl">Иргэний мэдээлэл</h3>
                <button onClick={() => setSelectedCitizen(null)} className="p-2 hover:bg-white/20 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>
              <div className="p-8 space-y-6">
                <div className="flex flex-col items-center text-center">
                  <div className="w-24 h-24 rounded-full bg-brand-100 flex items-center justify-center text-brand-600 font-bold text-4xl mb-4 border-4 border-white shadow-lg">
                    {selectedCitizen.name.charAt(0)}
                  </div>
                  <h4 className="font-bold text-slate-900 text-2xl mb-1">{selectedCitizen.name}</h4>
                  <p className="text-brand-600 font-bold text-sm uppercase tracking-widest mb-4">Идэвхтэй иргэн</p>
                  
                  <div className="flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-full text-slate-500 text-sm font-medium">
                    <Phone size={14} />
                    {selectedCitizen.phone.replace(/(\d{4})(\d{4})/, '$1-****')}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div className="bg-emerald-50 p-6 rounded-3xl border border-emerald-100 text-center">
                    <p className="text-xs text-emerald-600 font-bold uppercase tracking-widest mb-2">Нийт дэмжлэг</p>
                    <p className="text-3xl font-bold text-emerald-700">{formatCurrency(selectedCitizen.totalAmount || selectedCitizen.amount || 0)}</p>
                    <div className="flex items-center justify-center gap-4 mt-2">
                      <p className="text-[10px] text-emerald-500 font-medium">Бүртгүүлсэн: {selectedCitizen.timestamp?.toDate().toLocaleDateString()}</p>
                      {selectedCitizen.supportCount > 1 && (
                        <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest">{selectedCitizen.supportCount} удаа дэмжсэн</p>
                      )}
                    </div>
                  </div>
                </div>

                {selectedCitizen.businessInfo && (
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Бизнесийн танилцуулга</p>
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 italic text-slate-600 text-sm leading-relaxed">
                      "{selectedCitizen.businessInfo}"
                    </div>
                  </div>
                )}

                {selectedCitizen.message && (
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Захисан үг</p>
                    <div className="bg-brand-50 p-4 rounded-2xl border border-brand-100 text-brand-700 text-sm leading-relaxed">
                      {selectedCitizen.message}
                    </div>
                  </div>
                )}

                <button 
                  onClick={() => setSelectedCitizen(null)}
                  className="w-full py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-all"
                >
                  Хаах
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
        {activeTaskForChat && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" onClick={() => setActiveTaskForChat(null)}>
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-3xl w-full max-w-2xl h-[80vh] flex flex-col overflow-hidden shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-6 bg-brand-600 text-white flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white/20 rounded-2xl">
                    <ClipboardList size={24} />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-xl line-clamp-1">{activeTaskForChat.name}</h3>
                    <p className="text-white/70 text-xs font-bold uppercase tracking-widest">Даалгаврын хэлэлцүүлэг</p>
                  </div>
                </div>
                <button onClick={() => setActiveTaskForChat(null)} className="p-2 hover:bg-white/20 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="flex-grow overflow-y-auto p-6 space-y-6 bg-slate-50 scrollbar-hide">
                {chatMessages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4">
                    <div className="p-4 bg-white rounded-full shadow-sm">
                      <MessageSquare size={32} />
                    </div>
                    <p className="text-sm font-medium">Мэдээлэл оруулж эхэлнэ үү...</p>
                  </div>
                ) : (
                  chatMessages.map((msg) => (
                    <div key={msg.id} className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                      <div className="p-4 flex items-center justify-between border-b border-slate-50">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-brand-50 flex items-center justify-center text-brand-600 font-bold text-xs">
                            {msg.senderName.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 text-sm">{msg.senderName}</p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                              {msg.timestamp?.toDate().toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      {msg.imageUrl && (
                        <div className="w-full">
                          <img src={msg.imageUrl} alt="Post" className="w-full h-auto object-cover" referrerPolicy="no-referrer" />
                        </div>
                      )}
                      
                      <div className="p-4">
                        <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                      </div>
                      
                      <div className="px-4 py-3 bg-slate-50 flex items-center gap-4">
                        <button 
                          onClick={() => handleLikeMessage(msg.id)}
                          className="flex items-center gap-2 text-slate-400 hover:text-brand-600 transition-colors group"
                        >
                          <ThumbsUp size={16} className="group-hover:scale-110 transition-transform" />
                          <span className="text-xs font-bold">{msg.likes || 0}</span>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="p-6 bg-white border-t border-slate-100 space-y-4">
                {chatImage && (
                  <div className="relative w-24 h-24 rounded-2xl overflow-hidden border border-slate-200">
                    <img src={chatImage} alt="Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    <button 
                      onClick={() => setChatImage(null)}
                      className="absolute top-1 right-1 p-1 bg-rose-500 text-white rounded-lg shadow-lg"
                    >
                      <X size={12} />
                    </button>
                  </div>
                )}
                <div className="flex gap-3">
                  <label className="p-4 bg-slate-50 text-slate-400 rounded-2xl hover:bg-slate-100 transition-all cursor-pointer">
                    <ImageIcon size={20} />
                    <input type="file" accept="image/*" onChange={handleChatImageUpload} className="hidden" />
                  </label>
                  <textarea 
                    value={chatMessageInput}
                    onChange={(e) => setChatMessageInput(e.target.value)}
                    placeholder="Мэдээлэл оруулна уу..."
                    rows={1}
                    className="flex-grow px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:border-brand-500 outline-none text-sm resize-none"
                  />
                  <button 
                    onClick={handleSendMessage}
                    disabled={!chatMessageInput.trim() && !chatImage}
                    className="p-4 bg-brand-600 text-white rounded-2xl hover:bg-brand-700 transition-all shadow-lg shadow-brand-600/20 disabled:opacity-50"
                  >
                    <Send size={20} />
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

        {/* Ask Circle */}
        <AnimatePresence>
          {showAskMenu && (
            <motion.div
              initial={{ opacity: 0, y: '100%' }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: '100%' }}
              className="fixed inset-0 z-[150] bg-slate-50 flex flex-col"
            >
                  <div className="p-6 bg-brand-600 text-white flex justify-between items-center shadow-lg">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white/20 rounded-xl">
                        <AskIcon size={24} />
                      </div>
                      <h3 className="font-display font-bold text-2xl">Ask Circle</h3>
                    </div>
                    <button 
                      onClick={() => setShowAskMenu(false)} 
                      className="p-3 bg-white/20 hover:bg-white/30 rounded-full transition-colors"
                    >
                      <X size={24} />
                    </button>
                  </div>

                  <div className="flex-grow overflow-y-auto p-6 space-y-8 max-w-2xl mx-auto w-full">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <motion.button 
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setShowHelpForm(true)}
                        className="p-8 bg-white rounded-3xl shadow-xl border border-slate-100 flex flex-col items-center text-center gap-4 group hover:border-amber-200 transition-all"
                      >
                        <div className="w-20 h-20 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center group-hover:bg-amber-600 group-hover:text-white transition-colors">
                          <HelpCircle size={40} />
                        </div>
                        <div>
                          <h4 className="font-display font-bold text-xl text-slate-900">Ask For Help</h4>
                          <p className="text-slate-500 text-sm mt-1">Танд тусламж хэрэгтэй байна уу?</p>
                        </div>
                        <div className="mt-2 px-4 py-2 bg-amber-50 text-amber-700 rounded-full text-xs font-bold uppercase tracking-widest">
                          20,000₮
                        </div>
                      </motion.button>

                      <motion.button 
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setShowSuggestionForm(true)}
                        className="p-8 bg-white rounded-3xl shadow-xl border border-slate-100 flex flex-col items-center text-center gap-4 group hover:border-blue-200 transition-all"
                      >
                        <div className="w-20 h-20 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                          <MessageCircle size={40} />
                        </div>
                        <div>
                          <h4 className="font-display font-bold text-xl text-slate-900">Feedback</h4>
                          <p className="text-slate-500 text-sm mt-1">Санал хүсэлт илгээх</p>
                        </div>
                        <div className="mt-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-full text-xs font-bold uppercase tracking-widest">
                          Үнэгүй
                        </div>
                      </motion.button>
                    </div>

                    {/* Social Links */}
                    <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-6">
                      <h5 className="font-bold text-slate-700 text-sm mb-4 uppercase tracking-widest text-center">Дагах</h5>
                      <div className="flex items-center justify-center gap-4">
                        <a href="https://www.facebook.com/javkhlan.g" target="_blank" rel="noopener noreferrer"
                          className="w-14 h-14 rounded-2xl bg-[#1877F2] text-white flex items-center justify-center hover:opacity-90 hover:scale-110 transition-all shadow-lg shadow-[#1877F2]/30">
                          <Facebook size={26} />
                        </a>
                        <a href="https://www.youtube.com/@javkhlan" target="_blank" rel="noopener noreferrer"
                          className="w-14 h-14 rounded-2xl bg-[#FF0000] text-white flex items-center justify-center hover:opacity-90 hover:scale-110 transition-all shadow-lg shadow-[#FF0000]/30">
                          <Youtube size={26} />
                        </a>
                        <a href="https://www.instagram.com/javkhlan.g" target="_blank" rel="noopener noreferrer"
                          className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#F58529] via-[#DD2A7B] to-[#8134AF] text-white flex items-center justify-center hover:opacity-90 hover:scale-110 transition-all shadow-lg shadow-pink-500/30">
                          <Instagram size={26} />
                        </a>
                        <a href="https://x.com/javkhlan_g" target="_blank" rel="noopener noreferrer"
                          className="w-14 h-14 rounded-2xl bg-black text-white flex items-center justify-center hover:opacity-90 hover:scale-110 transition-all shadow-lg shadow-black/20">
                          <Twitter size={26} />
                        </a>
                      </div>
                    </div>

                    {/* Gift Management - Admin only */}
                    {(isAdmin || isAdminUnlocked) && (
                      <div className="bg-white rounded-3xl shadow-xl border border-amber-100 overflow-hidden">
                        <div className="p-5 bg-gradient-to-r from-amber-400 to-orange-500 flex items-center justify-between">
                          <div className="flex items-center gap-2 text-white">
                            <Gift size={20} />
                            <h5 className="font-bold text-lg">Бэлэг удирдах</h5>
                            {gifts.length > 0 && <span className="bg-white/20 text-white text-xs font-bold px-2 py-0.5 rounded-full">+{gifts.length}</span>}
                          </div>
                          <button onClick={() => setShowGiftAddForm(v => !v)}
                            className="flex items-center gap-1 bg-white/20 hover:bg-white/30 text-white px-3 py-1.5 rounded-full text-sm font-bold transition-colors">
                            <Plus size={14} /> Нэмэх
                          </button>
                        </div>

                        {showGiftAddForm && (
                          <div className="p-5 space-y-4 border-b border-amber-50">
                            <div>
                              <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Бэлгийн нэр</label>
                              <input
                                type="text"
                                value={giftForm.name}
                                onChange={e => setGiftForm({...giftForm, name: e.target.value})}
                                placeholder="Жишээ: Үнэгүй Website хийлгэх эрхийн бичиг"
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:border-amber-400 text-sm"
                              />
                            </div>
                            <div>
                              <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Авах эрхтэй хүн</label>
                              <div className="space-y-2">
                                {[
                                  { value: 'any', label: 'Хэн ч авч болно' },
                                  { value: '1m', label: '1,000,000₮ дээш дэмжлэг үзүүлсэн хүн' },
                                  { value: 'custom', label: 'Өөр үнийн дүн' },
                                ].map(opt => (
                                  <label key={opt.value} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${giftForm.eligibility === opt.value ? 'border-amber-400 bg-amber-50' : 'border-slate-200 hover:border-amber-200'}`}>
                                    <input type="radio" name="eligibility" value={opt.value}
                                      checked={giftForm.eligibility === opt.value}
                                      onChange={e => setGiftForm({...giftForm, eligibility: e.target.value})}
                                      className="accent-amber-500" />
                                    <span className="text-sm font-medium text-slate-700">{opt.label}</span>
                                  </label>
                                ))}
                              </div>
                              {giftForm.eligibility === 'custom' && (
                                <input
                                  type="number"
                                  value={giftForm.customAmount}
                                  onChange={e => setGiftForm({...giftForm, customAmount: e.target.value})}
                                  placeholder="Хамгийн бага дүн (₮)"
                                  className="mt-2 w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:border-amber-400 text-sm"
                                />
                              )}
                            </div>
                            <div className="flex gap-3">
                              <button onClick={() => setShowGiftAddForm(false)}
                                className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-500 text-sm font-medium hover:bg-slate-50">
                                Цуцлах
                              </button>
                              <button onClick={handleGiftAdd} disabled={!giftForm.name.trim()}
                                className="flex-1 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm disabled:opacity-50 flex items-center justify-center gap-1">
                                <Check size={14} /> Хадгалах
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Gift list */}
                        <div className="p-5 space-y-2">
                          {gifts.length === 0 ? (
                            <p className="text-slate-400 text-sm text-center py-4">Бэлэг байхгүй байна</p>
                          ) : gifts.map((g, i) => (
                            <div key={g.id} className="flex items-center gap-3 bg-slate-50 rounded-2xl px-4 py-3">
                              <span className="text-xl">🎁</span>
                              <div className="flex-1 min-w-0">
                                <p className="font-bold text-sm text-slate-800 truncate">{g.name}</p>
                                <p className="text-xs text-slate-400">
                                  {g.eligibility === 'any' ? 'Хэн ч авч болно' : `${Number(g.minAmount).toLocaleString()}₮ дээш`}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="bg-white p-8 rounded-3xl shadow-lg border border-slate-100">
                      <h5 className="font-bold text-slate-900 mb-6 flex items-center gap-2">
                        <TrendingUp size={18} className="text-brand-600" />
                        Тойргийн мэдээлэл
                      </h5>
                      <div className="grid grid-cols-2 gap-6">
                        <div className="bg-slate-50 p-6 rounded-2xl text-center border border-slate-100">
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Нийт Тусламж</p>
                          <p className="text-3xl font-bold text-slate-900">{totalHelpRequests}</p>
                        </div>
                        <div className="bg-slate-50 p-6 rounded-2xl text-center border border-slate-100">
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Нийт Санал Хүсэлт</p>
                          <p className="text-3xl font-bold text-slate-900">{totalSuggestions}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-8 bg-white border-t border-slate-100 text-center">
                    <p className="text-slate-400 text-sm font-medium italic">"Бид хамтдаа илүү хүчтэй"</p>
                  </div>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div drag dragMomentum={false} dragElastic={0.1} className="fixed bottom-24 right-6 z-[100] cursor-grab active:cursor-grabbing touch-none">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setShowAskMenu(!showAskMenu)}
            className={cn(
              "w-16 h-16 rounded-full flex items-center justify-center shadow-2xl transition-all relative",
              showAskMenu ? "bg-slate-900 text-white rotate-45" : "bg-brand-600 text-white"
            )}
          >
            <AskIcon size={32} />
            {newNotification && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-1 -right-1 w-6 h-6 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white"
              >
                +1
              </motion.div>
            )}
          </motion.button>
        </motion.div>

        {/* Admin floating button */}
        <motion.div drag dragMomentum={false} dragElastic={0.1} className="fixed bottom-44 right-6 z-[100] cursor-grab active:cursor-grabbing touch-none">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => (isAdmin || isAdminUnlocked) ? setShowAdminDashboard(true) : setShowAdminLoginForm(true)}
            className={`w-16 h-16 rounded-full flex items-center justify-center shadow-2xl relative ${(isAdmin || isAdminUnlocked) ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-white'}`}
          >
            {(isAdmin || isAdminUnlocked) ? <ShieldCheck size={28} /> : <Lock size={26} />}
          </motion.button>
        </motion.div>

        {/* Gift floating button */}
        <AnimatePresence>
          {gifts.length > 0 && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              drag dragMomentum={false} dragElastic={0.1}
              className="fixed bottom-64 right-6 z-[100] cursor-grab active:cursor-grabbing touch-none"
            >
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleGiftOpen}
                className="w-16 h-16 rounded-full flex items-center justify-center shadow-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-white relative"
              >
                <motion.div
                  animate={{ rotate: [0, -10, 10, -10, 10, 0] }}
                  transition={{ repeat: Infinity, repeatDelay: 4, duration: 0.5 }}
                >
                  <Gift size={28} />
                </motion.div>
                <span className="absolute -top-1 -right-1 min-w-[20px] h-[20px] bg-red-500 rounded-full flex items-center justify-center text-[9px] font-bold text-white px-1">
                  {gifts.length}
                </span>
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Gift Modal */}
        <AnimatePresence>
          {showGiftModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-slate-900/80 backdrop-blur-md"
            >
              <motion.div
                initial={{ scale: 0.8, y: 30 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.8, y: 30 }}
                className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl text-center"
              >
                {/* Header */}
                <div className="bg-gradient-to-br from-amber-400 to-orange-500 p-7 relative">
                  <button onClick={() => setShowGiftModal(false)} className="absolute top-4 right-4 p-1 bg-white/20 hover:bg-white/30 rounded-full">
                    <X size={18} className="text-white" />
                  </button>
                  <motion.div
                    animate={{ rotate: [0, -15, 15, -15, 15, 0], scale: [1, 1.2, 1] }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="text-5xl mb-2"
                  >🎁</motion.div>
                  <h3 className="text-white font-bold text-xl">Г. Жавхлан</h3>
                  <p className="text-white/80 text-sm">таньд зориулсан тусгай бэлэг</p>
                </div>

                <div className="p-6 space-y-5">
                  {/* Step: intro */}
                  {giftStep === 'intro' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                      <p className="text-slate-700 font-medium text-base leading-relaxed">
                        Би танд гайхалтай бэлэг бэлдсэн байна.<br />
                        <span className="text-slate-500 text-sm">Та авахад бэлэн үү?</span>
                      </p>
                      <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4">
                        <p className="text-amber-700 text-sm font-medium">Бэлэг авахын тулд</p>
                        <p className="text-amber-900 font-bold text-lg">1,000,000₮ ба түүнээс дээш</p>
                        <p className="text-amber-700 text-sm">дэмжлэг үзүүлсэн байх шаардлагатай</p>
                      </div>
                      <div className="flex gap-3">
                        <button onClick={() => setShowGiftModal(false)} className="flex-1 py-3 rounded-2xl border border-slate-200 text-slate-500 font-medium hover:bg-slate-50 transition-colors text-sm">
                          Дараа авна
                        </button>
                        <motion.button whileTap={{ scale: 0.95 }} onClick={() => setGiftStep('phone')}
                          className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 text-white font-bold shadow-lg text-sm">
                          Бэлэн! 🎉
                        </motion.button>
                      </div>
                      <button onClick={() => setGiftStep('support-first')} className="w-full text-xs text-slate-400 hover:text-amber-500 transition-colors">
                        Одоо дэмжлэг үзүүлээд бэлэгээ авъя →
                      </button>
                    </motion.div>
                  )}

                  {/* Step: phone */}
                  {giftStep === 'phone' && (
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                      <p className="text-slate-700 font-medium text-sm">Дэмжлэг үзүүлэхдээ ашигласан <span className="font-bold text-slate-900">утасны дугаараа</span> оруулна уу</p>
                      <div>
                        <input
                          type="tel"
                          value={giftPhone}
                          onChange={e => { setGiftPhone(e.target.value); setGiftPhoneError(''); }}
                          placeholder="Утасны дугаар"
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:border-amber-400 text-center text-lg font-bold tracking-widest"
                        />
                        {giftPhoneError && <p className="text-red-500 text-xs mt-1">{giftPhoneError}</p>}
                      </div>
                      <div className="flex gap-3">
                        <button onClick={() => setGiftStep('intro')} className="flex-1 py-3 rounded-2xl border border-slate-200 text-slate-500 font-medium hover:bg-slate-50 transition-colors text-sm">
                          Буцах
                        </button>
                        <motion.button whileTap={{ scale: 0.95 }} onClick={handleGiftPhoneCheck}
                          className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 text-white font-bold shadow-lg text-sm">
                          Шалгах
                        </motion.button>
                      </div>
                    </motion.div>
                  )}

                  {/* Step: revealed */}
                  {giftStep === 'revealed' && (
                    <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring', bounce: 0.5 }} className="space-y-4">
                      <div className="text-4xl">🎊</div>
                      <p className="text-slate-500 text-sm font-medium">Таны авах бэлгүүд</p>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {gifts.filter(g => {
                          const total = recentSupports.filter(s => s.phone === giftPhone.trim()).reduce((sum, s) => sum + (s.amount || 0), 0);
                          return total >= (g.minAmount || 0);
                        }).map((g) => (
                          <div key={g.id} className="flex items-center gap-3 bg-amber-50 border border-amber-100 rounded-2xl px-4 py-3 text-left">
                            <span className="text-xl">🎁</span>
                            <span className="text-slate-800 font-bold text-sm">{g.name}</span>
                          </div>
                        ))}
                      </div>
                      <p className="text-slate-500 text-sm">Бидэнтэй холбогдоорой!</p>
                      <button onClick={() => setShowGiftModal(false)}
                        className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 text-white font-bold shadow-lg">
                        Баярлалаа! 🙏
                      </button>
                    </motion.div>
                  )}

                  {/* Step: not qualified */}
                  {giftStep === 'not-qualified' && (
                    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="space-y-4">
                      <div className="text-4xl">😔</div>
                      <p className="text-slate-700 font-medium text-sm leading-relaxed">
                        Уучлаарай, таны дэмжлэгийн дүн <span className="font-bold text-slate-900">1,000,000₮</span>-д хүрэхгүй байна.
                      </p>
                      <div className="flex gap-3">
                        <button onClick={() => setGiftStep('phone')} className="flex-1 py-3 rounded-2xl border border-slate-200 text-slate-500 font-medium text-sm hover:bg-slate-50">
                          Буцах
                        </button>
                        <motion.button whileTap={{ scale: 0.95 }} onClick={() => { setShowGiftModal(false); setSelectedTier('custom'); }}
                          className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-brand-500 to-brand-700 text-white font-bold shadow-lg text-sm">
                          Одоо дэмжих
                        </motion.button>
                      </div>
                    </motion.div>
                  )}

                  {/* Step: support first */}
                  {giftStep === 'support-first' && (
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                      <p className="text-slate-700 text-sm leading-relaxed">
                        <span className="font-bold text-slate-900">1,000,000₮</span> ба түүнээс дээш дэмжлэг үзүүлсний дараа бэлгээ авах боломжтой.
                      </p>
                      <div className="flex gap-3">
                        <button onClick={() => setGiftStep('intro')} className="flex-1 py-3 rounded-2xl border border-slate-200 text-slate-500 font-medium text-sm hover:bg-slate-50">
                          Буцах
                        </button>
                        <motion.button whileTap={{ scale: 0.95 }}
                          onClick={() => { setShowGiftModal(false); setSelectedTier('custom'); }}
                          className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-brand-500 to-brand-700 text-white font-bold shadow-lg text-sm">
                          Дэмжих →
                        </motion.button>
                      </div>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Admin Dashboard */}
        <AnimatePresence>
          {showAdminDashboard && (isAdmin || isAdminUnlocked) && (
            <motion.div
              initial={{ opacity: 0, y: '100%' }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: '100%' }}
              className="fixed inset-0 z-[200] bg-slate-50 flex flex-col"
            >
              {/* Header */}
              <div className="p-5 bg-slate-900 text-white flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/10 rounded-xl"><ShieldCheck size={22} /></div>
                  <div>
                    <h3 className="font-bold text-lg">Admin Dashboard</h3>
                    <p className="text-white/50 text-xs">{currentAdminEmail || auth.currentUser?.email || 'Owner'} · {isOwner ? 'Owner' : 'Admin'}</p>
                  </div>
                </div>
                <button onClick={() => setShowAdminDashboard(false)} className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors">
                  <X size={22} />
                </button>
              </div>

              {/* Tabs */}
              <div className="flex gap-1 px-4 py-3 bg-white border-b border-slate-100 overflow-x-auto shrink-0">
                {[
                  { key: 'profile', label: 'Профайл' },
                  { key: 'products', label: 'Бараа' },
                  { key: 'gifts', label: 'Бэлэг' },
                  { key: 'announce', label: 'Мэдэгдэл' },
                  { key: 'tasks', label: 'Даалгавар' },
                  { key: 'citizens', label: 'Иргэд' },
                  { key: 'access', label: 'Эрх' },
                ].map(t => (
                  <button key={t.key} onClick={() => setAdminDashTab(t.key)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${adminDashTab === t.key ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-100'}`}>
                    {t.label}
                  </button>
                ))}
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4 max-w-2xl mx-auto w-full pb-10">

                {/* PROFILE TAB */}
                {adminDashTab === 'profile' && (
                  <div className="space-y-4">
                    {/* Cover */}
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                      <div className="p-4 border-b border-slate-50 flex items-center justify-between">
                        <p className="font-bold text-slate-700 text-sm">Cover зураг</p>
                        <label className="px-3 py-1.5 bg-brand-600 text-white text-xs font-bold rounded-xl cursor-pointer hover:bg-brand-700 transition-colors">
                          Солих
                          <input type="file" accept="image/*" onChange={handleCoverImageUpdate} className="hidden" />
                        </label>
                      </div>
                      <div className="h-32 bg-slate-100 relative overflow-hidden">
                        {stats.coverImageUrl && <img src={stats.coverImageUrl} className="w-full h-full object-cover" alt="cover" />}
                      </div>
                    </div>
                    {/* Profile photo */}
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex items-center gap-4">
                      <div className="w-16 h-16 rounded-2xl bg-slate-100 overflow-hidden shrink-0">
                        {stats.profileImageUrl ? <img src={stats.profileImageUrl} className="w-full h-full object-cover" alt="profile" /> : <div className="w-full h-full flex items-center justify-center text-slate-400 text-2xl font-bold">Г</div>}
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-slate-700 text-sm mb-1">Profile зураг</p>
                        <label className="px-3 py-1.5 bg-brand-600 text-white text-xs font-bold rounded-xl cursor-pointer hover:bg-brand-700 transition-colors inline-block">
                          Солих
                          <input type="file" accept="image/*" onChange={handleProfileImageUpdate} className="hidden" />
                        </label>
                      </div>
                    </div>
                    {/* Full Name & Username */}
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 space-y-3">
                      <p className="font-bold text-slate-700 text-sm">Нэр & Username</p>
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Full Name</label>
                        <input value={adminProfileName} onChange={e => setAdminProfileName(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-brand-400 text-sm" />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Username</label>
                        <input value={adminProfileUsername} onChange={e => setAdminProfileUsername(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-brand-400 text-sm" />
                      </div>
                      <button onClick={() => handleUpdateSiteProfile(adminProfileName, adminProfileUsername)}
                        className="w-full py-2.5 bg-slate-900 text-white font-bold rounded-xl text-sm hover:bg-slate-800 transition-colors">
                        Хадгалах
                      </button>
                    </div>
                  </div>
                )}

                {/* PRODUCTS TAB */}
                {adminDashTab === 'products' && (
                  <div className="space-y-3">
                    <button onClick={() => setShowProductForm(true)}
                      className="w-full py-3 bg-brand-600 text-white font-bold rounded-2xl text-sm flex items-center justify-center gap-2 hover:bg-brand-700 transition-colors">
                      <Plus size={16} /> Бараа нэмэх
                    </button>
                    {products.length === 0 ? (
                      <div className="bg-white rounded-2xl p-8 text-center border border-slate-100">
                        <Package size={32} className="text-slate-200 mx-auto mb-2" />
                        <p className="text-slate-400 text-sm">Бараа байхгүй байна</p>
                      </div>
                    ) : products.map(p => (
                      <div key={p.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-slate-50 overflow-hidden shrink-0">
                          {p.image ? <img src={p.image} className="w-full h-full object-cover" alt={p.name} /> : <Package size={20} className="text-slate-300 m-auto mt-3" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-slate-900 text-sm truncate">{p.name}</p>
                          <p className="text-brand-600 text-xs font-bold">{Number(p.price).toLocaleString()}₮</p>
                        </div>
                        <button onClick={() => deleteDoc(doc(db, 'products', p.id))}
                          className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-colors shrink-0">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* GIFTS TAB */}
                {adminDashTab === 'gifts' && (
                  <div className="space-y-3">
                    <button onClick={() => setShowGiftAddForm(v => !v)}
                      className="w-full py-3 bg-amber-500 text-white font-bold rounded-2xl text-sm flex items-center justify-center gap-2 hover:bg-amber-600 transition-colors">
                      <Plus size={16} /> Бэлэг нэмэх
                    </button>
                    {showGiftAddForm && (
                      <div className="bg-white rounded-2xl border border-amber-100 p-4 space-y-3">
                        <input type="text" value={giftForm.name} onChange={e => setGiftForm({...giftForm, name: e.target.value})}
                          placeholder="Бэлгийн нэр" className="w-full px-3 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-amber-400 text-sm" />
                        <div className="space-y-1.5">
                          {[{v:'any',l:'Хэн ч авч болно'},{v:'1m',l:'1,000,000₮+'},{v:'custom',l:'Өөр дүн'}].map(opt => (
                            <label key={opt.v} className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer ${giftForm.eligibility===opt.v?'border-amber-400 bg-amber-50':'border-slate-200'}`}>
                              <input type="radio" name="elig" value={opt.v} checked={giftForm.eligibility===opt.v} onChange={e=>setGiftForm({...giftForm,eligibility:e.target.value})} className="accent-amber-500" />
                              <span className="text-sm">{opt.l}</span>
                            </label>
                          ))}
                          {giftForm.eligibility==='custom' && <input type="number" value={giftForm.customAmount} onChange={e=>setGiftForm({...giftForm,customAmount:e.target.value})} placeholder="Хамгийн бага дүн (₮)" className="w-full px-3 py-2.5 rounded-xl border border-slate-200 outline-none text-sm" />}
                        </div>
                        <button onClick={handleGiftAdd} disabled={!giftForm.name.trim()}
                          className="w-full py-2.5 bg-amber-500 text-white font-bold rounded-xl text-sm disabled:opacity-50">Нэмэх</button>
                      </div>
                    )}
                    {gifts.length === 0 ? (
                      <div className="bg-white rounded-2xl p-8 text-center border border-slate-100">
                        <Gift size={32} className="text-slate-200 mx-auto mb-2" />
                        <p className="text-slate-400 text-sm">Бэлэг байхгүй байна</p>
                      </div>
                    ) : gifts.map(g => (
                      <div key={g.id} className="bg-white rounded-2xl border border-amber-100 p-4 flex items-center gap-3">
                        <span className="text-xl shrink-0">🎁</span>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-slate-900 text-sm truncate">{g.name}</p>
                          <p className="text-amber-600 text-xs">{g.minAmount > 0 ? `${Number(g.minAmount).toLocaleString()}₮+` : 'Хэн ч авч болно'}</p>
                        </div>
                        <button onClick={() => deleteDoc(doc(db, 'gifts', g.id))}
                          className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-colors shrink-0">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* ANNOUNCE TAB */}
                {adminDashTab === 'announce' && (
                  <div className="space-y-3">
                    <button onClick={() => setShowAnnounceForm(v => !v)}
                      className="w-full py-3 bg-violet-600 text-white font-bold rounded-2xl text-sm flex items-center justify-center gap-2 hover:bg-violet-700 transition-colors">
                      <Plus size={16} /> Мэдэгдэл нэмэх
                    </button>
                    {showAnnounceForm && (
                      <div className="bg-white rounded-2xl border border-violet-100 p-4 space-y-3">
                        <input type="text" value={announceForm.title} onChange={e => setAnnounceForm({...announceForm, title: e.target.value})}
                          placeholder="Гарчиг (жш: Coming Soon — Шинэ аппликэйшн)" className="w-full px-3 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-violet-400 text-sm" />
                        <textarea value={announceForm.content} onChange={e => setAnnounceForm({...announceForm, content: e.target.value})}
                          placeholder="Дэлгэрэнгүй тайлбар..." rows={3}
                          className="w-full px-3 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-violet-400 text-sm resize-none" />
                        <button onClick={handleAddAnnouncement} disabled={!announceForm.title.trim()}
                          className="w-full py-2.5 bg-violet-600 text-white font-bold rounded-xl text-sm disabled:opacity-50">Нэмэх</button>
                      </div>
                    )}
                    {announcements.length === 0 ? (
                      <div className="bg-white rounded-2xl p-8 text-center border border-slate-100">
                        <p className="text-slate-400 text-sm">Мэдэгдэл байхгүй байна</p>
                      </div>
                    ) : announcements.map(a => (
                      <div key={a.id} className="bg-white rounded-2xl border border-violet-100 p-4 flex items-start gap-3">
                        <div className="flex-1">
                          <p className="font-bold text-slate-900 text-sm">{a.title}</p>
                          {a.content && <p className="text-slate-500 text-xs mt-1">{a.content}</p>}
                        </div>
                        <button onClick={() => handleDeleteAnnouncement(a.id)}
                          className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-colors shrink-0">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* TASKS TAB */}
                {adminDashTab === 'tasks' && (
                  <div className="space-y-3">
                    {allTasks.length === 0 ? (
                      <div className="bg-white rounded-2xl p-8 text-center border border-slate-100">
                        <ClipboardList size={32} className="text-slate-200 mx-auto mb-2" />
                        <p className="text-slate-400 text-sm">Даалгавар байхгүй байна</p>
                      </div>
                    ) : [...allTasks].sort((a,b)=>(b.likes||0)-(a.likes||0)).map(task => (
                      <div key={task.id} className="bg-white rounded-2xl border border-slate-100 p-4 flex items-start gap-3">
                        <div className="w-9 h-9 rounded-full bg-brand-50 flex items-center justify-center text-brand-600 font-bold shrink-0 text-sm">
                          {task.name?.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-slate-900 text-sm">{task.name}</p>
                          <p className="text-slate-500 text-xs mt-0.5 line-clamp-2">{task.description}</p>
                          <div className="flex items-center gap-3 mt-1.5">
                            <span className="text-[10px] text-slate-400">👍 {task.likes||0}</span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${task.status==='completed'?'bg-emerald-100 text-emerald-600':task.status==='in-progress'?'bg-amber-100 text-amber-600':'bg-slate-100 text-slate-400'}`}>{task.status}</span>
                          </div>
                        </div>
                        <button onClick={() => handleDeleteTask(task.id)}
                          className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-colors shrink-0">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* CITIZENS TAB */}
                {adminDashTab === 'citizens' && (
                  <div className="space-y-3">
                    {/* Search */}
                    <div className="relative">
                      <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        value={citizenSearch}
                        onChange={e => setCitizenSearch(e.target.value)}
                        placeholder="Нэр, утас, дугаараар хайх..."
                        className="w-full pl-9 pr-4 py-3 rounded-2xl border border-slate-200 outline-none focus:border-brand-400 text-sm bg-white"
                      />
                      {citizenSearch && (
                        <button onClick={() => setCitizenSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500">
                          <X size={14} />
                        </button>
                      )}
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                      <div className="p-3 bg-slate-900 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Users size={14} className="text-white" />
                          <p className="text-white text-xs font-bold uppercase tracking-widest">Нийт бүртгэлтэй иргэд</p>
                        </div>
                        <span className="text-xs font-bold text-slate-300">{recentSupports.length} хүн</span>
                      </div>
                      {(() => {
                        const filtered = [...recentSupports]
                          .sort((a: any, b: any) => {
                            const na = a.userNumber ?? 999999;
                            const nb = b.userNumber ?? 999999;
                            return na - nb;
                          })
                          .filter(u => {
                            if (!citizenSearch) return true;
                            const q = citizenSearch.toLowerCase();
                            return (
                              u.name?.toLowerCase().includes(q) ||
                              u.phone?.includes(q) ||
                              String((u as any).userNumber || '').includes(q)
                            );
                          });

                        if (filtered.length === 0) return (
                          <div className="p-8 text-center">
                            <Users size={28} className="text-slate-200 mx-auto mb-2" />
                            <p className="text-slate-400 text-sm">{citizenSearch ? 'Хайлтын илэрц олдсонгүй' : 'Бүртгэлтэй иргэн байхгүй байна'}</p>
                          </div>
                        );

                        return filtered.map(u => {
                          const reg = registeredUsers.find(r => r.userNumber === (u as any).userNumber);
                          const earlyUser = reg ? reg.isEarlyUser : false;
                          return (
                            <div
                              key={u.id}
                              className="p-3 border-b border-slate-50 last:border-0 flex items-center gap-3 hover:bg-slate-50 cursor-pointer transition-colors"
                              onClick={() => setSelectedCitizen({ ...u, earlyUser })}
                            >
                              <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${earlyUser ? 'bg-sky-100 text-sky-700' : 'bg-brand-50 text-brand-600'}`}>
                                {earlyUser ? '💎' : u.name?.charAt(0) || '?'}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-bold text-slate-900 text-sm flex items-center gap-1.5 flex-wrap">
                                  {(u as any).userNumber && (
                                    <span className="text-brand-600 font-black text-xs">№{(u as any).userNumber}</span>
                                  )}
                                  <span>{u.name}</span>
                                  {earlyUser && <span className="text-[10px] font-bold text-sky-600 bg-sky-50 px-1.5 py-0.5 rounded-full">💎</span>}
                                </p>
                                <p className="text-[11px] text-slate-400 truncate">{u.phone}</p>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <span className="text-[10px] font-bold text-slate-400">{formatCurrency(u.amount || 0)}</span>
                                {isOwner && (
                                  <button
                                    onClick={e => { e.stopPropagation(); handleDeleteCitizen(u.id); }}
                                    className="p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  </div>
                )}

                {/* ACCESS TAB */}
                {adminDashTab === 'access' && (
                  <div className="space-y-4">
                    {/* Built-in accounts */}
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                      <div className="p-3 bg-slate-900 flex items-center gap-2">
                        <ShieldCheck size={14} className="text-white" />
                        <p className="text-white text-xs font-bold uppercase tracking-widest">Суурилагдсан Эрхүүд</p>
                      </div>
                      {[
                        { email: 'iamikajaki@gmail.com', role: 'Owner', color: 'text-amber-600 bg-amber-50' },
                        { email: 'dansdaatgal@gmail.com', role: 'Owner', color: 'text-amber-600 bg-amber-50' },
                      ].map(a => (
                        <div key={a.email} className="p-3 border-b border-slate-50 last:border-0 flex items-center justify-between">
                          <div>
                            <p className="text-sm font-bold text-slate-900">{a.email}</p>
                            <p className="text-xs text-slate-400">Нууц үг: Pw#Admin1$</p>
                          </div>
                          <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${a.color}`}>{a.role}</span>
                        </div>
                      ))}
                    </div>

                    {/* Dynamic accounts */}
                    {isOwner && (
                      <>
                        <button onClick={() => setShowAddAccessForm(v => !v)}
                          className="w-full py-3 bg-slate-900 text-white font-bold rounded-2xl text-sm flex items-center justify-center gap-2 hover:bg-slate-800 transition-colors">
                          <Plus size={16} /> Admin / Moderator нэмэх
                        </button>
                        {showAddAccessForm && (
                          <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
                            <input value={addAccessForm.name} onChange={e => setAddAccessForm({...addAccessForm, name: e.target.value})}
                              placeholder="Нэр" className="w-full px-3 py-2.5 rounded-xl border border-slate-200 outline-none text-sm" />
                            <input type="email" value={addAccessForm.email} onChange={e => setAddAccessForm({...addAccessForm, email: e.target.value})}
                              placeholder="Имэйл" className="w-full px-3 py-2.5 rounded-xl border border-slate-200 outline-none text-sm" />
                            <input type="password" value={addAccessForm.password} onChange={e => setAddAccessForm({...addAccessForm, password: e.target.value})}
                              placeholder="Нууц үг" className="w-full px-3 py-2.5 rounded-xl border border-slate-200 outline-none text-sm" />
                            <div className="flex gap-2">
                              {['admin','moderator'].map(r => (
                                <button key={r} onClick={() => setAddAccessForm({...addAccessForm, role: r})}
                                  className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-colors ${addAccessForm.role===r?'bg-slate-900 text-white border-slate-900':'border-slate-200 text-slate-500'}`}>
                                  {r === 'admin' ? 'Admin' : 'Moderator'}
                                </button>
                              ))}
                            </div>
                            <button onClick={handleAddAccess} disabled={!addAccessForm.email||!addAccessForm.password}
                              className="w-full py-2.5 bg-brand-600 text-white font-bold rounded-xl text-sm disabled:opacity-50">Нэмэх</button>
                          </div>
                        )}
                        {accessList.length > 0 && (
                          <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
                            {accessList.map(a => (
                              <div key={a.id} className="p-3 border-b border-slate-50 last:border-0 flex items-center justify-between">
                                <div>
                                  <p className="text-sm font-bold text-slate-900">{a.name || a.email}</p>
                                  <p className="text-xs text-slate-400">{a.email}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${a.role==='admin'?'bg-brand-50 text-brand-600':'bg-slate-100 text-slate-500'}`}>{a.role}</span>
                                  <button onClick={() => handleDeleteAccess(a.id)} className="p-1.5 text-slate-300 hover:text-rose-500 rounded-lg transition-colors">
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                    {!isOwner && (
                      <div className="bg-slate-50 rounded-2xl p-6 text-center border border-slate-100">
                        <Lock size={24} className="text-slate-300 mx-auto mb-2" />
                        <p className="text-slate-400 text-sm">Зөвхөн Owner эрхтэй хэрэглэгч удирдах боломжтой</p>
                      </div>
                    )}
                  </div>
                )}

              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Admin Login Modal */}
        <AnimatePresence>
          {showAdminLoginForm && !isAdminUnlocked && !isAdmin && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-[350] flex items-end sm:items-center justify-center bg-slate-900/80 backdrop-blur-md"
              onClick={() => setShowAdminLoginForm(false)}
            >
              <motion.div initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }}
                className="bg-white w-full sm:max-w-sm rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl"
                onClick={e => e.stopPropagation()}
              >
                <div className="p-5 bg-slate-900 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Lock size={18} className="text-white" />
                    <h3 className="font-bold text-white text-lg">Admin нэвтрэх</h3>
                  </div>
                  <button onClick={() => setShowAdminLoginForm(false)} className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors">
                    <X size={20} className="text-white" />
                  </button>
                </div>
                <form onSubmit={handleAdminLogin} className="p-5 space-y-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Имэйл</label>
                    <input type="email" value={adminLoginForm.email}
                      onChange={e => setAdminLoginForm({ ...adminLoginForm, email: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:border-slate-400 text-sm"
                      placeholder="admin@example.com" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Нууц үг</label>
                    <input type="password" value={adminLoginForm.password}
                      onChange={e => setAdminLoginForm({ ...adminLoginForm, password: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:border-slate-400 text-sm"
                      placeholder="••••••••" />
                  </div>
                  {adminLoginError && <p className="text-red-500 text-xs font-medium">{adminLoginError}</p>}
                  <button type="submit"
                    className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-lg transition-all">
                    Нэвтрэх
                  </button>
                  <div className="relative py-2">
                    <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100"></div></div>
                    <div className="relative flex justify-center text-[10px] uppercase font-bold text-slate-300 bg-white px-2">Эсвэл</div>
                  </div>
                  <button type="button" onClick={handleGoogleAdminLogin}
                    className="w-full py-4 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-xl shadow-sm transition-all flex items-center justify-center gap-3">
                    <svg width="18" height="18" viewBox="0 0 18 18"><path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/><path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/><path d="M3.964 10.712c-.18-.54-.282-1.117-.282-1.712s.102-1.172.282-1.712V4.956H.957A8.996 8.996 0 0 0 0 9c0 1.497.366 2.91 1.014 4.144l2.95-2.432z" fill="#FBBC05"/><path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.956l3.007 2.332C4.672 5.164 6.656 3.58 9 3.58z" fill="#EA4335"/></svg>
                    Google-ээр нэвтрэх
                  </button>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Citizen Detail Modal */}
        <AnimatePresence>
          {selectedCitizen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[500] flex items-center justify-center p-6 bg-slate-900/70 backdrop-blur-md"
              onClick={() => setSelectedCitizen(null)}
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden"
                onClick={e => e.stopPropagation()}
              >
                <div className={`p-5 flex items-center justify-between ${selectedCitizen.earlyUser ? 'bg-gradient-to-r from-sky-500 to-indigo-500' : 'bg-slate-900'}`}>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center font-black text-white text-xl">
                      {selectedCitizen.earlyUser ? '💎' : selectedCitizen.name?.charAt(0)}
                    </div>
                    <div>
                      <p className="font-black text-white text-lg leading-tight">{selectedCitizen.name}</p>
                      {selectedCitizen.userNumber && (
                        <p className="text-white/70 text-xs font-bold">№{selectedCitizen.userNumber} дэх иргэн</p>
                      )}
                    </div>
                  </div>
                  <button onClick={() => setSelectedCitizen(null)} className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors">
                    <X size={18} className="text-white" />
                  </button>
                </div>
                <div className="p-5 space-y-3">
                  {[
                    { label: 'Утас', value: selectedCitizen.phone },
                    { label: 'Дэмжсэн дүн', value: formatCurrency(selectedCitizen.amount || 0) },
                    { label: 'Tier', value: selectedCitizen.tier },
                    { label: 'Мессеж', value: selectedCitizen.message },
                    { label: 'Нас', value: selectedCitizen.age ? `${selectedCitizen.age} нас` : null },
                    { label: 'Бизнес', value: selectedCitizen.businessInfo },
                  ].filter(r => r.value).map(row => (
                    <div key={row.label} className="flex items-start gap-3 p-3 bg-slate-50 rounded-2xl">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-widest w-24 shrink-0 pt-0.5">{row.label}</span>
                      <span className="text-sm text-slate-800 font-medium break-words flex-1">{row.value}</span>
                    </div>
                  ))}
                  {selectedCitizen.earlyUser && (
                    <div className="flex items-center gap-2 p-3 bg-sky-50 rounded-2xl border border-sky-100">
                      <span className="text-lg">💎</span>
                      <span className="text-sm font-bold text-sky-700">Diamond хүрээтэй онцгой иргэн</span>
                    </div>
                  )}

                  {/* Match probability */}
                  {(() => {
                    const amt = selectedCitizen.amount || 0;
                    const purchaseCount = allOrders.filter(o =>
                      o.phone && selectedCitizen.phone && o.phone === selectedCitizen.phone
                    ).length;
                    const fromAmount = Math.floor(amt / 10000) * 0.1;
                    const fromPurchases = purchaseCount * 1;
                    const total = Math.min(fromAmount + fromPurchases, 100);
                    const barColor = total >= 70 ? 'bg-emerald-500' : total >= 40 ? 'bg-amber-400' : 'bg-brand-500';
                    return (
                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Таарах магадлал</p>
                          <p className={`text-xl font-black ${total >= 70 ? 'text-emerald-600' : total >= 40 ? 'text-amber-500' : 'text-brand-600'}`}>
                            {total.toFixed(1)}%
                          </p>
                        </div>
                        <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${total}%` }}
                            transition={{ duration: 0.8, ease: 'easeOut' }}
                            className={`h-full rounded-full ${barColor}`}
                          />
                        </div>
                        <div className="flex gap-4 text-[11px] text-slate-400">
                          <span>💰 {formatCurrency(amt)} → +{fromAmount.toFixed(1)}%</span>
                          <span>🛒 {purchaseCount} худалдан авалт → +{fromPurchases.toFixed(1)}%</span>
                        </div>
                      </div>
                    );
                  })()}

                  {isOwner && (
                    <button
                      onClick={() => {
                        handleDeleteCitizen(selectedCitizen.id);
                        setSelectedCitizen(null);
                      }}
                      className="w-full py-3 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold rounded-2xl flex items-center justify-center gap-2 transition-colors"
                    >
                      <Trash2 size={16} /> Бүртгэл устгах
                    </button>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Welcome Notification */}
        <AnimatePresence>
          {showWelcomeNotif && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[500] flex items-center justify-center p-6 bg-slate-900/70 backdrop-blur-md"
              onClick={() => setShowWelcomeNotif(false)}
            >
              <motion.div
                initial={{ scale: 0.7, y: 40, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 22 }}
                className="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden text-center"
                onClick={e => e.stopPropagation()}
              >
                <div className="p-6 bg-gradient-to-br from-brand-600 to-brand-700 flex flex-col items-center gap-3">
                  <motion.div
                    animate={{ scale: [1, 1.15, 1] }}
                    transition={{ duration: 1.2, repeat: Infinity, repeatDelay: 1 }}
                    className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center"
                  >
                    {isEarlyUser ? (
                      <span className="text-5xl">💎</span>
                    ) : (
                      <Users size={40} className="text-white" />
                    )}
                  </motion.div>
                  <h3 className="font-display font-black text-2xl text-white tracking-tight">
                    {isNewUser ? 'Тавтай морил!' : 'Таны дугаар'}
                  </h3>
                </div>
                <div className="p-6 space-y-4">
                  <p className="text-slate-600 text-sm leading-relaxed">
                    {isNewUser ? 'Та манай' : 'Та аль хэдийн манай'}
                  </p>
                  <div
                    className={`inline-flex items-center gap-2 px-6 py-3 rounded-full font-black text-xl tracking-widest mx-auto ${isEarlyUser ? 'text-sky-700' : 'bg-slate-100 text-slate-700'}`}
                    style={isEarlyUser ? {
                      background: 'linear-gradient(white, white) padding-box, linear-gradient(135deg, #67e8f9, #818cf8, #c084fc, #67e8f9) border-box',
                      border: '2px solid transparent',
                      animation: 'diamond-spin 4s linear infinite',
                    } : {}}
                  >
                    {isEarlyUser && <span className="text-2xl">💎</span>}
                    {userNumber !== null ? `№${userNumber}` : '...'}
                  </div>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    {isNewUser ? 'дэх иргэн боллоо!' : 'дэх иргэн болсон байна.'}{isEarlyUser && <span className="block mt-1 text-sky-600 font-bold">Diamond хүрээтэй онцгой иргэн 🎉</span>}
                  </p>
                  <button
                    onClick={() => setShowWelcomeNotif(false)}
                    className="w-full py-3 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-2xl transition-colors shadow-lg shadow-brand-600/20"
                  >
                    Баярлалаа!
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Gift Edit Modal (Admin only) */}
        <AnimatePresence>
          {showGiftEdit && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[400] flex items-center justify-center p-6 bg-slate-900/80 backdrop-blur-md"
            >
              <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.9 }}
                className="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden"
              >
                <div className="p-6 bg-amber-500 text-white flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Pencil size={18} />
                    <h3 className="font-bold text-lg">Бэлгийн мессеж засах</h3>
                  </div>
                  <button onClick={() => setShowGiftEdit(false)} className="p-1 hover:bg-white/20 rounded-full">
                    <X size={20} />
                  </button>
                </div>
                <div className="p-6 space-y-4">
                  <textarea
                    value={giftEditValue}
                    onChange={e => setGiftEditValue(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:border-amber-400 h-32 resize-none text-slate-800"
                    placeholder="Бэлгийн мессеж..."
                  />
                  <button
                    onClick={() => { setGiftMessage(giftEditValue); setShowGiftEdit(false); }}
                    disabled={!giftEditValue.trim()}
                    className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-2xl flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <Check size={18} /> Хадгалах
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Add Product Modal */}
        <AnimatePresence>
          {showProductForm && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-[300] flex items-end sm:items-center justify-center bg-slate-900/80 backdrop-blur-md"
              onClick={() => setShowProductForm(false)}
            >
              <motion.div initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }}
                className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl"
                onClick={e => e.stopPropagation()}
              >
                <div className="p-5 bg-gradient-to-r from-brand-500 to-brand-700 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Package size={18} className="text-white" />
                    <h3 className="font-bold text-white text-lg">Бараа нэмэх</h3>
                  </div>
                  <button onClick={() => setShowProductForm(false)} className="p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors">
                    <X size={20} className="text-white" />
                  </button>
                </div>
                <div className="p-5 space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Барааны зураг</label>
                    <div className="flex items-center gap-4">
                      <label className="flex-1 flex flex-col items-center justify-center h-32 border-2 border-dashed border-slate-200 rounded-2xl hover:border-brand-400 hover:bg-brand-50 transition-all cursor-pointer overflow-hidden relative">
                        {productForm.image ? (
                          <img src={productForm.image} alt="Preview" className="w-full h-full object-cover" />
                        ) : (
                          <>
                            <Camera className="text-slate-400 mb-2" size={24} />
                            <span className="text-xs text-slate-400 font-medium">Зураг сонгох</span>
                          </>
                        )}
                        <input type="file" accept="image/*" onChange={handleProductImageChange} className="hidden" />
                      </label>
                      {productForm.image && (
                        <button onClick={() => setProductForm({...productForm, image: ''})} className="p-2 bg-rose-50 text-rose-500 rounded-xl hover:bg-rose-100 transition-colors">
                          <X size={20} />
                        </button>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Барааны нэр</label>
                    <input type="text" value={productForm.name}
                      onChange={e => setProductForm({...productForm, name: e.target.value})}
                      placeholder="Жишээ: Цамц, Ном..."
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:border-brand-400 text-sm" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Барааны үнэ (₮)</label>
                    <input type="number" value={productForm.price}
                      onChange={e => setProductForm({...productForm, price: e.target.value})}
                      placeholder="Жишээ: 25000"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:border-brand-400 text-sm" />
                  </div>
                  <button onClick={handleProductAdd} disabled={!productForm.name.trim() || !productForm.price}
                    className="w-full py-4 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm disabled:opacity-50 flex items-center justify-center gap-2 transition-all shadow-lg shadow-brand-600/20">
                    <Plus size={16} /> Нэмэх
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Order Modal */}
        <AnimatePresence>
          {selectedProduct && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md"
              onClick={() => setSelectedProduct(null)}
            >
              <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
                onClick={e => e.stopPropagation()}
                className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl"
              >
                <div className="p-5 bg-gradient-to-r from-brand-500 to-brand-700 text-white flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-lg">{selectedProduct.name}</h3>
                    <p className="text-white/80 text-sm">{Number(selectedProduct.price).toLocaleString()}₮</p>
                  </div>
                  <button onClick={() => setSelectedProduct(null)} className="p-2 hover:bg-white/20 rounded-full">
                    <X size={20} />
                  </button>
                </div>
                <div className="p-5 space-y-4">
                  {/* Order type */}
                  <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => setOrderType('direct')}
                      className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${orderType === 'direct' ? 'border-brand-500 bg-brand-50' : 'border-slate-200 hover:border-brand-200'}`}>
                      <ShoppingBag size={24} className={orderType === 'direct' ? 'text-brand-600' : 'text-slate-400'} />
                      <span className={`text-sm font-bold ${orderType === 'direct' ? 'text-brand-700' : 'text-slate-500'}`}>Шууд авах</span>
                    </button>
                    <button onClick={() => setOrderType('delivery')}
                      className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${orderType === 'delivery' ? 'border-brand-500 bg-brand-50' : 'border-slate-200 hover:border-brand-200'}`}>
                      <Truck size={24} className={orderType === 'delivery' ? 'text-brand-600' : 'text-slate-400'} />
                      <span className={`text-sm font-bold ${orderType === 'delivery' ? 'text-brand-700' : 'text-slate-500'}`}>Хүргэлтээр</span>
                    </button>
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Утасны дугаар</label>
                    <input type="tel" value={orderForm.phone}
                      onChange={e => setOrderForm({...orderForm, phone: e.target.value})}
                      placeholder="Таны утасны дугаар"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:border-brand-400 text-sm" />
                  </div>

                  {/* Address (delivery only) */}
                  {orderType === 'delivery' && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                      <label className="text-xs font-bold text-slate-500 uppercase mb-1 block flex items-center gap-1">
                        <MapPin size={12} /> Гэрийн хаяг
                      </label>
                      <textarea value={orderForm.address}
                        onChange={e => setOrderForm({...orderForm, address: e.target.value})}
                        placeholder="Дүүрэг, хороо, байр, тоот..."
                        rows={3}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:border-brand-400 text-sm resize-none" />
                      <p className="text-xs text-brand-600 mt-1 flex items-center gap-1">
                        <Info size={11} /> Захиалга бидэнд мэдэгдэл болж ирнэ
                      </p>
                    </motion.div>
                  )}

                  <button onClick={handleOrder}
                    disabled={orderSubmitting || !orderForm.phone || (orderType === 'delivery' && !orderForm.address)}
                    className="w-full py-3.5 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-2xl text-sm shadow-lg shadow-brand-600/20 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
                  >
                    {orderSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                    {orderType === 'delivery' ? 'Хүргэлт захиалах' : 'Захиалга баталгаажуулах'}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Help Form Modal */}
        <AnimatePresence>
          {showHelpForm && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md"
            >
              <motion.div 
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl"
              >
                <div className="p-6 bg-amber-600 text-white flex justify-between items-center">
                  <div>
                    <h3 className="font-display font-bold text-xl">Ask for Help</h3>
                    <p className="text-amber-100 text-xs">Тус асуухын тулд эхлээд туслах ёстой</p>
                  </div>
                  <button onClick={() => setShowHelpForm(false)} className="p-2 hover:bg-white/20 rounded-full">
                    <X size={20} />
                  </button>
                </div>
                <div className="p-6 space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Нэр</label>
                    <input 
                      type="text" 
                      value={helpForm.name}
                      onChange={e => setHelpForm({...helpForm, name: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:border-amber-500"
                      placeholder="Таны нэр"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Дугаар</label>
                    <input 
                      type="tel" 
                      value={helpForm.phone}
                      onChange={e => setHelpForm({...helpForm, phone: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:border-amber-500"
                      placeholder="Утасны дугаар"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Юу хэрэгтэй вэ?</label>
                    <textarea 
                      value={helpForm.content}
                      onChange={e => setHelpForm({...helpForm, content: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:border-amber-500 h-32 resize-none"
                      placeholder="Танд ямар тусламж хэрэгтэй байна вэ?"
                    />
                  </div>
                  <div className="bg-amber-50 p-4 rounded-2xl flex justify-between items-center border border-amber-100">
                    <span className="text-sm font-bold text-amber-700">Төлбөр</span>
                    <span className="text-lg font-bold text-amber-700">20,000₮</span>
                  </div>
                  <button 
                    onClick={handleAskHelp}
                    disabled={isSubmitting || !helpForm.name || !helpForm.phone || !helpForm.content}
                    className="w-full py-4 bg-amber-600 text-white rounded-2xl font-bold text-lg hover:bg-amber-700 transition-all shadow-xl shadow-amber-600/20 disabled:opacity-50"
                  >
                    {isSubmitting ? "Уншиж байна..." : "Төлөх"}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Suggestion Form Modal */}
        <AnimatePresence>
          {showSuggestionForm && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md"
            >
              <motion.div 
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl"
              >
                <div className="p-6 bg-blue-600 text-white flex justify-between items-center">
                  <div>
                    <h3 className="font-display font-bold text-xl">Санал Хүсэлт Форм</h3>
                    <p className="text-blue-100 text-xs">Бидэнд санал хүсэлтээ илгээнэ үү</p>
                  </div>
                  <button onClick={() => setShowSuggestionForm(false)} className="p-2 hover:bg-white/20 rounded-full">
                    <X size={20} />
                  </button>
                </div>
                <div className="p-6 space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Нэр</label>
                    <input 
                      type="text" 
                      value={suggestionForm.name}
                      onChange={e => setSuggestionForm({...suggestionForm, name: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:border-blue-500"
                      placeholder="Таны нэр"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Дугаар</label>
                    <input 
                      type="tel" 
                      value={suggestionForm.phone}
                      onChange={e => setSuggestionForm({...suggestionForm, phone: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:border-blue-500"
                      placeholder="Утасны дугаар"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Миний Хүсэлт</label>
                    <textarea 
                      value={suggestionForm.content}
                      onChange={e => setSuggestionForm({...suggestionForm, content: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:border-blue-500 h-32 resize-none"
                      placeholder="Таны санал хүсэлт..."
                    />
                  </div>
                  <div className="bg-blue-50 p-4 rounded-2xl flex justify-between items-center border border-blue-100">
                    <span className="text-sm font-bold text-blue-700">Хүсэлт Илгээх</span>
                    <span className="text-lg font-bold text-emerald-600 uppercase tracking-widest">Үнэгүй</span>
                  </div>
                  <button 
                    onClick={handleSendSuggestion}
                    disabled={isSubmitting || !suggestionForm.name || !suggestionForm.phone || !suggestionForm.content}
                    className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold text-lg hover:bg-blue-700 transition-all shadow-xl shadow-blue-600/20 disabled:opacity-50"
                  >
                    {isSubmitting ? "Уншиж байна..." : "Хүсэлт Илгээх"}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* CRA Rating Modal */}
        <AnimatePresence>
          {showCRARatingModal && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md"
              onClick={() => setShowCRARatingModal(false)}
            >
              <motion.div 
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl"
                onClick={e => e.stopPropagation()}
              >
                <div className="p-6 bg-amber-500 text-white flex items-center justify-between">
                  <h3 className="font-display font-bold text-xl">
                    {craRatingType === 'free' ? 'CRA Free Rating' : 'CRA Paid Rating'}
                  </h3>
                  <button onClick={() => setShowCRARatingModal(false)} className="p-2 hover:bg-white/20 rounded-full transition-colors">
                    <X size={20} />
                  </button>
                </div>
                <div className="p-8 space-y-8">
                  {craRatingType === 'paid' && ratingStep === 'payment' ? (
                    <div className="space-y-6 text-center">
                      <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mx-auto">
                        <Zap className="text-amber-500" size={40} />
                      </div>
                      <div className="space-y-2">
                        <h4 className="font-bold text-xl text-slate-900">Төлбөр төлөх</h4>
                        <p className="text-slate-500 text-sm">
                          CRA Paid үнэлгээ өгөхөд 5,000₮ төлөх шаардлагатай. Төлбөр төлсний дараа үнэлгээ өгөх хэсэг нээгдэнэ.
                        </p>
                      </div>
                      <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 flex justify-between items-center">
                        <span className="text-sm font-bold text-amber-700">Төлөх дүн</span>
                        <span className="text-xl font-bold text-amber-700">5,000₮</span>
                      </div>
                      <button 
                        onClick={async () => {
                          try {
                            setIsSubmitting(true);
                            const response = await axios.post('/api/qpay/invoice', {
                              amount: 5000,
                              description: `CRA Paid Rating`,
                            });
                            setQpayInvoice(response.data);
                            setOnPaymentSuccess(() => () => setRatingStep('rating'));
                          } catch (error) {
                            console.error("QPay invoice creation failed:", error);
                            alert("Төлбөрийн нэхэмжлэх үүсгэхэд алдаа гарлаа.");
                          } finally {
                            setIsSubmitting(false);
                          }
                        }}
                        className="w-full py-4 bg-amber-500 text-white rounded-2xl font-bold text-lg shadow-xl shadow-amber-500/20 hover:bg-amber-600 transition-all"
                      >
                        Төлбөр төлөх
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="text-center space-y-2">
                        <p className="text-slate-500 text-sm">Үнэлгээг 1-100 хүртэлх оноогоор өгнө үү.</p>
                        <div className="text-5xl font-display font-bold text-amber-500">{craRatingValue}</div>
                      </div>

                      <div className="space-y-4">
                        <input 
                          type="range" 
                          min="1" 
                          max="100" 
                          value={craRatingValue} 
                          onChange={(e) => setCRARatingValue(parseInt(e.target.value))}
                          className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-amber-500"
                        />
                        <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          <span>1 (Муу)</span>
                          <span>100 (Маш сайн)</span>
                        </div>
                      </div>

                      <button 
                        onClick={handleGiveCRARating}
                        disabled={isSubmitting}
                        className="w-full py-4 bg-amber-500 text-white rounded-2xl font-bold text-lg shadow-xl shadow-amber-500/20 hover:bg-amber-600 transition-all flex items-center justify-center gap-2"
                      >
                        {isSubmitting ? 'Илгээж байна...' : 'Үнэлгээ өгөх'}
                      </button>
                    </>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* CTR Rating Modal */}
        <AnimatePresence>
          {showCTRRatingModal && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md"
              onClick={() => setShowCTRRatingModal(false)}
            >
              <motion.div 
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl"
                onClick={e => e.stopPropagation()}
              >
                <div className="p-6 bg-emerald-500 text-white flex items-center justify-between">
                  <h3 className="font-display font-bold text-xl">
                    {ctrRatingType === 'free' ? 'CTR Free Rating' : 'CTR Paid Rating'}
                  </h3>
                  <button onClick={() => setShowCTRRatingModal(false)} className="p-2 hover:bg-white/20 rounded-full transition-colors">
                    <X size={20} />
                  </button>
                </div>
                <div className="p-8 space-y-8">
                  {ctrRatingType === 'paid' && ratingStep === 'payment' ? (
                    <div className="space-y-6 text-center">
                      <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto">
                        <Zap className="text-emerald-500" size={40} />
                      </div>
                      <div className="space-y-2">
                        <h4 className="font-bold text-xl text-slate-900">Төлбөр төлөх</h4>
                        <p className="text-slate-500 text-sm">
                          CTR Paid үнэлгээ өгөхөд 5,000₮ төлөх шаардлагатай. Төлбөр төлсний дараа үнэлгээ өгөх хэсэг нээгдэнэ.
                        </p>
                      </div>
                      <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 flex justify-between items-center">
                        <span className="text-sm font-bold text-emerald-700">Төлөх дүн</span>
                        <span className="text-xl font-bold text-emerald-700">5,000₮</span>
                      </div>
                      <button 
                        onClick={async () => {
                          try {
                            setIsSubmitting(true);
                            const response = await axios.post('/api/qpay/invoice', {
                              amount: 5000,
                              description: `CTR Paid Rating`,
                            });
                            setQpayInvoice(response.data);
                            setOnPaymentSuccess(() => () => setRatingStep('rating'));
                          } catch (error) {
                            console.error("QPay invoice creation failed:", error);
                            alert("Төлбөрийн нэхэмжлэх үүсгэхэд алдаа гарлаа.");
                          } finally {
                            setIsSubmitting(false);
                          }
                        }}
                        className="w-full py-4 bg-emerald-500 text-white rounded-2xl font-bold text-lg shadow-xl shadow-emerald-500/20 hover:bg-emerald-600 transition-all"
                      >
                        Төлбөр төлөх
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="text-center space-y-2">
                        <p className="text-slate-500 text-sm">Үнэлгээг 1-100 хүртэлх оноогоор өгнө үү.</p>
                        <div className="text-5xl font-display font-bold text-emerald-500">{ctrRatingValue}</div>
                      </div>

                      <div className="space-y-4">
                        <input 
                          type="range" 
                          min="1" 
                          max="100" 
                          value={ctrRatingValue} 
                          onChange={(e) => setCTRRatingValue(parseInt(e.target.value))}
                          className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                        />
                        <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          <span>1 (Муу)</span>
                          <span>100 (Маш сайн)</span>
                        </div>
                      </div>

                      <button 
                        onClick={handleGiveCTRRating}
                        disabled={isSubmitting}
                        className="w-full py-4 bg-emerald-500 text-white rounded-2xl font-bold text-lg shadow-xl shadow-emerald-500/20 hover:bg-emerald-600 transition-all flex items-center justify-center gap-2"
                      >
                        {isSubmitting ? 'Илгээж байна...' : 'Үнэлгээ өгөх'}
                      </button>
                    </>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* CRC Report Modal */}
        <AnimatePresence>
          {showCRCReportModal && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md"
              onClick={() => setShowCRCReportModal(false)}
            >
              <motion.div 
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl max-h-[90vh] flex flex-col"
                onClick={e => e.stopPropagation()}
              >
                <div className={cn(
                  "p-6 text-white flex items-center justify-between",
                  crcReportType === 'good' ? "bg-emerald-500" : "bg-rose-500"
                )}>
                  <h3 className="font-display font-bold text-xl">
                    {crcReportType === 'good' ? 'Good Report' : 'Bad Report'}
                  </h3>
                  <button onClick={() => setShowCRCReportModal(false)} className="p-2 hover:bg-white/20 rounded-full transition-colors">
                    <X size={20} />
                  </button>
                </div>
                <div className="p-6 overflow-y-auto space-y-4 scrollbar-hide">
                  <p className="text-slate-500 text-sm text-center mb-4">Тайлангийн шалтгааныг сонгоно уу.</p>
                  
                  <div className="grid grid-cols-1 gap-3">
                    {crcReportType === 'good' ? (
                      <>
                        {[
                          { label: 'Энэ сайн залуу', credit: 100 },
                          { label: 'Энэ хүн амласандаа хүрдэг', credit: 80 },
                          { label: 'Энэ хүн шударга', credit: 70 },
                          { label: 'Энэ хүн бусдад тусалдаг', credit: 90 },
                          { label: 'Энэ хүн хурдан, найдвартай', credit: 85 },
                          { label: 'Энэ хүн үүргээ сайн биелүүлдэг', credit: 75 },
                          { label: 'Энэ хүн итгэл даахуйц', credit: 95 },
                          { label: 'Энэ хүн зөв хандлагатай', credit: 60 },
                          { label: 'Энэ хүн чанартай ажилладаг', credit: 88 },
                          { label: 'Энэ хүн хариуцлагатай', credit: 92 },
                          { label: 'Итгэлтэй хүн', credit: 100 },
                          { label: 'Сайн ажилласан', credit: 80 },
                          { label: 'Зөв хандлагатай', credit: 70 },
                          { label: 'Бусдад тусалсан', credit: 90 },
                          { label: 'Шударга', credit: 85 }
                        ].map((opt, i) => (
                          <button 
                            key={i}
                            onClick={() => handleGiveCRCReport(opt.label, opt.credit)}
                            className="flex items-center justify-between p-4 bg-emerald-50 border border-emerald-100 rounded-2xl hover:bg-emerald-100 transition-all group"
                          >
                            <span className="text-sm font-medium text-slate-700">{opt.label}</span>
                            <span className="font-bold text-emerald-600">+{opt.credit}</span>
                          </button>
                        ))}
                      </>
                    ) : (
                      <>
                        {[
                          { label: 'Энэ муу залуу', credit: -100 },
                          { label: 'Энэ хүн худал хэлдэг', credit: -90 },
                          { label: 'Энэ хүн амлалтаа биелүүлдэггүй', credit: -85 },
                          { label: 'Энэ хүн бусдыг хуурсан', credit: -120 },
                          { label: 'Энэ хүн хариуцлагагүй', credit: -80 },
                          { label: 'Энэ хүн удаа дараа алдаа гаргасан', credit: -70 },
                          { label: 'Энэ хүн итгэл эвдсэн', credit: -110 },
                          { label: 'Энэ хүн бүдүүлэг ханддаг', credit: -60 },
                          { label: 'Энэ хүн чанаргүй ажилласан', credit: -75 },
                          { label: 'Энэ хүн муу нөлөөтэй', credit: -95 },
                          { label: 'Итгэл эвдсэн', credit: -100 },
                          { label: 'Муу ажилласан', credit: -80 },
                          { label: 'Бүдүүлэг хандсан', credit: -70 },
                          { label: 'Бусдад саад болсон', credit: -90 },
                          { label: 'Худалч', credit: -85 }
                        ].map((opt, i) => (
                          <button 
                            key={i}
                            onClick={() => handleGiveCRCReport(opt.label, opt.credit)}
                            className="flex items-center justify-between p-4 bg-rose-50 border border-rose-100 rounded-2xl hover:bg-rose-100 transition-all group"
                          >
                            <span className="text-sm font-medium text-slate-700">{opt.label}</span>
                            <span className="font-bold text-rose-600">{opt.credit}</span>
                          </button>
                        ))}
                      </>
                    )}
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

      {isSubmitting && (
        <div className="fixed inset-0 z-[200] bg-white/60 backdrop-blur-sm flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" />
            <p className="font-bold text-brand-900">Боловсруулж байна...</p>
          </div>
        </div>
      )}
      </div>
    </ErrorBoundary>
  );
}
