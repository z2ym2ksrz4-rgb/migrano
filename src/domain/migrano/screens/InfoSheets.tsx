import { useTranslation } from "react-i18next";
import { Capacitor } from "@capacitor/core";
import { Sheet } from "@/core/ui";
import { useSettings } from "@/core/settings";
import { useUi } from "../store";
import { PainStar } from "../components/PainStar";

/** Explainers opened from several places: what medication days are, and how to add the widget. */
export function InfoSheets() {
  const { t } = useTranslation();
  const which = useUi((s) => s.infoSheet);
  const openInfo = useUi((s) => s.openInfo);
  const threshold = useSettings((s) => s.medThreshold);
  const close = () => openInfo(null);
  const ios = Capacitor.getPlatform() !== "android";

  return (
    <>
      <Sheet open={which === "medDays"} onClose={close} title={t("medDays.title")}>
        <p>{t("medDays.what")}</p>
        <p>{t("medDays.why")}</p>
        <div className="card col">
          <strong>{t("medDays.yourLimit", { n: threshold })}</strong>
          <span className="muted small">{t("medDays.limitHint")}</span>
        </div>
        <p className="disclaimer">{t("medDays.disclaimer")}</p>
        <button className="cta" onClick={close}>{t("common.done")}</button>
      </Sheet>

      <Sheet open={which === "widget"} onClose={close} title={t("widget.title")}>
        <div className="widget-preview">
          <div className="wp-tile"><PainStar size={40} color="#FFF4EC" core="#D63E3E" /><span>{t("widget.attackNow")}</span></div>
          <div className="wp-text"><strong>{t("widget.previewLine1")}</strong><span className="muted small">{t("widget.previewLine2")}</span></div>
        </div>
        <p className="muted">{t("widget.intro")}</p>
        <ol className="steps">
          {(t(ios ? "widget.stepsIos" : "widget.stepsAndroid", { returnObjects: true }) as string[]).map((s, i) => <li key={i}>{s}</li>)}
        </ol>
        {ios && <p className="muted small">{t("widget.lockscreen")}</p>}
        <button className="cta" onClick={close}>{t("common.done")}</button>
      </Sheet>
    </>
  );
}
