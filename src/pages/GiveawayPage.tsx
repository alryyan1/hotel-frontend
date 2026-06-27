import { useEffect, useState } from 'react';
import heroBg from '../assets/hero.png';
import myLogo from '../assets/nova-logo.png';

type IconName =
  | 'trophy' | 'target' | 'shield' | 'gift' | 'calendar' | 'list'
  | 'user' | 'phone' | 'pin' | 'building' | 'bed' | 'medal'
  | 'star' | 'check' | 'whatsapp' | 'tiktok' | 'facebook' | 'close' | 'share';

const ICONS: Record<IconName, string | string[]> = {
  trophy:   "M6 9H3.5a2.5 2.5 0 0 1 0-5H6m12 5h2.5a2.5 2.5 0 0 0 0-5H18M6 4h12v9a6 6 0 0 1-12 0V4ZM8 21h8m-4-4v4m-5 0h10",
  target:   ["M22 12A10 10 0 1 1 12 2", "M22 12l-9.4 2.7L10 22 12 2l10 10Z"],
  shield:   "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z",
  gift:     ["M20 12v10H4V12", "M2 7h20v5H2Z", "M12 22V7", "M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7Z", "M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7Z"],
  calendar: [],
  list:     ["M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2", "M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v0a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2Z", "M9 12h6M9 16h4"],
  user:     ["M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2", "M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"],
  phone:    "M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.77 9.94a19.79 19.79 0 0 1-3.07-8.68A2 2 0 0 1 3.7 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.13 6.13l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92Z",
  pin:      [],
  building: ["M3 21h18", "M3 7v14", "M21 7v14", "M6 7V3h12v4", "M6 11h3m6 0h3M6 15h3m6 0h3M6 19h3m6 0h3"],
  bed:      ["M2 4v16", "M2 8h18a2 2 0 0 1 2 2v10", "M2 17h20", "M6 8v9"],
  medal:    ["M12 15a7 7 0 1 0 0-14 7 7 0 0 0 0 14Z", "M8.21 13.89L7 23l5-3 5 3-1.21-9.12"],
  star:     "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2Z",
  check:    "M20 6L9 17l-5-5",
  whatsapp: ["M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.455 5.703 1.457h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"],
  facebook: "M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z",
  tiktok:   "M12.53.15C13.82.14 15 .21 15 .21v4.3s-1.16-.08-2.3.43c-.83.37-1.35 1.08-1.35 2.19v3.17c0 3.12-1.28 5.4-4.8 5.4-2.73 0-5-2-5-5.26 0-3.1 2.37-5.18 5.23-5.02v4.21c-.81-.13-1.43.32-1.43 1.04 0 .97.83 1.1 1.43 1.1 1.25 0 1.47-.79 1.47-1.74V0h4.3a6.83 6.83 0 0 0 3.98 2.54V0z",
  close:    "M18 6L6 18M6 6l12 12",
  share:    ["M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8", "M16 6l-4-4-4 4", "M12 2v13"]
};

function SvgIcon({ name, size = 20, color = "currentColor", strokeWidth = 1.8 }: {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
}) {
  const paths = ICONS[name];
  if (!paths) return null;

  if (name === 'calendar') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    );
  }

  if (name === 'pin') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0Z" />
        <circle cx="12" cy="10" r="3" />
      </svg>
    );
  }

  if (name === 'whatsapp') {
    const arr = paths as string[];
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
        {arr.map((p, i) => <path key={i} d={p} />)}
      </svg>
    );
  }

  if (name === 'tiktok' || name === 'facebook') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
        <path d={paths as string} />
      </svg>
    );
  }

  const pathsArr = Array.isArray(paths) ? paths : [paths];
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      {pathsArr.map((p, i) => <path key={i} d={p} />)}
    </svg>
  );
}

interface FormData {
  full_name: string;
  phone_number: string;
  address: string;
}

interface DialogState {
  isOpen: boolean;
  type: 'success' | 'error';
  message: string;
}

export default function GiveawayPage() {
  const [isMobile, setIsMobile] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    full_name: '',
    phone_number: '',
    address: ''
  });
  const [loading, setLoading] = useState(false);
  const [clicked, setClicked] = useState({ facebook: false, tiktok: false, share: false });

  const [dialog, setDialog] = useState<DialogState>({
    isOpen: false,
    type: 'success',
    message: ''
  });

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

 const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const digits = formData.phone_number.replace(/\D/g, '');
    if (digits.length < 10) {
      setDialog({ isOpen: true, type: 'error', message: 'رقم الهاتف يجب أن يكون 10 أرقام على الأقل.' });
      return;
    }

    const missing = [
      !clicked.facebook && 'فيسبوك',
      !clicked.tiktok   && 'تيك توك',
      !clicked.share    && 'مشاركة الرابط',
    ].filter(Boolean) as string[];

    if (missing.length > 0) {
      setDialog({
        isOpen: true,
        type: 'error',
        message: `يجب أولاً إتمام الشروط التالية قبل التسجيل:\n• ${missing.join('\n• ')}`,
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('https://backend.nova-suits.com/hotel-backend/public/api/public/participate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setDialog({
          isOpen: true,
          type: 'success',
          message: data.message || 'تم تسجيل مشاركتك في السحب بنجاح! نتمنى لك الفوز.'
        });
        setFormData({ full_name: '', phone_number: '', address: '' });
      } else {
        const firstError =
          (data.errors ? Object.values(data.errors as Record<string, string[]>)[0]?.[0] : null)
          ?? data.message
          ?? 'حدث خطأ ما، يرجى التحقق من المدخلات.';
        setDialog({ isOpen: true, type: 'error', message: firstError });
      }
    } catch {
      setDialog({
        isOpen: true,
        type: 'error',
        message: 'تعذر الاتصال بالسيرفر، يرجى التحقق من جودة الإنترنت.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: 'مسابقة شقق نوفا الفندقية',
      text: 'شارك في السحب واربح 100$ سجّل بياناتك الآن.',
      url: 'https://app.nova-suits.com/giveaway',
    };
    if (navigator.share) {
      await navigator.share(shareData);
    } else {
      await navigator.clipboard.writeText(shareData.url);
      alert('تم نسخ الرابط!');
    }
  };

  const inputBase: React.CSSProperties = {
    width: "100%",
    padding: "13px 16px 13px 44px",
    background: "#F7F9FC",
    border: "1.5px solid #E8EDF5",
    borderRadius: "12px",
    fontSize: "14px",
    outline: "none",
    textAlign: "right",
    color: "#1a2740",
    boxSizing: "border-box",
    fontFamily: "system-ui, -apple-system, sans-serif",
    transition: "border-color 0.2s",
  };

  return (
    <div style={{
      minHeight: "100vh",
      position: "relative",
      fontFamily: "system-ui, -apple-system, sans-serif",
      direction: "rtl",
      color: "#fff",
      overflowX: "hidden",
    }}>
      {/* خلفية صورة الفندق */}
      <div style={{
        position: "fixed", inset: 0,
        backgroundImage: `url(${heroBg})`,
        backgroundSize: "cover",
        backgroundPosition: "center top",
        zIndex: 0,
      }} />
      {/* طبقة التعتيم */}
      <div style={{
        position: "fixed", inset: 0,
        background: "linear-gradient(175deg, rgba(2,8,32,0.72) 0%, rgba(4,14,44,0.80) 25%, rgba(5,16,50,0.87) 55%, rgba(2,7,28,0.95) 100%)",
        zIndex: 1,
      }} />
      <div style={{
        position: "fixed", inset: 0,
        background: "radial-gradient(ellipse at 50% 20%, rgba(10,30,80,0.35) 0%, rgba(0,0,0,0) 65%)",
        zIndex: 1,
      }} />

      {/* HERO */}
      <div style={{
        position: "relative", width: "100%",
        padding: isMobile ? "30px 16px 20px" : "60px 40px 50px",
        boxSizing: "border-box",
        display: "flex", flexDirection: "column", alignItems: "center",
        zIndex: 2,
      }}>
        <div style={{ position: "relative", zIndex: 2, textAlign: "center", width: "100%", maxWidth: "860px" }}>
          <img src={myLogo} alt="شقق نوفا الفندقية"
            style={{ maxWidth: isMobile ? "95px" : "150px", height: "auto", marginBottom: "16px", margin: "0 auto 16px", display: "block" }} />

          <h1 style={{ fontSize: isMobile ? "18px" : "26px", fontWeight: "700", margin: "0 0 8px", color: "#fff", textShadow: "0 2px 8px rgba(0,0,0,0.5)", lineHeight: "1.4" }}>
            أدخل بياناتك وشارك في السحب على جوائز نقدية بقيمة إجمالية
          </h1>

          <div style={{
            fontSize: isMobile ? "55px" : "100px", fontWeight: "900", color: "#D4A017",
            lineHeight: 1, margin: "10px 0 8px",
            textShadow: "0 4px 24px rgba(212,160,23,0.5), 0 2px 10px rgba(0,0,0,0.6)",
            display: "flex", alignItems: "center", justifyContent: "center", gap: "14px",
          }}>
            $500
            <span style={{
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              width: isMobile ? "46px" : "76px", height: isMobile ? "46px" : "76px",
              background: "rgba(5, 15, 34, 0.8)", border: "2px solid rgba(212,160,23,0.8)",
              borderRadius: "50%", boxShadow: "0 4px 15px rgba(0,0,0,0.3)"
            }}>
              <SvgIcon name="gift" size={isMobile ? 22 : 38} color="#D4A017" strokeWidth={1.5} />
            </span>
          </div>

          {/* توضيح تفاصيل الجوائز */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
            margin: "0 0 20px",
            background: "rgba(212,160,23,0.1)", border: "1px solid rgba(212,160,23,0.35)",
            borderRadius: "50px", padding: isMobile ? "7px 16px" : "8px 22px",
            width: "fit-content", marginLeft: "auto", marginRight: "auto",
          }}>
            <SvgIcon name="trophy" size={14} color="#D4A017" />
            <span style={{ fontSize: isMobile ? "12px" : "14px", color: "#F0C040", fontWeight: "700" }}>
              5 فائزين — 100$ لكل فائز
            </span>
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", justifyContent: "center" }}>
            {[
              { icon: "trophy" as IconName, title: "5 جوائز",        sub: "$100 لكل فائز" },
              { icon: "check"  as IconName, title: "مشاركة واحدة",  sub: "تكفي للدخول" },
              { icon: "shield" as IconName, title: "آمن وسريع",      sub: "100%" },
            ].map((b, i) => (
              <div key={i} style={{
                background: "rgba(5, 17, 38, 0.85)", backdropFilter: "blur(12px)",
                border: "1.5px solid rgba(212,160,23,0.4)", borderRadius: "12px",
                padding: isMobile ? "8px 16px" : "12px 28px", display: "flex", alignItems: "center", gap: "10px",
                minWidth: isMobile ? "85px" : "140px", boxShadow: "0 6px 20px rgba(0,0,0,0.3)"
              }}>
                <SvgIcon name={b.icon} size={16} color="#D4A017" />
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontWeight: "600", fontSize: isMobile ? "11px" : "13px", color: "#fff" }}>{b.title}</div>
                  <div style={{ fontSize: isMobile ? "10px" : "11px", color: "#cbd5e1", marginTop: "1px" }}>{b.sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* FORM CARD */}
      <div style={{ padding: isMobile ? "0 12px 24px" : "0 20px 40px", display: "flex", justifyContent: "center", position: "relative", zIndex: 2 }}>
        <div style={{
          width: "100%", maxWidth: "860px", background: "#ffffff",
          borderRadius: "24px", overflow: "hidden",
          boxShadow: "0 30px 70px rgba(0,0,0,0.45)",
        }}>
          <div style={{
            background: "linear-gradient(90deg, #05132d 0%, #0c234c 100%)",
            padding: isMobile ? "14px 16px" : "20px 28px", textAlign: "center",
          }}>
            <h3 style={{ margin: 0, color: "#fff", fontSize: isMobile ? "13px" : "18px", fontWeight: "700" }}>
              يرجى تعبئة البيانات التالية للدخول في السحب
            </h3>
          </div>

          <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row" }}>
            {/* Side Card */}
            <div style={{
              width: isMobile ? "100%" : "250px", flexShrink: 0,
              background: "#051126", padding: isMobile ? "24px 20px" : "32px 24px",
              display: "flex", flexDirection: "column", color: "#fff",
              boxSizing: "border-box", order: isMobile ? 2 : 1,
            }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "16px", flex: 1 }}>
                {[
                  { icon: "trophy"   as IconName, label: "الجوائز",     value: "5 فائزين — 100$ لكل فائز" },
                  { icon: "calendar" as IconName, label: "تاريخ السحب", value: "سيتم الإعلان في صفحتنا" },
                ].map((item, i) => (
                  <div key={i} style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                    <div style={{ width: "32px", height: "32px", flexShrink: 0, background: "rgba(212,160,23,0.12)", border: "1px solid rgba(212,160,23,0.3)", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <SvgIcon name={item.icon} size={14} color="#D4A017" />
                    </div>
                    <div>
                      <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", marginBottom: "2px" }}>{item.label}</div>
                      <div style={{ fontSize: "13px", fontWeight: "600", lineHeight: 1.4 }}>{item.value}</div>
                    </div>
                  </div>
                ))}

                {/* شروط المشاركة */}
                <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                  <div style={{ width: "32px", height: "32px", flexShrink: 0, background: "rgba(212,160,23,0.12)", border: "1px solid rgba(212,160,23,0.3)", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <SvgIcon name="list" size={14} color="#D4A017" />
                  </div>
                  <div>
                    <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", marginBottom: "6px" }}>شروط المشاركة</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      {[
                        "متابعة صفحاتنا على مواقع التواصل الإجتماعي",
                        "مشاركة رابط المسابقة",
                      ].map((cond, ci) => (
                        <div key={ci} style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
                          <span style={{ fontSize: "12px", fontWeight: "800", color: "#D4A017", flexShrink: 0 }}>{ci + 1}.</span>
                          <span style={{ fontSize: "12px", fontWeight: "600", lineHeight: 1.4 }}>{cond}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <div style={{
                marginTop: "20px", padding: "10px",
                background: "rgba(212,160,23,0.08)", border: "1px solid rgba(212,160,23,0.2)",
                borderRadius: "10px", textAlign: "center",
                fontSize: "13px", fontWeight: "700", color: "#D4A017",
                display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
              }}>
                <SvgIcon name="star" size={12} color="#D4A017" strokeWidth={2} />
                نتمنى لك الفوز
                <SvgIcon name="star" size={12} color="#D4A017" strokeWidth={2} />
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} style={{
              flex: 1, padding: isMobile ? "20px 16px" : "32px 28px",
              display: "flex", flexDirection: "column", justifyContent: "center",
              order: isMobile ? 1 : 2, boxSizing: "border-box",
            }}>
              <div style={{ marginBottom: "14px" }}>
                <label style={{ display: "block", color: "#07122A", fontWeight: "700", fontSize: "13px", marginBottom: "6px" }}>الاسم الكامل</label>
                <div style={{ position: "relative" }}>
                  <input type="text" required value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    placeholder="اكتب اسمك الكامل" style={inputBase}
                    onFocus={e => (e.target.style.borderColor = "#D4A017")}
                    onBlur={e => (e.target.style.borderColor = "#E8EDF5")} />
                  <span style={{ position: "absolute", left: "13px", top: "50%", transform: "translateY(-50%)", color: "#9BABC5", pointerEvents: "none", display: "flex" }}>
                    <SvgIcon name="user" size={17} color="#9BABC5" />
                  </span>
                </div>
              </div>

              <div style={{ marginBottom: "14px" }}>
                <label style={{ display: "block", color: "#07122A", fontWeight: "700", fontSize: "13px", marginBottom: "6px" }}>رقم الهاتف</label>
                <div style={{ position: "relative" }}>
                  <input type="tel" required value={formData.phone_number}
                    onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                    placeholder="09xxxxxxxxx" style={{ ...inputBase, direction: "ltr", textAlign: "right" }}
                    onFocus={e => (e.target.style.borderColor = "#D4A017")}
                    onBlur={e => (e.target.style.borderColor = "#E8EDF5")} />
                  <span style={{ position: "absolute", left: "13px", top: "50%", transform: "translateY(-50%)", color: "#9BABC5", pointerEvents: "none", display: "flex" }}>
                    <SvgIcon name="phone" size={17} color="#9BABC5" />
                  </span>
                </div>
              </div>

              <div style={{ marginBottom: "18px" }}>
                <label style={{ display: "block", color: "#07122A", fontWeight: "700", fontSize: "13px", marginBottom: "6px" }}>السكن</label>
                <div style={{ position: "relative" }}>
                  <input type="text" required value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="الخرطوم - بحري - امدرمان" style={inputBase}
                    onFocus={e => (e.target.style.borderColor = "#D4A017")}
                    onBlur={e => (e.target.style.borderColor = "#E8EDF5")} />
                  <span style={{ position: "absolute", left: "13px", top: "50%", transform: "translateY(-50%)", color: "#9BABC5", pointerEvents: "none", display: "flex" }}>
                    <SvgIcon name="pin" size={17} color="#9BABC5" />
                  </span>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "flex-start", gap: "10px", marginBottom: "18px" }}>
                <input type="checkbox" id="terms" defaultChecked
                  style={{ width: "16px", height: "16px", marginTop: "1px", accentColor: "#D4A017", flexShrink: 0, cursor: "pointer" } as React.CSSProperties} />
                <label htmlFor="terms" style={{ color: "#666", fontSize: "12px", cursor: "pointer", lineHeight: "1.5" }}>
                  أوافق على <span style={{ color: "#D4A017", fontWeight: "700" }}>شروط وأحكام السحب</span>
                </label>
              </div>

              {/* تنبيه الشروط المتبقية */}
              {(!clicked.facebook || !clicked.tiktok || !clicked.share) && (
                <div style={{
                  marginBottom: "12px", padding: "10px 14px",
                  background: "#FEF9EC", border: "1.5px solid #D4A017",
                  borderRadius: "12px", fontSize: "12px", color: "#7c5e10", lineHeight: 1.7,
                }}>
                  <div style={{ fontWeight: "700", marginBottom: "4px" }}>يجب إتمام الشروط أولاً:</div>
                  {!clicked.tiktok   && <div>• متابعة تيك توك ✗</div>}
                  {!clicked.facebook && <div>• متابعة فيسبوك ✗</div>}
                  {!clicked.share    && <div>• مشاركة رابط المسابقة ✗</div>}
                </div>
              )}

              <button type="submit" disabled={loading} style={{
                width: "100%", padding: "14px",
                background: loading ? "#ccc" : "linear-gradient(90deg, #b8862B 0%, #D4A017 100%)",
                color: "#fff", border: "none", borderRadius: "50px",
                fontSize: "15px", fontWeight: "800",
                cursor: loading ? "not-allowed" : "pointer",
                boxShadow: "0 8px 24px rgba(212,160,23,0.35)",
                display: "flex", alignItems: "center", justifyContent: "center", gap: "10px",
                fontFamily: "system-ui, -apple-system, sans-serif",
              }}>
                <SvgIcon name="gift" size={18} color="#fff" strokeWidth={2} />
                {loading ? 'جاري إرسال مشاركتك...' : 'أشارك الآن'}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* FEATURES CARD */}
      <div style={{ padding: isMobile ? "0 12px 24px" : "0 20px 32px", display: "flex", justifyContent: "center", position: "relative", zIndex: 2 }}>
        <div style={{
          width: "100%", maxWidth: "860px", background: "#ffffff",
          borderRadius: "16px", padding: isMobile ? "16px" : "20px 24px",
          display: "flex", flexDirection: isMobile ? "column" : "row",
          gap: isMobile ? "16px" : "0",
          boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
        }}>
          {[
            { icon: "building" as IconName, title: "موقع مميز",   desc: "في قلب المدينة وقريب من جميع الخدمات" },
            { icon: "bed"      as IconName, title: "إقامة فاخرة", desc: "تجربة إقامة راقية بخدمات متكاملة" },
            { icon: "medal"    as IconName, title: "ثقة وراحة",   desc: "شقق فندقية عصرية بمعايير عالية" },
          ].map((feat, i) => (
            <div key={i} style={{
              flex: 1, display: "flex", flexDirection: "row", alignItems: "center", gap: "14px",
              paddingLeft: !isMobile && i < 2 ? "24px" : "0",
              paddingRight: !isMobile && i > 0 ? "24px" : "0",
              borderLeft: !isMobile && i < 2 ? "1px solid #E2E8F0" : "none",
              borderBottom: isMobile && i < 2 ? "1px solid #F1F5F9" : "none",
              paddingBottom: isMobile && i < 2 ? "12px" : "0",
            }}>
              <div style={{ width: "38px", height: "38px", flexShrink: 0, background: "rgba(212,160,23,0.1)", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <SvgIcon name={feat.icon} size={20} color="#A17514" />
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontWeight: "700", fontSize: "13px", color: "#051126", marginBottom: "2px" }}>{feat.title}</div>
                <div style={{ fontSize: "11px", color: "#64748B", lineHeight: 1.4 }}>{feat.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* FOOTER (Social Links Design) */}
      <div style={{ padding: isMobile ? "0 12px 40px" : "0 20px 40px", display: "flex", justifyContent: "center", position: "relative", zIndex: 2 }}>
        <div style={{
          width: "100%", maxWidth: "860px",
          borderTop: "1px solid rgba(255,255,255,0.14)", paddingTop: "24px",
          display: "flex", flexDirection: "column",
          alignItems: "center", gap: "20px",
          boxSizing: "border-box",
        }}>
          
          <img src={myLogo} alt="نوفا" style={{ maxWidth: "80px", height: "auto", display: "block" }} />

          <div style={{ width: "100%", textAlign: "center" }}>
            <div style={{ fontSize: "13px", opacity: 0.7, marginBottom: "12px", fontWeight: "600" }}>تواصل معنا وتابع صفحاتنا </div>
            
            <div style={{ 
              display: "flex", 
              flexDirection: isMobile ? "column" : "row", 
              gap: "10px", 
              justifyContent: "center",
              width: "100%",
              maxWidth: isMobile ? "280px" : "100%",
              margin: "0 auto"
            }}>
              {/* زر واتساب */}
              <a href="https://wa.me/249120243000" target="_blank" rel="noreferrer" style={{ 
                display: "flex", alignItems: "center", justifyContent: "center", gap: "10px",
                padding: "12px 20px", background: "#25D366", color: "#fff", 
                borderRadius: "12px", textDecoration: "none", fontSize: "14px", fontWeight: "700",
                boxShadow: "0 4px 12px rgba(37,211,102,0.25)"
              }}>
                <SvgIcon name="whatsapp" size={18} color="#fff" />
                واتساب
              </a>

              {/* زر تيك توك */}
              <a
                href="https://www.tiktok.com/@nova_apartment?_r=1&_t=ZS-97Okse5qhXu"
                target="_blank" rel="noreferrer"
                onClick={() => setClicked(p => ({ ...p, tiktok: true }))}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "center", gap: "10px",
                  padding: "12px 20px",
                  background: clicked.tiktok ? "#166534" : "#010101",
                  color: "#fff",
                  border: clicked.tiktok ? "1.5px solid #4ade80" : "1px solid rgba(255,255,255,0.15)",
                  borderRadius: "12px", textDecoration: "none", fontSize: "14px", fontWeight: "700",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.3)", transition: "background 0.3s",
                }}>
                {clicked.tiktok
                  ? <SvgIcon name="check" size={16} color="#4ade80" strokeWidth={3} />
                  : <SvgIcon name="tiktok" size={16} color="#fff" />}
                تيك توك
              </a>

              {/* زر فيسبوك */}
              <a
                href="https://www.facebook.com/share/1CRMuaVTfz/"
                target="_blank" rel="noreferrer"
                onClick={() => setClicked(p => ({ ...p, facebook: true }))}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "center", gap: "10px",
                  padding: "12px 20px",
                  background: clicked.facebook ? "#166534" : "#1877F2",
                  color: "#fff",
                  border: clicked.facebook ? "1.5px solid #4ade80" : "none",
                  borderRadius: "12px", textDecoration: "none", fontSize: "14px", fontWeight: "700",
                  boxShadow: "0 4px 12px rgba(24,119,242,0.25)", transition: "background 0.3s",
                }}>
                {clicked.facebook
                  ? <SvgIcon name="check" size={16} color="#4ade80" strokeWidth={3} />
                  : <SvgIcon name="facebook" size={16} color="#fff" />}
                فيسبوك
              </a>

              {/* زر مشاركة الرابط */}
              <button
                onClick={async () => {
                  await handleShare();
                  setClicked(p => ({ ...p, share: true }));
                }}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "center", gap: "10px",
                  padding: "12px 20px",
                  background: clicked.share ? "#166534" : "linear-gradient(90deg, #b8862B 0%, #D4A017 100%)",
                  color: "#fff",
                  border: clicked.share ? "1.5px solid #4ade80" : "none",
                  borderRadius: "12px", fontSize: "14px", fontWeight: "700", cursor: "pointer",
                  boxShadow: "0 4px 12px rgba(212,160,23,0.3)", transition: "background 0.3s",
                  fontFamily: "system-ui, -apple-system, sans-serif",
                }}>
                {clicked.share
                  ? <SvgIcon name="check" size={16} color="#4ade80" strokeWidth={3} />
                  : <SvgIcon name="share" size={16} color="#fff" />}
                شارك الرابط
              </button>
            </div>
          </div>

          <div style={{ fontSize: "11px", opacity: 0.4, marginTop: "10px" }}>
            © {new Date().getFullYear()} شقق نوفا الفندقية. جميع الحقوق محفوظة.
          </div>

        </div>
      </div>

      {/* الـ Dialog المنبثق الاحترافي الجديد كبديل لـ Alert التقليدي */}
      {dialog.isOpen && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 9999,
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: "16px", boxSizing: "border-box",
        }}>
          {/* خلفية معتمة بـ Blur خفيف */}
          <div 
            onClick={() => setDialog({ ...dialog, isOpen: false })}
            style={{
              position: "absolute", inset: 0,
              background: "rgba(2, 6, 23, 0.75)",
              backdropFilter: "blur(4px)"
            }} 
          />

          {/* محتوى الديالوق المطور */}
          <div style={{
            position: "relative", width: "100%", maxWidth: "380px",
            background: "linear-gradient(160deg, #05122B 0%, #081B3D 100%)",
            border: `1.5px solid ${dialog.type === 'success' ? '#D4A017' : '#EF4444'}`,
            borderRadius: "20px", padding: "32px 20px 24px", textAlign: "center",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 40px rgba(212,160,23,0.15)",
            boxSizing: "border-box", color: "#fff",
            animation: "popup 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards"
          }}>
            {/* زر الإغلاق X */}
            <button 
              onClick={() => setDialog({ ...dialog, isOpen: false })}
              style={{
                position: "absolute", top: "14px", left: "14px",
                background: "transparent", border: "none", cursor: "pointer",
                color: "rgba(255,255,255,0.4)", display: "flex", padding: "4px"
              }}
            >
              <SvgIcon name="close" size={16} color="currentColor" strokeWidth={2.5} />
            </button>

            {/* الأيقونة العلوية الكبيرة المضيئة */}
            <div style={{
              width: "64px", height: "64px", margin: "0 auto 20px",
              background: dialog.type === 'success' ? 'rgba(212,160,23,0.12)' : 'rgba(239,68,68,0.12)',
              border: `2px solid ${dialog.type === 'success' ? '#D4A017' : '#EF4444'}`,
              borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: `0 0 20px ${dialog.type === 'success' ? 'rgba(212,160,23,0.25)' : 'rgba(239,68,68,0.25)'}`
            }}>
              <SvgIcon 
                name={dialog.type === 'success' ? 'trophy' : 'shield'} 
                size={30} 
                color={dialog.type === 'success' ? '#D4A017' : '#EF4444'} 
              />
            </div>

            {/* عنوان الرسالة */}
            <h4 style={{ 
              margin: "0 0 10px", fontSize: "18px", fontWeight: "800",
              color: dialog.type === 'success' ? '#D4A017' : '#EF4444' 
            }}>
              {dialog.type === 'success' ? ' تم الحفظ' : 'فشل التسجيل'}
            </h4>

            {/* نص الرسالة القادم من الباك إند */}
            <p style={{ 
              margin: "0 0 24px", fontSize: "14px", color: "#cbd5e1", 
              lineHeight: "1.6", fontWeight: "500" 
            }}>
              {dialog.message}
            </p>

            {/* زر المتابعة العريض المريح للإصبع على الهاتف */}
            <button
              onClick={() => setDialog({ ...dialog, isOpen: false })}
              style={{
                width: "100%", padding: "12px",
                background: dialog.type === 'success' ? 'linear-gradient(90deg, #b8862B 0%, #D4A017 100%)' : '#EF4444',
                color: "#fff", border: "none", borderRadius: "12px",
                fontSize: "14px", fontWeight: "700", cursor: "pointer",
                boxShadow: "0 4px 14px rgba(0,0,0,0.2)", transition: "opacity 0.2s"
              }}
            >
              حسناً
            </button>
          </div>
        </div>
      )}

      {/* الـ CSS Animation اللازم لظهور الديالوق بشكل حركي ناعم ومتناسق */}
      <style>{`
        @keyframes popup {
          from { opacity: 0; transform: scale(0.9) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
}