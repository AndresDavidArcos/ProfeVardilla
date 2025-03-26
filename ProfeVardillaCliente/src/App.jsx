import { useState, useRef, useEffect} from 'react';
import { Send, LogOut, Mic, MicOff, Loader2, VolumeX } from 'lucide-react';
import ChatMessage from './components/ChatMessage';
import removeMarkdown from 'remove-markdown';
import Uvardilla from './assets/Uvardilla';
import LearningIndicators from './components/LearningIndicators';
import { indicators } from './constants/indicators';
import Sidebar from './components/Sidebar';
import { FaBars, FaTimes } from 'react-icons/fa';
import { FcGoogle } from 'react-icons/fc';
import { loginWithGoogle, logoutUser, getUser } from './services/auth'
import { saveEvaluationResults, createChatHistory, updateChatHistory } from './services/database';
import { fakerES as faker } from '@faker-js/faker';


const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;

function App() {
  const baseUrl = 'http://localhost:8000/'  

  const handleOptionSelect = async (option) => {
    setMessages(prev => [...prev, { text: option.text, sender: 'user', timestamp: new Date(), id: Date.now() }]);
    const chatId = await createChatHistory(option.value, `${faker.animal.type()} ${faker.word.adjective()}`);
    console.log("created history with id: ", chatId);
    setCurrentChatId(chatId);
    if (option.value === 'practice') {
      setShowLearningIndicators(true);
      setMessages(prev => [...prev, {
        text: "¡Muy bien! Selecciona los indicadores de logros en los que quieres ser evaluado.",
        sender: 'assistant',
        timestamp: new Date(), id: Date.now(),
        showIndicators: true
      }]);
    } else {
      setMessages(prev => [...prev, {
        text: "Entiendo que tienes dudas. ¿Sobre qué tema te gustaría aprender más?",
        sender: 'assistant',
        timestamp: new Date(), id: Date.now()
      }]);
    }
    setSelectedPath(option.value);
  };

  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "¡Hola! ¿Listo para practicar? ¿Quieres demostrar tus conocimientos o tienes dudas sobre algún tema?",
      sender: 'assistant',
      options: [
        { text: "Demostrar conocimientos", value: "practice" },
        { text: "Tengo dudas", value: "doubts" }
      ],  
      onOptionSelect: handleOptionSelect,
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [showLearningIndicators, setShowLearningIndicators] = useState(false);
  const [selectedPath, setSelectedPath] = useState(null);
  const [questionsPerIndicator, setQuestionsPerIndicator] = useState(3);  
  const [evaluationQueue, setEvaluationQueue] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [evaluationResults, setEvaluationResults] = useState({});  
  const [isMicOn, setIsMicOn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [chatFilter, setChatFilter] = useState('all');
  const [evaluationEnded, setEvaluationEnded] = useState(false);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  useEffect(() => {
    if (evaluationQueue && !evaluationEnded) {
      processNextQuestion();
    }

  }, [evaluationQueue]);

  useEffect(() => {
    const checkUser = async () => {
      try {
        const userData = await getUser();
        setUser(userData);
      } catch (error) {
        setUser(null);
      } finally {
        setAuthLoading(false);
      }
    };
  
    checkUser();
  }, []);

  useEffect(() => {
    if (currentChatId && messages.length > 0) {
      updateChatHistory(currentChatId, messages)
    }
  }, [messages]);

  const handleLogin = async () => {
    loginWithGoogle();
    const userData = await getUser();
    setUser(userData);
  }

  const handleLogout = async () => {
    await logoutUser();
    setUser(null);
    setIsMenuOpen(false);
  };  

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

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
        if (selectedPath === 'doubts') {
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
          }else {
            console.error('Error en la respuesta del servidor:', data);
          }
        }else if(selectedPath === 'practice'){
          if (currentQuestion) {
            const response = await fetch(baseUrl + 'assistant/answer/', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                question: currentQuestion.questionText,
                answer: text,
              }),
            });
            const data = await response.json();
            setEvaluationResults((prev) => ({
              ...prev,
              [currentQuestion.indicatorId]: [
                ...(prev[currentQuestion.indicatorId] || []),
                {
                  passStatus: data.passStatus,
                  question: currentQuestion.questionText,
                  answer: text,
                  correction: data.correction,
                },
              ],
            }));

            setMessages((prev) => [
              ...prev,
              {
                id: Date.now(),
                text: data.correction, 
                evaluation: {
                  passStatus: data.passStatus,
                  question: currentQuestion.questionText
                },
                sender: 'assistant',
                timestamp: new Date(),
                documents: data.documents,
              },
            ]);
                     
            setEvaluationQueue((prev) => prev.slice(1));

          }else{
            console.log("modo practica sin preguntas activas")
          }
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

  const handleStartEvaluation = async (selectedIndicators) => {
    setShowLearningIndicators(false);
    setMessages(prev => prev.filter(msg => !msg.showIndicators));

    const selectedIndicatorDetails = selectedIndicators.reduce((acc, id) => {
      for (const category of Object.values(indicators)) {
        if (category.items[id]) {
          acc[id] = category.items[id];
          break;
        }
      }
      return acc;
    }, {});

    const indicatorsList = Object.entries(selectedIndicatorDetails)
      .map(([id, indicator]) => `\n• **${id}**: ${indicator}.`)
      .join('\n');

    const totalQuestions = selectedIndicators.length * questionsPerIndicator;    
    setMessages(prev => [...prev, {
      text: `**Has seleccionado los siguientes indicadores de logro:**\n${indicatorsList}\n\nTendrás ${totalQuestions} preguntas (${questionsPerIndicator} por cada indicador). ¡Buena suerte!`,
      sender: 'assistant',
      id: Date.now(),
      timestamp: new Date(),
    }]);

    
    const queue = [];
    for (const [id, indicator] of Object.entries(selectedIndicatorDetails)) {
      try {
        const response = await fetch(baseUrl + 'assistant/question/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            indicator,
            questionsPerIndicator 
          }),
        });
  
        const data = await response.json();
        console.log("questions generated for ", indicator, "\n\n\n",data)
  
        if (response.ok && data.questions) {
          data.questions.forEach((question, questionNumber) => {
            queue.push({
              indicatorId: id,
              indicator,
              questionText: question,
              questionNumber: questionNumber+1
            });
          });
        } else {
          console.error('Error al obtener preguntas para el indicador:', id, data);
        }
      } catch (error) {
        console.error('Error al hacer la solicitud a la API:', error);
      }
    }
    console.log("questions queue: ", queue)
    setEvaluationResults({});
    setEvaluationQueue(queue);
  };

  const processNextQuestion = async () => {
    console.log("proceesnextquestion", evaluationQueue)

    if (evaluationQueue.length === 0) {
      let totalCorrect = 0;
      let totalIncorrect = 0;
      let resultsMarkdown = "¡Evaluación completada! Aquí están tus resultados:\n\n";
    
      resultsMarkdown += Object.entries(evaluationResults)
        .map(([indicatorId, questions]) => {
          const correct = questions.filter(q => q.passStatus).length;
          const incorrect = questions.length - correct;
          
          totalCorrect += correct;
          totalIncorrect += incorrect;
    
          return `**Indicador ${indicatorId}:** ${correct}/${correct+incorrect}\n`;
          })
          .join('\n');
    
      resultsMarkdown +=  `\n## Resultado Final\n🎯 Total Correctas: ${totalCorrect}
      \n⚠️ Total Incorrectas: ${totalIncorrect}  
      \n📊 Porcentaje: ${Math.round((totalCorrect / (totalCorrect + totalIncorrect)) * 100)}%  
      🔢 ${totalCorrect}/${totalCorrect + totalIncorrect} preguntas correctas`;
    
      setMessages((prev) => [
        ...prev,
        {
          text: resultsMarkdown,
          sender: 'assistant',
          id: Date.now(),
          timestamp: new Date(),
        },
      ]);

      saveEvaluationResults(evaluationResults, faker.animal.type()+faker.word.adjective())
      setEvaluationEnded(true);
      return;
    }
  
    const nextQuestion = evaluationQueue[0];
    console.log("current question", nextQuestion)
    setMessages((prev) => [
      ...prev,
      {
        text: nextQuestion.questionText,
        sender: 'assistant',
        evaluation: {
          isQuestion: true,
          questionNumber: nextQuestion.questionNumber,
          indicatorId: nextQuestion.indicatorId,
          indivatorValue:  nextQuestion.indivator,
        },
        id: Date.now(),
        timestamp: new Date(),
        currentQuestion: nextQuestion,
      },
    ]);
  
    setCurrentQuestion(nextQuestion);
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
    <div className="min-h-screen bg-gray-50 relative">
      {/* Sidebar Toggle Button */}
      <button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="fixed top-4 left-4 z-30 p-2 rounded-lg bg-white shadow-md hover:bg-gray-50 transition-colors"
      >
        {isSidebarOpen ? <FaTimes /> : <FaBars />}
      </button>      
      {/* <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        chatFilter={chatFilter}
        setChatFilter={setChatFilter}
      />       */}
      {/* Header */}
      <header className="bg-white shadow-sm fixed top-0 w-full z-10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
          <Uvardilla className="w-8 h-8 text-red-600 scale-[1.2]" />
          <h1 className="text-xl font-semibold text-gray-800">Profesor Vardilla</h1>
          </div>

          <div className="relative">
          {authLoading ? (
            <div className="flex items-center gap-2">
              {/* Skeleton para el botón de login */}
              <div className="h-[42px] w-[178px] bg-gray-200 rounded-md animate-pulse" />
            </div>
          ) : !user ? (
            // Botón de login cuando no hay usuario
            <button
              onClick={handleLogin}
              className="w-full flex items-center justify-center gap-2 bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-md"
            >
              <FcGoogle className="h-5 w-5 bg-white rounded-full" />
              <span>Iniciar sesión</span>
            </button>
          ) : (
            // Perfil de usuario cuando está autenticado
            <div className="relative">
              <div
                onClick={toggleMenu}
                className="flex items-center gap-2 cursor-pointer p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <img
                  src={user.prefs?.photoURL || `https://ui-avatars.com/api/?name=${user.name}&background=ff0000&color=fff`}
                  alt="Perfil de usuario"
                  className="w-8 h-8 rounded-full"
                />
                <span className="font-medium">{user.name}</span>
              </div>

              {/* Menú desplegable */}
              {isMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
                  <button
                    onClick={handleLogout}
                    className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <LogOut className="w-4 h-4 mr-2 text-red-600" />
                    <span>Cerrar sesión</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
        </div>
      </header>

      {/* Chat Container */}
      <div className="max-w-4xl mx-auto pt-16 pb-24 px-4">
        <div className="space-y-4 py-4">
          {messages.map((message, index) => (
            <div key={index}>
              <ChatMessage key={message.id} message={message} pdfBaseUrl={baseUrl+'static/'}/>
              {message.showIndicators && showLearningIndicators && (
                <div className="mt-4">
                  <LearningIndicators
                    onStartEvaluation={handleStartEvaluation}
                    questionsPerIndicator={questionsPerIndicator}
                    setQuestionsPerIndicator={setQuestionsPerIndicator}
                  />
                </div>
              )}
           </div>
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