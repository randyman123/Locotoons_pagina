import { SITE } from '../../config/site.config';
import { BUSINESS } from '../../config/business.config';

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="footer-block">
        <strong>{SITE.name}</strong>
        <span>{SITE.footer.description}</span>
        <span>{SITE.footer.tagline}</span>
      </div>
      <div className="footer-block">
        <strong>Contacto</strong>
        <a href={BUSINESS.contact.whatsappUrl} target="_blank" rel="noreferrer">
          WhatsApp: {BUSINESS.contact.whatsappDisplay}
        </a>
        <a href={BUSINESS.contact.instagramUrl} target="_blank" rel="noreferrer">
          Instagram: @{BUSINESS.contact.instagram}
        </a>
        <a href={`mailto:${BUSINESS.contact.email}`}>Correo: {BUSINESS.contact.email}</a>
      </div>
      <div className="footer-block">
        <strong>Tienda</strong>
        <span>{SITE.footer.storeNote1}</span>
        <span>{SITE.footer.storeNote2}</span>
      </div>
    </footer>
  );
}
