
import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LogIn, Menu } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isMobile = useIsMobile();

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <header className="sticky top-0 w-full py-4 px-4 sm:px-6 bg-white border-b border-gray-100 shadow-sm z-50">
      <div className="max-w-[1400px] mx-auto flex justify-between items-center">
        {/* Logo on left */}
        <div className="flex items-center">
          <Link to="/" className="flex items-center">
            <img 
              src="/lovable-uploads/0e406f53-235c-4c83-86e2-9d72f6a60e13.png" 
              alt="cBioPortal Logo" 
              className="h-8 sm:h-10" 
            />
          </Link>
        </div>

        {/* Mobile menu button */}
        {isMobile && (
          <button 
            onClick={toggleMobileMenu}
            className="md:hidden flex items-center p-2 rounded-md focus:outline-none"
          >
            <Menu className="h-6 w-6 text-gray-600" />
          </button>
        )}

        {/* Navigation options - desktop */}
        {!isMobile && (
          <div className="flex items-center space-x-3 sm:space-x-6">
            <Link 
              to="https://www.cbioportal.org/" 
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm sm:text-base text-gray-600 hover:text-blue-600 transition-colors font-medium"
            >
              Visit cBioPortal
            </Link>
            <Link to="/login">
              <Button variant="outline" className="text-sm sm:text-base flex items-center gap-2">
                <LogIn className="h-4 w-4" />
                Login
              </Button>
            </Link>
          </div>
        )}
      </div>

      {/* Mobile navigation menu */}
      {isMobile && mobileMenuOpen && (
        <div className="md:hidden absolute left-0 right-0 top-full bg-white border-b border-gray-100 shadow-md animate-fade-in">
          <div className="flex flex-col py-2 px-4 space-y-3">
            <Link 
              to="https://www.cbioportal.org/" 
              target="_blank"
              rel="noopener noreferrer"
              className="py-2 text-gray-600 hover:text-blue-600 transition-colors font-medium"
              onClick={() => setMobileMenuOpen(false)}
            >
              Visit cBioPortal
            </Link>
            <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
              <Button variant="outline" className="w-full justify-center flex items-center gap-2">
                <LogIn className="h-4 w-4" />
                Login
              </Button>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
