import { useLang } from "../i18n";

function Footer() {
  const en = useLang() === "en";
  return (
    <footer className="footer">
      <div className="speaker" aria-hidden="true">
        <span />
        <span />
        <span />
        <span />
        <span />
        <span />
      </div>
      <div className="footer-text">
        <p className="copyright">
          © 2025{" "}
          <a href="mailto:wpsrrr@gmail.com" title="collab">
            yRwRy
          </a>{" "}
          · MIT License
        </p>
        <p className="disclaimer">
          {en
            ? "Pokémon and all related names and images are trademarks of Nintendo, Creatures, GAME FREAK, The Pokémon Company and Niantic. Data: PokeAPI, PvPoke, PokeMiners, TCGdex."
            : "Pokémon 及相關名稱、圖像之版權屬於 Nintendo、Creatures、GAME FREAK、The Pokémon Company 與 Niantic。資料來源：PokeAPI、PvPoke、PokeMiners、TCGdex。"}
        </p>
      </div>
    </footer>
  );
}

export default Footer;
