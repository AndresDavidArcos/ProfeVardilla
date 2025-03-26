import { databases } from "./appwrite"; 
import { getUser } from "./auth";
import { ID } from "appwrite";

const DB_ID = '67e1d3e400085306d448';
const COLLECTION_CHATHISTORY_ID = '67e3749f0028276debf7';
const COLLECTION_EVALUATIONRESULTS_ID = '67e1e105003763c479e2';

const saveEvaluationResults = async (results, name) => {
    try {
        const userData = await getUser();        
        const response = await databases.createDocument(
            DB_ID,
            COLLECTION_EVALUATIONRESULTS_ID,
            ID.unique(), 
            {
                evaluationDate: new Date().toISOString(),
                userId: userData.$id,
                name,
                results: JSON.stringify(results)
            }
        );

        console.log('Evaluacion guardada exitosamente:', {
            id: response.$id,
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

const createChatHistory = async (mode, name) => {
    try {
      const userData = await getUser();
      
      const response = await databases.createDocument(
        DB_ID,
        COLLECTION_CHATHISTORY_ID,
        ID.unique(),
        {
          userId: userData.$id,
          mode,
          name,
          history: "",
          updatedAt: new Date().toISOString()
        }
      );
  
      console.log('Historial creado:', response.$id);
      return response.$id;
  
    } catch (error) {
      console.error('Error creando historial:', {
        error: error.message,
        code: error.code,
        type: error.type
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
          updatedAt: new Date().toISOString()
        }
      );
  
      console.log('Historial actualizado:', documentId);
      return response;
  
    } catch (error) {
      console.error('Error actualizando historial:', {
        documentId,
        error: error.message,
        status: error.code
      });
    }
  };

  const getHistoryList = async (userId) => {
    return await databases.listDocuments(
      'DB_ID',
      COLLECTION_CHATHISTORY_ID,
      [
        Query.equal('userId', userId),
        Query.select(['$id', 'name', 'updatedAt']),
      ]
    );
  };  

  const getHistoryDetails = async (documentId) => {
    const doc = await databases.getDocument(
      'DB_ID',
      'COLLECTION_ID',
      documentId
    ); 
    return {
      ...doc,
      history: JSON.parse(doc.history)
    };
  };  
  
  

export { saveEvaluationResults, createChatHistory, updateChatHistory, getHistoryList };