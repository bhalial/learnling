import { useEffect, useRef, type MouseEvent, type ReactNode } from 'react'

/** A native modal dialog: Escape, the backdrop and a tap outside all close it. */
export function Modal({
  open,
  onClose,
  label,
  width,
  children
}: {
  open: boolean
  onClose: () => void
  label: string
  width: number
  children: ReactNode
}) {
  const ref = useRef<HTMLDialogElement>(null)
  // Only a tap that also started outside closes: dragging a text selection out of a field must not.
  const pressedOutside = useRef(false)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) {
      dialog.showModal()
      // Start on the sheet itself rather than ringing its first button.
      dialog.focus()
    }
    if (!open && dialog.open) dialog.close()
  }, [open])

  // The backdrop belongs to the dialog element, so "outside" is measured against its box.
  const outside = (event: MouseEvent): boolean => {
    const box = ref.current!.getBoundingClientRect()
    return event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom
  }

  return (
    <dialog
      ref={ref}
      tabIndex={-1}
      onClose={onClose}
      onPointerDown={(event) => (pressedOutside.current = outside(event))}
      onClick={(event) => pressedOutside.current && outside(event) && ref.current?.close()}
      aria-label={label}
      style={{ width: `min(94vw, ${width}px)` }}
      className="m-auto max-h-[92vh] overflow-y-auto rounded-md border-0 bg-paper p-0 text-ink shadow-[0_30px_80px_rgb(0_0_0/0.6)] outline-none"
    >
      {open && children}
    </dialog>
  )
}

/**
 * The top of a sheet: its title, a close button and the ruled line under them. It sticks
 * while the sheet scrolls, so closing is always one tap away.
 */
export function SheetHeader({ closeLabel, onClose, children }: { closeLabel: string; onClose: () => void; children: ReactNode }) {
  return (
    <header className="page-rule sticky top-0 z-10 flex items-center justify-between gap-4 bg-paper pb-2.5 pt-6">
      <div className="min-w-0">{children}</div>
      <button type="button" onClick={onClose} aria-label={closeLabel} title={closeLabel} className="grid size-11 shrink-0 place-items-center rounded-full text-ink-soft hover:bg-ink/10 hover:text-ink">
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          <path d="M6 6 L18 18 M18 6 L6 18" />
        </svg>
      </button>
    </header>
  )
}
