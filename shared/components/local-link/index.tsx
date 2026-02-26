import React, { FC, PropsWithChildren } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

import { config } from 'config';
import { LinkIpfs } from 'shared/components/link-ipfs';

type LocalLinkProps = {
  href: string;
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  onClick?: React.MouseEventHandler;
  [key: string]: unknown;
};

// TODO: make LocalLink support passing hash
// Currently, hash is not supported because LinkIpfs does not support it,
// since routing in IPFS is using hashes like this: /#/path

export const LocalLink: FC<PropsWithChildren<LocalLinkProps>> = (props) => {
  const [searchParams] = useSearchParams();
  const { href, ...restProps } = props;

  const extraQuery: Record<string, string> = {};
  // does not support duplicates ?ref=01234&ref=56789
  const ref = searchParams.get('ref');
  const embed = searchParams.get('embed');
  const app = searchParams.get('app');
  const theme = searchParams.get('theme');
  const earn = searchParams.get('earn');
  const forceAllowance = searchParams.get('forceAllowance');

  if (ref) extraQuery.ref = ref;
  if (embed) extraQuery.embed = embed;
  if (app) extraQuery.app = app;
  if (theme) extraQuery.theme = theme;
  if (earn) extraQuery.earn = earn;
  if (forceAllowance) extraQuery.forceAllowance = forceAllowance;

  if (typeof href === 'string') {
    if (config.ipfsMode) {
      return <LinkIpfs {...restProps} href={href} query={extraQuery} />;
    }

    const search =
      Object.keys(extraQuery).length > 0
        ? '?' + new URLSearchParams(extraQuery).toString()
        : '';

    return <Link {...restProps} to={href + search} />;
  }

  throw new Error('Prop href as object is not compatible');
};
