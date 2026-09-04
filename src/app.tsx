import { useState, useEffect } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  serverTimestamp
} from 'firebase/firestore';
import { auth, db } from './firebase';

// ── COLORS ────────────────────────────────────────────────────────────────────
const C = {
  bg: '#fdf6ee', surface: '#fff9f2', card: '#ffffff',
  border: '#e8d9c5', accent: '#c97b3b', accentL: '#f5e4d0',
  text: '#2c1a0e', mid: '#6b4c35', light: '#9c7a60', hero: '#f7ede0'
};

// ── DATA ─────────────────────────────────────────────────────────────────────
const STORIES = [
  { id: '1', title: 'Vaan Mugiludu', author: 'Priya Lakshmi', genre: 'Romance', lang: 'Telugu', cover: '🌧️', grad: 'linear-gradient(135deg,#e8b4b8,#c97b8a)', desc: 'Aakaasham gurinchi cheppindi — manchi vaanalu kooda oka roju aagipotaayi.', tags: ['emotional', 'second chance'], lateNight: true },
  { id: '2', title: 'The Last Cartographer', author: 'Eira Blackwood', genre: 'Fantasy', lang: 'English', cover: '🗺️', grad: 'linear-gradient(135deg,#a8c5da,#6b8fa8)', desc: 'In a world where maps are prophecy, she discovers something never meant to be found.', tags: ['fantasy', 'magic'], lateNight: false },
  { id: '3', title: 'Static', author: 'Noor Anand', genre: 'Mystery', lang: 'English', cover: '📻', grad: 'linear-gradient(135deg,#b5c9a8,#7a9b6e)', desc: 'A radio host receives calls from someone who should not be able to call.', tags: ['thriller', 'supernatural'], lateNight: true },
  { id: '4', title: 'Soft Machinery', author: 'Theo Marsh', genre: 'Sci-Fi', lang: 'English', cover: '🤖', grad: 'linear-gradient(135deg,#c5b8d4,#8b7aab)', desc: 'In 2087, grief counselors are replaced by androids. One starts to grieve.', tags: ['sci-fi', 'emotional'], lateNight: true },
  { id: '5', title: 'Velugu Telinappudu', author: 'Kavitha Rao', genre: 'Literary', lang: 'Telugu', cover: '🌺', grad: 'linear-gradient(135deg,#ddc4a0,#b89060)', desc: 'Moodu taragala ammayilu, oka paata intlo, gurtu telusukovalante.', tags: ['family', 'Telugu'], lateNight: true },
  { id: '6', title: 'Boy With Glass Hands', author: 'Sable Quinn', genre: 'YA', lang: 'English', cover: '✨', grad: 'linear-gradient(135deg,#a8d4d8,#6aabaf)', desc: 'He can see through people. She is the first one he cannot read.', tags: ['YA', 'romance'], lateNight: false },
];

const PARAGRAPHS = [
  "She had learned to love the rain because he had learned to leave in it. Every monsoon after, she stood at the window and tried to remember which year she had stopped waiting.",
  "The cafe bell made the same old sound. Three notes and then silence. She stood at the threshold longer than she should have.",
  "He was in the corner booth. Of course he was. Fifteen years and he was still there with a book face-down and coffee he had let go cold. Some habits are architecture.",
  "She could leave. She had gotten very good at leaving. But her feet had already made the decision her heart was still debating.",
  "He looked up. And all those rehearsed words dissolved like sugar in rain.",
];

// ── TYPES ─────────────────────────────────────────────────────────────────────
interface Story {
  id: string; title: string; author: string; genre: string;
  lang: string; cover: string; grad: string; desc: string;
  tags: string[]; lateNight: boolean;
}

interface Wound {
  id: string; quote: string; book: string; author: string;
  date: string; others: number; grad: string;
}

// ── BUTTON ────────────────────────────────────────────────────────────────────
const Btn = ({ children, onClick, sx = {} }: {
  children: React.ReactNode;
  onClick?: () => void;
  sx?: React.CSSProperties;
}) => (
  <button onClick={onClick} style={{
    border: 'none', cursor: 'pointer',
    fontFamily: 'Georgia, serif', transition: 'all 0.15s', ...sx
  }}>{children}</button>
);

// ── STORY CARD ────────────────────────────────────────────────────────────────
function StoryCard({ s, onOpen }: { s: Story; onOpen: (s: Story) => void }) {
  return (
    <div style={{
      background: C.card, border: `1px solid ${C.border}`,
      borderRadius: 15, overflow: 'hidden',
      transition: 'all 0.2s', cursor: 'default'
    }}>
      <div onClick={() => onOpen(s)} style={{
        height: 150, background: s.grad,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', position: 'relative'
      }}>
        <span style={{ fontSize: 36 }}>{s.cover}</span>
        <div style={{ position: 'absolute', top: 7, left: 7, display: 'flex', gap: 3 }}>
          <span style={{ fontSize: 10, background: 'rgba(255,255,255,0.88)', padding: '2px 7px', borderRadius: 18, fontWeight: 700, color: '#6b4c35' }}>{s.genre}</span>
          {s.lang === 'Telugu' && <span style={{ fontSize: 10, background: 'rgba(255,255,255,0.88)', padding: '2px 7px', borderRadius: 18, fontWeight: 700, color: '#4a7a4a' }}>తె</span>}
          {s.lateNight && <span style={{ fontSize: 10, background: 'rgba(0,0,0,0.6)', padding: '2px 7px', borderRadius: 18, fontWeight: 700, color: '#d4956a' }}>🌙</span>}
        </div>
      </div>
      <div style={{ padding: '10px 12px 12px' }}>
        <p onClick={() => onOpen(s)} style={{ fontSize: 13, fontWeight: 800, lineHeight: 1.3, marginBottom: 3, cursor: 'pointer', color: C.text }}>{s.title}</p>
        <p style={{ fontSize: 11, color: C.light, marginBottom: 5 }}>{s.author}</p>
        <p style={{ fontSize: 11, color: C.mid, lineHeight: 1.5 }}>{s.desc.slice(0, 62)}…</p>
      </div>
    </div>
  );
}

// ── APP ───────────────────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser]           = useState<User | null>(null);
  const [loading, setLoading]     = useState(true);
  const [view, setView]           = useState('landing');
  const [story, setStory]         = useState<Story | null>(null);
  const [readingCh, setReadingCh] = useState<number | null>(null);
  const [wounds, setWounds]       = useState<Wound[]>([]);
  const [selectedText, setSelectedText]     = useState<string | null>(null);
  const [showWoundPrompt, setShowWoundPrompt] = useState(false);
  const [toast, setToast]         = useState<string | null>(null);
  const [authMode, setAuthMode]   = useState<'signin' | 'signup'>('signin');
  const [form, setForm]           = useState({ name: '', email: '', password: '' });
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [writeTitle, setWriteTitle] = useState('');
  const [writeBody, setWriteBody]   = useState('');
  const [tourStep, setTourStep]     = useState<number | null>(null);

  // ── Firebase auth listener
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
      if (u) {
        setView('home');
        loadWounds(u.uid);
        if (view === 'auth') setTourStep(0);
      }
    });
    return unsub;
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2600);
  };

  // ── Load wounds from Firestore
  const loadWounds = async (uid: string) => {
    try {
      const q = query(collection(db, 'wounds'), where('userId', '==', uid));
      const snap = await getDocs(q);
      const loaded = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Wound));
      setWounds(loaded);
    } catch (e) {
      console.log('Wound load error:', e);
    }
  };

  // ── Sign Up
  const signUp = async () => {
    setAuthError('');
    if (!form.name.trim()) return setAuthError('Please enter your name.');
    if (!form.email.includes('@')) return setAuthError('Please enter a valid email.');
    if (form.password.length < 6) return setAuthError('Password must be at least 6 characters.');
    setAuthLoading(true);
    try {
      await createUserWithEmailAndPassword(auth, form.email, form.password);
      setTourStep(0);
      showToast('Welcome to Storyverse! 🎉');
    } catch (e: any) {
      setAuthError(e.message || 'Something went wrong.');
    }
    setAuthLoading(false);
  };

  // ── Sign In
  const signIn = async () => {
    setAuthError('');
    setAuthLoading(true);
    try {
      await signInWithEmailAndPassword(auth, form.email, form.password);
      showToast('Welcome back! 📖');
    } catch (e: any) {
      setAuthError('Email or password incorrect.');
    }
    setAuthLoading(false);
  };

  // ── Sign Out
  const handleSignOut = async () => {
    await signOut(auth);
    setView('landing');
    showToast('Signed out. See you soon 👋');
  };

  // ── Save wound to Firestore
  const saveWound = async () => {
    if (!selectedText || !story || !user) return;
    try {
      const data = {
        quote: selectedText,
        book: story.title,
        author: story.author,
        userId: user.uid,
        date: new Date().toLocaleDateString('en-IN'),
        others: Math.floor(Math.random() * 500) + 10,
        grad: story.grad,
        savedAt: serverTimestamp(),
      };
      const ref = await addDoc(collection(db, 'wounds'), data);
      setWounds(p => [{ id: ref.id, ...data } as Wound, ...p]);
      showToast('Saved to your Wound Store 🩹');
    } catch (e) {
      showToast('Error saving. Try again.');
    }
    setShowWoundPrompt(false);
    setSelectedText(null);
  };

  // ── Handle text selection
  const handleTextSelect = () => {
    const sel = window.getSelection();
    if (sel && sel.toString().trim().length > 8) {
      setSelectedText(sel.toString().trim());
      setShowWoundPrompt(true);
    }
  };

  const navTo = (v: string) => { setView(v); setStory(null); setReadingCh(null); };
  const openStory = (s: Story) => { setStory(s); setView('story'); };
  const wordCount = writeBody.trim() === '' ? 0 : writeBody.trim().split(/\s+/).length;

  const inputSx: React.CSSProperties = {
    width: '100%', border: `1px solid ${C.border}`, borderRadius: 10,
    padding: '11px 14px', fontSize: 15, background: C.bg,
    color: C.text, outline: 'none', fontFamily: 'Georgia, serif',
  };

  // ── TOUR STEPS
  const TOUR = [
    { emoji: '👋', title: `Welcome to Storyverse!`, desc: 'You just created a real account. Let us show you what makes this unlike any reading app. 30 seconds.', color: '#c97b3b' },
    { emoji: '🕯️', title: 'Reading Rooms', desc: 'Read with strangers or friends. Chat unlocks only after everyone finishes — no spoilers.', color: '#8b7aab' },
    { emoji: '🩹', title: 'Story Wounds', desc: 'Highlight any sentence that hits you. It saves to your Wound Store — forever, linked to your account.', color: '#c97b8a' },
    { emoji: '🌙', title: '11PM Shelf', desc: 'Raw, quiet stories for late-night reading. Look for the 🌙 badge on story cards.', color: '#6b8fa8' },
    { emoji: '🌌', title: 'Your Drift', desc: 'After finishing a story, write a private letter about what it did to you. Your reading constellation builds over time.', color: '#7a9b6e' },
  ];

  // ── LOADING
  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: C.bg, fontFamily: 'Georgia, serif' }}>
      <div style={{ textAlign: 'center' }}>
        <p style={{ fontSize: 48, marginBottom: 16 }}>📖</p>
        <p style={{ color: C.accent, fontSize: 18, fontWeight: 700 }}>Loading Storyverse...</p>
      </div>
    </div>
  );

  return (
    <div style={{ fontFamily: 'Georgia, serif', background: C.bg, minHeight: '100vh', color: C.text }}>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        textarea, input, select { font-family: Georgia, serif; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: ${C.border}; border-radius: 2px; }
        .scard:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.1); }
      `}</style>

      {/* TOAST */}
      {toast && (
        <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', background: C.text, color: C.bg, padding: '9px 22px', borderRadius: 22, fontSize: 13, zIndex: 999, whiteSpace: 'nowrap', boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}>
          {toast}
        </div>
      )}

      {/* ONBOARDING TOUR */}
      {tourStep !== null && tourStep < TOUR.length && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 24, width: 'min(480px,95vw)', overflow: 'hidden', boxShadow: '0 28px 80px rgba(0,0,0,0.4)' }}>
            <div style={{ background: TOUR[tourStep].color, padding: '28px 28px 24px', textAlign: 'center' }}>
              <p style={{ fontSize: 52, marginBottom: 8 }}>{TOUR[tourStep].emoji}</p>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: '#fff', lineHeight: 1.2 }}>{TOUR[tourStep].title}</h2>
            </div>
            <div style={{ padding: '24px 28px 28px' }}>
              <p style={{ fontSize: 16, color: C.mid, lineHeight: 1.8, marginBottom: 24, textAlign: 'center' }}>{TOUR[tourStep].desc}</p>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 22 }}>
                {TOUR.map((_, i) => (
                  <div key={i} style={{ width: i === tourStep ? 20 : 7, height: 7, borderRadius: 10, background: i === tourStep ? TOUR[tourStep].color : '#e8d9c5', transition: 'all 0.3s' }} />
                ))}
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                {tourStep > 0 && (
                  <button onClick={() => setTourStep(s => s! - 1)} style={{ flex: 1, background: 'transparent', color: C.light, border: `1px solid ${C.border}`, borderRadius: 22, padding: '11px', fontSize: 14, cursor: 'pointer', fontFamily: 'Georgia, serif' }}>← Back</button>
                )}
                <button onClick={() => { if (tourStep === TOUR.length - 1) { setTourStep(null); } else { setTourStep(s => s! + 1); } }}
                  style={{ flex: 2, background: TOUR[tourStep].color, color: '#fff', border: 'none', borderRadius: 22, padding: '11px', fontSize: 15, cursor: 'pointer', fontFamily: 'Georgia, serif', fontWeight: 800 }}>
                  {tourStep === TOUR.length - 1 ? "Let's go! 🎉" : "Next →"}
                </button>
              </div>
              <button onClick={() => setTourStep(null)} style={{ width: '100%', background: 'none', border: 'none', color: C.light, fontSize: 12, cursor: 'pointer', marginTop: 12, fontFamily: 'Georgia, serif' }}>
                Skip tour
              </button>
            </div>
          </div>
        </div>
      )}

      {/* WOUND SAVE PROMPT */}
      {showWoundPrompt && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: C.card, borderRadius: 18, padding: 24, width: 'min(420px,90vw)', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
            <p style={{ fontSize: 11, color: C.accent, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 10 }}>🩹 Save this wound?</p>
            <p style={{ fontSize: 16, fontStyle: 'italic', color: C.text, lineHeight: 1.7, marginBottom: 18, borderLeft: `3px solid ${C.accent}`, paddingLeft: 12 }}>"{selectedText}"</p>
            <div style={{ display: 'flex', gap: 8 }}>
              <Btn onClick={saveWound} sx={{ background: C.accent, color: '#fff', borderRadius: 20, padding: '8px 18px', fontSize: 13, fontWeight: 700 }}>Save to Wounds</Btn>
              <Btn onClick={() => { setShowWoundPrompt(false); setSelectedText(null); }} sx={{ background: 'transparent', color: C.mid, borderRadius: 20, padding: '8px 16px', fontSize: 13, border: `1px solid ${C.border}` }}>Cancel</Btn>
            </div>
          </div>
        </div>
      )}

      {/* ── LANDING ── */}
      {view === 'landing' && (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
          <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 28px', height: 56, background: C.surface, borderBottom: `1px solid ${C.border}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 20 }}>📖</span>
              <span style={{ fontSize: 19, fontWeight: 800, color: C.accent }}>Storyverse</span>
              <span style={{ fontSize: 9, background: C.accentL, color: C.accent, padding: '2px 6px', borderRadius: 8 }}>beta</span>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <Btn onClick={() => { setAuthMode('signin'); setView('auth'); }} sx={{ background: 'transparent', color: C.accent, border: `1.5px solid ${C.accent}`, borderRadius: 22, padding: '7px 20px', fontSize: 14, fontWeight: 700 }}>Sign In</Btn>
              <Btn onClick={() => { setAuthMode('signup'); setView('auth'); }} sx={{ background: C.accent, color: '#fff', borderRadius: 22, padding: '7px 20px', fontSize: 14, fontWeight: 700 }}>Sign Up Free</Btn>
            </div>
          </nav>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 24px', textAlign: 'center', background: 'radial-gradient(ellipse at 50% 30%, #f0d8bc 0%, transparent 65%)' }}>
            <p style={{ fontSize: 11, color: C.accent, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 16 }}>✦ Telugu & English · Reading Rooms · Story Wounds · Drift</p>
            <h1 style={{ fontSize: 52, fontWeight: 800, lineHeight: 1.05, color: C.text, marginBottom: 20, maxWidth: 650 }}>Stories that feel<br />like coming home.</h1>
            <p style={{ fontSize: 17, color: C.mid, lineHeight: 1.7, marginBottom: 36, maxWidth: 500 }}>A reading platform built differently — for the ones who feel everything.</p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 48 }}>
              <Btn onClick={() => { setAuthMode('signup'); setView('auth'); }} sx={{ background: C.accent, color: '#fff', borderRadius: 28, padding: '14px 32px', fontSize: 17, fontWeight: 800, boxShadow: `0 8px 24px ${C.accent}60` }}>Start Reading Free →</Btn>
              <Btn onClick={() => { setAuthMode('signin'); setView('auth'); }} sx={{ background: 'transparent', color: C.accent, border: `1.5px solid ${C.accent}`, borderRadius: 28, padding: '13px 28px', fontSize: 16, fontWeight: 700 }}>I have an account</Btn>
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
              {['🕯️ Reading Rooms', '🩹 Story Wounds', '🌙 11PM Shelf', '🌌 Drift', '🎲 Fun Features', 'తె Telugu & English'].map(f => (
                <span key={f} style={{ fontSize: 13, background: C.card, border: `1px solid ${C.border}`, color: C.mid, padding: '6px 14px', borderRadius: 20 }}>{f}</span>
              ))}
            </div>
          </div>
          <div style={{ textAlign: 'center', padding: '16px', borderTop: `1px solid ${C.border}`, background: C.surface }}>
            <p style={{ fontSize: 12, color: C.light }}>© 2026 Seven Hills Enterprises · svn7hillsenterprises@gmail.com</p>
          </div>
        </div>
      )}

      {/* ── AUTH ── */}
      {view === 'auth' && (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, background: C.bg }}>
          <div style={{ width: 'min(420px,100%)' }}>
            <div style={{ textAlign: 'center', marginBottom: 28 }}>
              <p style={{ fontSize: 36, marginBottom: 8 }}>📖</p>
              <h1 style={{ fontSize: 24, fontWeight: 800, color: C.text, marginBottom: 6 }}>
                {authMode === 'signin' ? 'Welcome back' : 'Join Storyverse'}
              </h1>
              <p style={{ fontSize: 14, color: C.mid }}>
                {authMode === 'signin' ? 'Your stories missed you.' : 'Free forever. No ads. Just stories.'}
              </p>
            </div>
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 20, padding: '28px' }}>
              {authMode === 'signup' && (
                <div style={{ marginBottom: 14 }}>
                  <label style={{ display: 'block', fontSize: 11, color: C.light, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Your Name</label>
                  <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="What should we call you?" style={inputSx} />
                </div>
              )}
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 11, color: C.light, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Email</label>
                <input value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="you@example.com" type="email" style={inputSx} />
              </div>
              <div style={{ marginBottom: 6 }}>
                <label style={{ display: 'block', fontSize: 11, color: C.light, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Password</label>
                <input value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} placeholder="••••••••" type="password" style={inputSx} onKeyDown={e => e.key === 'Enter' && (authMode === 'signin' ? signIn() : signUp())} />
              </div>
              {authError && (
                <p style={{ fontSize: 13, color: '#c0392b', background: '#fdf0ee', border: '1px solid #f5c6c6', borderRadius: 8, padding: '8px 12px', margin: '10px 0', lineHeight: 1.5 }}>{authError}</p>
              )}
              <div style={{ height: 14 }} />
              <Btn onClick={authMode === 'signin' ? signIn : signUp} sx={{ width: '100%', background: authLoading ? '#aaa' : C.accent, color: '#fff', borderRadius: 22, padding: '12px', fontSize: 15, fontWeight: 800, marginBottom: 14 }}>
                {authLoading ? 'Please wait...' : authMode === 'signin' ? 'Sign In →' : 'Create Account →'}
              </Btn>
              <p style={{ fontSize: 13, color: C.mid, textAlign: 'center' }}>
                {authMode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
                <button onClick={() => { setAuthMode(authMode === 'signin' ? 'signup' : 'signin'); setAuthError(''); }}
                  style={{ background: 'none', border: 'none', color: C.accent, fontWeight: 700, cursor: 'pointer', fontFamily: 'Georgia, serif', fontSize: 13 }}>
                  {authMode === 'signin' ? 'Sign up free' : 'Sign in'}
                </button>
              </p>
            </div>
            <div style={{ textAlign: 'center', marginTop: 16 }}>
              <Btn onClick={() => setView('landing')} sx={{ background: 'none', color: C.light, fontSize: 13 }}>← Back to home</Btn>
            </div>
          </div>
        </div>
      )}

      {/* ── MAIN APP (logged in) ── */}
      {user && view !== 'landing' && view !== 'auth' && (
        <>
          {/* NAV */}
          <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 18px', height: 52, background: C.surface, borderBottom: `1px solid ${C.border}`, position: 'sticky', top: 0, zIndex: 100, gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', flexShrink: 0 }} onClick={() => navTo('home')}>
              <span>📖</span>
              <span style={{ fontSize: 17, fontWeight: 800, color: C.accent }}>Storyverse</span>
            </div>
            <div style={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {[['home', 'Home'], ['browse', 'Browse'], ['write', '✍️ Write'], ['wounds', '🩹 Wounds']].map(([v, l]) => (
                <Btn key={v} onClick={() => navTo(v)} sx={{ background: view === v ? C.accentL : 'none', color: view === v ? C.accent : C.mid, fontWeight: view === v ? 700 : 400, borderRadius: 20, padding: '5px 11px', fontSize: 12 }}>{l}</Btn>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
              <div style={{ width: 30, height: 30, borderRadius: '50%', background: C.accent, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 13 }}>
                {user.email?.[0].toUpperCase() || 'S'}
              </div>
              <Btn onClick={handleSignOut} sx={{ background: '#fdf0ee', color: '#c0392b', borderRadius: 20, padding: '4px 10px', fontSize: 11, fontWeight: 700, border: '1px solid #f5c6c6' }}>Sign out</Btn>
            </div>
          </nav>

          {/* ── HOME ── */}
          {view === 'home' && (
            <div style={{ maxWidth: 1060, margin: '0 auto', padding: '28px 20px 100px' }}>
              <div style={{ background: C.hero, borderRadius: 22, padding: '44px 40px', marginBottom: 40, backgroundImage: 'radial-gradient(circle at 75% 50%, #f0d8bc 0%, transparent 60%)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 28, flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 240 }}>
                  <p style={{ fontSize: 11, color: C.accent, letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 10 }}>✦ Telugu & English · Reading Rooms · Story Wounds</p>
                  <h1 style={{ fontSize: 38, fontWeight: 800, lineHeight: 1.1, marginBottom: 14 }}>Stories that feel<br />like coming home.</h1>
                  <p style={{ fontSize: 15, color: C.mid, lineHeight: 1.7, marginBottom: 22, maxWidth: 360 }}>
                    Welcome back, {user.email?.split('@')[0]}! Your stories are waiting.
                  </p>
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    <Btn onClick={() => navTo('browse')} sx={{ background: C.accent, color: '#fff', borderRadius: 24, padding: '10px 22px', fontSize: 14, fontWeight: 700 }}>Start Reading</Btn>
                    <Btn onClick={() => navTo('write')} sx={{ background: 'transparent', color: C.accent, border: `1.5px solid ${C.accent}`, borderRadius: 24, padding: '9px 20px', fontSize: 13, fontWeight: 700 }}>Start Writing</Btn>
                  </div>
                </div>
                <div style={{ position: 'relative', width: 180, height: 190, flexShrink: 0 }}>
                  {STORIES.slice(0, 3).map((s, i) => (
                    <div key={s.id} onClick={() => openStory(s)} style={{ position: 'absolute', width: 106, height: 144, borderRadius: 12, background: s.grad, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 10px 28px rgba(0,0,0,0.2)', padding: 8, transform: `rotate(${[-6, 0, 5][i]}deg)`, zIndex: [1, 3, 2][i], left: [6, 38, 70][i], top: [16, 6, 26][i], transition: 'transform 0.2s' }}>
                      <span style={{ fontSize: 32 }}>{s.cover}</span>
                      <p style={{ fontSize: 9, textAlign: 'center', color: '#222', fontWeight: 700, lineHeight: 1.3, marginTop: 5 }}>{s.title}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* 11PM Shelf */}
              <div style={{ background: 'linear-gradient(135deg,#1c1008,#0d0805)', borderRadius: 18, padding: '22px 26px', marginBottom: 36, border: '1px solid #2a1810' }}>
                <p style={{ fontSize: 10, color: '#d4956a', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 5 }}>🌙 The 11PM Shelf</p>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: '#f0e6d6', marginBottom: 14 }}>For reading in the dark.</h2>
                <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 4 }}>
                  {STORIES.filter(s => s.lateNight).map(s => (
                    <div key={s.id} onClick={() => openStory(s)} style={{ minWidth: 130, background: '#ffffff08', border: '1px solid #ffffff12', borderRadius: 12, padding: 12, cursor: 'pointer', flexShrink: 0, transition: 'all 0.2s' }}>
                      <div style={{ fontSize: 28, textAlign: 'center', marginBottom: 7 }}>{s.cover}</div>
                      <p style={{ fontSize: 12, fontWeight: 700, color: '#f0e6d6', lineHeight: 1.3, marginBottom: 3 }}>{s.title}</p>
                      <p style={{ fontSize: 10, color: '#8a7060' }}>{s.author}</p>
                    </div>
                  ))}
                </div>
              </div>

              <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 16 }}>🔥 All Stories</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(188px,1fr))', gap: 14 }}>
                {STORIES.map(s => <div key={s.id} className="scard"><StoryCard s={s} onOpen={openStory} /></div>)}
              </div>
            </div>
          )}

          {/* ── BROWSE ── */}
          {view === 'browse' && (
            <div style={{ maxWidth: 1060, margin: '0 auto', padding: '28px 20px 100px' }}>
              <h2 style={{ fontSize: 26, fontWeight: 800, marginBottom: 20 }}>Browse Stories</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(188px,1fr))', gap: 14 }}>
                {STORIES.map(s => <div key={s.id} className="scard"><StoryCard s={s} onOpen={openStory} /></div>)}
              </div>
            </div>
          )}

          {/* ── STORY DETAIL ── */}
          {view === 'story' && story && (
            <div style={{ maxWidth: 1060, margin: '0 auto', padding: '28px 20px 100px' }}>
              <Btn onClick={() => navTo('browse')} sx={{ background: 'none', color: C.accent, fontSize: 13, padding: 0, marginBottom: 20, display: 'block', fontWeight: 600 }}>← Back to Browse</Btn>
              <div style={{ display: 'flex', gap: 28, marginBottom: 28, flexWrap: 'wrap' }}>
                <div style={{ width: 175, height: 240, borderRadius: 16, background: story.grad, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 12px 32px rgba(0,0,0,0.2)' }}>
                  <span style={{ fontSize: 65 }}>{story.cover}</span>
                </div>
                <div style={{ flex: 1, minWidth: 240 }}>
                  <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
                    <span style={{ fontSize: 11, background: C.accentL, color: C.accent, padding: '2px 9px', borderRadius: 20, fontWeight: 700 }}>{story.genre}</span>
                    <span style={{ fontSize: 11, background: '#e8f4e8', color: '#4a7a4a', padding: '2px 9px', borderRadius: 20, fontWeight: 700 }}>{story.lang}</span>
                    {story.lateNight && <span style={{ fontSize: 11, background: '#1c100820', color: '#d4956a', padding: '2px 9px', borderRadius: 20, fontWeight: 700 }}>🌙 11PM</span>}
                  </div>
                  <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 5, lineHeight: 1.2 }}>{story.title}</h1>
                  <p style={{ fontSize: 14, color: C.mid, marginBottom: 12 }}>by {story.author}</p>
                  <p style={{ fontSize: 14, color: C.mid, lineHeight: 1.7, marginBottom: 14 }}>{story.desc}</p>
                  <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginBottom: 20 }}>
                    {story.tags.map(t => <span key={t} style={{ fontSize: 11, color: C.accent, background: C.accentL, padding: '2px 9px', borderRadius: 20 }}>#{t}</span>)}
                  </div>
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    <Btn onClick={() => setReadingCh(1)} sx={{ background: C.accent, color: '#fff', borderRadius: 24, padding: '10px 24px', fontSize: 14, fontWeight: 700 }}>▶ Read Now</Btn>
                    <Btn onClick={() => setReadingCh(2)} sx={{ background: '#1c100820', color: '#d4956a', border: '1px solid #d4956a40', borderRadius: 24, padding: '10px 18px', fontSize: 13, fontWeight: 700 }}>🕯️ Join Room</Btn>
                  </div>
                </div>
              </div>

              {/* Chapter List */}
              <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 13, overflow: 'hidden' }}>
                <div style={{ padding: '13px 18px', borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between' }}>
                  <h3 style={{ fontSize: 15, fontWeight: 800 }}>Chapters</h3>
                  <span style={{ fontSize: 11, color: C.accent, fontWeight: 600 }}>🕯️ Reading Rooms live</span>
                </div>
                {[1, 2, 3, 4, 5].map(ch => (
                  <div key={ch} onClick={() => setReadingCh(ch)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '11px 18px', borderBottom: `1px solid ${C.border}`, cursor: 'pointer', transition: 'background 0.15s' }}>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                      <span style={{ fontSize: 11, color: C.accent, fontWeight: 800, minWidth: 35 }}>Ch {ch}</span>
                      <span style={{ fontSize: 13 }}>Chapter {ch}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 10 }}>
                      <span style={{ fontSize: 10, color: C.accent }}>🕯️ {[23, 17, 31, 8, 14][ch - 1]} now</span>
                      <span style={{ fontSize: 11, color: C.light }}>~2,000 words</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── READER ── */}
          {readingCh !== null && story && (
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(44,26,14,0.8)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ background: C.surface, borderRadius: 20, width: 'min(660px,96vw)', maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 28px 70px rgba(0,0,0,0.4)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 18px', borderBottom: `1px solid ${C.border}`, position: 'relative' }}>
                  <Btn onClick={() => setReadingCh(null)} sx={{ background: C.accentL, color: C.accent, borderRadius: '50%', width: 30, height: 30, fontSize: 14, fontWeight: 800, flexShrink: 0 }}>✕</Btn>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: 800, fontSize: 13, color: C.text }}>{story.title}</p>
                    <p style={{ fontSize: 11, color: C.light }}>Chapter {readingCh}</p>
                  </div>
                  <div style={{ background: `${C.accent}20`, padding: '3px 8px', borderRadius: 20, fontSize: 10, color: C.accent, fontWeight: 600 }}>🕯️ {[23, 17, 31, 8, 14][(readingCh - 1) % 5]} reading now</div>
                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, background: C.border }}>
                    <div style={{ height: '100%', background: C.accent, width: `${(readingCh / 5) * 100}%`, transition: 'width 0.3s' }} />
                  </div>
                </div>
                <div style={{ padding: '5px 16px', background: C.accentL, borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
                  <p style={{ fontSize: 10, color: C.accent }}>🩹 <strong>Select/highlight any sentence</strong> to save it as a Wound to your account</p>
                </div>
                <div style={{ flex: 1, overflowY: 'auto', padding: '24px 32px' }} onMouseUp={handleTextSelect} onTouchEnd={handleTextSelect}>
                  {PARAGRAPHS.map((p, i) => (
                    <p key={i} style={{ fontSize: 17, lineHeight: 2, color: C.text, marginBottom: 22, userSelect: 'text', cursor: 'text' }}>{p}</p>
                  ))}
                  {/* Whisper Question */}
                  <div style={{ background: C.hero, border: `1px solid ${C.border}`, borderRadius: 12, padding: 16, marginTop: 8 }}>
                    <p style={{ fontSize: 10, color: C.accent, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 8 }}>🌙 Whisper from the writer</p>
                    <p style={{ fontSize: 15, fontStyle: 'italic', lineHeight: 1.6, marginBottom: 12 }}>"Did you see it coming?"</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                      {['Not at all — I gasped', 'I had a feeling', 'Yes, from the first line', 'Still processing'].map((a, i) => (
                        <Btn key={i} onClick={() => showToast('Your whisper was sent anonymously ✦')} sx={{ background: C.card, color: C.text, border: `1px solid ${C.border}`, borderRadius: 10, padding: '8px 12px', fontSize: 13, textAlign: 'left', width: '100%' }}>{a}</Btn>
                      ))}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 18px', borderTop: `1px solid ${C.border}` }}>
                  <Btn onClick={() => setReadingCh(r => Math.max(1, r! - 1))} sx={{ background: C.accentL, color: C.accent, borderRadius: 20, padding: '6px 14px', fontSize: 12, fontWeight: 700, opacity: readingCh <= 1 ? 0.4 : 1 }}>← Prev</Btn>
                  <Btn onClick={() => { showToast('Chapter complete! 🎉'); setReadingCh(null); }} sx={{ background: C.accent, color: '#fff', borderRadius: 20, padding: '6px 18px', fontSize: 12, fontWeight: 700 }}>Finish Chapter ✓</Btn>
                  <Btn onClick={() => setReadingCh(r => r! + 1)} sx={{ background: C.accentL, color: C.accent, borderRadius: 20, padding: '6px 14px', fontSize: 12, fontWeight: 700 }}>Next →</Btn>
                </div>
              </div>
            </div>
          )}

          {/* ── WOUNDS ── */}
          {view === 'wounds' && (
            <div style={{ maxWidth: 700, margin: '0 auto', padding: '28px 20px 100px' }}>
              <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 4 }}>🩹 Your Wound Store</h2>
              <p style={{ fontSize: 13, color: C.mid, marginBottom: 24 }}>Sentences that found you. Saved to your account. Yours forever.</p>
              {wounds.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 20px', color: C.mid }}>
                  <p style={{ fontSize: 40, marginBottom: 12 }}>🩹</p>
                  <p style={{ marginBottom: 16, lineHeight: 1.7 }}>No wounds yet.<br />Start reading and highlight any sentence that hits you.</p>
                  <Btn onClick={() => navTo('browse')} sx={{ background: C.accent, color: '#fff', borderRadius: 24, padding: '9px 22px', fontSize: 13, fontWeight: 700 }}>Browse Stories</Btn>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {wounds.map(w => (
                    <div key={w.id} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: '18px 20px' }}>
                      <p style={{ fontSize: 17, fontStyle: 'italic', color: C.text, lineHeight: 1.8, marginBottom: 12, borderLeft: `3px solid ${C.accent}`, paddingLeft: 13 }}>"{w.quote}"</p>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                        <div>
                          <p style={{ fontSize: 12, fontWeight: 700, color: C.accent }}>{w.book}</p>
                          <p style={{ fontSize: 11, color: C.light }}>by {w.author} · {w.date}</p>
                        </div>
                        <span style={{ fontSize: 11, color: C.light, background: C.hero, padding: '3px 9px', borderRadius: 20 }}>🩹 {w.others} others wounded here</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── WRITE ── */}
          {view === 'write' && (
            <div style={{ maxWidth: 800, margin: '0 auto', padding: '28px 20px 100px' }}>
              <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 4 }}>Your Writing Space</h2>
              <p style={{ fontSize: 13, color: C.mid, marginBottom: 22 }}>Write in Telugu or English. Your story, your voice.</p>
              <input value={writeTitle} onChange={e => setWriteTitle(e.target.value)} placeholder="Story Title" style={{ width: '100%', fontSize: 22, fontWeight: 800, border: 'none', borderBottom: `2px solid ${C.border}`, background: 'transparent', color: C.text, padding: '7px 0', marginBottom: 14, outline: 'none' }} />
              <textarea value={writeBody} onChange={e => setWriteBody(e.target.value)}
                placeholder={"ఒకసారి... (Once upon a time...)\n\nWrite freely. Your first draft does not have to be perfect."}
                style={{ width: '100%', minHeight: 360, fontSize: 16, lineHeight: 1.95, border: `1px solid ${C.border}`, borderRadius: 12, padding: '16px', color: C.text, background: C.card, resize: 'vertical', outline: 'none' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginTop: 10 }}>
                <span style={{ fontSize: 12, color: C.light }}>{wordCount} words · {writeBody.length} chars</span>
                <div style={{ display: 'flex', gap: 8 }}>
                  <Btn onClick={() => showToast('Draft saved ✓')} sx={{ background: 'transparent', color: C.accent, border: `1.5px solid ${C.accent}`, borderRadius: 22, padding: '7px 18px', fontSize: 12, fontWeight: 700 }}>Save Draft</Btn>
                  <Btn onClick={() => { if (!writeBody.trim()) return showToast('Write something first!'); showToast('Chapter published! 🎉'); setWriteTitle(''); setWriteBody(''); }}
                    sx={{ background: C.accent, color: '#fff', borderRadius: 22, padding: '8px 18px', fontSize: 12, fontWeight: 700 }}>Publish Chapter</Btn>
                </div>
              </div>
            </div>
          )}

          {/* BOTTOM NAV */}
          <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: C.surface, borderTop: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-around', padding: '8px 0 10px', zIndex: 90 }}>
            {[['home', '🏠', 'Home'], ['browse', '🔍', 'Browse'], ['write', '✍️', 'Write'], ['wounds', '🩹', 'Wounds']].map(([v, icon, label]) => (
              <button key={v} onClick={() => navTo(v)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, padding: '4px 8px', color: view === v ? C.accent : C.light, fontFamily: 'Georgia, serif', transition: 'all 0.15s' }}>
                <span style={{ fontSize: 18 }}>{icon}</span>
                <span style={{ fontSize: 9, fontWeight: view === v ? 700 : 400 }}>{label}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

