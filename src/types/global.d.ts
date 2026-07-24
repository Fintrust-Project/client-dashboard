/// <reference types="react" />
/// <reference types="react-dom" />

// Allow importing CSS files as side-effects in TypeScript
declare module '*.css' {
  const content: Record<string, string>
  export default content
}

// Allow importing images
declare module '*.png' {
  const src: string
  export default src
}
declare module '*.jpg' {
  const src: string
  export default src
}
declare module '*.svg' {
  const src: string
  export default src
}
