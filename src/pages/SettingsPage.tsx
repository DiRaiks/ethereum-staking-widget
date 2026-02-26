import { FC } from 'react';

import { Layout } from 'shared/components';
import { SettingsForm } from 'features/settings/settings-form';

const SettingsPage: FC = () => {
  return (
    <Layout title="Settings">
      <SettingsForm />
    </Layout>
  );
};

export default SettingsPage;
