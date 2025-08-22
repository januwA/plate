import { Link, Route, Routes } from 'react-router-dom'

const modules = import.meta.glob('./apps/*/main.tsx', { eager: true });

const routeData = Object.keys(modules).map((path) => {
  // 从路径中提取目录名称，例如 "./apps/home/main.tsx" -> "home"
  const directoryName = path.split('/')[2];

  // 格式化路由路径，通常使用小写
  const routePath = `/${directoryName.toLowerCase()}`;

  // console.log(path, directoryName, routePath)

  // 获取页面的内容
  // @ts-ignore
  const { Main, Settings } = modules[path];

  return {
    path: routePath,
    name: Settings.app_name || directoryName,
    component: Main,
  };
});


import React from 'react';
import { LaptopOutlined, NotificationOutlined, UserOutlined } from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { Breadcrumb, Layout, Menu, theme } from 'antd';

const { Header, Content, Sider } = Layout;

const App: React.FC = () => {
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  return (
    <Layout style={{ height: '100%' }}>
      {/* <Header style={{ display: 'flex', alignItems: 'center' }}>
        <div className="demo-logo" />
        <Menu
          theme="dark"
          mode="horizontal"
          defaultSelectedKeys={['2']}
          items={items1}
          style={{ flex: 1, minWidth: 0 }}
        />
      </Header> */}
      <Layout>
        <Sider width={200} style={{ background: colorBgContainer }}>
          <Menu
            mode="inline"
            defaultSelectedKeys={['1']}
            defaultOpenKeys={['sub1']}
            style={{ height: '100%', borderInlineEnd: 0 }}
            items={routeData.map((link) => {
              return {
                key: link.path,
                // icon: React.createElement(icon),
                label: <Link to={link.path}>{link.name}</Link>,
                // children: Array.from({ length: 4 }).map((_, j) => {
                //   const subKey = index * 4 + j + 1;
                //   return {
                //     key: subKey,
                //     label: `option${subKey}`,
                //   };
                // }),
              }
            })}
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
            <Routes>
              {routeData.map((link) => (
                <Route key={link.path} path={link.path} element={<link.component />} >
                </Route>
              ))}
            </Routes>
          </Content>
        </Layout>
      </Layout>
    </Layout>
  );
};

export default App
