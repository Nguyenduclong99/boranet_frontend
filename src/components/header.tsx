"use client";

import { useAppContext } from "@/app/app-provider";
import ButtonLogout from "@/components/button-logout";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import Box from "@mui/material/Box";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Avatar from "@mui/material/Avatar";
import ListItemIcon from "@mui/material/ListItemIcon";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";

import AccountCircle from "@mui/icons-material/AccountCircle";
import Login from "@mui/icons-material/Login";
import PersonAdd from "@mui/icons-material/PersonAdd";
import Dashboard from "@mui/icons-material/Dashboard";
import MenuIcon from "@mui/icons-material/Menu";

import Link from "next/link";
import { useEffect, useState } from "react";
import Cookies from "js-cookie";
import { jwtDecode } from "jwt-decode";

interface JwtPayload {
    roles: string[];
    sub: string;
}

export default function Header() {
    const { user: contextUser } = useAppContext();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("md"));

    const [anchorElMain, setAnchorElMain] = useState<null | HTMLElement>(null); 
    const [anchorElUser, setAnchorElUser] = useState<null | HTMLElement>(null);

    const [mainMenuItems, setMainMenuItems] = useState<
        Array<{ key: string; icon: React.ReactNode; label: React.ReactNode; href?: string }>
    >([]);
    const [currentUserRoles, setCurrentUserRoles] = useState<string[]>([]);
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

    useEffect(() => {
        const accessToken = Cookies.get("accessToken");
        if (accessToken) {
            try {
                const decodedToken = jwtDecode<JwtPayload>(accessToken);
                if (decodedToken && decodedToken.roles) {
                    setCurrentUserRoles(decodedToken.roles);
                    setIsAuthenticated(true);
                } else {
                    setCurrentUserRoles([]);
                    setIsAuthenticated(false);
                }
            } catch (error) {
                console.error("Failed to decode token:", error);
                setCurrentUserRoles([]);
                setIsAuthenticated(false);
                Cookies.remove("accessToken");
            }
        } else {
            setCurrentUserRoles([]);
            setIsAuthenticated(false);
        }
    }, []);

    useEffect(() => {
        const baseMenuItems: Array<{ key: string; icon: React.ReactNode; label: React.ReactNode; href?: string }> = [];

        // Chỉ thêm các mục menu quản lý nếu người dùng đã đăng nhập
        if (isAuthenticated) {
            baseMenuItems.push({
                key: "order-list",
                icon: <Dashboard />,
                label: "Job management",
                href: "/jobs/order-list",
            });

            if (currentUserRoles.includes("ROLE_ADMIN")) {
                baseMenuItems.unshift({
                    key: "members",
                    icon: <Dashboard />,
                    label: "Member management",
                    href: "/members",
                });
            }
        }

        if (!isAuthenticated) {
            baseMenuItems.push(
                {
                    key: "login",
                    icon: <Login />,
                    label: "Login",
                    href: "/login",
                },
                {
                    key: "register",
                    icon: <PersonAdd />,
                    label: "Register",
                    href: "/register",
                }
            );
        }

        setMainMenuItems(baseMenuItems);
    }, [currentUserRoles, isAuthenticated]);

    const handleOpenMainMenu = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorElMain(event.currentTarget);
    };
    const handleCloseMainMenu = () => {
        setAnchorElMain(null);
    };

    const handleOpenUserMenu = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorElUser(event.currentTarget);
    };
    const handleCloseUserMenu = () => {
        setAnchorElUser(null);
    };

    const userDropdownMenuItems: Array<{ key: string; label: React.ReactNode; href?: string }> = [
        {
            key: "logout",
            label: <ButtonLogout />,
        },
    ];

    return (
        <AppBar position="static" sx={{ boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)", bgcolor: "white" }}>
            <Toolbar sx={{ justifyContent: "space-between", paddingX: { xs: 2, sm: 3 } }}>
                <Typography
                    variant="h6"
                    noWrap
                    component={Link}
                    href="/"
                    sx={{
                        mr: 2,
                        display: "flex",
                        fontWeight: 700,
                        letterSpacing: ".1rem",
                        color: "black",
                        textDecoration: "none",
                    }}
                >
                    BORANET
                </Typography>

                <Box sx={{ flexGrow: 0, display: "flex", alignItems: "center" }}>
                    <IconButton
                        size="large"
                        aria-label="main menu"
                        aria-controls="main-menu-appbar"
                        aria-haspopup="true"
                        onClick={handleOpenMainMenu}
                        color="inherit"
                        sx={{ color: "text.primary" }}
                    >
                        <MenuIcon />
                    </IconButton>
                    <Menu
                        id="main-menu-appbar"
                        anchorEl={anchorElMain}
                        anchorOrigin={{
                            vertical: "bottom",
                            horizontal: "right",
                        }}
                        keepMounted
                        transformOrigin={{
                            vertical: "top",
                            horizontal: "right",
                        }}
                        open={Boolean(anchorElMain)}
                        onClose={handleCloseMainMenu}
                    >
                        {mainMenuItems.map((item) => (
                            <MenuItem key={item.key} onClick={handleCloseMainMenu} component={Link} href={item.href || "#"}>
                                <ListItemIcon>
                                    {item.icon}
                                </ListItemIcon>
                                <Typography textAlign="center">{item.label}</Typography>
                            </MenuItem>
                        ))}
                    </Menu>

                    {isAuthenticated ? (
                        <>
                            {contextUser && (
                                <Typography variant="body1" sx={{ mr: 1, display: { xs: "none", sm: "block" }, color: "text.primary" }}>
                                    {contextUser.username}
                                </Typography>
                            )}
                            <IconButton
                                size="large"
                                aria-label="account of current user"
                                aria-controls="menu-appbar-user"
                                aria-haspopup="true"
                                onClick={handleOpenUserMenu}
                                color="inherit"
                            >
                                <Avatar sx={{ bgcolor: "#87d068" }}>
                                    <AccountCircle />
                                </Avatar>
                            </IconButton>
                            <Menu
                                sx={{ mt: "45px" }}
                                id="menu-appbar-user"
                                anchorEl={anchorElUser}
                                anchorOrigin={{
                                    vertical: "top",
                                    horizontal: "right",
                                }}
                                keepMounted
                                transformOrigin={{
                                    vertical: "top",
                                    horizontal: "right",
                                }}
                                open={Boolean(anchorElUser)}
                                onClose={handleCloseUserMenu}
                            >
                                {userDropdownMenuItems.map((item) => (
                                    <MenuItem
                                        key={item.key}
                                        onClick={handleCloseUserMenu}
                                        component={item.href ? Link : 'li'}
                                        href={item.href || undefined}
                                    >
                                        {item.label}
                                    </MenuItem>
                                ))}
                            </Menu>
                        </>
                    ) : (
                        null
                    )}
                </Box>
            </Toolbar>
        </AppBar>
    );
}