
import './Header.css';

const Header = () => {
  return (
    <header className="header">
      <div className="header-container">
        <a href="/" className="header-logo">
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            backgroundColor: 'var(--primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <span style={{ color: 'var(--text-white)', fontWeight: '700', fontSize: 'var(--text-sm)' }}>CP</span>
          </div>
          CityPulse
        </a>
        
        {/* Desktop Navigation */}
        <nav className="header-nav">
          <a href="#features" className="header-nav-link">Features</a>
          <a href="#about" className="header-nav-link">About</a>
        </nav>
        
        <div className="header-actions">
          <a href="/login" className="header-btn header-btn-login">
            🔒 Login
          </a>
          <a href="/signup" className="header-btn header-btn-signup">
            Sign Up
          </a>
        </div>
      </div>
    </header>
  );
};

export default Header;
