import { useState, useRef } from 'react';
import { Send, User, Bot, LogOut, Menu, Mic, MicOff, Loader2, VolumeX } from 'lucide-react';
import ChatMessage from './components/ChatMessage';
import removeMarkdown from 'remove-markdown';
import Uvardilla from './assets/Uvardilla';

const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;

function App() {
  const baseUrl = 'http://localhost:8000/'
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "¡Hola! ¿En qué puedo ayudarte hoy?",
      sender: 'assistant',
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [isMicOn, setIsMicOn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const handleSend = async (text = inputText, isAudioQuery = false) => {
    if (text.trim()) {
      if (isSpeaking) {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
      }
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          text: text,
          sender: 'user',
          timestamp: new Date(),
        },
      ]);

      setInputText('');
      setIsLoading(true);

      try {
        const response = await fetch(baseUrl+'assistant/ask/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ question: text }),
        });
        const data = await response.json();
        if (response.ok) {
          console.log("respuesta del servidor: ",data.answer)
          const answerText = data.answer || 'Lo siento, no tengo una respuesta para eso.';
          setMessages((prev) => [
            ...prev,
            {
              id: Date.now(),
              text: answerText,
              documents: data.documents,
              sender: 'assistant',
              timestamp: new Date(),
            },
          ]);
          if (isAudioQuery) {
            console.log("is audio query")
            const plainText = removeMarkdown(answerText);
            console.log("plaintext: ", plainText)
            const utterance = new SpeechSynthesisUtterance(plainText);
            utterance.lang = 'es-ES';
            utterance.onstart = () => setIsSpeaking(true);
            utterance.onend = () => setIsSpeaking(false);
            window.speechSynthesis.speak(utterance);
          }

        } else {
          console.error('Error en la respuesta del servidor:', data);
        }
      } catch (error) {
        console.error('Error al hacer la solicitud a la API:', error);
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now(),
            text: 'Hubo un error al obtener la respuesta. Por favor, intenta nuevamente.',
            sender: 'assistant',
            timestamp: new Date(),
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const toggleMic = () => {
    if (!isMicOn) {
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then((stream) => {
          console.log('Micrófono activado:', stream);
          const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
          mediaRecorderRef.current = recorder;

          recorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
              audioChunksRef.current.push(event.data);
              console.log('Fragmento de audio capturado:', event.data);
            } else {
              console.error('No se capturaron datos en este fragmento.');
            }
          };

          recorder.start();
        })
        .catch((error) => {
          console.error('Error al acceder al micrófono:', error);
        });
    } else {
      const recorder = mediaRecorderRef.current;
      if (recorder) {
        recorder.stop();
        recorder.onstop = () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm;codecs=opus' });
          console.log('AudioBlob generado:', audioBlob);

          if (audioBlob.size > 0) {
            transcribeAudio(audioBlob);
          } else {
            console.error('El audioBlob está vacío.');
          }

          audioChunksRef.current = [];
        };
      }
    }
    setIsMicOn(!isMicOn);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const transcribeAudio = async (audioBlob) => {
    const reader = new FileReader();
    reader.onload = async () => {
      const audioContent = reader.result.split(',')[1];
      const requestBody = {
        config: { languageCode: 'es-ES' },
        audio: { content: audioContent },
      };

      try {
        const response = await fetch(
          `https://speech.googleapis.com/v1/speech:recognize?key=${GOOGLE_API_KEY}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody),
          }
        );

        const data = await response.json();
        if (data.results && data.results.length > 0) {
          const transcript = data.results[0].alternatives[0].transcript;
          handleSend(transcript, true);
        } else {
          alert('No transcription results.');
        }
      } catch (error) {
        console.error('Error transcribing audio:', error);
      }
    };

    reader.readAsDataURL(audioBlob);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm fixed top-0 w-full z-10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
          <Uvardilla className="w-8 h-8 text-red-600 scale-[1.2]" />
          <h1 className="text-xl font-semibold text-gray-800">Profesor Vardilla</h1>
          </div>

          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <Menu className="w-6 h-6 text-red-600" />
            </button>

            {menuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-1 border border-gray-100">
                <div className="px-4 py-2 border-b border-gray-100">
                  <div className="flex items-center space-x-2">
                    <User className="w-5 h-5 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">John Doe</span>
                  </div>
                </div>
                <button className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50 flex items-center space-x-2">
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Chat Container */}
      <div className="max-w-4xl mx-auto pt-16 pb-24 px-4">
        <div className="space-y-4 py-4">
          {messages.map((message) => (
            <ChatMessage key={message.id} message={message} pdfBaseUrl={baseUrl+'static/'}/>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="flex items-center space-x-2">
                <Loader2 className="w-5 h-5 animate-spin text-gray-600" />
                <span className="text-sm text-gray-600">Profevardilla está pensando...</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Input Area */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-end space-x-2">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Escribe un mensaje..."
              className="flex-1 resize-none rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100 min-h-[52px] max-h-32"
              rows={1}
            />
            <button
              onClick={() => handleSend()}
              disabled={!inputText.trim()}
              className="mb-1 p-3 rounded-xl bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send className="w-5 h-5" />
            </button>            
            <button
              onClick={toggleMic}
              className="mb-1 p-3 rounded-xl bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isMicOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
            </button>
            <button
            onClick={() => {
              window.speechSynthesis.cancel();
              setIsSpeaking(false);
            }}
            disabled={!isSpeaking}
            className="mb-1 p-3 rounded-xl bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <VolumeX className="w-5 h-5" />
          </button>            
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;