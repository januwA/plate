import React, { useEffect } from 'react';
import { Link, useLoaderData, useNavigate, createBrowserRouter, RouterProvider, Outlet } from 'react-router-dom'
import { Breadcrumb, Button, Layout, Menu, theme } from 'antd';
const { Header, Content, Sider } = Layout;

const apps = import.meta.glob('./apps/*/main.tsx', { eager: true });

const routeData = Object.keys(apps).map((path) => {
  // 从路径中提取目录名称，例如 "./apps/home/main.tsx" -> "home"
  const directoryName = path.split('/')[2];

  // 格式化路由路径，通常使用小写
  const routePath = `/${directoryName.toLowerCase()}`;

  // console.log(path, directoryName, routePath)

  // 获取页面的内容
  // @ts-ignore
  const { Settings } = apps[path];

  if (Settings.load && typeof Settings.load === 'function') {
    Settings.load();
  }

  return {
    path: routePath,
    directoryName,
    Settings,
  };
});

const TopRouters = routeData.filter(link => !link.Settings.menu_items)
const MenuRouters = routeData.filter(link => link.Settings.menu_items)

// 主布局组件
const MainLayout: React.FC = () => {
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  return (
    <Layout style={{ height: '100%' }}>
      <Header style={{ display: 'flex', alignItems: 'center' }}>
        <div className="demo-logo" />
        <Menu
          theme="dark"
          mode="horizontal"
          defaultSelectedKeys={['2']}
          items={[]}
          style={{ flex: 1, minWidth: 0 }}
        />
      </Header>
      <Layout>
        <Sider width={200} style={{ background: colorBgContainer }}>
          <Menu
            mode="inline"
            defaultSelectedKeys={['1']}
            defaultOpenKeys={['sub1']}
            style={{ height: '100%', borderInlineEnd: 0 }}
            items={
              [
                {
                  key: '/',
                  label: <Link to='/'>主页</Link>,
                },
                ...MenuRouters.map((link) => {
                  return link.Settings.menu_items;
                }).flat()
              ]
            }
          />
        </Sider>
        <Layout style={{ padding: '0 24px 24px' }}>
          {/* <Breadcrumb
    items={[{ title: 'Home' }, { title: 'List' }, { title: 'App' }]}
    style={{ margin: '16px 0' }}
  /> */}
          <Content
            style={{
              padding: 24,
              margin: 0,
              minHeight: 280,
              background: colorBgContainer,
              borderRadius: borderRadiusLG,
            }}
          >
            <Outlet />
          </Content>
        </Layout>
      </Layout>
    </Layout>
  );
};

// 创建路由配置
const router = createBrowserRouter([
  // 顶部路由（不需要菜单的路由）
  ...TopRouters.map((link) => link.Settings.route),
  // 主布局路由
  {
    path: '/',
    element: <MainLayout />,
    children: [
      {
        index: true,
        element: <Dashboard />
      },
      // 菜单路由
      ...MenuRouters.map((link) => link.Settings.route)
    ]
  }
]);

const App: React.FC = () => {
  return <RouterProvider router={router} />;
};

function Dashboard() {
  const navigate = useNavigate();
  useEffect(() => {
    console.log(localStorage.getItem("LOGIN_PATH"));
  }, [])
  return <div>
    <h1>仪表盘</h1>
    <Button onClick={() => navigate(localStorage.getItem("LOGIN_PATH") || "")}>to login</Button>
  </div>
}

export default App
