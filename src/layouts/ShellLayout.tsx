import { useEffect, useId, useState } from 'react'
import type { ReactNode } from 'react'
import clsx from 'clsx'
import { SidebarNav } from '../components/SidebarNav'

interface ShellLayoutProps {
  title: string
  items: { label: string; to: string; icon?: string; badge?: string }[]
  userName?: string
  documentTitle: string
  backgroundClassName: string
  children: ReactNode
}

export function ShellLayout({
  title,
  items,
  userName,
  documentTitle,
  backgroundClassName,
  children,
}: ShellLayoutProps) {
  const [navOpen, setNavOpen] = useState(false)
  const dialogTitleId = useId()

  useEffect(() => {
    document.title = documentTitle
  }, [documentTitle])

  useEffect(() => {
    if (!navOpen) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setNavOpen(false)
    }

    window.addEventListener('keydown', onKeyDown)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      window.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previousOverflow
    }
  }, [navOpen])

  return (
    <div className={clsx('flex min-h-screen-dvh overflow-hidden', backgroundClassName)}>
      <div className="hidden lg:block">
        <SidebarNav title={title} items={items} userName={userName} />
      </div>

      <div className="flex min-h-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-slate-100 bg-white/85 px-4 py-3 backdrop-blur lg:hidden">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setNavOpen(true)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50"
              aria-label="打开导航"
            >
              <span className="text-xl leading-none" aria-hidden>
                ≡
              </span>
            </button>
            <div className="flex items-center gap-2">
              <img
                src="/logo.png"
                alt="大用问证"
                className="h-7 w-7 select-none"
                draggable={false}
              />
              <span className="text-sm font-semibold text-ink">大用问证</span>
            </div>
          </div>
          <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">
            {title}
          </span>
        </header>

        <main className="flex min-h-0 flex-1 flex-col overflow-hidden p-4 sm:p-6 lg:p-8">
          <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">{children}</div>
        </main>
      </div>

      <div
        className={clsx(
          'fixed inset-0 z-40 lg:hidden',
          navOpen ? 'pointer-events-auto' : 'pointer-events-none',
        )}
        aria-hidden={!navOpen}
      >
        <div
          className={clsx(
            'absolute inset-0 bg-slate-900/35 transition-opacity',
            navOpen ? 'opacity-100' : 'opacity-0',
          )}
          onClick={() => setNavOpen(false)}
        />
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby={dialogTitleId}
          className={clsx(
            'absolute inset-y-0 left-0 w-72 max-w-[85vw] border-r border-slate-100 bg-white shadow-2xl transition-transform',
            navOpen ? 'translate-x-0' : '-translate-x-full',
          )}
        >
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <span id={dialogTitleId} className="text-sm font-semibold text-ink">
              {title}导航
            </span>
            <button
              type="button"
              onClick={() => setNavOpen(false)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              aria-label="关闭导航"
            >
              <span className="text-lg leading-none" aria-hidden>
                ×
              </span>
            </button>
          </div>
          <SidebarNav
            title={title}
            items={items}
            userName={userName}
            onNavigate={() => setNavOpen(false)}
            className="h-[calc(100%-65px)] w-full rounded-none border-0 bg-white/95 p-5 shadow-none"
          />
        </div>
      </div>
    </div>
  )
}
