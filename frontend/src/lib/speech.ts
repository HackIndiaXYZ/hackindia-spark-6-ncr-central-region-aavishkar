export type SpeechState = {
  supported: boolean;
  listening: boolean;
  interim: string;
  final: string;
  error?: string;
};

type SpeechRecognitionCtor = new () => SpeechRecognition;

export function getSpeechRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function startSpeechRecognition(opts: {
  lang: string;
  onInterim: (text: string) => void;
  onFinal: (text: string) => void;
  onError: (err: string) => void;
  onEnd: () => void;
}) {
  const Ctor = getSpeechRecognitionCtor();
  if (!Ctor) return null;

  const recognition = new Ctor();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = opts.lang;

  recognition.onresult = (event: SpeechRecognitionEvent) => {
    let interim = "";
    let finalText = "";
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const res = event.results[i];
      const text = (res[0]?.transcript || "").trim();
      if (!text) continue;
      if (res.isFinal) finalText += (finalText ? " " : "") + text;
      else interim += (interim ? " " : "") + text;
    }
    if (interim) opts.onInterim(interim);
    if (finalText) opts.onFinal(finalText);
  };

  recognition.onerror = (e: SpeechRecognitionErrorEvent) => {
    opts.onError(e.error ? String(e.error) : "speech_error");
  };

  recognition.onend = () => {
    opts.onEnd();
  };

  recognition.start();
  return recognition;
}

