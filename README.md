# 霧消温泉 - Mushou Onsen

地元の人々に愛される、日常の風景としての温泉街をブラウザ上に再現した3Dポートフォリオ作品です。有名な観光地ではない、どこか懐かしく親しみやすい「共通の温泉街」の空気を表現しています。

## ♨️ Overview
このプロジェクトは、3D空間における「情報の密度」と「アクセシビリティ（軽量さ）」の両立をテーマにしています。
緻密に作り込まれたローポリゴンモデルと、実写の画像を融合させ、ブラウザを開いた瞬間にその場所の温度や匂いを感じさせるような体験を目指しました。
また、テーマとは別に、世界観のコンセプトを忠実に再現できるように制作しました。

## 🛠 Tech Stack
- **Engine**: Three.js (WebGL)
- **Animation**: GSAP ( UI Interaction ets... )
- **Modeling**: Blockbench
- **Texture**: Photoshop
- **Deployment**: Netlify

## 🎨 Key Features
- **Authentic Atmosphere**: 共同浴場や閉まった商店など、生活感のある温泉街のディテール。
- **Optimized 3D Model**: モデル全体で949KBという、爆速の初期読み込みを実現。
- **Interactive UI**: スパム対策を施したメールアドレスのクリップボードコピー機能（GSAPによるフィードバックアニメーション付）。
- **Custom Character**: 作品の世界観に合わせたオリジナルキャラクターの配置。

## ⚡️ Technical Optimization
パフォーマンスの限界に挑み、特にモバイル環境での安定動作に注力しました。

- **VRAM Management (Crucial)**:
  - 一般的な「テクスチャのアトラス化（1枚まとめ）」が、かえって巨大なキャンバスによるメモリ消費（358MB）を招くことを突き止め、あえて個別のテクスチャとして管理する手法を採用。
  - 結果として、見た目の質感を維持したままVRAM消費を**124MB**まで劇的に削減し、スマートフォンでのブラウザクラッシュを回避しました。
- **High-Performance Rendering**:
  - `powerPreference: "high-performance"` の指定により、デバイスのGPU能力を最大限に引き出す設定を実装。
  - `stencil: false` などの最適化により、描画のオーバーヘッドを最小限に抑制。
- **Draco Compression**:
  - ジオメトリの最適化により、1MBを切るファイルサイズを実現。

## 🔗 Live Demo
https://mushou-onsen.netlify.app/

## License
© 2026 Shinya