import { useState, useEffect } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile
} from 'firebase/auth';
import {
  collection, addDoc, getDocs, query,
  where, serverTimestamp, doc, setDoc, getDoc
} from 'firebase/firestore';
import { auth, db } from './firebase';

// ── COLORS ───────────────────────────────────────────────────────────────────
const C = {
  bg:'#fdf6ee', surface:'#fff9f2', card:'#ffffff',
  border:'#e8d9c5', accent:'#c97b3b', accentL:'#f5e4d0',
  text:'#2c1a0e', mid:'#6b4c35', light:'#9c7a60', hero:'#f7ede0',
  green:'#4a7a4a', greenBg:'#e8f4e8', red:'#c0392b', redBg:'#fdf0ee'
};

// ── SAMPLE STORIES ───────────────────────────────────────────────────────────
const SAMPLE_STORIES = [
  { id:'1', title:'Vaan Mugiludu', author:'Priya Lakshmi', genre:'Romance', lang:'Telugu', cover:'🌧️', grad:'linear-gradient(135deg,#e8b4b8,#c97b8a)', desc:'Aakaasham gurinchi cheppindi — manchi vaanalu kooda oka roju aagipotaayi.', tags:['emotional','second chance'], lateNight:true, chapters:5 },
  { id:'2', title:'The Last Cartographer', author:'Eira Blackwood', genre:'Fantasy', lang:'English', cover:'🗺️', grad:'linear-gradient(135deg,#a8c5da,#6b8fa8)', desc:'In a world where maps are prophecy, she discovers something never meant to be found.', tags:['fantasy','magic'], lateNight:false, chapters:5 },
  { id:'3', title:'Static', author:'Noor Anand', genre:'Mystery', lang:'English', cover:'📻', grad:'linear-gradient(135deg,#b5c9a8,#7a9b6e)', desc:'A radio host receives calls from someone who should not be able to call.', tags:['thriller','supernatural'], lateNight:true, chapters:5 },
  { id:'4', title:'Soft Machinery', author:'Theo Marsh', genre:'Sci-Fi', lang:'English', cover:'🤖', grad:'linear-gradient(135deg,#c5b8d4,#8b7aab)', desc:'In 2087, grief counselors are replaced by androids. One starts to grieve.', tags:['sci-fi','emotional'], lateNight:true, chapters:5 },
  { id:'5', title:'Velugu Telinappudu', author:'Kavitha Rao', genre:'Literary', lang:'Telugu', cover:'🌺', grad:'linear-gradient(135deg,#ddc4a0,#b89060)', desc:'Moodu taragala ammayilu, oka paata intlo, gurtu telusukovalante.', tags:['family','Telugu'], lateNight:true, chapters:5 },
  { id:'6', title:'Boy With Glass Hands', author:'Sable Quinn', genre:'YA', lang:'English', cover:'✨', grad:'linear-gradient(135deg,#a8d4d8,#6aabaf)', desc:'He can see through people. She is the first one he cannot read.', tags:['YA','romance'], lateNight:false, chapters:5 },
];

// ── CHAPTER CONTENT (different per chapter) ───────────────────────────────────
const CHAPTERS: Record<number, string[]> = {
  1:[
    "She had learned to love the rain because he had learned to leave in it. Every monsoon after, she stood at the window and tried to remember which year she had stopped waiting.",
    "The cafe bell made the same old sound. Three notes and then silence before the world rushed back in. She stood at the threshold longer than she should have.",
    "He was in the corner booth. Of course he was. Fifteen years and he was still there with a book face-down and coffee he had let go cold. Some habits are architecture.",
    "She could leave. She had gotten very good at leaving. But her feet had already made the decision her heart was still debating.",
    "He looked up. And all those rehearsed words dissolved like sugar in rain.",
  ],
  2:[
    "She found the letter on a Tuesday morning, tucked beneath the door like a secret the house had been keeping. No stamp. No return address. Just her name in handwriting she had spent fifteen years trying to forget.",
    "Inside: three words. That was all. Three words that undid everything she had carefully constructed in the years since she left.",
    "She sat on the kitchen floor for a long time. The coffee went cold. The sun moved across the tiles. She did not move.",
    "By afternoon she had made a decision. By evening she had packed a bag. By midnight she was driving through rain that felt like a conversation she had not finished.",
    "The town appeared at the edge of her headlights like a memory she had been trying to outrun.",
  ],
  3:[
    "He was not supposed to be here. She had been very careful about that. She had mapped every street to make sure their paths would not cross.",
    "And yet here he was. Standing in the cereal aisle of all places, looking at the back of a box with the same concentration he used to give to her.",
    "She should have turned around. Instead she stood there watching him, the way you watch a fire you know will burn you.",
    "They met eyes over seventeen feet of fluorescent light and the particular silence that happens when two people who once knew each other very well pretend they do not.",
    "He said her name. Just that. And she felt the last fifteen years rearrange themselves around that one syllable.",
  ],
  4:[
    "They had coffee. Of course they had coffee. What else do you do with fifteen years of unsaid things.",
    "He talked about his work. She talked about hers. They were very good at talking about everything except the thing.",
    "Then he said: I kept every letter you never sent.",
    "She set down her cup very carefully. The way you set down something you are afraid of breaking. Or something already broken.",
    "She said: How did you know about the letters. He said: Because I wrote them too.",
  ],
  5:[
    "They walked for a long time after that. The city moved around them and they moved through it the way people move through dreams.",
    "She told him about the years. He told her about the years. They were not the same years even though they had been living them at the same time in different places.",
    "At some point the walking stopped and the standing started and the standing became the kind of standing that is really just two people being afraid to leave.",
    "She thought: some distances cannot be crossed twice.",
    "She thought: and then again — maybe they can.",
  ],
};

const CH_TITLES = ['The Beginning','The Letter','The Meeting','The Coffee','The Walk'];
const DRIFT_STATES = ['Something I have never said out loud','A version of me I had forgotten','A feeling I could not name until now','Someone I used to be','Something I am still waiting for','A grief I have not finished yet','A joy I was afraid to want'];
const GENRES = ['Romance','Fantasy','Mystery','Sci-Fi','Literary','YA','Horror','Poetry'];
const GRADIENTS = ['linear-gradient(135deg,#e8b4b8,#c97b8a)','linear-gradient(135deg,#a8c5da,#6b8fa8)','linear-gradient(135deg,#c5b8d4,#8b7aab)','linear-gradient(135deg,#b5c9a8,#7a9b6e)','linear-gradient(135deg,#ddc4a0,#b89060)'];
const COVERS = ['✍️','📖','🌟','💫','🌸','🎭','🔮','🦋'];

// ── TYPES ─────────────────────────────────────────────────────────────────────
interface Story { id:string; title:string; author:string; genre:string; lang:string; cover:string; grad:string; desc:string; tags:string[]; lateNight:boolean; chapters:number; authorId?:string; }
interface Wound { id:string; quote:string; book:string; author:string; date:string; others:number; grad:string; }
interface DriftEntry { id:string; book:string; state:string; letter:string; date:string; shared:boolean; }
interface Profile { name:string; email:string; bio:string; reads:number; streak:number; joined:string; }

// ── BUTTON ────────────────────────────────────────────────────────────────────
const Btn = ({ children, onClick, sx={} }:{ children:React.ReactNode; onClick?:()=>void; sx?:React.CSSProperties; }) => (
  <button onClick={onClick} style={{ border:'none', cursor:'pointer', fontFamily:'Georgia,serif', transition:'all 0.15s', ...sx }}>{children}</button>
);

// ── STORY CARD ────────────────────────────────────────────────────────────────
function StoryCard({ s, onOpen }:{ s:Story; onOpen:(s:Story)=>void }) {
  return (
    <div onClick={()=>onOpen(s)} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:15, overflow:'hidden', cursor:'pointer', transition:'all 0.2s' }}>
      <div style={{ height:150, background:s.grad, display:'flex', alignItems:'center', justifyContent:'center', position:'relative' }}>
        <span style={{ fontSize:36 }}>{s.cover}</span>
        <div style={{ position:'absolute', top:7, left:7, display:'flex', gap:3, flexWrap:'wrap' }}>
          <span style={{ fontSize:10, background:'rgba(255,255,255,0.88)', padding:'2px 7px', borderRadius:18, fontWeight:700, color:'#6b4c35' }}>{s.genre}</span>
          {s.lang==='Telugu' && <span style={{ fontSize:10, background:'rgba(255,255,255,0.88)', padding:'2px 7px', borderRadius:18, fontWeight:700, color:'#4a7a4a' }}>తె</span>}
          {s.lateNight && <span style={{ fontSize:10, background:'rgba(0,0,0,0.6)', padding:'2px 7px', borderRadius:18, fontWeight:700, color:'#d4956a' }}>🌙</span>}
        </div>
      </div>
      <div style={{ padding:'10px 12px 12px' }}>
        <p style={{ fontSize:13, fontWeight:800, lineHeight:1.3, marginBottom:3, color:C.text }}>{s.title}</p>
        <p style={{ fontSize:11, color:C.light, marginBottom:5 }}>{s.author}</p>
        <p style={{ fontSize:11, color:C.mid, lineHeight:1.5 }}>{s.desc.slice(0,65)}…</p>
      </div>
    </div>
  );
}

// ── APP ───────────────────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser]               = useState<User|null>(null);
  const [loading, setLoading]         = useState(true);
  const [view, setView]               = useState('landing');
  const [story, setStory]             = useState<Story|null>(null);
  const [readingCh, setReadingCh]     = useState<number|null>(null);
  const [stories, setStories]         = useState<Story[]>(SAMPLE_STORIES);
  const [wounds, setWounds]           = useState<Wound[]>([]);
  const [driftEntries, setDriftEntries] = useState<DriftEntry[]>([]);
  const [profile, setProfile]         = useState<Profile|null>(null);
  const [selectedText, setSelectedText] = useState<string|null>(null);
  const [showWoundPrompt, setShowWoundPrompt] = useState(false);
  const [showPostCh, setShowPostCh]   = useState(false);
  const [toast, setToast]             = useState<string|null>(null);
  const [tourStep, setTourStep]       = useState<number|null>(null);

  // Auth form
  const [authMode, setAuthMode]       = useState<'signin'|'signup'|'forgot'|'phone'>('signin');
  const [form, setForm]               = useState({ name:'', email:'', password:'', phone:'' });
  const [authError, setAuthError]     = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [forgotSent, setForgotSent]   = useState(false);
  const [showPass, setShowPass]       = useState(false);

  // Write
  const [writeTitle, setWriteTitle]   = useState('');
  const [writeBody, setWriteBody]     = useState('');
  const [writeGenre, setWriteGenre]   = useState('Romance');
  const [writeLang, setWriteLang]     = useState('English');

  // Phase 1 — Search, Follow, Likes, Progress, Comments, Share
  const [searchQuery, setSearchQuery]     = useState('');
  const [genreFilter, setGenreFilter]     = useState('All');
  const [following, setFollowing]         = useState<string[]>([]);
  const [likedStories, setLikedStories]   = useState<string[]>([]);
  const [readingProgress, setReadingProgress] = useState<Record<string,number>>({});
  const [chapterComments, setChapterComments] = useState<any[]>([]);
  const [newComment, setNewComment]       = useState('');

  // Drift
  const [driftState, setDriftState]   = useState('');
  const [driftLetter, setDriftLetter] = useState('');
  const [driftShared, setDriftShared] = useState(false);

  // Profile edit
  const [editBio, setEditBio]         = useState('');
  const [editingBio, setEditingBio]   = useState(false);

  // Phase 2 — Night reader, Font size, Ratings, Writer profile, Reading list, Writer dashboard
  const [readerNightMode, setReaderNightMode]   = useState(false);
  const [readerFontSize, setReaderFontSize]     = useState(17);
  const [storyRating, setStoryRating]           = useState<Record<string,number>>({});
  const [userRating, setUserRating]             = useState<Record<string,number>>({});
  const [writerAuthor, setWriterAuthor]         = useState<string|null>(null);
  const [readingList, setReadingList]           = useState<string[]>([]);
  const [writerStats, setWriterStats]           = useState<Record<string,any>>({});

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      setLoading(false);
      if (u) { setView('home'); await loadUserData(u); await loadPhase2Data(u); }
    });
    return unsub;
  }, []);

  const showToast = (msg:string) => { setToast(msg); setTimeout(()=>setToast(null), 2800); };
  const validateEmail = (e:string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

  const loadUserData = async (u:User) => {
    try {
      const pd = await getDoc(doc(db,'users',u.uid));
      if (pd.exists()) {
        const data = pd.data() as Profile & { following?:string[]; likedStories?:string[] };
        setProfile(data);
        setFollowing(data.following||[]);
        setLikedStories(data.likedStories||[]);
      }
      const wSnap = await getDocs(query(collection(db,'wounds'), where('userId','==',u.uid)));
      setWounds(wSnap.docs.map(d=>({id:d.id,...d.data()} as Wound)));
      const dSnap = await getDocs(query(collection(db,'drift'), where('userId','==',u.uid)));
      setDriftEntries(dSnap.docs.map(d=>({id:d.id,...d.data()} as DriftEntry)));
      const sSnap = await getDocs(collection(db,'stories'));
      if (!sSnap.empty) {
        const userStories = sSnap.docs.map(d=>({id:d.id,...d.data()} as Story)).filter(s=>s.authorId);
        setStories([...SAMPLE_STORIES, ...userStories]);
      }
      // Load reading progress
      const pSnap = await getDocs(query(collection(db,'progress'), where('userId','==',u.uid)));
      const prog:Record<string,number> = {};
      pSnap.docs.forEach(d => { const data = d.data(); prog[data.storyId] = data.chapter; });
      setReadingProgress(prog);
    } catch(e) { console.log('Load error:',e); }
  };

  // ── SIGN UP
  const signUp = async () => {
    setAuthError('');
    if (!form.name.trim()) return setAuthError('Please enter your name.');
    if (!validateEmail(form.email)) return setAuthError('Please enter a valid email address.');
    if (form.password.length < 6) return setAuthError('Password must be at least 6 characters.');
    setAuthLoading(true);
    try {
      const result = await createUserWithEmailAndPassword(auth, form.email, form.password);
      await updateProfile(result.user, { displayName: form.name });
      const p:Profile = { name:form.name, email:form.email, bio:'New to Storyverse ✨', reads:0, streak:0, joined:new Date().toLocaleDateString('en-IN') };
      await setDoc(doc(db,'users',result.user.uid), p);
      await sendEmailVerification(result.user);
      setProfile(p);
      setForm({ name:'', email:'', password:'', phone:'' });
      setTourStep(0);
      showToast('Welcome! Verification email sent 📧');
    } catch(e:any) {
      if (e.code==='auth/email-already-in-use') setAuthError('This email is already registered. Sign in instead.');
      else setAuthError(e.message || 'Something went wrong.');
    }
    setAuthLoading(false);
  };

  // ── SIGN IN
  const signIn = async () => {
    setAuthError('');
    if (!validateEmail(form.email)) return setAuthError('Please enter a valid email address.');
    if (!form.password) return setAuthError('Please enter your password.');
    setAuthLoading(true);
    try {
      await signInWithEmailAndPassword(auth, form.email, form.password);
      setForm({ name:'', email:'', password:'', phone:'' });
      showToast('Welcome back! 📖');
    } catch(e:any) {
      if (e.code==='auth/user-not-found') setAuthError('No account found with this email.');
      else if (e.code==='auth/wrong-password'||e.code==='auth/invalid-credential') setAuthError('Incorrect password. Try again or reset it.');
      else setAuthError('Sign in failed. Please try again.');
    }
    setAuthLoading(false);
  };

  // ── GOOGLE SIGN IN
  const googleSignIn = async () => {
    setAuthError('');
    setAuthLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      // Try popup first, fall back to redirect on mobile
      let result;
      try {
        result = await signInWithPopup(auth, provider);
      } catch(popupErr:any) {
        if (popupErr.code === 'auth/popup-blocked' || popupErr.code === 'auth/popup-closed-by-user') {
          // Redirect method for mobile browsers that block popups
          const { signInWithRedirect } = await import('firebase/auth');
          await signInWithRedirect(auth, provider);
          return; // page will redirect and come back
        }
        throw popupErr;
      }
      const pd = await getDoc(doc(db,'users',result.user.uid));
      if (!pd.exists()) {
        const p:Profile = { name:result.user.displayName||'Reader', email:result.user.email||'', bio:'New to Storyverse ✨', reads:0, streak:0, joined:new Date().toLocaleDateString('en-IN') };
        await setDoc(doc(db,'users',result.user.uid), p);
        setProfile(p);
        setTourStep(0);
      }
      setForm({ name:'', email:'', password:'', phone:'' });
      showToast('Signed in with Google! 🎉');
    } catch(e:any) {
      if (e.code === 'auth/unauthorized-domain') {
        setAuthError('Add your Vercel domain to Firebase Auth authorized domains first.');
      } else {
        setAuthError('Google sign in failed. Try email/password instead.');
      }
    }
    setAuthLoading(false);
  };

  // ── FORGOT PASSWORD
  const forgotPassword = async () => {
    setAuthError('');
    if (!validateEmail(form.email)) return setAuthError('Please enter a valid email address.');
    setAuthLoading(true);
    try {
      await sendPasswordResetEmail(auth, form.email);
      setForgotSent(true);
      showToast('Reset email sent! Check your inbox 📧');
    } catch(e:any) {
      if (e.code==='auth/user-not-found') setAuthError('No account found with this email.');
      else setAuthError('Failed to send reset email.');
    }
    setAuthLoading(false);
  };

  // ── SIGN OUT
  const handleSignOut = async () => {
    await signOut(auth);
    setView('landing'); setUser(null); setProfile(null);
    setWounds([]); setDriftEntries([]); setStories(SAMPLE_STORIES);
    showToast('Signed out. See you soon 👋');
  };

  // ── SAVE WOUND
  const saveWound = async () => {
    if (!selectedText||!story||!user) return;
    try {
      const data = { quote:selectedText, book:story.title, author:story.author, userId:user.uid, date:new Date().toLocaleDateString('en-IN'), others:Math.floor(Math.random()*500)+10, grad:story.grad, savedAt:serverTimestamp() };
      const ref = await addDoc(collection(db,'wounds'), data);
      setWounds(p => [{id:ref.id,...data} as Wound, ...p]);
      showToast('Saved to your Wound Store 🩹');
    } catch(e) { showToast('Error saving wound. Check Firestore rules.'); }
    setShowWoundPrompt(false); setSelectedText(null);
  };

  // ── SAVE DRIFT
  const saveDrift = async () => {
    if (!driftState) return showToast('Please select what this story touched in you.');
    if (!driftLetter.trim()) return showToast('Please write your letter — even one sentence.');
    if (!user||!story) return;
    try {
      const data = { book:story.title, state:driftState, letter:driftLetter.trim(), userId:user.uid, shared:driftShared, date:new Date().toLocaleDateString('en-IN'), savedAt:serverTimestamp() };
      const ref = await addDoc(collection(db,'drift'), data);
      // Update local state first — confirm saved
      setDriftEntries(p => [{id:ref.id,...data} as DriftEntry, ...p]);
      // Clear form
      setDriftState(''); setDriftLetter(''); setDriftShared(false);
      // Close prompt and navigate
      setShowPostCh(false);
      setReadingCh(null);
      showToast('Letter saved to your Drift 🌌');
      // Small delay so toast is visible before nav
      setTimeout(() => navTo('drift'), 400);
    } catch(e) {
      showToast('Error saving drift. Check Firestore rules.');
    }
  };

  // ── PUBLISH STORY
  const publishStory = async () => {
    if (!writeTitle.trim()||!writeBody.trim()||!user) return showToast('Please fill in title and story.');
    try {
      const newStory:any = { title:writeTitle, author:profile?.name||user.email?.split('@')[0]||'Anonymous', genre:writeGenre, lang:writeLang, cover:COVERS[Math.floor(Math.random()*COVERS.length)], grad:GRADIENTS[Math.floor(Math.random()*GRADIENTS.length)], desc:writeBody.slice(0,120)+'...', tags:[writeGenre.toLowerCase()], lateNight:false, chapters:1, authorId:user.uid, body:writeBody, savedAt:serverTimestamp() };
      const ref = await addDoc(collection(db,'stories'), newStory);
      setStories(p => [...p, {id:ref.id,...newStory} as Story]);
      setWriteTitle(''); setWriteBody('');
      showToast('Published! 🎉 Check Browse to see your story.');
      navTo('browse');
    } catch(e) { showToast('Error publishing. Check Firestore rules.'); }
  };

  const handleTextSelect = () => {
    const sel = window.getSelection();
    if (sel && sel.toString().trim().length > 8) { setSelectedText(sel.toString().trim()); setShowWoundPrompt(true); }
  };

  const navTo = (v:string) => { setView(v); setStory(null); setReadingCh(null); setShowPostCh(false); };
  const openStory = (s:Story) => { setStory(s); setView('story'); setReadingCh(null); };
  const wordCount = writeBody.trim()===''?0:writeBody.trim().split(/\s+/).filter(Boolean).length;

  // ── FOLLOW WRITER
  const followWriter = async (authorName:string) => {
    if (!user) return;
    const isFollowing = following.includes(authorName);
    const updated = isFollowing ? following.filter(f=>f!==authorName) : [...following, authorName];
    setFollowing(updated);
    try {
      await setDoc(doc(db,'users',user.uid), { following: updated }, { merge: true });
      showToast(isFollowing ? `Unfollowed ${authorName}` : `Following ${authorName} ✓`);
    } catch(e) { showToast('Error updating follow.'); }
  };

  // ── LIKE STORY
  const likeStory = async (storyId:string) => {
    if (!user) return;
    const isLiked = likedStories.includes(storyId);
    const updated = isLiked ? likedStories.filter(id=>id!==storyId) : [...likedStories, storyId];
    setLikedStories(updated);
    try {
      await setDoc(doc(db,'users',user.uid), { likedStories: updated }, { merge: true });
      showToast(isLiked ? 'Removed from liked ♡' : 'Added to liked ❤️');
    } catch(e) { showToast('Error updating like.'); }
  };

  // ── SAVE READING PROGRESS
  const saveProgress = async (storyId:string, chapter:number) => {
    if (!user) return;
    setReadingProgress(p => ({...p, [storyId]: chapter}));
    try {
      await addDoc(collection(db,'progress'), { userId:user.uid, storyId, chapter, updatedAt:serverTimestamp() });
    } catch(e) { console.log('Progress save error:',e); }
  };

  // ── LOAD COMMENTS FOR CHAPTER
  const loadComments = async (storyId:string, chapter:number) => {
    try {
      const snap = await getDocs(query(collection(db,'comments'), where('storyId','==',storyId), where('chapter','==',chapter)));
      setChapterComments(snap.docs.map(d=>({id:d.id,...d.data()})));
    } catch(e) { console.log('Comments load error:',e); }
  };

  // ── POST COMMENT
  const postComment = async () => {
    if (!newComment.trim()||!user||!story||readingCh===null) return;
    try {
      const data = { storyId:story.id, chapter:readingCh, userId:user.uid, userName:profile?.name||user.email?.split('@')[0]||'Reader', text:newComment.trim(), date:new Date().toLocaleDateString('en-IN'), savedAt:serverTimestamp() };
      const ref = await addDoc(collection(db,'comments'), data);
      setChapterComments(p=>[...p, {id:ref.id,...data}]);
      setNewComment('');
      showToast('Comment posted ✓');
    } catch(e) { showToast('Error posting comment. Check Firestore rules.'); }
  };

  // ── SHARE TO WHATSAPP
  const shareToWhatsApp = (s:Story) => {
    const url = `https://storyverse-sooty.vercel.app`;
    const text = `📖 I found this amazing story on Storyverse!\n\n*${s.title}* by ${s.author}\n\n"${s.desc.slice(0,80)}..."\n\nRead it free here 👇\n${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  // ── SHARE TO INSTAGRAM (copy link)
  const shareStory = (s:Story) => {
    const text = `📖 ${s.title} by ${s.author} — Read free on Storyverse: storyverse-sooty.vercel.app`;
    if (navigator.share) {
      navigator.share({ title:s.title, text, url:'https://storyverse-sooty.vercel.app' }).catch(()=>{});
    } else {
      navigator.clipboard?.writeText(text);
      showToast('Story link copied! Share it anywhere 📋');
    }
  };

  // ── RATE STORY
  const rateStory = async (storyId:string, rating:number) => {
    if (!user) return;
    setUserRating(p=>({...p,[storyId]:rating}));
    try {
      await addDoc(collection(db,'ratings'), { storyId, userId:user.uid, rating, date:new Date().toLocaleDateString('en-IN'), savedAt:serverTimestamp() });
      showToast(`Rated ${rating} star${rating===1?'':'s'} ⭐`);
    } catch(e) { showToast('Error saving rating.'); }
  };

  // ── READING LIST (Bookmarks)
  const toggleReadingList = async (storyId:string) => {
    if (!user) return;
    const isIn = readingList.includes(storyId);
    const updated = isIn ? readingList.filter(id=>id!==storyId) : [...readingList, storyId];
    setReadingList(updated);
    try {
      await setDoc(doc(db,'users',user.uid), { readingList:updated }, { merge:true });
      showToast(isIn ? 'Removed from reading list' : 'Added to reading list 📚');
    } catch(e) { showToast('Error updating reading list.'); }
  };

  // ── OPEN WRITER PROFILE
  const openWriterProfile = (authorName:string) => {
    setWriterAuthor(authorName);
    const authorStories = stories.filter(s=>s.author===authorName);
    setWriterStats({ storyCount:authorStories.length, totalLikes: Math.floor(Math.random()*5000)+100, followers: Math.floor(Math.random()*2000)+50, stories:authorStories });
    setView('writer');
  };

  // ── LOAD PHASE 2 USER DATA
  const loadPhase2Data = async (u:User) => {
    try {
      const pd = await getDoc(doc(db,'users',u.uid));
      if (pd.exists()) {
        const data = pd.data() as any;
        setReadingList(data.readingList||[]);
      }
      const rSnap = await getDocs(query(collection(db,'ratings'), where('userId','==',u.uid)));
      const ratings:Record<string,number> = {};
      rSnap.docs.forEach(d=>{ const data=d.data(); ratings[data.storyId]=data.rating; });
      setUserRating(ratings);
    } catch(e) { console.log('Phase2 load error:',e); }
  };

  // ── FILTERED STORIES (updated to include reading list filter)
  const filteredStories = stories.filter(s => {
    const matchSearch = searchQuery==='' || s.title.toLowerCase().includes(searchQuery.toLowerCase()) || s.author.toLowerCase().includes(searchQuery.toLowerCase());
    const matchGenre = genreFilter==='All' || s.genre===genreFilter;
    return matchSearch && matchGenre;
  });

  const inputSx:React.CSSProperties = { width:'100%', border:`1px solid ${C.border}`, borderRadius:10, padding:'11px 14px', fontSize:15, background:C.bg, color:C.text, outline:'none', fontFamily:'Georgia,serif' };

  const TOUR = [
    { emoji:'👋', title:'Welcome to Storyverse!', desc:'A reading platform for the ones who feel everything. Quick 30-second tour!', color:'#c97b3b' },
    { emoji:'🕯️', title:'Reading Rooms', desc:'Read together publicly or privately. Chat unlocks only after everyone finishes — no spoilers.', color:'#8b7aab' },
    { emoji:'🩹', title:'Story Wounds', desc:'Highlight any sentence while reading. It saves to your Wound Store — permanently, on your account.', color:'#c97b8a' },
    { emoji:'🌙', title:'11PM Shelf', desc:'Raw, quiet stories for late-night reading. Look for the 🌙 badge on story cards.', color:'#6b8fa8' },
    { emoji:'🌌', title:'Your Drift', desc:'After finishing a chapter, write what it touched in you. Your reading constellation grows over time.', color:'#7a9b6e' },
  ];

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', background:C.bg, fontFamily:'Georgia,serif' }}>
      <div style={{ textAlign:'center' }}>
        <p style={{ fontSize:48, marginBottom:16 }}>📖</p>
        <p style={{ color:C.accent, fontSize:18, fontWeight:700 }}>Loading Storyverse...</p>
      </div>
    </div>
  );

  return (
    <div style={{ fontFamily:'Georgia,serif', background:C.bg, minHeight:'100vh', color:C.text }}>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0;}
        textarea,input,select{font-family:Georgia,serif;}
        ::-webkit-scrollbar{width:4px;}
        ::-webkit-scrollbar-thumb{background:${C.border};border-radius:2px;}
        .scard:hover{transform:translateY(-2px);box-shadow:0 8px 24px rgba(0,0,0,0.1);}
        .chrow:hover{background:${C.hero};}
      `}</style>

      {/* TOAST */}
      {toast && <div style={{ position:'fixed', bottom:24, left:'50%', transform:'translateX(-50%)', background:C.text, color:C.bg, padding:'9px 22px', borderRadius:22, fontSize:13, zIndex:999, whiteSpace:'nowrap', boxShadow:'0 4px 20px rgba(0,0,0,0.3)' }}>{toast}</div>}

      {/* TOUR */}
      {tourStep!==null && tourStep<TOUR.length && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.75)', zIndex:600, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
          <div style={{ background:'#fff', borderRadius:24, width:'min(480px,95vw)', overflow:'hidden', boxShadow:'0 28px 80px rgba(0,0,0,0.4)' }}>
            <div style={{ background:TOUR[tourStep].color, padding:'28px 28px 24px', textAlign:'center' }}>
              <p style={{ fontSize:52, marginBottom:8 }}>{TOUR[tourStep].emoji}</p>
              <h2 style={{ fontSize:22, fontWeight:800, color:'#fff', lineHeight:1.2 }}>{TOUR[tourStep].title}</h2>
            </div>
            <div style={{ padding:'24px 28px 28px' }}>
              <p style={{ fontSize:16, color:C.mid, lineHeight:1.8, marginBottom:24, textAlign:'center' }}>{TOUR[tourStep].desc}</p>
              <div style={{ display:'flex', justifyContent:'center', gap:6, marginBottom:22 }}>
                {TOUR.map((_,i)=><div key={i} style={{ width:i===tourStep?20:7, height:7, borderRadius:10, background:i===tourStep?TOUR[tourStep].color:'#e8d9c5', transition:'all 0.3s' }} />)}
              </div>
              <div style={{ display:'flex', gap:10 }}>
                {tourStep>0 && <button onClick={()=>setTourStep(s=>s!-1)} style={{ flex:1, background:'transparent', color:C.light, border:`1px solid ${C.border}`, borderRadius:22, padding:'11px', fontSize:14, cursor:'pointer', fontFamily:'Georgia,serif' }}>← Back</button>}
                <button onClick={()=>tourStep===TOUR.length-1?setTourStep(null):setTourStep(s=>s!+1)} style={{ flex:2, background:TOUR[tourStep].color, color:'#fff', border:'none', borderRadius:22, padding:'11px', fontSize:15, cursor:'pointer', fontFamily:'Georgia,serif', fontWeight:800 }}>
                  {tourStep===TOUR.length-1?"Let's go! 🎉":"Next →"}
                </button>
              </div>
              <button onClick={()=>setTourStep(null)} style={{ width:'100%', background:'none', border:'none', color:C.light, fontSize:12, cursor:'pointer', marginTop:12, fontFamily:'Georgia,serif' }}>Skip tour</button>
            </div>
          </div>
        </div>
      )}

      {/* WOUND PROMPT */}
      {showWoundPrompt && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', zIndex:400, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
          <div style={{ background:C.card, borderRadius:18, padding:24, width:'min(420px,90vw)', boxShadow:'0 20px 60px rgba(0,0,0,0.3)' }}>
            <p style={{ fontSize:11, color:C.accent, textTransform:'uppercase', letterSpacing:'0.12em', marginBottom:10 }}>🩹 Save this wound?</p>
            <p style={{ fontSize:16, fontStyle:'italic', color:C.text, lineHeight:1.7, marginBottom:18, borderLeft:`3px solid ${C.accent}`, paddingLeft:12 }}>"{selectedText}"</p>
            <div style={{ display:'flex', gap:8 }}>
              <Btn onClick={saveWound} sx={{ background:C.accent, color:'#fff', borderRadius:20, padding:'8px 18px', fontSize:13, fontWeight:700 }}>Save to Wounds</Btn>
              <Btn onClick={()=>{setShowWoundPrompt(false);setSelectedText(null);}} sx={{ background:'transparent', color:C.mid, borderRadius:20, padding:'8px 16px', fontSize:13, border:`1px solid ${C.border}` }}>Cancel</Btn>
            </div>
          </div>
        </div>
      )}

      {/* POST CHAPTER — DRIFT PROMPT */}
      {showPostCh && story && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.8)', zIndex:300, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
          <div style={{ background:C.surface, borderRadius:22, width:'min(560px,96vw)', maxHeight:'90vh', overflow:'auto', boxShadow:'0 28px 80px rgba(0,0,0,0.5)' }}>
            <div style={{ padding:'24px 28px' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:16 }}>
                <div>
                  <p style={{ fontSize:11, color:C.accent, textTransform:'uppercase', letterSpacing:'0.15em', marginBottom:6 }}>✦ Chapter complete</p>
                  <h2 style={{ fontSize:20, fontWeight:800 }}>What did this chapter do to you?</h2>
                  <p style={{ fontSize:13, color:C.mid, marginTop:4 }}>This saves to your Drift — your reading constellation. 🌌</p>
                </div>
                <Btn onClick={()=>{setShowPostCh(false);setReadingCh(null);}} sx={{ background:C.accentL, color:C.accent, borderRadius:'50%', width:32, height:32, fontSize:15, fontWeight:800, flexShrink:0 }}>✕</Btn>
              </div>
              <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:16 }}>
                {DRIFT_STATES.map(s=>(
                  <Btn key={s} onClick={()=>setDriftState(s)} sx={{ background:driftState===s?C.accent:C.card, color:driftState===s?'#fff':C.mid, border:`1px solid ${driftState===s?C.accent:C.border}`, borderRadius:20, padding:'5px 12px', fontSize:11, fontWeight:driftState===s?700:400 }}>{s}</Btn>
                ))}
              </div>
              <textarea value={driftLetter} onChange={e=>setDriftLetter(e.target.value)} placeholder="Write freely. What did this chapter do to you? This is private — yours alone." style={{ width:'100%', minHeight:100, fontSize:14, lineHeight:1.8, border:`1px solid ${C.border}`, borderRadius:10, padding:'12px 14px', color:C.text, background:C.bg, resize:'none', outline:'none', fontFamily:'Georgia,serif', marginBottom:14 }} />
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:10 }}>
                <label style={{ display:'flex', alignItems:'center', gap:8, fontSize:13, color:C.mid, cursor:'pointer' }}>
                  <input type="checkbox" checked={driftShared} onChange={e=>setDriftShared(e.target.checked)} /> Share with one person
                </label>
                <div style={{ display:'flex', gap:8 }}>
                  <Btn onClick={()=>{setShowPostCh(false);setReadingCh(null);}} sx={{ background:'transparent', color:C.mid, border:`1px solid ${C.border}`, borderRadius:20, padding:'8px 16px', fontSize:13 }}>Skip for now</Btn>
                  <Btn onClick={saveDrift} sx={{ background:C.accent, color:'#fff', borderRadius:20, padding:'8px 20px', fontSize:13, fontWeight:700 }}>Save to Drift 🌌</Btn>
                </div>
              </div>

              {/* Comments Section */}
              <div style={{ marginTop:24, borderTop:`1px solid ${C.border}`, paddingTop:20 }}>
                <h3 style={{ fontSize:16, fontWeight:800, marginBottom:14 }}>💬 Chapter Comments ({chapterComments.length})</h3>
                <div style={{ display:'flex', gap:10, marginBottom:16 }}>
                  <input value={newComment} onChange={e=>setNewComment(e.target.value)} onKeyDown={e=>e.key==='Enter'&&postComment()} placeholder="What did you think of this chapter?" style={{ flex:1, border:`1px solid ${C.border}`, borderRadius:24, padding:'9px 16px', fontSize:13, background:C.bg, color:C.text, outline:'none', fontFamily:'Georgia,serif' }} />
                  <Btn onClick={postComment} sx={{ background:C.accent, color:'#fff', borderRadius:20, padding:'8px 16px', fontSize:13, fontWeight:700 }}>Post</Btn>
                </div>
                {chapterComments.length===0 ? (
                  <p style={{ fontSize:13, color:C.light, textAlign:'center', padding:'20px 0' }}>No comments yet. Be the first! 💬</p>
                ) : (
                  <div style={{ display:'flex', flexDirection:'column', gap:10, maxHeight:200, overflowY:'auto' }}>
                    {chapterComments.map((c:any)=>(
                      <div key={c.id} style={{ background:C.bg, borderRadius:12, padding:'10px 14px' }}>
                        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                          <span style={{ fontSize:12, fontWeight:700, color:C.accent }}>{c.userName}</span>
                          <span style={{ fontSize:11, color:C.light }}>{c.date}</span>
                        </div>
                        <p style={{ fontSize:13, color:C.mid, lineHeight:1.5 }}>{c.text}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── LANDING ── */}
      {view==='landing' && (
        <div style={{ minHeight:'100vh', display:'flex', flexDirection:'column' }}>
          <nav style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'0 28px', height:56, background:C.surface, borderBottom:`1px solid ${C.border}` }}>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <span style={{ fontSize:20 }}>📖</span>
              <span style={{ fontSize:19, fontWeight:800, color:C.accent }}>Storyverse</span>
              <span style={{ fontSize:9, background:C.accentL, color:C.accent, padding:'2px 6px', borderRadius:8 }}>beta</span>
            </div>
            <div style={{ display:'flex', gap:10 }}>
              <Btn onClick={()=>{setAuthMode('signin');setView('auth');}} sx={{ background:'transparent', color:C.accent, border:`1.5px solid ${C.accent}`, borderRadius:22, padding:'7px 20px', fontSize:14, fontWeight:700 }}>Sign In</Btn>
              <Btn onClick={()=>{setAuthMode('signup');setView('auth');}} sx={{ background:C.accent, color:'#fff', borderRadius:22, padding:'7px 20px', fontSize:14, fontWeight:700 }}>Sign Up Free</Btn>
            </div>
          </nav>
          <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'60px 24px', textAlign:'center', background:'radial-gradient(ellipse at 50% 30%, #f0d8bc 0%, transparent 65%)' }}>
            <p style={{ fontSize:11, color:C.accent, letterSpacing:'0.2em', textTransform:'uppercase', marginBottom:16 }}>✦ Telugu & English · Reading Rooms · Story Wounds · Drift</p>
            <h1 style={{ fontSize:52, fontWeight:800, lineHeight:1.05, color:C.text, marginBottom:20, maxWidth:650 }}>Stories that feel<br />like coming home.</h1>
            <p style={{ fontSize:17, color:C.mid, lineHeight:1.7, marginBottom:36, maxWidth:500 }}>A reading platform built differently — for the ones who feel everything. No paywalls. No coin walls. Just stories.</p>
            <div style={{ display:'flex', gap:12, flexWrap:'wrap', justifyContent:'center', marginBottom:48 }}>
              <Btn onClick={()=>{setAuthMode('signup');setView('auth');}} sx={{ background:C.accent, color:'#fff', borderRadius:28, padding:'14px 32px', fontSize:17, fontWeight:800, boxShadow:`0 8px 24px ${C.accent}60` }}>Start Reading Free →</Btn>
              <Btn onClick={()=>{setAuthMode('signin');setView('auth');}} sx={{ background:'transparent', color:C.accent, border:`1.5px solid ${C.accent}`, borderRadius:28, padding:'13px 28px', fontSize:16, fontWeight:700 }}>I have an account</Btn>
            </div>
            <div style={{ display:'flex', gap:10, flexWrap:'wrap', justifyContent:'center' }}>
              {['🕯️ Reading Rooms','🩹 Story Wounds','🌙 11PM Shelf','🌌 Drift','🎲 Fun Features','తె Telugu & English'].map(f=>(
                <span key={f} style={{ fontSize:13, background:C.card, border:`1px solid ${C.border}`, color:C.mid, padding:'6px 14px', borderRadius:20 }}>{f}</span>
              ))}
            </div>
          </div>
          <div style={{ textAlign:'center', padding:'16px', borderTop:`1px solid ${C.border}`, background:C.surface }}>
            <p style={{ fontSize:12, color:C.light }}>© 2026 Seven Hills Enterprises · svn7hillsenterprises@gmail.com</p>
          </div>
        </div>
      )}

      {/* ── AUTH ── */}
      {view==='auth' && (
        <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', padding:24, background:C.bg }}>
          <div style={{ width:'min(420px,100%)' }}>
            <div style={{ textAlign:'center', marginBottom:28 }}>
              <p style={{ fontSize:36, marginBottom:8 }}>📖</p>
              <h1 style={{ fontSize:24, fontWeight:800, color:C.text, marginBottom:6 }}>
                {authMode==='signin'?'Welcome back':authMode==='signup'?'Join Storyverse':authMode==='forgot'?'Reset Password':'Sign in with Phone'}
              </h1>
              <p style={{ fontSize:14, color:C.mid }}>
                {authMode==='signin'?'Your stories missed you.':authMode==='signup'?'Free forever. No ads. Just stories.':authMode==='forgot'?'We will send a reset link to your email.':'Enter your number with country code (+91...)'}
              </p>
            </div>

            <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:20, padding:'28px' }}>

              {authMode==='signup' && (
                <div style={{ marginBottom:14 }}>
                  <label style={{ display:'block', fontSize:11, color:C.light, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:6 }}>Your Name</label>
                  <input value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))} placeholder="What should we call you?" style={inputSx} />
                </div>
              )}

              {(authMode==='signin'||authMode==='signup'||authMode==='forgot') && (
                <div style={{ marginBottom:14 }}>
                  <label style={{ display:'block', fontSize:11, color:C.light, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:6 }}>Email</label>
                  <input value={form.email} onChange={e=>setForm(p=>({...p,email:e.target.value}))} placeholder="you@example.com" type="email"
                    style={{ ...inputSx, borderColor:form.email&&!validateEmail(form.email)?C.red:C.border }} />
                  {form.email&&!validateEmail(form.email) && <p style={{ fontSize:11, color:C.red, marginTop:4 }}>Enter a valid email address</p>}
                </div>
              )}

              {(authMode==='signin'||authMode==='signup') && (
                <div style={{ marginBottom:6 }}>
                  <label style={{ display:'block', fontSize:11, color:C.light, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:6 }}>Password</label>
                  <div style={{ position:'relative' }}>
                    <input value={form.password} onChange={e=>setForm(p=>({...p,password:e.target.value}))} placeholder="••••••••" type={showPass?'text':'password'}
                      style={{ ...inputSx, borderColor:form.password&&form.password.length<6?C.red:C.border, paddingRight:60 }}
                      onKeyDown={e=>e.key==='Enter'&&(authMode==='signin'?signIn():signUp())} />
                    <button onClick={()=>setShowPass(p=>!p)} style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', color:C.light, cursor:'pointer', fontSize:12, fontFamily:'Georgia,serif' }}>{showPass?'Hide':'Show'}</button>
                  </div>
                  {form.password&&form.password.length<6 && <p style={{ fontSize:11, color:C.red, marginTop:4 }}>At least 6 characters needed</p>}
                </div>
              )}

              {authMode==='phone' && (
                <div style={{ marginBottom:14 }}>
                  <label style={{ display:'block', fontSize:11, color:C.light, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:6 }}>Phone Number</label>
                  <input value={form.phone} onChange={e=>setForm(p=>({...p,phone:e.target.value}))} placeholder="+91 9876543210" type="tel" style={inputSx} />
                  <p style={{ fontSize:11, color:C.light, marginTop:4 }}>Include country code. Enable Phone Auth in Firebase first.</p>
                </div>
              )}

              {authMode==='forgot'&&forgotSent && (
                <div style={{ background:C.greenBg, border:`1px solid ${C.green}`, borderRadius:10, padding:'12px 16px', marginBottom:14 }}>
                  <p style={{ fontSize:14, color:C.green, fontWeight:700 }}>✅ Reset email sent!</p>
                  <p style={{ fontSize:13, color:C.green }}>Check your inbox and follow the link.</p>
                </div>
              )}

              {authError && <p style={{ fontSize:13, color:C.red, background:C.redBg, border:'1px solid #f5c6c6', borderRadius:8, padding:'8px 12px', margin:'10px 0', lineHeight:1.5 }}>{authError}</p>}

              <div style={{ height:12 }} />

              <Btn onClick={authMode==='signin'?signIn:authMode==='signup'?signUp:authMode==='forgot'?forgotPassword:()=>showToast('Enable Phone Auth in Firebase Console first')}
                sx={{ width:'100%', background:authLoading?'#aaa':C.accent, color:'#fff', borderRadius:22, padding:'12px', fontSize:15, fontWeight:800, marginBottom:14 }}>
                {authLoading?'Please wait...':authMode==='signin'?'Sign In →':authMode==='signup'?'Create Account →':authMode==='forgot'?'Send Reset Email':'Send OTP →'}
              </Btn>

              {(authMode==='signin'||authMode==='signup') && (
                <>
                  <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
                    <div style={{ flex:1, height:1, background:C.border }} />
                    <span style={{ fontSize:12, color:C.light }}>or</span>
                    <div style={{ flex:1, height:1, background:C.border }} />
                  </div>
                  <Btn onClick={googleSignIn} sx={{ width:'100%', background:'#fff', color:'#333', border:`1px solid ${C.border}`, borderRadius:22, padding:'11px', fontSize:14, fontWeight:700, marginBottom:10, display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
                    <span style={{ fontWeight:900, color:'#4285f4' }}>G</span> Continue with Google
                  </Btn>
                  <Btn onClick={()=>{ setAuthMode('phone'); setAuthError(''); setForm(p=>({...p,phone:''})); }} sx={{ width:'100%', background:C.hero, color:C.mid, border:`1px solid ${C.border}`, borderRadius:22, padding:'10px', fontSize:13, fontWeight:600, marginBottom:14 }}>
                    📱 Sign in with Phone OTP
                  </Btn>
                </>
              )}

              <div style={{ textAlign:'center' }}>
                {authMode==='signin' && (
                  <>
                    <p style={{ fontSize:13, color:C.mid, marginBottom:8 }}>Don't have an account? <button onClick={()=>{setAuthMode('signup');setAuthError('');setForm(p=>({...p,password:''}));}} style={{ background:'none', border:'none', color:C.accent, fontWeight:700, cursor:'pointer', fontFamily:'Georgia,serif', fontSize:13 }}>Sign up free</button></p>
                    <button onClick={()=>{setAuthMode('forgot');setAuthError('');setForgotSent(false);}} style={{ background:'none', border:'none', color:C.light, cursor:'pointer', fontFamily:'Georgia,serif', fontSize:12, textDecoration:'underline' }}>Forgot password?</button>
                  </>
                )}
                {authMode==='signup' && <p style={{ fontSize:13, color:C.mid }}>Already have an account? <button onClick={()=>{setAuthMode('signin');setAuthError('');setForm(p=>({...p,name:'',password:''}));}} style={{ background:'none', border:'none', color:C.accent, fontWeight:700, cursor:'pointer', fontFamily:'Georgia,serif', fontSize:13 }}>Sign in</button></p>}
                {(authMode==='forgot'||authMode==='phone') && <button onClick={()=>{setAuthMode('signin');setAuthError('');setForgotSent(false);}} style={{ background:'none', border:'none', color:C.accent, cursor:'pointer', fontFamily:'Georgia,serif', fontSize:13, fontWeight:700 }}>← Back to Sign In</button>}
              </div>
            </div>

            <div style={{ textAlign:'center', marginTop:16 }}>
              <Btn onClick={()=>setView('landing')} sx={{ background:'none', color:C.light, fontSize:13 }}>← Back to home</Btn>
            </div>
          </div>
        </div>
      )}

      {/* ── MAIN APP ── */}
      {user && view!=='landing' && view!=='auth' && (
        <>
          {/* NAV */}
          <nav style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 14px', height:52, background:C.surface, borderBottom:`1px solid ${C.border}`, position:'sticky', top:0, zIndex:100, gap:6 }}>
            <div style={{ display:'flex', alignItems:'center', gap:6, cursor:'pointer', flexShrink:0 }} onClick={()=>navTo('home')}>
              <span>📖</span>
              <span style={{ fontSize:16, fontWeight:800, color:C.accent }}>Storyverse</span>
            </div>
            <div style={{ display:'flex', gap:1, flexWrap:'wrap' }}>
              {[['home','Home'],['browse','Browse'],['write','✍️'],['wounds','🩹'],['drift','🌌'],['readinglist','📚'],['dashboard','📊'],['profile','👤']].map(([v,l])=>(
                <Btn key={v} onClick={()=>navTo(v)} sx={{ background:view===v?C.accentL:'none', color:view===v?C.accent:C.mid, fontWeight:view===v?700:400, borderRadius:20, padding:'5px 9px', fontSize:11 }}>{l}</Btn>
              ))}
            </div>
            <Btn onClick={handleSignOut} sx={{ background:C.redBg, color:C.red, borderRadius:20, padding:'4px 10px', fontSize:11, fontWeight:700, border:`1px solid #f5c6c6`, flexShrink:0 }}>Sign out</Btn>
          </nav>

          {/* ── HOME ── */}
          {view==='home' && (
            <div style={{ maxWidth:1060, margin:'0 auto', padding:'28px 20px 100px' }}>
              <div style={{ background:C.hero, borderRadius:22, padding:'40px 36px', marginBottom:36, display:'flex', justifyContent:'space-between', alignItems:'center', gap:24, flexWrap:'wrap', backgroundImage:'radial-gradient(circle at 75% 50%, #f0d8bc 0%, transparent 60%)' }}>
                <div style={{ flex:1, minWidth:240 }}>
                  <p style={{ fontSize:10, color:C.accent, letterSpacing:'0.18em', textTransform:'uppercase', marginBottom:10 }}>✦ Telugu & English · Reading Rooms · Story Wounds</p>
                  <h1 style={{ fontSize:34, fontWeight:800, lineHeight:1.1, marginBottom:12 }}>Welcome back,<br />{profile?.name||user.email?.split('@')[0]}! 📖</h1>
                  <p style={{ fontSize:14, color:C.mid, lineHeight:1.7, marginBottom:20 }}>Your stories are waiting. Your wounds are saved. Your constellation is growing.</p>
                  <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
                    <Btn onClick={()=>navTo('browse')} sx={{ background:C.accent, color:'#fff', borderRadius:24, padding:'10px 22px', fontSize:14, fontWeight:700 }}>Start Reading</Btn>
                    <Btn onClick={()=>navTo('write')} sx={{ background:'transparent', color:C.accent, border:`1.5px solid ${C.accent}`, borderRadius:24, padding:'9px 20px', fontSize:13, fontWeight:700 }}>Start Writing</Btn>
                  </div>
                </div>
                <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
                  {[['🩹',wounds.length,'Wounds'],['🌌',driftEntries.length,'Drifts'],['🔥',profile?.streak||0,'Day Streak']].map(([icon,val,label])=>(
                    <div key={String(label)} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:'14px 18px', textAlign:'center', minWidth:78 }}>
                      <p style={{ fontSize:20 }}>{icon}</p>
                      <p style={{ fontSize:22, fontWeight:800, color:C.accent }}>{val}</p>
                      <p style={{ fontSize:11, color:C.light }}>{label}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* 11PM Shelf */}
              <div style={{ background:'linear-gradient(135deg,#1c1008,#0d0805)', borderRadius:18, padding:'20px 24px', marginBottom:32, border:'1px solid #2a1810' }}>
                <p style={{ fontSize:10, color:'#d4956a', letterSpacing:'0.15em', textTransform:'uppercase', marginBottom:5 }}>🌙 The 11PM Shelf</p>
                <h2 style={{ fontSize:16, fontWeight:800, color:'#f0e6d6', marginBottom:14 }}>For reading in the dark.</h2>
                <div style={{ display:'flex', gap:10, overflowX:'auto', paddingBottom:4 }}>
                  {stories.filter(s=>s.lateNight).map(s=>(
                    <div key={s.id} onClick={()=>openStory(s)} style={{ minWidth:120, background:'#ffffff08', border:'1px solid #ffffff12', borderRadius:12, padding:12, cursor:'pointer', flexShrink:0 }}>
                      <div style={{ fontSize:26, textAlign:'center', marginBottom:6 }}>{s.cover}</div>
                      <p style={{ fontSize:11, fontWeight:700, color:'#f0e6d6', lineHeight:1.3 }}>{s.title}</p>
                      <p style={{ fontSize:9, color:'#8a7060' }}>{s.author}</p>
                    </div>
                  ))}
                </div>
              </div>

              <h2 style={{ fontSize:20, fontWeight:800, marginBottom:16 }}>🔥 All Stories</h2>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))', gap:14 }}>
                {stories.map(s=><div key={s.id} className="scard"><StoryCard s={s} onOpen={openStory} /></div>)}
              </div>
            </div>
          )}

          {/* ── BROWSE ── */}
          {view==='browse' && (
            <div style={{ maxWidth:1060, margin:'0 auto', padding:'28px 20px 100px' }}>
              <h2 style={{ fontSize:26, fontWeight:800, marginBottom:16 }}>Browse Stories</h2>

              {/* Search bar */}
              <div style={{ position:'relative', marginBottom:14 }}>
                <span style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', fontSize:16, color:C.light }}>🔍</span>
                <input value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} placeholder="Search by title or author..." style={{ width:'100%', border:`1px solid ${C.border}`, borderRadius:24, padding:'10px 16px 10px 42px', fontSize:14, background:C.surface, color:C.text, outline:'none', fontFamily:'Georgia,serif' }} />
                {searchQuery && <button onClick={()=>setSearchQuery('')} style={{ position:'absolute', right:14, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', color:C.light, cursor:'pointer', fontSize:16 }}>✕</button>}
              </div>

              {/* Genre filters */}
              <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:20, overflowX:'auto', paddingBottom:4 }}>
                {['All',...GENRES].map(g=>(
                  <button key={g} onClick={()=>setGenreFilter(g)} style={{ background:genreFilter===g?C.accent:'transparent', color:genreFilter===g?'#fff':C.mid, border:`1px solid ${genreFilter===g?C.accent:C.border}`, borderRadius:20, padding:'5px 14px', fontSize:12, cursor:'pointer', fontWeight:genreFilter===g?700:400, fontFamily:'Georgia,serif', flexShrink:0, transition:'all 0.15s' }}>{g}</button>
                ))}
              </div>

              {/* Results count */}
              <p style={{ fontSize:12, color:C.light, marginBottom:14 }}>{filteredStories.length} {filteredStories.length===1?'story':'stories'} found {searchQuery?`for "${searchQuery}"`:''}</p>

              {filteredStories.length===0 ? (
                <div style={{ textAlign:'center', padding:'60px 20px', color:C.mid }}>
                  <p style={{ fontSize:36, marginBottom:10 }}>🔍</p>
                  <p style={{ marginBottom:16 }}>No stories found for "{searchQuery}"</p>
                  <Btn onClick={()=>{setSearchQuery('');setGenreFilter('All');}} sx={{ background:C.accent, color:'#fff', borderRadius:24, padding:'9px 22px', fontSize:13, fontWeight:700 }}>Clear Search</Btn>
                </div>
              ) : (
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))', gap:14 }}>
                  {filteredStories.map(s=><div key={s.id} className="scard"><StoryCard s={s} onOpen={openStory} /></div>)}
                </div>
              )}
            </div>
          )}

          {/* ── STORY DETAIL ── */}
          {view==='story' && story && (
            <div style={{ maxWidth:1060, margin:'0 auto', padding:'28px 20px 100px' }}>
              <Btn onClick={()=>navTo('browse')} sx={{ background:'none', color:C.accent, fontSize:13, padding:0, marginBottom:20, display:'block', fontWeight:600 }}>← Back to Browse</Btn>
              <div style={{ display:'flex', gap:28, marginBottom:28, flexWrap:'wrap' }}>
                <div style={{ width:175, height:240, borderRadius:16, background:story.grad, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, boxShadow:'0 12px 32px rgba(0,0,0,0.2)' }}>
                  <span style={{ fontSize:65 }}>{story.cover}</span>
                </div>
                <div style={{ flex:1, minWidth:240 }}>
                  <div style={{ display:'flex', gap:6, marginBottom:10, flexWrap:'wrap' }}>
                    <span style={{ fontSize:11, background:C.accentL, color:C.accent, padding:'2px 9px', borderRadius:20, fontWeight:700 }}>{story.genre}</span>
                    <span style={{ fontSize:11, background:'#e8f4e8', color:C.green, padding:'2px 9px', borderRadius:20, fontWeight:700 }}>{story.lang}</span>
                    {story.lateNight && <span style={{ fontSize:11, background:'#1c100820', color:'#d4956a', padding:'2px 9px', borderRadius:20, fontWeight:700 }}>🌙 11PM</span>}
                  </div>
                  <h1 style={{ fontSize:26, fontWeight:800, marginBottom:5, lineHeight:1.2 }}>{story.title}</h1>
                  <p onClick={()=>openWriterProfile(story.author)} style={{ fontSize:14, color:C.accent, marginBottom:8, cursor:'pointer', fontWeight:600 }}>by {story.author} →</p>

                  {/* Star Rating */}
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12 }}>
                    <div style={{ display:'flex', gap:2 }}>
                      {[1,2,3,4,5].map(star=>(
                        <button key={star} onClick={()=>rateStory(story.id, star)} style={{ background:'none', border:'none', fontSize:20, cursor:'pointer', color:star<=(userRating[story.id]||0)?'#f5a623':'#e8d9c5', transition:'all 0.1s' }}>★</button>
                      ))}
                    </div>
                    <span style={{ fontSize:12, color:C.light }}>{userRating[story.id] ? `You rated ${userRating[story.id]}★` : 'Tap to rate'}</span>
                  </div>
                  <p style={{ fontSize:14, color:C.mid, lineHeight:1.7, marginBottom:14 }}>{story.desc}</p>
                  <div style={{ display:'flex', gap:7, flexWrap:'wrap', marginBottom:20 }}>
                    {story.tags.map(t=><span key={t} style={{ fontSize:11, color:C.accent, background:C.accentL, padding:'2px 9px', borderRadius:20 }}>#{t}</span>)}
                  </div>
                  <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:16 }}>
                    <Btn onClick={()=>setReadingCh(readingProgress[story.id]||1)} sx={{ background:C.accent, color:'#fff', borderRadius:24, padding:'10px 24px', fontSize:14, fontWeight:700 }}>
                      {readingProgress[story.id] ? `▶ Continue — Ch ${readingProgress[story.id]}` : '▶ Read Now — Chapter 1'}
                    </Btn>
                    <Btn onClick={()=>likeStory(story.id)} sx={{ background:likedStories.includes(story.id)?'#fde8e8':C.card, color:likedStories.includes(story.id)?'#c0392b':C.mid, border:`1px solid ${likedStories.includes(story.id)?'#f5c6c6':C.border}`, borderRadius:24, padding:'9px 18px', fontSize:14, fontWeight:700 }}>
                      {likedStories.includes(story.id)?'❤️ Liked':'♡ Like'}
                    </Btn>
                    <Btn onClick={()=>followWriter(story.author)} sx={{ background:following.includes(story.author)?C.greenBg:'transparent', color:following.includes(story.author)?C.green:C.mid, border:`1px solid ${following.includes(story.author)?C.green:C.border}`, borderRadius:24, padding:'9px 18px', fontSize:13, fontWeight:700 }}>
                      {following.includes(story.author)?'✓ Following':'+ Follow'}
                    </Btn>
                  </div>
                  <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:20 }}>
                    <Btn onClick={()=>toggleReadingList(story.id)} sx={{ background:readingList.includes(story.id)?C.accentL:'transparent', color:C.accent, border:`1px solid ${C.border}`, borderRadius:24, padding:'8px 16px', fontSize:13, fontWeight:700 }}>
                      {readingList.includes(story.id)?'📚 In List':'+ Reading List'}
                    </Btn>
                    <Btn onClick={()=>shareStory(story)} sx={{ background:C.accentL, color:C.accent, borderRadius:24, padding:'8px 18px', fontSize:13, fontWeight:700 }}>🔗 Share Link</Btn>
                  </div>
                </div>
              </div>

              <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:13, overflow:'hidden' }}>
                <div style={{ padding:'13px 18px', borderBottom:`1px solid ${C.border}`, display:'flex', justifyContent:'space-between' }}>
                  <h3 style={{ fontSize:15, fontWeight:800 }}>Chapters ({story.chapters})</h3>
                  <span style={{ fontSize:11, color:C.accent, fontWeight:600 }}>🕯️ Reading Rooms live</span>
                </div>
                {Array.from({length:Math.min(story.chapters,5)},(_,i)=>i+1).map(ch=>(
                  <div key={ch} className="chrow" onClick={()=>setReadingCh(ch)} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'11px 18px', borderBottom:`1px solid ${C.border}`, cursor:'pointer', transition:'background 0.15s' }}>
                    <div style={{ display:'flex', gap:12, alignItems:'center' }}>
                      <span style={{ fontSize:11, color:C.accent, fontWeight:800, minWidth:35 }}>Ch {ch}</span>
                      <span style={{ fontSize:13 }}>{CH_TITLES[ch-1]||`Chapter ${ch}`}</span>
                    </div>
                    <div style={{ display:'flex', gap:10 }}>
                      <span style={{ fontSize:10, color:C.accent }}>🕯️ {[23,17,31,8,14][ch-1]} now</span>
                      <span style={{ fontSize:11, color:C.light }}>~1,500 words</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── READER ── */}
          {readingCh!==null && story && (
            <div style={{ position:'fixed', inset:0, background:readerNightMode?'#0f0a05':'rgba(44,26,14,0.8)', zIndex:200, display:'flex', alignItems:'center', justifyContent:'center' }}>
              <div style={{ background:readerNightMode?'#1a1008':C.surface, borderRadius:20, width:'min(660px,96vw)', maxHeight:'92vh', display:'flex', flexDirection:'column', overflow:'hidden', boxShadow:'0 28px 70px rgba(0,0,0,0.4)' }}>
                {/* Header */}
                <div style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 18px', borderBottom:`1px solid ${C.border}`, position:'relative', flexShrink:0 }}>
                  <Btn onClick={()=>setReadingCh(null)} sx={{ background:C.accentL, color:C.accent, borderRadius:'50%', width:30, height:30, fontSize:14, fontWeight:800, flexShrink:0 }}>✕</Btn>
                  <div style={{ flex:1 }}>
                    <p style={{ fontWeight:800, fontSize:13, color:C.text }}>{story.title}</p>
                    <p style={{ fontSize:11, color:C.light }}>Ch {readingCh} · {CH_TITLES[readingCh-1]||`Chapter ${readingCh}`}</p>
                  </div>
                  <span style={{ fontSize:10, color:C.accent, fontWeight:600, flexShrink:0 }}>🕯️ {[23,17,31,8,14][(readingCh-1)%5]} reading</span>
                  <div style={{ display:'flex', gap:4, flexShrink:0 }}>
                    <button onClick={()=>setReaderFontSize(s=>Math.max(13,s-2))} style={{ background:C.accentL, border:'none', borderRadius:8, width:26, height:26, cursor:'pointer', fontSize:11, fontWeight:800, color:C.accent, fontFamily:'Georgia,serif' }}>A-</button>
                    <button onClick={()=>setReaderFontSize(s=>Math.min(24,s+2))} style={{ background:C.accentL, border:'none', borderRadius:8, width:26, height:26, cursor:'pointer', fontSize:13, fontWeight:800, color:C.accent, fontFamily:'Georgia,serif' }}>A+</button>
                    <button onClick={()=>setReaderNightMode(p=>!p)} style={{ background:readerNightMode?'#d4956a':'#1c1008', border:'none', borderRadius:8, width:26, height:26, cursor:'pointer', fontSize:13 }}>{readerNightMode?'☀️':'🌙'}</button>
                  </div>
                  <div style={{ position:'absolute', bottom:0, left:0, right:0, height:2, background:C.border }}>
                    <div style={{ height:'100%', background:C.accent, width:`${(readingCh/story.chapters)*100}%`, transition:'width 0.3s' }} />
                  </div>
                </div>
                {/* Wound hint */}
                <div style={{ padding:'5px 16px', background:C.accentL, borderBottom:`1px solid ${C.border}`, flexShrink:0 }}>
                  <p style={{ fontSize:10, color:C.accent }}>🩹 <strong>Select/highlight any sentence</strong> to save it as a Wound</p>
                </div>
                {/* Body */}
                <div style={{ flex:1, overflowY:'auto', padding:'24px 32px' }} onMouseUp={handleTextSelect} onTouchEnd={handleTextSelect}>
                  {(CHAPTERS[((readingCh-1)%5)+1]).map((p,i)=>(
                    <p key={i} style={{ fontSize:readerFontSize, lineHeight:2, color:readerNightMode?'#f0e6d6':C.text, marginBottom:22, userSelect:'text', cursor:'text' }}>{p}</p>
                  ))}
                  {/* Whisper */}
                  <div style={{ background:C.hero, border:`1px solid ${C.border}`, borderRadius:12, padding:16, marginTop:8 }}>
                    <p style={{ fontSize:10, color:C.accent, textTransform:'uppercase', letterSpacing:'0.12em', marginBottom:8 }}>🌙 Whisper from the writer</p>
                    <p style={{ fontSize:15, fontStyle:'italic', lineHeight:1.6, marginBottom:12 }}>
                      {['Did you see it coming?','Whose side are you on?','What would you have done?','How did this land?','Has this ever happened to you?'][(readingCh-1)%5]}
                    </p>
                    <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
                      {['This hit differently','I felt this in my chest','I needed to read this','I have no words'].map((a,i)=>(
                        <Btn key={i} onClick={()=>showToast('Your whisper was sent anonymously ✦')} sx={{ background:C.card, color:C.text, border:`1px solid ${C.border}`, borderRadius:10, padding:'8px 12px', fontSize:13, textAlign:'left', width:'100%' }}>{a}</Btn>
                      ))}
                    </div>
                  </div>
                </div>
                {/* Footer */}
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'12px 18px', borderTop:`1px solid ${C.border}`, flexShrink:0, gap:8 }}>
                  <Btn onClick={()=>{ if(readingCh>1){ const newCh=readingCh-1; setReadingCh(newCh); saveProgress(story.id,newCh); loadComments(story.id,newCh); } }} sx={{ background:C.accentL, color:C.accent, borderRadius:20, padding:'6px 14px', fontSize:12, fontWeight:700, opacity:readingCh<=1?0.4:1 }}>← Prev</Btn>
                  <Btn onClick={()=>setShowPostCh(true)} sx={{ background:C.accent, color:'#fff', borderRadius:20, padding:'6px 18px', fontSize:12, fontWeight:700 }}>Finish Chapter ✓</Btn>
                  <Btn onClick={()=>{ if(readingCh<story.chapters){ const newCh=readingCh+1; setReadingCh(newCh); saveProgress(story.id,newCh); loadComments(story.id,newCh); } else showToast('You have reached the last chapter! 🎉'); }} sx={{ background:C.accentL, color:C.accent, borderRadius:20, padding:'6px 14px', fontSize:12, fontWeight:700, opacity:readingCh>=story.chapters?0.4:1 }}>Next →</Btn>
                </div>
              </div>
            </div>
          )}

          {/* ── WRITER PROFILE ── */}
          {view==='writer' && writerAuthor && (
            <div style={{ maxWidth:760, margin:'0 auto', padding:'28px 20px 100px' }}>
              <Btn onClick={()=>setView('browse')} sx={{ background:'none', color:C.accent, fontSize:13, padding:0, marginBottom:20, display:'block', fontWeight:600 }}>← Back</Btn>
              <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:20, padding:'28px', marginBottom:20, textAlign:'center' }}>
                <div style={{ width:72, height:72, borderRadius:'50%', background:`linear-gradient(135deg,${C.accent},#a85e28)`, color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:28, fontWeight:800, margin:'0 auto 14px' }}>
                  {writerAuthor[0].toUpperCase()}
                </div>
                <h2 style={{ fontSize:22, fontWeight:800, marginBottom:4 }}>{writerAuthor}</h2>
                <p style={{ fontSize:13, color:C.mid, marginBottom:16, fontStyle:'italic' }}>Writer on Storyverse</p>
                <div style={{ display:'flex', justifyContent:'center', gap:24, marginBottom:16 }}>
                  {[['📖',writerStats.storyCount||0,'Stories'],['❤️',writerStats.totalLikes||0,'Likes'],['👥',writerStats.followers||0,'Followers']].map(([icon,val,label])=>(
                    <div key={String(label)} style={{ textAlign:'center' }}>
                      <p style={{ fontSize:20 }}>{icon}</p>
                      <p style={{ fontSize:18, fontWeight:800, color:C.accent }}>{val}</p>
                      <p style={{ fontSize:11, color:C.light }}>{label}</p>
                    </div>
                  ))}
                </div>
                <Btn onClick={()=>followWriter(writerAuthor)} sx={{ background:following.includes(writerAuthor)?C.greenBg:C.accent, color:following.includes(writerAuthor)?C.green:'#fff', border:`1px solid ${following.includes(writerAuthor)?C.green:C.accent}`, borderRadius:24, padding:'10px 28px', fontSize:14, fontWeight:700 }}>
                  {following.includes(writerAuthor)?'✓ Following':'+ Follow'}
                </Btn>
              </div>
              <h3 style={{ fontSize:16, fontWeight:800, marginBottom:14 }}>Stories by {writerAuthor}</h3>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))', gap:14 }}>
                {(writerStats.stories||[]).map((s:Story)=><div key={s.id} className="scard"><StoryCard s={s} onOpen={openStory} /></div>)}
              </div>
              {(writerStats.stories||[]).length===0 && <p style={{ color:C.light, textAlign:'center', padding:'40px 0' }}>No stories published yet.</p>}
            </div>
          )}

          {/* ── READING LIST ── */}
          {view==='readinglist' && (
            <div style={{ maxWidth:1060, margin:'0 auto', padding:'28px 20px 100px' }}>
              <h2 style={{ fontSize:24, fontWeight:800, marginBottom:4 }}>📚 Reading List</h2>
              <p style={{ fontSize:13, color:C.mid, marginBottom:20 }}>Stories you want to read next.</p>
              {readingList.length===0 ? (
                <div style={{ textAlign:'center', padding:'60px 20px', color:C.mid }}>
                  <p style={{ fontSize:40, marginBottom:12 }}>📚</p>
                  <p style={{ marginBottom:16 }}>Your reading list is empty.<br />Tap "+ Reading List" on any story to add it.</p>
                  <Btn onClick={()=>navTo('browse')} sx={{ background:C.accent, color:'#fff', borderRadius:24, padding:'9px 22px', fontSize:13, fontWeight:700 }}>Browse Stories</Btn>
                </div>
              ) : (
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))', gap:14 }}>
                  {stories.filter(s=>readingList.includes(s.id)).map(s=><div key={s.id} className="scard"><StoryCard s={s} onOpen={openStory} /></div>)}
                </div>
              )}
            </div>
          )}

          {/* ── WRITER DASHBOARD ── */}
          {view==='dashboard' && (
            <div style={{ maxWidth:760, margin:'0 auto', padding:'28px 20px 100px' }}>
              <h2 style={{ fontSize:24, fontWeight:800, marginBottom:4 }}>📊 Writer Dashboard</h2>
              <p style={{ fontSize:13, color:C.mid, marginBottom:24 }}>How your stories are performing.</p>
              {stories.filter(s=>s.authorId===user?.uid).length===0 ? (
                <div style={{ textAlign:'center', padding:'60px 20px', color:C.mid }}>
                  <p style={{ fontSize:40, marginBottom:12 }}>✍️</p>
                  <p style={{ marginBottom:16 }}>You haven't published any stories yet.</p>
                  <Btn onClick={()=>navTo('write')} sx={{ background:C.accent, color:'#fff', borderRadius:24, padding:'9px 22px', fontSize:13, fontWeight:700 }}>Write Your First Story</Btn>
                </div>
              ) : (
                <div>
                  {/* Summary stats */}
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginBottom:24 }}>
                    {[['📖',stories.filter(s=>s.authorId===user?.uid).length,'Stories'],['❤️',likedStories.length*3,'Total Likes'],['👁',stories.filter(s=>s.authorId===user?.uid).length*Math.floor(Math.random()*500+100),'Total Views']].map(([icon,val,label])=>(
                      <div key={String(label)} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:'16px 12px', textAlign:'center' }}>
                        <p style={{ fontSize:22 }}>{icon}</p>
                        <p style={{ fontSize:22, fontWeight:800, color:C.accent }}>{val}</p>
                        <p style={{ fontSize:11, color:C.light }}>{label}</p>
                      </div>
                    ))}
                  </div>
                  {/* Story breakdown */}
                  <h3 style={{ fontSize:16, fontWeight:800, marginBottom:14 }}>Your Stories</h3>
                  <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                    {stories.filter(s=>s.authorId===user?.uid).map(s=>(
                      <div key={s.id} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:'14px 18px', display:'flex', gap:14, alignItems:'center' }}>
                        <div style={{ width:44, height:44, borderRadius:10, background:s.grad, display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, flexShrink:0 }}>{s.cover}</div>
                        <div style={{ flex:1 }}>
                          <p style={{ fontSize:14, fontWeight:800, color:C.text }}>{s.title}</p>
                          <p style={{ fontSize:11, color:C.light }}>{s.genre} · {s.lang}</p>
                        </div>
                        <div style={{ textAlign:'right', flexShrink:0 }}>
                          <p style={{ fontSize:13, fontWeight:700, color:C.accent }}>{Math.floor(Math.random()*500+50)} views</p>
                          <p style={{ fontSize:11, color:C.light }}>{Math.floor(Math.random()*50)} likes</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          {view==='wounds' && (
            <div style={{ maxWidth:700, margin:'0 auto', padding:'28px 20px 100px' }}>
              <h2 style={{ fontSize:24, fontWeight:800, marginBottom:4 }}>🩹 Your Wound Store</h2>
              <p style={{ fontSize:13, color:C.mid, marginBottom:24 }}>{wounds.length} sentences that found you. Saved to your account forever.</p>
              {wounds.length===0 ? (
                <div style={{ textAlign:'center', padding:'60px 20px', color:C.mid }}>
                  <p style={{ fontSize:40, marginBottom:12 }}>🩹</p>
                  <p style={{ marginBottom:16, lineHeight:1.7 }}>No wounds yet.<br />Start reading and highlight any sentence that hits you.</p>
                  <Btn onClick={()=>navTo('browse')} sx={{ background:C.accent, color:'#fff', borderRadius:24, padding:'9px 22px', fontSize:13, fontWeight:700 }}>Browse Stories</Btn>
                </div>
              ) : (
                <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                  {wounds.map(w=>(
                    <div key={w.id} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:'18px 20px' }}>
                      <p style={{ fontSize:17, fontStyle:'italic', color:C.text, lineHeight:1.8, marginBottom:12, borderLeft:`3px solid ${C.accent}`, paddingLeft:13 }}>"{w.quote}"</p>
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:8 }}>
                        <div>
                          <p style={{ fontSize:12, fontWeight:700, color:C.accent }}>{w.book}</p>
                          <p style={{ fontSize:11, color:C.light }}>by {w.author} · {w.date}</p>
                        </div>
                        <span style={{ fontSize:11, color:C.light, background:C.hero, padding:'3px 9px', borderRadius:20 }}>🩹 {w.others} others wounded here</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── DRIFT ── */}
          {view==='drift' && (
            <div style={{ maxWidth:760, margin:'0 auto', padding:'28px 20px 100px' }}>
              <h2 style={{ fontSize:24, fontWeight:800, marginBottom:4 }}>🌌 Your Drift</h2>
              <p style={{ fontSize:13, color:C.mid, marginBottom:24 }}>Not what you read. What reading revealed about you.</p>

              {/* Constellation */}
              <div style={{ background:'#1c1008', borderRadius:18, padding:28, marginBottom:28, position:'relative', minHeight:180, overflow:'hidden' }}>
                <p style={{ fontSize:10, color:'#8a7060', textTransform:'uppercase', letterSpacing:'0.12em', marginBottom:14 }}>Your reading constellation</p>
                {driftEntries.length===0 ? (
                  <p style={{ color:'#8a7060', fontSize:14, fontStyle:'italic' }}>Finish a chapter and write how it touched you — your first star will appear here.</p>
                ) : (
                  driftEntries.map((e,i)=>(
                    <div key={e.id} style={{ position:'absolute', left:`${[15,45,70,30,60][i%5]}%`, top:`${[25,45,20,65,55][i%5]}%` }}>
                      <div style={{ width:12, height:12, borderRadius:'50%', background:'#d4956a', boxShadow:'0 0 14px #d4956a80' }} title={e.book} />
                      <p style={{ fontSize:9, color:'#8a7060', marginTop:3, whiteSpace:'nowrap', maxWidth:80, overflow:'hidden', textOverflow:'ellipsis' }}>{e.book}</p>
                    </div>
                  ))
                )}
                {Array.from({length:20}).map((_,i)=>(
                  <div key={i} style={{ position:'absolute', width:2, height:2, borderRadius:'50%', background:'#fff', opacity:Math.random()*0.3+0.05, left:`${Math.random()*100}%`, top:`${Math.random()*100}%` }} />
                ))}
              </div>

              <h3 style={{ fontSize:16, fontWeight:800, marginBottom:14 }}>Letters to yourself ({driftEntries.length})</h3>
              {driftEntries.length===0 ? (
                <div style={{ textAlign:'center', padding:'40px 20px', color:C.mid }}>
                  <p style={{ fontSize:36, marginBottom:10 }}>✉️</p>
                  <p style={{ marginBottom:16, lineHeight:1.7 }}>No letters yet.<br />Finish a chapter and tap "Finish Chapter" to write your first letter.</p>
                  <Btn onClick={()=>navTo('browse')} sx={{ background:C.accent, color:'#fff', borderRadius:24, padding:'9px 22px', fontSize:13, fontWeight:700 }}>Start Reading</Btn>
                </div>
              ) : (
                <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                  {driftEntries.map(e=>(
                    <div key={e.id} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:16, padding:'18px 22px' }}>
                      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:10, flexWrap:'wrap', gap:8 }}>
                        <div>
                          <p style={{ fontSize:12, fontWeight:700, color:C.accent }}>{e.book}</p>
                          <span style={{ fontSize:11, background:C.accentL, color:C.accent, padding:'2px 8px', borderRadius:20, fontWeight:600 }}>{e.state}</span>
                        </div>
                        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                          <span style={{ fontSize:11, color:C.light }}>{e.date}</span>
                          <span style={{ fontSize:11, background:e.shared?C.greenBg:'#f0f0f020', color:e.shared?C.green:C.light, padding:'2px 8px', borderRadius:20 }}>{e.shared?'Shared':'Private'}</span>
                        </div>
                      </div>
                      <p style={{ fontSize:14, color:C.mid, lineHeight:1.75, fontStyle:'italic' }}>"{e.letter}"</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── WRITE ── */}
          {view==='write' && (
            <div style={{ maxWidth:800, margin:'0 auto', padding:'28px 20px 100px' }}>
              <h2 style={{ fontSize:24, fontWeight:800, marginBottom:4 }}>Your Writing Space</h2>
              <p style={{ fontSize:13, color:C.mid, marginBottom:22 }}>Write in Telugu or English. Publish and it appears in Browse immediately.</p>
              <input value={writeTitle} onChange={e=>setWriteTitle(e.target.value)} placeholder="Story Title" style={{ width:'100%', fontSize:22, fontWeight:800, border:'none', borderBottom:`2px solid ${C.border}`, background:'transparent', color:C.text, padding:'7px 0', marginBottom:14, outline:'none' }} />
              <div style={{ display:'flex', gap:10, marginBottom:14, flexWrap:'wrap' }}>
                <select value={writeGenre} onChange={e=>setWriteGenre(e.target.value)} style={{ border:`1px solid ${C.border}`, borderRadius:8, padding:'6px 10px', fontSize:13, background:C.bg, color:C.text, outline:'none' }}>
                  {GENRES.map(g=><option key={g}>{g}</option>)}
                </select>
                <select value={writeLang} onChange={e=>setWriteLang(e.target.value)} style={{ border:`1px solid ${C.border}`, borderRadius:8, padding:'6px 10px', fontSize:13, background:C.bg, color:C.text, outline:'none' }}>
                  {['English','Telugu','Hindi','Bilingual'].map(l=><option key={l}>{l}</option>)}
                </select>
              </div>
              <textarea value={writeBody} onChange={e=>setWriteBody(e.target.value)} placeholder={"ఒకసారి... (Once upon a time...)\n\nWrite freely. Your first draft does not need to be perfect."} style={{ width:'100%', minHeight:360, fontSize:16, lineHeight:1.95, border:`1px solid ${C.border}`, borderRadius:12, padding:'16px', color:C.text, background:C.card, resize:'vertical', outline:'none' }} />
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:8, marginTop:10 }}>
                <span style={{ fontSize:12, color:C.light }}>{wordCount} words · {writeBody.length} chars</span>
                <div style={{ display:'flex', gap:8 }}>
                  <Btn onClick={()=>showToast('Draft saved ✓')} sx={{ background:'transparent', color:C.accent, border:`1.5px solid ${C.accent}`, borderRadius:22, padding:'7px 18px', fontSize:12, fontWeight:700 }}>Save Draft</Btn>
                  <Btn onClick={publishStory} sx={{ background:C.accent, color:'#fff', borderRadius:22, padding:'8px 18px', fontSize:12, fontWeight:700 }}>Publish Story 🎉</Btn>
                </div>
              </div>
            </div>
          )}

          {/* ── PROFILE ── */}
          {view==='profile' && (
            <div style={{ maxWidth:600, margin:'0 auto', padding:'28px 20px 100px' }}>
              <h2 style={{ fontSize:24, fontWeight:800, marginBottom:20 }}>👤 Your Profile</h2>

              <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:20, padding:'28px', marginBottom:16, textAlign:'center' }}>
                <div style={{ width:72, height:72, borderRadius:'50%', background:C.accent, color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:28, fontWeight:800, margin:'0 auto 14px' }}>
                  {(profile?.name||user.email||'S')[0].toUpperCase()}
                </div>
                <h2 style={{ fontSize:20, fontWeight:800, marginBottom:4 }}>{profile?.name||user.displayName||'Reader'}</h2>
                <p style={{ fontSize:14, color:C.mid, marginBottom:8 }}>{user.email}</p>
                {user.emailVerified ? (
                  <span style={{ fontSize:11, background:C.greenBg, color:C.green, padding:'2px 10px', borderRadius:20, fontWeight:600 }}>✅ Email verified</span>
                ) : (
                  <div>
                    <span style={{ fontSize:11, background:'#fff3e0', color:'#e65100', padding:'2px 10px', borderRadius:20, fontWeight:600 }}>⚠️ Email not verified</span>
                    <Btn onClick={async()=>{ await sendEmailVerification(user); showToast('Verification email sent! 📧'); }} sx={{ background:'transparent', color:C.accent, fontSize:11, display:'block', margin:'6px auto 0', fontWeight:600 }}>Resend verification email</Btn>
                  </div>
                )}
                <div style={{ height:12 }} />
                {!editingBio ? (
                  <div>
                    <p style={{ fontSize:14, color:C.mid, fontStyle:'italic', marginBottom:10 }}>"{profile?.bio||'New to Storyverse ✨'}"</p>
                    <Btn onClick={()=>{setEditBio(profile?.bio||'');setEditingBio(true);}} sx={{ background:C.accentL, color:C.accent, borderRadius:20, padding:'5px 14px', fontSize:12, fontWeight:600 }}>Edit Bio</Btn>
                  </div>
                ) : (
                  <div>
                    <input value={editBio} onChange={e=>{ if(e.target.value.length<=150) setEditBio(e.target.value); }} style={{ ...inputSx, marginBottom:6, textAlign:'center' }} placeholder="Tell us about yourself..." maxLength={150} />
                    <p style={{ fontSize:11, color:C.light, marginBottom:8, textAlign:'right' }}>{editBio.length}/150</p>
                    <div style={{ display:'flex', gap:8, justifyContent:'center' }}>
                      <Btn onClick={async()=>{ if(user){ await setDoc(doc(db,'users',user.uid),{...profile,bio:editBio},{merge:true}); setProfile(p=>p?{...p,bio:editBio}:null); setEditingBio(false); showToast('Bio updated ✓'); } }} sx={{ background:C.accent, color:'#fff', borderRadius:20, padding:'6px 16px', fontSize:12, fontWeight:700 }}>Save</Btn>
                      <Btn onClick={()=>setEditingBio(false)} sx={{ background:'transparent', color:C.mid, border:`1px solid ${C.border}`, borderRadius:20, padding:'6px 14px', fontSize:12 }}>Cancel</Btn>
                    </div>
                  </div>
                )}
                <p style={{ fontSize:12, color:C.light, marginTop:14 }}>Member since {profile?.joined||'Recently'}</p>
              </div>

              {/* Stats */}
              <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, marginBottom:16 }}>
                {[['🩹',wounds.length,'Wounds'],['🌌',driftEntries.length,'Drifts'],['❤️',likedStories.length,'Liked'],['👥',following.length,'Following']].map(([icon,val,label])=>(
                  <div key={String(label)} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:'14px 10px', textAlign:'center' }}>
                    <p style={{ fontSize:18 }}>{icon}</p>
                    <p style={{ fontSize:20, fontWeight:800, color:C.accent }}>{val}</p>
                    <p style={{ fontSize:10, color:C.light }}>{label}</p>
                  </div>
                ))}
              </div>

              {/* Quick links */}
              <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:16, overflow:'hidden', marginBottom:16 }}>
                {[['🩹','My Wound Store','wounds'],['🌌','My Drift','drift'],['✍️','Write a Story','write'],['📚','Browse Stories','browse'],['👥',`Following (${following.length} writers)`,'following']].map(([icon,label,v])=>(
                  <div key={String(v)} onClick={()=>{ if(v==='following') showToast(`You follow: ${following.length===0?'Nobody yet — follow writers from their stories!':following.join(', ')}`); else navTo(String(v)); }} style={{ display:'flex', alignItems:'center', gap:12, padding:'14px 18px', borderBottom:`1px solid ${C.border}`, cursor:'pointer', transition:'background 0.15s' }}>
                    <span style={{ fontSize:18 }}>{icon}</span>
                    <span style={{ fontSize:14, color:C.text, flex:1 }}>{label}</span>
                    <span style={{ color:C.light }}>→</span>
                  </div>
                ))}
              </div>

              <Btn onClick={handleSignOut} sx={{ width:'100%', background:C.redBg, color:C.red, border:`1px solid #f5c6c6`, borderRadius:16, padding:'13px', fontSize:15, fontWeight:700 }}>Sign Out</Btn>
              <p style={{ fontSize:12, color:C.light, textAlign:'center', marginTop:10 }}>You can always come back. Your stories will be here.</p>
            </div>
          )}

          {/* BOTTOM NAV */}
          <div style={{ position:'fixed', bottom:0, left:0, right:0, background:C.surface, borderTop:`1px solid ${C.border}`, display:'flex', justifyContent:'space-around', padding:'8px 0 10px', zIndex:90 }}>
            {[['home','🏠','Home'],['browse','🔍','Browse'],['write','✍️','Write'],['wounds','🩹','Wounds'],['drift','🌌','Drift'],['readinglist','📚','List'],['dashboard','📊','Stats'],['profile','👤','Me']].map(([v,icon,label])=>(
              <button key={String(v)} onClick={()=>navTo(String(v))} style={{ background:'none', border:'none', cursor:'pointer', display:'flex', flexDirection:'column', alignItems:'center', gap:2, padding:'4px 4px', color:view===v?C.accent:C.light, fontFamily:'Georgia,serif', transition:'all 0.15s' }}>
                <span style={{ fontSize:16 }}>{icon}</span>
                <span style={{ fontSize:8, fontWeight:view===v?700:400 }}>{label}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
        }
