import {
  Navbar as HeroUINavbar,
  NavbarContent,
  NavbarBrand,
  NavbarItem,
} from "@heroui/navbar";
import { link as linkStyles } from "@heroui/theme";
import NextLink from "next/link";
import clsx from "clsx";
import React from "react";

import { ThemeSwitch } from "@/components/theme-switch";
import { Logo } from "@/components/icons";
import { Separator } from "@/components/ui/separator";

const navigationItems = [
  { label: "Home", href: "/" },
  { label: "Accounts", href: "/accounts" },
  { label: "Expenses", href: "/expenses" },
  { label: "Income", href: "/income" },
  { label: "Transfers", href: "/transfers" },
  { label: "Transactions", href: "/transactions" },
];

export const Navbar = () => {
  return (
    <HeroUINavbar maxWidth="xl" position="sticky">
      <NavbarContent className="basis-1/5 sm:basis-full" justify="start">
        <NavbarBrand as="li" className="gap-3 max-w-fit">
          <NextLink className="flex justify-start items-center gap-1" href="/">
            <Logo />
            <p className="font-bold text-inherit">Financeer</p>
          </NextLink>
        </NavbarBrand>
        <ul className="hidden lg:flex gap-7 justify-start ml-2 items-center">
          {navigationItems.map((item, index) => (
            <React.Fragment key={item.href}>
              <NavbarItem>
                <NextLink
                  className={clsx(
                    linkStyles({ color: "foreground" }),
                    "data-[active=true]:text-primary data-[active=true]:font-medium"
                  )}
                  color="foreground"
                  href={item.href}
                >
                  {item.label}
                </NextLink>
              </NavbarItem>
              {(index === 0 || index === 4) && (
                <Separator orientation="vertical" className="h-6" />
              )}
            </React.Fragment>
          ))}
        </ul>
      </NavbarContent>

      <NavbarContent
        className="hidden sm:flex basis-1/5 sm:basis-full"
        justify="end"
      >
        <NavbarItem className="hidden sm:flex gap-2">
          <ThemeSwitch />
        </NavbarItem>
      </NavbarContent>
    </HeroUINavbar>
  );
};
