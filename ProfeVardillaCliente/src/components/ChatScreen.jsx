import { useState, useRef, useEffect} from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Send, Mic, MicOff, Loader2, VolumeX } from 'lucide-react';
import ChatMessage from './ChatMessage';
import removeMarkdown from 'remove-markdown';
import LearningIndicators from './LearningIndicators';
import { indicators } from '../constants/indicators';
import { saveEvaluationResults, createChatHistory, updateChatHistory, getHistoryDetails, updateChatQueue, updateChatHasResults, updateChatCurrentQuestion, updateChatEvaluationResults } from '../services/database';
import { fakerES as faker } from '@faker-js/faker';
import { useAuth } from '../context/AuthContext';

export default function ChatScreen() {
  const baseUrl = import.meta.env.VITE_API_BASE_URL;
  const { user } = useAuth();
  const { chatId } = useParams();
  const navigate = useNavigate();

  const handleOptionSelect = async (option) => {
    const currentUser = userRef.current; 
    setMessages(prev => [...prev, { text: option.text, sender: 'user', timestamp: new Date(), id: Date.now() }]);    
    if (option.value === 'practice') {
      setShowLearningIndicators(true);
      setMessages(prev => [...prev, {
        text: "¡Muy bien! Selecciona los indicadores de logros en los que quieres ser evaluado.",
        sender: 'assistant',
        timestamp: new Date(), id: Date.now(),
        showIndicators: true
      }]);
    } else {
      const initialMessage = [{
        text: "Entiendo que tienes dudas. ¿Sobre qué tema te gustaría aprender más?",
        sender: 'assistant',
        timestamp: new Date(), id: Date.now()
      }] 
      console.log("user: ", currentUser)
      const newChatId = await createChatHistory(currentUser.uid, option.value, `${faker.word.adjective()} ${faker.animal.type()}`, initialMessage);
      navigate(`/chat/${newChatId}`);         
    }
  };
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isLoadingChat, setIsLoadingChat] = useState(true);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);  
  const [showLearningIndicators, setShowLearningIndicators] = useState(false);
  const [hasResults, setHasResults] = useState(false);
  const [selectedPath, setSelectedPath] = useState(null);
  const [questionsPerIndicator, setQuestionsPerIndicator] = useState(3);  
  const [evaluationQueue, setEvaluationQueue] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [evaluationResults, setEvaluationResults] = useState({});  
  const [isMicOn, setIsMicOn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentChatId, setCurrentChatId] = useState(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const userRef = useRef(user);
  const evaluationId  = useRef(null);
  const chatName = useRef(null);
  const initialMessagesRef = useRef([]);
  const lastMessageRef = useRef(null);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  useEffect(() => {
    const loadChat = async () => {
      try {
        setInitialLoadComplete(false); 
        evaluationId.current = null;
        setEvaluationQueue(null);
        setCurrentQuestion(null);
        setEvaluationResults({});
        setHasResults(false);         
        console.log("cargando chat...")
        if (chatId) {
          console.log("ChatId identificado ", chatId)
          const chatHistory = await getHistoryDetails(chatId);
          initialMessagesRef.current = chatHistory.history;          
          console.log("chatHistoryDetails: ", chatHistory)
          setCurrentChatId(chatId);
          chatName.current = chatHistory.name;
          setMessages(chatHistory.history);
          setSelectedPath(chatHistory.mode);
           if (chatHistory.mode === 'practice') {
            evaluationId.current = chatHistory.evaluationId;
            console.log("practice sethasresults: ", chatHistory.hasResults)
            setHasResults(chatHistory.hasResults);
            setEvaluationResults(chatHistory.evaluationResults || {});            
            if (!chatHistory.questionsQueue) {
              const generatedQueue = await generateEvaluationQueue(
                chatHistory.selectedIndicatorDetails,
                chatHistory.questionsPerIndicator
              );

              console.log("generated queue: ", generatedQueue)
              
              await updateChatQueue(evaluationId.current, generatedQueue);
              setEvaluationQueue(generatedQueue);
            } else {
              setCurrentQuestion(chatHistory.currentQuestion);
              setEvaluationQueue(chatHistory.questionsQueue);
            }
          }          
        } else {
          setCurrentChatId(null);
          setSelectedPath(null);
          console.log("welcome: ", user)

          if(!user){
            setMessages([{
              id: 1,
              text: "¡Bienvenido a ProfeVardilla!\nAquí podrás resolver tus dudas y poner a prueba tus conocimientos. Para continuar, por favor inicia sesión.",
              sender: 'assistant',
              timestamp: new Date(),
            }]);            
          }else{
            setMessages([{
              id: 1,
              text: "¡Hola! ¿Listo para practicar? ¿Quieres poner a prueba tus conocimientos o tienes dudas sobre algún tema?",
              sender: 'assistant',
              options: [
                { text: "Demostrar conocimientos", value: "practice" },
                { text: "Tengo dudas", value: "doubts" }
              ],  
              onOptionSelect: handleOptionSelect,
              timestamp: new Date(),
            }]);
          }     

        }
      } catch (error) {
        console.error('Error loading chat history:', error);
        navigate('/');
      } finally {
        setIsLoadingChat(false);
        setInitialLoadComplete(true);
      }
    };
  
    loadChat();
  }, [chatId, user]);

  useEffect(() => {
    console.log("entra al efecto del evaluationqueue")
    const handleEvaluationQueue = async () => {
    if (selectedPath === 'practice' && evaluationQueue && !hasResults && initialLoadComplete && !currentQuestion) {
      console.log("el efecto de evaluationqueue cumple las condiciones")
      await updateChatQueue(evaluationId.current, evaluationQueue)
      console.log("actualiza la queue en la db y pasa a la next question")
      processNextQuestion();
    }
    }
    
    handleEvaluationQueue();
  }, [evaluationQueue]);  

  useEffect(() => {
    const saveMessagesToDb = async () => {
      console.log("entra al use effect y la conidtion da: ", (currentChatId && messages.length > 0 && JSON.stringify(messages) !== JSON.stringify(initialMessagesRef.current)),
      `\n\n con los messages: ${messages}`)
      if (currentChatId && messages.length > 0 && JSON.stringify(messages) !== JSON.stringify(initialMessagesRef.current)) {
        const res = await updateChatHistory(currentChatId, messages)
        console.log("actualizacion en la db del historial desde el use effect con: ", res)
      }

      if (lastMessageRef.current) {
        lastMessageRef.current.scrollIntoView({ behavior: 'smooth' });
      }

    }
    saveMessagesToDb();
  }, [messages]);

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
            const updatedResults = {
              ...evaluationResults,
              [currentQuestion.indicatorId]: [
                ...(evaluationResults[currentQuestion.indicatorId] || []),
                {
                  passStatus: data.passStatus,
                  question: currentQuestion.questionText,
                  answer: text,
                  correction: data.correction,
                }
              ]
            };            
            setEvaluationResults(updatedResults);          
            await updateChatEvaluationResults(evaluationId.current, updatedResults);

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
            console.log("se setea una nueva queue: ", evaluationQueue.slice(1));
            setEvaluationQueue((prev) => prev.slice(1));
            setCurrentQuestion(null);
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

  const generateEvaluationQueue = async (selectedIndicatorDetails, questionsNumber) => {
    const queue = [];
    for (const [id, indicator] of Object.entries(selectedIndicatorDetails)) {
      try {
        const response = await fetch(baseUrl + 'assistant/question/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            indicator,
            questionsPerIndicator: questionsNumber,           
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
    return queue;   
  }

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

    const initialMessage = [{
      text: `**Has seleccionado los siguientes indicadores de logro:**\n${indicatorsList}\n\nTendrás ${totalQuestions} preguntas (${questionsPerIndicator} por cada indicador). ¡Buena suerte!`,
      sender: 'assistant',
      id: Date.now(), 
      timestamp: new Date(),
    }]

    const newChatId = await createChatHistory(user.uid, 'practice', `${faker.word.adjective()} ${faker.animal.type()}`, initialMessage, selectedIndicatorDetails, questionsPerIndicator);
    navigate(`/chat/${newChatId}`);     
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

      saveEvaluationResults(user.uid, evaluationResults, chatName.current);
      updateChatHasResults(evaluationId.current, true);
      setHasResults(true);
      return;
    }
  
    const nextQuestion = evaluationQueue[0];
    console.log("mensaje pregutna enviado al chat con",       {
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
    })
    await updateChatCurrentQuestion(evaluationId.current, nextQuestion);
    setCurrentQuestion(nextQuestion);

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
      },
    ]);
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
          baseUrl+"audio/transcribe/",
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody),
          }
        );

        const data = await response.json();
        if (data.transcript) {
          handleSend(data.transcript, true);
        } else {
          console.error('No transcription results.');
        }
      } catch (error) {
        console.error('Error transcribing audio:', error);
      }
    };

    reader.readAsDataURL(audioBlob);
  };

  return (
    <>
    {/* Chat Container */}
      <div className="max-w-4xl mx-auto pt-16 pb-24 px-4">
        <div className="space-y-4 py-4">
          {messages.map((message, index) => {
            const isLastMessage = index === messages.length - 1;

            return (
              <div key={index} ref={isLastMessage ? lastMessageRef : null}>
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
            )
          })}

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
              onPaste={(e) => {
                e.preventDefault();                
                const pastedText = e.clipboardData.getData('text').trimEnd();                
                setInputText(inputText + pastedText);
              }}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Escribe un mensaje..."
              className={`flex-1 resize-none rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100 min-h-[52px] max-h-32 ${
                (!currentChatId || hasResults) ? 'cursor-not-allowed' : ''
              }`}
              rows={1}
              disabled={!currentChatId || hasResults}
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
              disabled={!currentChatId || hasResults}
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
    </>
  );
}