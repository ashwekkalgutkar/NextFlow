"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { PanelLeft, MoreHorizontal, LogOut, Settings, CreditCard, BarChart2, Plus, ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePathname, useRouter } from 'next/navigation';
import { useClerk } from '@clerk/nextjs';

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { openSignIn, user, signOut } = useClerk();

  const NavItem = ({ name, iconNode, active, href, dimText }: {
    name: string;
    iconNode: React.ReactNode;
    active?: boolean;
    href?: string;
    dimText?: boolean;
  }) => {
    const inner = (
      <span
        className={cn(
          "flex items-center gap-3 px-3 py-2.5 mx-2 rounded-[8px] cursor-pointer transition-colors text-[13.5px] font-semibold tracking-tight",
          collapsed && "justify-center mx-1 px-0 w-10 h-10"
        )}
        style={{
          background: active ? 'var(--nav-item-bg-active)' : 'transparent',
          color: active
            ? 'var(--nav-item-text-active)'
            : dimText
              ? 'var(--text-dim)'
              : 'var(--text-muted)',
        }}
      >
        <span className="flex items-center justify-center shrink-0 w-[22px] h-[22px]">
          {iconNode}
        </span>
        {!collapsed && <span className="flex-1 truncate">{name}</span>}
      </span>
    );
    if (href) {
      return <Link href={href} className="block">{inner}</Link>;
    }
    return <div>{inner}</div>;
  };

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="md:hidden fixed top-4 left-4 z-40 w-9 h-9 rounded-md flex items-center justify-center shadow"
        style={{ background: 'var(--btn-bg)', border: '1px solid var(--btn-border)', color: 'var(--text-muted)' }}
        title="Open Sidebar"
      >
        <PanelLeft size={16} />
      </button>

      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/60 z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <div
        className={cn(
          "h-full flex flex-col md:border-r transition-all duration-300 ease-in-out z-50 shrink-0",
          collapsed ? "md:w-[60px]" : "md:w-[240px]",
          "fixed md:relative inset-y-0 left-0 w-[240px]",
          mobileOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full md:translate-x-0"
        )}
        style={{
          background: 'var(--bg-sidebar)',
          borderColor: 'var(--border-subtle)',
          minWidth: collapsed ? undefined : '240px',
          transition: 'background 0.2s ease, border-color 0.2s ease, width 0.3s ease',
        }}
      >

        {/* Header / Collapse Toggle */}
        <div className="p-4 pt-5 pb-2 flex items-center h-[50px] mb-2 justify-between">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-7 h-7 rounded bg-transparent hidden md:flex items-center justify-center transition-colors ml-1"
            style={{ color: 'var(--text-dim)' }}
          >
            <PanelLeft size={16} strokeWidth={1.5} />
          </button>
          <button
            onClick={() => setMobileOpen(false)}
            className="w-7 h-7 rounded bg-transparent md:hidden flex items-center justify-center transition-colors"
            style={{ color: 'var(--text-dim)' }}
          >
            <PanelLeft size={16} strokeWidth={1.5} />
          </button>
        </div>

        {/* Nav Items */}
        <div className="flex-1 overflow-y-auto py-2 flex flex-col gap-[2px] hide-scrollbar select-none">

          <NavItem
            name="Home"
            href="/"
            active={pathname === '/'}
            iconNode={<img src="https://optim-images.krea.ai/https---s-krea-ai-icons-HomeIcon-png-128.webp" alt="Home" className="w-full h-full object-contain" />}
          />

          <NavItem
            name="Train Lora"
            href="/train"
            iconNode={<img src="https://optim-images.krea.ai/https---s-krea-ai-icons-Train-png-128.webp" alt="Train Lora" className="w-full h-full object-contain" />}
          />

          <NavItem
            name="Node Editor"
            href="/nodes"
            active={pathname.startsWith('/nodes')}
            iconNode={<img src="https://optim-images.krea.ai/https---s-krea-ai-icons-NodeEditor-png-128.webp" alt="Node Editor" className="w-full h-full object-contain" />}
          />

          <NavItem
            name="Assets"
            href="/assets"
            iconNode={<img src="https://optim-images.krea.ai/https---s-krea-ai-icons-Assets-png-128.webp" alt="Assets" className="w-full h-full object-contain" />}
          />

          {!collapsed && (
            <div className="mt-5 px-5 py-2 text-[11px] font-semibold tracking-tight" style={{ color: 'var(--text-very-dim)' }}>
              Tools
            </div>
          )}

          <NavItem name="Image" href="/image" iconNode={<img src="https://optim-images.krea.ai/https---s-krea-ai-icons-imageV4-png-128.webp" alt="Image" className="w-full h-full object-contain" />} />
          <NavItem name="Video" href="/video" iconNode={<img src="https://optim-images.krea.ai/https---s-krea-ai-icons-videoV2-png-128.webp" alt="Video" className="w-full h-full object-contain" />} />
          <NavItem name="Enhancer" href="/enhance" iconNode={<img src="https://optim-images.krea.ai/https---s-krea-ai-icons-Enhance-png-128.webp" alt="Enhancer" className="w-full h-full object-contain" />} />
          <NavItem name="Nano Banana" href="/nano" iconNode={<img src="https://optim-images.krea.ai/https---s-krea-ai-icons-NanoBanana-png-128.webp" alt="Nano Banana" className="w-full h-full object-contain" />} />
          <NavItem name="Realtime" href="/realtime" iconNode={<img src="https://optim-images.krea.ai/https---s-krea-ai-icons-realtimeV2-png-128.webp" alt="Realtime" className="w-full h-full object-contain" />} />
          <NavItem name="Edit" href="/edit" iconNode={<img src="https://optim-images.krea.ai/https---s-krea-ai-icons-Edit-png-128.webp" alt="Edit" className="w-full h-full object-contain" />} />
          <NavItem name="More" dimText={true} iconNode={<MoreHorizontal size={16} style={{ color: 'var(--text-dim)' }} />} />

          {!collapsed && (
            <div className="mt-4 px-5 py-2 text-[11px] font-semibold tracking-tight" style={{ color: 'var(--text-very-dim)' }}>
              Sessions
            </div>
          )}
        </div>

        {/* Profile / Sign-in Footer */}
        <div className="p-3 mb-2 relative">
          {showProfileMenu && (
            <div
              className="absolute bottom-[calc(100%+10px)] left-3 w-[260px] rounded-[10px] shadow-2xl p-1 z-50"
              style={{ background: 'var(--bg-sidebar)', border: '1px solid var(--border-mid)' }}
            >
              <div className="px-3 py-2 text-[11px] font-semibold" style={{ color: 'var(--text-dim)' }}>
                Workspaces
              </div>

              <div
                className="mx-1 mb-1 p-2 rounded-md flex items-center gap-3 cursor-pointer"
                style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-focus)' }}
              >
                <div className="w-8 h-8 rounded-md flex items-center justify-center text-xs font-semibold" style={{ background: 'var(--bg-elevated-2)', color: 'var(--text-secondary)' }}>D</div>
                <div className="flex flex-col">
                  <span className="text-[13px] font-medium leading-tight" style={{ color: 'var(--text-primary)' }}>Default Workspace</span>
                  <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>Free</span>
                </div>
              </div>

              <div className="mx-1 px-2 py-2 flex items-center gap-3 rounded cursor-pointer transition-colors text-[13px] font-medium mb-1" style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}>
                <Plus size={14} className="ml-1" /> Add workspace
              </div>

              <div className="mx-1 mt-2 mb-1 p-2 rounded-md flex flex-col cursor-pointer" style={{ background: 'var(--bg-input)', border: '1px solid var(--border-mid)' }}>
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full border-2 border-green-800 ml-1.5 flex items-center justify-center relative">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.8)]"></div>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[12px] font-semibold leading-tight" style={{ color: 'var(--text-primary)' }}>100 Credits remaining</span>
                    <span className="text-[11px]" style={{ color: 'var(--text-dim)' }}>100 per day</span>
                  </div>
                </div>
              </div>

              <div className="mt-2 text-[13px] font-medium" style={{ color: 'var(--text-secondary)' }}>
                {[
                  { icon: ArrowUpRight, label: 'Upgrade plan' },
                  { icon: CreditCard, label: 'Buy credits' },
                  { icon: Settings, label: 'Settings' },
                  { icon: BarChart2, label: 'Usage Statistics', border: true },
                ].map(({ icon: Icon, label, border }) => (
                  <div
                    key={label}
                    className="px-3 py-1.5 rounded flex items-center gap-3 cursor-pointer mx-1 transition-colors"
                    style={border ? { borderBottom: '1px solid var(--border-subtle)', paddingBottom: 8, marginBottom: 4 } : {}}
                  >
                    <Icon size={14} className="ml-1" style={{ color: 'var(--text-dim)' }} /> {label}
                  </div>
                ))}
                <div
                  className="px-3 py-2 rounded flex items-center gap-3 cursor-pointer mx-1 mb-1"
                  onClick={() => signOut(() => router.push('/sign-in'))}
                >
                  <LogOut size={14} className="ml-1" style={{ color: 'var(--text-dim)' }} /> Log out
                </div>
              </div>
            </div>
          )}

          {!user ? (
            <button
              onClick={() => openSignIn()}
              className={cn(
                "w-full py-2 rounded-md text-[13px] font-semibold tracking-tight transition-colors",
                collapsed && "p-0 h-9 flex items-center justify-center"
              )}
              style={{ background: 'var(--bg-elevated)', color: 'var(--text-primary)', border: '1px solid var(--border-focus)' }}
            >
              {collapsed
                ? <div className="w-5 h-5 rounded font-bold text-[10px] flex items-center justify-center" style={{ background: 'var(--text-primary)', color: 'var(--bg-page)' }}>S</div>
                : "Sign in"
              }
            </button>
          ) : (
            <div
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className={cn("flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors", collapsed && "justify-center")}
              style={{ background: showProfileMenu ? 'var(--nav-item-bg-active)' : 'transparent' }}
            >
              <div
                className="w-8 h-8 rounded-[8px] shrink-0 font-bold flex items-center justify-center text-[13px]"
                style={{ background: 'var(--bg-elevated-2)', border: '1px solid var(--border-focus)', color: 'var(--text-primary)' }}
              >
                {user.firstName?.[0]?.toUpperCase() || 'G'}
              </div>
              {!collapsed && (
                <div className="flex flex-col truncate leading-tight mt-0.5">
                  <div className="text-[13px] font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                    {user.primaryEmailAddress?.emailAddress || 'User'}
                  </div>
                  <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>Free</div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
