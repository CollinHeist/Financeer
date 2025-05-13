export type SiteConfig = typeof siteConfig;

export const siteConfig = {
  name: "Financeer",
  description: "Comprehensive financial management tool",
  navItems: [
    {
      label: "Home",
      href: "/",
    },
    {
      label: "Accounts",
      href: "/accounts",
    },
    {
      label: "Expenses",
      href: "/expenses",
    },
    {
      label: "Transactions",
      href: "/transactions",
    },
  ],
  links: {},
};
