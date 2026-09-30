import { createRoot } from 'react-dom/client';
import ForestScene from '../src/components/ForestScene';
import './social-card.css';

createRoot(document.getElementById('card')!).render(
  <div className="card">
    <div className="copy">
      <p>給國小三年級的你 · 免費 3D 數學遊戲</p>
      <h1>暖暖森林</h1>
      <h2>三位數減法冒險</h2>
      <div className="line" />
      <p className="tagline">
        動動手，想一想。
        <br />
        每一次嘗試，都讓森林更溫暖。
      </p>
      <div className="signature">© 2026 Will 保哥</div>
    </div>
    <div className="scene">
      <span className="sun" />
      <ForestScene mode="forest" />
    </div>
  </div>,
);
