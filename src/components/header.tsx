"use client";
import { useAppContext } from "@/app/app-provider";
import ButtonLogout from "@/components/button-logout";
import { ModeToggle } from "@/components/mode-toggle";
import { Layout, Menu, Avatar, Dropdown, Space, Typography, Button, theme } from "antd";
import { ItemType } from 'antd/es/menu/interface';
import Link from "next/link";
import { UserOutlined, LoginOutlined, UserAddOutlined, DashboardOutlined } from "@ant-design/icons";
import { useEffect, useState } from "react";

const { Header: AntHeader } = Layout;
const { Text } = Typography;

export default function Header() {
    const { user, roles } = useAppContext();
    const {
        token: { colorBgContainer },
    } = theme.useToken();
    const [menuItems, setMenuItems] = useState<ItemType[]>([]);

    useEffect(() => {
      console.log("Header: user =", user);
      console.log("Header: roles =", roles);
        if (user) {
            const baseMenuItems: ItemType[] = [
                {
                    key: "order-list",
                    icon: <DashboardOutlined />,
                    label: <Link href="/jobs/order-list">Quản lý công việc</Link>,
                }
            ];

            if (roles && roles.includes("ROLE_ADMIN")) {
                baseMenuItems.unshift({
                    key: "members",
                    icon: <DashboardOutlined />,
                    label: <Link href="/members">Quản lý member</Link>,
                });
            }

            setMenuItems(baseMenuItems);
        } else {
            setMenuItems([
                {
                    key: "login",
                    icon: <LoginOutlined />,
                    label: <Link href="/login">Đăng nhập</Link>,
                },
                {
                    key: "register",
                    icon: <UserAddOutlined />,
                    label: <Link href="/register">Đăng ký</Link>,
                },
            ]);
        }
    }, [user, roles]);

    const userDropdownMenuItems: ItemType[] = [
        {
            key: "1",
            label: <Link href="/settings">Cài đặt</Link>,
        },
        {
            type: "divider",
        },
        {
            key: "3",
            label: <ButtonLogout />,
        },
    ];

    return (
        <AntHeader
            style={{
                background: colorBgContainer,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "0 24px",
                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
            }}
        >
            <div className="demo-logo" style={{ fontWeight: "bold", fontSize: "1.2rem" }}>
                <Link href="/">Boranet</Link>
            </div>

            <Space size="large">
                <Menu
                    theme="light"
                    mode="horizontal"
                    items={menuItems}
                    style={{ flex: 1, minWidth: 0, borderBottom: "none" }}
                />

                {user && (
                    <Dropdown menu={{ items: userDropdownMenuItems }} placement="bottomRight">
                        <Space style={{ cursor: "pointer" }}>
                            <Avatar
                                size="default"
                                icon={<UserOutlined />}
                                style={{ backgroundColor: "#87d068" }}
                            />
                            <Text strong>{user.username}</Text>
                        </Space>
                    </Dropdown>
                )}

                <ModeToggle />
            </Space>
        </AntHeader>
    );
}