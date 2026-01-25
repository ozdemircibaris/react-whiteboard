export default function App() {
  return (
    <div className="flex h-screen w-screen flex-col">
      {/* Toolbar */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-gray-200 bg-white px-4">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-semibold">Whiteboard</h1>
        </div>
        <div className="flex items-center gap-2">{/* Tool buttons will go here */}</div>
        <div className="flex items-center gap-2">{/* Zoom controls will go here */}</div>
      </header>

      {/* Main canvas area */}
      <main className="relative flex-1 overflow-hidden bg-gray-50">
        {/* Canvas component will go here */}
        <div className="flex h-full items-center justify-center text-gray-400">
          Canvas will be rendered here
        </div>
      </main>
    </div>
  )
}
