import { useTranslation } from "react-i18next";
import { PainStar } from "./PainStar";

/** The little mock of the home-screen widget, shared by the onboarding intro and the settings guide. */
export function WidgetPreview() {
  const { t } = useTranslation();
  return (
    <div className="widget-preview">
      <div className="wp-tile"><PainStar size={40} color="#FFF4EC" core="#D63E3E" /><span>{t("widget.attackNow")}</span></div>
      <div className="wp-text"><strong>{t("widget.previewLine1")}</strong><span className="muted small">{t("widget.previewLine2")}</span></div>
    </div>
  );
}
