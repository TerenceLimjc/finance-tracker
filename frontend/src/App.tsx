import { ConfigProvider, App as AntApp } from 'antd';
import { RouterProvider, createBrowserRouter } from 'react-router-dom';
import { AppLayout } from '@/components/common/Layout/AppLayout';
import { DashboardPage } from '@/pages/DashboardPage';
import { UploadsPage } from '@/pages/UploadsPage';
import { theme } from '@/styles/theme';

const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'uploads', element: <UploadsPage /> },
    ],
  },
]);

export default function App() {
  return (
    <ConfigProvider theme={theme}>
      <AntApp>
        <RouterProvider router={router} />
      </AntApp>
    </ConfigProvider>
  );
}
