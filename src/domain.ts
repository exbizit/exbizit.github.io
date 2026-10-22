/** The Mary's domain shares the site, with its own landing page and default view. */
export const isMarysDomain = ['maryswhitelie.com', 'www.maryswhitelie.com'].includes(window.location.hostname)

export const landingBandSlug = isMarysDomain ? 'maryswhitelie' : 'hoster'

export function hosterDestination(pathname: string, search = '', hash = '') {
  if (!isMarysDomain || ['/', '/maryswhitelie', '/wallpaper'].includes(pathname)) return null
  return `https://hoster.band${pathname}${search}${hash}`
}
