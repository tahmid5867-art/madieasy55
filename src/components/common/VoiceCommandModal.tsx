import React, { useState, useEffect } from 'react';
import { usePharmacy } from '../../context/PharmacyContext';
import { Mic, MicOff, Volume2, X, Check, ArrowRight } from 'lucide-react';

interface VoiceCommandModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const VoiceCommandModal: React.FC<VoiceCommandModalProps> = ({ isOpen, onClose }) => {
  const { language, setLanguage, setActiveView } = usePharmacy();
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [recognitionSupported, setRecognitionSupported] = useState(true);

  const isBn = language === 'bn';

  useEffect(() => {
    if (!isOpen) {
      setIsListening(false);
      setTranscript('');
      setFeedback(null);
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setRecognitionSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = isBn ? 'bn-BD' : 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
      setFeedback(null);
    };

    recognition.onresult = (event: any) => {
      const current = event.resultIndex;
      const text = event.results[current][0].transcript;
      setTranscript(text);

      if (event.results[current].isFinal) {
        processCommand(text.toLowerCase());
      }
    };

    recognition.onerror = (e: any) => {
      console.warn('Speech Recognition error:', e.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    try {
      recognition.start();
    } catch (e) {
      console.warn('Recognition start failed:', e);
    }

    return () => {
      try {
        recognition.stop();
      } catch (e) {}
    };
  }, [isOpen, isBn]);

  const processCommand = (cmd: string) => {
    if (cmd.includes('বিক্রি') || cmd.includes('ড্যাশবোর্ড') || cmd.includes('today sales') || cmd.includes('dashboard')) {
      setFeedback(isBn ? 'ড্যাশবোর্ডে যাওয়া হচ্ছে...' : 'Navigating to Dashboard...');
      setTimeout(() => {
        setActiveView('dashboard');
        onClose();
      }, 700);
      return;
    }

    if (cmd.includes('পিওএস') || cmd.includes('ক্যাশ মেমো') || cmd.includes('pos') || cmd.includes('checkout') || cmd.includes('point of sale')) {
      setFeedback(isBn ? 'পয়েন্ট অব সেল (পিওএস) খোলা হচ্ছে...' : 'Opening Point of Sale...');
      setTimeout(() => {
        setActiveView('pos');
        onClose();
      }, 700);
      return;
    }

    if (cmd.includes('ওষুধ') || cmd.includes('মেডিসিন') || cmd.includes('medicine') || cmd.includes('catalog')) {
      setFeedback(isBn ? 'ওষুধের তালিকা খোলা হচ্ছে...' : 'Opening Medicines...');
      setTimeout(() => {
        setActiveView('medicines');
        onClose();
      }, 700);
      return;
    }

    if (cmd.includes('স্টক') || cmd.includes('মজুদ') || cmd.includes('ব্যাচ') || cmd.includes('inventory') || cmd.includes('stock')) {
      setFeedback(isBn ? 'ইনভেন্টরি ও ব্যাচ খোলা হচ্ছে...' : 'Opening Inventory & Batches...');
      setTimeout(() => {
        setActiveView('inventory');
        onClose();
      }, 700);
      return;
    }

    if (cmd.includes('ক্রয়') || cmd.includes('চালান') || cmd.includes('purchase')) {
      setFeedback(isBn ? 'ক্রয় চালান খোলা হচ্ছে...' : 'Opening Purchases...');
      setTimeout(() => {
        setActiveView('purchases');
        onClose();
      }, 700);
      return;
    }

    if (cmd.includes('বকেয়া') || cmd.includes('হিসাব') || cmd.includes('due') || cmd.includes('accounts')) {
      setFeedback(isBn ? 'হিসাব ও বকেয়া খোলা হচ্ছে...' : 'Opening Accounts & Dues...');
      setTimeout(() => {
        setActiveView('accounts');
        onClose();
      }, 700);
      return;
    }

    if (cmd.includes('রিপোর্ট') || cmd.includes('লাভ') || cmd.includes('report') || cmd.includes('profit')) {
      setFeedback(isBn ? 'রিপোর্ট ও অ্যানালিটিক্স খোলা হচ্ছে...' : 'Opening Reports...');
      setTimeout(() => {
        setActiveView('reports');
        onClose();
      }, 700);
      return;
    }

    if (cmd.includes('এআই') || cmd.includes('অ্যাসিস্ট্যান্ট') || cmd.includes('ai') || cmd.includes('assistant')) {
      setFeedback(isBn ? 'এআই বিজনেস অ্যাসিস্ট্যান্ট খোলা হচ্ছে...' : 'Opening AI Assistant...');
      setTimeout(() => {
        setActiveView('aiAssistant');
        onClose();
      }, 700);
      return;
    }

    if (cmd.includes('বাংলা') || cmd.includes('bangla')) {
      setLanguage('bn');
      setFeedback('ভাষা বাংলায় পরিবর্তন করা হয়েছে');
      setTimeout(onClose, 800);
      return;
    }

    if (cmd.includes('ইংরেজি') || cmd.includes('english')) {
      setLanguage('en');
      setFeedback('Language switched to English');
      setTimeout(onClose, 800);
      return;
    }

    setFeedback(isBn ? 'কমান্ড বুঝতে পারিনি, নিচের তালিকা থেকে চেষ্টা করুন।' : 'Command not recognized. Try the quick buttons below.');
  };

  const handleManualTrigger = (cmd: string) => {
    setTranscript(cmd);
    processCommand(cmd.toLowerCase());
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-xs">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden p-6 text-center">
        <button onClick={onClose} className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-600 rounded-lg">
          <X className="w-5 h-5" />
        </button>

        <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4 relative">
          <Mic className={`w-8 h-8 text-emerald-600 ${isListening ? 'animate-pulse' : ''}`} />
          {isListening && (
            <span className="absolute inset-0 rounded-full border-2 border-emerald-500 animate-ping opacity-30"></span>
          )}
        </div>

        <h3 className="font-bold text-lg text-gray-900">
          {isBn ? 'ভয়েস কমান্ড সহকারী' : 'Voice Command Assistant'}
        </h3>
        <p className="text-xs text-gray-500 mt-1">
          {isListening
            ? isBn
              ? 'কথা বলুন... শুনছি...'
              : 'Listening... speak clearly...'
            : isBn
            ? 'মাইক্রোফোনে কথা বলুন'
            : 'Speak into your microphone'}
        </p>

        {/* Live speech preview */}
        <div className="my-5 p-3.5 bg-gray-50 border border-gray-200 rounded-xl min-h-[60px] flex items-center justify-center">
          {transcript ? (
            <p className="text-sm font-semibold text-emerald-900 italic">"{transcript}"</p>
          ) : (
            <p className="text-xs text-gray-400">
              {recognitionSupported
                ? isBn
                  ? 'যেমন: "আজকের বিক্রি দেখাও", "পিওএস খোলো"'
                  : 'e.g. "Show today sales", "Open POS"'
                : isBn
                ? 'ব্রাউজারে ভয়েস সাপোর্ট নেই, নিচের বোতাম চাপুন'
                : 'Speech not supported on this browser; click options below'}
            </p>
          )}
        </div>

        {feedback && (
          <div className="mb-4 py-1.5 px-3 bg-emerald-50 text-emerald-800 text-xs font-semibold rounded-lg">
            {feedback}
          </div>
        )}

        {/* Quick Command Suggestions */}
        <div className="space-y-2 text-left">
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider text-center">
            {isBn ? 'সরাসরি ক্লিক করে কমান্ড দিন' : 'Quick Command Shortcuts'}
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleManualTrigger(isBn ? 'আজকের বিক্রি দেখাও' : 'Show today sales')}
              className="p-2 text-xs font-medium text-left bg-emerald-50 hover:bg-emerald-100 text-emerald-900 rounded-lg flex items-center justify-between"
            >
              <span>{isBn ? 'আজকের বিক্রি' : "Today's Sales"}</span>
              <ArrowRight className="w-3.5 h-3.5 text-emerald-600" />
            </button>
            <button
              onClick={() => handleManualTrigger(isBn ? 'পিওএস খোলো' : 'Open POS')}
              className="p-2 text-xs font-medium text-left bg-emerald-50 hover:bg-emerald-100 text-emerald-900 rounded-lg flex items-center justify-between"
            >
              <span>{isBn ? 'পিওএস কাউন্টার' : 'POS Checkout'}</span>
              <ArrowRight className="w-3.5 h-3.5 text-emerald-600" />
            </button>
            <button
              onClick={() => handleManualTrigger(isBn ? 'স্বল্প স্টক দেখাও' : 'Show low stock')}
              className="p-2 text-xs font-medium text-left bg-emerald-50 hover:bg-emerald-100 text-emerald-900 rounded-lg flex items-center justify-between"
            >
              <span>{isBn ? 'স্বল্প স্টক' : 'Low Stock'}</span>
              <ArrowRight className="w-3.5 h-3.5 text-emerald-600" />
            </button>
            <button
              onClick={() => handleManualTrigger(isBn ? 'এআই অ্যাসিস্ট্যান্ট' : 'AI Assistant')}
              className="p-2 text-xs font-medium text-left bg-emerald-50 hover:bg-emerald-100 text-emerald-900 rounded-lg flex items-center justify-between"
            >
              <span>{isBn ? 'এআই অ্যাসিস্ট্যান্ট' : 'AI Assistant'}</span>
              <ArrowRight className="w-3.5 h-3.5 text-emerald-600" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
