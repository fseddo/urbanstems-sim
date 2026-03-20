import { createContext, useContext, useRef, useState, RefObject } from 'react';

type NavbarContextValue = {
  navbarRef: RefObject<HTMLElement | null>;
  shopOpen: boolean;
  setShopOpen: (open: boolean) => void;
};

const NavbarContext = createContext<NavbarContextValue | null>(null);

export const NavbarProvider = ({ children }: { children: React.ReactNode }) => {
  const navbarRef = useRef<HTMLElement | null>(null);
  const [shopOpen, setShopOpen] = useState(false);

  return (
    <NavbarContext.Provider value={{ navbarRef, shopOpen, setShopOpen }}>
      {children}
    </NavbarContext.Provider>
  );
};

export const useNavbar = () => {
  const context = useContext(NavbarContext);
  if (!context) {
    throw new Error('useNavbar must be used within NavbarProvider');
  }
  return context.navbarRef;
};

export const useShopDropdown = () => {
  const context = useContext(NavbarContext);
  if (!context) {
    throw new Error('useShopDropdown must be used within NavbarProvider');
  }
  return { shopOpen: context.shopOpen, setShopOpen: context.setShopOpen };
};
