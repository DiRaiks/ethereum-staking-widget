import { FC } from 'react';
import { ContainerProps } from '@lidofinance/lido-ui';
import { useConfig } from 'config';
import { useLocation } from 'react-router-dom';

import { MainStyle } from './styles';
import { EARN_PATH } from 'consts/urls';

export const Main: FC<ContainerProps> = (props) => {
  const { size = 'tight', ...rest } = props;
  const { featureFlags } = useConfig().externalConfig;
  const { pathname } = useLocation();
  // Needed only for holiday decor to be displayed correctly on earn page (holidayDecorEnabled)
  // Matches /earn/:vault/:action routes (3 path segments under /earn)
  const pathParts = pathname.split('/').filter(Boolean);
  const isEarnVault =
    pathParts[0] === EARN_PATH.replace('/', '') && pathParts.length === 3;

  return (
    <MainStyle
      size={size}
      forwardedAs="main"
      isHolidayDecorEnabled={featureFlags.holidayDecorEnabled}
      isEarnVault={isEarnVault}
      {...rest}
    />
  );
};
