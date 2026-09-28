/**
 * The desktop layout's frame for the site's other pages (Shows, Listening,
 * Community, Booking): the same file strip as a band file on top, and a
 * re-theme of the page underneath through its colour variables (sysfile in
 * bandfile.css). The pages themselves, and all their logic, are unchanged.
 */
import type { ReactNode } from 'react'
import { pad } from './BandFile'
import './bandfile.css'

export default function SysFile({ no, file, meta, children }: { no: number; file: string; meta?: string; children: ReactNode }) {
  return (
    <article className="bf sysfile" style={{ ['--bf-accent' as string]: '#8fa0ff' }}>
      <div className="bf-strip">
        <span className="bf-strip-tag">SYS {pad(no)}</span>
        <span>{file}</span>
        <span className="bf-strip-fill" aria-hidden />
        {meta && <span>{meta}</span>}
      </div>
      {children}
    </article>
  )
}
