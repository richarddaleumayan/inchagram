/**
 * Footer Component
 * Legal disclaimers and project information
 */

import './Footer.css';

interface FooterProps {
  variant?: 'default' | 'minimal';
}

export function Footer({ variant = 'default' }: FooterProps) {
  const currentYear = new Date().getFullYear();

  if (variant === 'minimal') {
    return (
      <footer className="app-footer app-footer-minimal">
        <p className="footer-disclaimer">
          This is an educational hobby project. Not affiliated with Instagram or Meta.
        </p>
      </footer>
    );
  }

  return (
    <footer className="app-footer">
      <div className="footer-content">
        <div className="footer-section">
          <h3 className="footer-heading">Disclaimer</h3>
          <p className="footer-text">
            <strong>Inchagram</strong> is an independent educational and hobby project created for learning purposes only.
          </p>
          <p className="footer-text">
            This project is <strong>not affiliated with, endorsed by, or connected to Instagram, Meta Platforms, Inc., or any of its subsidiaries or affiliates</strong>.
          </p>
        </div>

        <div className="footer-section">
          <h3 className="footer-heading">Educational Purpose</h3>
          <p className="footer-text">
            This application is developed as a personal learning project to practice web development, software engineering, and modern technology stacks.
          </p>
          <p className="footer-text">
            All content, features, and functionality are original implementations created for educational purposes.
          </p>
        </div>

        <div className="footer-section">
          <h3 className="footer-heading">Intellectual Property</h3>
          <p className="footer-text">
            The name "Instagram" and any related trademarks, logos, or brand elements are the property of Meta Platforms, Inc.
          </p>
          <p className="footer-text">
            No copyright or trademark infringement is intended. This project does not claim any ownership of Instagram's intellectual property.
          </p>
        </div>

        <div className="footer-bottom">
          <p className="footer-copyright">
            © {currentYear} Inchagram Team. This is a non-commercial educational project.
          </p>
          <p className="footer-legal">
            Licensed under the MIT License. See project repository for details.
          </p>
        </div>
      </div>
    </footer>
  );
}
