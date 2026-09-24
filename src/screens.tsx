import { useRef } from 'react';
import { sendEmailVerification } from 'firebase/auth';
import { auth } from './firebase';
import { C, GENRES, DRIFT_STATES, ROULETTE_OPENINGS, Story } from './types';

// ── BUTTON ────────────────────────────────────────────────────────────────────
const Btn = ({ children, onClick, sx = {} }: { children: React.ReactNode; onClick?: () => void; sx?: React.CSSProperties }) => (
  <button onClick={onClick} style={{ border: 'none', cursor: 'pointer', fontFamily: 'Georgia,serif', transition: 'all 0.15s', ...sx }}>{children}</button>
);

// ── STAR RATING ───────────────────────────────────────────────────────────────
function StarRating({ storyId, rating, onRate }: { storyId: string; rating: number; onRate: (id: string, r: number) => void }) {
  return (
    <div style={{ display: 'flex', gap: 2 }}>
      {[1, 2, 3, 4, 5].map(star => (
        <button key={star} onClick={() => onRate(storyId, star)}
          style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: star <= rating ? '#f5a623' : '#e8d9c5', padding: '0 1px' }}>★</button>
      ))}
    </div>
  );
}

// ── STORY CARD ────────────────────────────────────────────────────────────────
function StoryCard({ s, onOpen }: { s: Story; onOpen: (s: Story) => void }) {
  return (
    <div onClick={() => onOpen(s)} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 15, overflow: 'hidden', cursor: 'pointer', transition: 'all 0.2s' }}>
      <div style={{ height: 150, background: s.grad, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
        <span style={{ fontSize: 36 }}>{s.cover}</span>
        <div style={{ position: 'absolute', top: 7, left: 7, display: 'flex', gap: 3, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 10, background: 'rgba(255,255,255,0.88)', padding: '2px 7px', borderRadius: 18, fontWeight: 700, color: '#6b4c35' }}>{s.genre}</span>
          {s.lang === 'Telugu' && <span style={{ fontSize: 10, background: 'rgba(255,255,255,0.88)', padding: '2px 7px', borderRadius: 18, fontWeight: 700, color: '#4a7a4a' }}>తె</span>}
          {s.lateNight && <span style={{ fontSize: 10, background: 'rgba(0,0,0,0.6)', padding: '2px 7px', borderRadius: 18, fontWeight: 700, color: '#d4956a' }}>🌙</span>}
        </div>
        {s.reads && <span style={{ position: 'absolute', bottom: 6, right: 8, fontSize: 10, color: 'rgba(255,255,255,0.8)', fontWeight: 600 }}>👁 {s.reads}</span>}
      </div>
      <div style={{ padding: '10px 12px 12px' }}>
        <p style={{ fontSize: 13, fontWeight: 800, lineHeight: 1.3, marginBottom: 3, color: C.text }}>{s.title}</p>
        <p style={{ fontSize: 11, color: C.light, marginBottom: 5 }}>{s.author}</p>
        <p style={{ fontSize: 11, color: C.mid, lineHeight: 1.5 }}>{s.desc.slice(0, 65)}…</p>
      </div>
    </div>
  );
}

// ── SCREENS COMPONENT ─────────────────────────────────────────────────────────
export function Screens({ state, actions, readerBodyRef, authMode, validateEmail }: {
  state: any; actions: any; readerBodyRef: React.RefObject<HTMLDivElement>;
  authMode: string; validateEmail: (e: string) => boolean;
}) {
  const { user, profile, stories, wounds, driftEntries, following, likedStories, readingList,
    readingProgress, userRatings, view, story, readingCh, roomReaderCount, roomMessages,
    chapterComments, toast, tourStep, showWoundPrompt, selectedText, showPostCh,
    draftBody, draftTitle, draftGenre, draftLang, readerFontSize, readerNightMode,
    searchQuery, genreFilter, rouletteIdx, rouletteTimer, writerAuthor, driftState,
    driftLetter, driftShared, newComment, roomMsg, editBio, editingBio, editUsername,
    editingUsername, form, authError, authLoading, forgotSent, showPass, isNewStory,
    filteredStories, wordCount } = state;

  const { setView, setTourStep, setShowWoundPrompt, setSelectedText, setShowPostCh,
    setDraftBody, setDraftTitle, setDraftGenre, setDraftLang, setReaderFontSize,
    setReaderNightMode, setSearchQuery, setGenreFilter, setWriterAuthor, setDriftState,
    setDriftLetter, setDriftShared, setNewComment, setRoomMsg, setEditBio, setEditingBio,
    setEditUsername, setEditingUsername, setAuthMode, setForm, setAuthError, setForgotSent,
    setShowPass, setIsNewStory, setReadingCh, setStory,
    saveWound, saveDrift, publishStory, followWriter, likeStory, toggleReadingList,
    saveProgress, loadComments, postComment, rateStory, sendRoomMessage, saveBio,
    saveUsername, shareToWhatsApp, shareStory, spinRoulette, openStory, navTo,
    showToast, handleSignOut, signUp, signIn, googleSignIn, forgotPassword,
    getArchetype, getChapterContent } = actions;

  const inputSx: React.CSSProperties = { width: '100%', border: `1px solid ${C.border}`, borderRadius: 10, padding: '11px 14px', fontSize: 15, background: C.bg, color: C.text, outline: 'none', fontFamily: 'Georgia,serif' };

  const TOUR = [
    { emoji: '👋', title: 'Welcome to Storyverse!', desc: 'A reading platform for the ones who feel everything. 8 curated stories, real-time reading rooms, and features no other app has.', color: '#c97b3b' },
    { emoji: '🩹', title: 'Story Wounds', desc: 'Highlight any sentence while reading. It saves to your Wound Store permanently. Turn it into a beautiful postcard to share.', color: '#c97b8a' },
    { emoji: '🕯️', title: 'Reading Rooms', desc: 'Read with others in real-time. See who is in the room with you. Chat opens live as you read.', color: '#8b7aab' },
    { emoji: '🌙', title: 'The 11PM Shelf', desc: 'Raw, quiet stories for late-night reading. Look for the 🌙 badge on story cards.', color: '#6b8fa8' },
    { emoji: '🌌', title: 'Your Drift', desc: 'After finishing a chapter, write what it touched in you. Your reading constellation grows over time.', color: '#7a9b6e' },
  ];

  return (
    <div style={{ fontFamily: 'Georgia,serif', background: C.bg, minHeight: '100vh', color: C.text }}>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        textarea, input, select { font-family: Georgia, serif; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: ${C.border}; border-radius: 2px; }
        .scard:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.1); }
        .chrow:hover { background: ${C.hero}; }
      `}</style>

      {/* TOAST */}
      {toast && <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', background: C.text, color: C.bg, padding: '9px 22px', borderRadius: 22, fontSize: 13, zIndex: 999, whiteSpace: 'nowrap', boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}>{toast}</div>}

      {/* ONBOARDING TOUR */}
      {tourStep !== null && tourStep < TOUR.length && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 24, width: 'min(480px,95vw)', overflow: 'hidden', boxShadow: '0 28px 80px rgba(0,0,0,0.4)' }}>
            <div style={{ background: TOUR[tourStep].color, padding: '28px 28px 24px', textAlign: 'center' }}>
              <p style={{ fontSize: 52, marginBottom: 8 }}>{TOUR[tourStep].emoji}</p>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: '#fff' }}>{TOUR[tourStep].title}</h2>
            </div>
            <div style={{ padding: '24px 28px 28px' }}>
              <p style={{ fontSize: 16, color: C.mid, lineHeight: 1.8, marginBottom: 24, textAlign: 'center' }}>{TOUR[tourStep].desc}</p>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 22 }}>
                {TOUR.map((_, i) => <div key={i} style={{ width: i === tourStep ? 20 : 7, height: 7, borderRadius: 10, background: i === tourStep ? TOUR[tourStep].color : '#e8d9c5', transition: 'all 0.3s' }} />)}
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                {tourStep > 0 && <button onClick={() => setTourStep((s: number) => s - 1)} style={{ flex: 1, background: 'transparent', color: C.light, border: `1px solid ${C.border}`, borderRadius: 22, padding: '11px', fontSize: 14, cursor: 'pointer', fontFamily: 'Georgia,serif' }}>← Back</button>}
                <button onClick={() => tourStep === TOUR.length - 1 ? setTourStep(null) : setTourStep((s: number) => s + 1)} style={{ flex: 2, background: TOUR[tourStep].color, color: '#fff', border: 'none', borderRadius: 22, padding: '11px', fontSize: 15, cursor: 'pointer', fontFamily: 'Georgia,serif', fontWeight: 800 }}>
                  {tourStep === TOUR.length - 1 ? "Let's go! 🎉" : 'Next →'}
                </button>
              </div>
              <button onClick={() => setTourStep(null)} style={{ width: '100%', background: 'none', border: 'none', color: C.light, fontSize: 12, cursor: 'pointer', marginTop: 12, fontFamily: 'Georgia,serif' }}>Skip tour</button>
            </div>
          </div>
        </div>
      )}

      {/* WOUND PROMPT */}
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

      {/* POST CHAPTER — DRIFT + COMMENTS */}
      {showPostCh && story && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: C.surface, borderRadius: 22, width: 'min(560px,96vw)', maxHeight: '90vh', overflow: 'auto', boxShadow: '0 28px 80px rgba(0,0,0,0.5)' }}>
            <div style={{ padding: '24px 28px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <div>
                  <p style={{ fontSize: 11, color: C.accent, textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 6 }}>✦ Chapter complete</p>
                  <h2 style={{ fontSize: 20, fontWeight: 800 }}>What did this chapter do to you?</h2>
                  <p style={{ fontSize: 13, color: C.mid, marginTop: 4 }}>Saves to your Drift constellation 🌌</p>
                </div>
                <Btn onClick={() => { setShowPostCh(false); setReadingCh(null); }} sx={{ background: C.accentL, color: C.accent, borderRadius: '50%', width: 32, height: 32, fontSize: 15, fontWeight: 800, flexShrink: 0 }}>✕</Btn>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
                {DRIFT_STATES.map(s => (
                  <Btn key={s} onClick={() => setDriftState(s)} sx={{ background: driftState === s ? C.accent : C.card, color: driftState === s ? '#fff' : C.mid, border: `1px solid ${driftState === s ? C.accent : C.border}`, borderRadius: 20, padding: '5px 11px', fontSize: 11, fontWeight: driftState === s ? 700 : 400 }}>{s}</Btn>
                ))}
              </div>
              <textarea value={driftLetter} onChange={e => setDriftLetter(e.target.value)} placeholder="Write freely. What did this chapter do to you? This is private — yours alone." style={{ width: '100%', minHeight: 90, fontSize: 14, lineHeight: 1.8, border: `1px solid ${C.border}`, borderRadius: 10, padding: '12px 14px', color: C.text, background: C.bg, resize: 'none', outline: 'none', fontFamily: 'Georgia,serif', marginBottom: 14 }} />

              {/* Whisper Responses for Writers */}
              {story.authorId === user?.uid && (
                <div style={{ background: C.hero, border: `1px solid ${C.border}`, borderRadius: 12, padding: '12px 16px', marginBottom: 14 }}>
                  <p style={{ fontSize: 11, color: C.accent, fontWeight: 700, marginBottom: 8 }}>🌙 Anonymous Whisper Responses</p>
                  {[
                    { answer: 'This hit differently', percent: 41 },
                    { answer: 'I felt this in my chest', percent: 31 },
                    { answer: 'I needed to read this', percent: 18 },
                    { answer: 'I have no words', percent: 10 },
                  ].map(w => (
                    <div key={w.answer} style={{ marginBottom: 8 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                        <span style={{ fontSize: 12, color: C.mid }}>{w.answer}</span>
                        <span style={{ fontSize: 12, color: C.accent, fontWeight: 700 }}>{w.percent}%</span>
                      </div>
                      <div style={{ height: 4, background: C.border, borderRadius: 2, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${w.percent}%`, background: C.accent, borderRadius: 2 }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginBottom: 20 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: C.mid, cursor: 'pointer' }}>
                  <input type="checkbox" checked={driftShared} onChange={e => setDriftShared(e.target.checked)} /> Share with one person
                </label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <Btn onClick={() => { setShowPostCh(false); setReadingCh(null); }} sx={{ background: 'transparent', color: C.mid, border: `1px solid ${C.border}`, borderRadius: 20, padding: '8px 16px', fontSize: 13 }}>Skip</Btn>
                  <Btn onClick={saveDrift} sx={{ background: C.accent, color: '#fff', borderRadius: 20, padding: '8px 20px', fontSize: 13, fontWeight: 700 }}>Save to Drift 🌌</Btn>
                </div>
              </div>

              {/* Comments */}
              <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 18 }}>
                <h3 style={{ fontSize: 15, fontWeight: 800, marginBottom: 12 }}>💬 Chapter Comments ({chapterComments.length})</h3>
                <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
                  <input value={newComment} onChange={e => setNewComment(e.target.value)} onKeyDown={e => e.key === 'Enter' && postComment()} placeholder="What did you think of this chapter?" style={{ flex: 1, border: `1px solid ${C.border}`, borderRadius: 22, padding: '8px 14px', fontSize: 13, background: C.bg, color: C.text, outline: 'none', fontFamily: 'Georgia,serif' }} />
                  <Btn onClick={postComment} sx={{ background: C.accent, color: '#fff', borderRadius: 20, padding: '8px 14px', fontSize: 12, fontWeight: 700 }}>Post</Btn>
                </div>
                {chapterComments.length === 0 ? (
                  <p style={{ fontSize: 13, color: C.light, textAlign: 'center', padding: '12px 0' }}>No comments yet. Be the first!</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 180, overflowY: 'auto' }}>
                    {chapterComments.map((c: any) => (
                      <div key={c.id} style={{ background: C.bg, borderRadius: 10, padding: '9px 12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                          <span style={{ fontSize: 12, fontWeight: 700, color: C.accent }}>@{c.userName}</span>
                          <span style={{ fontSize: 10, color: C.light }}>{c.date}</span>
                        </div>
                        <p style={{ fontSize: 13, color: C.mid, lineHeight: 1.5 }}>{c.text}</p>
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
            <p style={{ fontSize: 17, color: C.mid, lineHeight: 1.7, marginBottom: 36, maxWidth: 500 }}>A reading platform built differently — for the ones who feel everything. No paywalls. No coin walls. Just stories.</p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 40 }}>
              <Btn onClick={() => { setAuthMode('signup'); setView('auth'); }} sx={{ background: C.accent, color: '#fff', borderRadius: 28, padding: '14px 32px', fontSize: 17, fontWeight: 800, boxShadow: `0 8px 24px ${C.accent}60` }}>Start Reading Free →</Btn>
              <Btn onClick={() => { setAuthMode('signin'); setView('auth'); }} sx={{ background: 'transparent', color: C.accent, border: `1.5px solid ${C.accent}`, borderRadius: 28, padding: '13px 28px', fontSize: 16, fontWeight: 700 }}>I have an account</Btn>
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
              {['🩹 Story Wounds', '🕯️ Reading Rooms', '🌙 11PM Shelf', '🌌 Drift', '🎲 Story Roulette', 'తె Telugu & English'].map(f => (
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
                {authMode === 'signin' ? 'Welcome back' : authMode === 'signup' ? 'Join Storyverse' : 'Reset Password'}
              </h1>
              <p style={{ fontSize: 14, color: C.mid }}>
                {authMode === 'signin' ? 'Your stories missed you.' : authMode === 'signup' ? 'Free forever. No ads. Just stories.' : 'We will send a reset link to your email.'}
              </p>
            </div>
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 20, padding: '28px' }}>
              {authMode === 'signup' && (
                <>
                  <div style={{ marginBottom: 14 }}>
                    <label style={{ display: 'block', fontSize: 11, color: C.light, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Your Name</label>
                    <input value={form.name} onChange={e => setForm((p: any) => ({ ...p, name: e.target.value }))} placeholder="What should we call you?" style={inputSx} />
                  </div>
                  <div style={{ marginBottom: 14 }}>
                    <label style={{ display: 'block', fontSize: 11, color: C.light, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Username</label>
                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: C.light, fontSize: 15 }}>@</span>
                      <input value={form.username} onChange={e => setForm((p: any) => ({ ...p, username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') }))} placeholder="your_username" style={{ ...inputSx, paddingLeft: 28 }} />
                    </div>
                    <p style={{ fontSize: 11, color: C.light, marginTop: 4 }}>3-20 chars, lowercase letters, numbers, underscores</p>
                  </div>
                </>
              )}
              {(authMode === 'signin' || authMode === 'signup' || authMode === 'forgot') && (
                <div style={{ marginBottom: 14 }}>
                  <label style={{ display: 'block', fontSize: 11, color: C.light, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Email</label>
                  <input value={form.email} onChange={e => setForm((p: any) => ({ ...p, email: e.target.value }))} placeholder="you@example.com" type="email"
                    style={{ ...inputSx, borderColor: form.email && !validateEmail(form.email) ? C.red : C.border }} />
                  {form.email && !validateEmail(form.email) && <p style={{ fontSize: 11, color: C.red, marginTop: 4 }}>Enter a valid email</p>}
                </div>
              )}
              {(authMode === 'signin' || authMode === 'signup') && (
                <div style={{ marginBottom: 6 }}>
                  <label style={{ display: 'block', fontSize: 11, color: C.light, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Password</label>
                  <div style={{ position: 'relative' }}>
                    <input value={form.password} onChange={e => setForm((p: any) => ({ ...p, password: e.target.value }))} placeholder="••••••••" type={showPass ? 'text' : 'password'}
                      style={{ ...inputSx, borderColor: form.password && form.password.length < 6 ? C.red : C.border, paddingRight: 60 }}
                      onKeyDown={e => e.key === 'Enter' && (authMode === 'signin' ? signIn() : signUp())} />
                    <button onClick={() => setShowPass((p: boolean) => !p)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: C.light, cursor: 'pointer', fontSize: 12, fontFamily: 'Georgia,serif' }}>{showPass ? 'Hide' : 'Show'}</button>
                  </div>
                  {form.password && form.password.length < 6 && <p style={{ fontSize: 11, color: C.red, marginTop: 4 }}>At least 6 characters</p>}
                </div>
              )}
              {authMode === 'forgot' && forgotSent && (
                <div style={{ background: C.greenBg, border: `1px solid ${C.green}`, borderRadius: 10, padding: '12px 16px', marginBottom: 14 }}>
                  <p style={{ fontSize: 14, color: C.green, fontWeight: 700 }}>✅ Reset email sent!</p>
                  <p style={{ fontSize: 13, color: C.green }}>Check your inbox and spam folder. If nothing arrives, go to Firebase Console → Authentication → Settings and make sure storyverse-sooty.vercel.app is listed under Authorized domains.</p>
                </div>
              )}
              {authError && <p style={{ fontSize: 13, color: C.red, background: C.redBg, border: '1px solid #f5c6c6', borderRadius: 8, padding: '8px 12px', margin: '10px 0', lineHeight: 1.5 }}>{authError}</p>}
              <div style={{ height: 12 }} />
              <Btn onClick={authMode === 'signin' ? signIn : authMode === 'signup' ? signUp : forgotPassword}
                sx={{ width: '100%', background: authLoading ? '#aaa' : C.accent, color: '#fff', borderRadius: 22, padding: '12px', fontSize: 15, fontWeight: 800, marginBottom: 14 }}>
                {authLoading ? 'Please wait...' : authMode === 'signin' ? 'Sign In →' : authMode === 'signup' ? 'Create Account →' : 'Send Reset Email'}
              </Btn>
              {(authMode === 'signin' || authMode === 'signup') && (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                    <div style={{ flex: 1, height: 1, background: C.border }} /><span style={{ fontSize: 12, color: C.light }}>or</span><div style={{ flex: 1, height: 1, background: C.border }} />
                  </div>
                  <Btn onClick={googleSignIn} sx={{ width: '100%', background: '#fff', color: '#333', border: `1px solid ${C.border}`, borderRadius: 22, padding: '11px', fontSize: 14, fontWeight: 700, marginBottom: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    <span style={{ fontWeight: 900, color: '#4285f4' }}>G</span> Continue with Google
                  </Btn>
                </>
              )}
              <div style={{ textAlign: 'center' }}>
                {authMode === 'signin' && (
                  <>
                    <p style={{ fontSize: 13, color: C.mid, marginBottom: 8 }}>Don't have an account? <button onClick={() => { setAuthMode('signup'); setAuthError(''); setForm((p: any) => ({ ...p, password: '' })); }} style={{ background: 'none', border: 'none', color: C.accent, fontWeight: 700, cursor: 'pointer', fontFamily: 'Georgia,serif', fontSize: 13 }}>Sign up free</button></p>
                    <button onClick={() => { setAuthMode('forgot'); setAuthError(''); setForgotSent(false); }} style={{ background: 'none', border: 'none', color: C.light, cursor: 'pointer', fontFamily: 'Georgia,serif', fontSize: 12, textDecoration: 'underline' }}>Forgot password?</button>
                  </>
                )}
                {authMode === 'signup' && <p style={{ fontSize: 13, color: C.mid }}>Already have an account? <button onClick={() => { setAuthMode('signin'); setAuthError(''); setForm((p: any) => ({ ...p, name: '', username: '', password: '' })); }} style={{ background: 'none', border: 'none', color: C.accent, fontWeight: 700, cursor: 'pointer', fontFamily: 'Georgia,serif', fontSize: 13 }}>Sign in</button></p>}
                {authMode === 'forgot' && <button onClick={() => { setAuthMode('signin'); setAuthError(''); setForgotSent(false); }} style={{ background: 'none', border: 'none', color: C.accent, cursor: 'pointer', fontFamily: 'Georgia,serif', fontSize: 13, fontWeight: 700 }}>← Back to Sign In</button>}
              </div>
            </div>
            <div style={{ textAlign: 'center', marginTop: 16 }}>
              <Btn onClick={() => setView('landing')} sx={{ background: 'none', color: C.light, fontSize: 13 }}>← Back to home</Btn>
            </div>
          </div>
        </div>
      )}

      {/* ── MAIN APP ── */}
      {user && view !== 'landing' && view !== 'auth' && (
        <>
          {/* NAV */}
          <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 14px', height: 52, background: C.surface, borderBottom: `1px solid ${C.border}`, position: 'sticky', top: 0, zIndex: 100, gap: 6 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', flexShrink: 0 }} onClick={() => navTo('home')}>
              <span>📖</span><span style={{ fontSize: 16, fontWeight: 800, color: C.accent }}>Storyverse</span>
            </div>
            <div style={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {[['home', 'Home'], ['browse', 'Browse'], ['write', '✍️'], ['wounds', '🩹'], ['drift', '🌌'], ['fun', '🎲'], ['profile', '👤']].map(([v, l]) => (
                <Btn key={v} onClick={() => navTo(v)} sx={{ background: view === v ? C.accentL : 'none', color: view === v ? C.accent : C.mid, fontWeight: view === v ? 700 : 400, borderRadius: 20, padding: '5px 9px', fontSize: 11 }}>{l}</Btn>
              ))}
            </div>
            <Btn onClick={handleSignOut} sx={{ background: C.redBg, color: C.red, borderRadius: 20, padding: '4px 10px', fontSize: 11, fontWeight: 700, border: `1px solid #f5c6c6`, flexShrink: 0 }}>Sign out</Btn>
          </nav>

          {/* ── HOME ── */}
          {view === 'home' && (
            <div style={{ maxWidth: 1060, margin: '0 auto', padding: '28px 20px 100px' }}>
              <div style={{ background: C.hero, borderRadius: 22, padding: '40px 36px', marginBottom: 36, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 24, flexWrap: 'wrap', backgroundImage: 'radial-gradient(circle at 75% 50%, #f0d8bc 0%, transparent 60%)' }}>
                <div style={{ flex: 1, minWidth: 240 }}>
                  <p style={{ fontSize: 10, color: C.accent, letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 10 }}>✦ Telugu & English · Reading Rooms · Story Wounds</p>
                  <h1 style={{ fontSize: 34, fontWeight: 800, lineHeight: 1.1, marginBottom: 12 }}>Welcome back,<br />{profile?.name || user.email?.split('@')[0]}! 📖</h1>
                  <p style={{ fontSize: 14, color: C.mid, lineHeight: 1.7, marginBottom: 20 }}>{wounds.length} wounds collected. {driftEntries.length} drift letters written. Keep going.</p>
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    <Btn onClick={() => navTo('browse')} sx={{ background: C.accent, color: '#fff', borderRadius: 24, padding: '10px 22px', fontSize: 14, fontWeight: 700 }}>Start Reading</Btn>
                    <Btn onClick={() => navTo('write')} sx={{ background: 'transparent', color: C.accent, border: `1.5px solid ${C.accent}`, borderRadius: 24, padding: '9px 20px', fontSize: 13, fontWeight: 700 }}>Start Writing</Btn>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  {[['🩹', wounds.length, 'Wounds'], ['🌌', driftEntries.length, 'Drifts'], ['❤️', likedStories.length, 'Liked'], ['👥', following.length, 'Following']].map(([icon, val, label]) => (
                    <div key={String(label)} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: '12px 16px', textAlign: 'center', minWidth: 72 }}>
                      <p style={{ fontSize: 18 }}>{icon}</p>
                      <p style={{ fontSize: 20, fontWeight: 800, color: C.accent }}>{val}</p>
                      <p style={{ fontSize: 10, color: C.light }}>{label}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* 11PM Shelf */}
              <div style={{ background: 'linear-gradient(135deg,#1c1008,#0d0805)', borderRadius: 18, padding: '20px 24px', marginBottom: 32, border: '1px solid #2a1810' }}>
                <p style={{ fontSize: 10, color: '#d4956a', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 5 }}>🌙 The 11PM Shelf</p>
                <h2 style={{ fontSize: 16, fontWeight: 800, color: '#f0e6d6', marginBottom: 14 }}>For reading in the dark.</h2>
                <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 4 }}>
                  {stories.filter((s: Story) => s.lateNight).map((s: Story) => (
                    <div key={s.id} onClick={() => openStory(s)} style={{ minWidth: 120, background: '#ffffff08', border: '1px solid #ffffff12', borderRadius: 12, padding: 12, cursor: 'pointer', flexShrink: 0 }}>
                      <div style={{ fontSize: 26, textAlign: 'center', marginBottom: 6 }}>{s.cover}</div>
                      <p style={{ fontSize: 11, fontWeight: 700, color: '#f0e6d6', lineHeight: 1.3 }}>{s.title}</p>
                      <p style={{ fontSize: 9, color: '#8a7060' }}>{s.author}</p>
                    </div>
                  ))}
                </div>
              </div>

              <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 16 }}>📚 All Stories ({stories.length})</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(180px,1fr))', gap: 14 }}>
                {stories.map((s: Story) => <div key={s.id} className="scard"><StoryCard s={s} onOpen={openStory} /></div>)}
              </div>
            </div>
          )}

          {/* ── BROWSE ── */}
          {view === 'browse' && (
            <div style={{ maxWidth: 1060, margin: '0 auto', padding: '28px 20px 100px' }}>
              <h2 style={{ fontSize: 26, fontWeight: 800, marginBottom: 16 }}>Browse Stories</h2>
              <div style={{ position: 'relative', marginBottom: 14 }}>
                <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 16, color: C.light }}>🔍</span>
                <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search by title or author..." style={{ width: '100%', border: `1px solid ${C.border}`, borderRadius: 24, padding: '10px 16px 10px 42px', fontSize: 14, background: C.surface, color: C.text, outline: 'none', fontFamily: 'Georgia,serif' }} />
                {searchQuery && <button onClick={() => setSearchQuery('')} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: C.light, cursor: 'pointer', fontSize: 16 }}>✕</button>}
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
                {['All', ...GENRES].map(g => (
                  <button key={g} onClick={() => setGenreFilter(g)} style={{ background: genreFilter === g ? C.accent : 'transparent', color: genreFilter === g ? '#fff' : C.mid, border: `1px solid ${genreFilter === g ? C.accent : C.border}`, borderRadius: 20, padding: '5px 14px', fontSize: 12, cursor: 'pointer', fontWeight: genreFilter === g ? 700 : 400, fontFamily: 'Georgia,serif', transition: 'all 0.15s' }}>{g}</button>
                ))}
              </div>
              <p style={{ fontSize: 12, color: C.light, marginBottom: 14 }}>{filteredStories.length} {filteredStories.length === 1 ? 'story' : 'stories'}{searchQuery ? ` for "${searchQuery}"` : ''}</p>
              {filteredStories.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 20px', color: C.mid }}>
                  <p style={{ fontSize: 36, marginBottom: 10 }}>🔍</p>
                  <p style={{ marginBottom: 16 }}>No stories found for "{searchQuery}"</p>
                  <Btn onClick={() => { setSearchQuery(''); setGenreFilter('All'); }} sx={{ background: C.accent, color: '#fff', borderRadius: 24, padding: '9px 22px', fontSize: 13, fontWeight: 700 }}>Clear Search</Btn>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(180px,1fr))', gap: 14 }}>
                  {filteredStories.map((s: Story) => <div key={s.id} className="scard"><StoryCard s={s} onOpen={openStory} /></div>)}
                </div>
              )}
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
                  <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 11, background: C.accentL, color: C.accent, padding: '2px 9px', borderRadius: 20, fontWeight: 700 }}>{story.genre}</span>
                    <span style={{ fontSize: 11, background: '#e8f4e8', color: C.green, padding: '2px 9px', borderRadius: 20, fontWeight: 700 }}>{story.lang}</span>
                    {story.lateNight && <span style={{ fontSize: 11, background: '#1c100820', color: '#d4956a', padding: '2px 9px', borderRadius: 20, fontWeight: 700 }}>🌙 11PM</span>}
                  </div>
                  <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 5, lineHeight: 1.2 }}>{story.title}</h1>
                  <p onClick={() => { setWriterAuthor(story.author); navTo('writer'); }} style={{ fontSize: 14, color: C.accent, marginBottom: 8, cursor: 'pointer', fontWeight: 600 }}>by {story.author} →</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                    <StarRating storyId={story.id} rating={userRatings[story.id] || 0} onRate={rateStory} />
                    <span style={{ fontSize: 12, color: C.light }}>{userRatings[story.id] ? `You rated ${userRatings[story.id]}★` : 'Tap to rate'}</span>
                  </div>
                  <p style={{ fontSize: 14, color: C.mid, lineHeight: 1.7, marginBottom: 14 }}>{story.desc}</p>
                  <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginBottom: 16 }}>
                    {story.tags.map((t: string) => <span key={t} style={{ fontSize: 11, color: C.accent, background: C.accentL, padding: '2px 9px', borderRadius: 20 }}>#{t}</span>)}
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
                    <Btn onClick={() => { const ch = readingProgress[story.id] || 1; setReadingCh(ch); loadComments(story.id, ch); }} sx={{ background: C.accent, color: '#fff', borderRadius: 24, padding: '10px 22px', fontSize: 13, fontWeight: 700 }}>
                      {readingProgress[story.id] ? `▶ Continue — Ch ${readingProgress[story.id]}` : '▶ Read Now'}
                    </Btn>
                    <Btn onClick={() => likeStory(story.id)} sx={{ background: likedStories.includes(story.id) ? '#fde8e8' : C.card, color: likedStories.includes(story.id) ? C.red : C.mid, border: `1px solid ${likedStories.includes(story.id) ? '#f5c6c6' : C.border}`, borderRadius: 24, padding: '9px 16px', fontSize: 13, fontWeight: 700 }}>
                      {likedStories.includes(story.id) ? '❤️ Liked' : '♡ Like'}
                    </Btn>
                    <Btn onClick={() => followWriter(story.author)} sx={{ background: following.includes(story.author) ? C.greenBg : 'transparent', color: following.includes(story.author) ? C.green : C.mid, border: `1px solid ${following.includes(story.author) ? C.green : C.border}`, borderRadius: 24, padding: '9px 16px', fontSize: 13, fontWeight: 700 }}>
                      {following.includes(story.author) ? '✓ Following' : '+ Follow'}
                    </Btn>
                    <Btn onClick={() => toggleReadingList(story.id)} sx={{ background: readingList.includes(story.id) ? C.accentL : 'transparent', color: C.accent, border: `1px solid ${C.border}`, borderRadius: 24, padding: '8px 14px', fontSize: 12, fontWeight: 700 }}>
                      {readingList.includes(story.id) ? '📚 In List' : '+ List'}
                    </Btn>
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <Btn onClick={() => shareToWhatsApp(story)} sx={{ background: '#25D366', color: '#fff', borderRadius: 22, padding: '7px 16px', fontSize: 12, fontWeight: 700 }}>📲 WhatsApp</Btn>
                    <Btn onClick={() => shareStory(story)} sx={{ background: C.accentL, color: C.accent, borderRadius: 22, padding: '7px 14px', fontSize: 12, fontWeight: 700 }}>🔗 Share</Btn>
                  </div>
                </div>
              </div>
              <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 13, overflow: 'hidden' }}>
                <div style={{ padding: '13px 18px', borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between' }}>
                  <h3 style={{ fontSize: 15, fontWeight: 800 }}>Chapters ({story.chapters})</h3>
                  <span style={{ fontSize: 11, color: C.accent, fontWeight: 600 }}>🕯️ Reading Rooms live</span>
                </div>
                {Array.from({ length: story.chapters }, (_, i) => i + 1).map(ch => (
                  <div key={ch} className="chrow" onClick={() => { setReadingCh(ch); loadComments(story.id, ch); }} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '11px 18px', borderBottom: `1px solid ${C.border}`, cursor: 'pointer', transition: 'background 0.15s' }}>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                      <span style={{ fontSize: 11, color: C.accent, fontWeight: 800, minWidth: 35 }}>Ch {ch}</span>
                      <span style={{ fontSize: 13 }}>Chapter {ch}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                      {readingProgress[story.id] === ch && <span style={{ fontSize: 10, color: C.green, fontWeight: 600 }}>● Current</span>}
                      <span style={{ fontSize: 11, color: C.light }}>~1,500 words</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── READER ── */}
          {readingCh !== null && story && (
            <div style={{ position: 'fixed', inset: 0, background: readerNightMode ? '#0f0a05' : 'rgba(44,26,14,0.8)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ background: readerNightMode ? '#1a1008' : C.surface, borderRadius: 20, width: 'min(700px,98vw)', maxHeight: '95vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 28px 70px rgba(0,0,0,0.4)' }}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', borderBottom: `1px solid ${readerNightMode ? '#2e1f0e' : C.border}`, position: 'relative', flexShrink: 0 }}>
                  <Btn onClick={() => setReadingCh(null)} sx={{ background: C.accentL, color: C.accent, borderRadius: '50%', width: 28, height: 28, fontSize: 13, fontWeight: 800, flexShrink: 0 }}>✕</Btn>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontWeight: 800, fontSize: 12, color: readerNightMode ? '#f0e6d6' : C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{story.title}</p>
                    <p style={{ fontSize: 10, color: readerNightMode ? '#8a7060' : C.light }}>Ch {readingCh} · 🕯️ {roomReaderCount} reading now</p>
                  </div>
                  <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                    <button onClick={() => setReaderFontSize((s: number) => Math.max(13, s - 2))} style={{ background: C.accentL, border: 'none', borderRadius: 6, width: 24, height: 24, cursor: 'pointer', fontSize: 10, fontWeight: 800, color: C.accent, fontFamily: 'Georgia,serif' }}>A-</button>
                    <button onClick={() => setReaderFontSize((s: number) => Math.min(24, s + 2))} style={{ background: C.accentL, border: 'none', borderRadius: 6, width: 24, height: 24, cursor: 'pointer', fontSize: 12, fontWeight: 800, color: C.accent, fontFamily: 'Georgia,serif' }}>A+</button>
                    <button onClick={() => setReaderNightMode((p: boolean) => !p)} style={{ background: readerNightMode ? '#d4956a' : '#1c1008', border: 'none', borderRadius: 6, width: 24, height: 24, cursor: 'pointer', fontSize: 12 }}>{readerNightMode ? '☀️' : '🌙'}</button>
                  </div>
                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, background: readerNightMode ? '#2e1f0e' : C.border }}>
                    <div style={{ height: '100%', background: C.accent, width: `${(readingCh / story.chapters) * 100}%`, transition: 'width 0.3s' }} />
                  </div>
                </div>
                <div style={{ padding: '4px 16px', background: readerNightMode ? '#2e1f0e' : C.accentL, borderBottom: `1px solid ${readerNightMode ? '#2e1f0e' : C.border}`, flexShrink: 0 }}>
                  <p style={{ fontSize: 10, color: C.accent }}>🩹 <strong>Select/highlight any sentence</strong> to save as a Wound</p>
                </div>

                <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                  {/* Story Content — ref for scroll to top */}
                  <div ref={readerBodyRef} style={{ flex: 1, overflowY: 'auto', padding: '20px 28px' }}
                    onMouseUp={() => { const sel = window.getSelection(); if (sel && sel.toString().trim().length > 8) { actions.setSelectedText(sel.toString().trim()); setShowWoundPrompt(true); } }}
                    onTouchEnd={() => { const sel = window.getSelection(); if (sel && sel.toString().trim().length > 8) { actions.setSelectedText(sel.toString().trim()); setShowWoundPrompt(true); } }}>
                    {getChapterContent(readingCh).map((p: string, i: number) => (
                      <p key={i} style={{ fontSize: readerFontSize, lineHeight: 2, color: readerNightMode ? '#f0e6d6' : C.text, marginBottom: 22, userSelect: 'text', cursor: 'text' }}>{p}</p>
                    ))}
                    {/* Whisper */}
                    <div style={{ background: readerNightMode ? '#1f1409' : C.hero, border: `1px solid ${readerNightMode ? '#2e1f0e' : C.border}`, borderRadius: 12, padding: 14, marginTop: 8 }}>
                      <p style={{ fontSize: 10, color: C.accent, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 8 }}>🌙 Whisper from the writer</p>
                      <p style={{ fontSize: 14, fontStyle: 'italic', lineHeight: 1.6, marginBottom: 10, color: readerNightMode ? '#f0e6d6' : C.text }}>
                        {['Did you see it coming?', 'Whose side are you on?', 'What would you have done?', 'How did this land?', 'Has this ever happened to you?'][(readingCh - 1) % 5]}
                      </p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {['This hit differently', 'I felt this in my chest', 'I needed to read this', 'I have no words'].map((a, i) => (
                          <Btn key={i} onClick={() => showToast('Your whisper was sent anonymously ✦')} sx={{ background: readerNightMode ? '#ffffff08' : C.card, color: readerNightMode ? '#f0e6d6' : C.text, border: `1px solid ${readerNightMode ? '#2e1f0e' : C.border}`, borderRadius: 9, padding: '7px 11px', fontSize: 12, textAlign: 'left', width: '100%' }}>{a}</Btn>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Live Room Chat */}
                  <div style={{ width: 190, borderLeft: `1px solid ${readerNightMode ? '#2e1f0e' : C.border}`, display: 'flex', flexDirection: 'column', background: readerNightMode ? '#150d05' : C.surface, flexShrink: 0 }}>
                    <div style={{ padding: '8px 10px', borderBottom: `1px solid ${readerNightMode ? '#2e1f0e' : C.border}` }}>
                      <p style={{ fontSize: 10, color: C.accent, fontWeight: 700 }}>🕯️ {roomReaderCount} in room</p>
                    </div>
                    <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
                      {roomMessages.length === 0 ? (
                        <p style={{ fontSize: 11, color: readerNightMode ? '#8a7060' : C.light, textAlign: 'center', marginTop: 16, lineHeight: 1.6 }}>Reading room is open. Say something 💬</p>
                      ) : roomMessages.map((m: any) => (
                        <div key={m.id} style={{ marginBottom: 8 }}>
                          <p style={{ fontSize: 9, color: C.accent, fontWeight: 700, marginBottom: 1 }}>@{m.userName}</p>
                          <p style={{ fontSize: 11, color: readerNightMode ? '#c4a882' : C.mid, lineHeight: 1.4, background: readerNightMode ? '#1f1409' : C.hero, padding: '5px 8px', borderRadius: 8 }}>{m.text}</p>
                        </div>
                      ))}
                    </div>
                    <div style={{ padding: '6px 8px', borderTop: `1px solid ${readerNightMode ? '#2e1f0e' : C.border}` }}>
                      <input value={roomMsg} onChange={e => setRoomMsg(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendRoomMessage()} placeholder="Say something..." style={{ width: '100%', border: `1px solid ${readerNightMode ? '#2e1f0e' : C.border}`, borderRadius: 16, padding: '5px 10px', fontSize: 11, background: readerNightMode ? '#1a1008' : C.bg, color: readerNightMode ? '#f0e6d6' : C.text, outline: 'none', fontFamily: 'Georgia,serif' }} />
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 16px', borderTop: `1px solid ${readerNightMode ? '#2e1f0e' : C.border}`, flexShrink: 0, gap: 8 }}>
                  <Btn onClick={() => { if (readingCh > 1) { const ch = readingCh - 1; setReadingCh(ch); saveProgress(story.id, ch); loadComments(story.id, ch); } }} sx={{ background: C.accentL, color: C.accent, borderRadius: 20, padding: '6px 14px', fontSize: 12, fontWeight: 700, opacity: readingCh <= 1 ? 0.4 : 1 }}>← Prev</Btn>
                  <Btn onClick={() => setShowPostCh(true)} sx={{ background: C.accent, color: '#fff', borderRadius: 20, padding: '6px 18px', fontSize: 12, fontWeight: 700 }}>Finish Chapter ✓</Btn>
                  <Btn onClick={() => { if (readingCh < story.chapters) { const ch = readingCh + 1; setReadingCh(ch); saveProgress(story.id, ch); loadComments(story.id, ch); } else showToast('Last chapter! You finished the story 🎉'); }} sx={{ background: C.accentL, color: C.accent, borderRadius: 20, padding: '6px 14px', fontSize: 12, fontWeight: 700, opacity: readingCh >= story.chapters ? 0.4 : 1 }}>Next →</Btn>
                </div>
              </div>
            </div>
          )}

          {/* ── WOUNDS ── */}
          {view === 'wounds' && (
            <div style={{ maxWidth: 700, margin: '0 auto', padding: '28px 20px 100px' }}>
              <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 4 }}>🩹 Your Wound Store</h2>
              <p style={{ fontSize: 13, color: C.mid, marginBottom: 24 }}>{wounds.length} sentences that found you. Saved forever.</p>
              {wounds.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 20px', color: C.mid }}>
                  <p style={{ fontSize: 40, marginBottom: 12 }}>🩹</p>
                  <p style={{ marginBottom: 16, lineHeight: 1.7 }}>No wounds yet.<br />Start reading and highlight any sentence that hits you.</p>
                  <Btn onClick={() => navTo('browse')} sx={{ background: C.accent, color: '#fff', borderRadius: 24, padding: '9px 22px', fontSize: 13, fontWeight: 700 }}>Browse Stories</Btn>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {wounds.map((w: any) => (
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

          {/* ── DRIFT ── */}
          {view === 'drift' && (
            <div style={{ maxWidth: 760, margin: '0 auto', padding: '28px 20px 100px' }}>
              <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 4 }}>🌌 Your Drift</h2>
              <p style={{ fontSize: 13, color: C.mid, marginBottom: 24 }}>Not what you read. What reading revealed about you.</p>
              <div style={{ background: '#1c1008', borderRadius: 18, padding: 28, marginBottom: 24, position: 'relative', minHeight: 200, overflow: 'hidden' }}>
                <p style={{ fontSize: 10, color: '#8a7060', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 14 }}>Your reading constellation — {driftEntries.length} {driftEntries.length === 1 ? 'star' : 'stars'}</p>
                {driftEntries.length === 0 ? (
                  <p style={{ color: '#8a7060', fontSize: 14, fontStyle: 'italic' }}>Finish a chapter and write how it touched you — your first star appears here.</p>
                ) : driftEntries.map((e: any, i: number) => (
                  <div key={e.id} style={{ position: 'absolute', left: `${[15, 45, 70, 30, 60, 20, 80, 50][i % 8]}%`, top: `${[25, 45, 20, 65, 35, 55, 40, 70][i % 8]}%` }}>
                    <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#d4956a', boxShadow: '0 0 14px #d4956a80' }} title={e.book} />
                    <p style={{ fontSize: 9, color: '#8a7060', marginTop: 3, whiteSpace: 'nowrap', maxWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis' }}>{e.book}</p>
                  </div>
                ))}
                {Array.from({ length: 25 }).map((_, i) => (
                  <div key={i} style={{ position: 'absolute', width: 2, height: 2, borderRadius: '50%', background: '#fff', opacity: Math.random() * 0.3 + 0.05, left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%` }} />
                ))}
              </div>
              {driftEntries.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: C.mid }}>
                  <p style={{ fontSize: 36, marginBottom: 10 }}>✉️</p>
                  <p style={{ marginBottom: 16, lineHeight: 1.7 }}>No letters yet.<br />Finish any chapter and tap "Finish Chapter" to write your first.</p>
                  <Btn onClick={() => navTo('browse')} sx={{ background: C.accent, color: '#fff', borderRadius: 24, padding: '9px 22px', fontSize: 13, fontWeight: 700 }}>Start Reading</Btn>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {driftEntries.map((e: any) => (
                    <div key={e.id} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: '18px 22px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
                        <div>
                          <p style={{ fontSize: 12, fontWeight: 700, color: C.accent }}>{e.book}</p>
                          <span style={{ fontSize: 11, background: C.accentL, color: C.accent, padding: '2px 8px', borderRadius: 20, fontWeight: 600 }}>{e.state}</span>
                        </div>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          <span style={{ fontSize: 11, color: C.light }}>{e.date}</span>
                          <span style={{ fontSize: 11, background: e.shared ? C.greenBg : '#f0f0f020', color: e.shared ? C.green : C.light, padding: '2px 8px', borderRadius: 20 }}>{e.shared ? 'Shared' : 'Private'}</span>
                        </div>
                      </div>
                      <p style={{ fontSize: 14, color: C.mid, lineHeight: 1.75, fontStyle: 'italic' }}>"{e.letter}"</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── WRITE ── */}
          {view === 'write' && (
            <div style={{ maxWidth: 800, margin: '0 auto', padding: '28px 20px 100px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 4 }}>Your Writing Space</h2>
                  <p style={{ fontSize: 13, color: C.mid }}>Write in Telugu or English. Publish and it appears in Browse immediately.</p>
                </div>
              </div>

              {/* NEW vs CONTINUE toggle — Bug 1 fix */}
              <div style={{ display: 'flex', background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, overflow: 'hidden', marginBottom: 20 }}>
                <button onClick={() => setIsNewStory(true)} style={{ flex: 1, padding: '11px', background: isNewStory ? C.accent : 'transparent', color: isNewStory ? '#fff' : C.mid, border: 'none', cursor: 'pointer', fontFamily: 'Georgia,serif', fontWeight: isNewStory ? 700 : 400, fontSize: 13, transition: 'all 0.2s' }}>✨ New Story</button>
                <button onClick={() => setIsNewStory(false)} style={{ flex: 1, padding: '11px', background: !isNewStory ? C.accent : 'transparent', color: !isNewStory ? '#fff' : C.mid, border: 'none', cursor: 'pointer', fontFamily: 'Georgia,serif', fontWeight: !isNewStory ? 700 : 400, fontSize: 13, transition: 'all 0.2s' }}>📝 Continue Draft</button>
              </div>

              {isNewStory && (
                <div style={{ background: C.accentL, borderRadius: 12, padding: '12px 16px', marginBottom: 16, fontSize: 13, color: C.mid, lineHeight: 1.6 }}>
                  Starting fresh. Write your title, select genre and language, then start writing below.
                </div>
              )}
              {!isNewStory && draftBody === '' && (
                <div style={{ background: '#fff3e0', borderRadius: 12, padding: '12px 16px', marginBottom: 16, fontSize: 13, color: '#e65100', lineHeight: 1.6 }}>
                  No draft found. Your last draft may have been published. Start a new story or keep writing here.
                </div>
              )}

              <input value={draftTitle} onChange={e => setDraftTitle(e.target.value)} placeholder="Story Title" style={{ width: '100%', fontSize: 22, fontWeight: 800, border: 'none', borderBottom: `2px solid ${C.border}`, background: 'transparent', color: C.text, padding: '7px 0', marginBottom: 14, outline: 'none' }} />
              <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
                <select value={draftGenre} onChange={e => setDraftGenre(e.target.value)} style={{ border: `1px solid ${C.border}`, borderRadius: 8, padding: '6px 10px', fontSize: 13, background: C.bg, color: C.text, outline: 'none' }}>
                  {GENRES.map(g => <option key={g}>{g}</option>)}
                </select>
                <select value={draftLang} onChange={e => setDraftLang(e.target.value)} style={{ border: `1px solid ${C.border}`, borderRadius: 8, padding: '6px 10px', fontSize: 13, background: C.bg, color: C.text, outline: 'none' }}>
                  {['English', 'Telugu', 'Hindi', 'Bilingual'].map(l => <option key={l}>{l}</option>)}
                </select>
              </div>
              <textarea value={draftBody} onChange={e => setDraftBody(e.target.value)} placeholder={"ఒకసారి... (Once upon a time...)\n\nWrite freely. Your first draft does not need to be perfect."} style={{ width: '100%', minHeight: 360, fontSize: 16, lineHeight: 1.95, border: `1px solid ${C.border}`, borderRadius: 12, padding: '16px', color: C.text, background: C.card, resize: 'vertical', outline: 'none' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginTop: 10 }}>
                <span style={{ fontSize: 12, color: C.light }}>{wordCount} words · {draftBody.length} chars</span>
                <div style={{ display: 'flex', gap: 8 }}>
                  <Btn onClick={() => showToast('Draft saved locally ✓')} sx={{ background: 'transparent', color: C.accent, border: `1.5px solid ${C.accent}`, borderRadius: 22, padding: '7px 18px', fontSize: 12, fontWeight: 700 }}>Save Draft</Btn>
                  <Btn onClick={publishStory} sx={{ background: C.accent, color: '#fff', borderRadius: 22, padding: '8px 18px', fontSize: 12, fontWeight: 700 }}>Publish Story 🎉</Btn>
                </div>
              </div>
            </div>
          )}

          {/* ── WRITER PROFILE ── */}
          {view === 'writer' && writerAuthor && (
            <div style={{ maxWidth: 760, margin: '0 auto', padding: '28px 20px 100px' }}>
              <Btn onClick={() => navTo('browse')} sx={{ background: 'none', color: C.accent, fontSize: 13, padding: 0, marginBottom: 20, display: 'block', fontWeight: 600 }}>← Back</Btn>
              <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 20, padding: '28px', marginBottom: 20, textAlign: 'center' }}>
                <div style={{ width: 72, height: 72, borderRadius: '50%', background: `linear-gradient(135deg,${C.accent},#a85e28)`, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 800, margin: '0 auto 14px' }}>
                  {writerAuthor[0].toUpperCase()}
                </div>
                <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>{writerAuthor}</h2>
                <p style={{ fontSize: 13, color: C.mid, marginBottom: 14, fontStyle: 'italic' }}>Writer on Storyverse</p>
                <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginBottom: 16 }}>
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ fontSize: 20 }}>📖</p>
                    <p style={{ fontSize: 18, fontWeight: 800, color: C.accent }}>{stories.filter((s: Story) => s.author === writerAuthor).length}</p>
                    <p style={{ fontSize: 11, color: C.light }}>Stories</p>
                  </div>
                </div>
                <Btn onClick={() => followWriter(writerAuthor)} sx={{ background: following.includes(writerAuthor) ? C.greenBg : C.accent, color: following.includes(writerAuthor) ? C.green : '#fff', border: `1px solid ${following.includes(writerAuthor) ? C.green : C.accent}`, borderRadius: 24, padding: '10px 28px', fontSize: 14, fontWeight: 700 }}>
                  {following.includes(writerAuthor) ? '✓ Following' : '+ Follow'}
                </Btn>
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 14 }}>Stories by {writerAuthor}</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(180px,1fr))', gap: 14 }}>
                {stories.filter((s: Story) => s.author === writerAuthor).map((s: Story) => (
                  <div key={s.id} className="scard"><StoryCard s={s} onOpen={openStory} /></div>
                ))}
              </div>
            </div>
          )}

          {/* ── FUN / ROULETTE ── */}
          {view === 'fun' && (
            <div style={{ maxWidth: 700, margin: '0 auto', padding: '28px 20px 100px' }}>
              <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 4 }}>🎲 Fun Corner</h2>
              <p style={{ fontSize: 13, color: C.mid, marginBottom: 24 }}>When you don't know what to read next. Let fate decide.</p>

              {/* Story Roulette */}
              <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 20, padding: '24px', marginBottom: 20 }}>
                <p style={{ fontSize: 13, color: C.accent, fontWeight: 700, marginBottom: 4 }}>🎲 Story Roulette</p>
                <p style={{ fontSize: 13, color: C.mid, marginBottom: 16, lineHeight: 1.6 }}>One opening line. 30 seconds. In — or Out? No genre. No blurb. Just your gut.</p>
                {rouletteIdx === null ? (
                  <Btn onClick={spinRoulette} sx={{ background: C.accent, color: '#fff', borderRadius: 22, padding: '10px 24px', fontSize: 14, fontWeight: 700, width: '100%' }}>🎲 Spin the Roulette</Btn>
                ) : (
                  <div>
                    <div style={{ background: C.hero, borderRadius: 14, padding: '20px', marginBottom: 16, position: 'relative' }}>
                      <div style={{ position: 'absolute', top: 12, right: 14, background: rouletteTimer > 10 ? C.accent : C.red, color: '#fff', borderRadius: 20, padding: '2px 10px', fontSize: 12, fontWeight: 700 }}>{rouletteTimer}s</div>
                      <p style={{ fontSize: 11, color: C.light, marginBottom: 8 }}>{ROULETTE_OPENINGS[rouletteIdx].genre} · {ROULETTE_OPENINGS[rouletteIdx].title}</p>
                      <p style={{ fontSize: 18, fontStyle: 'italic', lineHeight: 1.8, color: C.text, marginBottom: 10 }}>"{ROULETTE_OPENINGS[rouletteIdx].opening}"</p>
                      <p style={{ fontSize: 12, color: C.light }}>— {ROULETTE_OPENINGS[rouletteIdx].author}</p>
                    </div>
                    <div style={{ display: 'flex', gap: 10 }}>
                      <Btn onClick={() => { showToast("You're In! 🎉 Added to reading list."); spinRoulette(); }} sx={{ flex: 1, background: C.green, color: '#fff', borderRadius: 22, padding: '10px', fontSize: 14, fontWeight: 700 }}>✓ I'm In</Btn>
                      <Btn onClick={spinRoulette} sx={{ flex: 1, background: C.redBg, color: C.red, border: `1px solid #f5c6c6`, borderRadius: 22, padding: '10px', fontSize: 14, fontWeight: 700 }}>✗ Pass</Btn>
                    </div>
                  </div>
                )}
              </div>

              {/* The Fog */}
              <div style={{ background: 'linear-gradient(135deg,#1c1008,#0d0805)', borderRadius: 20, padding: '24px', marginBottom: 20, border: '1px solid #2a1810' }}>
                <p style={{ fontSize: 13, color: '#d4956a', fontWeight: 700, marginBottom: 4 }}>🌀 The Fog</p>
                <p style={{ fontSize: 13, color: '#8a7060', marginBottom: 16, lineHeight: 1.6 }}>A story being revealed week by week. Author identity hidden until the final chapter.</p>
                <div style={{ background: '#ffffff08', borderRadius: 12, padding: '16px' }}>
                  <p style={{ fontSize: 11, color: '#d4956a', marginBottom: 8 }}>Chapter 1 — Available Now</p>
                  <p style={{ fontSize: 15, fontStyle: 'italic', color: '#f0e6d6', lineHeight: 1.8 }}>"She arrived at the funeral in the wrong dress and the right state of mind."</p>
                  <p style={{ fontSize: 11, color: '#8a7060', marginTop: 10 }}>Chapter 2 unlocks in 7 days. 234 readers following this fog.</p>
                </div>
              </div>

              {/* Reader Archetype */}
              {(() => {
                const a = actions.getArchetype();
                return (
                  <div style={{ background: `${a.color}15`, border: `1px solid ${a.color}40`, borderRadius: 20, padding: '24px' }}>
                    <p style={{ fontSize: 13, color: C.mid, fontWeight: 700, marginBottom: 4 }}>🎭 Your Reader Archetype</p>
                    <p style={{ fontSize: 13, color: C.mid, marginBottom: 16 }}>Based on your actual reading behaviour — not a quiz.</p>
                    <div style={{ textAlign: 'center' }}>
                      <p style={{ fontSize: 42, marginBottom: 8 }}>{a.emoji}</p>
                      <p style={{ fontSize: 20, fontWeight: 800, color: a.color, marginBottom: 8 }}>{a.type}</p>
                      <p style={{ fontSize: 14, color: C.mid, lineHeight: 1.7 }}>{a.desc}</p>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* ── PROFILE ── */}
          {view === 'profile' && (
            <div style={{ maxWidth: 600, margin: '0 auto', padding: '28px 20px 100px' }}>
              <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 20 }}>👤 Your Profile</h2>
              <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 20, padding: '28px', marginBottom: 16, textAlign: 'center' }}>
                <div style={{ width: 72, height: 72, borderRadius: '50%', background: C.accent, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 800, margin: '0 auto 14px' }}>
                  {(profile?.name || user.email || 'S')[0].toUpperCase()}
                </div>
                <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 2 }}>{profile?.name || user.displayName || 'Reader'}</h2>

                {/* Username — Bug 5 fix */}
                {!editingUsername ? (
                  <div style={{ marginBottom: 10 }}>
                    <p style={{ fontSize: 14, color: C.light, marginBottom: 4 }}>@{profile?.username || 'not set'}</p>
                    <Btn onClick={() => { setEditUsername(profile?.username || ''); setEditingUsername(true); }} sx={{ background: C.accentL, color: C.accent, borderRadius: 20, padding: '3px 12px', fontSize: 11, fontWeight: 600 }}>Edit username</Btn>
                  </div>
                ) : (
                  <div style={{ marginBottom: 10 }}>
                    <div style={{ position: 'relative', marginBottom: 6 }}>
                      <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: C.light }}>@</span>
                      <input value={editUsername} onChange={e => setEditUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))} style={{ width: '100%', border: `1px solid ${C.border}`, borderRadius: 10, padding: '8px 12px 8px 28px', fontSize: 14, background: C.bg, color: C.text, outline: 'none', fontFamily: 'Georgia,serif', textAlign: 'left' }} maxLength={20} />
                    </div>
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                      <Btn onClick={saveUsername} sx={{ background: C.accent, color: '#fff', borderRadius: 20, padding: '5px 16px', fontSize: 12, fontWeight: 700 }}>Save</Btn>
                      <Btn onClick={() => setEditingUsername(false)} sx={{ background: 'transparent', color: C.mid, border: `1px solid ${C.border}`, borderRadius: 20, padding: '5px 14px', fontSize: 12 }}>Cancel</Btn>
                    </div>
                  </div>
                )}

                <p style={{ fontSize: 13, color: C.mid, marginBottom: 8 }}>{user.email}</p>
                {user.emailVerified ? (
                  <span style={{ fontSize: 11, background: C.greenBg, color: C.green, padding: '2px 10px', borderRadius: 20, fontWeight: 600 }}>✅ Email verified</span>
                ) : (
                  <div>
                    <span style={{ fontSize: 11, background: '#fff3e0', color: '#e65100', padding: '2px 10px', borderRadius: 20, fontWeight: 600 }}>⚠️ Email not verified</span>
                    <Btn onClick={async () => { await sendEmailVerification(auth.currentUser!); showToast('Verification email sent! 📧'); }} sx={{ background: 'transparent', color: C.accent, fontSize: 11, display: 'block', margin: '6px auto 0', fontWeight: 600 }}>Resend verification</Btn>
                  </div>
                )}
                <div style={{ height: 12 }} />

                {/* Bio — Bug 8 fix: saves and reflects immediately */}
                {!editingBio ? (
                  <div>
                    <p style={{ fontSize: 14, color: C.mid, fontStyle: 'italic', marginBottom: 10 }}>"{profile?.bio || 'New to Storyverse ✨'}"</p>
                    <Btn onClick={() => { setEditBio(profile?.bio || ''); setEditingBio(true); }} sx={{ background: C.accentL, color: C.accent, borderRadius: 20, padding: '5px 14px', fontSize: 12, fontWeight: 600 }}>Edit Bio</Btn>
                  </div>
                ) : (
                  <div>
                    <input value={editBio} onChange={e => { if (e.target.value.length <= 150) setEditBio(e.target.value); }} style={{ width: '100%', border: `1px solid ${C.border}`, borderRadius: 10, padding: '9px 12px', fontSize: 14, background: C.bg, color: C.text, outline: 'none', fontFamily: 'Georgia,serif', textAlign: 'center', marginBottom: 4 }} placeholder="Tell us about yourself..." maxLength={150} />
                    <p style={{ fontSize: 11, color: C.light, marginBottom: 8, textAlign: 'right' }}>{editBio.length}/150</p>
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                      <Btn onClick={saveBio} sx={{ background: C.accent, color: '#fff', borderRadius: 20, padding: '6px 16px', fontSize: 12, fontWeight: 700 }}>Save</Btn>
                      <Btn onClick={() => setEditingBio(false)} sx={{ background: 'transparent', color: C.mid, border: `1px solid ${C.border}`, borderRadius: 20, padding: '6px 14px', fontSize: 12 }}>Cancel</Btn>
                    </div>
                  </div>
                )}
                <p style={{ fontSize: 12, color: C.light, marginTop: 14 }}>Member since {profile?.joined || 'Recently'}</p>
              </div>

              {/* Stats */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 16 }}>
                {[['🩹', wounds.length, 'Wounds'], ['🌌', driftEntries.length, 'Drifts'], ['❤️', likedStories.length, 'Liked'], ['👥', following.length, 'Following']].map(([icon, val, label]) => (
                  <div key={String(label)} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: '14px 10px', textAlign: 'center' }}>
                    <p style={{ fontSize: 18 }}>{icon}</p>
                    <p style={{ fontSize: 20, fontWeight: 800, color: C.accent }}>{val}</p>
                    <p style={{ fontSize: 10, color: C.light }}>{label}</p>
                  </div>
                ))}
              </div>

              {/* Writer's own stories — Bug 6 fix */}
              {stories.filter((s: Story) => s.authorId === user?.uid).length > 0 && (
                <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: '16px 18px', marginBottom: 16 }}>
                  <p style={{ fontSize: 14, fontWeight: 800, marginBottom: 14 }}>✍️ Your Published Stories</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {stories.filter((s: Story) => s.authorId === user?.uid).map((s: Story) => (
                      <div key={s.id} onClick={() => openStory(s)} style={{ display: 'flex', gap: 12, alignItems: 'center', cursor: 'pointer', padding: '8px', borderRadius: 10, transition: 'background 0.15s' }}>
                        <div style={{ width: 40, height: 40, borderRadius: 8, background: s.grad, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>{s.cover}</div>
                        <div style={{ flex: 1 }}>
                          <p style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{s.title}</p>
                          <p style={{ fontSize: 11, color: C.light }}>{s.genre} · {s.lang} · 👁 {s.views || 0} views</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Following list */}
              {following.length > 0 && (
                <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: '16px 18px', marginBottom: 16 }}>
                  <p style={{ fontSize: 14, fontWeight: 800, marginBottom: 10 }}>👥 Writers you follow ({following.length})</p>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {following.map((author: string) => (
                      <Btn key={author} onClick={() => { setWriterAuthor(author); navTo('writer'); }} sx={{ background: C.accentL, color: C.accent, borderRadius: 20, padding: '5px 12px', fontSize: 12, fontWeight: 600 }}>{author}</Btn>
                    ))}
                  </div>
                </div>
              )}

              <Btn onClick={handleSignOut} sx={{ width: '100%', background: C.redBg, color: C.red, border: `1px solid #f5c6c6`, borderRadius: 16, padding: '13px', fontSize: 15, fontWeight: 700 }}>Sign Out</Btn>
            </div>
          )}

          {/* BOTTOM NAV */}
          <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: C.surface, borderTop: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-around', padding: '8px 0 10px', zIndex: 90 }}>
            {[['home', '🏠', 'Home'], ['browse', '🔍', 'Browse'], ['write', '✍️', 'Write'], ['wounds', '🩹', 'Wounds'], ['drift', '🌌', 'Drift'], ['fun', '🎲', 'Fun'], ['profile', '👤', 'Me']].map(([v, icon, label]) => (
              <button key={String(v)} onClick={() => navTo(String(v))} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, padding: '4px 6px', color: view === v ? C.accent : C.light, fontFamily: 'Georgia,serif', transition: 'all 0.15s' }}>
                <span style={{ fontSize: 17 }}>{icon}</span>
                <span style={{ fontSize: 9, fontWeight: view === v ? 700 : 400 }}>{label}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
