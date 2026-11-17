import styles from "./CTABand.module.css";
import { ArrowRight, Play } from "lucide-react";

export default function CTABand() {
  return (
    <div className={styles.band}>
      <h2 className={styles.title}>Ready to Transform Your Salon?</h2>
      <p className={styles.sub}>
        Join 10,000+ salon owners who&apos;ve replaced paper registers, DM chaos, and cash
        counting with Salon Central.
      </p>
      <div className={styles.btns}>
        <a href="/pricing" className={`btn btn-primary btn-lg ${styles.lightBtn}`}>
          <ArrowRight size={18} />
          Get Started Now
        </a>
        <a href="#" className={`btn btn-outline btn-lg ${styles.ghostBtn}`}>
          <Play size={16} />
          Book a Live Demo
        </a>
      </div>
    </div>
  );
}
