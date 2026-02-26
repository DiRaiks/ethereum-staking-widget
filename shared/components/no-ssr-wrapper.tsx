import React from 'react';

// In Vite SPA there is no SSR — this is a simple passthrough wrapper.
const NoSSRWrapper = (props: { children: React.ReactNode }) => (
  <>{props.children}</>
);

export default NoSSRWrapper;
