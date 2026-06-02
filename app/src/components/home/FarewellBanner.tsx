'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import type { FarewellItem } from '@/lib/queries/farewells'

function isWelcome(type: FarewellItem['departure_type']) {
  return type === 'signing' || type === 'loan_in' || type === 'promotion' || type === 'loan_return'
}

export function FarewellBanner({ items }: { items: FarewellItem[] }) {
  const trackRef = useRef<HTMLDivElement>(null)
  const slideRefs = useRef<Array<HTMLAnchorElement | null>>([])
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    const track = trackRef.current
    if (!track) return

    function updateActiveIndex() {
      const currentTrack = trackRef.current
      if (!currentTrack) return

      const trackRect = currentTrack.getBoundingClientRect()
      const trackCenter = trackRect.left + trackRect.width / 2
      let closestIndex = 0
      let closestDistance = Number.POSITIVE_INFINITY

      slideRefs.current.forEach((slide, index) => {
        if (!slide) return
        const rect = slide.getBoundingClientRect()
        const distance = Math.abs(rect.left + rect.width / 2 - trackCenter)
        if (distance < closestDistance) {
          closestDistance = distance
          closestIndex = index
        }
      })

      setActiveIndex(closestIndex)
    }

    updateActiveIndex()
    track.addEventListener('scroll', updateActiveIndex, { passive: true })
    window.addEventListener('resize', updateActiveIndex)

    return () => {
      track.removeEventListener('scroll', updateActiveIndex)
      window.removeEventListener('resize', updateActiveIndex)
    }
  }, [items.length])

  return (
    <section className="px-4 pt-4">
      <div ref={trackRef} className="flex snap-x snap-mandatory overflow-x-auto rounded-lg scrollbar-hide">
        {items.map((farewell, index) => {
          const welcome = isWelcome(farewell.departure_type)
          const playerName = farewell.player?.name ?? (welcome ? '새로운 선수' : '떠나는 선수')
          const imageUrl = farewell.banner_image_url || farewell.player?.photo_url
          const clubText = farewell.destination_club
            ? `${welcome ? 'from' : 'to'} ${farewell.destination_club}`
            : `${welcome ? 'from' : 'to'} Free Agent`

          return (
            <Link
              key={farewell.id}
              ref={element => {
                slideRefs.current[index] = element
              }}
              href={`/farewells/${farewell.id}`}
              className="w-full flex-none snap-center"
            >
              <article className="relative aspect-[21/9] overflow-hidden rounded-lg bg-[#07111f] text-white">
                {imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={imageUrl} alt="" className="absolute inset-0 h-full w-full scale-110 object-cover blur-[2px]" />
                ) : (
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_15%,rgba(65,182,230,0.55),transparent_30%),linear-gradient(135deg,#07111f_0%,#12345a_48%,#0b1f38_100%)]" />
                )}
                <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.86)_0%,rgba(0,0,0,0.58)_42%,rgba(0,0,0,0.22)_100%)]" />
                <div className="absolute inset-0 bg-[linear-gradient(0deg,rgba(0,0,0,0.7)_0%,rgba(0,0,0,0.12)_55%,rgba(0,0,0,0.18)_100%)]" />
                <div className="absolute inset-x-4 bottom-4">
                  <p className="mb-2 inline-flex rounded-full border border-white/20 bg-black/25 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-white backdrop-blur">
                    {welcome ? 'Welcome' : 'Farewell'}
                  </p>
                  <div className="flex min-w-0 items-baseline gap-2">
                    <p className="min-w-0 truncate text-[26px] font-black leading-none tracking-[-0.04em] drop-shadow-[0_2px_12px_rgba(0,0,0,0.55)]">{playerName}</p>
                    <p className="shrink-0 text-[12px] font-bold text-white/82 drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)]">{clubText}</p>
                  </div>
                </div>
              </article>
            </Link>
          )
        })}
      </div>
      {items.length > 1 && (
        <div className="mt-3 flex justify-center gap-2">
          {items.map((item, index) => (
            <span
              key={item.id}
              className={`h-2 w-2 rounded-full transition-colors ${index === activeIndex ? 'bg-foreground' : 'bg-muted-foreground/35'}`}
            />
          ))}
        </div>
      )}
    </section>
  )
}
