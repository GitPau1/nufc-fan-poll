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

      <div aria-hidden="true" className="flex-1 px-4 pb-24 pt-4">
        <div className="h-[252px] overflow-hidden rounded-lg bg-surface shadow-w200">
          <div className="h-full animate-skeleton bg-disabled" />
        </div>

        <div className="mt-3 overflow-hidden rounded-lg border border-border bg-surface p-px">
          <div className="flex px-3 pt-4">
            <div className="h-8 flex-1 border-b border-primary" />
            <div className="h-8 flex-1 border-b border-border" />
            <div className="h-8 flex-1 border-b border-border" />
          </div>

          <div className="divide-y divide-border">
            {[0, 1, 2].map(index => (
              <div key={index} className="flex h-32 items-center gap-4 py-4 pl-3 pr-5">
                <div className="h-24 w-24 shrink-0 overflow-hidden rounded-md bg-disabled">
                  <div className="h-full w-full animate-skeleton" />
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-3">
                  <div className="h-5 w-16 rounded-pill bg-disabled">
                    <div className="h-full w-full animate-skeleton rounded-pill" />
                  </div>
                  <div className="h-4 w-4/5 rounded-pill bg-disabled">
                    <div className="h-full w-full animate-skeleton rounded-pill" />
                  </div>
                  <div className="h-3 w-3/5 rounded-pill bg-disabled">
                    <div className="h-full w-full animate-skeleton rounded-pill" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <span className="sr-only">페이지를 불러오는 중</span>
    </main>
  )
}
