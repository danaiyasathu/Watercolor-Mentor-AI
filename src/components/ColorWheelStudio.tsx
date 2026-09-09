import React, { useState } from 'react';
import { X, Sliders, Sparkles, Droplet, RefreshCw, Palette, Info } from 'lucide-react';

interface ColorWheelStudioProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ColorWheelStudio: React.FC<ColorWheelStudioProps> = ({ isOpen, onClose }) => {
  const [yellow, setYellow] = useState(50);
  const [red, setRed] = useState(30);
  const [blue, setBlue] = useState(20);
  const [water, setWater] = useState(30); // 0 (butter) to 80 (tea)

  if (!isOpen) return null;

  // Calculate mixed RGB
  const total = yellow + red + blue || 1;
  const yRatio = yellow / total;
  const rRatio = red / total;
  const bRatio = blue / total;

  // Subtractive CMY/RYB approx color mixing
  const rVal = Math.round(255 * (rRatio * 1.0 + yRatio * 0.9 + bRatio * 0.1));
  const gVal = Math.round(255 * (yRatio * 0.95 + bRatio * 0.6 + rRatio * 0.1));
  const bVal = Math.round(255 * (bRatio * 1.0 + rRatio * 0.4 + yRatio * 0.05));

  const opacity = Math.max(0.2, (100 - water) / 100);
  const mixedColorRgba = `rgba(${rVal}, ${gVal}, ${bVal}, ${opacity.toFixed(2)})`;
  const mixedColorHex = `#${rVal.toString(16).padStart(2, '0')}${gVal.toString(16).padStart(2, '0')}${bVal.toString(16).padStart(2, '0')}`;

  const presetRecipes = [
    { name: 'ส้มพีชละมุน', y: 60, r: 35, b: 5, w: 40, desc: 'เหลืองมาก + แดงน้อย + น้ำปานกลาง' },
    { name: 'เขียวใบตองสด', y: 70, r: 0, b: 30, w: 30, desc: 'เหลืองสด + ฟ้าสดใส' },
    { name: 'ม่วงลาเวนเดอร์', y: 5, r: 50, b: 45, w: 50, desc: 'แดงกุหลาบ + น้ำเงินอัลตรามารีน' },
    { name: 'เขียวมะกอก/ขี้ม้า', y: 50, r: 15, b: 35, w: 25, desc: 'เหลือง + น้ำเงิน + แดงนิดเดียวเพื่อดรอปสด' },
    { name: 'น้ำตาลดินเผา (Sienna)', y: 40, r: 40, b: 20, w: 20, desc: 'ส้มเข้ม + แตะน้ำเงินเป็นสีเงา' },
    { name: 'เทาเงาธรรมชาติ', y: 30, r: 35, b: 35, w: 60, desc: 'ผสมแม่สี 3 สีในสัดส่วนเท่า ๆ กัน' },
  ];

  const applyRecipe = (recipe: typeof presetRecipes[0]) => {
    setYellow(recipe.y);
    setRed(recipe.r);
    setBlue(recipe.b);
    setWater(recipe.w);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
      <div className="bg-[#FAF7F2] border border-[#E9E3D5] rounded-3xl max-w-2xl w-full max-h-[92vh] overflow-y-auto shadow-2xl p-6 sm:p-7 relative animate-in fade-in zoom-in-95 duration-200">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-[#737365] hover:text-[#2C2C2C] hover:bg-[#E9E3D5]/50 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-5 pr-8">
          <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#5A5A40] bg-[#E9E3D5]/60 border border-[#E9E3D5] px-2.5 py-0.5 rounded-full mb-1">
            <Palette className="w-3 h-3" />
            <span>ห้องทดลองผสมสี (Color Mixing Lab)</span>
          </div>
          <h2 className="font-serif italic font-bold text-xl text-[#5A5A40]">
            จำลองการผสมสีจากแม่สี 3 สี (บทที่ 4)
          </h2>
          <p className="text-xs text-[#737365] mt-0.5">
            ทดลองปรับสัดส่วนแม่สีและปริมาณน้ำเพื่อดูเฉดสีที่จะได้ก่อนลงมือผสมบนจานสีจริง
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Controls */}
          <div className="space-y-4 bg-[#FFF] border border-[#E9E3D5] rounded-2xl p-4 shadow-2xs">
            <h3 className="text-xs font-bold text-[#5A5A40] flex items-center gap-1.5 uppercase tracking-wider">
              <Sliders className="w-3.5 h-3.5 text-[#5A5A40]" />
              <span>ปรับสัดส่วนแม่สี & น้ำ</span>
            </h3>

            {/* Yellow */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-medium text-[#2C2C2C]">
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-yellow-400 border border-yellow-500" />
                  <span>เหลือง (Yellow)</span>
                </span>
                <span className="font-mono text-[#737365]">{yellow}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={yellow}
                onChange={(e) => setYellow(Number(e.target.value))}
                className="w-full accent-yellow-500 h-2 bg-[#FAF7F2] rounded-lg cursor-pointer"
              />
            </div>

            {/* Red / Magenta */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-medium text-[#2C2C2C]">
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 border border-rose-600" />
                  <span>แดง/ชมพู (Magenta/Red)</span>
                </span>
                <span className="font-mono text-[#737365]">{red}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={red}
                onChange={(e) => setRed(Number(e.target.value))}
                className="w-full accent-rose-500 h-2 bg-[#FAF7F2] rounded-lg cursor-pointer"
              />
            </div>

            {/* Blue / Cyan */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-medium text-[#2C2C2C]">
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-sky-500 border border-sky-600" />
                  <span>น้ำเงิน/ฟ้า (Cyan/Blue)</span>
                </span>
                <span className="font-mono text-[#737365]">{blue}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={blue}
                onChange={(e) => setBlue(Number(e.target.value))}
                className="w-full accent-sky-500 h-2 bg-[#FAF7F2] rounded-lg cursor-pointer"
              />
            </div>

            {/* Water */}
            <div className="space-y-1 pt-2 border-t border-[#E9E3D5]">
              <div className="flex justify-between text-xs font-medium text-[#2C2C2C]">
                <span className="flex items-center gap-1">
                  <Droplet className="w-3.5 h-3.5 text-[#5A5A40]" />
                  <span>ปริมาณน้ำ (Water Dilution)</span>
                </span>
                <span className="font-mono text-[#737365]">
                  {water > 50 ? 'ใสบาง (Tea)' : water > 20 ? 'พอดี (Milk)' : 'เข้มข้น (Butter)'}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="80"
                value={water}
                onChange={(e) => setWater(Number(e.target.value))}
                className="w-full accent-[#5A5A40] h-2 bg-[#FAF7F2] rounded-lg cursor-pointer"
              />
            </div>
          </div>

          {/* Live Pigment Swatch & Result */}
          <div className="space-y-4 flex flex-col justify-between">
            <div className="bg-[#FFF] border border-[#E9E3D5] rounded-2xl p-5 text-center shadow-2xs space-y-3">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#737365]">
                ตัวอย่างผลลัพธ์สีบนกระดาษ
              </span>

              <div
                className="w-full h-32 rounded-2xl border border-[#E9E3D5] shadow-inner flex items-center justify-center transition-all duration-300 relative overflow-hidden"
                style={{ backgroundColor: mixedColorRgba }}
              >
                <div className="absolute inset-0 bg-radial from-transparent to-black/5 pointer-events-none" />
                <div className="bg-white/95 px-3 py-1.5 rounded-full shadow-2xs text-xs font-mono font-semibold text-[#2C2C2C]">
                  {mixedColorHex.toUpperCase()}
                </div>
              </div>

              <p className="text-[11px] text-[#737365] leading-relaxed">
                💡 ผสมบนกระดาษจริง: ลองแตะสี 2 สีข้าง ๆ กันแล้วใช้น้ำดึงให้มาเจอกัน จะได้ประกายสีที่สดใส
              </p>
            </div>

            {/* Presets */}
            <div className="bg-[#FAF7F2] border border-[#E9E3D5] rounded-2xl p-3.5 space-y-2">
              <span className="text-xs font-semibold text-[#5A5A40] block uppercase tracking-wider">
                สูตรผสมสียอดนิยม:
              </span>
              <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                {presetRecipes.map((recipe, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => applyRecipe(recipe)}
                    className="p-1.5 rounded-lg bg-[#FFF] border border-[#E9E3D5] hover:border-[#5A5A40] text-[#2C2C2C] text-left truncate transition-colors"
                    title={recipe.desc}
                  >
                    ✨ {recipe.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-5 pt-3 border-t border-[#E9E3D5] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold text-white bg-[#5A5A40] hover:bg-[#464632] rounded-xl shadow-2xs"
          >
            ปิดหน้าต่างห้องผสมสี
          </button>
        </div>
      </div>
    </div>
  );
};
