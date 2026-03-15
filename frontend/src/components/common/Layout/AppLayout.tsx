import { Layout, Menu } from 'antd';
import { BarChartOutlined, UploadOutlined } from '@ant-design/icons';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';

const { Sider, Content } = Layout;

const NAV_ITEMS = [
    { key: '/', icon: <BarChartOutlined />, label: 'Dashboard' },
    { key: '/uploads', icon: <UploadOutlined />, label: 'Uploads' },
];

/**
 * AppLayout
 *
 * Fixed sidebar (dark theme) + scrollable content area.
 * Sidebar stays narrow; active item is highlighted automatically
 * by Ant Design Menu's selectedKeys prop.
 */
export function AppLayout() {
    const navigate = useNavigate();
    const { pathname } = useLocation();

    return (
        <Layout style={{ minHeight: '100vh' }}>
            <Sider
                width={180}
                style={{ position: 'fixed', height: '100vh', left: 0, top: 0, zIndex: 100 }}
            >
                <div
                    style={{
                        height: 48,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fff',
                        fontWeight: 700,
                        fontSize: 16,
                        letterSpacing: 0.5,
                        borderBottom: '1px solid rgba(255,255,255,0.1)',
                    }}
                >
                    Finance
                </div>
                <Menu
                    theme="dark"
                    mode="inline"
                    selectedKeys={[pathname === '/' ? '/' : `/${pathname.split('/')[1]}`]}
                    items={NAV_ITEMS}
                    onClick={({ key }) => navigate(key)}
                />
            </Sider>

            <Layout style={{ marginLeft: 180 }}>
                <Content style={{ padding: 24, minHeight: '100vh' }}>
                    <Outlet />
                </Content>
            </Layout>
        </Layout>
    );
}
