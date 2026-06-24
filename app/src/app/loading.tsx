export default function Loading() {
  return (
    <main
      role="status"
      aria-label="페이지를 불러오는 중"
      className="mx-auto flex min-h-screen w-full max-w-[480px] flex-col bg-background"
    >
      <div className="h-1 w-full overflow-hidden bg-disabled">
        <div className="h-full w-1/2 animate-[loading-bar_1s_ease-in-out_infinite] rounded-r-pill bg-primary" />
      </div>

      <div aria-hidden="true" className="flex-1" />

      <span className="sr-only">페이지를 불러오는 중</span>
    </main>
  )
}
