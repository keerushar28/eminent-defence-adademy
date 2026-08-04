"use client";
import { useState, useEffect } from "react";

export const useNavbar = () => {
  const [menuState, setMenuState] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const toggleMenu = () => setMenuState(!menuState);
  const closeMenu = () => setMenuState(false);

  return {
    menuState,
    isScrolled,
    toggleMenu,
    closeMenu,
  };
};
