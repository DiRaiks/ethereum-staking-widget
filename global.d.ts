interface Window {
  // see index.html for definition
  _paq: undefined | [string, ...unknown[]][];
}

declare module '*.svg' {
  // Plain SVG import returns URL string (Vite asset handling)
  const content: string;
  export default content;
}

declare module '*.svg?react' {
  // SVG imported with ?react suffix returns React component via vite-plugin-svgr
  const ReactComponent: React.FunctionComponent<React.ComponentProps<'svg'>>;
  export { ReactComponent };
  export default ReactComponent;
}
