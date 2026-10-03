import { useEffect, useState } from 'react'
import { DndContext, DragOverlay, MouseSensor, TouchSensor, useSensor, useSensors, type DragEndEvent, type DragStartEvent } from '@dnd-kit/core'
import { useBook } from './store'
import { Book } from './components/Book'
import { CompanionLab } from './components/CompanionLab'
import { Settings } from './components/Settings'
import { Side } from './components/Side'
import { TaskCard } from './components/TaskCard'
import { TaskSheet } from './components/TaskSheet'
import { TopBar } from './components/TopBar'

export function App() {
  const tasks = useBook((s) => s.data.tasks)
  const plan = useBook((s) => s.plan)
  const [dragging, setDragging] = useState<string | null>(null)
  const [lab, setLab] = useState(location.hash.startsWith('#lab'))

  useEffect(() => {
    const onHash = (): void => setLab(location.hash.startsWith('#lab'))
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  // A mouse drags after a small move; a finger after a short press, so a swipe still scrolls.
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 8 } })
  )

  const start = (event: DragStartEvent): void => setDragging(String(event.active.id))
  const end = (event: DragEndEvent): void => {
    setDragging(null)
    const target = event.over?.id
    if (typeof target === 'string' && target.startsWith('day:')) plan(String(event.active.id), target.slice(4))
  }

  const dragged = dragging ? tasks.find((task) => task.id === dragging) : undefined

  if (lab) return <CompanionLab key={location.hash} />

  return (
    <DndContext sensors={sensors} onDragStart={start} onDragEnd={end} onDragCancel={() => setDragging(null)}>
      <div className="desk flex h-full flex-col">
        <TopBar />
        <main className="flex min-h-0 flex-1 gap-7 px-7 pb-7">
          <Side />
          <Book />
        </main>
      </div>
      <DragOverlay dropAnimation={null}>{dragged && <TaskCard task={dragged} place="overlay" />}</DragOverlay>
      <TaskSheet />
      <Settings />
    </DndContext>
  )
}
