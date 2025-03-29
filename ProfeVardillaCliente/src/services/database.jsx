import { databases } from "./appwrite"; 
import { ID, Query } from "appwrite";

const DB_ID = '67e1d3e400085306d448';
const COLLECTION_CHATHISTORY_ID = '67e8102600088792014f';
const COLLECTION_EVALUATIONRESULTS_ID = '67e81030002f0f0ade8a';
const COLLECTION_CHATEVALUATION_ID = '67e8120f001825966f68';


const saveEvaluationResults = async (userId, results, name) => {
    try {
        const response = await databases.createDocument(
            DB_ID,
            COLLECTION_EVALUATIONRESULTS_ID,
            ID.unique(), 
            {
                evaluationDate: new Date().toISOString(),
                userId,
                name,
                results: JSON.stringify(results)
            }
        );

        console.log('Evaluacion guardada exitosamente:', {
            id: response.$id,
            response
        });

    } catch (error) {
        console.error('Error al guardar los resultados:', {
            error: error.message,
            type: error.type, 
            code: error.code, 
            data: error.response?.data 
        });
    }
};

const createChatHistory = async (
  userId, 
  mode, 
  name, 
  initialMessage,
  selectedIndicatorDetails = null, 
  questionsPerIndicator = null
) => {
  try {
    let evaluationId = null;

    if (mode === 'practice') {
      const evaluationResponse = await databases.createDocument(
        DB_ID,
        COLLECTION_CHATEVALUATION_ID,
        ID.unique(),
        {
          selectedIndicatorDetails: JSON.stringify(selectedIndicatorDetails),
          questionsPerIndicator, 
        }
      );
      evaluationId = evaluationResponse.$id;
    }

    const chatData = {
      userId,
      mode,
      name,
      history: JSON.stringify(initialMessage),
      ...(evaluationId && { chatEvaluation: evaluationId })
    };

    const historyResponse = await databases.createDocument(
      DB_ID,
      COLLECTION_CHATHISTORY_ID,
      ID.unique(),
      chatData
    );

    console.log('Chat creado:', {
      historyId: historyResponse.$id,
      evaluationId: evaluationId || 'N/A'
    });

    return {
      chatId: historyResponse.$id,
      evaluationId: evaluationId
    };

  } catch (error) {
    console.error('Error en createChatHistory:', {
      step: 'createChatHistory',
      error: error.message,
      metadata: {
        mode,
        hasEvaluation: !!evaluationId,
        userId
      }
    });
  }
};


  const updateChatHistory = async (documentId, newHistory) => {
    try {
      const response = await databases.updateDocument(
        DB_ID,
        COLLECTION_CHATHISTORY_ID,
        documentId,
        {
          history: JSON.stringify(newHistory), 
        }
      );
  
      console.log('Historial actualizado:', documentId, response);
      return response;
  
    } catch (error) {
      console.error('Error actualizando historial:', {
        documentId,
        error: error.message,
        status: error.code
      });
    }
  };

  const updateChatEvaluationResults = async (documentId, newEvaluationResults) => {
    try {
      const response = await databases.updateDocument(
        DB_ID,
        COLLECTION_CHATEVALUATION_ID,
        documentId,
        {
          evaluationResults: JSON.stringify(newEvaluationResults), 
        }
      );
  
      console.log('evaluationResults de chatevaluation actualizado:', documentId, response);
      return response;
  
    } catch (error) {
      console.error('Error actualizando evaluationResults de chatevaluation:', {
        documentId,
        newEvaluationResults,
        error: error.message,
        status: error.code
      });
    }
  };  

  const updateChatQueue = async (documentId, questionsQueue) => {
    try {
      const response = await databases.updateDocument(
        DB_ID,
        COLLECTION_CHATEVALUATION_ID,
        documentId,
        {
          questionsQueue: JSON.stringify(questionsQueue),
        }
      );
      console.log('Cola de evaluación actualizada:', documentId, response);
      return response
  
    } catch (error) {
      console.error('Error actualizando cola de evaluación:', {
        documentId,
        questionsQueue: JSON.stringify(questionsQueue),
        error: error.message,
        status: error.code
      });
    }
  };  

  const updateChatCurrentQuestion = async (documentId, currentQuestion) => {
    try {
      const response = await databases.updateDocument(
        DB_ID,
        COLLECTION_CHATEVALUATION_ID,
        documentId,
        {
          currentQuestion: JSON.stringify(currentQuestion),
        }
      );
      console.log('CurrentQuestion actualizada', documentId, response);
      return response
  
    } catch (error) {
      console.error('Error actualizando CurrentQuestion:', {
        documentId,
        currentQuestion,
        error: error.message,
        status: error.code
      });
    }
  };   

  const updateChatHasResults = async (documentId, hasResults) => {
    try {
      const response = await databases.updateDocument(
        DB_ID,
        COLLECTION_CHATEVALUATION_ID,
        documentId,
        {
          hasResults: hasResults, 
        }
      );
  
      console.log('Estado de resultados actualizado:', documentId, hasResults, response);
      return response;
  
    } catch (error) {
      console.error('Error actualizando estado de resultados:', {
        documentId,
        error: error.message,
        status: error.code
      });
    }
  };  

  const getHistoryList = async (userId) => {
    return await databases.listDocuments(
      DB_ID,
      COLLECTION_CHATHISTORY_ID,
      [
        Query.equal('userId', userId),
        Query.select(['$id', 'name', 'mode','$updatedAt']),
      ]
    );
  };  

  const getHistoryDetails = async (documentId) => {
    const doc = await databases.getDocument(
      DB_ID,
      COLLECTION_CHATHISTORY_ID,
      documentId
    ); 

    const safeParse = (str) => {
      if (!str) return null;
      try {
        return JSON.parse(str);
      } catch {
        return null;
      }
    };

    return {
      ...doc,
      history: safeParse(doc.history),
      currentQuestion: safeParse(doc.currentQuestion), 
      selectedIndicatorDetails: safeParse(doc.selectedIndicatorDetails),
      questionsQueue: safeParse(doc.questionsQueue),
      evaluationResults: safeParse(doc.evaluationResults)      
    };
  };  
  
  

export { saveEvaluationResults, createChatHistory, updateChatHistory, getHistoryList, getHistoryDetails, updateChatQueue, updateChatHasResults, updateChatCurrentQuestion, updateChatEvaluationResults };