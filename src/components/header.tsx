'use client'

import { useAppContext } from "@/app/app-provider";
import ButtonLogout from "@/components/button-logout";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import Box from "@mui/material/Box";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";

import Login from "@mui/icons-material/Login";
import PersonAdd from "@mui/icons-material/PersonAdd";
import Dashboard from "@mui/icons-material/Dashboard";
import MenuIcon from "@mui/icons-material/Menu";

import Link from "next/link";
import { useEffect, useState } from "react";

interface JwtPayload {
  roles: string[];
  sub: string;
}

export default function Header() {
  const { user: contextUser, isAuthenticated, roles: currentUserRoles } = useAppContext();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const [anchorElMain, setAnchorElMain] = useState<null | HTMLElement>(null);

  const [mainMenuItems, setMainMenuItems] = useState<
    Array<{ key: string; icon?: React.ReactNode; label: React.ReactNode; href?: string; component?: any }>
  >([]);

  useEffect(() => {
    const newMainMenuItems: Array<{ key: string; icon?: React.ReactNode; label: React.ReactNode; href?: string; component?: any }> = [];

    if (isAuthenticated) {
      if (currentUserRoles && currentUserRoles.includes("ROLE_ADMIN")) {
        newMainMenuItems.push({
          key: "members",
          icon: <Dashboard />,
          label: "Member management",
          href: "/members",
        });
      }
      newMainMenuItems.push({
        key: "job-management",
        icon: <Dashboard />,
        label: "Job management",
        href: "/jobs/order-list",
      });
      newMainMenuItems.push({
        key: "logout",
        label: <ButtonLogout />,
        component: 'li',
      });
    } else {
      newMainMenuItems.push(
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
    setMainMenuItems(newMainMenuItems);
  }, [currentUserRoles, isAuthenticated]);

  const handleOpenMainMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElMain(event.currentTarget);
  };
  const handleCloseMainMenu = () => {
    setAnchorElMain(null);
  };

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
          {isAuthenticated && contextUser && (
            <Typography variant="body1" sx={{ mr: 1, display: { xs: "none", sm: "block" }, color: "text.primary" }}>
              {contextUser.username} | {contextUser.title}
            </Typography>
          )}
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
              <MenuItem
                key={item.key}
                onClick={handleCloseMainMenu}
                component={item.href ? Link : item.component || 'li'}
                href={item.href || undefined}
              >
                {item.icon && <ListItemIcon>{item.icon}</ListItemIcon>}
                {item.label}
              </MenuItem>
            ))}
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
}