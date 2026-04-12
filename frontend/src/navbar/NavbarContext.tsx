import { createContext, useContext, useRef, useState, RefObject } from 'react';

type NavbarContextValue = {
  navbarRef: RefObject<HTMLElement | null>;
  shopOpen: boolean;
  setShopOpen: (open: boolean) => void;
  searchOpen: boolean;
  setSearchOpen: (open: boolean) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  // Stable ref so SearchDropdown can update Navbar's input without subscribing to it
  setSearchInputRef: RefObject<(v: string) => void>;
};

const NavbarContext = createContext<NavbarContextValue | null>(null);

export const NavbarProvider = ({ children }: { children: React.ReactNode }) => {
  const navbarRef = useRef<HTMLElement | null>(null);
  const [shopOpen, setShopOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const setSearchInputRef = useRef<(v: string) => void>(() => {});

  return (
    <NavbarContext.Provider value={{ navbarRef, shopOpen, setShopOpen, searchOpen, setSearchOpen, searchTerm, setSearchTerm, setSearchInputRef }}>
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

export const useSearchDropdown = () => {
  const context = useContext(NavbarContext);
  if (!context) {
    throw new Error('useSearchDropdown must be used within NavbarProvider');
  }
  return {
    searchOpen: context.searchOpen,
    setSearchOpen: context.setSearchOpen,
    searchTerm: context.searchTerm,
    setSearchTerm: context.setSearchTerm,
    setSearchInputRef: context.setSearchInputRef,
  };
};
