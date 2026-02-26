// Mock for SVG files imported as React components (via ?react suffix)
const React = require('react');
const SvgMock = (props) => React.createElement('svg', props);
SvgMock.displayName = 'SvgMock';
module.exports = { ReactComponent: SvgMock, default: 'test-file-stub' };
