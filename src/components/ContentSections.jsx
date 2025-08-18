import React from 'react';

const ContentSections = () => {
  return (
    <div className="content-sections">
      {/* About Section */}
      <section id="about" className="section about-section">
        <div className="section-container">
          <h2>ℹ️ About Web Capture</h2>
          <div className="about-content">
            <div className="about-text">
              <p>
                Web Capture is a powerful web application that captures high-quality screenshots 
                of websites with advanced design analysis capabilities. Built with modern technologies 
                including React, Express, and Puppeteer.
              </p>
              <div className="features-grid">
                <div className="feature-card">
                  <h3>📸 Screenshot Capture</h3>
                  <p>High-quality screenshots with customizable dimensions and full-page capture</p>
                </div>
                <div className="feature-card">
                  <h3>🎨 Design Analysis</h3>
                  <p>Extract color palettes and font information from any website</p>
                </div>
                <div className="feature-card">
                  <h3>⚡ Async Processing</h3>
                  <p>Handle multiple requests simultaneously with background job processing</p>
                </div>
                <div className="feature-card">
                  <h3>🛡️ Cloudflare Bypass</h3>
                  <p>Advanced anti-detection measures for protected websites</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* API Section */}
      <section id="api" className="section api-section">
        <div className="section-container">
          <h2>🔌 API Documentation</h2>
          <div className="api-content">
            <p>
              Web Capture provides a comprehensive REST API for integrating screenshot 
              capabilities into your applications.
            </p>
            
            <div className="api-endpoints">
              <h3>Key Endpoints</h3>
              <div className="endpoint-grid">
                <div className="endpoint-card">
                  <h4>POST /api/screenshot</h4>
                  <p>Synchronous screenshot capture with immediate results</p>
                  <code>{"{url, width, height, fullPage}"}</code>
                </div>
                <div className="endpoint-card">
                  <h4>POST /api/screenshot-async</h4>
                  <p>Asynchronous screenshot capture for long-running tasks</p>
                  <code>{"{url, options}"}</code>
                </div>
                <div className="endpoint-card">
                  <h4>GET /api/job/{'{id}'}</h4>
                  <p>Check job status and retrieve results</p>
                  <code>Returns job progress and final screenshot</code>
                </div>
                <div className="endpoint-card">
                  <h4>GET /api/health</h4>
                  <p>Health check endpoint for monitoring</p>
                  <code>Returns server status and uptime</code>
                </div>
              </div>
            </div>
            
            <div className="api-actions">
              <a href="/API_DOCUMENTATION.md" className="api-btn primary">
                📖 Full API Documentation
              </a>
              <a href="/API_QUICK_REFERENCE.md" className="api-btn secondary">
                🚀 Quick Reference
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Blog Section */}
      <section id="blog" className="section blog-section">
        <div className="section-container">
          <h2>📝 Blog & Updates</h2>
          <div className="blog-content">
            <div className="blog-posts">
              <article className="blog-post">
                <h3>🚀 Web Capture v2.0 Released</h3>
                <p className="post-meta">August 18, 2025 • New Features</p>
                <p>
                  We're excited to announce the release of Web Capture v2.0! This major update 
                  includes enhanced Cloudflare bypass capabilities, improved design analysis, 
                  and a completely redesigned user interface.
                </p>
                <div className="post-tags">
                  <span className="tag">Release</span>
                  <span className="tag">Features</span>
                  <span className="tag">UI/UX</span>
                </div>
              </article>
              
              <article className="blog-post">
                <h3>🎨 Advanced Color Extraction Techniques</h3>
                <p className="post-meta">August 15, 2025 • Technical</p>
                <p>
                  Learn about the sophisticated color extraction algorithms we use to analyze 
                  website design patterns and create comprehensive color palettes.
                </p>
                <div className="post-tags">
                  <span className="tag">Technical</span>
                  <span className="tag">Design</span>
                  <span className="tag">Algorithms</span>
                </div>
              </article>
              
              <article className="blog-post">
                <h3>⚡ Performance Optimization Guide</h3>
                <p className="post-meta">August 12, 2025 • Performance</p>
                <p>
                  Discover how we optimized Site Grabber for maximum performance, including 
                  async processing, memory management, and efficient screenshot capture.
                </p>
                <div className="post-tags">
                  <span className="tag">Performance</span>
                  <span className="tag">Optimization</span>
                  <span className="tag">Best Practices</span>
                </div>
              </article>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="section contact-section">
        <div className="section-container">
          <h2>📧 Contact Us</h2>
          <div className="contact-content">
            <div className="contact-info">
                             <div className="contact-card">
                 <h3>💬 Get in Touch</h3>
                 <p>
                   Have questions about Web Capture? Want to discuss integration possibilities? 
                   We'd love to hear from you!
                 </p>
               </div>
              
              <div className="contact-card">
                <h3>📧 Email</h3>
                <p>support@sitegrabber.com</p>
                <p>We typically respond within 24 hours</p>
              </div>
              
              <div className="contact-card">
                <h3>🐛 Bug Reports</h3>
                <p>Found an issue? Report it on our GitHub repository</p>
                <a href="https://github.com/goscha01/site-grabber" className="github-link">
                  GitHub Issues
                </a>
              </div>
              
              <div className="contact-card">
                <h3>💡 Feature Requests</h3>
                <p>Have an idea for a new feature? We're always open to suggestions!</p>
                <p>Share your ideas via email or GitHub</p>
              </div>
            </div>
            
            <div className="contact-form">
              <h3>📝 Send us a Message</h3>
              <form className="contact-form-content">
                <div className="form-group">
                  <label htmlFor="name">Name</label>
                  <input type="text" id="name" placeholder="Your name" />
                </div>
                <div className="form-group">
                  <label htmlFor="email">Email</label>
                  <input type="email" id="email" placeholder="your.email@example.com" />
                </div>
                <div className="form-group">
                  <label htmlFor="subject">Subject</label>
                  <input type="text" id="subject" placeholder="What's this about?" />
                </div>
                <div className="form-group">
                  <label htmlFor="message">Message</label>
                  <textarea id="message" rows="5" placeholder="Tell us more..."></textarea>
                </div>
                <button type="submit" className="submit-btn">
                  📤 Send Message
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ContentSections;
