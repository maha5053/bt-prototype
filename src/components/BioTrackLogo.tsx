import { NavLink } from 'react-router-dom'

type BioTrackLogoProps = {
  className?: string
}

/** Макет логотипа: символ «путь + жизнь» (линия трека и лист/капля). */
export function BioTrackLogo({ className = '' }: BioTrackLogoProps) {
  return (
    <NavLink
      to="/"
      className={`group flex shrink-0 items-center gap-2.5 rounded-md outline-none ring-slate-400 focus-visible:ring-2 ${className}`}
      aria-label="BioTrack — на главную"
    >
      <span className="relative flex size-9 items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br from-emerald-600 to-teal-700 shadow-sm ring-1 ring-emerald-700/20">
        <svg
          viewBox="0 0 32 32"
          className="size-7 text-white/95"
          aria-hidden
        >
          <path
            fill="currentColor"
            d="M8 22c2-6 6-10 12-12 .5 2-1 5.5-4 7.5C14 19 11 21 8 22z"
            opacity=".9"
          />
          <path
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            d="M6 10c4 1 8 5 10 12M10 8c5 2 9 7 10 14"
            opacity=".55"
          />
        </svg>
      </span>
      <span className="hidden text-[1.05rem] font-semibold tracking-tight sm:inline">
        <span className="text-emerald-700 group-hover:text-emerald-800">Bio</span>
        <span className="text-slate-800">Track</span>
      </span>
    </NavLink>
  )
}
