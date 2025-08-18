import React, { useState } from 'react';
import '../styles/navigation.css';

const Navigation = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('home');

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const scrollToSection = (sectionId) => {
    setActiveSection(sectionId);
    setIsMenuOpen(false);
    
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <nav className="navigation">
      <div className="nav-container">
        <div className="nav-logo">
          <h2>🌐 Web Capture</h2>
        </div>
        
        <div className={`nav-menu ${isMenuOpen ? 'active' : ''}`}>
          <button 
            className={`nav-item ${activeSection === 'home' ? 'active' : ''}`}
            onClick={() => scrollToSection('home')}
          >
            🏠 Home
          </button>
          <button 
            className={`nav-item ${activeSection === 'about' ? 'active' : ''}`}
            onClick={() => scrollToSection('about')}
          >
            ℹ️ About
          </button>
          <button 
            className={`nav-item ${activeSection === 'api' ? 'active' : ''}`}
            onClick={() => scrollToSection('api')}
          >
            🔌 API
          </button>
          <button 
            className={`nav-item ${activeSection === 'blog' ? 'active' : ''}`}
            onClick={() => scrollToSection('blog')}
          >
            📝 Blog
          </button>
          <button 
            className={`nav-item ${activeSection === 'contact' ? 'active' : ''}`}
            onClick={() => scrollToSection('contact')}
          >
            📧 Contact
          </button>
        </div>
        
        <div className="nav-toggle" onClick={toggleMenu}>
          <span className={`hamburger ${isMenuOpen ? 'active' : ''}`}></span>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
