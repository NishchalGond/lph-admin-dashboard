import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, ArrowRight, Lock } from 'lucide-react';

/* ─────────────────────────────────────────
   DEEP SPACE & GALAXY NEBULA CANVAS
───────────────────────────────────────── */
const GalaxyCanvas = () => {
  const canvasRef = useRef(null);
  const mouseRef  = useRef({ x: 0.5, y: 0.5 });
  const rafRef    = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // ── 3-Layer Moving Stars ──
    const STAR_COUNT = 380;
    const stars = Array.from({ length: STAR_COUNT }, () => {
      const depth = Math.random(); // 0 (far) to 1 (near)
      return {
        x: Math.random(),
        y: Math.random(),
        vx: (Math.random() - 0.5) * (0.0004 + depth * 0.0012), // Faster near stars
        vy: (Math.random() - 0.5) * (0.0004 + depth * 0.0012),
        r:  0.3 + depth * 1.8,
        o:  0.2 + depth * 0.7,
        depth,
        twinkleSpeed: Math.random() * 0.04 + 0.01,
        phase: Math.random() * Math.PI * 2,
        hue: [195, 220, 260, 290, 320][Math.floor(Math.random() * 5)],
        isCross: Math.random() < 0.05, // 5% flare stars
      };
    });

    // ── Periodic Shooting Stars (Meteors) ──
    const meteors = [];
    const spawnMeteor = () => {
      if (meteors.length < 3 && Math.random() < 0.03) {
        meteors.push({
          x: Math.random() * 0.8,
          y: Math.random() * 0.5,
          length: Math.random() * 80 + 60,
          speed: Math.random() * 12 + 10,
          angle: Math.PI / 4 + (Math.random() - 0.5) * 0.2,
          opacity: 1,
          hue: Math.random() < 0.5 ? 195 : 270,
        });
      }
    };

    // ── Galactic Nebula Clouds ──
    const nebulae = [
      { x: 0.20, y: 0.35, r: 0.45, hue: 260, sat: 85, lit: 50 }, // Purple dust
      { x: 0.75, y: 0.65, r: 0.40, hue: 200, sat: 90, lit: 52 }, // Cyan dust
      { x: 0.50, y: 0.20, r: 0.35, hue: 310, sat: 80, lit: 48 }, // Magenta dust
      { x: 0.82, y: 0.25, r: 0.30, hue: 220, sat: 85, lit: 55 }, // Royal Blue
      { x: 0.15, y: 0.78, r: 0.38, hue: 180, sat: 75, lit: 45 }, // Deep Teal
    ];

    let t = 0;

    const draw = () => {
      const W = canvas.width;
      const H = canvas.height;
      t += 0.003;
      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;

      // Deep dark space background
      ctx.fillStyle = '#02040B';
      ctx.fillRect(0, 0, W, H);

      // ── Draw Swirling Galactic Nebulae ──
      nebulae.forEach((neb, i) => {
        const ox = neb.x + Math.sin(t * 0.3 + i * 1.8) * 0.06 + (mx - 0.5) * 0.04;
        const oy = neb.y + Math.cos(t * 0.25 + i * 1.2) * 0.05 + (my - 0.5) * 0.03;
        const rx = ox * W;
        const ry = oy * H;
        const radius = neb.r * Math.max(W, H);

        const grad = ctx.createRadialGradient(rx, ry, 0, rx, ry, radius);
        const alpha = 0.14 + Math.sin(t * 0.6 + i) * 0.04;
        grad.addColorStop(0, `hsla(${neb.hue}, ${neb.sat}%, ${neb.lit}%, ${alpha})`);
        grad.addColorStop(0.4, `hsla(${neb.hue + 20}, ${neb.sat - 10}%, ${neb.lit - 10}%, ${alpha * 0.5})`);
        grad.addColorStop(1, 'transparent');

        ctx.beginPath();
        ctx.fillStyle = grad;
        ctx.arc(rx, ry, radius, 0, Math.PI * 2);
        ctx.fill();
      });

      // ── Draw Moving Stars ──
      stars.forEach((s, i) => {
        s.phase += s.twinkleSpeed;
        const currentO = Math.max(0.15, Math.min(1, s.o + Math.sin(s.phase) * 0.35));

        // Move stars continuously
        s.x += s.vx;
        s.y += s.vy;

        // Wrap around boundaries
        if (s.x < 0) s.x = 1;
        if (s.x > 1) s.x = 0;
        if (s.y < 0) s.y = 1;
        if (s.y > 1) s.y = 0;

        const sx = s.x * W;
        const sy = s.y * H;

        // Draw Cross / Lens Flare Star for bright stars
        if (s.isCross && s.r > 1.2) {
          ctx.strokeStyle = `hsla(${s.hue}, 90%, 85%, ${currentO * 0.6})`;
          ctx.lineWidth = 0.8;
          ctx.beginPath();
          ctx.moveTo(sx - s.r * 5, sy);
          ctx.lineTo(sx + s.r * 5, sy);
          ctx.moveTo(sx, sy - s.r * 5);
          ctx.lineTo(sx, sy + s.r * 5);
          ctx.stroke();
        }

        // Star core
        ctx.beginPath();
        ctx.arc(sx, sy, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${s.hue}, 85%, 88%, ${currentO})`;
        ctx.fill();

        // Soft constellation links between nearby bright stars
        if (s.depth > 0.6) {
          for (let j = i + 1; j < Math.min(i + 6, stars.length); j++) {
            const s2 = stars[j];
            if (s2.depth > 0.6) {
              const cdx = (s.x - s2.x) * W;
              const cdy = (s.y - s2.y) * H;
              const cdist = Math.hypot(cdx, cdy);
              if (cdist < 95) {
                const lineAlpha = (1 - cdist / 95) * 0.09;
                ctx.beginPath();
                ctx.moveTo(sx, sy);
                ctx.lineTo(s2.x * W, s2.y * H);
                ctx.strokeStyle = `hsla(210, 70%, 75%, ${lineAlpha})`;
                ctx.lineWidth = 0.5;
                ctx.stroke();
              }
            }
          }
        }
      });

      // ── Draw Shooting Stars (Meteors) ──
      spawnMeteor();
      for (let m = meteors.length - 1; m >= 0; m--) {
        const met = meteors[m];
        const tailX = met.x * W - Math.cos(met.angle) * met.length;
        const tailY = met.y * H - Math.sin(met.angle) * met.length;

        const mGrad = ctx.createLinearGradient(met.x * W, met.y * H, tailX, tailY);
        mGrad.addColorStop(0, `hsla(${met.hue}, 100%, 90%, ${met.opacity})`);
        mGrad.addColorStop(1, 'transparent');

        ctx.beginPath();
        ctx.moveTo(met.x * W, met.y * H);
        ctx.lineTo(tailX, tailY);
        ctx.strokeStyle = mGrad;
        ctx.lineWidth = 1.6;
        ctx.stroke();

        met.x += (Math.cos(met.angle) * met.speed) / W;
        met.y += (Math.sin(met.angle) * met.speed) / H;
        met.opacity -= 0.02;

        if (met.opacity <= 0 || met.x > 1.2 || met.y > 1.2) {
          meteors.splice(m, 1);
        }
      }

      rafRef.current = requestAnimationFrame(draw);
    };

    draw();

    const onMouseMove = (e) => {
      mouseRef.current = { x: e.clientX / window.innerWidth, y: e.clientY / window.innerHeight };
    };
    window.addEventListener('mousemove', onMouseMove);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMouseMove);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-0" />;
};

/* ─────────────────────────────────────────
   MAIN LOGIN COMPONENT
───────────────────────────────────────── */
const Login = () => {
  const [password, setPassword]       = useState('');
  const [error, setError]             = useState(false);
  const [loading, setLoading]         = useState(false);
  const [welcomeFlow, setWelcomeFlow] = useState(null);
  const [mounted, setMounted]         = useState(false);
  const inputRef = useRef(null);

  const { loginWithPassword } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const t = setTimeout(() => {
      setMounted(true);
      inputRef.current?.focus();
    }, 200);
    return () => clearTimeout(t);
  }, []);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!password.trim() || loading || welcomeFlow) return;

    setLoading(true);
    setError(false);

    try {
      const res = await loginWithPassword(password);
      if (res?.user) {
        setLoading(false);
        setWelcomeFlow({
          fullName: res.user.full_name || res.user.username || 'User',
          role: res.user.role || 'Admin',
        });
        setTimeout(() => navigate('/'), 2200);
      } else {
        setLoading(false);
        setError(true);
        setPassword('');
        setTimeout(() => setError(false), 1800);
      }
    } catch {
      setLoading(false);
      setError(true);
      setPassword('');
      setTimeout(() => setError(false), 1800);
    }
  };

  return (
    <div className="fixed inset-0 overflow-hidden bg-[#02040B] text-white select-none font-sans">
      {/* Galaxy canvas background */}
      <GalaxyCanvas />

      {/* Subtle radial vignette */}
      <div
        className="absolute inset-0 z-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 50% 45%, transparent 25%, rgba(2,4,11,0.8) 100%)' }}
      />

      {/* ── CLEAN MINIMALIST LOGIN CARD ── */}
      {!welcomeFlow && (
        <div
          className="fixed inset-0 flex flex-col items-center justify-center z-20 px-4"
          style={{ opacity: mounted ? 1 : 0, transition: 'opacity 0.5s ease' }}
        >


          {/* Sleek Passcode Card */}
          <div
            className="w-full max-w-[380px]"
            style={{ animation: mounted ? 'fadeUp 0.5s cubic-bezier(0.16,1,0.3,1) 0.1s both' : 'none' }}
          >
            <div
              className={`relative rounded-2xl p-6 backdrop-blur-2xl transition-all duration-300 shadow-2xl border ${
                error
                  ? 'bg-rose-950/40 border-rose-500/60 shadow-[0_0_35px_rgba(244,63,94,0.3)]'
                  : 'bg-[#0A1022]/85 border-white/12 hover:border-sky-500/40 shadow-[0_16px_48px_rgba(0,0,0,0.7)]'
              }`}
            >
              {/* Top ambient highlight line */}
              <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />

              <div className="space-y-5">
                {/* Header */}
                <div>
                  <h2 className="text-lg font-bold text-white tracking-tight">
                    Enter Passcode
                  </h2>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <div
                      className={`relative flex items-center gap-3 rounded-xl border px-3.5 py-3 transition-all duration-200 ${
                        error
                          ? 'border-rose-500/80 bg-rose-500/10'
                          : 'border-white/15 bg-white/6 focus-within:border-sky-500 focus-within:bg-white/10 focus-within:ring-2 focus-within:ring-sky-500/25'
                      }`}
                    >
                      <Lock className={`w-4 h-4 flex-shrink-0 ${error ? 'text-rose-400' : 'text-slate-400'}`} />
                      <input
                        ref={inputRef}
                        type="password"
                        placeholder="Passcode"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-transparent text-sm font-mono text-white placeholder-slate-500 focus:outline-none tracking-widest"
                        autoComplete="current-password"
                      />
                    </div>

                    {error && (
                      <p className="text-xs text-rose-400 font-semibold pl-1 animate-fade-in">
                        Invalid passcode — please try again
                      </p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={loading || !password.trim()}
                    className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-xs tracking-wide uppercase transition-all duration-200 ${
                      loading || !password.trim()
                        ? 'bg-white/5 text-white/20 cursor-not-allowed border border-white/5'
                        : 'bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white shadow-lg shadow-sky-500/25 hover:shadow-sky-500/40 hover:-translate-y-0.5 active:translate-y-0'
                    }`}
                  >
                    {loading ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>Access Dashboard</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── WELCOME OVERLAY ── */}
      {welcomeFlow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#02040B]/90 backdrop-blur-xl animate-fade-in">
          <div
            className="relative max-w-sm w-full mx-4 text-center"
            style={{ animation: 'fadeScale 0.35s cubic-bezier(0.16,1,0.3,1) both' }}
          >
            <div className="relative rounded-2xl overflow-hidden border border-white/12 bg-[#0B1326]/95 backdrop-blur-2xl shadow-2xl p-8 space-y-5">
              <div className="w-14 h-14 mx-auto rounded-full bg-gradient-to-tr from-sky-500 to-emerald-500 flex items-center justify-center text-white shadow-lg shadow-sky-500/30">
                <CheckCircle2 className="w-7 h-7" strokeWidth={2.5} />
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-bold tracking-widest uppercase text-emerald-400 block font-mono">
                  Access Granted
                </span>
                <h2 className="text-xl font-bold text-white tracking-tight">
                  Welcome, <span className="text-sky-400">{welcomeFlow.fullName}</span>
                </h2>
                <p className="text-xs text-white/40">
                  Loading system workspace…
                </p>
              </div>

              <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-sky-500 via-indigo-500 to-emerald-500 rounded-full"
                  style={{ animation: 'shimmerMove 1.5s ease-in-out infinite', backgroundSize: '200% 100%' }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
