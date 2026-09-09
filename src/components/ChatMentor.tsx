import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Sparkles,
  Bot,
  User,
  Volume2,
  VolumeX,
  RotateCcw,
  Lightbulb,
  Loader2,
  CornerDownLeft,
} from 'lucide-react';
import { ChatMessage, UserProfile, Lesson } from '../types';

interface ChatMentorProps {
  messages: ChatMessage[];
  onSendMessage: (text: string) => Promise<void>;
  isLoading: boolean;
  currentLesson: Lesson;
  userProfile: UserProfile;
  soundEnabled: boolean;
}

export const ChatMentor: React.FC<ChatMentorProps> = ({
  messages,
  onSendMessage,
  isLoading,
  currentLesson,
  userProfile,
  soundEnabled,
}) => {
  const [inputText, setInputText] = useState('');
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isLoading) return;
    const text = inputText;
    setInputText('');
    onSendMessage(text);
  };

  const handleQuickQuestion = (question: string) => {
    if (isLoading) return;
    onSendMessage(question);
  };

  const handleSpeak = (id: string, text: string) => {
    try {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

      if (speakingMessageId === id) {
        window.speechSynthesis.cancel();
        setSpeakingMessageId(null);
        return;
      }

      window.speechSynthesis.cancel();
      // Strip markdown asterisks and hash symbols for smoother speech reading
      const cleanText = text.replace(/[*#_`>]/g, ' ');
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.lang = 'th-TH';
      utterance.rate = 0.95; // Gentle pace
      utterance.pitch = 1.0;

      utterance.onend = () => setSpeakingMessageId(null);
      utterance.onerror = () => setSpeakingMessageId(null);

      setSpeakingMessageId(id);
      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn('[SpeechSynthesis] Error speaking text:', err);
      setSpeakingMessageId(null);
    }
  };

  const quickQuestionsByLesson: Record<number, string[]> = {
    0: [
      'สีแบบหลอดกับแบบก้อนต่างกันอย่างไรครับ?',
      'พู่กันกลมกับพู่กันแบนใช้ต่างกันอย่างไร?',
      'ทำไมต้องใช้น้ำ 2 ถ้วยครับ?',
    ],
    1: [
      'ทำไมระบายแล้วสีเป็นรอยต่อ ไม่เรียบครับ?',
      'วิธีคุมน้ำไม่ให้กระดาษแฉะเกินไปทำอย่างไร?',
      'Graded wash ไล่สียังไงให้เนียนครับ?',
    ],
    2: [
      'เมื่อไหร่ควรใช้เปียกบนเปียก เมื่อไหร่ใช้เปียกบนแห้ง?',
      'กระดาษแห้งเร็วเกินไปตอนทำเปียกบนเปียก แก้อย่างไรครับ?',
    ],
    3: [
      'วาดยังไงให้ทรงกลมดูลอยมีมิติ 3D ครับ?',
      'จุดรับแสง (Highlight) ควรเว้นขาวอย่างไร?',
    ],
    4: [
      'วิธีผสมสีให้ได้สีเอิร์ธโทนหรือสีน้ำตาลนุ่ม ๆ ครับ?',
      'ทำไมสีที่ผสมถึงดูขุ่นเป็นโคลน (Muddy)?',
    ],
    5: [
      'วาดท้องฟ้ากับเมฆอย่างไรให้ดูนุ่มปุย?',
      'เทคนิค Dry brush ลากประกายน้ำทำอย่างไร?',
    ],
    6: [
      'พื้นที่ว่าง (Negative Space) สำคัญยังไงในสีน้ำ?',
      'วางจุดเด่นตามกฎสามส่วนอย่างไรครับ?',
    ],
    7: [
      'จะเลือกโทนสีสื่ออารมณ์ความรู้สึกอย่างไรดีครับ?',
      'รู้สึกเกร็งเวลาจะลงสีชิ้นใหญ่ แนะนำหน่อยครับ',
    ],
  };

  const currentQuickQuestions = quickQuestionsByLesson[currentLesson.id] || [
    'มีเคล็ดลับสำหรับผู้เริ่มต้นไหมครับ?',
    'ช่วยแนะนำเทคนิคประจำบทนี้หน่อยครับ',
  ];

  return (
    <div id="chat-mentor-panel" className="flex flex-col h-full bg-[#FFF] border border-[#E9E3D5] rounded-3xl overflow-hidden shadow-2xs">
      {/* Mentor Header */}
      <div className="bg-[#FAF7F2] border-b border-[#E9E3D5] px-4 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-[#5A5A40] flex items-center justify-center text-[#FDFBF7] shadow-2xs">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="font-serif italic font-bold text-xs text-[#5A5A40]">ครูสอนสีน้ำ</h3>
              <span className="w-2 h-2 rounded-full bg-[#5A5A40]" />
            </div>
            <p className="text-[10px] text-[#737365]">
              พร้อมตอบคำถาม & ให้กำลังใจตลอดการฝึกฝน
            </p>
          </div>
        </div>

        <div className="text-[10px] font-semibold uppercase tracking-wider text-[#5A5A40] bg-[#E9F5DB] border border-[#5A5A40]/20 px-2.5 py-0.5 rounded-full">
          {currentLesson.thaiTitle.split('—')[0].trim()}
        </div>
      </div>

      {/* Messages List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#FDFBF7]">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-[#888877] space-y-2">
            <Sparkles className="w-8 h-8 text-[#D9A066] animate-bounce" />
            <p className="text-xs text-[#5A5A40] font-semibold font-serif italic">
              สวัสดีครับคุณ {userProfile.name || 'ผู้เรียน'}
            </p>
            <p className="text-[11px] text-[#737365] max-w-xs leading-relaxed">
              ครูอยู่ที่นี่เสมอ ถามคำถามหรือปรึกษาเรื่องเทคนิค อุปกรณ์ หรือความรู้สึกได้เลยนะครับ
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-7 h-7 rounded-full bg-[#5A5A40] flex items-center justify-center text-[#FDFBF7] flex-shrink-0 text-xs mt-0.5 shadow-2xs">
                    <Bot className="w-3.5 h-3.5" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] sm:max-w-[78%] rounded-2xl p-3.5 text-xs leading-relaxed ${
                    isUser
                      ? 'bg-[#5A5A40] text-white rounded-br-xs shadow-2xs'
                      : 'bg-[#FFF] border border-[#E9E3D5] text-[#2C2C2C] rounded-bl-xs shadow-2xs'
                  }`}
                >
                  {/* Attached Images */}
                  {(() => {
                    const rawImgs =
                      msg.imageUrls && msg.imageUrls.length > 0
                        ? msg.imageUrls
                        : msg.imageUrl
                        ? [msg.imageUrl]
                        : [];
                    const imgs = rawImgs.filter(
                      (u): u is string => typeof u === 'string' && u.trim().length > 0
                    );
                    if (imgs.length === 0) return null;
                    if (imgs.length === 1) {
                      return (
                        <div className="mb-2.5 rounded-xl overflow-hidden border border-[#E9E3D5] bg-white max-h-48">
                          <img
                            src={imgs[0]}
                            alt="Uploaded homework"
                            className="w-full h-auto object-cover"
                          />
                        </div>
                      );
                    }
                    return (
                      <div className="mb-2.5 grid grid-cols-2 gap-1.5 rounded-xl overflow-hidden">
                        {imgs.map((im, i) => (
                          <div
                            key={i}
                            className="relative rounded-lg overflow-hidden border border-[#E9E3D5] bg-white aspect-4/3"
                          >
                            <img
                              src={im}
                              alt={`Homework ${i + 1}`}
                              className="w-full h-full object-cover"
                            />
                            <span className="absolute bottom-1 left-1 bg-[#2C2C2C]/80 text-white text-[9px] px-1 py-0.5 rounded backdrop-blur-xs font-medium">
                              ชิ้นงานที่ {i + 1}
                            </span>
                          </div>
                        ))}
                      </div>
                    );
                  })()}

                  <div className="whitespace-pre-wrap font-sans">{msg.content}</div>

                  {!isUser && (
                    <div className="mt-2 pt-2 border-t border-[#E9E3D5]/80 flex items-center justify-between text-[10px] text-[#888877]">
                      <span>{new Date(msg.timestamp).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}</span>
                      <button
                        type="button"
                        onClick={() => handleSpeak(msg.id, msg.content)}
                        className="inline-flex items-center gap-1 text-[#737365] hover:text-[#5A5A40] font-medium"
                      >
                        {speakingMessageId === msg.id ? (
                          <>
                            <VolumeX className="w-3 h-3 text-[#D9A066]" />
                            <span>หยุดเสียง</span>
                          </>
                        ) : (
                          <>
                            <Volume2 className="w-3 h-3" />
                            <span>อ่านออกเสียง</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>

                {isUser && (
                  <div className="w-7 h-7 rounded-full bg-[#E9E3D5] flex items-center justify-center text-[#5A5A40] flex-shrink-0 text-xs mt-0.5">
                    <User className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>
            );
          })
        )}

        {isLoading && (
          <div className="flex gap-2.5 items-center text-[#737365] text-xs pl-2">
            <div className="w-7 h-7 rounded-full bg-[#5A5A40] flex items-center justify-center text-white animate-spin">
              <Loader2 className="w-3.5 h-3.5" />
            </div>
            <span className="text-[#737365] italic">ครูกำลังคิดคำตอบให้คุณอย่างตั้งใจ...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Questions */}
      <div className="p-2.5 bg-[#FAF7F2] border-t border-[#E9E3D5] overflow-x-auto flex gap-1.5 text-[11px] scrollbar-none">
        <div className="flex items-center gap-1 text-[#737365] flex-shrink-0 pl-1">
          <Lightbulb className="w-3 h-3 text-[#D9A066]" />
          <span className="font-semibold text-[10px] uppercase tracking-wider">คำถามชวนรู้:</span>
        </div>
        {currentQuickQuestions.map((q, idx) => (
          <button
            key={idx}
            type="button"
            disabled={isLoading}
            onClick={() => handleQuickQuestion(q)}
            className="flex-shrink-0 bg-[#FFF] border border-[#E9E3D5] hover:border-[#5A5A40]/40 text-[#2C2C2C] hover:text-[#5A5A40] px-3 py-1 rounded-full transition-colors truncate max-w-xs shadow-2xs"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Input Box */}
      <form onSubmit={handleSubmit} className="p-3 bg-[#FFF] border-t border-[#E9E3D5] flex items-center gap-2">
        <input
          id="input-chat-mentor"
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="พิมพ์คำถามหรือปรึกษาครูสีน้ำ..."
          disabled={isLoading}
          className="flex-1 text-xs bg-[#FAF7F2] border border-[#E9E3D5] rounded-xl px-3.5 py-2.5 text-[#2C2C2C] placeholder-[#888877] focus:outline-none focus:ring-1 focus:ring-[#5A5A40] focus:border-[#5A5A40] disabled:opacity-60"
        />

        <button
          id="btn-send-chat-mentor"
          type="submit"
          disabled={!inputText.trim() || isLoading}
          className="p-2.5 rounded-xl bg-[#5A5A40] hover:bg-[#464632] text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-2xs"
        >
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </button>
      </form>
    </div>
  );
};

