import React, { useEffect, useState } from 'react';
import { FaChevronDown, FaDownload } from 'react-icons/fa';
import { getEvaluationResults } from '../services/database';
import { useAuth } from '../context/AuthContext';

export default function EvaluationResults() {
  const [evaluations, setEvaluations] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const [openAccordions, setOpenAccordions] = useState({});

  useEffect(() => {
    const loadResults = async () => {
      if (user) {
        try {
          const response = await getEvaluationResults(user.$id);
          const parsedData = response.documents.map(doc => ({
            id: doc.$id,
            title: doc.name,
            date: new Date(doc.$updatedAt).toLocaleDateString('es-ES', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            }),
            results: JSON.parse(doc.results || '{}')
          }));

          setEvaluations(parsedData);
          
          // Inicializar el primer acordeón abierto
          const initialOpenState = parsedData.reduce((acc, curr, index) => ({
            ...acc,
            [curr.id]: index === 0 // Primer elemento abierto
          }), {});
          
          setOpenAccordions(initialOpenState);
        } catch (error) {
          console.error("Error cargando evaluaciones:", error);
        } finally {
          setLoading(false);
        }
      }
    };

    loadResults();
  }, [user]);

  const toggleAccordion = (id) => {
    setOpenAccordions(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const calculatePercentage = (results) => {
    if (!results || !Array.isArray(results)) return { percentage: 0, correct: 0, total: 0 };
    
    const correct = results.filter(r => r).length;
    const total = results.length || 1;
    return {
      percentage: Math.round((correct / total) * 100),
      correct,
      total
    };
  };

  const handleDownload = (e, evaluationTitle) => {
    e.stopPropagation();
    alert('Descargando resultados de: ' + evaluationTitle);
  };

  if (loading) {
    return <div className="p-6 text-center text-gray-600">Cargando evaluaciones...</div>;
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">Mis Evaluaciones</h2>
        
        <div className="space-y-8">
          {evaluations.map((evaluation, index) => (
            <div key={evaluation.id} className="relative pl-8 pb-8">
              <div className="absolute left-0 top-0 h-full w-0.5 bg-gray-200"></div>
              <div className="absolute left-0 top-2 w-4 h-4 -ml-2 rounded-full bg-primary-500"></div>
              
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <button
                  onClick={() => toggleAccordion(evaluation.id)}
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <div>
                    <h3 className="text-xl font-semibold text-gray-800">{evaluation.title}</h3>
                    <p className="text-sm text-gray-500">{evaluation.date}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={(e) => handleDownload(e, evaluation.title)}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary-50 text-primary-600 hover:bg-primary-100 transition-colors"
                    >
                      <FaDownload className="w-4 h-4" />
                      <span className="text-sm">Descargar</span>
                    </button>
                    <FaChevronDown 
                      className={`w-5 h-5 text-gray-500 transition-transform ${
                        openAccordions[evaluation.id] ? 'rotate-180' : ''
                      }`}
                    />
                  </div>
                </button>
                
                {openAccordions[evaluation.id] && (
                  <div className="px-6 pb-6 space-y-4">
                    {Object.entries(evaluation.results || {}).map(([indicatorId, indicatorData]) => {
                      const resultsArray = indicatorData.map(item => item.passStatus);
                      const stats = calculatePercentage(resultsArray);
                      
                      return (
                        <div key={indicatorId} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                          <div className="flex-shrink-0 w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center">
                            <span className="text-xl font-bold text-primary-600">{stats.percentage}%</span>
                          </div>
                          <div className="flex-grow">
                            <div className="flex items-center justify-between">
                              <span className="font-medium text-gray-700">{indicatorId}</span>
                              <span className="text-sm text-gray-500">{stats.correct}/{stats.total}</span>
                            </div>
                            <p className="text-sm text-gray-600">{indicatorData[0]?.indicator || 'Indicador'}</p>
                            <div className="flex gap-1 mt-2">
                              {resultsArray.map((result, idx) => (
                                <span
                                  key={idx}
                                  className={`h-1 flex-1 rounded-full ${
                                    result ? 'bg-green-500' : 'bg-red-500'
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}