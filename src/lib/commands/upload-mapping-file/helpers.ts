export const isXcarchive = (path: string): boolean =>
	!!path.match(/\.xcarchive$/)

export const isDsym = (path: string): boolean => !!path.match(/\.dSYM$/)
